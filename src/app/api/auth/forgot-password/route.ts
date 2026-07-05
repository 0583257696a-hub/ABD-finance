import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createPasswordResetToken, findD1UserByEmail, writeAuditEvent } from '@/lib/system-db'
import { passwordResetEmail, sendSystemEmail } from '@/lib/system-mail'
import { clientIp, rateLimit, rateLimitResponse, requireSameOrigin, sanitizeText } from '@/lib/security'

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const limited = rateLimit(`forgot-password:${clientIp(request)}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  })
  if (!limited.allowed) return rateLimitResponse(limited.retryAfter)

  const body = await request.json().catch(() => null) as { email?: string } | null
  const email = sanitizeText(body?.email, 250).toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: true })
  }

  const user = await findD1UserByEmail(email)
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await createPasswordResetToken(user.id, token, expiresAt)
    const resetUrl = new URL(`/reset-password?token=${encodeURIComponent(token)}`, request.url).toString()
    const mail = passwordResetEmail({ fullName: user.name, resetUrl })
    await sendSystemEmail({ to: user.email, ...mail })
    await writeAuditEvent({ actorEmail: email, action: 'auth.password_reset.requested', targetId: user.id })
  }

  return NextResponse.json({ ok: true })
}
