import { divide, money, multiply, type Money } from './money'

/**
 * Monthly CPI series, key "YYYY-MM" -> index value.
 * See RETIREMENT_CALCULATORS_SPEC.md §1.4 cpi.json — needs a full monthly
 * series from ~1975 (old grants can be that far back). NOT populated yet:
 * this is Phase 2 work (grant-revaluation.ts depends on it), tracked
 * separately — do not fabricate historical CPI values here.
 */
export type CpiSeries = Record<string, number>

export type IndexationResult = {
  indexedAmount: Money
  factor: Money
  fromIndex: number
  toIndex: number
  breakdown: Array<{ label: string; formula: string; value: string }>
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Looks up a CPI value for a given month, falling back to linear
 * interpolation between the nearest known months when missing (spec §3.1:
 * "מדד חסר → אינטרפולציה לינארית + דגל CPI_ESTIMATED"). Returns null if the
 * series has no data on either side to interpolate from.
 */
export function lookupCpi(series: CpiSeries, date: Date): { value: number; estimated: boolean } | null {
  const key = monthKey(date)
  if (series[key] != null) return { value: series[key], estimated: false }

  const knownMonths = Object.keys(series).sort()
  if (!knownMonths.length) return null

  const targetTime = date.getTime()
  let before: string | null = null
  let after: string | null = null
  for (const monthStr of knownMonths) {
    const [year, month] = monthStr.split('-').map(Number)
    const monthDate = new Date(year, month - 1, 1).getTime()
    if (monthDate <= targetTime) before = monthStr
    if (monthDate >= targetTime && !after) after = monthStr
  }
  if (!before || !after || before === after) return null

  const [by, bm] = before.split('-').map(Number)
  const [ay, am] = after.split('-').map(Number)
  const beforeTime = new Date(by, bm - 1, 1).getTime()
  const afterTime = new Date(ay, am - 1, 1).getTime()
  if (afterTime === beforeTime) return null

  const ratio = (targetTime - beforeTime) / (afterTime - beforeTime)
  const interpolated = series[before] + (series[after] - series[before]) * ratio
  return { value: interpolated, estimated: true }
}

/**
 * indexAmount — CPI-linked revaluation. See spec §3.1.
 * indexBasis: 'known' (the CPI figure actually published/known at `toDate`,
 * accounting for the ~1-month publication lag) vs 'actual' (the CPI value
 * whose reference month equals `toDate` itself, regardless of publication
 * lag). The spec requires this choice be explicit and recorded in the
 * output — never silently assumed.
 */
export function indexAmount(input: {
  amount: Money
  fromDate: Date
  toDate: Date
  cpiSeries: CpiSeries
  indexBasis: 'known' | 'actual'
}): IndexationResult & { warnings: string[] } {
  const warnings: string[] = []

  // 'known' basis: the CPI for month X is published mid-month X+1, so the
  // "known" index at any given date is the previous month's reading.
  const effectiveToDate = input.indexBasis === 'known'
    ? new Date(input.toDate.getFullYear(), input.toDate.getMonth() - 1, 1)
    : input.toDate

  const from = lookupCpi(input.cpiSeries, input.fromDate)
  const to = lookupCpi(input.cpiSeries, effectiveToDate)

  if (!from || !to) {
    throw new Error('indexAmount: CPI series has insufficient data to index this date range — do not guess, populate cpi.json.')
  }
  if (from.estimated || to.estimated) warnings.push('CPI_ESTIMATED')

  const factor = divide(money(to.value), from.value)
  const indexedAmount = multiply(input.amount, factor)

  return {
    indexedAmount,
    factor,
    fromIndex: from.value,
    toIndex: to.value,
    warnings,
    breakdown: [
      { label: 'מדד מוצא', formula: monthKey(input.fromDate), value: String(from.value) },
      { label: 'מדד יעד', formula: `${monthKey(effectiveToDate)} (basis: ${input.indexBasis})`, value: String(to.value) },
      { label: 'מקדם הצמדה', formula: `${to.value} / ${from.value}`, value: factor.toDecimalPlaces(4).toString() },
    ],
  }
}
