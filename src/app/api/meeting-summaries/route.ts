import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin } from '@/lib/security'
import { deleteMeetingSummary, getMeetingSummary, listMeetingSummaries } from '@/lib/meetings-db'
import { clientNameFromClientLine } from '@/lib/meeting-summary-doc'

/**
 * Archived meeting summaries ("סיכומי פגישות"). Written by the end-session
 * action in /api/meetings. Always scoped to the signed-in advisor.
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

  // listMeetingSummaries falls back to the raw "עבור <name> ת.ז …" document
  // line for rows saved without a client name — reduce it to the name only.
  const summaries = (await listMeetingSummaries(session.user.email)).map(row => ({
    ...row,
    client_name: row.client_name?.startsWith('עבור') ? clientNameFromClientLine(row.client_name) : (row.client_name || ''),
  }))
  return NextResponse.json({ summaries })
}

/** Deletes one archived summary (the advisor confirmed in the UI). */
export async function DELETE(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const ok = await deleteMeetingSummary(session.user.email, id)
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
}
