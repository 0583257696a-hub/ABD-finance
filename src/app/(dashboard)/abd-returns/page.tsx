'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getAllAbdTracks,
  normalizeProductType,
  type AbdTrack,
} from '@/lib/returns-catalog'

type PeriodMode = 'average' | 'accumulated'
type SortKey = 'month' | 'year' | 'three' | 'five'
type SortDir = 'asc' | 'desc'
type SortState = Record<string, { key: SortKey; dir: SortDir }>

const HIGHLIGHTS_KEY = 'gamel_hl'
const allowedManufacturers = new Set([
  'כלל',
  'מנורה מבטחים',
  'הפניקס',
  'מגדל',
  'מיטב',
  'הראל',
  'מור',
  'אנליסט',
  'אלטשולר שחם',
  'ילין לפידות',
])
const periodColumns: Array<{ key: SortKey; label: string }> = [
  { key: 'month', label: 'חודש' },
  { key: 'year', label: 'שנה' },
  { key: 'three', label: '3 שנים' },
  { key: 'five', label: '5 שנים' },
]
const paletteColors = ['#22C55E', '#FACC15', '#FB923C', '#F43F5E', '#94A3B8', '#8B5CF6', '#38BDF8', '#10B981']

function returnValue(track: AbdTrack, key: SortKey, mode: PeriodMode) {
  if (key === 'month') return track.returns?.periodAvg ?? null
  if (key === 'year') return track.returns?.periodAccumulated ?? null
  if (key === 'three') {
    return mode === 'average'
      ? track.returns?.annual3 ?? null
      : track.returns?.months36Accumulated ?? null
  }
  return mode === 'average'
    ? track.returns?.annual5 ?? null
    : track.returns?.months60Accumulated ?? null
}

function returnColor(value: number | null | undefined) {
  if (value == null) return '#64748B'
  if (value > 0) return '#00A63E'
  if (value < 0) return '#DC2626'
  return '#0F1929'
}

function formatReturn(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? '-' : `${value.toFixed(2)}%`
}

function numericReturn(track: AbdTrack, key: SortKey, mode: PeriodMode) {
  const value = returnValue(track, key, mode)
  return value == null || !Number.isFinite(value) ? -Infinity : Number(value)
}

function cardKey(title: string) {
  return title.replace(/\s+/g, '_').replace(/[^\w\u0590-\u05FF]/g, '_')
}

