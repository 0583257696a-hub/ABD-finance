'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart2,
  Calculator,
  FileText,
  Home,
  Lightbulb,
  LineChart,
  LogOut,
  Mic,
  Radar,
  Settings,
  Shield,
  Square,
  StickyNote,
  TrendingUp,
} from 'lucide-react'
import FundsWorkspace from '@/components/features/FundsWorkspace'
import InsurancePage from '@/app/(dashboard)/insurance/page'
import RecommendationsPage from '@/app/(dashboard)/recommendations/page'
import SimulationsPage from '@/app/(dashboard)/simulations/page'
import CalculatorsPage from '@/app/(dashboard)/calculators/page'
import ReturnsPage from '@/app/(dashboard)/returns/page'
import AbdReturnsPage from '@/app/(dashboard)/abd-returns/page'
import SmartAgentPage from '@/app/(dashboard)/smart-agent/page'
import MeetingSummaryPage from '@/app/(dashboard)/meeting-summary/page'
import { Button } from '@/components/ui/Button'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'

/**
 * Meeting Workspace — the MeetingShell. Architecturally separate from
 * AppShell: own header (session status/timer/end-button), own nav, no
 * dashboard Sidebar. See src/lib/calendar/types.ts for the Meeting model
 * this session metadata (title/client/source) comes from.
 *
 * Honest scope note: this app's underlying client data (funds/insurance/
 * needs) lives in ONE active-workspace store, not per-meeting-id — that's
 * the existing architecture (an advisor works one client's file at a time,
 * exactly like the desk workflow). Meeting Workspace wraps that existing,
 * working workspace in session chrome; it does not re-architect the data
 * layer to be multi-tenant per meeting (a separate, much larger change).
 */

type MeetingRecord = {
  id: string
  title: string
  client_name: string
  status: 'scheduled' | 'done' | 'cancelled'
  started_at: string | null
  ended_at: string | null
  source: string
  notes: string
}

type MeetingTab = 'overview' | 'insurance' | 'recommendations' | 'summary' | 'tools' | 'calculators' | 'client-returns' | 'abd-returns' | 'smart-agent' | 'notes' | 'settings'

// The full feature set lives here and only here (per the app's hierarchy:
// a minimal dashboard for meetings/settings, full features gated behind an
// active meeting) — this NAV is the complete list of what an advisor can do
// inside a meeting.
const NAV: Array<{ id: MeetingTab; label: string; icon: typeof Home }> = [
  { id: 'overview', label: 'קופות', icon: Home },
  { id: 'insurance', label: 'ביטוח', icon: Shield },
  { id: 'recommendations', label: 'המלצות', icon: Lightbulb },
  { id: 'summary', label: 'סיכום פגישה', icon: FileText },
  { id: 'tools', label: 'כלים', icon: TrendingUp },
  { id: 'calculators', label: 'מחשבונים', icon: Calculator },
  { id: 'client-returns', label: 'תשואות הלקוח', icon: BarChart2 },
  { id: 'abd-returns', label: 'תשואות השוק', icon: LineChart },
  { id: 'smart-agent', label: 'Smart Agent', icon: Radar },
  { id: 'notes', label: 'הערות', icon: StickyNote },
  { id: 'settings', label: 'הגדרות פגישה', icon: Settings },
]

