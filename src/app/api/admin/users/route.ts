import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

type AdminUserRow = {
  id: string
  email: string
  name: string | null
  password: string
  createdAt: Date
}

type AdminSession = {
  user?: {
    email?: string | null
    role?: string | null
  }
} | null

function isAdmin(session: AdminSession) {
  return session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
}

function staticUsers() {
  return [
    {
      id: 'admin-static',
      email: process.env.ADMIN_EMAIL || 'admin@abd-finance.co.il',
      name: 'מנהל המערכת',
      phone: '',
      approved: true,
      passwordPreview: 'מוגדר במשתני סביבה',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'advisor-static',
      email: process.env.APP_USER_EMAIL || 'advisor@abd-finance.co.il',
      name: 'יועץ',
      phone: '',
      approved: true,
      passwordPreview: 'מוגדר במשתני סביבה',
      createdAt: new Date().toISOString(),
    },
  ]
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  try {
    const prisma = await getPrisma()
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
  } catch {
    return NextResponse.json({ users: staticUsers(), mode: 'static-auth' })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const body = await request.json()
  if (!body?.userId || !body?.password) {
    return NextResponse.json({ error: 'חסר משתמש או סיסמה חדשה' }, { status: 400 })
  }

  try {
    const prisma = await getPrisma()
    const hash = await bcrypt.hash(String(body.password), 10)
    await prisma.user.update({
      where: { id: String(body.userId) },
      data: { password: hash },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'אין מסד נתונים פעיל. במצב static-auth מחליפים סיסמה דרך ADMIN_PASSWORD / APP_USER_PASSWORD בסביבת Cloudflare.' },
      { status: 503 },
    )
  }
}
