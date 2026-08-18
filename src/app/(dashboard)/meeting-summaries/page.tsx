'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, Download, Trash2, Send, MessageCircle, Database } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/Toast'
import { Toolbar } from '@/components/ui/Toolbar'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Dialog } from '@/components/ui/Dialog'
import { SearchField } from '@/components/ui/SearchField'
import { MeetingsSwitch } from '@/components/features/MeetingsSwitch'
import { formatDate as formatDateShared, formatTime as formatTimeShared } from '@/lib/format-date'
import { MeetingSummaryDocument } from '@/components/features/MeetingSummaryDocument'
import { parseSummaryDocument, summaryHasContent, summaryToWhatsAppText } from '@/lib/meeting-summary-doc'

/**
 * סיכומי פגישות — archive of every completed meeting session. Written once,
 * at "סיים פגישה" (see /api/meetings action=end-session). The live editable
 * document lives in the meeting-summary tab during an active session.
 *
 * The list leads with the CLIENT — that's how an advisor scans an archive.
 * The meeting title is secondary. Each row opens the document in a sheet;
 * "הורד PDF" opens the print view (browser print → save as PDF) in a new tab.
 */

type SummaryListItem = {
  id: string
  meeting_id: string | null
  title: string
  client_name: string
  source: string
  external_event_id: string | null
  meeting_started_at: string | null
  meeting_ended_at: string | null
  created_at: string
}

type SummaryDetail = SummaryListItem & { summary_json: string | null }

function sourceLabel(source: string): string {
  if (source === 'google_calendar') return 'Google Calendar'
  if (source === 'microsoft_outlook') return 'Outlook'
  if (source === 'calendly') return 'Calendly'
  return 'ספונטנית'
}

function formatDate(iso: string | null): string {
  return formatDateShared(iso, '-')
}

function formatTime(iso: string | null): string {
  return formatTimeShared(iso, '')
}

function openSummaryPdf(id: string) {
  window.open(`/meeting-summary-print/${encodeURIComponent(id)}`, '_blank', 'noopener')
}

export default function MeetingSummariesHistoryPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [summaries, setSummaries] = useState<SummaryListItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [openSummary, setOpenSummary] = useState<SummaryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toDelete, setToDelete] = useState<SummaryListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [crmConnected, setCrmConnected] = useState(false)
  const [crmBusy, setCrmBusy] = useState(false)
  const toast = useToast()
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sending, setSending] = useState(false)

  async function sendToClient() {
    if (!openSummary || sending) return
    // Blank recipient → the API uses the meeting's client email.
    setSending(true)
    try {
      const response = await fetch('/api/meeting-summaries/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: openSummary.id, to: sendTo, note: sendNote }) })
      const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string }
      const sentTo = (data as { to?: string }).to || sendTo
      if (data.ok) { toast(`הסיכום נשלח אל ${sentTo}.`, 'success'); setSendOpen(false); setSendNote('') }
      else toast(data.error === 'missing-recipient' ? 'לפגישה אין אימייל לקוח — הזן כתובת.' : data.error === 'empty-summary' ? 'הסיכום ריק — אין מה לשלוח.' : 'שליחת הסיכום נכשלה. בדוק את חיבור המייל בהגדרות.', 'error')
    } finally {
      setSending(false)
    }
  }
  const [search, setSearch] = useState('')
  const justSaved = searchParams.get('justSaved')
  // Deep link from the ⌘K palette: ?open=<id> opens that summary directly.
  const deepOpen = searchParams.get('open')
  const openedDeepRef = useRef('')
  useEffect(() => {
    if (!deepOpen || status !== 'ready' || openedDeepRef.current === deepOpen) return
    openedDeepRef.current = deepOpen
    void openDetail(deepOpen)
  }, [deepOpen, status])

  // Reload by bumping the key; the effect owns the fetch (keeps the
  // react-hooks/set-state-in-effect rule honest — no sync setState in effect).
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetch('/api/meeting-summaries')
      .then(async response => {
        if (!response.ok) throw new Error('failed')
        const data = await response.json() as { summaries: SummaryListItem[] }
        if (cancelled) return
        setSummaries(data.summaries || [])
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [reloadKey])

  // CRM: is there an active connection? Drives the "שלח ל-CRM" button in the viewer.
  useEffect(() => {
    let cancelled = false
    fetch('/api/crm').then(async response => {
      if (!response.ok) return
      const payload = await response.json() as { providers?: Array<{ connected?: boolean }> }
      if (!cancelled) setCrmConnected(Boolean(payload.providers?.some(item => item.connected)))
    }).catch(() => null)
    return () => { cancelled = true }
  }, [])

  async function syncToCrm() {
    if (!openSummary) return
    setCrmBusy(true)
    try {
      const response = await fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync-summary', summaryId: openSummary.id }) })
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; result?: { tasks?: number; note?: unknown; contact?: unknown; errors?: string[]; skipped?: string[] } }
      if (payload.ok) {
        const parts = [payload.result?.contact ? 'לקוח' : '', payload.result?.note ? 'הערה' : '', payload.result?.tasks ? `${payload.result.tasks} משימות` : ''].filter(Boolean)
        toast(parts.length ? `נשלח ל-CRM: ${parts.join(', ')}` : (payload.result?.skipped?.[0] || 'לא היה מה לשלוח (כבר סונכרן).'), 'success')
      } else {
        toast(payload.result?.errors?.[0] || 'השליחה ל-CRM נכשלה.', 'error')
      }
    } catch {
      toast('שגיאת רשת בשליחה ל-CRM.', 'error')
    } finally { setCrmBusy(false) }
  }

  function retry() {
    setStatus('loading')
    setReloadKey(key => key + 1)
  }

  async function openDetail(id: string) {
    setDetailLoading(true)
    try {
      const response = await fetch(`/api/meeting-summaries?id=${encodeURIComponent(id)}`)
      if (!response.ok) return
      const data = await response.json() as { summary: SummaryDetail }
      setOpenSummary(data.summary)
    } finally {
      setDetailLoading(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/meeting-summaries?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE' })
      if (response.ok) {
        setSummaries(current => current.filter(item => item.id !== toDelete.id))
        if (openSummary?.id === toDelete.id) setOpenSummary(null)
      }
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  const parsed = openSummary ? parseSummaryDocument(openSummary.summary_json) : null

  // WhatsApp share (proposal §5): opens WhatsApp with the short text prefilled;
  // the advisor picks the contact there. No API, no phone number stored here.
  function shareWhatsApp() {
    if (!openSummary || !parsed) return
    const text = summaryToWhatsAppText(parsed, {
      clientName: openSummary.client_name || undefined,
      advisorName: session?.user?.name || undefined,
      dateLabel: formatDate(openSummary.meeting_ended_at || openSummary.created_at),
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }
  const visible = summaries.filter(summary => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [summary.client_name, summary.title, formatDate(summary.meeting_ended_at || summary.created_at), sourceLabel(summary.source)].some(value => String(value || '').toLowerCase().includes(q))
  })

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar title="פגישות" subtitle="ארכיון הסיכומים שנשמרו בסיום כל פגישה — לחיצה על שורה פותחת את הסיכום" />
      <MeetingsSwitch active="archive" />

      {justSaved && (
        <div style={noticeStyle}>הפגישה הסתיימה והסיכום נשמר בארכיון.</div>
      )}
      {status === 'error' && (
        <div style={{ ...noticeStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>טעינת הארכיון נכשלה. נסו שוב, ואם הבעיה נמשכת פנו לתמיכה.</span>
          <Button variant="secondary" size="sm" onClick={retry}>נסה שוב</Button>
        </div>
      )}

      {summaries.length > 0 && (
        <div style={{ maxWidth: 420, marginBottom: 12 }}>
          <SearchField value={search} onChange={setSearch} placeholder="חיפוש לפי שם לקוח, נושא או תאריך…" />
        </div>
      )}
      {visible.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {visible.map(summary => {
            const endedAt = summary.meeting_ended_at || summary.created_at
            const clientName = summary.client_name?.trim()
            return (
              <Surface
                key={summary.id}
                style={{ ...rowStyle, cursor: 'pointer', opacity: detailLoading ? 0.7 : 1 }}
                onClick={() => void openDetail(summary.id)}
                role="button"
                tabIndex={0}
                aria-label={`פתיחת סיכום — ${clientName || 'ללא שם לקוח'}`}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openDetail(summary.id) } }}
              >
                <div style={{ minWidth: 0, display: 'grid', gap: 3 }}>
                  <strong style={{ color: 'var(--text-heading)', fontSize: 15.5, overflowWrap: 'anywhere' }}>
                    {clientName || <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>ללא שם לקוח</span>}
                  </strong>
                  <span style={metaStyle}>
                    {summary.title || 'סיכום פגישה'} · {formatDate(endedAt)}{formatTime(endedAt) ? ` ${formatTime(endedAt)}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={event => event.stopPropagation()}>
                  <span title={summary.source === 'spontaneous' || !summary.source ? 'פגישה שנפתחה ידנית, ללא זימון מהיומן' : 'מקור הפגישה ביומן המחובר'}><StatusBadge tone="neutral" label={sourceLabel(summary.source)} /></span>
                  <Button variant="secondary" size="sm" onClick={() => openSummaryPdf(summary.id)} aria-label="הורדת הסיכום כ-PDF">
                    <Download size={15} /> PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(summary)} aria-label="מחיקת הסיכום">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </Surface>
            )
          })}
        </div>
      ) : status === 'ready' && summaries.length ? (
        <Surface style={{ padding: 24 }}><EmptyState icon={<FileText size={30} />} title="לא נמצאו סיכומים" description="נסה חיפוש אחר." /></Surface>
      ) : status === 'ready' ? (
        <Surface style={{ padding: 24 }}>
          <EmptyState icon={<FileText size={30} />} title="אין סיכומים בארכיון" description='סיכום נשמר כאן אוטומטית כשלוחצים "סיים פגישה" בתוך פגישה פעילה.' />
        </Surface>
      ) : null}

      {openSummary && (
        <Sheet
          open
          onClose={() => setOpenSummary(null)}
          placement="center"
          width="min(860px, calc(100vw - 32px))"
          title={openSummary.client_name?.trim() || 'ללא שם לקוח'}
          subtitle={`${openSummary.title || 'סיכום פגישה'} · ${formatDate(openSummary.meeting_ended_at || openSummary.created_at)} · ${sourceLabel(openSummary.source)}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="ghost" size="sm" onClick={() => setToDelete(openSummary)}>
                <Trash2 size={15} /> מחיקת הסיכום
              </Button>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={() => setOpenSummary(null)}>סגירה</Button>
                <Button variant="secondary" onClick={() => openSummaryPdf(openSummary.id)}>
                  <Download size={16} /> PDF
                </Button>
                <Button variant="secondary" onClick={shareWhatsApp} title="פותח וואטסאפ עם תמצית הסיכום (המלצות והמשך טיפול) — בוחרים את איש הקשר שם">
                  <MessageCircle size={16} /> וואטסאפ
                </Button>
                {crmConnected && (
                  <Button variant="secondary" disabled={crmBusy} onClick={() => void syncToCrm()} title="שולח את הלקוח, הסיכום כהערה ומשימות ההמשך ל-CRM המחובר (לפי ההגדרות)">
                    <Database size={16} /> {crmBusy ? 'שולח…' : 'שלח ל-CRM'}
                  </Button>
                )}
                <Button variant="primary" onClick={() => { setSendTo(''); setSendOpen(true) }} title="שולח את הסיכום ללקוח במייל, מהכתובת שלך">
                  <Send size={15} /> שלח ללקוח
                </Button>
              </div>
            </div>
          }
        >
          {sendOpen && (
            <div style={{ display: 'grid', gap: 8, padding: 12, marginBottom: 14, background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)' }}>
              <strong style={{ color: 'var(--text-heading)', fontSize: 14 }}>שליחת הסיכום ללקוח במייל</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'end' }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                  <span>אימייל הלקוח</span>
                  <input dir="ltr" type="email" value={sendTo} onChange={event => setSendTo(event.target.value)} placeholder="ריק = האימייל של הלקוח מהפגישה" style={{ minHeight: 40, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-heading)', width: '100%' }} />
                </label>
                <Button variant="primary" disabled={sending} onClick={() => void sendToClient()}>{sending ? 'שולח…' : 'שלח'}</Button>
              </div>
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                <span>הודעה אישית (לא חובה)</span>
                <textarea rows={2} value={sendNote} onChange={event => setSendNote(event.target.value)} placeholder="שלום ישראל, מצורף סיכום הפגישה שלנו…" style={{ border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-heading)', resize: 'vertical' }} />
              </label>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>המייל כולל את הסיכום המלא (תמצית נתונים, המלצות, המשך טיפול) והסתייגות מקצועית, ונשלח מהכתובת שלך עם Reply-To אליך.</span>
            </div>
          )}
          {parsed && summaryHasContent(parsed) ? (
            <MeetingSummaryDocument doc={parsed} />
          ) : (
            <EmptyState
              icon={<FileText size={28} />}
              title="הסיכום נשמר ריק"
              description="הפגישה הסתיימה לפני שנטענו נתוני לקוח או שנכתב תוכן במסמך הסיכום, ולכן אין כאן מה להציג. ניתן למחוק את הרשומה."
            />
          )}
        </Sheet>
      )}

      <Dialog
        open={Boolean(toDelete)}
        title="למחוק את הסיכום?"
        description={`הסיכום של ${toDelete?.client_name?.trim() || 'הפגישה'} מתאריך ${formatDate(toDelete?.meeting_ended_at || toDelete?.created_at || null)} יימחק לצמיתות מהארכיון. הפגישה עצמה נשארת ברשימת הפגישות.`}
        confirmLabel={deleting ? 'מוחק…' : 'מחק סיכום'}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => { if (!deleting) setToDelete(null) }}
      />
    </div>
  )
}

const noticeStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, marginBottom: 16, fontWeight: 600 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px' }
const metaStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12.5 }
