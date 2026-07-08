import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { listD1Users, parseUserSettings, updateD1UserPassword, updateD1UserStatus } from '@/lib/system-db'
import {
  getRegistrationStatusLabel,
  getUserTypeLabel,
} from '@/lib/admin/registration'

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
    const d1Users = await listD1Users()
    if (d1Users) {
      return NextResponse.json({
        users: d1Users.map(user => {
          const settings = parseUserSettings(user)
          const registration = settings.registration
          const subscription = settings.subscription
          const status = registration?.status || user.status || 'active'

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.created_at,
            phone: registration?.phone || '',
            approved: status === 'active',
            status,
            statusLabel: getRegistrationStatusLabel(status),
            userType: registration?.userType || 'legacy',
            userTypeLabel: registration ? getUserTypeLabel(registration.userType) : 'משתמש קיים',
            planId: registration?.planId || subscription?.planId || 'legacy',
            subscriptionStatus: subscription?.status || registration?.subscriptionStatus || user.status || 'active',
            businessName: registration?.business?.name || '',
            agencyName: registration?.agencyJoin?.agencyName || '',
            passwordPreview: user.password_hash ? `${user.password_hash.slice(0, 14)}...` : '',
          }
        }),
        mode: 'd1',
      })
    }

    // D1 unavailable — fall back to env-configured static accounts.
    return NextResponse.json({ users: staticUsers(), mode: 'static-auth' })
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
    if (action === 'reset_password') {
      if (!body?.password) {
        return NextResponse.json({ error: 'חסרה סיסמה חדשה' }, { status: 400 })
      }
      const hash = await bcrypt.hash(String(body.password), 10)
      const updated = await updateD1UserPassword(userId, hash)
      if (updated) return NextResponse.json({ ok: true, mode: 'd1' })
    } else if (action === 'approve' || action === 'block' || action === 'extend_trial' || action === 'set_subscription') {
      const now = new Date().toISOString()
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const nextSubscriptionStatus = String(body?.subscriptionStatus || 'active')
      const nextPlanId = String(body?.planId || 'trial')
      const updated = await updateD1UserStatus(
        userId,
        action === 'block' ? 'blocked' : action === 'set_subscription' && nextSubscriptionStatus === 'blocked' ? 'blocked' : 'active',
        action === 'approve'
          ? {
              status: 'active',
              approvedAt: now,
              approvedBy: session?.user?.email || 'admin',
              subscriptionStatus: 'trial_active',
            }
          : action === 'extend_trial'
          ? {
              status: 'active',
              trialExtendedAt: now,
              trialEndsAt,
              subscriptionStatus: 'trial_active',
            }
          : action === 'set_subscription'
          ? {
              status: nextSubscriptionStatus === 'blocked' ? 'blocked' : 'active',
              subscriptionStatus: nextSubscriptionStatus,
              planId: nextPlanId,
            }
          : {
              status: 'blocked',
              blockedAt: now,
              blockedBy: session?.user?.email || 'admin',
              subscriptionStatus: 'blocked',
            },
        action === 'approve'
          ? { status: 'trial_active', trialStartedAt: now }
          : action === 'extend_trial'
          ? { status: 'trial_active', trialExtendedAt: now, trialEndsAt }
          : action === 'set_subscription'
          ? { status: nextSubscriptionStatus, planId: nextPlanId }
          : { status: 'blocked' },
      )
      if (updated) return NextResponse.json({ ok: true, mode: 'd1' })
    }

    const supportedActions = ['reset_password', 'approve', 'block', 'extend_trial', 'set_subscription']
    if (!supportedActions.includes(action)) {
      return NextResponse.json({ error: 'פעולת עדכון לא נתמכת' }, { status: 400 })
    }

    // Action is valid but D1 could not apply it (user not found or DB unavailable).
    return NextResponse.json(
      { error: 'המשתמש לא נמצא במסד הנתונים (Cloudflare D1) או שהמסד אינו זמין.' },
      { status: 404 },
    )
  } catch {
    return NextResponse.json(
      { error: 'מסד הנתונים (Cloudflare D1) אינו זמין. במצב static-auth מחליפים סיסמה דרך ADMIN_PASSWORD / APP_USER_PASSWORD בסביבת Cloudflare.' },
      { status: 503 },
    )
  }
}
