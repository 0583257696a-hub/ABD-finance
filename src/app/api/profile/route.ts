import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { exportD1UserData, updateD1UserProfile } from '@/lib/system-db'
import { requireSameOrigin, sanitizeText } from '@/lib/security'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await exportD1UserData(session.user.id)
  return NextResponse.json({
    email: data?.user.email || session.user.email,
    name: data?.user.name || session.user.name || '',
    phone: data?.settings.registration?.phone || '',
  })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { name?: string; phone?: string }
  const ok = await updateD1UserProfile(session.user.id, {
    name: sanitizeText(body.name, 160),
    phone: sanitizeText(body.phone, 60),
  })
  return NextResponse.json({ ok })
}
