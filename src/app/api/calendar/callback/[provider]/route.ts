import { NextResponse } from 'next/server'
import { exchangeGoogleCode } from '@/lib/calendar/adapters/google'
import { exchangeOutlookCode } from '@/lib/calendar/adapters/outlook'
import { exchangeCalendlyCode } from '@/lib/calendar/adapters/calendly'
import { saveConnection } from '@/lib/calendar/connections'
import { verifyOAuthState } from '@/lib/calendar/oauth-state'
import { getAdapter } from '@/lib/calendar/registry'
import { describeCalendarError, type CalendarProviderId } from '@/lib/calendar/types'
import { writeAuditEvent } from '@/lib/system-db'

/**
 * OAuth callback. Tokens are written straight to server-side storage and
 * never travel to the browser — the user is just redirected back with a
 * success/failure flag.
 */

const PROVIDERS: CalendarProviderId[] = ['google_calendar', 'microsoft_outlook', 'calendly']

function backTo(request: Request, params: Record<string, string>) {
  const url = new URL('/?tab=meetings', request.url)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return NextResponse.redirect(url)
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params
  if (!PROVIDERS.includes(provider as CalendarProviderId)) {
    return NextResponse.json({ error: 'unknown-provider' }, { status: 404 })
  }
  const providerId = provider as CalendarProviderId
  const adapter = getAdapter(providerId)

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (oauthError || !code || !state) {
    // Covers the user pressing "cancel" on the consent screen too.
    const described = describeCalendarError('OAUTH_FAILED', adapter.name)
    return backTo(request, { calendarError: described.message })
  }

  const verified = await verifyOAuthState(state, providerId)
  if (!verified) {
    const described = describeCalendarError('OAUTH_FAILED', adapter.name)
    return backTo(request, { calendarError: described.message })
  }

  const redirectUri = `${url.origin}/api/calendar/callback/${providerId}`

  try {
    const tokens = providerId === 'google_calendar' ? await exchangeGoogleCode(code, redirectUri)
      : providerId === 'microsoft_outlook' ? await exchangeOutlookCode(code, redirectUri)
      : await exchangeCalendlyCode(code, redirectUri)

    await saveConnection({
      userEmail: verified.userEmail,
      provider: providerId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      scope: 'scope' in tokens && tokens.scope ? String(tokens.scope) : '',
      accountLabel: adapter.name,
    })
    await writeAuditEvent({ actorEmail: verified.userEmail, action: 'calendar.connected', targetId: providerId })
    return backTo(request, { calendarConnected: adapter.name })
  } catch {
    await writeAuditEvent({ actorEmail: verified.userEmail, action: 'calendar.connect_failed', targetId: providerId })
    const described = describeCalendarError('OAUTH_FAILED', adapter.name)
    return backTo(request, { calendarError: described.message })
  }
}
