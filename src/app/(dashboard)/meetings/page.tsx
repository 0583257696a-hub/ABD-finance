'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CalendarPlus, FileText, History, Link2, Mail, Send, Unlink, Zap } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Sheet } from '@/components/ui/Sheet'
import { Dialog } from '@/components/ui/Dialog'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { describeAnswers } from '@/lib/questionnaires'
import { formatDateTime } from '@/lib/format-date'
import { useToast } from '@/components/ui/Toast'
import { WORKSPACE_MEETING_ID_KEY } from '@/lib/client-data-keys'
import { MeetingsSwitch } from '@/components/features/MeetingsSwitch'
import { MeetingPrepSheet } from '@/components/features/MeetingPrepSheet'
import { FollowUpsCard } from '@/components/features/FollowUpsCard'

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
  meeting_url?: string | null
  notes: string
  status: 'scheduled' | 'done' | 'cancelled'
  invite_sent_at: string | null
  started_at: string | null
  confirmed_at: string | null
}

type ClientForm = {
  token: string
  client_name: string
  client_email: string
  status: 'sent' | 'submitted'
  payload_json: string | null
  questions_json: string | null
  sent_at: string
  submitted_at: string | null
}


function formatWhen(iso: string) {
  return formatDateTime(iso, '-')
}

