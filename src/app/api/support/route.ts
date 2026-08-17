import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { createSupportTicket, listSupportTicketsForUser } from '@/lib/admin/admin-db'
import { sendSystemEmail } from '@/lib/system-mail'

/**
 * User-facing support: any signed-in user can open a ticket (from the
 * sidebar "תמיכה" sheet) and see their own tickets. Opening a ticket also
 * emails the support inbox (support@abd-finance.co.il — routed by Cloudflare
 * Email Routing to the operator's mailbox), so the request is never only
 * sitting in a table nobody looks at.
 */

const SUPPORT_INBOX = 'support@abd-finance.co.il'
const CATEGORIES = new Set(['general', 'bug', 'billing', 'feature', 'access'])

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tickets = await listSupportTicketsForUser(session.user.email)
  return NextResponse.json({ tickets: tickets.map(ticket => ({ id: ticket.id, subject: ticket.subject, status: ticket.status, createdAt: ticket.created_at, updatedAt: ticket.updated_at, replies: safeReplies(ticket.replies_json) })) })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { subject?: string; message?: string; category?: string; pageUrl?: string }
  const subject = sanitizeText(body.subject, 160)
  const message = sanitizeText(body.message, 4000)
  const category = CATEGORIES.has(String(body.category)) ? String(body.category) : 'general'
  const pageUrl = sanitizeText(body.pageUrl, 400)
  if (!subject || !message) return NextResponse.json({ error: 'נא למלא נושא ותיאור' }, { status: 400 })

  const userEmail = session.user.email
  const userName = session.user.name || ''
  const id = await createSupportTicket({ userEmail, userName, subject, message, category, pageUrl })
  if (!id) return NextResponse.json({ error: 'd1-unavailable' }, { status: 503 })

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#111827">
      <h2 style="margin:0 0 8px">פנייה חדשה לתמיכה — ${escapeHtml(subject)}</h2>
      <p><strong>מאת:</strong> ${escapeHtml(userName)} &lt;${escapeHtml(userEmail)}&gt;<br/>
         <strong>קטגוריה:</strong> ${category}<br/>
         ${pageUrl ? `<strong>מסך:</strong> ${escapeHtml(pageUrl)}<br/>` : ''}
         <strong>מספר פנייה:</strong> ${id.slice(0, 8)}</p>
      <div style="border-inline-start:3px solid #CBD5E1;padding:8px 14px;background:#F8FAFC;white-space:pre-wrap">${escapeHtml(message)}</div>
      <p style="color:#6B7280;font-size:13px;margin-top:14px">לטיפול: פאנל הניהול → תמיכה ופניות. השבה למייל זה מגיעה ישירות למשתמש.</p>
    </div>`
  const text = `פנייה חדשה לתמיכה — ${subject}\nמאת: ${userName} <${userEmail}>\nקטגוריה: ${category}\n${pageUrl ? `מסך: ${pageUrl}\n` : ''}מספר פנייה: ${id.slice(0, 8)}\n\n${message}`
  const sent = await sendSystemEmail({ to: SUPPORT_INBOX, subject: `[תמיכה] ${subject} — ${userName || userEmail}`, html, text, replyTo: userEmail }).catch(() => ({ ok: false }))

  return NextResponse.json({ ok: true, id, emailed: Boolean((sent as { ok?: boolean }).ok) })
}

function safeReplies(json: string) {
  try { return JSON.parse(json || '[]') as Array<{ at: string; by: string; text: string }> } catch { return [] }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string))
}
