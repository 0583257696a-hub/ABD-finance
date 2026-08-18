import type { MeetingFact, MeetingSummaryData } from '@/types/summary'

/**
 * Pure helpers over an archived meeting-summary document (the JSON saved by
 * /api/meetings action=end-session). Shared by the API, the archive list, the
 * archive viewer and the print/PDF page so they all agree on what "has
 * content" and "who is the client" mean.
 */

export function parseSummaryDocument(json: string | null | undefined): MeetingSummaryData | null {
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as MeetingSummaryData
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/**
 * The editable summary carries `clientLine` = "עבור <name>[ ת.ז <id>]".
 * Returns just the name — the id number is deliberately not surfaced.
 * The default placeholder "לקוח" (no client loaded) counts as no name.
 */
export function clientNameFromClientLine(clientLine: unknown): string {
  if (typeof clientLine !== 'string') return ''
  const match = clientLine.match(/^\s*עבור\s+(.+?)(?:\s+ת\.?ז\.?\s.*)?\s*$/)
  const name = match?.[1]?.trim() || ''
  return name === 'לקוח' ? '' : name
}

export function clientNameFromSummary(summary: unknown): string {
  if (!summary || typeof summary !== 'object') return ''
  const doc = summary as MeetingSummaryData
  const fromLine = clientNameFromClientLine(doc.clientLine)
  if (fromLine) return fromLine
  const row = (doc.facts || []).find(fact => fact?.label === 'שם הלקוח')
  return row?.value?.trim() || ''
}

/**
 * Auto facts are generated for every field the workspace knows about, even
 * when the value is blank (no client file loaded yet). A blank fact is noise
 * in a saved document — only rows with a real value are "filled".
 */
export function filledFacts(doc: MeetingSummaryData | null): MeetingFact[] {
  return (doc?.facts || []).filter(fact => String(fact?.value ?? '').trim() && String(fact?.label ?? '').trim())
}

export function filledEditedSections(doc: MeetingSummaryData | null): Array<[string, string]> {
  return Object.entries(doc?.editedSections || {}).filter((entry): entry is [string, string] => Boolean(entry[1] && String(entry[1]).trim()))
}

/**
 * Plain-text version of the summary for WhatsApp (proposal §5). Kept short on
 * purpose — a chat message, not the document: greeting, recommendations,
 * follow-ups, disclaimer. No facts table (id numbers, balances) — those stay
 * in the PDF/email the client asked for. The transcript is never included.
 */
export function summaryToWhatsAppText(doc: MeetingSummaryData, options: { clientName?: string; advisorName?: string; dateLabel?: string } = {}): string {
  const clientName = options.clientName?.trim() || clientNameFromSummary(doc)
  const lines: string[] = []
  lines.push(clientName ? `שלום ${clientName},` : 'שלום,')
  lines.push(`להלן עיקרי סיכום הפגישה שלנו${options.dateLabel ? ` מ-${options.dateLabel}` : ''}:`)
  const recommendations = (doc.recommendations || []).map(item => item?.text?.trim()).filter(Boolean) as string[]
  if (recommendations.length) {
    lines.push('', '*המלצות:*')
    recommendations.forEach((text, index) => lines.push(`${index + 1}. ${text}`))
  }
  const followUps = (doc.manualFollowUps || []).map(item => item?.text?.trim()).filter(Boolean) as string[]
  if (followUps.length) {
    lines.push('', '*המשך טיפול:*')
    followUps.forEach(text => lines.push(`• ${text}`))
  }
  const concerns = doc.editedSections?.['מה הטריד את הלקוח']?.trim()
  if (concerns) lines.push('', '*נושאים שעלו:*', concerns)
  lines.push('', 'הסיכום המלא נשלח/יישלח אליך במסמך נפרד. אשמח לכל שאלה.')
  if (options.advisorName?.trim()) lines.push(options.advisorName.trim())
  lines.push('', '_המידע נועד לסייע בארגון וסיכום מידע בלבד ואינו מהווה ייעוץ פנסיוני, ביטוחי, משפטי, השקעות או מס._')
  return lines.join('\n')
}

export function summaryHasContent(doc: MeetingSummaryData | null): boolean {
  if (!doc) return false
  return Boolean(
    filledFacts(doc).length ||
    doc.recommendations?.some(item => item?.text?.trim()) ||
    doc.manualFollowUps?.some(item => item?.text?.trim()) ||
    filledEditedSections(doc).length ||
    doc.screenshots?.some(item => item?.imageData) ||
    Boolean(doc.transcript?.trim()),
  )
}
