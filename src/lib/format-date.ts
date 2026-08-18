/**
 * ONE date/time format across the app (the QA audit found three:
 * "18.8.2026, 0:15" / "18.08.2026 00:57" / "18 באוגוסט 2026").
 *   formatDateTime → 18.08.2026 00:15
 *   formatDate     → 18.08.2026
 *   formatLongDate → 18 באוגוסט 2026 (documents/letters only)
 */
const TZ = 'Asia/Jerusalem'

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: string | number | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(date)
}

export function formatTime(value: string | number | Date | null | undefined, fallback = ''): string {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TZ }).format(date)
}

export function formatDateTime(value: string | number | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value)
  if (!date) return fallback
  return `${formatDate(date)} ${formatTime(date)}`
}

export function formatLongDate(value: string | number | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(date)
}

/** Currency for documents: ₪1,234,567 (no decimals). */
export function formatShekel(value: number | string | null | undefined, fallback = '—'): string {
  const number = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(number)) return fallback
  return `₪${Math.round(number).toLocaleString('he-IL')}`
}
