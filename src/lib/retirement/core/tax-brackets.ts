import Decimal from 'decimal.js'
import { add, floorAtZero, money, toIls, toPercent, ZERO, type Money } from './money'
import { annualCreditValue } from './credit-points'
import type { RetirementParams, TaxBracket } from '../params/schema'

export type BreakdownStep = { label: string; formula: string; value: string; note?: string }
export type Assumption = { label: string; value: string }
export type Warning = { code: string; message: string; severity: 'INFO' | 'MEDIUM' | 'HIGH' }

export type CalculatorResult<T> = {
  value: T
  breakdown: BreakdownStep[]
  assumptions: Assumption[]
  warnings: Warning[]
  paramsVersion: string
  computedAt: string
  legalRefs: string[]
}

export type IncomeType = 'personal_exertion' | 'other'

/**
 * Marginal tax owed on the slice of income between `from` and `to` (both
 * annual, both >= 0, to >= from), walking the bracket schedule. This is the
 * shared primitive behind both calculateIncomeTax (from=0) and
 * calculateCombinedIncomeTax's second income stream (from = the first
 * stream's total, per spec §2.2 "stacking" rule).
 */
export function taxOnIncomeRange(brackets: TaxBracket[], from: Money, to: Money): { tax: Money; breakdown: BreakdownStep[] } {
  let tax: Money = ZERO
  let bracketFloor: Money = ZERO
  const breakdown: BreakdownStep[] = []

  for (const bracket of brackets) {
    const bracketCeiling = bracket.upTo == null ? null : money(bracket.upTo)
    const overlapStart = Decimal.max(from, bracketFloor)
    const overlapEnd = bracketCeiling == null ? to : Decimal.min(to, bracketCeiling)

    if (overlapEnd.gt(overlapStart)) {
      const amountInBracket = overlapEnd.minus(overlapStart)
      const bracketTax = amountInBracket.times(bracket.rate)
      tax = tax.plus(bracketTax)
      breakdown.push({
        label: `מדרגה ${toIls(overlapStart)} – ${bracketCeiling ? toIls(bracketCeiling) : '∞'} (${toPercent(bracket.rate)})`,
        formula: `${toIls(amountInBracket)} × ${toPercent(bracket.rate)}`,
        value: toIls(bracketTax),
      })
    }
    if (bracketCeiling != null) bracketFloor = bracketCeiling
  }

  return { tax, breakdown }
}

function marginalRateAt(brackets: TaxBracket[], income: Money): number {
  let floor: Money = ZERO
  for (const bracket of brackets) {
    const ceiling = bracket.upTo == null ? null : money(bracket.upTo)
    if (ceiling == null || income.lte(ceiling)) return bracket.rate
    floor = ceiling
  }
  return brackets[brackets.length - 1]?.rate ?? 0
}

/**
 * Resolves which bracket schedule applies. "Other" (non-personal-exertion)
 * income uses its own, less favorable schedule below age 60 — from 60
 * onward it gets the personal-exertion schedule instead. See spec §1.4:
 * "זו נקודת החיתוך הקריטית לתכנון פרישה, לממש כלוגיקה מפורשת."
 */
export function resolveBracketSchedule(params: RetirementParams, incomeType: IncomeType, age: number): TaxBracket[] {
  if (incomeType === 'personal_exertion') return params.taxBrackets.personalExertion.value
  return age >= 60 ? params.taxBrackets.personalExertion.value : params.taxBrackets.otherIncomeUnder60.value
}

function applySurtax(params: RetirementParams, incomeType: IncomeType, annualIncome: Money): { surtax: Money; breakdown: BreakdownStep[] } {
  const threshold = money(params.incomeTax.surtaxThreshold.value)
  if (annualIncome.lte(threshold)) return { surtax: ZERO, breakdown: [] }
  const rate = incomeType === 'personal_exertion' ? params.incomeTax.surtaxRatePersonalExertion.value : params.incomeTax.surtaxRateOther.value
  const excess = annualIncome.minus(threshold)
  const surtax = excess.times(rate)
  return {
    surtax,
    breakdown: [{ label: 'מס יסף', formula: `${toIls(excess)} × ${toPercent(rate)} (מעל ${toIls(threshold)})`, value: toIls(surtax) }],
  }
}

export type IncomeTaxInput = {
  annualIncome: number
  incomeType: IncomeType
  age: number
  creditPoints: number
  taxYear: number
  additionalCredits?: number[] // ILS, annual — extra credit amounts beyond the standard points
}

export type IncomeTaxValue = {
  grossTax: number
  netTax: number
  effectiveRate: number
  marginalRate: number
}

