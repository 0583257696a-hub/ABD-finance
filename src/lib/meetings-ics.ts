/**
 * ICS (RFC 5545) calendar-invite generation for meeting scheduling.
 * A universal .ics attachment works with Google Calendar, Outlook, and Apple
 * Calendar alike — the provider-agnostic path per the integration vision:
 * the client adds the event on THEIR platform, no vendor OAuth lock-in on
 * our side. Deeper two-way sync (Google/Outlook/Calendly APIs) can layer on
 * top later without changing this contract.
 */

export type IcsEventInput = {
  uid: string
  title: string
  description: string
  location: string
  startsAt: Date
  endsAt: Date
  organizerName: string
  organizerEmail: string
  attendeeName: string
  attendeeEmail: string
}

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Folds lines at 75 octets per RFC 5545 §3.1 (continuation lines start with a space). */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = ' ' + rest.slice(75)
  }
  parts.push(rest)
  return parts.join('\r\n')
}

export function buildIcsInvite(input: IcsEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ABD Finance//Smart Meeting//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${icsEscape(input.uid)}@abd-finance.co.il`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(input.startsAt)}`,
    `DTEND:${icsDate(input.endsAt)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `DESCRIPTION:${icsEscape(input.description)}`,
    input.location ? `LOCATION:${icsEscape(input.location)}` : '',
    `ORGANIZER;CN=${icsEscape(input.organizerName)}:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${icsEscape(input.attendeeName)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(input.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.map(foldLine).join('\r\n') + '\r\n'
}

export function icsToBase64(ics: string): string {
  return Buffer.from(ics, 'utf8').toString('base64')
}
