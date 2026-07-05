import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { checkPasswordPolicy } from '@/lib/password-policy'
import { getValidPasswordResetToken, markPasswordResetTokenUsed, updateD1UserPassword, writeAuditEvent } from '@/lib/system-db'
import { clientIp, rateLimit, rateLimitResponse, requireSameOrigin } from '@/lib/security'

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const limited = rateLimit(`reset-password:${clientIp(request)}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  })
  if (!limited.allowed) return rateLimitResponse(limited.retryAfter)

  const body = await request.json().catch(() => null) as { token?: string; password?: string; confirmPassword?: string } | null
  const token = String(body?.token || '').trim()
  const password = String(body?.password || '')
  const confirmPassword = String(body?.confirmPassword || '')

  if (!token) {
    return NextResponse.json({ error: 'קישור האיפוס חסר או לא תקין.' }, { status: 400 })
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'אימות הסיסמה אינו תואם.' }, { status: 400 })
  }
  if (!checkPasswordPolicy(password).valid) {
    return NextResponse.json({ error: 'הסיסמה חייבת לכלול לפחות 8 תווים, אות גדולה באנגלית ואות קטנה באנגלית.' }, { status: 400 })
  }

  const reset = await getValidPasswordResetToken(token)
  if (!reset) {
    return NextResponse.json({ error: 'קישור האיפוס פג תוקף או כבר נוצל.' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  await updateD1UserPassword(reset.user_id, hash)
  await markPasswordResetTokenUsed(reset.id)
  await writeAuditEvent({ actorEmail: reset.email, action: 'auth.password_reset.completed', targetId: reset.user_id })

  return NextResponse.json({ ok: true })
}
