import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listD1LeadOverrides, upsertD1LeadOverride, writeAuditEvent } from '@/lib/system-db'

type AdminSession = {
  user?: {
    email?: string | null
    role?: string | null
  }
} | null

const ALLOWED_STATUSES = new Set(['open', 'assigned', 'emailed', 'closed', 'converted'])

function isAdmin(session: AdminSession) {
  return session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const rows = await listD1LeadOverrides()
  if (!rows) return NextResponse.json({ overrides: {}, mode: 'local-fallback' })

  const overrides = Object.fromEntries(rows.map(row => [
    row.lead_id,
    {
      status: row.status,
      owner: row.owner || undefined,
      updatedAt: row.updated_at,
    },
  ]))

  return NextResponse.json({ overrides, mode: 'd1' })
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'אין הרשאת מנהל מערכת' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const leadId = String(body?.leadId || '')
  const status = String(body?.status || '')
  const owner = typeof body?.owner === 'string' ? body.owner : session?.user?.email || 'admin'

  if (!leadId || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'נתוני ליד לא תקינים' }, { status: 400 })
  }

  const saved = await upsertD1LeadOverride({ leadId, status, owner })
  if (!saved) return NextResponse.json({ error: 'D1 לא זמין לשמירת לידים' }, { status: 503 })

  await writeAuditEvent({
    actorEmail: session?.user?.email,
    action: 'admin.lead_status_updated',
    targetId: leadId,
    metadata: { status, owner },
  })

  return NextResponse.json({ ok: true })
}
