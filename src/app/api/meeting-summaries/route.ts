import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getMeetingSummary, listMeetingSummaries } from '@/lib/meetings-db'

/**
 * Archived meeting summaries ("סיכומי פגישות"). Written by the end-session
 * action in /api/meetings; this route is read-only. Always scoped to the
 * signed-in advisor.
 */

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (id) {
    const summary = await getMeetingSummary(session.user.email, id)
    if (!summary) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    return NextResponse.json({ summary })
  }

  const summaries = await listMeetingSummaries(session.user.email)
  return NextResponse.json({ summaries })
}