function formatDuration(startedAt: string | null): string {
  if (!startedAt) return '00:00'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MeetingWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tab, setTab] = useState<MeetingTab>('overview')
  const [notes, setNotes] = useState('')
  const [tick, setTick] = useState(0)
  const [ending, setEnding] = useState(false)

  const meetingSummary = useWorkspaceStore(state => state.meetingSummary)
  const workspaceClient = useWorkspaceStore(state => state.client)
  const workspaceClientName = workspaceClient?.fullName || [workspaceClient?.firstName, workspaceClient?.lastName].filter(Boolean).join(' ') || ''

  useEffect(() => {
    let cancelled = false
    fetch('/api/meetings').then(async response => {
      if (!response.ok) throw new Error('failed')
      const data = await response.json() as { meetings: MeetingRecord[] }
      const found = data.meetings.find(item => item.id === id)
      if (cancelled) return
      if (!found) { setLoadState('error'); return }
      setMeeting(found)
      setNotes(found.notes || '')
      setLoadState('ready')
      if (!found.started_at) {
        await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start-session', id }),
        })
      }
    }).catch(() => { if (!cancelled) setLoadState('error') })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const interval = setInterval(() => setTick(current => current + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const duration = useMemo(() => formatDuration(meeting?.started_at ?? new Date().toISOString()), [meeting?.started_at, tick])

  async function endMeeting() {
    if (!meeting || ending) return
    setEnding(true)
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end-session', id: meeting.id, summary: meetingSummary, clientName: workspaceClientName }),
      })
      const data = await response.json() as { ok?: boolean; summaryId?: string }
      if (data.ok) {
        router.push(data.summaryId ? `/?tab=meeting-summaries&justSaved=${data.summaryId}` : '/?tab=meetings')
      } else {
        setEnding(false)
      }
    } catch {
      setEnding(false)
    }
  }

  async function saveNotes(value: string) {
    setNotes(value)
    if (!meeting) return
    await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save-notes', id: meeting.id, notes: value }),
    }).catch(() => {})
  }

  if (loadState === 'loading') {
    return <div style={centerStyle}>טוען פגישה…</div>
  }
  if (loadState === 'error' || !meeting) {
    return (
      <div style={centerStyle}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-heading)', fontWeight: 700, marginBottom: 10 }}>הפגישה לא נמצאה.</p>
          <Button variant="secondary" onClick={() => router.push('/?tab=meetings')}>חזרה לפגישות</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={liveDotStyle} />
          <strong style={{ color: 'var(--text-heading)', fontSize: 15 }}>פגישה פעילה</strong>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-heading)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meeting.title}{meeting.client_name ? ` · ${meeting.client_name}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={durationStyle}>{duration}</span>
          <Button variant="secondary" size="sm" disabled title="הקלטה ותמלול — בקרוב">
            <Mic size={14} style={{ marginLeft: 6 }} /> תמלול
          </Button>
          <Button variant="primary" size="sm" disabled={ending} onClick={() => void endMeeting()}>
            <Square size={13} style={{ marginLeft: 6 }} /> {ending ? 'מסיים…' : 'סיים פגישה'}
          </Button>
          <Button variant="ghost" size="sm" title="התנתק מהמערכת" onClick={() => { window.location.href = '/api/auth/logout' }}>
            <LogOut size={14} style={{ marginLeft: 6 }} /> התנתק
          </Button>
        </div>
      </header>

      <div style={bodyStyle}>
        <nav style={navStyle}>
          {NAV.map(item => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} style={navButtonStyle(active)}>
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <main style={contentStyle}>
          {tab === 'overview' && <FundsWorkspace />}
          {tab === 'insurance' && <InsurancePage />}
          {tab === 'recommendations' && <RecommendationsPage />}
          {tab === 'summary' && <MeetingSummaryPage />}
          {tab === 'tools' && <SimulationsPage />}
          {tab === 'calculators' && <CalculatorsPage />}
          {tab === 'client-returns' && <ReturnsPage />}
          {tab === 'abd-returns' && <AbdReturnsPage />}
          {tab === 'smart-agent' && <SmartAgentPage />}
          {tab === 'notes' && (
            <div style={{ maxWidth: 720 }}>
              <h2 style={{ color: 'var(--text-heading)', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>הערות פגישה</h2>
              <textarea
                value={notes}
                onChange={event => void saveNotes(event.target.value)}
                rows={16}
                placeholder="הערות חופשיות לפגישה הנוכחית — נשמר אוטומטית."
                style={notesInputStyle}
              />
            </div>
          )}
          {tab === 'settings' && (
            <div style={{ maxWidth: 480, display: 'grid', gap: 10 }}>
              <h2 style={{ color: 'var(--text-heading)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>פרטי הפגישה</h2>
              <InfoRow label="כותרת" value={meeting.title} />
              <InfoRow label="לקוח" value={meeting.client_name || '-'} />
              <InfoRow label="מקור" value={sourceLabel(meeting.source)} />
              <InfoRow label="התחלה" value={meeting.started_at ? new Date(meeting.started_at).toLocaleString('he-IL') : '-'} />
              <InfoRow label="AI" value="זמין בטאב הסיכום (כפתור 'טיוטת AI')" />
              <p style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
                יש לך בעיה? פנה למרכז התמיכה של ABD Finance:{' '}
                <a href="mailto:support@abd-finance.co.il" style={{ color: 'var(--abd-accent)', fontWeight: 700, textDecoration: 'none' }}>support@abd-finance.co.il</a>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function sourceLabel(source: string): string {
  if (source === 'google_calendar') return 'Google Calendar'
  if (source === 'microsoft_outlook') return 'Microsoft Outlook'
  if (source === 'calendly') return 'Calendly'
  return 'פגישה ספונטנית'
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <strong style={{ color: 'var(--text-heading)', fontSize: 13.5 }}>{value}</strong>
    </div>
  )
}

const centerStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-main)' }
const shellStyle: React.CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-main)' }
const headerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '12px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--separator)' }
const liveDotStyle: React.CSSProperties = { width: 9, height: 9, borderRadius: 999, background: 'var(--destructive)', flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }
const durationStyle: React.CSSProperties = { color: 'var(--text-heading)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 14, direction: 'ltr' }
const bodyStyle: React.CSSProperties = { display: 'flex', flex: 1, minHeight: 0 }
const navStyle: React.CSSProperties = { width: 190, flexShrink: 0, display: 'grid', gap: 2, alignContent: 'start', padding: 14, background: 'var(--bg-surface-sunken)', borderLeft: '1px solid var(--separator)' }
const contentStyle: React.CSSProperties = { flex: 1, minWidth: 0, padding: 20, overflow: 'auto' }
const notesInputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 14, fontFamily: 'var(--font-main)', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-heading)', resize: 'vertical', lineHeight: 1.7 }

function navButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    minHeight: 38,
    padding: '0 10px',
    border: 0,
    borderRadius: 8,
    background: active ? 'var(--bg-surface)' : 'transparent',
    boxShadow: active ? 'var(--shadow-1)' : 'none',
    color: 'var(--text-heading)',
    fontFamily: 'var(--font-main)',
    fontWeight: active ? 700 : 500,
    fontSize: 13.5,
    textAlign: 'right',
    cursor: 'pointer',
  }
}
