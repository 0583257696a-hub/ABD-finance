import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createPasswordResetToken, findD1UserByEmail } from '@/lib/system-db'
import { passwordResetEmail, sendSystemEmail } from '@/lib/system-mail'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string } | null
  const email = String(body?.email || '').trim().toLowerCase()
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
  }

  return NextResponse.json({ ok: true })
}