/** calculateIncomeTax — spec §2.1. Single income stream, from zero. */
export function calculateIncomeTax(params: RetirementParams, input: IncomeTaxInput): CalculatorResult<IncomeTaxValue> {
  const annualIncome = money(input.annualIncome)
  const brackets = resolveBracketSchedule(params, input.incomeType, input.age)
  const { tax: bracketTax, breakdown: bracketBreakdown } = taxOnIncomeRange(brackets, ZERO, annualIncome)
  const { surtax, breakdown: surtaxBreakdown } = applySurtax(params, input.incomeType, annualIncome)
  const grossTax = bracketTax.plus(surtax)

  const additionalCreditsTotal = add(...(input.additionalCredits ?? []).map(money))
  const creditsValue = annualCreditValue(params, input.creditPoints).plus(additionalCreditsTotal)
  const netTax = floorAtZero(grossTax.minus(creditsValue))

  const breakdown: BreakdownStep[] = [
    ...bracketBreakdown,
    ...surtaxBreakdown,
    { label: 'זיכויים', formula: `${input.creditPoints} נק' × ${params.incomeTax.creditPointValue.value}×12`, value: `-${toIls(creditsValue)}` },
    { label: 'מס נטו', formula: 'מס ברוטו − זיכויים (מינימום 0)', value: toIls(netTax) },
  ]

  return {
    value: {
      grossTax: grossTax.toDecimalPlaces(2).toNumber(),
      netTax: netTax.toDecimalPlaces(2).toNumber(),
      effectiveRate: annualIncome.gt(0) ? netTax.dividedBy(annualIncome).toNumber() : 0,
      marginalRate: marginalRateAt(brackets, annualIncome) + (annualIncome.gt(params.incomeTax.surtaxThreshold.value) ? (input.incomeType === 'personal_exertion' ? params.incomeTax.surtaxRatePersonalExertion.value : params.incomeTax.surtaxRateOther.value) : 0),
    },
    breakdown,
    assumptions: [{ label: 'שנת מס', value: String(input.taxYear) }],
    warnings: [],
    paramsVersion: params.meta.version,
    computedAt: new Date().toISOString(),
    legalRefs: ['פקודת מס הכנסה - מדרגות מס'],
  }
}

export type CombinedIncomeTaxInput = {
  personalExertionIncome: number
  otherIncome: number
  age: number
  creditPoints: number
  taxYear: number
  additionalCredits?: number[]
}

/**
 * calculateCombinedIncomeTax — spec §2.2. The critical rule: "other" income
 * is taxed as if stacked on top of personal-exertion income, i.e. its
 * brackets start from the personal-exertion total, not from zero. This is
 * the single most common source of error in hand calculations per the spec.
 */
export function calculateCombinedIncomeTax(params: RetirementParams, input: CombinedIncomeTaxInput): CalculatorResult<IncomeTaxValue> {
  const personalIncome = money(input.personalExertionIncome)
  const otherIncome = money(input.otherIncome)
  const totalIncome = personalIncome.plus(otherIncome)

  const personalBrackets = resolveBracketSchedule(params, 'personal_exertion', input.age)
  const otherBrackets = resolveBracketSchedule(params, 'other', input.age)

  const { tax: personalTax, breakdown: personalBreakdown } = taxOnIncomeRange(personalBrackets, ZERO, personalIncome)
  const { tax: otherTax, breakdown: otherBreakdown } = taxOnIncomeRange(otherBrackets, personalIncome, totalIncome)

  // Surtax is assessed once, on total income above the threshold, at whichever rate corresponds to the income
  // type that pushed the total over it — the spec doesn't disambiguate a split, so this is our explicit choice.
  const totalExceedsThreshold = totalIncome.gt(params.incomeTax.surtaxThreshold.value)
  const personalAloneExceeds = personalIncome.gt(params.incomeTax.surtaxThreshold.value)
  let surtax: Money = ZERO
  let surtaxBreakdown: BreakdownStep[] = []
  if (totalExceedsThreshold) {
    const threshold = money(params.incomeTax.surtaxThreshold.value)
    const excess = totalIncome.minus(threshold)
    const rate = personalAloneExceeds
      ? params.incomeTax.surtaxRatePersonalExertion.value
      : params.incomeTax.surtaxRateOther.value
    surtax = excess.times(rate)
    surtaxBreakdown = [{
      label: 'מס יסף (על סך ההכנסה)',
      formula: `${toIls(excess)} × ${toPercent(rate)}`,
      value: toIls(surtax),
      note: personalAloneExceeds ? 'הסף נחצה כבר בהכנסה מיגיעה אישית' : 'הסף נחצה עם צירוף ההכנסה האחרת',
    }]
  }

  const grossTax = personalTax.plus(otherTax).plus(surtax)
  const additionalCreditsTotal = add(...(input.additionalCredits ?? []).map(money))
  const creditsValue = annualCreditValue(params, input.creditPoints).plus(additionalCreditsTotal)
  const netTax = floorAtZero(grossTax.minus(creditsValue))

  const breakdown: BreakdownStep[] = [
    { label: 'מס על הכנסה מיגיעה אישית', formula: `${toIls(personalIncome)} לפי מדרגות מיגיעה אישית`, value: toIls(personalTax) },
    ...personalBreakdown,
    { label: 'מס על הכנסה אחרת (מוערמת מעל ההכנסה מיגיעה אישית)', formula: `${toIls(otherIncome)} החל מנקודת ${toIls(personalIncome)}`, value: toIls(otherTax) },
    ...otherBreakdown,
    ...surtaxBreakdown,
    { label: 'זיכויים', formula: `${input.creditPoints} נק' × ${params.incomeTax.creditPointValue.value}×12`, value: `-${toIls(creditsValue)}` },
    { label: 'מס נטו', formula: 'מס ברוטו − זיכויים (מינימום 0)', value: toIls(netTax) },
  ]

  return {
    value: {
      grossTax: grossTax.toDecimalPlaces(2).toNumber(),
      netTax: netTax.toDecimalPlaces(2).toNumber(),
      effectiveRate: totalIncome.gt(0) ? netTax.dividedBy(totalIncome).toNumber() : 0,
      marginalRate: marginalRateAt(otherBrackets, totalIncome),
    },
    breakdown,
    assumptions: [{ label: 'שנת מס', value: String(input.taxYear) }, { label: 'סדר חישוב', value: 'הכנסה מיגיעה אישית תחילה, הכנסה אחרת מוערמת מעליה' }],
    warnings: [],
    paramsVersion: params.meta.version,
    computedAt: new Date().toISOString(),
    legalRefs: ['פקודת מס הכנסה - מדרגות מס'],
  }
}
