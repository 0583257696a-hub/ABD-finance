import { add, money, toIls, ZERO, type Money } from './money'
import { indexAmount, type CpiSeries } from './indexation'
import type { RetirementParams } from '../params/schema'
import type { BreakdownStep, CalculatorResult, Warning } from './tax-brackets'

/**
 * מחשבון שערוך מענקים פטורים — spec §4.
 * Revalues tax-exempt severance grants withdrawn during the lookback window
 * (32 years before the eligibility date) to eligibility-date terms, for use
 * in the rights-fixation offset formula (נוסחת הקיזוז, §5.3).
 */

export type GrantSource = 'form_161' | 'client_declaration' | 'estimate'

/**
 * Spec §4.4 point 2: severance deposited above the ceiling and already taxed
 * as capital gains at employment end is NOT an exempt withdrawal and must not
 * erode the exempt capital. 'pension_continuity' (רצף קצבה) and
 * 'severance_continuity' (רצף פיצויים, not yet actually withdrawn) are not
 * withdrawals either — §4.4 points 3-4.
 */
export type GrantTaxTreatment = 'exempt' | 'taxed' | 'taxed_capital_gains' | 'pension_continuity' | 'severance_continuity'

export type RetirementGrant = {
  id: string
  employerName: string
  grantDate: Date
  totalAmount: number
  /** רק החלק הפטור נכנס לחישוב — spec §4.4 point 1. */
  exemptAmount: number
  workYears: number
  source: GrantSource
  taxTreatment: GrantTaxTreatment
  documentRef?: string
}

export type GrantRevaluationInput = {
  retirementDate: Date
  eligibilityDate: Date
  grants: RetirementGrant[]
  taxYear: number
}

export type GrantDetail = {
  id: string
  grantDate: string
  exemptAmount: number
  indexFactor: number | null
  indexedAmount: number | null
  includedInLookback: boolean
  exclusionReason?: 'OUTSIDE_32_YEAR_LOOKBACK' | 'NO_EXEMPT_COMPONENT' | 'NOT_AN_EXEMPT_WITHDRAWAL'
}

export type GrantRevaluationValue = {
  totalIndexedExemptGrants: number
  grantDetails: GrantDetail[]
  excludedGrants: GrantDetail[]
}

function isoMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function calculateGrantRevaluation(
  params: RetirementParams,
  cpiSeries: CpiSeries,
  input: GrantRevaluationInput,
): CalculatorResult<GrantRevaluationValue> {
  const lookbackYears = params.incomeTax.grantLookbackYears.value
  const lookbackStart = new Date(input.eligibilityDate)
  lookbackStart.setFullYear(lookbackStart.getFullYear() - lookbackYears)

  const warnings: Warning[] = []
  const breakdown: BreakdownStep[] = [
    {
      label: 'חלון בחינה לאחור',
      formula: `גיל זכאות ${isoMonth(input.eligibilityDate)} − ${lookbackYears} שנים`,
      value: `${isoMonth(lookbackStart)} ואילך`,
    },
  ]

  const included: GrantDetail[] = []
  const excluded: GrantDetail[] = []
  let total: Money = ZERO
  let anyCpiEstimated = false

  for (const grant of input.grants) {
    const base: Omit<GrantDetail, 'includedInLookback'> = {
      id: grant.id,
      grantDate: isoMonth(grant.grantDate),
      exemptAmount: grant.exemptAmount,
      indexFactor: null,
      indexedAmount: null,
    }

    if (grant.grantDate < lookbackStart) {
      excluded.push({ ...base, includedInLookback: false, exclusionReason: 'OUTSIDE_32_YEAR_LOOKBACK' })
      continue
    }
    if (grant.taxTreatment !== 'exempt') {
      // taxed / taxed_capital_gains / continuity — none of these erode the
      // exempt capital (spec §4.4 points 2-4).
      excluded.push({ ...base, includedInLookback: true, exclusionReason: 'NOT_AN_EXEMPT_WITHDRAWAL' })
      continue
    }
    if (!(grant.exemptAmount > 0)) {
      excluded.push({ ...base, includedInLookback: true, exclusionReason: 'NO_EXEMPT_COMPONENT' })
      continue
    }

    const result = indexAmount({
      amount: money(grant.exemptAmount),
      fromDate: grant.grantDate,
      toDate: input.eligibilityDate,
      cpiSeries,
      // 'actual': revalue by the index of the grant month itself and the
      // eligibility month itself, matching spec §4.5's worked example
      // ("מדד 03/2010 · מדד 06/2026") — recorded in assumptions below.
      indexBasis: 'actual',
    })
    if (result.warnings.includes('CPI_ESTIMATED')) anyCpiEstimated = true

    total = add(total, result.indexedAmount)
    included.push({
      ...base,
      includedInLookback: true,
      indexFactor: result.factor.toDecimalPlaces(4).toNumber(),
      indexedAmount: result.indexedAmount.toDecimalPlaces(2).toNumber(),
    })
    breakdown.push({
      label: `מענק ${grant.employerName} (${isoMonth(grant.grantDate)})`,
      formula: `${toIls(money(grant.exemptAmount))} × ${result.factor.toDecimalPlaces(4).toString()}`,
      value: toIls(result.indexedAmount),
    })
  }

  if (excluded.some(grant => grant.exclusionReason === 'OUTSIDE_32_YEAR_LOOKBACK')) {
    warnings.push({ code: 'GRANTS_OUTSIDE_LOOKBACK', message: 'קיימים מענקים מחוץ ל-32 השנים — לא נכללו בחישוב.', severity: 'INFO' })
  }
  if (input.grants.some(grant => grant.source !== 'form_161')) {
    warnings.push({
      code: 'MISSING_161_FORMS',
      message: 'חלק מהמענקים אינם מגובים בטופס 161 — פקיד השומה עלול שלא להכיר בנתונים. יש להציג תרחיש "לפי הצהרת הלקוח" ותרחיש "לפי מסמכים בפועל".',
      severity: 'HIGH',
    })
  }
  if (anyCpiEstimated) {
    warnings.push({ code: 'CPI_ESTIMATED', message: 'חסר מדד לחודש מסוים — בוצעה אינטרפולציה לינארית.', severity: 'MEDIUM' })
  }

  breakdown.push({ label: 'סך מענקים פטורים משוערכים', formula: 'סכום כל המענקים שנכללו', value: toIls(total) })

  return {
    value: {
      totalIndexedExemptGrants: total.toDecimalPlaces(2).toNumber(),
      grantDetails: included,
      excludedGrants: excluded,
    },
    breakdown,
    assumptions: [
      { label: 'שנת מס', value: String(input.taxYear) },
      { label: 'בסיס הצמדה', value: 'actual — מדד חודש המענק מול מדד חודש הזכאות' },
    ],
    warnings,
    paramsVersion: params.meta.version,
    computedAt: new Date().toISOString(),
    legalRefs: ['סעיף 9א לפקודת מס הכנסה — נוסחת הקיזוז ו-32 שנות הבחינה'],
  }
}
