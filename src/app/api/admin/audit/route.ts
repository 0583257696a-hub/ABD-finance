import { NextResponse } from 'next/server'
import { requireAdmin, d1Unavailable } from '@/lib/admin/guard'
import { clearAuditEvents, listAuditEvents, writeAuditEvent } from '@/lib/admin/admin-db'

/** Admin: server-side audit log (audit_events). Read-only except for an explicit clear. */
export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const events = await listAuditEvents(300)
  if (!events) return NextResponse.json({ events: [], mode: 'static-auth' })
  return NextResponse.json({ events, mode: 'd1' })
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const removed = await clearAuditEvents()
  if (removed === 0) {
    // Either nothing to clear or D1 missing — distinguish for the UI.
    const events = await listAuditEvents(1)
    if (!events) return d1Unavailable()
  }
  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.audit.cleared', metadata: { removed } })
  return NextResponse.json({ ok: true, removed })
}
