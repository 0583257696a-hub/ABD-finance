'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { findAbdTrackForFund, type AbdTrack } from '@/lib/returns-catalog'

type FundRow = {
  id?: string
  manufacturer?: string
  productType?: string
  productName?: string
  investmentTrack?: string
  accountNumber?: string
  managementFeeText?: string
  balanceFee?: string
  depositFee?: string
  currentBalance?: number
}

type ReturnsRow = {
  id: string
  favorite: boolean
  fundName: string
  trackName: string
  manufacturer: string
  productType: string
  trackNumber: string
  tMonth: number | null
  tYtd: number | null
  t12: number | null
  t36: number | null
  t60: number | null
  fee: string
  lastUpdated: string
  source: string
  matchedTrack?: AbdTrack
}

type SortKey = 'fundName' | 'manufacturer' | 'productType' | 'trackNumber' | 'tMonth' | 't12' | 't36' | 't60' | 'lastUpdated' | 'source'
type SortDir = 'asc' | 'desc'

const FUNDS_KEY = 'abd_next_funds'
const FAVORITES_KEY = 'abd_returns_favorites'

function num(value: unknown) {
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function returnColor(value: number | null) {
  if (value == null) return '#1B3A6B'
  if (value > 0) return '#00A63E'
  if (value < 0) return '#DC2626'
  return '#1B3A6B'
}

function formatReturn(value: number | null) {
  return value == null || !Number.isFinite(value) ? 'אין נתון' : `${value.toFixed(2)}%`
}

function feeText(fund: FundRow, track?: AbdTrack) {
  if (fund.managementFeeText) return fund.managementFeeText
  const deposit = fund.depositFee || (track?.fees?.deposit != null ? `${track.fees.deposit}%` : '')
  const balance = fund.balanceFee || (track?.fees?.balance != null ? `${track.fees.balance}%` : '')
  return [
    deposit ? `מהפקדה ${deposit}` : '',
    balance ? `מצבירה ${balance}` : '',
  ].filter(Boolean).join(' | ') || 'אין נתון'
}

function sortValue(row: ReturnsRow, key: SortKey) {
  const value = row[key]
  if (typeof value === 'number') return Number.isFinite(value) ? value : -Infinity
  return String(value || '')
}

function compareRows(a: ReturnsRow, b: ReturnsRow, key: SortKey, dir: SortDir) {
  const av = sortValue(a, key)
  const bv = sortValue(b, key)
  let result = 0
  if (typeof av === 'number' && typeof bv === 'number') result = av - bv
  else result = String(av).localeCompare(String(bv), 'he')
  return dir === 'desc' ? -result : result
}

export default function ReturnsPage() {
  const [funds, setFunds] = useState<FundRow[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 't12', dir: 'desc' })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FUNDS_KEY) || '[]')
      setFunds(Array.isArray(stored) ? stored : [])
    } catch {
      setFunds([])
    }
    try {
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}') || {})
    } catch {
      setFavorites({})
    }
  }, [])

  const rows = useMemo<ReturnsRow[]>(() => {
    return funds.map((fund, index) => {
      const matchedTrack = findAbdTrackForFund(
        fund.productType,
        fund.manufacturer,
        fund.investmentTrack || fund.productName,
      )
      const id = fund.id || `${fund.accountNumber || index}`
      return {
        id,
        favorite: !!favorites[id],
        fundName: fund.productName || fund.investmentTrack || 'אין נתון',
        trackName: fund.investmentTrack || matchedTrack?.trackName || 'אין נתון',
        manufacturer: fund.manufacturer || 'אין נתון',
        productType: fund.productType || 'אין נתון',
        trackNumber: matchedTrack?.trackId || 'אין נתון',
        tMonth: matchedTrack?.returns?.periodAvg ?? null,
        tYtd: null,
        t12: matchedTrack?.returns?.periodAccumulated ?? null,
        t36: matchedTrack?.returns?.annual3 ?? matchedTrack?.returns?.months36Accumulated ?? null,
        t60: matchedTrack?.returns?.annual5 ?? matchedTrack?.returns?.months60Accumulated ?? null,
        fee: feeText(fund, matchedTrack),
        lastUpdated: matchedTrack?.reportPeriod || 'אין נתון',
        source: matchedTrack ? 'ABD RETURNS' : 'לא נמצאה התאמה במאגר התשואות',
        matchedTrack,
      }
    }).sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return compareRows(a, b, sort.key, sort.dir)
    })
  }, [favorites, funds, sort])

  function toggleFavorite(id: string) {
    const next = { ...favorites, [id]: !favorites[id] }
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  function setSortKey(key: SortKey) {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <section style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 54 }}>מועדף</th>
              <SortableTh label="שם קופה / מסלול" sortKey="fundName" active={sort.key === 'fundName'} dir={sort.dir} onClick={setSortKey} width={310} />
              <SortableTh label="יצרן" sortKey="manufacturer" active={sort.key === 'manufacturer'} dir={sort.dir} onClick={setSortKey} width={160} />
              <SortableTh label="סוג מוצר" sortKey="productType" active={sort.key === 'productType'} dir={sort.dir} onClick={setSortKey} width={130} />
              <SortableTh label="מספר מסלול" sortKey="trackNumber" active={sort.key === 'trackNumber'} dir={sort.dir} onClick={setSortKey} width={110} />
              <SortableTh label="חודש" sortKey="tMonth" active={sort.key === 'tMonth'} dir={sort.dir} onClick={setSortKey} width={90} />
              <th style={{ ...thStyle, width: 110 }}>מתחילת שנה</th>
              <SortableTh label="12 חודשים" sortKey="t12" active={sort.key === 't12'} dir={sort.dir} onClick={setSortKey} width={100} />
              <SortableTh label="36 חודשים" sortKey="t36" active={sort.key === 't36'} dir={sort.dir} onClick={setSortKey} width={100} />
              <SortableTh label="60 חודשים" sortKey="t60" active={sort.key === 't60'} dir={sort.dir} onClick={setSortKey} width={100} />
              <th style={{ ...thStyle, width: 145 }}>דמי ניהול</th>
              <SortableTh label="תאריך עדכון" sortKey="lastUpdated" active={sort.key === 'lastUpdated'} dir={sort.dir} onClick={setSortKey} width={120} />
              <SortableTh label="מקור נתון" sortKey="source" active={sort.key === 'source'} dir={sort.dir} onClick={setSortKey} width={170} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} style={{ background: index % 2 ? '#EFF7FF' : '#FFFFFF' }}>
                <td style={tdCenterStyle}>
                  <button type="button" onClick={() => toggleFavorite(row.id)} style={favoriteStyle(row.favorite)} title="סמן כמועדף">
                    <Star size={14} fill={row.favorite ? '#2563EB' : 'none'} />
                  </button>
                </td>
                <td style={nameCellStyle}>
                  <strong>{row.fundName}</strong>
                  <span>{row.trackName}</span>
                </td>
                <td style={tdStrongStyle}>{row.manufacturer}</td>
                <td style={tdStyle}>{row.productType}</td>
                <td style={tdStyle}>{row.trackNumber}</td>
                <ReturnCell value={row.tMonth} />
                <ReturnCell value={row.tYtd} />
                <ReturnCell value={row.t12} />
                <ReturnCell value={row.t36} />
                <ReturnCell value={row.t60} />
                <td style={tdStyle}>{row.fee}</td>
                <td style={tdStyle}>{row.lastUpdated}</td>
                <td style={tdStyle}>{row.source}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={13} style={emptyStyle}>אין נתונים להצגה.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function SortableTh({ label, sortKey, active, dir, onClick, width }: { label: string; sortKey: SortKey; active: boolean; dir: SortDir; onClick: (key: SortKey) => void; width: number }) {
  return (
    <th onClick={() => onClick(sortKey)} style={{ ...thStyle, width, cursor: 'pointer' }}>
      {label}{active ? (dir === 'desc' ? ' ▼' : ' ▲') : ''}
    </th>
  )
}

function ReturnCell({ value }: { value: number | null }) {
  return <td style={{ ...tdStyle, color: returnColor(value), fontWeight: 900, textAlign: 'center' }}>{formatReturn(value)}</td>
}

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 18, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', color: 'var(--abd-primary)' }
const thStyle: React.CSSProperties = { padding: '13px 10px', background: '#E7F4FF', color: 'var(--abd-primary)', fontWeight: 900, borderBottom: '1px solid #B9DDF7', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.15 }
const tdStyle: React.CSSProperties = { padding: '12px 10px', borderBottom: '1px solid #DCEFFC', color: 'var(--abd-primary)', verticalAlign: 'middle', fontSize: 13, lineHeight: 1.35, textAlign: 'center' }
const tdStrongStyle: React.CSSProperties = { ...tdStyle, fontWeight: 900 }
const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center' }
const nameCellStyle: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontWeight: 900 }
const emptyStyle: React.CSSProperties = { ...tdStyle, padding: 30, color: 'var(--text-muted)' }
const favoriteStyle = (active: boolean): React.CSSProperties => ({ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #B9DDF7', background: active ? '#E7F4FF' : '#FFFFFF', color: 'var(--abd-accent)', cursor: 'pointer' })

