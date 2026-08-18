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
