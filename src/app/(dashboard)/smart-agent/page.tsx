'use client'

import { useEffect, useMemo, useState } from 'react'
import { Radar, RefreshCw, ShieldCheck } from 'lucide-react'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import {
  ENGINE_VERSION,
  loadStoredFindings,
  runAnalysis,
  storeFindings,
  type Finding,
  type FindingSeverity,
  type FindingStatus,
} from '@/lib/smart-agent/engine'

/**
 * Smart Agent — findings dashboard (NOT a chat interface, per spec §22/§47).
 * Detection-only: every card is a factual finding with evidence and neutral
 * possible actions. AI is used solely to explain a finding on demand.
 */

const SEVERITY_LABEL: Record<FindingSeverity, string> = { HIGH: 'גבוה', MEDIUM: 'בינוני', LOW: 'נמוך', INFO: 'מידע' }
const SEVERITY_TONE: Record<FindingSeverity, 'destructive' | 'warning' | 'neutral' | 'accent'> = { HIGH: 'destructive', MEDIUM: 'warning', LOW: 'neutral', INFO: 'accent' }
const STATUS_LABEL: Record<FindingStatus, string> = {
  NEW: 'חדש',
  REVIEWED: 'נסקר',
  DISCUSSED: 'נדון עם הלקוח',
  ACTION_CREATED: 'נוצרה משימה',
  RESOLVED: 'טופל',
  DISMISSED: 'נדחה',
}

