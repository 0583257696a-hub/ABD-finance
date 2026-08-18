import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { createFollowUps, deleteFollowUp, listFollowUps, updateFollowUp } from '@/lib/meetings-db'

/** Follow-up tasks (משימות המשך) — owner-scoped CRUD. Created automatically at end of meeting; managed from the meetings home. */

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const followUps = await listFollowUps(session.user.email, {
    includeDone: url.searchParams.get('includeDone') === '1',
    clientName: url.searchParams.get('client') || undefined,
  })
  return NextResponse.json({ followUps })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { text?: string; clientName?: string; meetingId?: string; owner?: 'advisor' | 'client'; dueDate?: string | null }
  const text = sanitizeText(body.text, 500)
  if (!text) return NextResponse.json({ error: 'missing-text' }, { status: 400 })
  const created = await createFollowUps(session.user.email, [{ text, clientName: sanitizeText(body.clientName, 160), meetingId: body.meetingId || null, owner: body.owner === 'client' ? 'client' : 'advisor', dueDate: body.dueDate ? sanitizeText(body.dueDate, 20) : null }])
  return NextResponse.json({ ok: created > 0 })
}

export async function PATCH(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { id?: string; status?: 'open' | 'done'; dueDate?: string | null; owner?: 'advisor' | 'client'; text?: string }
  if (!body.id) return NextResponse.json({ error: 'missing-id' }, { status: 400 })
  const ok = await updateFollowUp(session.user.email, body.id, {
    status: body.status === 'done' || body.status === 'open' ? body.status : undefined,
    dueDate: body.dueDate === undefined ? undefined : (body.dueDate ? sanitizeText(body.dueDate, 20) : null),
    owner: body.owner === 'client' || body.owner === 'advisor' ? body.owner : undefined,
    text: body.text !== undefined ? sanitizeText(body.text, 500) : undefined,
  })
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
}

export async function DELETE(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'missing-id' }, { status: 400 })
  const ok = await deleteFollowUp(session.user.email, id)
  return NextResponse.json({ ok })
}
