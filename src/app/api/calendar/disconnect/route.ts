import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin } from '@/lib/security'
import { deleteConnection } from '@/lib/calendar/connections'
import { writeAuditEvent } from '@/lib/system-db'
import type { CalendarProviderId } from '@/lib/calendar/types'

const PROVIDERS: CalendarProviderId[] = ['google_calendar', 'microsoft_outlook', 'calendly']

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { provider?: string }
  if (!body.provider || !PROVIDERS.includes(body.provider as CalendarProviderId)) {
    return NextResponse.json({ error: 'unknown-provider' }, { status: 400 })
  }

  await deleteConnection(session.user.email, body.provider as CalendarProviderId)
  await writeAuditEvent({ actorEmail: session.user.email, action: 'calendar.disconnected', targetId: body.provider })
  return NextResponse.json({ ok: true })
}
