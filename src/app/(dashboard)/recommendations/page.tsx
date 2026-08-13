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
import { Lightbulb } from 'lucide-react'

type Recommendation = {
  id: string
  fromFundId: string
  productType: string
  manufacturer: string
  track: string
  trackId?: string
  reason: string
  amount: number
  returns?: AbdTrack['returns']
}

const recommendationTargetCompanies: Record<string, string[]> = {
  'קרן פנסיה': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור'],
  'קופת גמל': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אנליסט', 'ילין לפידות'],
  'קרן השתלמות': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אנליסט', 'ילין לפידות'],
  'קופת גמל להשקעה': ['הפניקס', 'הראל', 'מגדל', 'כלל', 'מנורה מבטחים', 'מיטב', 'אלטשולר שחם', 'מור', 'אנליסט', 'ילין לפידות'],
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
  const [reason, setReason] = useState('המלצה לביצוע ניוד בהתאם לצורכי הלקוח, דמי הניהול, רמת הסיכון, תשואות המסלול והתאמתו לפרופיל הלקוח.')

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

  function persist(next: Recommendation[]) {
    setTrackingDeals(next)
  }

  function addRecommendation() {
    if (!selectedFund || !selectedTrack) return
    const next: Recommendation = {
      id: `${Date.now()}`,
      fromFundId: selectedFund.id || '',
      productType,
      manufacturer,
      track: selectedTrack.trackName,
      trackId: selectedTrack.trackId,
      reason,
      amount: Number(selectedFund.currentBalance || 0),
      returns: selectedTrack.returns,
    }
    persist([next, ...recommendations])
  }

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <Toolbar
        title="המלצות ניוד"
        subtitle="המסלולים מגיעים מנתוני רשות שוק ההון. בחירת יצרן מסננת רק מסלולים של אותו יצרן, כולל כלל → רק מסלולים שמתחילים בכלל."
      />

      <section style={gridStyle}>
        <Surface style={cardStyle}>
          <h2 style={sectionTitleStyle}>יצירת המלצה</h2>
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
          {selectedTrack && (
            <div style={trackSummaryStyle}>
              <strong>מספר מסלול: {selectedTrack.trackId || 'אין נתון'}</strong>
              <span>שנה: {selectedTrack.returns?.periodAccumulated ?? 'אין נתון'}%</span>
              <span>3 שנים: {selectedTrack.returns?.annual3 ?? 'אין נתון'}%</span>
              <span>5 שנים: {selectedTrack.returns?.annual5 ?? 'אין נתון'}%</span>
            </div>
          )}
          <Field label="נימוק ההמלצה">
            <textarea value={reason} onChange={event => setReason(event.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <Button variant="primary" fullWidth onClick={addRecommendation} disabled={!selectedFund || !selectedTrack} style={{ marginTop: 4 }}>
            הוסף המלצת ניוד
          </Button>
        </Surface>

        <Surface style={cardStyle}>
          <h2 style={sectionTitleStyle}>המלצות שנשמרו</h2>
          {recommendations.length ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {recommendations.map(item => (
                <article key={item.id} style={recommendationStyle}>
                  <strong>{item.productType} | {item.manufacturer}</strong>
                  <span>{item.track}</span>
                  <small>{item.trackId ? `מספר מסלול ${item.trackId} | ` : ''}{money(item.amount)}</small>
                  <p>{item.reason}</p>
                  <button type="button" onClick={() => persist(recommendations.filter(rec => rec.id !== item.id))} style={linkButtonStyle}>הסר המלצה</button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Lightbulb size={28} />} title="עדיין לא נשמרו המלצות" description="בחר קופה מעבירה ומסלול יעד כדי ליצור המלצת ניוד ראשונה." />
          )}
        </Surface>
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.7 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '430px 1fr', gap: 18, alignItems: 'start', padding: '20px 24px' }
const cardStyle: React.CSSProperties = { padding: 22 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 20, fontWeight: 800, marginBottom: 16 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, marginBottom: 14, color: 'var(--text-heading)', fontWeight: 700 }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 44, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '9px 12px', background: 'var(--bg-canvas)', color: 'var(--text-heading)', fontFamily: 'var(--font-main)' }
const recommendationStyle: React.CSSProperties = { display: 'grid', gap: 7, border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 14, background: 'var(--bg-canvas)', color: 'var(--text-heading)' }
const linkButtonStyle: React.CSSProperties = { justifySelf: 'start', border: 0, background: 'transparent', color: 'var(--status-danger)', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-main)' }
const trackSummaryStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-canvas)', color: 'var(--text-heading)', fontWeight: 800 }
