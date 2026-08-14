import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { buildGoogleAuthUrl } from '@/lib/calendar/adapters/google'
import { buildOutlookAuthUrl } from '@/lib/calendar/adapters/outlook'
import { buildCalendlyAuthUrl } from '@/lib/calendar/adapters/calendly'
import { getAdapter } from '@/lib/calendar/registry'
import { CalendarError, describeCalendarError, type CalendarProviderId } from '@/lib/calendar/types'
import { createOAuthState } from '@/lib/calendar/oauth-state'

/**
 * Starts the calendar OAuth flow. Calendar permission is deliberately a
 * SEPARATE grant from signing in (spec §1): the user must already be
 * authenticated here, and consent is requested only when they actively
 * connect a calendar.
 */

const PROVIDERS: CalendarProviderId[] = ['google_calendar', 'microsoft_outlook', 'calendly']

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.redirect(new URL('/login', request.url))

  const { provider } = await context.params
  if (!PROVIDERS.includes(provider as CalendarProviderId)) {
    return NextResponse.json({ error: 'unknown-provider' }, { status: 404 })
  }
  const providerId = provider as CalendarProviderId
  const adapter = getAdapter(providerId)

  if (!(await adapter.isConfigured())) {
    const described = describeCalendarError('NOT_CONFIGURED', adapter.name)
    return NextResponse.json({ error: 'NOT_CONFIGURED', message: described.message }, { status: 503 })
  }

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/calendar/callback/${providerId}`
  // Signed state binds the callback to this user + provider (CSRF defense).
  const state = await createOAuthState(session.user.email, providerId)

  try {
    const authUrl = providerId === 'google_calendar' ? await buildGoogleAuthUrl(redirectUri, state)
      : providerId === 'microsoft_outlook' ? await buildOutlookAuthUrl(redirectUri, state)
      : await buildCalendlyAuthUrl(redirectUri, state)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    const code = error instanceof CalendarError ? error.code : 'OAUTH_FAILED'
    const described = describeCalendarError(code, adapter.name)
    return NextResponse.redirect(new URL(`/?tab=meetings&calendarError=${encodeURIComponent(described.message)}`, request.url))
  }
}
