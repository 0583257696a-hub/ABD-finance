'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { GripVertical } from 'lucide-react'

export type DataTableColumn<T> = {
  key: string
  label: string
  numeric?: boolean
  width: number
  minWidth?: number
  render?: (row: T) => ReactNode
  /** Value to compare when sorting by this column. Defaults to reading `row[key]`. */
  sortValue?: (row: T) => string | number
}

type SortDirection = 'asc' | 'desc'

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * Shared table primitive: sortable + resizable + reorderable columns.
 * Consolidates the three near-identical hand-rolled implementations found
 * across FundsWorkspace, simulations (infrastructure table) and returns —
 * see redesign plan §3.3. Column resize uses pointer events (not raw
 * mousemove/mouseup) so it works with touch/pen and cleans up correctly if
 * the component unmounts mid-drag. Reordering only starts from the grip
 * handle, not the whole header cell, so it never fights with the click-to-
 * sort hit zone.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  initialSort,
  storageKey,
  emptyMessage = 'אין נתונים להצגה',
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  initialSort?: { key: string; direction: SortDirection }
  /** When provided, column order + widths persist to localStorage under this key. */
  storageKey?: string
  emptyMessage?: string
}) {
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    storageKey ? loadJson(`${storageKey}_order`, columns.map(c => c.key)) : columns.map(c => c.key),
  )
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    storageKey
      ? loadJson(`${storageKey}_widths`, Object.fromEntries(columns.map(c => [c.key, c.width])))
      : Object.fromEntries(columns.map(c => [c.key, c.width])),
  )
  const [sortKey, setSortKey] = useState(initialSort?.key ?? columns[0]?.key)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort?.direction ?? 'asc')
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const resizeState = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    if (storageKey) localStorage.setItem(`${storageKey}_order`, JSON.stringify(columnOrder))
  }, [columnOrder, storageKey])
  useEffect(() => {
    if (storageKey) localStorage.setItem(`${storageKey}_widths`, JSON.stringify(columnWidths))
  }, [columnWidths, storageKey])

  const orderedColumns = columnOrder.map(key => columns.find(c => c.key === key)).filter((c): c is DataTableColumn<T> => Boolean(c))
  const sortColumn = columns.find(c => c.key === sortKey)

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortColumn) return 0
    const av = sortColumn.sortValue ? sortColumn.sortValue(a) : (a as Record<string, unknown>)[sortColumn.key]
    const bv = sortColumn.sortValue ? sortColumn.sortValue(b) : (b as Record<string, unknown>)[sortColumn.key]
    const result = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av ?? '').localeCompare(String(bv ?? ''), 'he')
    return sortDirection === 'asc' ? result : -result
  })

  function applySort(key: string) {
    if (sortKey === key) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  function moveColumn(dragged: string, target: string) {
    if (dragged === target) return
    setColumnOrder(current => {
      const next = current.filter(key => key !== dragged)
      const targetIndex = next.indexOf(target)
      next.splice(targetIndex, 0, dragged)
      return next
    })
  }

  // Resize via Pointer Events: works for mouse/touch/pen, and setPointerCapture
  // means we always get pointerup even if the cursor leaves the header cell.
  function startResize(event: React.PointerEvent, columnKey: string) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(event.pointerId)
    resizeState.current = { key: columnKey, startX: event.clientX, startWidth: columnWidths[columnKey] ?? 120 }

    function onMove(moveEvent: PointerEvent) {
      if (!resizeState.current) return
      const column = columns.find(c => c.key === resizeState.current!.key)
      const delta = moveEvent.clientX - resizeState.current.startX
      const nextWidth = Math.max(column?.minWidth ?? 80, resizeState.current.startWidth + delta)
      setColumnWidths(current => ({ ...current, [resizeState.current!.key]: nextWidth }))
    }
    function onUp() {
      resizeState.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div style={wrapStyle}>
      <table style={tableStyle}>
        <colgroup>
          {orderedColumns.map(column => (
            <col key={column.key} style={{ width: columnWidths[column.key] ?? column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {orderedColumns.map(column => {
              const active = sortKey === column.key
              return (
                <th
                  key={column.key}
                  style={thStyle}
                  onDragOver={event => event.preventDefault()}
                  onDrop={() => {
                    if (draggedColumn) moveColumn(draggedColumn, column.key)
                    setDraggedColumn(null)
                  }}
                >
                  <div style={thContentStyle}>
                    <span
                      draggable
                      onDragStart={() => setDraggedColumn(column.key)}
                      onDragEnd={() => setDraggedColumn(null)}
                      style={gripStyle}
                      aria-hidden
                    >
                      <GripVertical size={13} />
                    </span>
                    <button type="button" onClick={() => applySort(column.key)} style={sortButtonStyle}>
                      {column.label}
                      {active && <span style={{ color: 'var(--abd-accent)' }}>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    </button>
                    <span onPointerDown={event => startResize(event, column.key)} style={resizeHandleStyle} aria-hidden />
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                background: index % 2 ? 'var(--bg-surface-sunken)' : 'var(--bg-surface)',
              }}
            >
              {orderedColumns.map(column => (
                <td key={column.key} style={{ ...tdStyle, textAlign: column.numeric ? 'left' : 'right' }}>
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
          {!sortedRows.length && (
            <tr>
              <td colSpan={orderedColumns.length} style={emptyStyle}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const wrapStyle: CSSProperties = { overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--separator)' }
const tableStyle: CSSProperties = { width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 14 }
const thStyle: CSSProperties = { position: 'relative', background: 'var(--bg-surface-sunken)', borderBottom: '1px solid var(--separator)', padding: 0, textAlign: 'right' }
const thContentStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px' }
const gripStyle: CSSProperties = { display: 'flex', color: 'var(--text-tertiary)', cursor: 'grab', flexShrink: 0 }
const sortButtonStyle: CSSProperties = { flex: 1, border: 0, background: 'transparent', textAlign: 'right', padding: 0, fontFamily: 'var(--font-main)', fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)', cursor: 'pointer', whiteSpace: 'nowrap' }
const resizeHandleStyle: CSSProperties = { width: 6, alignSelf: 'stretch', cursor: 'col-resize', flexShrink: 0, touchAction: 'none' }
const tdStyle: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--separator)', color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const emptyStyle: CSSProperties = { padding: 28, textAlign: 'center', color: 'var(--text-muted)' }
