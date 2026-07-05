import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminInfrastructureDefaults } from '@/lib/admin/defaults'
import { getD1AdminSetting, setD1AdminSetting, writeAuditEvent } from '@/lib/system-db'

type AdminSession = {
  user?: {
    email?: string | null
    role?: string | null
  }
} | null

function isAdmin(session: AdminSession) {
  return session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
}

const ADMIN_INFRASTRUCTURE_KEY = 'admin_infrastructure'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const stored = await getD1AdminSetting<typeof adminInfrastructureDefaults>(ADMIN_INFRASTRUCTURE_KEY)

  return NextResponse.json({
    mode: stored ? 'd1' : 'defaults',
    connected: {
      landingPage: Boolean(stored),
      registration: Boolean(stored),
      crm: false,
      subscriptions: Boolean(stored),
      auditPersistence: true,
    },
    infrastructure: stored || adminInfrastructureDefaults,
  })
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const infrastructure = body?.infrastructure
  if (!infrastructure || typeof infrastructure !== 'object') {
    return NextResponse.json({ error: 'מבנה תשתית לא תקין' }, { status: 400 })
  }

  const saved = await setD1AdminSetting(ADMIN_INFRASTRUCTURE_KEY, infrastructure)
  if (!saved) return NextResponse.json({ error: 'D1 לא זמין לשמירת תשתית הניהול' }, { status: 503 })

  await writeAuditEvent({
    actorEmail: session?.user?.email,
    action: 'admin.infrastructure_saved',
    targetId: ADMIN_INFRASTRUCTURE_KEY,
  })

  return NextResponse.json({ ok: true, mode: 'd1' })
}
