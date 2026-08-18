/**
 * Unified calendar/meeting domain model.
 *
 * Architectural principle: the calendar is a SOURCE of a meeting — it is not
 * the meeting. Once the advisor presses "start", Smart Meeting owns an
 * independent Meeting Session; the rest of the app never depends on which
 * provider (or none) the meeting originated from.
 *
 * Everything above this layer talks to `CalendarAdapter`, never to Google /
 * Microsoft / Calendly directly.
 */

export type CalendarProviderId = 'google_calendar' | 'microsoft_outlook' | 'calendly'

/** Where a meeting came from. 'spontaneous' = created in-app, no external calendar. */
export type MeetingSource = CalendarProviderId | 'spontaneous'

export type MeetingStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'

export type MeetingParticipant = {
  name?: string
  email?: string
  /** Provider-reported response status when available. */
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'unknown'
  organizer?: boolean
}

/**
 * The single internal meeting shape. Adapters map their provider payloads
 * into this; nothing downstream sees provider-specific fields.
 */
export type UnifiedMeeting = {
  /** Internal Smart Meeting id. Present once the meeting exists in our DB. */
  id: string
  userEmail: string
  source: MeetingSource
  /** Provider's own event id, when the meeting originated externally. */
  externalEventId?: string
  title: string
  startsAt: string
  endsAt: string
  location?: string
  /** Teams / Google Meet / Zoom join link when the provider exposes one. */
  meetingUrl?: string
  participants: MeetingParticipant[]
  notes?: string
  status: MeetingStatus
  createdAt: string
  updatedAt: string
}

/** What an adapter can actually do — the UI reads this instead of hardcoding per-provider assumptions. */
export type CalendarCapabilities = {
  listEvents: boolean
  createEvent: boolean
  updateEvent: boolean
  cancelEvent: boolean
  availability: boolean
}

export type CalendarErrorCode =
  | 'NOT_CONNECTED'
  | 'OAUTH_FAILED'
  | 'TOKEN_EXPIRED'
  | 'PERMISSION_REVOKED'
  | 'PROVIDER_UNAVAILABLE'
  | 'EVENT_NOT_FOUND'
  | 'NOT_SUPPORTED'
  | 'NOT_CONFIGURED'

/**
 * Adapters never throw raw provider errors upward — they return a typed
 * result so the UI can always show a human message plus a concrete action
 * (spec §21: never surface technical errors to the user).
 */
export class CalendarError extends Error {
  code: CalendarErrorCode
  providerId?: CalendarProviderId

  constructor(code: CalendarErrorCode, message: string, providerId?: CalendarProviderId) {
    super(message)
    this.name = 'CalendarError'
    this.code = code
    this.providerId = providerId
  }
}

export type CalendarActionHint = { label: string; action: 'connect' | 'reconnect' | 'retry' | 'none' }

/** Hebrew user-facing message + suggested action for every failure mode. */
export function describeCalendarError(code: CalendarErrorCode, providerName: string): { message: string; hint: CalendarActionHint } {
  switch (code) {
    case 'NOT_CONNECTED':
      return { message: `עדיין לא חיברת את ${providerName}.`, hint: { label: `חבר ${providerName}`, action: 'connect' } }
    case 'OAUTH_FAILED':
      return { message: `החיבור אל ${providerName} לא הושלם.`, hint: { label: 'נסה לחבר שוב', action: 'connect' } }
    case 'TOKEN_EXPIRED':
      return { message: `ההרשאה אל ${providerName} פגה.`, hint: { label: 'התחבר מחדש', action: 'reconnect' } }
    case 'PERMISSION_REVOKED':
      return { message: `ההרשאה אל ${providerName} בוטלה.`, hint: { label: 'התחבר מחדש', action: 'reconnect' } }
    case 'PROVIDER_UNAVAILABLE':
      return { message: `${providerName} אינו זמין כרגע.`, hint: { label: 'נסה שוב', action: 'retry' } }
    case 'EVENT_NOT_FOUND':
      return { message: 'האירוע כבר לא קיים ביומן — ייתכן שנמחק או שונה.', hint: { label: 'רענן', action: 'retry' } }
    case 'NOT_SUPPORTED':
      return { message: `הפעולה אינה נתמכת ב-${providerName}.`, hint: { label: '', action: 'none' } }
    case 'NOT_CONFIGURED':
    default:
      return { message: `${providerName} עדיין לא הוגדר במערכת.`, hint: { label: '', action: 'none' } }
  }
}

export type CreateEventInput = {
  title: string
  startsAt: string
  endsAt: string
  location?: string
  notes?: string
  participantEmails: string[]
  /** Ask the provider to attach its own video meeting (Google Meet / Teams). Adapters that can't just ignore it. */
  createVideoLink?: boolean
}

/**
 * The contract every provider implements. Adapters are the ONLY place that
 * knows a provider exists.
 */
export type CalendarAdapter = {
  id: CalendarProviderId
  name: string
  capabilities: CalendarCapabilities
  /** False when the deployment has no OAuth app configured for this provider at all. */
  isConfigured: () => Promise<boolean>
  /** True when THIS user has an active, non-expired connection. */
  isConnected: (userEmail: string) => Promise<boolean>
  listUpcoming: (userEmail: string, options?: { fromIso?: string; limit?: number }) => Promise<UnifiedMeeting[]>
  createEvent?: (userEmail: string, input: CreateEventInput) => Promise<UnifiedMeeting>
  cancelEvent?: (userEmail: string, externalEventId: string) => Promise<void>
}

export type ProviderStatus = {
  id: CalendarProviderId
  name: string
  configured: boolean
  connected: boolean
  capabilities: CalendarCapabilities
}
