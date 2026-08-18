'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart2,
  FileText,
  Home,
  Lightbulb,
  LogOut,
  Mic,
  Settings,
  Square,
  StickyNote,
} from 'lucide-react'
import FundsWorkspace from '@/components/features/FundsWorkspace'
import InsurancePage from '@/app/(dashboard)/insurance/page'
import RecommendationsPage from '@/app/(dashboard)/recommendations/page'
import SimulationsPage from '@/app/(dashboard)/simulations/page'
import ReturnsPage from '@/app/(dashboard)/returns/page'
import AbdReturnsPage from '@/app/(dashboard)/abd-returns/page'
import SmartAgentPage from '@/app/(dashboard)/smart-agent/page'
import MeetingSummaryPage from '@/app/(dashboard)/meeting-summary/page'
import { Button } from '@/components/ui/Button'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { clearClientDataStorage, WORKSPACE_MEETING_ID_KEY } from '@/lib/client-data-keys'
import { Dialog } from '@/components/ui/Dialog'
import { Sheet } from '@/components/ui/Sheet'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { loadStoredFindings, runAnalysis } from '@/lib/smart-agent/engine'
import { RecordingPanel } from '@/components/features/RecordingPanel'

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

/**
 * The meeting is a 4-step flow — the order an advisor actually works in:
 * look at what there is → analyse → recommend → summarise. Everything else
 * (notes, meeting details) is a non-intrusive tool in the header, not a
 * destination. Each step shows its state under its name so the advisor
 * sees at a glance what's missing without entering it.
 */
type MeetingStep = 'portfolio' | 'analysis' | 'recommendations' | 'summary'
type PortfolioView = 'funds' | 'insurance'
type AnalysisView = 'client-returns' | 'market-returns' | 'calculators' | 'smart-agent'

