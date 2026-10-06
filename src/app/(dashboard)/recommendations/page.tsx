'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getManufacturersByProductType,
  getTrackDetails,
  getTracksByProductAndManufacturer,
  normalizeManufacturerName,
  normalizeProductType,
  type AbdTrack,
} from '@/lib/returns-catalog'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { ArrowDown, ArrowUp, Lightbulb, Plus, Sparkles, Trash2 } from 'lucide-react'
import { DEFAULT_RATIONALE, formatRecommendationLine } from '@/lib/recommendation-text'
import { loadStoredFindings, portfolioRef, runAnalysis, type Finding } from '@/lib/smart-agent/engine'

/**
 * Recommendations step (design spec p.5): numbered cards in the order they
 * will appear in the summary, reorderable, each carrying its SOURCE
 * (Smart Agent / מהשיחה / ידני) and a workflow STATUS (טיוטה / לבירור /
 * הוצג ללקוח). Below the list: sources that were not formulated yet —
 * Smart Agent findings awaiting a decision. Everything is stored in the
 * workspace store's trackingDeals, which the summary document syncs from.
 */

type RecommendationSource = 'smart-agent' | 'conversation' | 'manual'
type RecommendationStatus = 'draft' | 'clarify' | 'presented'

type Recommendation = {
  id: string
  fromFundId: string
  actionType?: string
  productType: string
  manufacturer: string
  track: string
  trackId?: string
  reason: string
  amount: number
  returns?: AbdTrack['returns']
  /** Free-wording recommendation (Smart Agent approvals, conversation items). Overrides the structured line. */
  freeText?: string
  source?: RecommendationSource
  status?: RecommendationStatus
  findingId?: string
}

const SOURCE_LABEL: Record<RecommendationSource, string> = {
  'smart-agent': 'Smart Agent',
  conversation: 'מהשיחה',
  manual: 'ידני',
}

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  draft: 'טיוטה',
  clarify: 'לבירור',
  presented: 'הוצג ללקוח',
}

const recommendationTargetCompanies: Record<string, string[]> = {
  'קרן פנסיה': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור'],
  'קופת גמל': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אינפיניטי'],
  'קרן השתלמות': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור'],
  'קופת גמל להשקעה': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור'],
  'פוליסה פיננסית': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים'],
}

function money(value: unknown) {
  const numeric = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric)
    ? numeric.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
    : '₪0'
}

const productTypes = ['קופת גמל', 'קרן השתלמות', 'קרן פנסיה', 'קופת גמל להשקעה', 'פוליסה פיננסית']

