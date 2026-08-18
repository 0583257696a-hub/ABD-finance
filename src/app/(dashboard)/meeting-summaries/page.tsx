'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, Download, Trash2 } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Dialog } from '@/components/ui/Dialog'
import { SearchField } from '@/components/ui/SearchField'
import { formatDate as formatDateShared, formatTime as formatTimeShared } from '@/lib/format-date'
import { MeetingSummaryDocument } from '@/components/features/MeetingSummaryDocument'
import { parseSummaryDocument, summaryHasContent } from '@/lib/meeting-summary-doc'

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
  const [summaries, setSummaries] = useState<SummaryListItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [openSummary, setOpenSummary] = useState<SummaryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toDelete, setToDelete] = useState<SummaryListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const justSaved = searchParams.get('justSaved')

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
  const visible = summaries.filter(summary => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [summary.client_name, summary.title, formatDate(summary.meeting_ended_at || summary.created_at), sourceLabel(summary.source)].some(value => String(value || '').toLowerCase().includes(q))
  })

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar title="סיכומי פגישות" subtitle="ארכיון הסיכומים שנשמרו בסיום כל פגישה — לחיצה על שורה פותחת את הסיכום" />

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
                <Button variant="primary" onClick={() => openSummaryPdf(openSummary.id)}>
                  <Download size={16} /> הורד PDF
                </Button>
              </div>
            </div>
          }
        >
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
