import Decimal from 'decimal.js'
import { money, toIls, ZERO, type Money } from './money'
import { calculateIncomeTax } from './tax-brackets'
import { loadRetirementParams } from '../params/loader'
import type { RetirementParams } from '../params/schema'
import type { BreakdownStep, CalculatorResult, Warning } from './tax-brackets'

/**
 * מחשבון פריסת מס — סעיף 8(ג)(3), spec §6.
 * Computes the tax saving from spreading a TAXABLE retirement grant across
 * multiple tax years, forward or backward, comparing every allowed spread
 * length against the no-spread baseline — including the time value of the
 * deferred tax (spec §6.5.4: "להציג גם NPV, לא רק חיסכון נומינלי").
 */

export type TaxSpreadInput = {
  taxableGrant: number
  workYears: number
  retirementDate: Date
  direction: 'forward' | 'backward'
  /** Annual incomes for the spread years — projected (forward) or actual historical (backward). Keyed by tax year. */
  annualIncomeByYear: Record<number, number>
  creditPointsByYear: Record<number, number>
  age: number
  /**
   * Annual real discount rate for the NPV of deferred tax, e.g. 0.03.
   * Spec §6.5.4 requires time value be shown; the rate is an explicit
   * assumption, never silently defaulted.
   */
  discountRate: number
  taxYear: number
}

export type SpreadYearBreakdown = {
  year: number
  baseIncome: number
  grantPortion: number
  totalIncome: number
  taxWithGrant: number
  taxWithoutGrant: number
  incrementalTax: number
  marginalRate: number
}

export type SpreadScenario = {
  spreadYears: number
  yearlyBreakdown: SpreadYearBreakdown[]
  totalTax: number
  taxWithoutSpread: number
  savings: number
  npvOfSavings: number
}

export type TaxSpreadValue = {
  maxSpreadYears: number
  scenarios: SpreadScenario[]
  /** Index into scenarios of the highest-NPV option. */
  recommendedScenario: number
}

function paramsForYear(year: number, latestKnown: RetirementParams, warnings: Warning[], flaggedYears: Set<number>): RetirementParams {
  try {
    return loadRetirementParams(year).params
  } catch {
    // Future (or missing) year — use the latest known params, flagged once
    // per year per spec §6.5.1 (PROJECTED_PARAMS).
    if (!flaggedYears.has(year)) {
      flaggedYears.add(year)
      warnings.push({
        code: 'PROJECTED_PARAMS',
        message: `אין קובץ פרמטרים לשנת ${year} — נעשה שימוש בפרמטרים של שנת ${latestKnown.meta.taxYear}.`,
        severity: 'MEDIUM',
      })
    }
    return latestKnown
  }
}

