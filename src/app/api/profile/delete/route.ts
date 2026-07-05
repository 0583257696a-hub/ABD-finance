import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { deleteD1UserAccount, requestD1AccountDeletion } from '@/lib/system-db'
import { requireSameOrigin } from '@/lib/security'

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { mode?: string }
  if (body.mode === 'delete-now') {
    const ok = await deleteD1UserAccount(session.user.id)
    return NextResponse.json({ ok })
  }

  const ok = await requestD1AccountDeletion(session.user.id)
  return NextResponse.json({ ok })
}
