'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarPlus, FileText, Mail, Send } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

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
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [forms, setForms] = useState<ClientForm[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [openFormToken, setOpenFormToken] = useState('')

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [title, setTitle] = useState('פגישת ייעוץ פנסיוני')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [meetingsResponse, formsResponse] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/client-forms'),
      ])
      if (meetingsResponse.ok) setMeetings(((await meetingsResponse.json()) as { meetings: Meeting[] }).meetings || [])
      if (formsResponse.ok) setForms(((await formsResponse.json()) as { forms: ClientForm[] }).forms || [])
    } catch {
      setStatus('טעינת הנתונים נכשלה — ייתכן שהמערכת רצה ללא חיבור D1 (סביבת פיתוח).')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

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
        subtitle="זימון פגישות עם קובץ יומן אוניברסלי (Google / Outlook / Apple) ושליחת שאלון הכנה ללקוח"
      />

      {status && <div style={noticeStyle}>{status}</div>}

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
                      <Button size="sm" variant="secondary" disabled={busy || !meeting.client_email} onClick={() => void sendInvite(meeting)}>
                        <Send size={13} style={iconStyle} /> {meeting.invite_sent_at ? 'שלח שוב' : 'שלח זימון'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void setMeetingStatus(meeting, 'done')}>התקיימה</Button>
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
