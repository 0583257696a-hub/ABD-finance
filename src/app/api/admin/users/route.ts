import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import {
  getRegistrationSettings,
  getRegistrationStatusLabel,
  getUserTypeLabel,
  mergeRegistrationSettings,
} from '@/lib/admin/registration'

type AdminSession = {
  user?: {
    email?: string | null
    role?: string | null
  }
} | null

type AdminUserRow = {
  id: string
  email: string
  name: string | null
  password: string
  createdAt: Date
  advisorData: {
    settings: unknown
  } | null
}

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
      status: 'active',
      statusLabel: 'מאושר',
      userTypeLabel: 'מנהל מערכת',
      planId: 'system',
      passwordPreview: 'מוגדר במשתני סביבה',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'advisor-static',
      email: process.env.APP_USER_EMAIL || 'advisor@abd-finance.co.il',
      name: 'יועץ',
      phone: '',
      approved: true,
      status: 'active',
      statusLabel: 'מאושר',
      userTypeLabel: 'יועץ',
      planId: 'system',
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
        advisorData: {
          select: { settings: true },
        },
      },
    })

    return NextResponse.json({
      users: users.map((user: AdminUserRow) => {
        const settings = getRegistrationSettings(user.advisorData?.settings)
        const registration = settings.registration
        const status = registration?.status || 'active'

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
          phone: registration?.phone || '',
          approved: status === 'active',
          status,
          statusLabel: getRegistrationStatusLabel(status),
          userType: registration?.userType || 'legacy',
          userTypeLabel: registration ? getUserTypeLabel(registration.userType) : 'משתמש קיים',
          planId: registration?.planId || settings.subscription?.planId || 'legacy',
          subscriptionStatus: settings.subscription?.status || registration?.subscriptionStatus || 'active',
          businessName: registration?.business?.name || '',
          agencyName: registration?.agencyJoin?.agencyName || '',
          passwordPreview: user.password ? `${user.password.slice(0, 14)}...` : '',
        }
      }),
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
  const userId = String(body?.userId || '')
  const action = String(body?.action || (body?.password ? 'reset_password' : ''))

  if (!userId) {
    return NextResponse.json({ error: 'חסר משתמש לעדכון' }, { status: 400 })
  }

  try {
    const prisma = await getPrisma()

    if (action === 'reset_password') {
      if (!body?.password) {
        return NextResponse.json({ error: 'חסרה סיסמה חדשה' }, { status: 400 })
      }

      const hash = await bcrypt.hash(String(body.password), 10)
      await prisma.user.update({
        where: { id: userId },
        data: { password: hash },
      })
    } else if (action === 'approve' || action === 'block') {
      const existing = await prisma.advisorData.findUnique({
        where: { userId },
        select: { settings: true },
      })
      const now = new Date().toISOString()
      const settings = mergeRegistrationSettings(
        existing?.settings,
        action === 'approve'
          ? {
              status: 'active',
              approvedAt: now,
              approvedBy: session?.user?.email || 'admin',
              blockedAt: undefined,
              blockedBy: undefined,
              subscriptionStatus: 'trial_active',
            }
          : {
              status: 'blocked',
              blockedAt: now,
              blockedBy: session?.user?.email || 'admin',
              subscriptionStatus: 'blocked',
            },
        action === 'approve'
          ? { status: 'trial_active', trialStartedAt: now }
          : { status: 'blocked' },
      )
      const jsonSettings = JSON.parse(JSON.stringify(settings))

      await prisma.advisorData.upsert({
        where: { userId },
        update: { settings: jsonSettings },
        create: { userId, settings: jsonSettings },
      })
    } else {
      return NextResponse.json({ error: 'פעולת עדכון לא נתמכת' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'אין מסד נתונים פעיל. במצב static-auth מחליפים סיסמה דרך ADMIN_PASSWORD / APP_USER_PASSWORD בסביבת Cloudflare.' },
      { status: 503 },
    )
  }
}