export default function MeetingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [forms, setForms] = useState<ClientForm[]>([])
  const [status, setStatus] = useState('')
  const toast = useToast()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [meetingToCancel, setMeetingToCancel] = useState<Meeting | null>(null)
  const [prepMeeting, setPrepMeeting] = useState<Meeting | null>(null)
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
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace)
  const applyImportedDataset = useWorkspaceStore(state => state.applyImportedDataset)
  const setNeedsAssessment = useWorkspaceStore(state => state.setNeedsAssessment)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [title, setTitle] = useState('פגישת ייעוץ פנסיוני')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [durationMinutes, setDurationMinutes] = useState('60')
  // One primary action; what happens alongside it is a checkbox, not another button.
  const [sendInviteOnSave, setSendInviteOnSave] = useState(true)
  const [sendQuestionnaireOnSave, setSendQuestionnaireOnSave] = useState(false)
  const [location, setLocation] = useState('')
  // "איפה?" — one click instead of leaving the app to create a video link.
  type Venue = 'office' | 'phone' | 'google_meet' | 'other'
  const [venue, setVenue] = useState<Venue>('office')
  // Meeting templates (proposal §3.2): one click sets title, length and whether a
  // preparation questionnaire goes out. Kept tiny on purpose — presets, not a system.
  const MEETING_TEMPLATES = [
    { id: 'retirement', label: 'תכנון פרישה', title: 'פגישת תכנון פרישה', minutes: '90', questionnaire: true },
    { id: 'annual', label: 'בדיקה שנתית', title: 'בדיקה שנתית של התיק', minutes: '60', questionnaire: false },
    { id: 'new', label: 'לקוח חדש', title: 'פגישת היכרות ובירור צרכים', minutes: '60', questionnaire: true },
    { id: 'followup', label: 'המשך טיפול', title: 'פגישת המשך טיפול', minutes: '30', questionnaire: false },
  ] as const
  const [templateId, setTemplateId] = useState<string>('')
  function applyTemplate(id: string) {
    const template = MEETING_TEMPLATES.find(item => item.id === id)
    if (!template) return
    setTemplateId(id)
    setTitle(template.title)
    setDurationMinutes(template.minutes)
    setSendQuestionnaireOnSave(template.questionnaire)
  }
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

  /**
   * Loads the latest submitted questionnaire for the given client into the
   * fresh workspace: personal details into the client record, all answers
   * into the needs-assessment (base-question ids equal NeedsState keys by
   * design, so no field mapping is needed).
   */
  function applyQuestionnaireIfAny(clientName: string, clientEmail: string) {
    const email = clientEmail.trim().toLowerCase()
    if (!email) return
    const submitted = forms
      .filter(form => form.status === 'submitted' && form.payload_json && form.client_email.trim().toLowerCase() === email)
      .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')))
    const latest = submitted[0]
    if (!latest?.payload_json) return
    try {
      const answers = JSON.parse(latest.payload_json) as Record<string, string>
      applyImportedDataset({
        client: {
          fullName: answers.clientFullName || answers.fullName || clientName || latest.client_name || '',
          email: answers.clientEmail || latest.client_email,
          phone: answers.clientPhone || answers.phone || '',
          birthDate: answers.clientBirthDate || '',
          maritalStatus: answers.maritalStatus || undefined,
        },
      })
      setNeedsAssessment(answers)
      setStatus('נתוני שאלון ההכנה של הלקוח נטענו לתיק — פרטים אישיים ובירור צרכים.')
    } catch { /* malformed payload — start the meeting without prefill */ }
  }

  /** Entry point for a locally-scheduled meeting's "התחל פגישה" button. */
  function startLocalMeeting(meeting: Meeting) {
    // A meeting that hasn't started yet gets a clean workspace (same rule as
    // calendar/spontaneous starts) + the client's questionnaire if one was
    // submitted. Re-entering an in-progress meeting keeps its work as-is.
    if (!meeting.started_at) {
      resetWorkspace()
      applyQuestionnaireIfAny(meeting.client_name, meeting.client_email)
    }
    // Bind the (fresh or prefilled) workspace to THIS meeting — the meeting page wipes it otherwise.
    localStorage.setItem(WORKSPACE_MEETING_ID_KEY, meeting.id)
    router.push(`/meeting/${meeting.id}`)
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
      const data = await response.json() as { ok?: boolean; id?: string; reused?: boolean }
      if (data.ok && data.id) {
        // A genuinely new meeting starts with a clean workspace — otherwise
        // whatever client was previously loaded (possibly hours ago, a
        // different client entirely) silently carries into this one.
        // Re-entering an already-started meeting (reused: true) must NOT
        // reset, or it would wipe work already done in that same session.
        if (!data.reused) {
          resetWorkspace()
          applyQuestionnaireIfAny(
            event.participants.find(person => person.name)?.name || '',
            event.participants.find(person => person.email)?.email || '',
          )
        }
        localStorage.setItem(WORKSPACE_MEETING_ID_KEY, data.id)
        router.push(`/meeting/${data.id}`)
      } else {
        setStatus('פתיחת הפגישה נכשלה.')
      }
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
      const data = await response.json() as { ok?: boolean; id?: string; reused?: boolean }
      if (data.ok && data.id) {
        if (!data.reused) resetWorkspace()
        localStorage.setItem(WORKSPACE_MEETING_ID_KEY, data.id)
        router.push(`/meeting/${data.id}`)
      } else {
        setStatus('פתיחת הפגישה נכשלה.')
      }
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

  function validateMeetingForm(sendInvite: boolean) {
    const errors: Record<string, string> = {}
    if (!clientName.trim()) errors.clientName = 'שם הלקוח חובה.'
    if (!date) errors.date = 'בחר תאריך.'
    if (!time) errors.time = 'בחר שעה.'
    const email = clientEmail.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.clientEmail = 'כתובת אימייל לא תקינה.'
    if (sendInvite && !email) errors.clientEmail = 'כדי לשלוח זימון צריך אימייל לקוח.'
    const minutes = Number(durationMinutes)
    if (durationMinutes && (!Number.isFinite(minutes) || minutes < 5 || minutes > 600)) errors.durationMinutes = 'משך בין 5 ל-600 דקות.'
    setFormErrors(errors)
    const first = Object.keys(errors)[0]
    if (first) {
      document.getElementById(`meeting-field-${first}`)?.focus()
      toast('יש שדות שדורשים תיקון בטופס הפגישה.', 'error')
    }
    return !first
  }

  async function createMeeting(sendInvite: boolean, sendQuestionnaire = false) {
    if (!validateMeetingForm(sendInvite || sendQuestionnaire)) return
    const startsAt = new Date(`${date}T${time}:00`)
    const endsAt = new Date(startsAt.getTime() + (Number(durationMinutes) || 60) * 60000)
    setBusy(true)
    setStatus('')
    try {
      // Venue → location text; Google Meet also creates the calendar event with a Meet link.
      let resolvedLocation = venue === 'office' ? 'במשרד' : venue === 'phone' ? 'שיחת טלפון' : location
      let meetingUrl = ''
      let externalEventId = ''
      let source: string | undefined
      if (venue === 'google_meet') {
        const calendarResponse = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'google_calendar', title, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), notes, participantEmails: clientEmail ? [clientEmail] : [], createVideoLink: true }),
        })
        const calendar = await calendarResponse.json().catch(() => ({})) as { ok?: boolean; meeting?: { meetingUrl?: string; externalEventId?: string }; message?: string }
        if (!calendarResponse.ok || !calendar.ok || !calendar.meeting?.meetingUrl) {
          toast(calendar.message || 'יצירת קישור Google Meet נכשלה — ודא שיומן Google מחובר בהגדרות.', 'error')
          return
        }
        meetingUrl = calendar.meeting.meetingUrl
        externalEventId = calendar.meeting.externalEventId || ''
        source = 'google_calendar'
        resolvedLocation = meetingUrl
      }
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, clientEmail, title, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), location: resolvedLocation, notes, meetingUrl, externalEventId, source }),
      })
      const data = await response.json() as { ok?: boolean; id?: string; error?: string }
      if (!response.ok || !data.ok) {
        toast(response.status === 401
          ? 'נדרשת התחברות למערכת כדי לשמור פגישות.'
          : data.error === 'd1-unavailable' ? 'שמירה נכשלה — אין חיבור D1 בסביבה הנוכחית.' : 'יצירת הפגישה נכשלה.', 'error')
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
      if (sendQuestionnaire && clientEmail.includes('@')) {
        const formResponse = await fetch('/api/client-forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName, clientEmail }) })
        const form = await formResponse.json().catch(() => ({})) as { ok?: boolean; emailSent?: boolean }
        message += form.ok ? (form.emailSent ? ' שאלון הכנה נשלח.' : ' השאלון נוצר, המייל בתור.') : ' שליחת השאלון נכשלה.'
      }
      toast(message, message.includes('נכשל') ? 'error' : 'success')
      setStatus('')
      setFormErrors({})
      // Full reset — a half-cleared form reads as an unfinished state. Title/duration keep their defaults.
      setClientName(''); setClientEmail(''); setLocation(''); setNotes(''); setDate(''); setTime('10:00'); setVenue('office'); setTemplateId('')
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
      toast(data.ok ? `זימון נשלח אל ${meeting.client_email}.` : data.queued ? 'הזימון נכנס לתור (אין חיבור מייל בסביבה זו).' : 'שליחת הזימון נכשלה.', data.ok ? 'success' : 'error')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function setMeetingStatus(meeting: Meeting, nextStatus: Meeting['status']) {
    const response = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-status', id: meeting.id, status: nextStatus }),
    }).catch(() => null)
    if (response?.ok) toast(nextStatus === 'cancelled' ? `הפגישה עם ${meeting.client_name || meeting.title} בוטלה.` : 'סטטוס הפגישה עודכן.', 'success')
    else toast('עדכון הסטטוס נכשל.', 'error')
    await refresh()
  }

  const [formToDelete, setFormToDelete] = useState<ClientForm | null>(null)

  async function deleteForm() {
    if (!formToDelete) return
    setBusy(true)
    try {
      const response = await fetch('/api/client-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', token: formToDelete.token }),
      })
      setStatus(response.ok
        ? `השאלון של ${formToDelete.client_name || formToDelete.client_email} נמחק — הקישור שנשלח ללקוח בוטל.`
        : 'המחיקה נכשלה — ייתכן שהלקוח כבר מילא את השאלון.')
      setFormToDelete(null)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  // "שלח שאלון הכנה" first opens a template picker; the actual send carries
  // the chosen template id so the form snapshots those questions.
  const [templatePicker, setTemplatePicker] = useState<{ name: string; email: string } | null>(null)
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; is_default: number }>>([])
  const [chosenTemplateId, setChosenTemplateId] = useState('')

  async function openTemplatePicker(name: string, email: string) {
    if (!email.includes('@')) { setStatus('שליחת שאלון: חסר אימייל לקוח תקין.'); return }
    try {
      const response = await fetch('/api/questionnaires')
      if (response.ok) {
        const data = await response.json() as { templates: Array<{ id: string; name: string; is_default: number }> }
        setTemplates(data.templates || [])
        setChosenTemplateId(data.templates?.[0]?.id || '')
      }
    } catch { /* picker still opens; send falls back to the base questionnaire */ }
    setTemplatePicker({ name, email })
  }

  async function sendForm(name: string, email: string, templateId?: string) {
    if (!email.includes('@')) { setStatus('שליחת שאלון: חסר אימייל לקוח תקין.'); return }
    setBusy(true)
    setTemplatePicker(null)
    try {
      const response = await fetch('/api/client-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: name, clientEmail: email, templateId }),
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
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar
        title="פגישות ושאלונים"
        subtitle="התחלת פגישה, זימון עם קובץ יומן אוניברסלי, ושליחת שאלון הכנה ללקוח"
        actions={<Button variant="primary" onClick={openStartFlow}><Zap size={15} style={iconStyle} /> התחל פגישה</Button>}
      />

      <MeetingsSwitch active="meetings" />
      {status && <div style={noticeStyle} role="status" aria-live="polite">{status}</div>}
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
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)' }}>סוג פגישה</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {MEETING_TEMPLATES.map(template => (
                  <button key={template.id} type="button" onClick={() => applyTemplate(template.id)} style={{ ...venueChipStyle, ...(templateId === template.id ? venueChipActiveStyle : {}) }} aria-pressed={templateId === template.id} title={template.title + ' · ' + template.minutes + ' דק׳' + (template.questionnaire ? ' · כולל שאלון הכנה' : '')}>
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="שם לקוח *" error={formErrors.clientName} id="meeting-field-clientName"><input id="meeting-field-clientName" required aria-required="true" aria-invalid={Boolean(formErrors.clientName)} aria-describedby={formErrors.clientName ? "meeting-field-clientName-error" : undefined} value={clientName} onChange={event => { setClientName(event.target.value); if (formErrors.clientName) setFormErrors(current => ({ ...current, clientName: "" })) }} placeholder="ישראל ישראלי" style={inputStyle} /></Field>
            <Field label="אימייל לקוח" error={formErrors.clientEmail} id="meeting-field-clientEmail"><input id="meeting-field-clientEmail" dir="ltr" type="email" inputMode="email" autoComplete="off" aria-invalid={Boolean(formErrors.clientEmail)} aria-describedby={formErrors.clientEmail ? "meeting-field-clientEmail-error" : undefined} value={clientEmail} onChange={event => { setClientEmail(event.target.value); if (formErrors.clientEmail) setFormErrors(current => ({ ...current, clientEmail: "" })) }} placeholder="name@example.com" style={inputStyle} /></Field>
            <Field label="נושא"><input value={title} onChange={event => setTitle(event.target.value)} style={inputStyle} /></Field>
            <div style={rowStyle}>
              <Field label="תאריך *" error={formErrors.date} id="meeting-field-date"><input id="meeting-field-date" type="date" required aria-required="true" aria-invalid={Boolean(formErrors.date)} value={date} onChange={event => { setDate(event.target.value); if (formErrors.date) setFormErrors(current => ({ ...current, date: "" })) }} style={inputStyle} /></Field>
              <Field label="שעה *" error={formErrors.time} id="meeting-field-time"><input id="meeting-field-time" type="time" required aria-required="true" aria-invalid={Boolean(formErrors.time)} value={time} onChange={event => { setTime(event.target.value); if (formErrors.time) setFormErrors(current => ({ ...current, time: "" })) }} style={inputStyle} /></Field>
              <Field label="משך (דקות)" error={formErrors.durationMinutes} id="meeting-field-durationMinutes"><input id="meeting-field-durationMinutes" dir="ltr" inputMode="numeric" aria-invalid={Boolean(formErrors.durationMinutes)} value={durationMinutes} onChange={event => setDurationMinutes(event.target.value)} style={inputStyle} /></Field>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)' }}>איפה?</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {([['office', 'במשרד'], ['phone', 'טלפון'], ['google_meet', 'Google Meet'], ['other', 'קישור אחר']] as const).map(([id, label]) => {
                  const googleConnected = providers.some(provider => provider.id === 'google_calendar' && provider.connected)
                  const disabled = id === 'google_meet' && !googleConnected
                  return (
                    <button key={id} type="button" disabled={disabled} onClick={() => setVenue(id)} title={disabled ? 'חבר יומן Google בהגדרות → חיבורים כדי ליצור קישור Meet בלחיצה' : undefined} style={{ ...venueChipStyle, ...(venue === id ? venueChipActiveStyle : {}), ...(disabled ? { opacity: .5, cursor: 'not-allowed' } : {}) }} aria-pressed={venue === id}>
                      {label}
                    </button>
                  )
                })}
              </div>
              {venue === 'google_meet' && <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>קישור Meet ייווצר ביומן Google שלך ויצורף לזימון.</span>}
              {venue === 'other' && <input value={location} onChange={event => setLocation(event.target.value)} placeholder="קישור Zoom / Teams או כתובת" dir="auto" style={inputStyle} />}
            </div>
            <Field label="הערות"><textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
            <div style={{ display: 'grid', gap: 8, padding: '10px 12px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
              <label style={checkRowStyle}><input type="checkbox" checked={sendInviteOnSave} onChange={event => setSendInviteOnSave(event.target.checked)} /> לשלוח ללקוח זימון עם קובץ יומן</label>
              <label style={checkRowStyle}><input type="checkbox" checked={sendQuestionnaireOnSave} onChange={event => setSendQuestionnaireOnSave(event.target.checked)} /> לשלוח ללקוח שאלון הכנה <button type="button" onClick={() => void openTemplatePicker(clientName, clientEmail)} style={inlineLinkStyle} title="בחירת תבנית ושליחה מיידית">בחר תבנית…</button></label>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={busy} onClick={() => void createMeeting(sendInviteOnSave, sendQuestionnaireOnSave)}>{sendInviteOnSave || sendQuestionnaireOnSave ? 'קבע ושלח' : 'קבע פגישה'}</Button>
              <button type="button" disabled={busy} onClick={() => void createMeeting(false, false)} style={inlineLinkStyle}>שמור בלי לשלוח</button>
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
                      {meeting.confirmed_at && <span style={{ ...metaStyle, color: 'var(--success-text)' }}>✓ הלקוח אישר הגעה</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <Button size="sm" variant="secondary" onClick={() => setPrepMeeting(meeting)} title="תקציר של 30 שניות לפני הפגישה: מה סוכם בפעם הקודמת, משימות פתוחות, מה הלקוח מילא בשאלון">מוכן לפגישה</Button>
                      {(() => {
                        const url = meeting.meeting_url || (/^https?:\/\//.test(meeting.location || '') ? meeting.location : '')
                        return url ? (
                          <>
                            <Button size="sm" variant="primary" onClick={() => { window.open(url, '_blank', 'noopener'); startLocalMeeting(meeting) }} title="פותח את שיחת הווידאו ומתחיל את סביבת העבודה עם הלקוח">הצטרף והתחל</Button>
                            <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(url); toast('הקישור הועתק', 'success') }} title={url}>העתק קישור</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="primary" onClick={() => startLocalMeeting(meeting)}>התחל פגישה</Button>
                        )
                      })()}
                      <Button size="sm" variant="secondary" disabled={busy || !meeting.client_email} onClick={() => void sendInvite(meeting)}>
                        <Send size={13} style={iconStyle} /> {meeting.invite_sent_at ? 'שלח שוב' : 'שלח זימון'}
                      </Button>
                      <Button size="sm" variant="ghost" style={{ color: 'var(--destructive)' }} onClick={() => setMeetingToCancel(meeting)}>בטל פגישה</Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="אין פגישות קרובות" description="צור פגישה חדשה ושלח ללקוח זימון עם קובץ יומן." />
            )}
          </Surface>

          <FollowUpsCard />

          {past.length > 0 && (
            <Surface style={{ padding: 20 }}>
              <h2 style={sectionTitleStyle}><History size={17} style={iconStyle} /> היסטוריית פגישות ({past.length})</h2>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {past.map(meeting => (
                  <div key={meeting.id} style={{ ...meetingRowStyle, opacity: 0.85 }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: 'var(--text-heading)' }}>{meeting.title}</strong>
                      <span style={metaStyle}> · {meeting.client_name} · {formatWhen(meeting.starts_at)}</span>
                    </div>
                    <StatusBadge tone={meeting.status === 'done' ? 'success' : 'destructive'} label={meeting.status === 'done' ? 'התקיימה' : 'בוטלה'} />
                  </div>
                ))}
              </div>
            </Surface>
          )}

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
                            {describeAnswers(form.questions_json, payload).map((row, index, all) => (
                              <div key={row.id} style={{ display: 'grid', gap: 2 }}>
                                {(index === 0 || all[index - 1].section !== row.section) && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, marginTop: index === 0 ? 0 : 6 }}>{row.section}</span>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 40%) 1fr', gap: 8, alignItems: 'baseline' }}>
                                  <dt style={{ fontWeight: 700, color: 'var(--text-heading)', overflowWrap: 'break-word' }}>{row.label}</dt>
                                  <dd style={{ color: 'var(--text-body)', whiteSpace: 'pre-wrap', minWidth: 0, overflowWrap: 'break-word', margin: 0 }}><bdi>{row.value}</bdi></dd>
                                </div>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <StatusBadge tone={form.status === 'submitted' ? 'success' : 'warning'} label={form.status === 'submitted' ? 'מולא' : 'ממתין'} />
                        {form.status === 'sent' && (
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setFormToDelete(form)} title="מחיקת השאלון — הקישור שנשלח ללקוח יבוטל">
                            מחק
                          </Button>
                        )}
                        {form.status === 'submitted' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setOpenFormToken(open ? '' : form.token)}>{open ? 'סגור' : 'צפה'}</Button>
                            <Button size="sm" variant="ghost" onClick={() => window.open(`/client-form-print/${form.token}`, '_blank')} title="פתיחת תצוגת הדפסה — שמירה כ-PDF דרך חלון ההדפסה">
                              הורד PDF
                            </Button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState title="לא נשלחו שאלונים" description='מלא שם ואימייל לקוח בטופס הפגישה וסמן "לשלוח ללקוח שאלון הכנה".' />
            )}
          </Surface>
        </div>
      </section>

      <MeetingPrepSheet
        meeting={prepMeeting}
        forms={forms}
        onClose={() => setPrepMeeting(null)}
        onStart={target => { setPrepMeeting(null); const url = target.meeting_url || (String(target.location || '').startsWith('http') ? target.location : ''); if (url) window.open(url, '_blank', 'noopener'); startLocalMeeting(target as Meeting) }}
      />
      <Dialog
        open={Boolean(meetingToCancel)}
        title="לבטל את הפגישה?"
        description={`הפגישה "${meetingToCancel?.title || ''}" עם ${meetingToCancel?.client_name || 'הלקוח'} ב-${meetingToCancel ? formatWhen(meetingToCancel.starts_at) : ''} תסומן כמבוטלת ותעבור להיסטוריה. הלקוח לא מקבל הודעה אוטומטית.`}
        confirmLabel="בטל פגישה"
        cancelLabel="השאר"
        destructive
        onConfirm={() => { if (meetingToCancel) { void setMeetingStatus(meetingToCancel, 'cancelled'); setMeetingToCancel(null) } }}
        onCancel={() => setMeetingToCancel(null)}
      />
      <Dialog
        open={Boolean(formToDelete)}
        title="למחוק את השאלון?"
        description={`הקישור שנשלח אל ${formToDelete?.client_name || formToDelete?.client_email || 'הלקוח'} יבוטל והלקוח לא יוכל למלא את השאלון. ניתן לשלוח שאלון חדש בכל עת.`}
        confirmLabel="מחק ובטל קישור"
        destructive
        onConfirm={() => void deleteForm()}
        onCancel={() => setFormToDelete(null)}
      />

      {templatePicker && (
        <Sheet
          open
          onClose={() => setTemplatePicker(null)}
          placement="center"
          width="min(440px, 94vw)"
          title="איזה שאלון לשלוח?"
          subtitle={`אל: ${templatePicker.name || templatePicker.email}`}
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" disabled={busy} onClick={() => void sendForm(templatePicker.name, templatePicker.email, chosenTemplateId || undefined)}>
                שלח שאלון
              </Button>
              <Button variant="ghost" onClick={() => setTemplatePicker(null)}>ביטול</Button>
            </div>
          }
        >
          {templates.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {templates.map(template => (
                <label key={template.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', background: chosenTemplateId === template.id ? 'var(--abd-accent-light, var(--bg-surface-sunken))' : 'var(--bg-canvas)', cursor: 'pointer' }}>
                  <input type="radio" name="questionnaire-template" checked={chosenTemplateId === template.id} onChange={() => setChosenTemplateId(template.id)} />
                  <span style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: 13.5 }}>{template.name}</span>
                  {Boolean(template.is_default) && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(בסיס)</span>}
                </label>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>לא נמצאו שאלונים — יישלח השאלון הבסיסי. ניתן ליצור שאלונים בהגדרות → שאלון הכנה.</p>
          )}
        </Sheet>
      )}
    </div>
  )
}

