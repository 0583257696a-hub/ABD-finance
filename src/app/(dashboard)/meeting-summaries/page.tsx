'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { MeetingSummaryData } from '@/types/summary'

/**
 * סיכומי פגישות — archive of every completed meeting session. Written once,
 * at "סיים פגישה" (see /api/meetings action=end-session). Read-only view;
 * the live editable document lives in the meeting-summary tab during an
 * active session.
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
  if (!iso) return '-'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function parseSummary(json: string | null): MeetingSummaryData | null {
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as MeetingSummaryData
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function hasContent(data: MeetingSummaryData | null): boolean {
  if (!data) return false
  return Boolean(
    data.introText ||
    data.facts?.length ||
    data.recommendations?.length ||
    data.manualFollowUps?.length ||
    (data.editedSections && Object.values(data.editedSections).some(Boolean)),
  )
}

export default function MeetingSummariesHistoryPage() {
  const searchParams = useSearchParams()
  const [summaries, setSummaries] = useState<SummaryListItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [openSummary, setOpenSummary] = useState<SummaryDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const justSaved = searchParams.get('justSaved')

  function loadSummaries() {
    setStatus('loading')
    fetch('/api/meeting-summaries')
      .then(async response => {
        if (!response.ok) throw new Error('failed')
        const data = await response.json() as { summaries: SummaryListItem[] }
        setSummaries(data.summaries || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => { loadSummaries() }, [])

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

  const parsed = openSummary ? parseSummary(openSummary.summary_json) : null

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar title="סיכומי פגישות" subtitle="ארכיון סיכומים שנשמרו בסיום כל פגישה — לחיצה על שורה פותחת את הסיכום" />

      {justSaved && (
        <div style={noticeStyle}>הפגישה הסתיימה והסיכום נשמר בהיסטוריה.</div>
      )}
      {status === 'error' && (
        <div style={{ ...noticeStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>טעינת ההיסטוריה נכשלה. נסו שוב, ואם הבעיה נמשכת פנו לתמיכה.</span>
          <Button variant="secondary" size="sm" onClick={loadSummaries}>נסה שוב</Button>
        </div>
      )}

      {summaries.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {summaries.map(summary => (
            <Surface
              key={summary.id}
              style={{ ...rowStyle, cursor: 'pointer', opacity: detailLoading ? 0.7 : 1 }}
              onClick={() => void openDetail(summary.id)}
              role="button"
              tabIndex={0}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') void openDetail(summary.id) }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', color: 'var(--text-heading)' }}>{summary.title || 'סיכום פגישה'}</strong>
                <span style={metaStyle}>{summary.client_name || 'ללא שם לקוח'} · {formatDate(summary.meeting_ended_at || summary.created_at)}</span>
              </div>
              <StatusBadge tone="neutral" label={sourceLabel(summary.source)} />
            </Surface>
          ))}
        </div>
      ) : status === 'ready' ? (
        <Surface style={{ padding: 24 }}>
          <EmptyState icon={<FileText size={30} />} title="אין סיכומים בהיסטוריה" description='סיכום נשמר כאן אוטומטית כשלוחצים "סיים פגישה" בתוך פגישה פעילה.' />
        </Surface>
      ) : null}

      {openSummary && (
        <Sheet
          open
          onClose={() => setOpenSummary(null)}
          placement="center"
          width="min(860px, 96vw)"
          title={openSummary.title || 'סיכום פגישה'}
          subtitle={`${openSummary.client_name || 'ללא שם לקוח'} · ${formatDate(openSummary.meeting_ended_at || openSummary.created_at)} · ${sourceLabel(openSummary.source)}`}
        >
          {hasContent(parsed) ? (
            <div style={{ display: 'grid', gap: 18 }}>
              {parsed?.documentTitle && <h2 style={docTitleStyle}>{parsed.documentTitle}</h2>}
              {parsed?.clientLine && <p style={docMetaStyle}>{parsed.clientLine}</p>}
              {parsed?.introText && (
                <section>
                  <h3 style={sectionTitleStyle}>פתיחה</h3>
                  <p style={docTextStyle}>{parsed.introText}</p>
                </section>
              )}
              {parsed?.facts?.length ? (
                <section>
                  <h3 style={sectionTitleStyle}>תמצית נתונים</h3>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {parsed.facts.map(fact => (
                      <div key={fact.id} style={factRowStyle}>
                        <span style={{ color: 'var(--text-muted)' }}>{fact.label}</span>
                        <strong style={{ color: 'var(--text-heading)' }}>{fact.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {parsed?.recommendations?.length ? (
                <section>
                  <h3 style={sectionTitleStyle}>המלצות</h3>
                  <ul style={listStyle}>
                    {parsed.recommendations.map(item => <li key={item.id} style={docTextStyle}>{item.text}</li>)}
                  </ul>
                </section>
              ) : null}
              {parsed?.manualFollowUps?.length ? (
                <section>
                  <h3 style={sectionTitleStyle}>המשך טיפול</h3>
                  <ul style={listStyle}>
                    {parsed.manualFollowUps.map(item => <li key={item.id} style={docTextStyle}>{item.text}</li>)}
                  </ul>
                </section>
              ) : null}
              {parsed?.editedSections && Object.entries(parsed.editedSections).filter(([, text]) => Boolean(text)).map(([key, text]) => (
                <section key={key}>
                  <h3 style={sectionTitleStyle}>{key}</h3>
                  <p style={{ ...docTextStyle, whiteSpace: 'pre-wrap' }}>{text}</p>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText size={28} />}
              title="הסיכום נשמר ריק"
              description="הפגישה הסתיימה לפני שנכתב תוכן במסמך הסיכום, ולכן אין כאן מה להציג."
            />
          )}
        </Sheet>
      )}
    </div>
  )
}

const noticeStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, marginBottom: 16, fontWeight: 600 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14 }
const metaStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12.5 }
const docTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 20, fontWeight: 700, margin: 0 }
const docMetaStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 15, fontWeight: 700, marginBottom: 8 }
const docTextStyle: React.CSSProperties = { color: 'var(--text-body, #374151)', fontSize: 14, lineHeight: 1.8, margin: 0 }
const listStyle: React.CSSProperties = { margin: 0, paddingInlineStart: 20, display: 'grid', gap: 6 }
const factRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)', fontSize: 13.5 }
