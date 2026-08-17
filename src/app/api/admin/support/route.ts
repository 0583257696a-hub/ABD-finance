import { NextResponse } from 'next/server'
import { requireAdmin, d1Unavailable } from '@/lib/admin/guard'
import { deleteSupportTicket, getSupportTicket, listSupportTickets, updateSupportTicket, writeAuditEvent, type SupportTicketStatus } from '@/lib/admin/admin-db'
import { sanitizeText } from '@/lib/security'
import { sendSystemEmail } from '@/lib/system-mail'

/**
 * Admin: support tickets. Tickets are created by signed-in users via
 * POST /api/support; here the admin triages them (status / priority /
 * internal notes) and replies — a reply is emailed to the user and kept on
 * the ticket thread.
 */

const STATUSES = new Set<SupportTicketStatus>(['open', 'in_progress', 'closed'])
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent'])

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const tickets = await listSupportTickets()
  if (!tickets) return NextResponse.json({ tickets: [], mode: 'static-auth' })
  return NextResponse.json({ tickets, mode: 'd1' })
}

type PatchBody = { id?: string; status?: string; priority?: string; internalNotes?: string; reply?: string }

export async function PATCH(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const body = await request.json().catch(() => ({})) as PatchBody
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'חסר מזהה פנייה' }, { status: 400 })
  const ticket = await getSupportTicket(id)
  if (!ticket) return NextResponse.json({ error: 'הפנייה לא נמצאה' }, { status: 404 })

  const status = body.status && STATUSES.has(body.status as SupportTicketStatus) ? body.status as SupportTicketStatus : undefined
  const priority = body.priority && PRIORITIES.has(body.priority) ? body.priority : undefined
  const internalNotes = typeof body.internalNotes === 'string' ? sanitizeText(body.internalNotes, 4000) : undefined
  const replyText = typeof body.reply === 'string' ? sanitizeText(body.reply, 4000) : ''

  let emailed = false
  const appendReply = replyText ? { at: new Date().toISOString(), by: gate.admin.email, text: replyText } : undefined
  const ok = await updateSupportTicket(id, { status, priority, internalNotes, appendReply })
  if (!ok) return d1Unavailable()

  if (appendReply) {
    const subject = `Re: [תמיכה ABD Finance] ${ticket.subject}`
    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#111827">
        <p>שלום ${ticket.user_name || ''},</p>
        <p>קיבלנו את פנייתך "<strong>${ticket.subject}</strong>" והנה תשובת צוות התמיכה:</p>
        <blockquote style="border-inline-start:3px solid #CBD5E1;margin:0;padding:8px 14px;background:#F8FAFC;white-space:pre-wrap">${escapeHtml(replyText)}</blockquote>
        <p style="color:#6B7280;font-size:13px">ניתן להשיב למייל זה או לפתוח פנייה חדשה מתוך המערכת. מספר פנייה: ${id.slice(0, 8)}</p>
        <p>צוות ABD Finance</p>
      </div>`
    const text = `שלום ${ticket.user_name || ''},\n\nתשובת התמיכה לפנייתך "${ticket.subject}":\n\n${replyText}\n\nמספר פנייה: ${id.slice(0, 8)}\nצוות ABD Finance`
    const sent = await sendSystemEmail({ to: ticket.user_email, subject, html, text, replyTo: 'support@abd-finance.co.il' }).catch(() => ({ ok: false }))
    emailed = Boolean((sent as { ok?: boolean }).ok)
  }

  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.support.updated', targetId: id, metadata: { status, priority, replied: Boolean(appendReply), emailed } })
  return NextResponse.json({ ok: true, emailed })
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const id = new URL(request.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'חסר מזהה פנייה' }, { status: 400 })
  const ok = await deleteSupportTicket(id)
  if (!ok) return d1Unavailable()
  await writeAuditEvent({ actorEmail: gate.admin.email, action: 'admin.support.deleted', targetId: id })
  return NextResponse.json({ ok: true })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string))
}
