import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { writeAuditEvent } from '@/lib/system-db'
import { getMeeting, getMeetingSummary } from '@/lib/meetings-db'
import { parseSummaryDocument } from '@/lib/meeting-summary-doc'
import { deleteCrmConnection, getCrmConnection, listCrmSyncLog, saveCrmConnection, updateCrmSettings, writeCrmSyncLog } from '@/lib/crm/connections'
import { getCrmAdapter, getCrmStatuses, isCrmProviderId } from '@/lib/crm/registry'
import { syncMeetingSummaryToCrm } from '@/lib/crm/sync'
import { DEFAULT_CRM_SETTINGS, describeCrmError, type CrmSyncSettings } from '@/lib/crm/types'

/**
 * /api/crm — advisor-facing CRM integration API.
 *   GET                       → provider statuses (no secrets) + recent sync log
 *   POST {action:'connect'}   → save credentials (validated by a live test call first)
 *   POST {action:'test'}      → re-test an existing connection
 *   POST {action:'settings'}  → update sync switches
 *   POST {action:'disconnect'}
 *   POST {action:'sync-summary', summaryId} → push an archived summary now (manual)
 * Credentials arrive from the advisor's own browser over the same-origin
 * session, are encrypted at rest and never returned.
 */

const SETTING_KEYS: Array<keyof CrmSyncSettings> = ['syncContacts', 'syncSummaries', 'syncTasks', 'includeFacts', 'sendIdNumber', 'autoSync']

function pickSettings(input: unknown): Partial<CrmSyncSettings> {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out: Partial<CrmSyncSettings> = {}
  for (const key of SETTING_KEYS) if (typeof record[key] === 'boolean') out[key] = record[key] as boolean
  return out
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [providers, log] = await Promise.all([getCrmStatuses(session.user.email), listCrmSyncLog(session.user.email, 25)])
  return NextResponse.json({ providers, log, defaults: DEFAULT_CRM_SETTINGS })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email
  const body = await request.json().catch(() => ({})) as { action?: string; provider?: string; credentials?: Record<string, unknown>; settings?: unknown; summaryId?: string }

  if (body.action === 'sync-summary') {
    const summaryId = sanitizeText(body.summaryId, 80)
    if (!summaryId) return NextResponse.json({ error: 'missing-summary' }, { status: 400 })
    const record = await getMeetingSummary(userEmail, summaryId)
    if (!record) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    const doc = parseSummaryDocument(record.summary_json)
    if (!doc) return NextResponse.json({ error: 'summary-unreadable' }, { status: 422 })
    const meeting = record.meeting_id ? await getMeeting(userEmail, record.meeting_id) : null
    const result = await syncMeetingSummaryToCrm({
      userEmail,
      meeting: { id: record.meeting_id || record.id, title: record.title, client_name: record.client_name || meeting?.client_name || '', client_email: meeting?.client_email || '', ended_at: record.meeting_ended_at || record.created_at },
      summaryId: record.id,
      summary: doc,
      advisorName: session.user.name || undefined,
      manual: true,
    })
    return NextResponse.json({ ok: result.ok, result })
  }

  if (!isCrmProviderId(body.provider)) return NextResponse.json({ error: 'unknown-provider' }, { status: 400 })
  const provider = body.provider
  const adapter = getCrmAdapter(provider)

  if (body.action === 'connect') {
    const credentials: Record<string, string> = {}
    for (const field of adapter.fields) {
      const raw = body.credentials?.[field.key]
      const value = typeof raw === 'string' ? raw.trim() : ''
      if (field.required && !value) return NextResponse.json({ error: 'missing-field', field: field.key }, { status: 400 })
      if (value) credentials[field.key] = value.slice(0, 2000)
      else if (field.defaultValue) credentials[field.key] = field.defaultValue
    }
    const settings = { ...DEFAULT_CRM_SETTINGS, ...pickSettings(body.settings) }
    const now = new Date().toISOString()
    const probe = { user_email: userEmail, provider, credentials, settings, account_label: '', status: 'active' as const, last_error: null, last_sync_at: null, created_at: now, updated_at: now }
    try {
      const { accountLabel } = await adapter.testConnection(probe)
      await saveCrmConnection({ userEmail, provider, credentials, settings, accountLabel })
      await writeCrmSyncLog({ userEmail, provider, entity: 'test', status: 'ok', message: `חובר: ${accountLabel}` })
      await writeAuditEvent({ actorEmail: userEmail, action: 'crm.connected', targetId: provider, metadata: { accountLabel } })
      return NextResponse.json({ ok: true, accountLabel })
    } catch (error) {
      const message = describeCrmError(error)
      await writeCrmSyncLog({ userEmail, provider, entity: 'test', status: 'error', message })
      return NextResponse.json({ ok: false, error: message }, { status: 422 })
    }
  }

  const connection = await getCrmConnection(userEmail, provider)
  if (!connection) return NextResponse.json({ error: 'not-connected' }, { status: 404 })

  if (body.action === 'test') {
    try {
      const { accountLabel } = await adapter.testConnection(connection)
      await saveCrmConnection({ userEmail, provider, credentials: connection.credentials, accountLabel })
      await writeCrmSyncLog({ userEmail, provider, entity: 'test', status: 'ok', message: `בדיקה תקינה: ${accountLabel}` })
      return NextResponse.json({ ok: true, accountLabel })
    } catch (error) {
      const message = describeCrmError(error)
      await writeCrmSyncLog({ userEmail, provider, entity: 'test', status: 'error', message })
      return NextResponse.json({ ok: false, error: message }, { status: 422 })
    }
  }

  if (body.action === 'settings') {
    const next = await updateCrmSettings(userEmail, provider, pickSettings(body.settings))
    return NextResponse.json({ ok: Boolean(next), settings: next })
  }

  if (body.action === 'disconnect') {
    await deleteCrmConnection(userEmail, provider)
    await writeAuditEvent({ actorEmail: userEmail, action: 'crm.disconnected', targetId: provider })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown-action' }, { status: 400 })
}