export function calculateTaxSpread(params: RetirementParams, input: TaxSpreadInput): CalculatorResult<TaxSpreadValue> {
  const warnings: Warning[] = []
  const breakdown: BreakdownStep[] = []
  const flaggedYears = new Set<number>()

  const maxForward = params.incomeTax.spreadMaxYearsForward.value
  const perFourYears = params.incomeTax.spreadYearsPerFourWorkYears.value
  const maxSpreadYears = Math.max(1, Math.min(maxForward, Math.floor(input.workYears * perFourYears)))

  breakdown.push({
    label: 'שנות פריסה מותרות',
    formula: `min(${maxForward}, floor(${input.workYears} × ${perFourYears}))`,
    value: String(maxSpreadYears),
  })

  const retirementYear = input.retirementDate.getFullYear()
  const grant = money(input.taxableGrant)

  // Baseline: whole grant in the retirement year, on top of that year's income.
  const baselineIncome = money(input.annualIncomeByYear[retirementYear] ?? 0)
  const baselineParams = paramsForYear(retirementYear, params, warnings, flaggedYears)
  const baselineCredits = input.creditPointsByYear[retirementYear] ?? params.incomeTax.residentCreditPoints.value
  const baselineWith = calculateIncomeTax(baselineParams, {
    annualIncome: baselineIncome.plus(grant).toNumber(),
    incomeType: 'personal_exertion',
    age: input.age,
    creditPoints: baselineCredits,
    taxYear: retirementYear,
  })
  const baselineWithout = calculateIncomeTax(baselineParams, {
    annualIncome: baselineIncome.toNumber(),
    incomeType: 'personal_exertion',
    age: input.age,
    creditPoints: baselineCredits,
    taxYear: retirementYear,
  })
  const taxWithoutSpread = money(baselineWith.value.netTax).minus(baselineWithout.value.netTax)

  breakdown.push({
    label: 'מס ללא פריסה (הכל בשנת הפרישה)',
    formula: `מס(${toIls(baselineIncome.plus(grant))}) − מס(${toIls(baselineIncome)})`,
    value: toIls(taxWithoutSpread),
  })

  const incomeTestThreshold = params.nationalInsurance.incomeTestSingleFullPension.value

  const scenarios: SpreadScenario[] = []
  for (let n = 1; n <= maxSpreadYears; n++) {
    const portion = grant.dividedBy(n)
    const yearly: SpreadYearBreakdown[] = []
    let totalIncremental: Money = ZERO
    let npvIncremental: Money = ZERO

    for (let i = 0; i < n; i++) {
      const year = input.direction === 'forward' ? retirementYear + i : retirementYear - i
      const yearParams = paramsForYear(year, params, warnings, flaggedYears)
      const baseIncome = money(input.annualIncomeByYear[year] ?? 0)
      const credits = input.creditPointsByYear[year] ?? params.incomeTax.residentCreditPoints.value
      // Age moves with the year — matters for the age-60 bracket switch (spec §6.5.3).
      const ageAtYear = input.age + (input.direction === 'forward' ? i : -i)

      const withGrant = calculateIncomeTax(yearParams, {
        annualIncome: baseIncome.plus(portion).toNumber(),
        incomeType: 'personal_exertion',
        age: ageAtYear,
        creditPoints: credits,
        taxYear: year,
      })
      const withoutGrant = calculateIncomeTax(yearParams, {
        annualIncome: baseIncome.toNumber(),
        incomeType: 'personal_exertion',
        age: ageAtYear,
        creditPoints: credits,
        taxYear: year,
      })
      const incremental = money(withGrant.value.netTax).minus(withoutGrant.value.netTax)
      totalIncremental = totalIncremental.plus(incremental)

      // Time value: forward spread defers tax to year i (discount it);
      // backward spread amends past returns — tax is due now, no deferral.
      const discountFactor = input.direction === 'forward'
        ? new Decimal(1 + input.discountRate).pow(i)
        : new Decimal(1)
      npvIncremental = npvIncremental.plus(incremental.dividedBy(discountFactor))

      // Spec §6.5.2: the grant portion can push the client over the Bituach
      // Leumi income-test threshold for those years.
      const monthlyTotal = baseIncome.plus(portion).dividedBy(12)
      if (monthlyTotal.gt(incomeTestThreshold * 0.9) && !warnings.some(warning => warning.code === 'NEAR_INCOME_TEST_THRESHOLD')) {
        warnings.push({
          code: 'NEAR_INCOME_TEST_THRESHOLD',
          message: `בפריסה, ההכנסה החודשית (${toIls(monthlyTotal)}) מתקרבת או חוצה את סף מבחן ההכנסות של ביטוח לאומי (${toIls(money(incomeTestThreshold))}) — עלולה לפגוע בקצבת הזקנה.`,
          severity: 'HIGH',
        })
      }

      yearly.push({
        year,
        baseIncome: baseIncome.toNumber(),
        grantPortion: portion.toDecimalPlaces(2).toNumber(),
        totalIncome: baseIncome.plus(portion).toDecimalPlaces(2).toNumber(),
        taxWithGrant: withGrant.value.netTax,
        taxWithoutGrant: withoutGrant.value.netTax,
        incrementalTax: incremental.toDecimalPlaces(2).toNumber(),
        marginalRate: withGrant.value.marginalRate,
      })
    }

    scenarios.push({
      spreadYears: n,
      yearlyBreakdown: yearly,
      totalTax: totalIncremental.toDecimalPlaces(2).toNumber(),
      taxWithoutSpread: taxWithoutSpread.toDecimalPlaces(2).toNumber(),
      savings: taxWithoutSpread.minus(totalIncremental).toDecimalPlaces(2).toNumber(),
      npvOfSavings: taxWithoutSpread.minus(npvIncremental).toDecimalPlaces(2).toNumber(),
    })
  }

  let recommendedScenario = 0
  for (let i = 1; i < scenarios.length; i++) {
    if (scenarios[i].npvOfSavings > scenarios[recommendedScenario].npvOfSavings) recommendedScenario = i
  }

  breakdown.push({
    label: 'תרחיש מומלץ',
    formula: `המרב מבין ${scenarios.length} תרחישים לפי NPV`,
    value: `פריסה ל-${scenarios[recommendedScenario].spreadYears} שנים, חיסכון ${toIls(money(scenarios[recommendedScenario].savings))}`,
  })

  if (input.direction === 'backward') {
    warnings.push({
      code: 'BACKWARD_SPREAD_REQUIRES_AMENDED_RETURNS',
      message: 'פריסה לאחור מחייבת תיקון דוחות שנתיים והכנסות בפועל של השנים הרלוונטיות — הערכים כאן טובים רק כמו נתוני ההכנסה ההיסטוריים שהוזנו.',
      severity: 'MEDIUM',
    })
  }

  return {
    value: { maxSpreadYears, scenarios, recommendedScenario },
    breakdown,
    assumptions: [
      { label: 'שנת מס בסיס', value: String(input.taxYear) },
      { label: 'כיוון פריסה', value: input.direction === 'forward' ? 'קדימה' : 'לאחור' },
      { label: 'שיעור היוון', value: `${(input.discountRate * 100).toFixed(1)}%` },
      { label: 'סיווג המענק', value: 'מענק חייב ממוסה כיגיעה אישית' },
    ],
    warnings,
    paramsVersion: params.meta.version,
    computedAt: new Date().toISOString(),
    legalRefs: ['סעיף 8(ג)(3) לפקודת מס הכנסה'],
  }
}
