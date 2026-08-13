'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { findAbdTrackForFund, type AbdTrack } from '@/lib/returns-catalog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'

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

const FUNDS_KEY = 'abd_next_funds'
const FAVORITES_KEY = 'abd_returns_favorites'

function num(value: unknown) {
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function returnColor(value: number | null) {
  if (value == null) return 'var(--text-heading)'
  if (value > 0) return 'var(--success)'
  if (value < 0) return 'var(--destructive)'
  return 'var(--text-heading)'
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

export default function ReturnsPage() {
  const [funds, setFunds] = useState<FundRow[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

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
    }).sort((a, b) => (a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1))
  }, [favorites, funds])

  function toggleFavorite(id: string) {
    const next = { ...favorites, [id]: !favorites[id] }
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  const columns = useMemo<DataTableColumn<ReturnsRow>[]>(() => [
    {
      key: 'fundName',
      label: 'שם קופה / מסלול',
      width: 300,
      render: row => (
        <span style={{ display: 'grid', gap: 2 }}>
          <strong style={{ color: 'var(--text-heading)' }}>{row.fundName}</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.trackName}</span>
        </span>
      ),
    },
    { key: 'manufacturer', label: 'יצרן', width: 150 },
    { key: 'productType', label: 'סוג מוצר', width: 130 },
    { key: 'trackNumber', label: 'מספר מסלול', width: 110 },
    { key: 'tMonth', label: 'חודש', width: 90, numeric: true, sortValue: row => row.tMonth ?? -Infinity, render: row => <span style={{ color: returnColor(row.tMonth), fontWeight: 700 }}>{formatReturn(row.tMonth)}</span> },
    { key: 't12', label: '12 חודשים', width: 100, numeric: true, sortValue: row => row.t12 ?? -Infinity, render: row => <span style={{ color: returnColor(row.t12), fontWeight: 700 }}>{formatReturn(row.t12)}</span> },
    { key: 't36', label: '36 חודשים', width: 100, numeric: true, sortValue: row => row.t36 ?? -Infinity, render: row => <span style={{ color: returnColor(row.t36), fontWeight: 700 }}>{formatReturn(row.t36)}</span> },
    { key: 't60', label: '60 חודשים', width: 100, numeric: true, sortValue: row => row.t60 ?? -Infinity, render: row => <span style={{ color: returnColor(row.t60), fontWeight: 700 }}>{formatReturn(row.t60)}</span> },
    { key: 'fee', label: 'דמי ניהול', width: 150 },
    { key: 'lastUpdated', label: 'תאריך עדכון', width: 120 },
    { key: 'source', label: 'מקור נתון', width: 170 },
  ], [])

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)', padding: '20px 24px' }}>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={row => row.id}
        initialSort={{ key: 't12', direction: 'desc' }}
        storageKey="abd_next_returns_table"
        emptyMessage="אין נתונים להצגה."
        leadingColumnWidth={44}
        renderLeadingCell={row => (
          <button type="button" onClick={() => toggleFavorite(row.id)} style={favoriteStyle(row.favorite)} title="סמן כמועדף">
            <Star size={14} fill={row.favorite ? 'var(--abd-accent)' : 'none'} />
          </button>
        )}
      />
    </main>
  )
}

const favoriteStyle = (active: boolean): React.CSSProperties => ({ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid var(--separator)', background: active ? 'var(--bg-surface-sunken)' : 'transparent', color: 'var(--abd-accent)', cursor: 'pointer' })

