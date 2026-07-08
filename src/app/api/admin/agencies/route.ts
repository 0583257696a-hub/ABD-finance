import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getD1AdminSetting, setD1AdminSetting, writeAuditEvent } from '@/lib/system-db'
import { requireSameOrigin } from '@/lib/security'

type AdminSession = {
  user?: {
    email?: string | null
    role?: string | null
  }
} | null

function isAdmin(session: AdminSession) {
  return session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
}

const ADMIN_AGENCIES_KEY = 'admin_agencies'

type AgencyOverrideMap = Record<string, Record<string, unknown>>

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const stored = await getD1AdminSetting<AgencyOverrideMap>(ADMIN_AGENCIES_KEY)
  return NextResponse.json({ overrides: stored || {}, mode: stored ? 'd1' : 'defaults' })
}

export async function PATCH(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const agencyName = typeof body?.agencyName === 'string' ? body.agencyName.trim() : ''
  const patch = body?.override
  if (!agencyName || !patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'נתוני סוכנות לא תקינים' }, { status: 400 })
  }

  const current = (await getD1AdminSetting<AgencyOverrideMap>(ADMIN_AGENCIES_KEY)) || {}
  const next: AgencyOverrideMap = {
    ...current,
    [agencyName]: { ...(current[agencyName] || {}), ...patch },
  }

  const saved = await setD1AdminSetting(ADMIN_AGENCIES_KEY, next)
  if (!saved) return NextResponse.json({ error: 'D1 לא זמין לשמירת סוכנויות' }, { status: 503 })

  await writeAuditEvent({
    actorEmail: session?.user?.email,
    action: 'admin.agency_updated',
    targetId: agencyName,
  })

  return NextResponse.json({ ok: true, overrides: next, mode: 'd1' })
}
