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

type FundRow = {
  id?: string
  manufacturer?: string
  productType?: string
  productName?: string
  investmentTrack?: string
  accountNumber?: string
  currentBalance?: number
}

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

const FUNDS_KEY = 'abd_next_funds'
const RECOMMENDATIONS_KEY = 'abd_next_recommendations'

function money(value: unknown) {
  const numeric = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric)
    ? numeric.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
    : '₪0'
}

const productTypes = ['קופת גמל', 'קרן השתלמות', 'קרן פנסיה', 'קופת גמל להשקעה', 'פוליסה פיננסית']

export default function RecommendationsPage() {
  const [funds, setFunds] = useState<FundRow[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selectedFundId, setSelectedFundId] = useState('')
  const [productType, setProductType] = useState('קופת גמל')
  const [manufacturer, setManufacturer] = useState('')
  const [trackId, setTrackId] = useState('')
  const [reason, setReason] = useState('המלצה לביצוע ניוד בהתאם לצורכי הלקוח, דמי הניהול, רמת הסיכון, תשואות המסלול והתאמתו לפרופיל הלקוח.')

  useEffect(() => {
    try {
      const storedFunds = JSON.parse(localStorage.getItem(FUNDS_KEY) || '[]')
      const storedRecommendations = JSON.parse(localStorage.getItem(RECOMMENDATIONS_KEY) || '[]')
      setFunds(Array.isArray(storedFunds) ? storedFunds : [])
      setRecommendations(Array.isArray(storedRecommendations) ? storedRecommendations : [])
      if (Array.isArray(storedFunds) && storedFunds[0]) {
        setSelectedFundId(storedFunds[0].id || '')
        const type = normalizeProductType(storedFunds[0].productType || 'קופת גמל')
        const maker = normalizeManufacturerName(storedFunds[0].manufacturer || '')
        setProductType(type)
        setManufacturer(maker)
      }
    } catch {
      setFunds([])
      setRecommendations([])
    }
  }, [])

  const selectedFund = funds.find(fund => fund.id === selectedFundId)
  const manufacturers = useMemo(() => getManufacturersByProductType(productType), [productType])
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
    setRecommendations(next)
    localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(next))
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
      <header style={headerStyle}>
        <h1 style={titleStyle}>המלצות ניוד</h1>
        <p style={mutedStyle}>המסלולים מגיעים מנתוני רשות שוק ההון. בחירת יצרן מסננת רק מסלולים של אותו יצרן, כולל כלל → רק מסלולים שמתחילים בכלל.</p>
      </header>

      <section style={gridStyle}>
        <div style={cardStyle}>
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
          <button type="button" onClick={addRecommendation} disabled={!selectedFund || !selectedTrack} style={primaryButtonStyle}>הוסף המלצת ניוד</button>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>המלצות שנשמרו</h2>
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
            {!recommendations.length && <p style={mutedStyle}>עדיין לא נשמרו המלצות.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

const headerStyle: React.CSSProperties = { marginBottom: 24 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.7 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '430px 1fr', gap: 18, alignItems: 'start' }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-card)' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900, marginBottom: 16 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, marginBottom: 14, color: 'var(--abd-primary)', fontWeight: 800 }
const inputStyle: React.CSSProperties = { width: '100%', minHeight: 44, border: '1px solid #CFE6FA', borderRadius: 12, padding: '9px 12px', background: '#FBFDFF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)' }
const primaryButtonStyle: React.CSSProperties = { width: '100%', border: 0, borderRadius: 12, padding: '12px 18px', background: 'var(--abd-accent)', color: '#fff', fontWeight: 900, fontFamily: 'var(--font-main)', cursor: 'pointer' }
const recommendationStyle: React.CSSProperties = { display: 'grid', gap: 7, border: '1px solid #D7EAFB', borderRadius: 14, padding: 14, background: '#F8FBFF', color: 'var(--abd-primary)' }
const linkButtonStyle: React.CSSProperties = { justifySelf: 'start', border: 0, background: 'transparent', color: 'var(--status-danger)', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-main)' }
const trackSummaryStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, padding: 12, borderRadius: 12, background: '#EFF6FF', color: 'var(--abd-primary)', fontWeight: 800 }
