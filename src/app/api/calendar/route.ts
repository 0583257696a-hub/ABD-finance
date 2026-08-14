import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { CalendarError, createMeeting, describeCalendarError, getAdapter, getProviderStatuses, getUpcomingMeetings } from '@/lib/calendar/registry'
import type { CalendarProviderId } from '@/lib/calendar/types'

/**
 * Unified calendar endpoint. The client never talks to a provider directly
 * and never sees a token — only provider status, meetings, and (on failure)
 * a human message plus a suggested action.
 */

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email

  const url = new URL(request.url)
  const providers = await getProviderStatuses(userEmail)

  if (url.searchParams.get('include') === 'providers') {
    return NextResponse.json({ providers })
  }

  const results = await getUpcomingMeetings(userEmail, { limit: 25 })
  const meetings = results.flatMap(result => result.meetings.map(meeting => ({ ...meeting, providerName: result.providerName })))
  meetings.sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return NextResponse.json({
    providers,
    meetings,
    errors: results.filter(result => result.error).map(result => ({ provider: result.provider, providerName: result.providerName, ...result.error })),
    anyConnected: providers.some(provider => provider.connected),
    anyConfigured: providers.some(provider => provider.configured),
  })
}

/** Creates an event on a provider's calendar ("קבע פגישה"). */
export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    provider?: CalendarProviderId
    title?: string
    startsAt?: string
    endsAt?: string
    location?: string
    notes?: string
    participantEmails?: string[]
  }

  if (!body.provider) return NextResponse.json({ error: 'missing-provider' }, { status: 400 })
  const startsAt = body.startsAt ? new Date(body.startsAt) : null
  const endsAt = body.endsAt ? new Date(body.endsAt) : null
  if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: 'invalid-dates' }, { status: 400 })
  }

  try {
    const meeting = await createMeeting(session.user.email, body.provider, {
      title: sanitizeText(body.title, 200) || 'פגישת ייעוץ',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: sanitizeText(body.location, 300),
      notes: sanitizeText(body.notes, 2000),
      participantEmails: (body.participantEmails || []).map(email => sanitizeText(email, 200)).filter(email => email.includes('@')).slice(0, 20),
    })
    return NextResponse.json({ ok: true, meeting })
  } catch (error) {
    const providerName = (() => {
      try { return getAdapter(body.provider!).name } catch { return 'היומן' }
    })()
    const code = error instanceof CalendarError ? error.code : 'PROVIDER_UNAVAILABLE'
    const described = describeCalendarError(code, providerName)
    return NextResponse.json({ error: code, message: described.message, action: described.hint.action, actionLabel: described.hint.label }, { status: 502 })
  }
}
