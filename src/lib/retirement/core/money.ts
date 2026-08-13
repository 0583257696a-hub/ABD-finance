import Decimal from 'decimal.js'

/**
 * All monetary math in the retirement module goes through Decimal, never
 * native float — see RETIREMENT_CALCULATORS_SPEC.md §0.1.5. Rounding only
 * happens at the display layer (money.toDisplay), never mid-calculation.
 */
export type Money = Decimal

export function money(value: Decimal.Value): Money {
  return new Decimal(value)
}

export const ZERO: Money = money(0)

export function add(...values: Money[]): Money {
  return values.reduce((sum, value) => sum.plus(value), ZERO)
}

export function subtract(a: Money, b: Money): Money {
  return a.minus(b)
}

export function multiply(a: Money, b: Decimal.Value): Money {
  return a.times(b)
}

export function divide(a: Money, b: Decimal.Value): Money {
  return a.dividedBy(b)
}

/** Clamps to zero — used wherever the spec requires "אין רצפה" checks to instead floor at 0 (e.g. remaining exempt capital). */
export function floorAtZero(value: Money): Money {
  return Decimal.max(value, ZERO)
}

/** Rounds to whole agorot (2 decimal places) — display layer only. */
export function toDisplay(value: Money): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

/** Formats as a breakdown-step value string, e.g. "976,005 ₪". */
export function toIls(value: Money): string {
  const rounded = value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
  return `${rounded.toNumber().toLocaleString('he-IL')} ₪`
}

export function toPercent(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`
}
