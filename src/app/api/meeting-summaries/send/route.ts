import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { getMeeting, getMeetingSummary } from '@/lib/meetings-db'
import { filledEditedSections, filledFacts, parseSummaryDocument } from '@/lib/meeting-summary-doc'
import { sendSystemEmail } from '@/lib/system-mail'
import { formatLongDate } from '@/lib/format-date'

/**
 * "שלח ללקוח" — emails an archived meeting summary to the client in one
 * action (proposal §5.3). The mail is the summary document itself as clean
 * HTML (facts, recommendations, follow-ups, disclaimer), sent from the
 * advisor's own address when possible (Gmail-connected) with Reply-To the
 * advisor. The recipient defaults to the meeting's client email; the
 * advisor may override it.
 */

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string))

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email

  const body = await request.json().catch(() => ({})) as { id?: string; to?: string; note?: string }
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'missing-id' }, { status: 400 })
  const summary = await getMeetingSummary(userEmail, id)
  if (!summary) return NextResponse.json({ error: 'not-found' }, { status: 404 })

  const meeting = summary.meeting_id ? await getMeeting(userEmail, summary.meeting_id) : null
  const to = sanitizeText(body.to, 200) || meeting?.client_email || ''
  if (!to.includes('@')) return NextResponse.json({ error: 'missing-recipient' }, { status: 400 })

  const doc = parseSummaryDocument(summary.summary_json)
  if (!doc) return NextResponse.json({ error: 'empty-summary' }, { status: 400 })

  const clientName = summary.client_name || meeting?.client_name || ''
  const advisorName = session.user.name || 'ABD Finance'
  const facts = filledFacts(doc)
  const recommendations = (doc.recommendations || []).filter(item => item?.text?.trim())
  const followUps = (doc.manualFollowUps || []).filter(item => item?.text?.trim())
  const edited = filledEditedSections(doc)
  const note = sanitizeText(body.note, 1000)
  const dateLine = formatLongDate(summary.meeting_ended_at || summary.created_at)

  const section = (title: string, inner: string) => inner ? `<h3 style="margin:18px 0 6px;font-size:15px;color:#111827;border-bottom:1px solid #E5E7EB;padding-bottom:4px">${esc(title)}</h3>${inner}` : ''
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.75;color:#111827;max-width:680px;margin:0 auto">
    <p>שלום ${esc(clientName || 'רב')},</p>
    <p>${note ? esc(note) : `מצורף סיכום הפגישה שלנו מ-${esc(dateLine)}.`}</p>
    <h2 style="font-size:20px;margin:16px 0 4px">${esc(doc.documentTitle || summary.title || 'סיכום פגישה')}</h2>
    ${doc.clientLine ? `<p style="color:#4B5563;margin:0">${esc(doc.clientLine)}</p>` : ''}
    ${doc.introText ? `<p>${esc(doc.introText)}</p>` : ''}
    ${section('תמצית נתונים', facts.length ? `<table style="border-collapse:collapse;width:100%">${facts.map(fact => `<tr><td style="padding:5px 0;color:#4B5563;width:45%">${esc(fact.label)}</td><td style="padding:5px 0;font-weight:bold">${esc(fact.value)}</td></tr>`).join('')}</table>` : '')}
    ${section('המלצות', recommendations.length ? `<ol style="padding-inline-start:20px;margin:0">${recommendations.map(item => `<li style="margin:4px 0">${esc(item.text)}</li>`).join('')}</ol>` : '')}
    ${section('המשך טיפול', followUps.length ? `<ul style="padding-inline-start:20px;margin:0">${followUps.map(item => `<li style="margin:4px 0">${esc(item.text)}</li>`).join('')}</ul>` : '')}
    ${edited.map(([key, text]) => section(key, `<p style="white-space:pre-wrap">${esc(text)}</p>`)).join('')}
    <p style="margin-top:22px;font-size:12.5px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:10px">המידע המוצג נועד לסייע בארגון וסיכום מידע בלבד ואינו מהווה ייעוץ פנסיוני, ביטוחי, משפטי, השקעות או מס.</p>
    <p>בברכה,<br/>${esc(advisorName)}</p>
  </div>`
  const text = [
    `שלום ${clientName || 'רב'},`, '', note || `מצורף סיכום הפגישה שלנו מ-${dateLine}.`, '',
    doc.documentTitle || summary.title || 'סיכום פגישה', doc.clientLine || '', doc.introText || '',
    facts.length ? '\nתמצית נתונים:\n' + facts.map(fact => `- ${fact.label}: ${fact.value}`).join('\n') : '',
    recommendations.length ? '\nהמלצות:\n' + recommendations.map((item, index) => `${index + 1}. ${item.text}`).join('\n') : '',
    followUps.length ? '\nהמשך טיפול:\n' + followUps.map(item => `- ${item.text}`).join('\n') : '',
    ...edited.map(([key, body]) => `\n${key}:\n${body}`),
    '', 'המידע המוצג נועד לסייע בארגון וסיכום מידע בלבד ואינו מהווה ייעוץ פנסיוני, ביטוחי, משפטי, השקעות או מס.', '', `בברכה,\n${advisorName}`,
  ].filter(part => part !== null && part !== undefined).join('\n')

  const result = await sendSystemEmail({
    to,
    subject: `סיכום פגישה — ${summary.title || 'ייעוץ פנסיוני'} · ${dateLine}`,
    html,
    text,
    replyTo: userEmail,
    sender: { name: session.user.name, email: userEmail },
  }).catch(() => ({ ok: false }))

  const ok = Boolean((result as { ok?: boolean }).ok)
  return NextResponse.json({ ok, to, queued: !ok }, { status: ok ? 200 : 502 })
}
