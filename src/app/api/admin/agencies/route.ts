import { NextResponse } from 'next/server'
import { requireAdmin, d1Unavailable } from '@/lib/admin/guard'
import { assignAgencyMember, createAgency, deleteAgency, listAgencies, removeAgencyMember, updateAgency, writeAuditEvent, type AgencyInput } from '@/lib/admin/admin-db'
import { sanitizeText } from '@/lib/security'

/**
 * Admin: agencies (real rows) and their members. A user belongs to at most
 * one agency; assigning to another moves them.
 */

const AGENCY_STATUSES = new Set(['active', 'trial', 'suspended', 'archived'])

function readAgencyInput(body: Record<string, unknown>): AgencyInput {
  const out: AgencyInput = {}
  if (typeof body.name === 'string') out.name = sanitizeText(body.name, 120)
  if (typeof body.taxId === 'string') out.tax_id = sanitizeText(body.taxId, 40)
  if (typeof body.address === 'string') out.address = sanitizeText(body.address, 240)
  if (typeof body.phone === 'string') out.phone = sanitizeText(body.phone, 40)
  if (typeof body.email === 'string') out.email = sanitizeText(body.email, 160)
  if (typeof body.planId === 'string') out.plan_id = sanitizeText(body.planId, 60)
  if (typeof body.status === 'string' && AGENCY_STATUSES.has(body.status)) out.status = body.status
  if (typeof body.notes === 'string') out.notes = sanitizeText(body.notes, 2000)
  return out
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const agencies = await listAgencies()
  if (!agencies) return NextResponse.json({ agencies: [], mode: 'static-auth' })
  return NextResponse.json({ agencies, mode: 'd1' })
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const input = readAgencyInput(body)
  if (!input.name) return NextResponse.json({ error: 'שם הסוכנות חובה' }, { status: 400 })
  const id = await createAgency({ ...input, name: input.name })
  if (!id) return d1Unavailable()
  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.agency.created', targetId: id, metadata: { name: input.name } })
  return NextResponse.json({ ok: true, id })
}

type PatchBody = { id?: string; action?: 'update' | 'assign' | 'unassign'; userId?: string; memberRole?: 'manager' | 'employee' } & Record<string, unknown>

export async function PATCH(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const body = await request.json().catch(() => ({})) as PatchBody
  const action = body.action || 'update'

  if (action === 'assign') {
    const agencyId = String(body.id || '')
    const userId = String(body.userId || '')
    const memberRole = body.memberRole === 'manager' ? 'manager' : 'employee'
    if (!agencyId || !userId) return NextResponse.json({ error: 'חסר מזהה סוכנות או משתמש' }, { status: 400 })
    const ok = await assignAgencyMember(agencyId, userId, memberRole)
    if (!ok) return NextResponse.json({ error: 'הסוכנות או המשתמש לא נמצאו' }, { status: 404 })
    await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.agency.member_assigned', targetId: agencyId, metadata: { userId, memberRole } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'unassign') {
    const userId = String(body.userId || '')
    if (!userId) return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })
    const ok = await removeAgencyMember(userId)
    if (!ok) return d1Unavailable()
    await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.agency.member_removed', targetId: userId })
    return NextResponse.json({ ok: true })
  }

  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'חסר מזהה סוכנות' }, { status: 400 })
  const patch = readAgencyInput(body)
  if (patch.name !== undefined && !patch.name) return NextResponse.json({ error: 'שם הסוכנות חובה' }, { status: 400 })
  const ok = await updateAgency(id, patch)
  if (!ok) return NextResponse.json({ error: 'הסוכנות לא נמצאה' }, { status: 404 })
  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.agency.updated', targetId: id, metadata: { fields: Object.keys(patch) } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const id = new URL(request.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'חסר מזהה סוכנות' }, { status: 400 })
  const ok = await deleteAgency(id)
  if (!ok) return d1Unavailable()
  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.agency.deleted', targetId: id })
  return NextResponse.json({ ok: true })
}
