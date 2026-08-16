import { getCloudflareEnv } from '../../system-db'
import { getConnection, saveConnection } from '../connections'
import { CalendarError, type CalendarAdapter, type CreateEventInput, type UnifiedMeeting } from '../types'

/**
 * Google Calendar adapter (Calendar API v3).
 *
 * Real implementation — it activates the moment GOOGLE_CLIENT_ID/SECRET
 * exist in the environment and the user has completed the OAuth consent.
 * Until then `isConfigured()` reports false and the UI shows a connect
 * prompt instead of an error.
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API_BASE = 'https://www.googleapis.com/calendar/v3'

/**
 * Calendar events + Gmail send. gmail.send lets the app send meeting invites
 * and questionnaires FROM the advisor's real Gmail mailbox (they appear in
 * the advisor's Sent folder). Users who connected before this scope was
 * added must reconnect Google to grant it — sends fall back to the system
 * mailer until they do. Note: gmail.send is a Google "restricted" scope;
 * in Testing mode it works for the app's registered test users, but full
 * public verification requires Google's security assessment.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
]

async function credentials() {
  const env = await getCloudflareEnv()
  const clientId = env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = env?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  return { clientId: clientId ? String(clientId) : '', clientSecret: clientSecret ? String(clientSecret) : '' }
}

export async function buildGoogleAuthUrl(redirectUri: string, state: string): Promise<string> {
  const { clientId } = await credentials()
  if (!clientId) throw new CalendarError('NOT_CONFIGURED', 'Google OAuth client is not configured.', 'google_calendar')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = await credentials()
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  if (!response.ok) throw new CalendarError('OAUTH_FAILED', 'Google token exchange failed.', 'google_calendar')
  return await response.json() as { access_token: string; refresh_token?: string; expires_in: number; scope?: string }
}

/** Returns a valid access token, refreshing it first when expired. Exported for the Gmail-send integration. */
export async function googleAccessToken(userEmail: string): Promise<string> {
  return accessToken(userEmail)
}

async function accessToken(userEmail: string): Promise<string> {
  const connection = await getConnection(userEmail, 'google_calendar')
  if (!connection) throw new CalendarError('NOT_CONNECTED', 'Google Calendar is not connected.', 'google_calendar')

  const expired = Boolean(connection.expires_at && new Date(connection.expires_at).getTime() <= Date.now() + 60_000)
  if (!expired) return connection.access_token
  if (!connection.refresh_token) throw new CalendarError('TOKEN_EXPIRED', 'Google token expired.', 'google_calendar')

  const { clientId, clientSecret } = await credentials()
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: connection.refresh_token, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' }),
  })
  if (!response.ok) throw new CalendarError('PERMISSION_REVOKED', 'Google refresh failed.', 'google_calendar')
  const data = await response.json() as { access_token: string; expires_in: number }
  await saveConnection({
    userEmail,
    provider: 'google_calendar',
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    accountLabel: connection.account_label,
    scope: connection.scope,
  })
  return data.access_token
}

type GoogleEvent = {
  id: string
  summary?: string
  location?: string
  description?: string
  hangoutLink?: string
  conferenceData?: { entryPoints?: Array<{ uri?: string }> }
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string; organizer?: boolean }>
}

function mapEvent(event: GoogleEvent, userEmail: string): UnifiedMeeting {
  const now = new Date().toISOString()
  return {
    id: '',
    userEmail,
    source: 'google_calendar',
    externalEventId: event.id,
    title: event.summary || 'פגישה',
    startsAt: event.start?.dateTime || (event.start?.date ? `${event.start.date}T00:00:00.000Z` : now),
    endsAt: event.end?.dateTime || (event.end?.date ? `${event.end.date}T23:59:59.000Z` : now),
    location: event.location,
    meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.find(entry => entry.uri)?.uri,
    participants: (event.attendees || []).map(attendee => ({
      name: attendee.displayName,
      email: attendee.email,
      responseStatus: attendee.responseStatus === 'accepted' ? 'accepted'
        : attendee.responseStatus === 'declined' ? 'declined'
        : attendee.responseStatus === 'tentative' ? 'tentative' : 'unknown',
      organizer: attendee.organizer,
    })),
    notes: event.description,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  }
}

export const googleCalendarAdapter: CalendarAdapter = {
  id: 'google_calendar',
  name: 'Google Calendar',
  capabilities: { listEvents: true, createEvent: true, updateEvent: true, cancelEvent: true, availability: true },

  isConfigured: async () => {
    const { clientId, clientSecret } = await credentials()
    return Boolean(clientId && clientSecret)
  },

  isConnected: async (userEmail) => Boolean(await getConnection(userEmail, 'google_calendar')),

  listUpcoming: async (userEmail, options) => {
    const token = await accessToken(userEmail)
    const params = new URLSearchParams({
      timeMin: options?.fromIso || new Date().toISOString(),
      maxResults: String(options?.limit || 25),
      singleEvents: 'true',
      orderBy: 'startTime',
    })
    const response = await fetch(`${API_BASE}/calendars/primary/events?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    if (response.status === 401) throw new CalendarError('TOKEN_EXPIRED', 'Google rejected the token.', 'google_calendar')
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Google Calendar returned ${response.status}.`, 'google_calendar')
    const data = await response.json() as { items?: GoogleEvent[] }
    return (data.items || []).map(event => mapEvent(event, userEmail))
  },

  createEvent: async (userEmail, input: CreateEventInput) => {
    const token = await accessToken(userEmail)
    const response = await fetch(`${API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: input.title,
        location: input.location,
        description: input.notes,
        start: { dateTime: input.startsAt },
        end: { dateTime: input.endsAt },
        attendees: input.participantEmails.map(email => ({ email })),
      }),
    })
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Google Calendar create failed (${response.status}).`, 'google_calendar')
    return mapEvent(await response.json() as GoogleEvent, userEmail)
  },

  cancelEvent: async (userEmail, externalEventId) => {
    const token = await accessToken(userEmail)
    const response = await fetch(`${API_BASE}/calendars/primary/events/${encodeURIComponent(externalEventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 404 || response.status === 410) throw new CalendarError('EVENT_NOT_FOUND', 'Event already removed.', 'google_calendar')
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Google Calendar delete failed (${response.status}).`, 'google_calendar')
  },
}
