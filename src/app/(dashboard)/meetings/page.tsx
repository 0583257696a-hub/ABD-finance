'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CalendarPlus, FileText, Link2, Mail, Send, Unlink, Zap } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'

type ProviderStatus = {
  id: 'google_calendar' | 'microsoft_outlook' | 'calendly'
  name: string
  configured: boolean
  connected: boolean
}

type CalendarMeeting = {
  externalEventId?: string
  title: string
  startsAt: string
  endsAt: string
  location?: string
  meetingUrl?: string
  source: string
  providerName: string
  participants: Array<{ name?: string; email?: string }>
}

type Meeting = {
  id: string
  client_name: string
  client_email: string
  title: string
  starts_at: string
  ends_at: string
  location: string
  notes: string
  status: 'scheduled' | 'done' | 'cancelled'
  invite_sent_at: string | null
}

type ClientForm = {
  token: string
  client_name: string
  client_email: string
  status: 'sent' | 'submitted'
  payload_json: string | null
  sent_at: string
  submitted_at: string | null
}

const FIELD_LABELS: Record<string, string> = {
  fullName: 'שם מלא',
  phone: 'טלפון',
  birthYear: 'שנת לידה',
  maritalStatus: 'מצב משפחתי',
  employmentStatus: 'סטטוס תעסוקה',
  employerName: 'מעסיק',
  monthlyIncome: 'הכנסה חודשית',
  partnerMonthlyIncome: 'הכנסת בן/בת זוג',
  monthlyExpenses: 'הוצאות חודשיות',
  hasPension: 'פנסיה/ביטוח מנהלים',
  hasStudyFund: 'קרן השתלמות',
  hasLifeInsurance: 'ביטוח חיים',
  hasHealthInsurance: 'ביטוח בריאות',
  retirementAgeGoal: 'גיל פרישה מתוכנן',
  goals: 'מטרות',
  notes: 'הערות',
}

function yesNoLabel(value: string) {
  if (value === 'yes') return 'כן'
  if (value === 'no') return 'לא'
  if (value === 'unknown') return 'לא בטוח/ה'
  return value
}

function formatWhen(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
}