const STEPS: Array<{ id: MeetingStep; label: string; icon: typeof Home }> = [
  { id: 'portfolio', label: 'התיק', icon: Home },
  { id: 'analysis', label: 'ניתוח', icon: BarChart2 },
  { id: 'recommendations', label: 'המלצות', icon: Lightbulb },
  { id: 'summary', label: 'סיכום', icon: FileText },
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
  const [step, setStep] = useState<MeetingStep>('portfolio')
  const [portfolioView, setPortfolioView] = useState<PortfolioView>('funds')
  const [analysisView, setAnalysisView] = useState<AnalysisView>('client-returns')
  const [notesOpen, setNotesOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [recordingOpen, setRecordingOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [tick, setTick] = useState(0)
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace)

  const meetingSummary = useWorkspaceStore(state => state.meetingSummary)
  const storeFunds = useWorkspaceStore(state => state.funds)
  const storeInsurance = useWorkspaceStore(state => state.insurancePolicies)
  const storeDeals = useWorkspaceStore(state => state.trackingDeals)
  // Same detections as the row chips and the Smart Agent view (one engine), minus dismissed/resolved.
  const flagCount = useMemo(() => {
    if (!storeFunds.length && !storeInsurance.length) return 0
    try {
      const result = runAnalysis(storeFunds, storeInsurance, loadStoredFindings().findings)
      return result.findings.filter(finding => finding.status !== 'DISMISSED' && finding.status !== 'RESOLVED').length
    } catch { return 0 }
  }, [storeFunds, storeInsurance])
  const stepStatus: Record<MeetingStep, string> = {
    portfolio: storeFunds.length || storeInsurance.length ? `${storeFunds.length} קופות${storeInsurance.length ? ` · ${storeInsurance.length} פוליסות` : ''}` : 'טרם יובא קובץ',
    analysis: storeFunds.length ? (flagCount ? `${flagCount} דגלים` : 'ללא דגלים') : '—',
    recommendations: storeDeals.length ? `${storeDeals.length} המלצות` : 'אין עדיין',
    summary: (meetingSummary.recommendations?.length || meetingSummary.facts?.length) ? 'טיוטה' : 'ריק',
  }
  const stepIndex = STEPS.findIndex(item => item.id === step)
  const nextStep = STEPS[stepIndex + 1]

  // "N" opens the notes pad from anywhere (not while typing in a field).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return
      if ((event.key === 'n' || event.key === 'N' || event.key === 'נ') && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        setNotesOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
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
      // Workspace ↔ meeting binding: the client file in the browser belongs to
      // exactly one meeting. If it was loaded for a different meeting (or for
      // none), wipe it — a spontaneous meeting must never open on the previous
      // client's funds. The meetings page sets the marker when it starts a
      // meeting (after prefill), so a legit prefill survives this check.
      try {
        const bound = localStorage.getItem(WORKSPACE_MEETING_ID_KEY)
        if (bound !== id) {
          resetWorkspace()
          localStorage.setItem(WORKSPACE_MEETING_ID_KEY, id)
        }
      } catch { /* storage unavailable — nothing to guard */ }
      setMeeting(found)
      setNotes(found.notes || '')
      setLoadState('ready')
      if (!found.started_at) {
        const startedAt = new Date().toISOString()
        // Reflect the start locally right away — the timer runs off started_at.
        setMeeting(current => current ? { ...current, started_at: startedAt } : current)
        await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start-session', id }),
        }).catch(() => {})
      }
    }).catch(() => { if (!cancelled) setLoadState('error') })
    return () => { cancelled = true }
  }, [id, resetWorkspace])

  useEffect(() => {
    const interval = setInterval(() => setTick(current => current + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Computed from the start timestamp every tick (not an accumulating counter), so it stays right after the tab was in the background.
  const duration = useMemo(() => formatDuration(meeting?.started_at ?? null), [meeting?.started_at, tick])

  async function endMeeting() {
    if (!meeting || ending) return
    setEnding(true)
    setEndError('')
    // Screenshots are base64 images — megabytes that D1 can't hold in one row
    // (the summary column is capped) and that make the request crawl. Archive
    // captions only; the images stay in the live document during the meeting.
    const summaryForArchive = {
      ...meetingSummary,
      screenshots: (meetingSummary.screenshots || []).map(shot => ({ id: shot.id, caption: shot.caption || '', imageData: '' })),
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end-session', id: meeting.id, summary: summaryForArchive, clientName: workspaceClientName }),
        signal: controller.signal,
      })
      const data = await response.json().catch(() => ({})) as { ok?: boolean; summaryId?: string; error?: string }
      if (data.ok) {
        // The client's file has done its job — clear it from this browser.
        clearClientDataStorage()
        resetWorkspace()
        router.push(data.summaryId ? `/?tab=meeting-summaries&justSaved=${data.summaryId}` : '/?tab=meetings')
        return
      }
      setEndError(data.error === 'not-found' ? 'הפגישה לא נמצאה בשרת.' : 'שמירת הסיכום נכשלה. הנתונים נשמרו בדפדפן — אפשר לנסות שוב.')
    } catch (error) {
      setEndError((error as Error)?.name === 'AbortError'
        ? 'השרת לא הגיב תוך 20 שניות. הנתונים נשמרו בדפדפן — נסה שוב או בדוק את החיבור.'
        : 'שגיאת רשת בסיום הפגישה. הנתונים נשמרו בדפדפן — נסה שוב.')
    } finally {
      window.clearTimeout(timeout)
      setEnding(false)
    }
  }

  function logout() {
    clearClientDataStorage()
    window.location.href = '/api/auth/logout'
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
      <header style={headerStyle} data-meeting-header>
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
          <Button variant="secondary" size="sm" onClick={() => setRecordingOpen(true)} title="הקלטה ותמלול — באישור הלקוח">
            <Mic size={14} style={{ marginLeft: 6 }} /> הקלטה
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setNotesOpen(true)} title="הערות פגישה (קיצור: N)">
            <StickyNote size={14} style={{ marginLeft: 6 }} /> הערות
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDetailsOpen(true)} title="פרטי הפגישה" aria-label="פרטי הפגישה">
            <Settings size={15} />
          </Button>
          <Button variant="primary" size="sm" disabled={ending} onClick={() => void endMeeting()}>
            <Square size={13} style={{ marginLeft: 6 }} /> {ending ? 'מסיים…' : 'סיים פגישה'}
          </Button>
          <Button variant="ghost" size="sm" title="התנתק מהמערכת" onClick={() => setConfirmLogout(true)}>
            <LogOut size={14} style={{ marginLeft: 6 }} /> התנתק
          </Button>
        </div>
      </header>
      {endError && (
        <div role="alert" style={endErrorStyle}>
          <span>{endError}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setEndError('')}>המשך בפגישה</Button>
            <Button variant="primary" size="sm" onClick={() => void endMeeting()}>נסה שוב</Button>
          </div>
        </div>
      )}
      <Dialog
        open={confirmLogout}
        title="להתנתק באמצע הפגישה?"
        description="ההתנתקות תנקה את נתוני הלקוח מהדפדפן. הסיכום לא יישמר בארכיון אלא אם תלחץ קודם על „סיים פגישה”."
        confirmLabel="התנתק"
        destructive
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />

      <nav style={stepperStyle} data-meeting-nav aria-label="שלבי הפגישה">
        {STEPS.map((item, index) => {
          const Icon = item.icon
          const active = step === item.id
          const done = index < stepIndex
          return (
            <button key={item.id} type="button" onClick={() => setStep(item.id)} style={stepButtonStyle(active, done)} aria-current={active ? 'step' : undefined}>
              <span style={stepBadgeStyle(active, done)}>{done ? '✓' : index + 1}</span>
              <span style={{ display: 'grid', gap: 1, textAlign: 'start', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Icon size={14} /> {item.label}</span>
                <span style={{ fontSize: 11.5, color: active ? 'var(--abd-accent)' : 'var(--text-muted)', fontWeight: 500 }}>{stepStatus[item.id]}</span>
              </span>
              {index < STEPS.length - 1 && <span style={stepConnectorStyle} aria-hidden />}
            </button>
          )
        })}
      </nav>

      <div style={bodyStyle} data-meeting-body>
        <main style={contentStyle} data-meeting-content>
          {step === 'portfolio' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <SegmentedControl<PortfolioView>
                value={portfolioView}
                onChange={setPortfolioView}
                options={[{ value: 'funds', label: `פנסיוני${storeFunds.length ? ` (${storeFunds.length})` : ''}` }, { value: 'insurance', label: `ביטוחי${storeInsurance.length ? ` (${storeInsurance.length})` : ''}` }]}
              />
              {portfolioView === 'funds' ? <FundsWorkspace /> : <InsurancePage />}
            </div>
          )}
          {step === 'analysis' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <SegmentedControl<AnalysisView>
                value={analysisView}
                onChange={setAnalysisView}
                options={[
                  { value: 'client-returns', label: 'תשואות הלקוח' },
                  { value: 'market-returns', label: 'תשואות השוק' },
                  { value: 'calculators', label: 'מחשבונים וסימולציות' },
                  { value: 'smart-agent', label: `Smart Agent${flagCount ? ` (${flagCount})` : ''}` },
                ]}
              />
              {analysisView === 'client-returns' && <ReturnsPage />}
              {analysisView === 'market-returns' && <AbdReturnsPage />}
              {analysisView === 'calculators' && <SimulationsPage />}
              {analysisView === 'smart-agent' && <SmartAgentPage />}
            </div>
          )}
          {step === 'recommendations' && <RecommendationsPage />}
          {step === 'summary' && <MeetingSummaryPage />}

          {nextStep && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--separator)' }}>
              <Button variant="primary" onClick={() => { setStep(nextStep.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                הבא: {nextStep.label} <ArrowLeft size={15} style={{ marginRight: 6 }} />
              </Button>
            </div>
          )}
        </main>
      </div>

      <RecordingPanel open={recordingOpen} onOpenChange={setRecordingOpen} meetingId={meeting.id} clientName={meeting.client_name || workspaceClientName} />

      <Sheet open={notesOpen} onClose={() => setNotesOpen(false)} placement="side" width="min(460px, 100vw)" title="הערות פגישה" subtitle="נשמר אוטומטית · קיצור מקלדת: N">
        <textarea
          value={notes}
          onChange={event => void saveNotes(event.target.value)}
          rows={22}
          placeholder="הערות חופשיות תוך כדי הפגישה…"
          style={notesInputStyle}
          autoFocus
        />
      </Sheet>

      <Sheet open={detailsOpen} onClose={() => setDetailsOpen(false)} placement="side" width="min(420px, 100vw)" title="פרטי הפגישה">
        <div style={{ display: 'grid', gap: 8 }}>
          <InfoRow label="כותרת" value={meeting.title} />
          <InfoRow label="לקוח" value={meeting.client_name || '-'} />
          <InfoRow label="מקור" value={sourceLabel(meeting.source)} />
          <InfoRow label="התחלה" value={meeting.started_at ? new Date(meeting.started_at).toLocaleString('he-IL') : '-'} />
          <InfoRow label="משך עד כה" value={duration} />
          <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.7 }}>
            יש לך בעיה? <a href="mailto:support@abd-finance.co.il" style={{ color: 'var(--abd-accent)', fontWeight: 700, textDecoration: 'none' }}>support@abd-finance.co.il</a>
          </p>
        </div>
      </Sheet>
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
const endErrorStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', margin: '10px 20px 0', padding: '10px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--destructive-bg, #FEE2E2)', color: 'var(--destructive-text, #991B1B)', border: '1px solid var(--separator)', fontWeight: 600, fontSize: 13.5 }
const bodyStyle: React.CSSProperties = { display: 'flex', flex: 1, minHeight: 0 }
const stepperStyle: React.CSSProperties = { display: 'flex', alignItems: 'stretch', gap: 0, padding: '10px 20px', background: 'var(--bg-surface-sunken)', borderBottom: '1px solid var(--separator)', overflowX: 'auto' }
const stepConnectorStyle: React.CSSProperties = { flex: 1, height: 2, minWidth: 18, background: 'var(--separator)', margin: '0 10px', alignSelf: 'center' }
function stepButtonStyle(active: boolean, done: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 0', minWidth: 150, border: 0, background: 'transparent', cursor: 'pointer',
    fontFamily: 'var(--font-main)', fontSize: 14, color: active ? 'var(--text-heading)' : done ? 'var(--text-heading)' : 'var(--text-muted)',
    padding: '4px 0', textAlign: 'start',
  }
}
function stepBadgeStyle(active: boolean, done: boolean): React.CSSProperties {
  return {
    width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13,
    background: active ? 'var(--abd-accent)' : done ? 'var(--success-bg, #ECFDF5)' : 'var(--bg-surface)',
    color: active ? '#fff' : done ? 'var(--success-text, #065F46)' : 'var(--text-muted)',
    border: active ? '2px solid var(--abd-accent)' : done ? '2px solid var(--success, #10B981)' : '2px solid var(--separator)',
  }
}
const contentStyle: React.CSSProperties = { flex: 1, minWidth: 0, padding: 20, overflow: 'auto' }
const notesInputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 14, fontFamily: 'var(--font-main)', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-heading)', resize: 'vertical', lineHeight: 1.7 }

