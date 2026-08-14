'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

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

export default function MeetingSummariesHistoryPage() {
  const searchParams = useSearchParams()
  const [summaries, setSummaries] = useState<SummaryListItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const justSaved = searchParams.get('justSaved')

  useEffect(() => {
    fetch('/api/meeting-summaries')
      .then(async response => {
        if (!response.ok) throw new Error('failed')
        const data = await response.json() as { summaries: SummaryListItem[] }
        setSummaries(data.summaries || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar title="סיכומי פגישות" subtitle="ארכיון סיכומים שנשמרו בסיום כל פגישה" />

      {justSaved && (
        <div style={noticeStyle}>הפגישה הסתיימה והסיכום נשמר בהיסטוריה.</div>
      )}
      {status === 'error' && (
        <div style={noticeStyle}>טעינת ההיסטוריה נכשלה — ייתכן שאין חיבור D1 בסביבה הנוכחית.</div>
      )}

      {summaries.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {summaries.map(summary => (
            <Surface key={summary.id} style={rowStyle}>
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
    </main>
  )
}

const noticeStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, marginBottom: 16, fontWeight: 600 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14 }
const metaStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12.5 }