export default function MeetingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [forms, setForms] = useState<ClientForm[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [openFormToken, setOpenFormToken] = useState('')

  // --- Start Meeting flow state ---
  const [startChoice, setStartChoice] = useState<'closed' | 'choose' | 'calendar' | 'spontaneous'>('closed')
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [calendarMeetings, setCalendarMeetings] = useState<CalendarMeeting[]>([])
  const [calendarErrors, setCalendarErrors] = useState<Array<{ providerName: string; message: string }>>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [spontaneousTitle, setSpontaneousTitle] = useState('')
  const [starting, setStarting] = useState(false)

  const calendarNotice = searchParams.get('calendarConnected') ? `${searchParams.get('calendarConnected')} חובר בהצלחה.`
    : searchParams.get('calendarError') || ''

  const activeClient = useWorkspaceStore(state => state.client)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [title, setTitle] = useState('פגישת ייעוץ פנסיוני')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  // Pre-fill from the active client so the advisor doesn't retype what the app already knows.
  // Only fills empty fields, so it never overwrites something the advisor already typed.
  useEffect(() => {
    if (!activeClient) return
    if (!clientName) {
      const name = activeClient.fullName || [activeClient.firstName, activeClient.lastName].filter(Boolean).join(' ')
      if (name) setClientName(name)
    }
    if (!clientEmail && activeClient.email) setClientEmail(activeClient.email)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient])

  const refresh = useCallback(async () => {
    try {
      const [meetingsResponse, formsResponse] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/client-forms'),
      ])
      if (meetingsResponse.ok) setMeetings(((await meetingsResponse.json()) as { meetings: Meeting[] }).meetings || [])
      if (formsResponse.ok) setForms(((await formsResponse.json()) as { forms: ClientForm[] }).forms || [])
    } catch {
      setStatus('טעינת הנתונים נכשלה. נסו לרענן את הדף, ואם הבעיה נמשכת פנו לתמיכה.')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const [providersError, setProvidersError] = useState<string | null>(null)

  const loadProviders = useCallback(async () => {
    setProvidersError(null)
    try {
      const response = await fetch('/api/calendar?include=providers')
      if (!response.ok) {
        setProvidersError(`שגיאה בטעינת סטטוס חיבורים (${response.status})`)
        return
      }
      const data = await response.json() as { providers: ProviderStatus[] }
      setProviders(data.providers || [])
    } catch {
      setProvidersError('לא ניתן היה להתחבר לשרת. בדוק חיבור אינטרנט ונסה שוב.')
    }
  }, [])

  useEffect(() => { void loadProviders() }, [loadProviders])

  async function loadCalendarMeetings() {
    setCalendarLoading(true)
    try {
      const response = await fetch('/api/calendar')
      if (!response.ok) { setCalendarMeetings([]); return }
      const data = await response.json() as { meetings: CalendarMeeting[]; errors: Array<{ providerName: string; message: string }> }
      setCalendarMeetings(data.meetings || [])
      setCalendarErrors(data.errors || [])
    } finally {
      setCalendarLoading(false)
    }
  }

  function openStartFlow() {
    setStartChoice('choose')
  }

  function chooseFromCalendar() {
    setStartChoice('calendar')
    void loadCalendarMeetings()
  }

  /** Imports the chosen calendar event as a local meeting, then enters the Meeting Workspace. */
  async function startFromCalendarEvent(event: CalendarMeeting) {
    setStarting(true)
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import-calendar-event',
          title: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          location: event.location,
          source: event.source,
          externalEventId: event.externalEventId,
          meetingUrl: event.meetingUrl,
          participants: event.participants,
          clientName: event.participants.find(person => person.name)?.name,
          clientEmail: event.participants.find(person => person.email)?.email,
        }),
      })
      const data = await response.json() as { ok?: boolean; id?: string }
      if (data.ok && data.id) router.push(`/meeting/${data.id}`)
      else setStatus('פתיחת הפגישה נכשלה.')
    } finally {
      setStarting(false)
    }
  }

  async function startSpontaneous() {
    setStarting(true)
    try {
      const now = new Date()
      const title = spontaneousTitle.trim() || `פגישה ספונטנית — ${now.toLocaleDateString('he-IL')}`
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import-calendar-event',
          title,
          startsAt: now.toISOString(),
          endsAt: new Date(now.getTime() + 60 * 60000).toISOString(),
          source: 'spontaneous',
          externalEventId: `spontaneous-${crypto.randomUUID()}`,
          participants: [],
        }),
      })
      const data = await response.json() as { ok?: boolean; id?: string }
      if (data.ok && data.id) router.push(`/meeting/${data.id}`)
      else setStatus('פתיחת הפגישה נכשלה.')
    } finally {
      setStarting(false)
    }
  }

  function connectProvider(providerId: ProviderStatus['id']) {
    window.location.href = `/api/calendar/connect/${providerId}`
  }

  async function disconnectProvider(providerId: ProviderStatus['id']) {
    await fetch('/api/calendar/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: providerId }),
    })
    await loadProviders()
  }

  async function createMeeting(sendInvite: boolean) {
    if (!date || !time) { setStatus('בחר תאריך ושעה לפגישה.'); return }
    const startsAt = new Date(`${date}T${time}:00`)
    const endsAt = new Date(startsAt.getTime() + (Number(durationMinutes) || 60) * 60000)
    setBusy(true)
    setStatus('')
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, clientEmail, title, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), location, notes }),
      })
      const data = await response.json() as { ok?: boolean; id?: string; error?: string }
      if (!response.ok || !data.ok) {
        setStatus(response.status === 401
          ? 'נדרשת התחברות למערכת כדי לשמור פגישות.'
          : data.error === 'd1-unavailable' ? 'שמירה נכשלה — אין חיבור D1 בסביבה הנוכחית.' : 'יצירת הפגישה נכשלה.')
        return
      }
      let message = 'הפגישה נשמרה.'
      if (sendInvite && data.id) {
        if (!clientEmail) {
          message += ' לא נשלח זימון — חסר אימייל לקוח.'
        } else {
          const inviteResponse = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send-invite', id: data.id }),
          })
          const invite = await inviteResponse.json() as { ok?: boolean; queued?: boolean }
          message += invite.ok ? ' זימון נשלח ללקוח עם קובץ יומן.' : invite.queued ? ' הזימון נכנס לתור (אין חיבור מייל בסביבה זו).' : ' שליחת הזימון נכשלה.'
        }
      }
      setStatus(message)
      setClientName(''); setClientEmail(''); setLocation(''); setNotes('')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function sendInvite(meeting: Meeting) {
    setBusy(true)
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-invite', id: meeting.id }),
      })
      const data = await response.json() as { ok?: boolean; queued?: boolean }
      setStatus(data.ok ? `זימון נשלח אל ${meeting.client_email}.` : data.queued ? 'הזימון נכנס לתור (אין חיבור מייל בסביבה זו).' : 'שליחת הזימון נכשלה.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function setMeetingStatus(meeting: Meeting, nextStatus: Meeting['status']) {
    await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-status', id: meeting.id, status: nextStatus }),
    })
    await refresh()
  }

  async function sendForm(name: string, email: string) {
    if (!email.includes('@')) { setStatus('שליחת שאלון: חסר אימייל לקוח תקין.'); return }
    setBusy(true)
    try {
      const response = await fetch('/api/client-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: name, clientEmail: email }),
      })
      const data = await response.json() as { ok?: boolean; formUrl?: string; emailSent?: boolean; emailQueued?: boolean }
      if (data.ok) {
        setStatus(data.emailSent
          ? `שאלון נשלח אל ${email}.`
          : `השאלון נוצר (${data.formUrl}) אך המייל בתור — אין חיבור מייל בסביבה זו.`)
      } else {
        setStatus('יצירת השאלון נכשלה.')
      }
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const upcoming = useMemo(() => meetings.filter(meeting => meeting.status === 'scheduled'), [meetings])
  const past = useMemo(() => meetings.filter(meeting => meeting.status !== 'scheduled'), [meetings])

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar
        title="פגישות ושאלונים"
        subtitle="התחלת פגישה, זימון עם קובץ יומן אוניברסלי, ושליחת שאלון הכנה ללקוח"
        actions={<Button variant="primary" onClick={openStartFlow}><Zap size={15} style={iconStyle} /> התחל פגישה</Button>}
      />

      {status && <div style={noticeStyle}>{status}</div>}
      {calendarNotice && <div style={noticeStyle}>{calendarNotice}</div>}

      {startChoice !== 'closed' && (
        <Surface style={{ padding: 20, marginBottom: 18 }}>
          {startChoice === 'choose' && (
            <div>
              <h2 style={sectionTitleStyle}>איך תרצה להתחיל?</h2>
              <div style={choiceGridStyle}>
                <button type="button" onClick={chooseFromCalendar} style={choiceCardStyle}>
                  <Calendar size={22} />
                  <strong>מהיומן</strong>
                  <span style={metaStyle}>בחר פגישה קיימת מהיומן שלך</span>
                </button>
                <button type="button" onClick={() => setStartChoice('spontaneous')} style={choiceCardStyle}>
                  <Zap size={22} />
                  <strong>פגישה ספונטנית</strong>
                  <span style={metaStyle}>התחל פגישה חדשה עכשיו</span>
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStartChoice('closed')}>ביטול</Button>
            </div>
          )}

          {startChoice === 'spontaneous' && (
            <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
              <h2 style={sectionTitleStyle}>פגישה ספונטנית</h2>
              <Field label="שם הפגישה (אופציונלי)">
                <input value={spontaneousTitle} onChange={event => setSpontaneousTitle(event.target.value)} placeholder="פגישה עם לקוח חדש" style={inputStyle} />
              </Field>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="primary" disabled={starting} onClick={() => void startSpontaneous()}>{starting ? 'פותח…' : 'התחל פגישה'}</Button>
                <Button variant="ghost" onClick={() => setStartChoice('choose')}>חזרה</Button>
              </div>
            </div>
          )}

          {startChoice === 'calendar' && (
            <div>
              <h2 style={sectionTitleStyle}>בחר פגישה מהיומן</h2>
              {!providers.some(provider => provider.connected) ? (
                <div>
                  <p style={metaStyle}>עדיין לא חיברת יומן.</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {providers.filter(provider => provider.configured).map(provider => (
                      <Button key={provider.id} variant="secondary" size="sm" onClick={() => connectProvider(provider.id)}>
                        <Link2 size={13} style={iconStyle} /> חבר {provider.name}
                      </Button>
                    ))}
                    {providers.every(provider => !provider.configured) && (
                      <span style={metaStyle}>אף ספק יומן לא הוגדר עדיין בסביבה זו.</span>
                    )}
                  </div>
                </div>
              ) : calendarLoading ? (
                <p style={metaStyle}>טוען פגישות…</p>
              ) : calendarMeetings.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {calendarMeetings.map(event => (
                    <div key={`${event.source}-${event.externalEventId}`} style={meetingRowStyle}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ color: 'var(--text-heading)' }}>{event.title}</strong>
                        <span style={metaStyle}>{formatWhen(event.startsAt)} · {event.providerName}</span>
                      </div>
                      <Button size="sm" variant="primary" disabled={starting} onClick={() => void startFromCalendarEvent(event)}>התחל פגישה</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={metaStyle}>אין פגישות קרובות ביומן המחובר.</p>
              )}
              {calendarErrors.map(error => (
                <p key={error.providerName} style={{ ...metaStyle, color: 'var(--destructive-text)', marginTop: 8 }}>{error.providerName}: {error.message}</p>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setStartChoice('choose')} style={{ marginTop: 10 }}>חזרה</Button>
            </div>
          )}
        </Surface>
      )}

      <Surface style={{ padding: 20, marginBottom: 18 }}>
        <h2 style={sectionTitleStyle}><Link2 size={17} style={iconStyle} /> חיבורי יומן</h2>
        {providers.length ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {providers.map(provider => (
              <div key={provider.id} style={providerChipStyle}>
                <StatusBadge tone={provider.connected ? 'success' : provider.configured ? 'neutral' : 'warning'} label={provider.connected ? 'מחובר' : provider.configured ? 'לא מחובר' : 'לא מוגדר'} />
                <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 13.5 }}>{provider.name}</span>
                {provider.configured && (
                  provider.connected
                    ? <Button size="sm" variant="ghost" onClick={() => void disconnectProvider(provider.id)}><Unlink size={12} style={iconStyle} /> נתק</Button>
                    : <Button size="sm" variant="ghost" onClick={() => connectProvider(provider.id)}>חבר</Button>
                )}
              </div>
            ))}
          </div>
        ) : providersError ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ ...metaStyle, color: 'var(--destructive-text)' }}>{providersError}</p>
            <Button variant="secondary" size="sm" onClick={() => void loadProviders()}>נסה שוב</Button>
          </div>
        ) : <p style={metaStyle}>טוען…</p>}
      </Surface>

      <section style={layoutStyle}>
        <Surface style={{ padding: 20 }}>
          <h2 style={sectionTitleStyle}><CalendarPlus size={17} style={iconStyle} /> פגישה חדשה</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="שם לקוח"><input value={clientName} onChange={event => setClientName(event.target.value)} style={inputStyle} /></Field>
            <Field label="אימייל לקוח"><input dir="ltr" type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} style={inputStyle} /></Field>
            <Field label="נושא"><input value={title} onChange={event => setTitle(event.target.value)} style={inputStyle} /></Field>
            <div style={rowStyle}>
              <Field label="תאריך"><input type="date" value={date} onChange={event => setDate(event.target.value)} style={inputStyle} /></Field>
              <Field label="שעה"><input type="time" value={time} onChange={event => setTime(event.target.value)} style={inputStyle} /></Field>
              <Field label="משך (דקות)"><input dir="ltr" inputMode="numeric" value={durationMinutes} onChange={event => setDurationMinutes(event.target.value)} style={inputStyle} /></Field>
            </div>
            <Field label="מיקום / קישור לשיחה"><input value={location} onChange={event => setLocation(event.target.value)} style={inputStyle} /></Field>
            <Field label="הערות"><textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={busy} onClick={() => void createMeeting(true)}>שמור + שלח זימון ללקוח</Button>
              <Button variant="secondary" disabled={busy} onClick={() => void createMeeting(false)}>שמור בלבד</Button>
              <Button variant="secondary" disabled={busy} onClick={() => void sendForm(clientName, clientEmail)}>
                <FileText size={15} style={iconStyle} /> שלח שאלון הכנה
              </Button>
            </div>
          </div>
        </Surface>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Surface style={{ padding: 20 }}>
            <h2 style={sectionTitleStyle}><Mail size={17} style={iconStyle} /> פגישות קרובות</h2>
            {upcoming.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {upcoming.map(meeting => (
                  <article key={meeting.id} style={meetingRowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', color: 'var(--text-heading)' }}>{meeting.title}</strong>
                      <span style={metaStyle}>{meeting.client_name} · {formatWhen(meeting.starts_at)}{meeting.location ? ` · ${meeting.location}` : ''}</span>
                      {meeting.invite_sent_at && <span style={{ ...metaStyle, color: 'var(--success-text)' }}>זימון נשלח {formatWhen(meeting.invite_sent_at)}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <Button size="sm" variant="primary" onClick={() => router.push(`/meeting/${meeting.id}`)}>התחל פגישה</Button>
                      <Button size="sm" variant="secondary" disabled={busy || !meeting.client_email} onClick={() => void sendInvite(meeting)}>
                        <Send size={13} style={iconStyle} /> {meeting.invite_sent_at ? 'שלח שוב' : 'שלח זימון'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void setMeetingStatus(meeting, 'cancelled')}>בוטלה</Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="אין פגישות קרובות" description="צור פגישה חדשה ושלח ללקוח זימון עם קובץ יומן." />
            )}
            {past.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ ...metaStyle, cursor: 'pointer' }}>היסטוריה ({past.length})</summary>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {past.map(meeting => (
                    <div key={meeting.id} style={{ ...meetingRowStyle, opacity: 0.75 }}>
                      <div>
                        <strong style={{ color: 'var(--text-heading)' }}>{meeting.title}</strong>
                        <span style={metaStyle}> · {meeting.client_name} · {formatWhen(meeting.starts_at)}</span>
                      </div>
                      <StatusBadge tone={meeting.status === 'done' ? 'success' : 'destructive'} label={meeting.status === 'done' ? 'התקיימה' : 'בוטלה'} />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </Surface>

          <Surface style={{ padding: 20 }}>
            <h2 style={sectionTitleStyle}><FileText size={17} style={iconStyle} /> שאלוני הכנה</h2>
            {forms.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {forms.map(form => {
                  const payload = form.payload_json ? JSON.parse(form.payload_json) as Record<string, string> : null
                  const open = openFormToken === form.token
                  return (
                    <article key={form.token} style={meetingRowStyle}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ color: 'var(--text-heading)' }}>{form.client_name || form.client_email}</strong>
                        <span style={metaStyle}> · נשלח {formatWhen(form.sent_at)}</span>
                        {form.status === 'submitted' && payload && open && (
                          <dl style={payloadStyle}>
                            {Object.entries(payload).map(([key, value]) => (
                              <div key={key} style={{ display: 'flex', gap: 6 }}>
                                <dt style={{ fontWeight: 700, color: 'var(--text-heading)', flexShrink: 0 }}>{FIELD_LABELS[key] || key}:</dt>
                                <dd style={{ color: 'var(--text-body)' }}>{key.startsWith('has') ? yesNoLabel(value) : value}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <StatusBadge tone={form.status === 'submitted' ? 'success' : 'warning'} label={form.status === 'submitted' ? 'מולא' : 'ממתין'} />
                        {form.status === 'submitted' && (
                          <Button size="sm" variant="ghost" onClick={() => setOpenFormToken(open ? '' : form.token)}>{open ? 'סגור' : 'צפה'}</Button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState title="לא נשלחו שאלונים" description='מלא שם ואימייל לקוח בטופס הפגישה ולחץ "שלח שאלון הכנה".' />
            )}
          </Surface>
        </div>
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 18, alignItems: 'start' }
const sectionTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-heading)', fontSize: 16, fontWeight: 700, marginBottom: 14 }
const iconStyle: React.CSSProperties = { flexShrink: 0 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6, color: 'var(--text-heading)', fontWeight: 600, fontSize: 13.5 }
const inputStyle: React.CSSProperties = { minHeight: 40, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontFamily: 'var(--font-main)', fontSize: 14, background: 'var(--bg-canvas)', color: 'var(--text-heading)', width: '100%' }
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }
const noticeStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, marginBottom: 16, fontWeight: 600 }
const meetingRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--bg-canvas)' }
const metaStyle: React.CSSProperties = { display: 'block', color: 'var(--text-muted)', fontSize: 12.5, marginTop: 2 }
const payloadStyle: React.CSSProperties = { display: 'grid', gap: 4, marginTop: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--separator)', fontSize: 13 }
const choiceGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }
const choiceCardStyle: React.CSSProperties = { display: 'grid', gap: 6, justifyItems: 'center', textAlign: 'center', padding: '22px 16px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-canvas)', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', cursor: 'pointer' }
const providerChipStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--separator)', borderRadius: 999, background: 'var(--bg-canvas)' }
