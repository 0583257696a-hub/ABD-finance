import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { checkPasswordPolicy } from '@/lib/password-policy'
import { getValidPasswordResetToken, markPasswordResetTokenUsed, updateD1UserPassword } from '@/lib/system-db'

export async function POST(request: Request) {
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

  return NextResponse.json({ ok: true })
}
