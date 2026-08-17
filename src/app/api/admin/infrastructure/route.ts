import { NextResponse } from 'next/server'
import { requireAdmin, d1Unavailable } from '@/lib/admin/guard'
import { adminInfrastructureDefaults } from '@/lib/admin/defaults'
import { getAdminInfrastructure, saveAdminInfrastructure } from '@/lib/admin/infrastructure'
import { writeAuditEvent } from '@/lib/admin/admin-db'

/**
 * Admin: the persisted "infrastructure" document — subscription plans and
 * registration settings. Registration (/api/register) reads the SAME stored
 * document, so what the admin toggles here is what new sign-ups get.
 */

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const { infrastructure, stored } = await getAdminInfrastructure()
  return NextResponse.json({ mode: stored ? 'd1' : 'defaults', infrastructure })
}

export async function PATCH(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response

  const body = await request.json().catch(() => null) as { infrastructure?: unknown } | null
  const infrastructure = body?.infrastructure
  if (!infrastructure || typeof infrastructure !== 'object') {
    return NextResponse.json({ error: 'מבנה תשתית לא תקין' }, { status: 400 })
  }
  // Only the parts the panel edits are accepted; the rest stays at defaults.
  const incoming = infrastructure as Partial<typeof adminInfrastructureDefaults>
  const next = {
    ...adminInfrastructureDefaults,
    plans: Array.isArray(incoming.plans) ? incoming.plans : adminInfrastructureDefaults.plans,
    registration: { ...adminInfrastructureDefaults.registration, ...(incoming.registration || {}) },
  }
  const saved = await saveAdminInfrastructure(next)
  if (!saved) return d1Unavailable()
  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.infrastructure_saved', metadata: { plans: next.plans.length } })
  return NextResponse.json({ ok: true, mode: 'd1' })
}