function Field({ label, children, error, id }: { label: string; children: React.ReactNode; error?: string; id?: string }) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      {children}
      {error && <span id={id ? `${id}-error` : undefined} role="alert" style={{ color: 'var(--destructive)', fontWeight: 600, fontSize: 12.5 }}>{error}</span>}
    </label>
  )
}

const layoutStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 18, alignItems: 'start' }
const sectionTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-heading)', fontSize: 16, fontWeight: 700, marginBottom: 14 }
const iconStyle: React.CSSProperties = { flexShrink: 0 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6, color: 'var(--text-heading)', fontWeight: 600, fontSize: 13.5 }
const inputStyle: React.CSSProperties = { minHeight: 40, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontFamily: 'var(--font-main)', fontSize: 14, background: 'var(--bg-canvas)', color: 'var(--text-heading)', width: '100%' }
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }
const venueChipStyle: React.CSSProperties = { border: '1px solid var(--separator-strong, var(--separator))', background: 'var(--bg-surface)', color: 'var(--text-heading)', borderRadius: 999, padding: '6px 12px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const venueChipActiveStyle: React.CSSProperties = { background: 'var(--abd-accent)', color: '#fff', borderColor: 'var(--abd-accent)' }
const checkRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-heading)', cursor: 'pointer' }
const inlineLinkStyle: React.CSSProperties = { border: 0, background: 'transparent', color: 'var(--abd-accent)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }
const noticeStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, marginBottom: 16, fontWeight: 600 }
const meetingRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--bg-canvas)' }
const metaStyle: React.CSSProperties = { display: 'block', color: 'var(--text-muted)', fontSize: 12.5, marginTop: 2 }
const payloadStyle: React.CSSProperties = { display: 'grid', gap: 4, marginTop: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--separator)', fontSize: 13 }
const choiceGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }
const choiceCardStyle: React.CSSProperties = { display: 'grid', gap: 6, justifyItems: 'center', textAlign: 'center', padding: '22px 16px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-canvas)', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', cursor: 'pointer' }
const providerChipStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--separator)', borderRadius: 999, background: 'var(--bg-canvas)' }
