import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type AdminUserRow = {
  id: string
  email: string
  name: string | null
  password: string
  createdAt: Date
}

function isAdmin(email?: string | null) {
  return email === 'admin@abd-finance.co.il'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    users: users.map((user: AdminUserRow) => ({
      ...user,
      phone: '',
      approved: true,
      passwordPreview: user.password ? `${user.password.slice(0, 14)}...` : '',
    })),
  })
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const body = await request.json()
  if (!body?.userId || !body?.password) {
    return NextResponse.json({ error: 'חסר משתמש או סיסמה חדשה' }, { status: 400 })
  }

  const hash = await bcrypt.hash(String(body.password), 10)
  await prisma.user.update({
    where: { id: String(body.userId) },
    data: { password: hash },
  })

  return NextResponse.json({ ok: true })
}
