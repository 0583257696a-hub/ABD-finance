import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import {
  createMeeting,
  endMeetingSession,
  findMeetingByExternalEvent,
  getMeeting,
  listMeetings,
  markInviteSent,
  saveMeetingSummary,
  setMeetingConfirmToken,
  startMeetingSession,
  updateMeetingNotes,
  updateMeetingStatus,
  type MeetingSource,
} from '@/lib/meetings-db'
import { buildIcsInvite, icsToBase64 } from '@/lib/meetings-ics'
import { sendSystemEmail } from '@/lib/system-mail'
import { clientNameFromSummary } from '@/lib/meeting-summary-doc'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meetings = await listMeetings(session.user.email)
  return NextResponse.json({ meetings })
}

type PostBody = {
  action?: 'create' | 'send-invite' | 'set-status' | 'start-session' | 'end-session' | 'import-calendar-event' | 'save-notes'
  id?: string
  status?: 'scheduled' | 'done' | 'cancelled'
  clientName?: string
  clientEmail?: string
  title?: string
  startsAt?: string
  endsAt?: string
  location?: string
  notes?: string
  // start-session / import-calendar-event
  source?: MeetingSource
  externalEventId?: string
  meetingUrl?: string
  participants?: Array<{ name?: string; email?: string }>
  // end-session
  summary?: unknown
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email
  const body = await request.json().catch(() => ({})) as PostBody

  /**
   * Imports a calendar event into Smart Meeting as a local meeting, so the
   * session has an internal id and stays linked to the external event.
   * Idempotent — starting the same calendar event twice reuses one meeting.
   */
  if (body.action === 'import-calendar-event') {
    if (!body.externalEventId || !body.startsAt || !body.endsAt) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const existing = await findMeetingByExternalEvent(userEmail, body.externalEventId)
    if (existing) return NextResponse.json({ ok: true, id: existing.id, reused: true })

    const id = crypto.randomUUID()
    const participants = (body.participants || []).slice(0, 30)
    const ok = await createMeeting({
      id,
      user_email: userEmail,
      client_name: sanitizeText(body.clientName, 160) || participants.find(person => person.name)?.name || '',
      client_email: sanitizeText(body.clientEmail, 200) || participants.find(person => person.email)?.email || '',
      title: sanitizeText(body.title, 200) || 'פגישה',
      starts_at: body.startsAt,
      ends_at: body.endsAt,
      location: sanitizeText(body.location, 300) || '',
      notes: sanitizeText(body.notes, 2000) || '',
      status: 'scheduled',
      source: body.source || 'spontaneous',
      external_event_id: body.externalEventId,
      meeting_url: sanitizeText(body.meetingUrl, 500) || null,
      participants_json: participants.length ? JSON.stringify(participants) : null,
    })
    if (!ok) return NextResponse.json({ error: 'd1-unavailable' }, { status: 503 })
    return NextResponse.json({ ok: true, id })
  }

  if (body.action === 'start-session') {
    if (!body.id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const meeting = await getMeeting(userEmail, body.id)
    if (!meeting) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    await startMeetingSession(userEmail, body.id)
    return NextResponse.json({ ok: true })
  }

  /**
   * Ends the session: archives the summary document under "סיכומי פגישות",
   * links it back to the meeting, and keeps the external-event linkage so a
   * calendar-originated meeting stays traceable to its source event.
   */
  if (body.action === 'end-session') {
    if (!body.id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const meeting = await getMeeting(userEmail, body.id)
    if (!meeting) return NextResponse.json({ error: 'not-found' }, { status: 404 })

    let summaryId: string | null = null
    if (body.summary) {
      summaryId = crypto.randomUUID()
      // The archive list is scanned by client name, so never save it blank when
      // the meeting record has none (spontaneous meetings often don't): fall
      // back to the name the advisor loaded in the workspace, then to the
      // "עבור <name> ת.ז …" line of the summary document itself.
      const clientName =
        meeting.client_name ||
        sanitizeText(body.clientName, 160) ||
        sanitizeText(clientNameFromSummary(body.summary), 160)
      const saved = await saveMeetingSummary({
        id: summaryId,
        user_email: userEmail,
        meeting_id: meeting.id,
        title: meeting.title || 'סיכום פגישה',
        client_name: clientName,
        summary_json: JSON.stringify(body.summary).slice(0, 400_000),
        source: meeting.source || 'spontaneous',
        external_event_id: meeting.external_event_id ?? null,
        meeting_started_at: meeting.started_at ?? null,
        meeting_ended_at: new Date().toISOString(),
      })
      if (!saved) summaryId = null
    }

    await endMeetingSession(userEmail, body.id, summaryId)
    return NextResponse.json({ ok: true, summaryId })
  }

  if (body.action === 'save-notes') {
    if (!body.id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const ok = await updateMeetingNotes(userEmail, body.id, sanitizeText(body.notes, 4000))
    return NextResponse.json({ ok })
  }

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

    // "אשר הגעה" link — confirming fires an in-app notification to the advisor.
    const confirmToken = crypto.randomUUID().replace(/-/g, '')
    await setMeetingConfirmToken(userEmail, meeting.id, confirmToken)
    const storedToken = (await getMeeting(userEmail, meeting.id))?.confirm_token || confirmToken
    const confirmUrl = `${new URL(request.url).origin}/api/meeting-confirm/${storedToken}`

    const when = new Date(meeting.starts_at).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jerusalem' })
    const result = await sendSystemEmail({
      to: meeting.client_email,
      subject: `הזמנה לפגישה: ${meeting.title || 'פגישת ייעוץ פנסיוני'}`,
      text: `שלום ${meeting.client_name},\n\nנקבעה פגישה: ${meeting.title}\nמועד: ${when}\n${meeting.location ? `מיקום: ${meeting.location}\n` : ''}\nלאישור הגעה: ${confirmUrl}\n\nהקובץ המצורף יוסיף את הפגישה ליומן שלך (Google / Outlook / Apple).\n\nבברכה,\n${session.user.name || 'ABD Finance'}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7"><p>שלום ${meeting.client_name},</p><p>נקבעה פגישה: <strong>${meeting.title}</strong><br/>מועד: <strong>${when}</strong>${meeting.location ? `<br/>מיקום: ${meeting.location}` : ''}</p><p><a href="${confirmUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">אשר/י הגעה לפגישה</a></p><p>הקובץ המצורף יוסיף את הפגישה ליומן שלך (Google / Outlook / Apple).</p><p>בברכה,<br/>${session.user.name || 'ABD Finance'}</p></div>`,
      replyTo: userEmail,
      sender: { name: session.user.name, email: userEmail },
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
    // When the meeting was also created in the advisor's calendar (e.g. with a
    // Google Meet link) keep the linkage so the card can offer "הצטרף והתחל".
    source: body.source || 'spontaneous',
    external_event_id: sanitizeText(body.externalEventId, 300) || null,
    meeting_url: sanitizeText(body.meetingUrl, 500) || null,
  })
  if (!ok) return NextResponse.json({ error: 'd1-unavailable' }, { status: 503 })
  return NextResponse.json({ ok: true, id })
}
