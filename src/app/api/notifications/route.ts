import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin } from '@/lib/security'
import { listNotifications, markNotificationsRead } from '@/lib/meetings-db'

/** In-app notifications (התראות): form submissions, meeting confirmations. */

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const notifications = await listNotifications(session.user.email)
  const unread = notifications.filter(notification => !notification.read).length
  return NextResponse.json({ notifications, unread })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await markNotificationsRead(session.user.email)
  return NextResponse.json({ ok: true })
}
