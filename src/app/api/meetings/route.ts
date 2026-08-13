import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { createMeeting, getMeeting, listMeetings, markInviteSent, updateMeetingStatus } from '@/lib/meetings-db'
import { buildIcsInvite, icsToBase64 } from '@/lib/meetings-ics'
import { sendSystemEmail } from '@/lib/system-mail'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meetings = await listMeetings(session.user.email)
  return NextResponse.json({ meetings })
}

type PostBody = {
  action?: 'create' | 'send-invite' | 'set-status'
  id?: string
  status?: 'scheduled' | 'done' | 'cancelled'
  clientName?: string
  clientEmail?: string
  title?: string
  startsAt?: string
  endsAt?: string
  location?: string
  notes?: string
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email
  const body = await request.json().catch(() => ({})) as PostBody

  if (body.action === 'set-status') {
    if (!body.id || !body.status || !['scheduled', 'done', 'cancelled'].includes(body.status)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    const ok = await updateMeetingStatus(userEmail, body.id, body.status)
    return NextResponse.json({ ok })
  }

  if (body.action === 'send-invite') {
    if (!body.id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const meeting = await getMeeting(userEmail, body.id)
    if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!meeting.client_email) return NextResponse.json({ error: 'missing-client-email' }, { status: 400 })

    const ics = buildIcsInvite({
      uid: meeting.id,
      title: meeting.title || 'פגישת ייעוץ פנסיוני',
      description: meeting.notes || '',
      location: meeting.location || '',
      startsAt: new Date(meeting.starts_at),
      endsAt: new Date(meeting.ends_at),
      organizerName: session.user.name || 'ABD Finance',
      organizerEmail: userEmail,
      attendeeName: meeting.client_name || 'לקוח',
      attendeeEmail: meeting.client_email,
    })

    const when = new Date(meeting.starts_at).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jerusalem' })
    const result = await sendSystemEmail({
      to: meeting.client_email,
      subject: `הזמנה לפגישה: ${meeting.title || 'פגישת ייעוץ פנסיוני'}`,
      text: `שלום ${meeting.client_name},\n\nנקבעה פגישה: ${meeting.title}\nמועד: ${when}\n${meeting.location ? `מיקום: ${meeting.location}\n` : ''}\nהקובץ המצורף יוסיף את הפגישה ליומן שלך (Google / Outlook / Apple).\n\nבברכה,\n${session.user.name || 'ABD Finance'}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7"><p>שלום ${meeting.client_name},</p><p>נקבעה פגישה: <strong>${meeting.title}</strong><br/>מועד: <strong>${when}</strong>${meeting.location ? `<br/>מיקום: ${meeting.location}` : ''}</p><p>הקובץ המצורף יוסיף את הפגישה ליומן שלך (Google / Outlook / Apple).</p><p>בברכה,<br/>${session.user.name || 'ABD Finance'}</p></div>`,
      replyTo: userEmail,
      attachments: [{ filename: 'meeting.ics', contentType: 'text/calendar', base64: icsToBase64(ics) }],
    })
    if (result.ok) await markInviteSent(userEmail, meeting.id)
    return NextResponse.json({ ok: result.ok, queued: 'queued' in result ? result.queued : false })
  }

  // Default: create.
  const startsAt = body.startsAt ? new Date(body.startsAt) : null
  const endsAt = body.endsAt ? new Date(body.endsAt) : null
  if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: 'invalid-dates' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const ok = await createMeeting({
    id,
    user_email: userEmail,
    client_name: sanitizeText(body.clientName, 160) || '',
    client_email: sanitizeText(body.clientEmail, 200) || '',
    title: sanitizeText(body.title, 200) || 'פגישת ייעוץ פנסיוני',
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    location: sanitizeText(body.location, 300) || '',
    notes: sanitizeText(body.notes, 2000) || '',
    status: 'scheduled',
  })
  if (!ok) return NextResponse.json({ error: 'd1-unavailable' }, { status: 503 })
  return NextResponse.json({ ok: true, id })
}
