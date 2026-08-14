import { getCloudflareEnv } from '../../system-db'
import { getConnection, saveConnection } from '../connections'
import { CalendarError, type CalendarAdapter, type CreateEventInput, type UnifiedMeeting } from '../types'

/**
 * Microsoft Outlook adapter (Microsoft Graph).
 * Activates once MICROSOFT_CLIENT_ID/SECRET exist and the user consents.
 * Uses the `common` tenant so both work and personal accounts can connect.
 */

const TENANT = 'common'
const AUTH_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`
const GRAPH = 'https://graph.microsoft.com/v1.0'

/** Minimum scopes: read+write own calendar; offline_access for refresh tokens. */
export const OUTLOOK_SCOPES = ['offline_access', 'Calendars.ReadWrite']

async function credentials() {
  const env = await getCloudflareEnv()
  const clientId = env?.MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID
  const clientSecret = env?.MICROSOFT_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET
  return { clientId: clientId ? String(clientId) : '', clientSecret: clientSecret ? String(clientSecret) : '' }
}

export async function buildOutlookAuthUrl(redirectUri: string, state: string): Promise<string> {
  const { clientId } = await credentials()
  if (!clientId) throw new CalendarError('NOT_CONFIGURED', 'Microsoft OAuth client is not configured.', 'microsoft_outlook')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'query',
    scope: OUTLOOK_SCOPES.join(' '),
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeOutlookCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = await credentials()
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  if (!response.ok) throw new CalendarError('OAUTH_FAILED', 'Microsoft token exchange failed.', 'microsoft_outlook')
  return await response.json() as { access_token: string; refresh_token?: string; expires_in: number; scope?: string }
}

async function accessToken(userEmail: string): Promise<string> {
  const connection = await getConnection(userEmail, 'microsoft_outlook')
  if (!connection) throw new CalendarError('NOT_CONNECTED', 'Outlook is not connected.', 'microsoft_outlook')

  const expired = Boolean(connection.expires_at && new Date(connection.expires_at).getTime() <= Date.now() + 60_000)
  if (!expired) return connection.access_token
  if (!connection.refresh_token) throw new CalendarError('TOKEN_EXPIRED', 'Outlook token expired.', 'microsoft_outlook')

  const { clientId, clientSecret } = await credentials()
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: connection.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      scope: OUTLOOK_SCOPES.join(' '),
    }),
  })
  if (!response.ok) throw new CalendarError('PERMISSION_REVOKED', 'Outlook refresh failed.', 'microsoft_outlook')
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
  await saveConnection({
    userEmail,
    provider: 'microsoft_outlook',
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? connection.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    accountLabel: connection.account_label,
    scope: connection.scope,
  })
  return data.access_token
}

type GraphEvent = {
  id: string
  subject?: string
  bodyPreview?: string
  location?: { displayName?: string }
  onlineMeeting?: { joinUrl?: string }
  start?: { dateTime?: string; timeZone?: string }
  end?: { dateTime?: string; timeZone?: string }
  attendees?: Array<{ emailAddress?: { address?: string; name?: string }; status?: { response?: string }; type?: string }>
  organizer?: { emailAddress?: { address?: string } }
}

function graphDateToIso(value?: string): string {
  if (!value) return new Date().toISOString()
  // Graph returns naive datetimes with a separate timeZone field; when the
  // request asks for UTC (we do, via the Prefer header) it is already UTC.
  return value.endsWith('Z') ? value : `${value}Z`
}

function mapEvent(event: GraphEvent, userEmail: string): UnifiedMeeting {
  const now = new Date().toISOString()
  const organizerEmail = event.organizer?.emailAddress?.address
  return {
    id: '',
    userEmail,
    source: 'microsoft_outlook',
    externalEventId: event.id,
    title: event.subject || 'פגישה',
    startsAt: graphDateToIso(event.start?.dateTime),
    endsAt: graphDateToIso(event.end?.dateTime),
    location: event.location?.displayName,
    meetingUrl: event.onlineMeeting?.joinUrl,
    participants: (event.attendees || []).map(attendee => ({
      name: attendee.emailAddress?.name,
      email: attendee.emailAddress?.address,
      responseStatus: attendee.status?.response === 'accepted' ? 'accepted'
        : attendee.status?.response === 'declined' ? 'declined'
        : attendee.status?.response === 'tentativelyAccepted' ? 'tentative' : 'unknown',
      organizer: Boolean(organizerEmail && attendee.emailAddress?.address === organizerEmail),
    })),
    notes: event.bodyPreview,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  }
}

export const outlookAdapter: CalendarAdapter = {
  id: 'microsoft_outlook',
  name: 'Microsoft Outlook',
  capabilities: { listEvents: true, createEvent: true, updateEvent: true, cancelEvent: true, availability: true },

  isConfigured: async () => {
    const { clientId, clientSecret } = await credentials()
    return Boolean(clientId && clientSecret)
  },

  isConnected: async (userEmail) => Boolean(await getConnection(userEmail, 'microsoft_outlook')),

  listUpcoming: async (userEmail, options) => {
    const token = await accessToken(userEmail)
    const start = options?.fromIso || new Date().toISOString()
    const end = new Date(new Date(start).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const params = new URLSearchParams({
      startDateTime: start,
      endDateTime: end,
      $orderby: 'start/dateTime',
      $top: String(options?.limit || 25),
    })
    const response = await fetch(`${GRAPH}/me/calendarView?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
    })
    if (response.status === 401) throw new CalendarError('TOKEN_EXPIRED', 'Graph rejected the token.', 'microsoft_outlook')
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Microsoft Graph returned ${response.status}.`, 'microsoft_outlook')
    const data = await response.json() as { value?: GraphEvent[] }
    return (data.value || []).map(event => mapEvent(event, userEmail))
  },

  createEvent: async (userEmail, input: CreateEventInput) => {
    const token = await accessToken(userEmail)
    const response = await fetch(`${GRAPH}/me/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: input.title,
        body: { contentType: 'text', content: input.notes || '' },
        start: { dateTime: input.startsAt, timeZone: 'UTC' },
        end: { dateTime: input.endsAt, timeZone: 'UTC' },
        location: input.location ? { displayName: input.location } : undefined,
        attendees: input.participantEmails.map(email => ({ emailAddress: { address: email }, type: 'required' })),
      }),
    })
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Outlook create failed (${response.status}).`, 'microsoft_outlook')
    return mapEvent(await response.json() as GraphEvent, userEmail)
  },

  cancelEvent: async (userEmail, externalEventId) => {
    const token = await accessToken(userEmail)
    const response = await fetch(`${GRAPH}/me/events/${encodeURIComponent(externalEventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 404) throw new CalendarError('EVENT_NOT_FOUND', 'Event already removed.', 'microsoft_outlook')
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Outlook delete failed (${response.status}).`, 'microsoft_outlook')
  },
}