function average(rows: AbdTrack[], key: SortKey, mode: PeriodMode) {
  const values = rows.map(row => returnValue(row, key, mode)).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function sortRows(rows: AbdTrack[], state: { key: SortKey; dir: SortDir }, mode: PeriodMode) {
  return [...rows].sort((a, b) => {
    const av = numericReturn(a, state.key, mode)
    const bv = numericReturn(b, state.key, mode)
    if (av === bv) return a.trackName.localeCompare(b.trackName, 'he')
    return state.dir === 'desc' ? bv - av : av - bv
  })
}

export default function AbdReturnsPage() {
  const [productType, setProductType] = useState('all')
  const [mode, setMode] = useState<PeriodMode>('average')
  const [sortState, setSortState] = useState<SortState>({})
  const [highlights, setHighlights] = useState<Record<string, string>>({})
  const [palette, setPalette] = useState<{ trackName: string; x: number; y: number } | null>(null)
  const ignoreNextOutsideClick = useRef(false)

  useEffect(() => {
    try {
      setHighlights(JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}'))
    } catch {
      setHighlights({})
    }
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ignoreNextOutsideClick.current) {
        ignoreNextOutsideClick.current = false
        return
      }
      if (!(event.target as HTMLElement).closest('[data-color-palette]')) setPalette(null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPalette(null)
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  const productTypes = useMemo(() => {
    const values = Array.from(new Set(
      getAllAbdTracks()
        .filter(track => allowedManufacturers.has(track.manufacturer))
        .map(track => normalizeProductType(track.productType))
        .filter(Boolean),
    )).sort((a, b) => a.localeCompare(b, 'he'))
    return ['all', ...values]
  }, [])

  const rows = useMemo(() => {
    const normalizedType = normalizeProductType(productType)
    return getAllAbdTracks()
      .filter(track => allowedManufacturers.has(track.manufacturer))
      .filter(track => productType === 'all' || track.productType === normalizedType)
  }, [productType])

  const groups = useMemo(() => {
    const grouped = new Map<string, AbdTrack[]>()
    rows.forEach(track => {
      const title = track.specialization || 'כללי'
      grouped.set(title, [...(grouped.get(title) || []), track])
    })

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'he'))
      .map(([title, tracks]) => {
        const id = cardKey(`${productType}_${title}`)
        const state = sortState[id] || { key: 'five' as SortKey, dir: 'desc' as SortDir }
        return { id, title, sourceRows: tracks, tracks: sortRows(tracks, state, mode).slice(0, 10), state }
      })
  }, [mode, productType, rows, sortState])

  function updateCardSort(cardId: string, key: SortKey) {
    setSortState(prev => {
      const current = prev[cardId] || { key: 'five' as SortKey, dir: 'desc' as SortDir }
      return {
        ...prev,
        [cardId]: {
          key,
          dir: current.key === key && current.dir === 'desc' ? 'asc' : 'desc',
        },
      }
    })
  }

  function openPalette(event: React.MouseEvent<HTMLTableRowElement>, trackName: string) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    event.stopPropagation()
    ignoreNextOutsideClick.current = true
    setPalette({
      trackName,
      x: Math.max(12, Math.min(event.clientX + 8, window.innerWidth - 150)),
      y: Math.max(12, Math.min(event.clientY + 8, window.innerHeight - 132)),
    })
  }

  function saveHighlight(trackName: string, color?: string) {
    const next = { ...highlights }
    if (color) next[trackName] = color
    else delete next[trackName]
    setHighlights(next)
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(next))
    setPalette(null)
  }

  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      <style>{`
        .abd-returns-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          align-items: start;
        }
        @media (max-width: 1180px) {
          .abd-returns-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 680px) {
          .abd-returns-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>תשואות ABD Finance</h1>
        </div>
        <div style={modeToggleStyle}>
          <button type="button" onClick={() => setMode('average')} style={mode === 'average' ? activeModeStyle : modeButtonStyle}>תשואה ממוצעת</button>
          <button type="button" onClick={() => setMode('accumulated')} style={mode === 'accumulated' ? activeModeStyle : modeButtonStyle}>תשואה מצטברת</button>
        </div>
      </header>

      <section style={productTabsStyle}>
        {productTypes.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setProductType(type)}
            style={productType === type ? activeProductTabStyle : productTabStyle}
          >
            {type === 'all' ? 'כל סוגי המוצר' : type}
          </button>
        ))}
      </section>

      <section className="abd-returns-grid">
        {groups.map(group => (
          <article key={group.id} style={tableCardStyle}>
            <h2 style={tableTitleStyle}>{group.title}</h2>
            <table style={miniTableStyle}>
              <thead>
                <tr>
                  <th style={{ ...periodThStyle, width: '39%' }}>שם</th>
                  {periodColumns.map(column => (
                    <PeriodHeader
                      key={column.key}
                      label={column.label}
                      active={group.state.key === column.key}
                      dir={group.state.dir}
                      onClick={() => updateCardSort(group.id, column.key)}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.tracks.map((track, index) => {
                  const color = highlights[track.trackName]
                  const highlightStyle = getHighlightCellStyle(color)
                  return (
                    <tr
                      key={track.id}
                      onClick={event => openPalette(event, track.trackName)}
                      onMouseDown={event => openPalette(event, track.trackName)}
                      title="Ctrl + Click לצביעת שורה"
                      style={{
                        background: color ? `${color}22` : index % 2 ? '#EEF7FF' : '#FFFFFF',
                        cursor: color ? 'pointer' : 'default',
                      }}
                    >
                      <td style={{ ...nameTdStyle, ...highlightStyle, borderRight: color ? `2px solid ${color}` : undefined }}>
                        <span style={nameTextStyle}>{track.trackName}</span>
                      </td>
                      {periodColumns.map((column, columnIndex) => (
                        <ReturnTd
                          key={column.key}
                          value={returnValue(track, column.key, mode)}
                          highlightStyle={{
                            ...highlightStyle,
                            borderLeft: color && columnIndex === periodColumns.length - 1 ? `2px solid ${color}` : undefined,
                          }}
                        />
                      ))}
                    </tr>
                  )
                })}
                {!group.tracks.length && (
                  <tr>
                    <td colSpan={5} style={emptyStyle}>אין מסלולים להצגה</td>
                  </tr>
                )}
                {!!group.sourceRows.length && (
                  <tr style={{ background: '#FFF4BF' }}>
                    <td style={averageNameTdStyle}>
                      <span style={nameTextStyle}>תשואה ממוצעת לקבוצה</span>
                    </td>
                    {periodColumns.map(column => (
                      <ReturnTd key={column.key} value={average(group.sourceRows, column.key, mode)} />
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </article>
        ))}
      </section>

      {!groups.length && (
        <section style={emptyPanelStyle}>לא נמצאו מסלולים לפי הסינון הנוכחי.</section>
      )}

      {palette && (
        <div
          data-color-palette
          onClick={event => event.stopPropagation()}
          style={{ ...paletteStyle, left: palette.x, top: palette.y }}
        >
          <div style={swatchesStyle}>
            {paletteColors.map(color => (
              <button
                key={color}
                type="button"
                aria-label={`בחר צבע ${color}`}
                onClick={() => saveHighlight(palette.trackName, color)}
                style={{ ...swatchStyle, background: color }}
              />
            ))}
          </div>
          <button type="button" onClick={() => saveHighlight(palette.trackName)} style={clearButtonStyle}>× הסר</button>
        </div>
      )}
    </main>
  )
}

function PeriodHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), onClick())}
      aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}
      style={{ ...periodThStyle, cursor: 'pointer', color: active ? '#0B5CAD' : 'var(--abd-primary)' }}
    >
      {label}{active ? (dir === 'desc' ? ' ▼' : ' ▲') : ''}
    </th>
  )
}

function getHighlightCellStyle(color?: string): React.CSSProperties {
  if (!color) return {}
  return {
    borderTop: `2px solid ${color}`,
    borderBottom: `2px solid ${color}`,
    background: `${color}22`,
    backgroundClip: 'padding-box',
  }
}

function ReturnTd({ value, highlightStyle }: { value: number | null | undefined; highlightStyle?: React.CSSProperties }) {
  return (
    <td style={{ ...returnTdStyle, ...highlightStyle, color: returnColor(value) }}>
      {formatReturn(value)}
    </td>
  )
}

const headerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 16 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 30, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.6, fontSize: 14 }
const modeToggleStyle: React.CSSProperties = { display: 'flex', gap: 6, padding: 5, border: '1px solid #CFE6FA', borderRadius: 14, background: '#fff' }
const modeButtonStyle: React.CSSProperties = { border: 0, borderRadius: 10, background: 'transparent', color: 'var(--abd-primary)', padding: '10px 14px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const activeModeStyle: React.CSSProperties = { ...modeButtonStyle, background: 'var(--abd-accent)', color: '#fff' }
const productTabsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 14, padding: 10, boxShadow: 'var(--shadow-card)' }
const productTabStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 999, background: '#F8FBFF', color: 'var(--abd-primary)', padding: '9px 14px', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const activeProductTabStyle: React.CSSProperties = { ...productTabStyle, background: 'var(--abd-accent)', border: '1px solid var(--abd-accent)', color: '#fff', boxShadow: '0 8px 18px rgba(37,99,235,0.18)' }
const tableCardStyle: React.CSSProperties = { minWidth: 0, height: 432, background: '#fff', border: '0', borderRadius: 0, boxShadow: 'none', overflow: 'hidden' }
const tableTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 8, lineHeight: 1.1 }
const miniTableStyle: React.CSSProperties = { width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12.5 }
const periodThStyle: React.CSSProperties = { padding: '7px 5px', background: '#E3F3FF', color: 'var(--abd-primary)', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 900, border: 0 }
const nameTdStyle: React.CSSProperties = { padding: '6px 8px', color: 'var(--abd-primary)', fontWeight: 900, lineHeight: 1.15, height: 30, overflow: 'hidden', verticalAlign: 'middle', borderBottom: '1px solid #E1EEF8' }
const nameTextStyle: React.CSSProperties = { display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }
const averageNameTdStyle: React.CSSProperties = { ...nameTdStyle }
const returnTdStyle: React.CSSProperties = { padding: '6px 4px', height: 30, textAlign: 'center', fontWeight: 900, whiteSpace: 'nowrap', borderBottom: '1px solid #E1EEF8', verticalAlign: 'middle' }
const emptyStyle: React.CSSProperties = { padding: 18, textAlign: 'center', color: 'var(--text-muted)' }
const emptyPanelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #D7EAFB', borderRadius: 16, padding: 28, textAlign: 'center', color: 'var(--text-muted)' }
const paletteStyle: React.CSSProperties = { position: 'fixed', zIndex: 1000, width: 132, padding: 10, background: '#FFFFFF', border: '1px solid #D7EAFB', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,25,41,0.16)' }
const swatchesStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }
const swatchStyle: React.CSSProperties = { width: 22, height: 22, border: 0, borderRadius: 6, cursor: 'pointer' }
const clearButtonStyle: React.CSSProperties = { width: '100%', border: '1px solid #CFE6FA', borderRadius: 8, background: '#F8FBFF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontSize: 12, fontWeight: 900, padding: '5px 6px', cursor: 'pointer' }

