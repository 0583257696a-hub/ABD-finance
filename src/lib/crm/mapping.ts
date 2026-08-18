import type { MeetingSummaryData } from '@/types/summary'
import { clientNameFromSummary, filledEditedSections, filledFacts } from '../meeting-summary-doc'
import { formatDate } from '../format-date'
import type { CrmContactInput, CrmSyncSettings } from './types'

/**
 * Pure mappers: our meeting/summary shapes → CRM inputs. No I/O. Kept apart
 * from sync.ts so they can be unit-tested and reused (e.g. a "preview what
 * will be sent" screen).
 */

const FACT_LABEL_ID = /תעודת זהות|ת\.?ז/
const FACT_LABEL_PHONE = /טלפון|נייד/
const FACT_LABEL_EMAIL = /אימייל|דוא"ל|מייל/

function factValue(doc: MeetingSummaryData | null | undefined, matcher: RegExp): string {
  const fact = (doc?.facts || []).find(item => matcher.test(String(item?.label || '')) && String(item?.value || '').trim())
  return fact ? String(fact.value).trim() : ''
}

export function contactFromMeeting(input: {
  clientName?: string | null
  clientEmail?: string | null
  clientPhone?: string | null
  summary?: MeetingSummaryData | null
  settings: CrmSyncSettings
}): CrmContactInput | null {
  const fullName = (input.clientName || clientNameFromSummary(input.summary) || '').trim()
  const email = (input.clientEmail || factValue(input.summary, FACT_LABEL_EMAIL) || '').trim()
  const phone = (input.clientPhone || factValue(input.summary, FACT_LABEL_PHONE) || '').trim()
  const idNumber = input.settings.sendIdNumber ? factValue(input.summary, FACT_LABEL_ID) : ''
  if (!fullName && !email && !phone && !idNumber) return null
  return { fullName: fullName || email || phone, email: email || undefined, phone: phone || undefined, idNumber: idNumber || undefined }
}

/** Full plain-text rendering of the summary for a CRM note/activity. */
export function summaryToCrmNote(doc: MeetingSummaryData, options: { title?: string; endedAt?: string | null; includeFacts: boolean; advisorName?: string }): { title: string; body: string } {
  const lines: string[] = []
  const when = options.endedAt ? formatDate(options.endedAt) : ''
  const title = `${options.title || 'סיכום פגישה'}${when ? ` · ${when}` : ''}`
  if (doc.clientLine?.trim()) lines.push(doc.clientLine.trim())
  if (options.advisorName) lines.push(`יועץ: ${options.advisorName}`)
  if (doc.introText?.trim()) lines.push('', doc.introText.trim())

  if (options.includeFacts) {
    const facts = filledFacts(doc)
    if (facts.length) {
      lines.push('', 'תמצית נתונים:')
      facts.forEach(fact => lines.push(`- ${fact.label}: ${fact.value}`))
    }
  }
  const recommendations = (doc.recommendations || []).map(item => item?.text?.trim()).filter(Boolean) as string[]
  if (recommendations.length) {
    lines.push('', 'המלצות:')
    recommendations.forEach((text, index) => lines.push(`${index + 1}. ${text}`))
  }
  const followUps = (doc.manualFollowUps || []).map(item => item?.text?.trim()).filter(Boolean) as string[]
  if (followUps.length) {
    lines.push('', 'המשך טיפול:')
    followUps.forEach(text => lines.push(`- ${text}`))
  }
  for (const [heading, text] of filledEditedSections(doc)) lines.push('', `${heading}:`, text.trim())
  lines.push('', 'נוצר אוטומטית מ"פגישה חכמה" (ABD Finance). המידע נועד לסייע בארגון וסיכום מידע בלבד ואינו מהווה ייעוץ.')
  // The transcript is INTERNAL and deliberately never mapped.
  return { title, body: lines.join('\n') }
}

export function followUpToCrmTask(input: { text: string; owner?: 'advisor' | 'client' | null; dueDate?: string | null; clientName?: string | null }): { title: string; body: string; dueAt: string | null; owner: 'advisor' | 'client' } {
  const owner = input.owner === 'client' ? 'client' : 'advisor'
  const prefix = input.clientName ? `${input.clientName} — ` : ''
  return {
    title: `${prefix}${input.text}`.slice(0, 250),
    body: `${owner === 'client' ? 'באחריות הלקוח' : 'באחריות היועץ'}. נוצר מ"פגישה חכמה".`,
    dueAt: input.dueDate ? new Date(`${input.dueDate}T09:00:00`).toISOString() : null,
    owner,
  }
}
