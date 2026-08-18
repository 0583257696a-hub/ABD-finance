import type { MeetingSummaryData } from '@/types/summary'
import { getCloudflareEnv } from '../system-db'
import { findSyncedExternalId, getActiveCrmConnection, markCrmConnectionResult, writeCrmSyncLog } from './connections'
import { contactFromMeeting, followUpToCrmTask, summaryToCrmNote } from './mapping'
import { getCrmAdapter } from './registry'
import { describeCrmError, type CrmConnection, type CrmContactRef } from './types'

/**
 * Sync engine — the only place that combines connection + adapter + mapping.
 * Every push is:
 *   1. best-effort (never blocks or fails the user-facing request),
 *   2. logged (crm_sync_log: ok / error / skipped, with the external id),
 *   3. idempotent per local entity (a summary or follow-up already pushed
 *      successfully is not pushed twice — re-running is safe),
 *   4. governed by the advisor's switches (settings) — a switch that is off
 *      logs "skipped", so the timeline in settings explains what happened.
 */

export type SyncSummaryInput = {
  userEmail: string
  meeting: { id: string; title?: string | null; client_name?: string | null; client_email?: string | null; ended_at?: string | null }
  summaryId: string | null
  summary: MeetingSummaryData
  advisorName?: string | null
  /** true = advisor pressed the button; ignores the autoSync switch. */
  manual?: boolean
}

export type SyncResult = {
  ok: boolean
  provider?: string
  contact?: CrmContactRef | null
  note?: { externalId: string; url?: string } | null
  tasks: number
  skipped: string[]
  errors: string[]
}

/**
 * Cloudflare Workers terminate pending work when the response is sent unless
 * it is registered with ctx.waitUntil. Node dev has no such limit. Either
 * way the caller must not await this.
 */
export async function runInBackground(task: Promise<unknown>): Promise<void> {
  try {
    const mod = await import('@opennextjs/cloudflare')
    const context = await mod.getCloudflareContext({ async: true })
    const ctx = (context as { ctx?: { waitUntil?: (promise: Promise<unknown>) => void } } | null)?.ctx
    if (ctx?.waitUntil) { ctx.waitUntil(task.catch(() => null)); return }
  } catch { /* not on Cloudflare */ }
  void task.catch(() => null)
}

async function ensureContact(connection: CrmConnection, input: SyncSummaryInput, result: SyncResult): Promise<CrmContactRef | null> {
  const adapter = getCrmAdapter(connection.provider)
  const contactInput = contactFromMeeting({ clientName: input.meeting.client_name, clientEmail: input.meeting.client_email, summary: input.summary, settings: connection.settings })
  if (!contactInput) { result.skipped.push('contact: אין פרטי לקוח'); return null }
  if (!connection.settings.syncContacts) {
    // Still try to FIND the contact so notes/tasks attach to it — reading is not writing.
    const found = await adapter.findContact(connection, { email: contactInput.email, phone: contactInput.phone, idNumber: contactInput.idNumber }).catch(() => null)
    result.skipped.push('contact: כבוי בהגדרות')
    return found
  }
  try {
    const ref = await adapter.upsertContact(connection, contactInput)
    await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'contact', localId: input.meeting.id, externalId: ref.externalId, status: 'ok', message: `${ref.created ? 'נוצר' : 'עודכן'}: ${contactInput.fullName}` })
    result.contact = ref
    return ref
  } catch (error) {
    const message = describeCrmError(error)
    result.errors.push(`contact: ${message}`)
    await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'contact', localId: input.meeting.id, status: 'error', message })
    return null
  }
}