export default function RecommendationsPage() {
  const hydrated = useWorkspaceStore(state => state.hydrated)
  const hydrate = useWorkspaceStore(state => state.hydrate)
  const funds = useWorkspaceStore(state => state.funds)
  const recommendations = useWorkspaceStore(state => state.trackingDeals) as Recommendation[]
  const setTrackingDeals = useWorkspaceStore(state => state.setTrackingDeals)
  const [selectedFundId, setSelectedFundId] = useState('')
  const [productType, setProductType] = useState('קופת גמל')
  const [manufacturer, setManufacturer] = useState('')
  const [trackId, setTrackId] = useState('')
  const [reason, setReason] = useState(DEFAULT_RATIONALE.migrate)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    if (selectedFundId || !funds[0]) return
    setSelectedFundId(funds[0].id || '')
    setProductType(normalizeProductType(funds[0].productType || 'קופת גמל'))
    setManufacturer(normalizeManufacturerName(funds[0].manufacturer || ''))
  }, [funds, selectedFundId])

  const selectedFund = funds.find(fund => fund.id === selectedFundId)
  const manufacturers = useMemo(() => {
    const fromReturns = getManufacturersByProductType(productType)
    const fromRules = recommendationTargetCompanies[productType] || []
    return Array.from(new Set([...fromReturns, ...fromRules].map(normalizeManufacturerName).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'he'))
  }, [productType])
  const tracks = useMemo(() => getTracksByProductAndManufacturer(productType, manufacturer), [manufacturer, productType])
  const selectedTrack = trackId ? getTrackDetails(trackId) : tracks[0]

  useEffect(() => {
    if (!manufacturer && manufacturers[0]) setManufacturer(manufacturers[0])
  }, [manufacturer, manufacturers])

  useEffect(() => {
    if (!trackId && tracks[0]) setTrackId(tracks[0].id)
    if (trackId && !tracks.some(track => track.id === trackId)) setTrackId(tracks[0]?.id || '')
  }, [trackId, tracks])

  // Smart Agent findings still awaiting a decision — the "מקורות שעדיין לא נוסחו" panel.
  const pendingFindings = useMemo(() => {
    if (!funds.length) return [] as Finding[]
    try {
      const result = runAnalysis(funds as unknown as Parameters<typeof runAnalysis>[0], [], loadStoredFindings().findings)
      return result.findings.filter(finding => finding.status === 'NEW' || finding.status === 'REVIEWED')
    } catch { return [] }
  }, [funds])

  function persist(next: Recommendation[]) {
    setTrackingDeals(next)
  }

  function addRecommendation() {
    if (!selectedFund || !selectedTrack) return
    const next: Recommendation = {
      id: `${Date.now()}`,
      fromFundId: selectedFund.id || '',
      actionType: 'ניוד למוצר חדש',
      productType,
      manufacturer,
      track: selectedTrack.trackName,
      trackId: selectedTrack.trackId,
      reason,
      amount: Number(selectedFund.currentBalance || 0),
      returns: selectedTrack.returns,
      source: 'manual',
      status: 'draft',
    }
    persist([...recommendations, next])
    setFormOpen(false)
  }

  /** "נסח כהמלצה" — a pending finding becomes a free-text draft the advisor can edit. */
  function draftFromFinding(finding: Finding) {
    const fund = funds.find(item => portfolioRef(item.id || '') === finding.portfolioRef)
    const next: Recommendation = {
      id: `${Date.now()}`,
      fromFundId: fund?.id || '',
      actionType: 'טיפול בקופה',
      productType: fund?.productType || '',
      manufacturer: fund?.manufacturer || '',
      track: '',
      reason: '',
      amount: 0,
      freeText: `${finding.possibleActions[0] || finding.title} (${finding.productLabel}).`,
      source: 'smart-agent',
      status: 'draft',
      findingId: finding.id,
    }
    persist([...recommendations, next])
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= recommendations.length) return
    const next = [...recommendations]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    persist(next)
  }

  function setStatus(id: string, status: RecommendationStatus) {
    persist(recommendations.map(item => item.id === id ? { ...item, status } : item))
  }

  function updateText(id: string, freeText: string) {
    persist(recommendations.map(item => item.id === id ? { ...item, freeText } : item))
  }

  function lineFor(item: Recommendation): string {
    if (item.freeText?.trim()) return item.freeText
    const source = funds.find(fund => fund.id === item.fromFundId)
    return formatRecommendationLine({
      actionType: item.actionType || 'ניוד למוצר חדש',
      sourceProductType: source?.productType,
      sourceManufacturer: source?.manufacturer,
      sourceAccountNumber: source?.accountNumber,
      targetProductType: item.productType,
      targetManufacturer: item.manufacturer,
      track: item.track,
      amount: item.amount,
      reason: item.reason,
    })
  }

  function fundLabel(item: Recommendation): string {
    const fund = funds.find(candidate => candidate.id === item.fromFundId)
    if (!fund) return ''
    return [fund.manufacturer, fund.accountNumber].filter(Boolean).join(' · ')
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar
        title={`המלצות${recommendations.length ? ` · ${recommendations.length}` : ''}`}
        subtitle="מסודרות לפי הסדר שבו יופיעו בסיכום — שינוי סדר בחיצים. עריכה כאן מתעדכנת בסיכום."
        actions={<Button variant="primary" onClick={() => setFormOpen(open => !open)}><Plus size={15} style={{ marginInlineEnd: 4 }} /> הוסף המלצה</Button>}
      />

      {formOpen && (
        <Surface style={{ ...cardStyle, marginBottom: 16 }}>
          <h2 style={sectionTitleStyle}>המלצת ניוד חדשה</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="קופה מעבירה">
              <select value={selectedFundId} onChange={event => setSelectedFundId(event.target.value)} style={inputStyle}>
                {funds.map(fund => (
                  <option key={fund.id} value={fund.id}>
                    {fund.manufacturer || 'יצרן'} - {fund.productType || 'מוצר'} - {money(fund.currentBalance)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="סוג מוצר מקבל">
              <select value={productType} onChange={event => { setProductType(event.target.value); setManufacturer(''); setTrackId('') }} style={inputStyle}>
                {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="יצרן מקבל">
              <select value={manufacturer} onChange={event => { setManufacturer(event.target.value); setTrackId('') }} style={inputStyle}>
                {manufacturers.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="מסלול השקעה">
              <select value={trackId} onChange={event => setTrackId(event.target.value)} style={inputStyle}>
                {tracks.map(item => <option key={item.id} value={item.id}>{item.trackName}</option>)}
              </select>
            </Field>
          </div>
          {selectedTrack && (
            <div style={trackSummaryStyle}>
              <span>מספר מסלול: {selectedTrack.trackId || '—'}</span>
              <span>שנה: {selectedTrack.returns?.periodAccumulated ?? '—'}%</span>
              <span>3 שנים: {selectedTrack.returns?.annual3 ?? '—'}%</span>
              <span>5 שנים: {selectedTrack.returns?.annual5 ?? '—'}%</span>
            </div>
          )}
          <Field label="נימוק (סיומת המשפט)">
            <textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>ביטול</Button>
            <Button variant="primary" onClick={addRecommendation} disabled={!selectedFund || !selectedTrack}>הוסף המלצת ניוד</Button>
          </div>
        </Surface>
      )}

      {recommendations.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {recommendations.map((item, index) => (
            <Surface key={item.id} style={recommendationCardStyle}>
              <span style={orderBadgeStyle}>{String(index + 1).padStart(2, '0')}</span>
              <div style={{ minWidth: 0, flex: 1, display: 'grid', gap: 8 }}>
                <textarea
                  value={lineFor(item)}
                  onChange={event => updateText(item.id, event.target.value)}
                  rows={2}
                  aria-label={`המלצה ${index + 1}`}
                  style={recommendationTextStyle}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={sourceChipStyle}>
                    {item.source === 'smart-agent' && <Sparkles size={11} style={{ marginInlineEnd: 3 }} />}
                    {SOURCE_LABEL[item.source || 'manual']}
                  </span>
                  {fundLabel(item) && <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{fundLabel(item)}</span>}
                  <span style={{ display: 'inline-flex', gap: 4, marginInlineStart: 'auto' }} role="group" aria-label="סטטוס ההמלצה">
                    {(Object.keys(STATUS_LABEL) as RecommendationStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatus(item.id, status)}
                        style={statusChipStyle((item.status || 'draft') === status)}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    ))}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 4, flexShrink: 0 }}>
                <button type="button" title="העבר למעלה" disabled={index === 0} onClick={() => move(index, -1)} style={moveButtonStyle(index === 0)}><ArrowUp size={14} /></button>
                <button type="button" title="העבר למטה" disabled={index === recommendations.length - 1} onClick={() => move(index, 1)} style={moveButtonStyle(index === recommendations.length - 1)}><ArrowDown size={14} /></button>
                <button type="button" title="הסר המלצה" onClick={() => persist(recommendations.filter(rec => rec.id !== item.id))} style={{ ...moveButtonStyle(false), color: 'var(--destructive)' }}><Trash2 size={14} /></button>
              </div>
            </Surface>
          ))}
        </div>
      ) : (
        <Surface style={cardStyle}>
          <EmptyState icon={<Lightbulb size={28} />} title="עדיין אין המלצות" description='ממצא שמאושר ב-Smart Agent עובר לכאן כטיוטה, ואפשר להוסיף המלצת ניוד ידנית בכפתור "הוסף המלצה".' />
        </Surface>
      )}

      {pendingFindings.length > 0 && (
        <Surface style={{ ...cardStyle, marginTop: 16 }}>
          <h2 style={{ ...sectionTitleStyle, fontSize: 15 }}>מקורות שעדיין לא נוסחו</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {pendingFindings.map(finding => (
              <div key={finding.id} style={pendingRowStyle}>
                <Sparkles size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ minWidth: 0, flex: 1, fontSize: 13.5, color: 'var(--text-heading)' }}>
                  <strong>{finding.title}</strong> — {finding.productLabel}
                </span>
                <Button size="sm" variant="secondary" onClick={() => draftFromFinding(finding)}>נסח כהמלצה</Button>
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: 12.5 }}>שום הצעה לא נכנסת לסיכום בלי אישור שלך.</p>
        </Surface>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

const cardStyle: React.CSSProperties = { padding: 18 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 16, fontWeight: 700, margin: '0 0 12px' }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6, marginBottom: 12, color: 'var(--text-heading)', fontWeight: 600, fontSize: 13.5 }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 40, border: '1px solid var(--separator)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', background: 'var(--bg-surface)', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', fontSize: 13.5 }
const trackSummaryStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 14, margin: '2px 0 12px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-sunken)', color: 'var(--text-body)', fontWeight: 600, fontSize: 13 }
const recommendationCardStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14 }
const orderBadgeStyle: React.CSSProperties = { flexShrink: 0, minWidth: 30, height: 26, padding: '0 7px', borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)', color: 'var(--text-heading)', fontWeight: 700, fontSize: 12.5, letterSpacing: 0.5 }
const recommendationTextStyle: React.CSSProperties = { width: '100%', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', padding: '4px 6px', margin: '-4px -6px', background: 'transparent', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', fontSize: 14.5, lineHeight: 1.7, resize: 'vertical', minHeight: 30 }
const sourceChipStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999, background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)', color: 'var(--text-body)', fontSize: 11.5, fontWeight: 600 }
function statusChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-main)',
    border: active ? '1px solid var(--abd-primary)' : '1px solid var(--separator)',
    background: active ? 'var(--abd-accent-light)' : 'transparent',
    color: active ? 'var(--abd-primary)' : 'var(--text-muted)',
  }
}
function moveButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--separator)', borderRadius: 8,
    background: 'var(--bg-surface)', color: disabled ? 'var(--text-tertiary)' : 'var(--text-body)', cursor: disabled ? 'default' : 'pointer',
  }
}
const pendingRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)' }
