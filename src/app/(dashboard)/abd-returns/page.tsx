'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getAllAbdTracks,
  normalizeProductType,
  type AbdTrack,
} from '@/lib/returns-catalog'
import { Toolbar } from '@/components/ui/Toolbar'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

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
  if (value == null) return 'var(--text-muted)'
  if (value > 0) return 'var(--success)'
  if (value < 0) return 'var(--destructive)'
  return 'var(--text-heading)'
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
      <Toolbar
        title="תשואות ABD Finance"
        actions={
          <SegmentedControl
            options={[
              { value: 'average', label: 'תשואה ממוצעת' },
              { value: 'accumulated', label: 'תשואה מצטברת' },
            ]}
            value={mode}
            onChange={setMode}
          />
        }
      />

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
            <div style={tableScrollAreaStyle}>
              <table style={miniTableStyle}>
                <colgroup>
                  <col style={{ width: '39%' }} />
                  {periodColumns.map(column => <col key={column.key} style={{ width: `${61 / periodColumns.length}%` }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th style={periodThStyle}>שם</th>
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
                          background: color ? `${color}22` : index % 2 ? 'var(--bg-surface-sunken)' : 'var(--bg-surface)',
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
                </tbody>
              </table>
            </div>
            {!!group.sourceRows.length && (
              <table style={{ ...miniTableStyle, flexShrink: 0 }}>
                <colgroup>
                  <col style={{ width: '39%' }} />
                  {periodColumns.map(column => <col key={column.key} style={{ width: `${61 / periodColumns.length}%` }} />)}
                </colgroup>
                <tbody>
                  <tr style={{ background: 'var(--warning-bg)' }}>
                    <td style={averageNameTdStyle}>
                      <span style={nameTextStyle}>תשואה ממוצעת לקבוצה</span>
                    </td>
                    {periodColumns.map(column => (
                      <ReturnTd key={column.key} value={average(group.sourceRows, column.key, mode)} />
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
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
      style={{ ...periodThStyle, cursor: 'pointer', color: active ? 'var(--abd-accent)' : 'var(--text-heading)' }}
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

const productTabsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 10, boxShadow: 'var(--shadow-1)' }
const productTabStyle: React.CSSProperties = { border: '1px solid var(--separator)', borderRadius: 999, background: 'var(--bg-canvas)', color: 'var(--text-heading)', padding: '9px 14px', fontFamily: 'var(--font-main)', fontWeight: 700, cursor: 'pointer' }
const activeProductTabStyle: React.CSSProperties = { ...productTabStyle, background: 'var(--abd-accent)', border: '1px solid var(--abd-accent)', color: '#fff' }
const tableCardStyle: React.CSSProperties = { minWidth: 0, height: 432, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '0', borderRadius: 0, boxShadow: 'none', overflow: 'hidden' }
const tableScrollAreaStyle: React.CSSProperties = { flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }
const tableTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8, lineHeight: 1.1 }
const miniTableStyle: React.CSSProperties = { width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12.5 }
const periodThStyle: React.CSSProperties = { padding: '7px 5px', background: 'var(--bg-surface-sunken)', color: 'var(--text-heading)', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 700, border: 0 }
const nameTdStyle: React.CSSProperties = { padding: '6px 8px', color: 'var(--text-heading)', fontWeight: 700, lineHeight: 1.15, height: 30, overflow: 'hidden', verticalAlign: 'middle', borderBottom: '1px solid var(--separator)' }
const nameTextStyle: React.CSSProperties = { display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }
const averageNameTdStyle: React.CSSProperties = { ...nameTdStyle }
const returnTdStyle: React.CSSProperties = { padding: '6px 4px', height: 30, textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap', borderBottom: '1px solid var(--separator)', verticalAlign: 'middle' }
const emptyStyle: React.CSSProperties = { padding: 18, textAlign: 'center', color: 'var(--text-muted)' }
const emptyPanelStyle: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 28, textAlign: 'center', color: 'var(--text-muted)' }
const paletteStyle: React.CSSProperties = { position: 'fixed', zIndex: 1000, width: 132, padding: 10, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-floating)' }
const swatchesStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }
const swatchStyle: React.CSSProperties = { width: 22, height: 22, border: 0, borderRadius: 6, cursor: 'pointer' }
const clearButtonStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--separator)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-canvas)', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', fontSize: 12, fontWeight: 700, padding: '5px 6px', cursor: 'pointer' }