export default function SmartAgentPage() {
  const hydrated = useWorkspaceStore(state => state.hydrated)
  const hydrate = useWorkspaceStore(state => state.hydrate)
  const funds = useWorkspaceStore(state => state.funds)
  const insurancePolicies = useWorkspaceStore(state => state.insurancePolicies)

  const [findings, setFindings] = useState<Finding[]>([])
  const [ranAt, setRanAt] = useState<string | null>(null)
  const [openId, setOpenId] = useState('')
  const [showDismissed, setShowDismissed] = useState(false)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [aiBusyId, setAiBusyId] = useState('')

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    const stored = loadStoredFindings()
    setFindings(stored.findings)
    setRanAt(stored.ranAt)
  }, [])

  function analyze() {
    const result = runAnalysis(funds, insurancePolicies, findings)
    setFindings(result.findings)
    setRanAt(result.ranAt)
    storeFindings(result.findings, result.ranAt)
  }

  function setStatus(id: string, status: FindingStatus, dismissReason?: string) {
    setFindings(current => {
      const next = current.map(finding => finding.id === id
        ? { ...finding, status, dismissReason: status === 'DISMISSED' ? (dismissReason || finding.dismissReason) : undefined, updatedAt: new Date().toISOString() }
        : finding)
      storeFindings(next, ranAt || new Date().toISOString())
      return next
    })
  }

  function dismiss(id: string) {
    const reason = window.prompt('סיבת הדחייה (תישמר בממצא):')
    if (reason == null) return
    setStatus(id, 'DISMISSED', reason.trim() || 'ללא נימוק')
  }

  async function explainWithAi(finding: Finding) {
    setAiBusyId(finding.id)
    try {
      const response = await fetch('/api/ai/explain-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finding.title,
          detail: finding.detail,
          evidence: finding.evidence,
          severity: finding.severity,
        }),
      })
      if (!response.ok) {
        setAiExplanations(current => ({ ...current, [finding.id]: 'הסבר AI אינו זמין בסביבה זו.' }))
        return
      }
      const data = await response.json() as { explanation?: string }
      setAiExplanations(current => ({ ...current, [finding.id]: data.explanation || '' }))
    } catch {
      setAiExplanations(current => ({ ...current, [finding.id]: 'יצירת ההסבר נכשלה — נסה שוב.' }))
    } finally {
      setAiBusyId('')
    }
  }

  const visible = useMemo(
    () => findings.filter(finding => showDismissed || (finding.status !== 'DISMISSED' && finding.status !== 'RESOLVED')),
    [findings, showDismissed],
  )
  const counts = useMemo(() => {
    const open = findings.filter(finding => finding.status !== 'DISMISSED' && finding.status !== 'RESOLVED')
    return {
      high: open.filter(finding => finding.severity === 'HIGH').length,
      medium: open.filter(finding => finding.severity === 'MEDIUM').length,
      low: open.filter(finding => finding.severity === 'LOW' || finding.severity === 'INFO').length,
      closed: findings.length - open.length,
    }
  }, [findings])

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar
        title="Smart Agent"
        subtitle="מנוע זיהוי חריגות דטרמיניסטי — מציף ממצאים עובדתיים לבחינת הסוכן, לא המלצות"
        actions={(
          <Button variant="primary" size="sm" onClick={analyze}>
            <RefreshCw size={14} style={{ marginLeft: 6 }} /> הרץ ניתוח
          </Button>
        )}
      />

      <section style={kpiGridStyle}>
        <Kpi label="חומרה גבוהה" value={counts.high} tone="var(--destructive-text)" />
        <Kpi label="חומרה בינונית" value={counts.medium} tone="var(--warning-text)" />
        <Kpi label="נמוך / מידע" value={counts.low} tone="var(--text-muted)" />
        <Kpi label="טופלו / נדחו" value={counts.closed} tone="var(--success-text)" />
      </section>

      <div style={metaRowStyle}>
        <span style={metaTextStyle}>
          {ranAt ? `ניתוח אחרון: ${new Date(ranAt).toLocaleString('he-IL')} · מנוע v${ENGINE_VERSION} · ${funds.length} קופות, ${insurancePolicies.length} פוליסות` : 'טרם הורץ ניתוח — לחץ "הרץ ניתוח".'}
        </span>
        <label style={{ ...metaTextStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={showDismissed} onChange={event => setShowDismissed(event.target.checked)} />
          הצג גם ממצאים שטופלו/נדחו
        </label>
      </div>

      {visible.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {visible.map(finding => {
            const open = openId === finding.id
            return (
              <Surface key={finding.id} style={{ padding: 16 }}>
                <div style={findingHeaderStyle} onClick={() => setOpenId(open ? '' : finding.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge tone={SEVERITY_TONE[finding.severity]} label={SEVERITY_LABEL[finding.severity]} />
                      <strong style={{ color: 'var(--text-heading)', fontSize: 15 }}>{finding.title}</strong>
                      <StatusBadge tone={finding.status === 'NEW' ? 'accent' : 'neutral'} label={STATUS_LABEL[finding.status]} />
                    </div>
                    <span style={metaTextStyle}>{finding.productLabel} · {finding.portfolioRef} · {finding.ruleId} v{finding.ruleVersion}</span>
                  </div>
                  <span style={{ ...metaTextStyle, flexShrink: 0 }}>{open ? 'סגור' : 'פרטים'}</span>
                </div>

                {open && (
                  <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                    <p style={{ color: 'var(--text-body)', lineHeight: 1.7 }}>{finding.detail}</p>

                    <div style={evidenceGridStyle}>
                      {finding.evidence.map(item => (
                        <div key={item.label} style={evidenceItemStyle}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.label}</span>
                          <strong style={{ color: 'var(--text-heading)', fontSize: 13.5 }}>{item.value}</strong>
                        </div>
                      ))}
                    </div>

                    <div>
                      <span style={{ ...metaTextStyle, fontWeight: 700 }}>פעולות אפשריות לבחינה:</span>
                      <ul style={{ margin: '6px 0 0', paddingInlineStart: 18, color: 'var(--text-body)', lineHeight: 1.8 }}>
                        {finding.possibleActions.map(action => <li key={action}>{action}</li>)}
                      </ul>
                    </div>

                    {finding.dismissReason && (
                      <p style={metaTextStyle}>סיבת דחייה: {finding.dismissReason}</p>
                    )}

                    {aiExplanations[finding.id] && (
                      <div style={aiBoxStyle}>
                        <strong style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>הסבר AI (טיוטה, לבחינת הסוכן):</strong>
                        <p style={{ color: 'var(--text-body)', lineHeight: 1.7, marginTop: 4 }}>{aiExplanations[finding.id]}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Button size="sm" variant="secondary" disabled={aiBusyId === finding.id} onClick={() => void explainWithAi(finding)}>
                        {aiBusyId === finding.id ? 'יוצר הסבר…' : 'הסבר לי (AI)'}
                      </Button>
                      {finding.status === 'NEW' && <Button size="sm" variant="ghost" onClick={() => setStatus(finding.id, 'REVIEWED')}>סמן כנסקר</Button>}
                      {(finding.status === 'NEW' || finding.status === 'REVIEWED') && <Button size="sm" variant="ghost" onClick={() => setStatus(finding.id, 'DISCUSSED')}>נדון עם הלקוח</Button>}
                      <Button size="sm" variant="ghost" onClick={() => setStatus(finding.id, 'RESOLVED')}>טופל</Button>
                      <Button size="sm" variant="ghost" onClick={() => dismiss(finding.id)}>דחה</Button>
                    </div>
                  </div>
                )}
              </Surface>
            )
          })}
        </div>
      ) : (
        <Surface style={{ padding: 24 }}>
          <EmptyState
            icon={ranAt ? <ShieldCheck size={30} /> : <Radar size={30} />}
            title={ranAt ? 'אין ממצאים פתוחים' : 'Smart Agent מוכן לניתוח'}
            description={ranAt
              ? 'לא נמצאו חריגות פתוחות בתיק הנוכחי לפי כללי הבדיקה.'
              : 'טען נתוני לקוח (ייבוא קבצים בטאב קופות) ולחץ "הרץ ניתוח". הניתוח רץ מקומית בדפדפן — נתוני התיק אינם נשלחים לשרת.'}
          />
        </Surface>
      )}

      <p style={{ ...metaTextStyle, marginTop: 16 }}>
        Smart Agent מזהה חריגות לפי כללים דטרמיניסטיים ומציג עובדות בלבד — אינו ממליץ על מוצר, יצרן או מסלול. ההחלטה המקצועית היא של הסוכן.
      </p>
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Surface style={{ padding: 16, display: 'grid', gap: 4 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      <strong style={{ color: tone, fontSize: 26, fontWeight: 700 }}>{value}</strong>
    </Surface>
  )
}

const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 14 }
const metaRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }
const metaTextStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12.5 }
const findingHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }
const evidenceGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }
const evidenceItemStyle: React.CSSProperties = { display: 'grid', gap: 2, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)' }
const aiBoxStyle: React.CSSProperties = { padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-canvas)', border: '1px dashed var(--separator-strong)' }