/** Push a finished meeting: contact → note → tasks. */
export async function syncMeetingSummaryToCrm(input: SyncSummaryInput): Promise<SyncResult> {
  const result: SyncResult = { ok: false, tasks: 0, skipped: [], errors: [] }
  const connection = await getActiveCrmConnection(input.userEmail)
  if (!connection) { result.skipped.push('אין חיבור CRM'); return result }
  result.provider = connection.provider
  if (!input.manual && !connection.settings.autoSync) { result.skipped.push('סנכרון אוטומטי כבוי'); return result }
  const adapter = getCrmAdapter(connection.provider)

  const contact = await ensureContact(connection, input, result)

  // Note (summary) — idempotent per summary id.
  if (!connection.settings.syncSummaries) {
    result.skipped.push('note: כבוי בהגדרות')
  } else if (input.summaryId && await findSyncedExternalId(input.userEmail, connection.provider, 'note', input.summaryId)) {
    result.skipped.push('note: כבר סונכרן')
  } else {
    try {
      const note = summaryToCrmNote(input.summary, { title: input.meeting.title || 'סיכום פגישה', endedAt: input.meeting.ended_at, includeFacts: connection.settings.includeFacts, advisorName: input.advisorName || undefined })
      const ref = await adapter.createNote(connection, { contact, title: note.title, body: note.body, occurredAt: input.meeting.ended_at || new Date().toISOString(), meetingId: input.meeting.id, summaryId: input.summaryId })
      result.note = ref
      await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'note', localId: input.summaryId || input.meeting.id, externalId: ref.externalId, status: 'ok', message: note.title })
    } catch (error) {
      const message = describeCrmError(error)
      result.errors.push(`note: ${message}`)
      await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'note', localId: input.summaryId || input.meeting.id, status: 'error', message })
    }
  }

  // Tasks — one per follow-up line, idempotent per (summary, index).
  if (!connection.settings.syncTasks) {
    result.skipped.push('tasks: כבוי בהגדרות')
  } else {
    const followUps = (input.summary.manualFollowUps || []).map(item => String(item?.text || '').trim()).filter(Boolean)
    for (const [index, text] of followUps.entries()) {
      const localId = `${input.summaryId || input.meeting.id}:fu:${index}`
      if (await findSyncedExternalId(input.userEmail, connection.provider, 'task', localId)) continue
      try {
        const task = followUpToCrmTask({ text, clientName: input.meeting.client_name })
        const ref = await adapter.createTask(connection, { contact, title: task.title, body: task.body, dueAt: task.dueAt, owner: task.owner, followUpId: localId })
        result.tasks += 1
        await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'task', localId, externalId: ref.externalId, status: 'ok', message: text.slice(0, 120) })
      } catch (error) {
        const message = describeCrmError(error)
        result.errors.push(`task: ${message}`)
        await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'task', localId, status: 'error', message })
      }
    }
  }

  result.ok = result.errors.length === 0
  await markCrmConnectionResult(input.userEmail, connection.provider, { ok: result.ok, error: result.errors[0] || null })
  return result
}

/** Push a single follow-up created by hand (FollowUpsCard / palette). */
export async function syncFollowUpToCrm(input: { userEmail: string; followUpId: string; text: string; owner?: 'advisor' | 'client'; dueDate?: string | null; clientName?: string | null; clientEmail?: string | null }): Promise<void> {
  const connection = await getActiveCrmConnection(input.userEmail)
  if (!connection || !connection.settings.autoSync || !connection.settings.syncTasks) return
  const adapter = getCrmAdapter(connection.provider)
  try {
    const contact = input.clientEmail || input.clientName
      ? await adapter.findContact(connection, { email: input.clientEmail || undefined }).catch(() => null)
      : null
    const task = followUpToCrmTask(input)
    const ref = await adapter.createTask(connection, { contact, title: task.title, body: task.body, dueAt: task.dueAt, owner: task.owner, followUpId: input.followUpId })
    await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'task', localId: input.followUpId, externalId: ref.externalId, status: 'ok', message: input.text.slice(0, 120) })
    await markCrmConnectionResult(input.userEmail, connection.provider, { ok: true })
  } catch (error) {
    const message = describeCrmError(error)
    await writeCrmSyncLog({ userEmail: input.userEmail, provider: connection.provider, entity: 'task', localId: input.followUpId, status: 'error', message })
    await markCrmConnectionResult(input.userEmail, connection.provider, { ok: false, error: message })
  }
}

/** True when the platform can run the sync at all (D1 present). Used by UI hints only. */
export async function crmAvailable(): Promise<boolean> {
  const env = await getCloudflareEnv()
  return Boolean(env)
}
