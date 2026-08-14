import { getCloudflareEnv } from '../../system-db'
import { getConnection, saveConnection } from '../connections'
import { CalendarError, type CalendarAdapter, type UnifiedMeeting } from '../types'

/**
 * Calendly adapter (API v2).
 *
 * IMPORTANT — Calendly is NOT a calendar, architecturally. Google/Outlook
 * let us create an arbitrary event; Calendly's model is inverted: the
 * advisor publishes a scheduling page and INVITEES book slots on it. The
 * public API exposes scheduled events (bookings) for reading and a
 * cancellation endpoint, but no "create an arbitrary meeting" call.
 *
 * So `capabilities.createEvent` is false and `createEvent` is intentionally
 * not implemented — the UI reads capabilities and offers the advisor's
 * scheduling link instead of a create form. No invented endpoints.
 */

const AUTH_URL = 'https://auth.calendly.com/oauth/authorize'
const TOKEN_URL = 'https://auth.calendly.com/oauth/token'
const API_BASE = 'https://api.calendly.com'

async function credentials() {
  const env = await getCloudflareEnv()
  const clientId = env?.CALENDLY_CLIENT_ID || process.env.CALENDLY_CLIENT_ID
  const clientSecret = env?.CALENDLY_CLIENT_SECRET || process.env.CALENDLY_CLIENT_SECRET
  return { clientId: clientId ? String(clientId) : '', clientSecret: clientSecret ? String(clientSecret) : '' }
}

export async function buildCalendlyAuthUrl(redirectUri: string, state: string): Promise<string> {
  const { clientId } = await credentials()
  if (!clientId) throw new CalendarError('NOT_CONFIGURED', 'Calendly OAuth client is not configured.', 'calendly')
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', state })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCalendlyCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = await credentials()
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  if (!response.ok) throw new CalendarError('OAUTH_FAILED', 'Calendly token exchange failed.', 'calendly')
  return await response.json() as { access_token: string; refresh_token?: string; expires_in: number; owner?: string }
}

async function accessToken(userEmail: string): Promise<string> {
  const connection = await getConnection(userEmail, 'calendly')
  if (!connection) throw new CalendarError('NOT_CONNECTED', 'Calendly is not connected.', 'calendly')

  const expired = Boolean(connection.expires_at && new Date(connection.expires_at).getTime() <= Date.now() + 60_000)
  if (!expired) return connection.access_token
  if (!connection.refresh_token) throw new CalendarError('TOKEN_EXPIRED', 'Calendly token expired.', 'calendly')

  const { clientId, clientSecret } = await credentials()
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: connection.refresh_token, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' }),
  })
  if (!response.ok) throw new CalendarError('PERMISSION_REVOKED', 'Calendly refresh failed.', 'calendly')
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
  await saveConnection({
    userEmail,
    provider: 'calendly',
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? connection.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    accountLabel: connection.account_label,
    scope: connection.scope,
  })
  return data.access_token
}

type CalendlyEvent = {
  uri: string
  name?: string
  start_time: string
  end_time: string
  location?: { type?: string; location?: string; join_url?: string }
  event_memberships?: Array<{ user_email?: string; user_name?: string }>
  invitees_counter?: { active: number }
  status?: string
}

async function calendlyUserUri(token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
  if (response.status === 401) throw new CalendarError('TOKEN_EXPIRED', 'Calendly rejected the token.', 'calendly')
  if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Calendly returned ${response.status}.`, 'calendly')
  const data = await response.json() as { resource?: { uri?: string } }
  const uri = data.resource?.uri
  if (!uri) throw new CalendarError('PROVIDER_UNAVAILABLE', 'Calendly did not return a user URI.', 'calendly')
  return uri
}

/** Invitee names/emails live on a separate endpoint, fetched per booking. */
async function fetchInvitees(token: string, eventUri: string) {
  const uuid = eventUri.split('/').pop()
  if (!uuid) return []
  const response = await fetch(`${API_BASE}/scheduled_events/${uuid}/invitees`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) return []
  const data = await response.json() as { collection?: Array<{ name?: string; email?: string; status?: string }> }
  return (data.collection || []).map(invitee => ({
    name: invitee.name,
    email: invitee.email,
    responseStatus: invitee.status === 'active' ? 'accepted' as const : 'unknown' as const,
    organizer: false,
  }))
}

export const calendlyAdapter: CalendarAdapter = {
  id: 'calendly',
  name: 'Calendly',
  // createEvent deliberately false — see the file header. Calendly bookings
  // are created by invitees on the scheduling page, not by this API.
  capabilities: { listEvents: true, createEvent: false, updateEvent: false, cancelEvent: true, availability: true },

  isConfigured: async () => {
    const { clientId, clientSecret } = await credentials()
    return Boolean(clientId && clientSecret)
  },

  isConnected: async (userEmail) => Boolean(await getConnection(userEmail, 'calendly')),

  listUpcoming: async (userEmail, options) => {
    const token = await accessToken(userEmail)
    const userUri = await calendlyUserUri(token)
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: options?.fromIso || new Date().toISOString(),
      status: 'active',
      count: String(Math.min(options?.limit || 25, 100)),
      sort: 'start_time:asc',
    })
    const response = await fetch(`${API_BASE}/scheduled_events?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    if (response.status === 401) throw new CalendarError('TOKEN_EXPIRED', 'Calendly rejected the token.', 'calendly')
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Calendly returned ${response.status}.`, 'calendly')
    const data = await response.json() as { collection?: CalendlyEvent[] }
    const now = new Date().toISOString()

    return await Promise.all((data.collection || []).map(async event => ({
      id: '',
      userEmail,
      source: 'calendly' as const,
      externalEventId: event.uri,
      title: event.name || 'פגישה מ-Calendly',
      startsAt: event.start_time,
      endsAt: event.end_time,
      location: event.location?.location,
      meetingUrl: event.location?.join_url,
      participants: await fetchInvitees(token, event.uri),
      notes: undefined,
      status: 'scheduled' as const,
      createdAt: now,
      updatedAt: now,
    })) satisfies Array<Promise<UnifiedMeeting>>)
  },

  cancelEvent: async (userEmail, externalEventId) => {
    const token = await accessToken(userEmail)
    const uuid = externalEventId.split('/').pop()
    const response = await fetch(`${API_BASE}/scheduled_events/${uuid}/cancellation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'בוטל דרך Smart Meeting' }),
    })
    if (response.status === 404) throw new CalendarError('EVENT_NOT_FOUND', 'Booking already removed.', 'calendly')
    if (!response.ok) throw new CalendarError('PROVIDER_UNAVAILABLE', `Calendly cancel failed (${response.status}).`, 'calendly')
  },
}
