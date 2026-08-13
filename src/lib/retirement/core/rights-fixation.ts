import Decimal from 'decimal.js'
import { floorAtZero, money, toIls, toPercent, ZERO, type Money } from './money'
import { calculateIncomeTax } from './tax-brackets'
import type { RetirementParams } from '../params/schema'
import type { BreakdownStep, CalculatorResult, Warning } from './tax-brackets'

/**
 * מחשבון קיבוע זכויות — spec §5, the module's core calculator.
 * Computes the remaining exempt capital (יתרת הון פטורה) after the offset
 * formula (נוסחת הקיזוז §5.3), the resulting monthly pension exemption and
 * effective exemption rate, and an estimated net pension.
 *
 * NOT included yet (spec §5.6, the allocation-optimization engine):
 * comparing capitalization-vs-pension allocation scenarios needs CBS life-
 * expectancy tables and an NPV engine that don't exist in the module yet —
 * `allocationOptions` returns empty with an explicit warning rather than a
 * fabricated result. That is the next Phase 2 work item, not an oversight.
 */

export type RightsFixationInput = {
  gender: 'M' | 'F'
  birthDate: Date
  eligibilityDate: Date
  /** מפרק 4 — totalIndexedExemptGrants מתוך calculateGrantRevaluation. */
  indexedExemptGrants: number
  /** סך היוונים פטורים שנוצלו בעבר — קיזוז 1:1, לא 1.35. */
  previousCapitalizations: number
  hasSubmitted161H: boolean
  /** מועד הגשת 161ד בפועל, אם הוגש — משמש לדגל חלון החזרה של 3 חודשים. */
  fixationSubmissionDate?: Date
  monthlyEligiblePension: number
  monthlyRecognizedPension: number
  isDisability75Plus: boolean
  taxYear: number
}

export type AllocationOption = {
  name: string
  capitalWithdrawnNow: number
  monthlyExemptionAfter: number
  netPresentValue: number
  breakEvenAgeMonths: number
  taxSavedLifetime: number
}

export type RightsFixationValue = {
  eligible: boolean
  exemptCapitalCap: number
  grantsOffset: number
  capitalizationsOffset: number
  remainingExemptCapital: number
  monthlyPensionExemption: number
  effectiveExemptionRate: number
  taxablePensionPortion: number
  estimatedMonthlyTax: number
  netMonthlyPension: number
  allocationOptions: AllocationOption[]
}

function ageInMonths(birthDate: Date, atDate: Date): number {
  return (atDate.getFullYear() - birthDate.getFullYear()) * 12 + (atDate.getMonth() - birthDate.getMonth())
}

/**
 * Required eligibility age in months — male: fixed 67; female: by birth-year
 * table (spec §1.4 / חוק גיל פרישה). Exported for reuse by the Bituach Leumi
 * module in Phase 3.
 */
export function requiredEligibilityAgeMonths(params: RetirementParams, gender: 'M' | 'F', birthDate: Date): number {
  if (gender === 'M') return params.retirementAgeMale.value * 12

  const birthYear = birthDate.getFullYear()
  const table = params.retirementAgeFemale.value
  for (const row of table) {
    if (row.bornBefore) {
      const [cutYear, cutMonth] = row.bornBefore.split('-').map(Number)
      if (birthYear < cutYear || (birthYear === cutYear && birthDate.getMonth() + 1 <= cutMonth)) {
        return row.ageYears * 12 + row.ageMonths
      }
    } else if (row.bornYear === birthYear) {
      return row.ageYears * 12 + row.ageMonths
    }
  }
  // Born after the last tabulated year — the table's final row (1970 ואילך) applies.
  const last = table[table.length - 1]
  return last.ageYears * 12 + last.ageMonths
}

export function calculateRightsFixation(params: RetirementParams, input: RightsFixationInput): CalculatorResult<RightsFixationValue> {
  const warnings: Warning[] = []
  const breakdown: BreakdownStep[] = []

  // --- Gate check 1 (spec §5.5): eligibility age reached? ---
  const actualAgeMonths = ageInMonths(input.birthDate, input.eligibilityDate)
  const requiredMonths = requiredEligibilityAgeMonths(params, input.gender, input.birthDate)
  const eligible = actualAgeMonths >= requiredMonths || input.isDisability75Plus

  if (!eligible) {
    warnings.push({
      code: 'EARLY_RETIREMENT_NO_EXEMPTION',
      message: `גיל בפועל ${Math.floor(actualAgeMonths / 12)}ש' ${actualAgeMonths % 12}ח' — מתחת לגיל הזכאות (${Math.floor(requiredMonths / 12)}ש' ${requiredMonths % 12}ח'). אין פטור על קצבה מזכה בפרישה מוקדמת (למעט נקודות זיכוי).`,
      severity: 'HIGH',
    })
  }
  if (input.isDisability75Plus && actualAgeMonths < requiredMonths) {
    breakdown.push({ label: 'חריג נכות', formula: 'נכות יציבה מעל 75%', value: 'זכאי לפני גיל הזכאות' })
  }

  // --- Gate check 2 (spec §5.5): is there an eligible pension at all? ---
  if (!(input.monthlyEligiblePension > 0) && input.monthlyRecognizedPension > 0) {
    warnings.push({
      code: 'RECOGNIZED_PENSION_ONLY',
      message: 'כל הקצבה היא קצבה מוכרת — פטורה ממילא. שקול לשמור את סל הפטור להיוון עתידי במקום לנצלו כעת.',
      severity: 'INFO',
    })
  }

  // --- Gate check 3 (spec §5.5): 3-month reversibility window after 161ד. ---
  if (input.fixationSubmissionDate) {
    const monthsSinceSubmission = ageInMonths(input.fixationSubmissionDate, new Date())
    if (monthsSinceSubmission < 3) {
      warnings.push({
        code: 'FIXATION_REVERSIBLE_WINDOW',
        message: 'עברו פחות מ-3 חודשים מהגשת טופס 161ד — עדיין ניתן לחזור מהבחירה.',
        severity: 'INFO',
      })
    }
  }

  // --- Offset formula (spec §5.3) ---
  const cap = money(params.incomeTax.exemptCapitalCap.value)
  const months = params.incomeTax.capitalizationMonths.value
  const ceiling = money(params.incomeTax.eligiblePensionCeiling.value)

  // Spec §5.3 critical note: 1.35 is a formula RESULT, not a constant. The
  // derived value lives in the params file; sanity-gate it against the
  // expected ≈1.35 with the spec's own 0.02 tolerance.
  const offsetCoefficient = params.incomeTax.offsetCoefficient.value
  if (Math.abs(offsetCoefficient - 1.35) > 0.02) {
    warnings.push({
      code: 'OFFSET_COEFFICIENT_DRIFT',
      message: `מקדם הקיזוז בקובץ הפרמטרים (${offsetCoefficient}) חורג מעל 0.02 מהערך הצפוי 1.35 — נדרשת בדיקה ידנית.`,
      severity: 'HIGH',
    })
  }

  const grantsOffset = money(input.indexedExemptGrants).times(offsetCoefficient)
  const capitalizationsOffset = money(input.previousCapitalizations) // 1:1, לא 1.35 — spec §5.3
  const remainingExemptCapital = floorAtZero(cap.minus(grantsOffset).minus(capitalizationsOffset))

  if (remainingExemptCapital.isZero() && (grantsOffset.gt(0) || capitalizationsOffset.gt(0))) {
    warnings.push({ code: 'EXEMPT_CAPITAL_DEPLETED', message: 'יתרת ההון הפטורה אופסה — המשיכות/היוונים בעבר מיצו את סל הפטור.', severity: 'HIGH' })
  }

  breakdown.push(
    { label: 'תקרת הון פטורה', formula: `${params.incomeTax.eligiblePensionCeiling.value} × ${months} × ${toPercent(params.incomeTax.maxExemptionRate.value)}`, value: toIls(cap) },
    { label: 'קיזוז מענקים', formula: `${toIls(money(input.indexedExemptGrants))} × ${offsetCoefficient}`, value: `-${toIls(grantsOffset)}` },
    { label: 'קיזוז היוונים (1:1)', formula: toIls(capitalizationsOffset), value: `-${toIls(capitalizationsOffset)}` },
    { label: 'יתרת הון פטורה', formula: 'max(0, תקרה − קיזוזים)', value: toIls(remainingExemptCapital) },
  )

  // --- Exemption on the eligible pension ---
  const theoreticalMonthlyExemption = eligible ? remainingExemptCapital.dividedBy(months) : ZERO
  // The exemption cannot exceed the actual eligible pension.
  const monthlyExemption = Decimal.min(theoreticalMonthlyExemption, money(input.monthlyEligiblePension))
  const effectiveExemptionRate = theoreticalMonthlyExemption.dividedBy(ceiling).toDecimalPlaces(6).toNumber()
  const taxablePension = floorAtZero(money(input.monthlyEligiblePension).minus(monthlyExemption))

  breakdown.push(
    { label: 'פטור חודשי על קצבה מזכה', formula: `${toIls(remainingExemptCapital)} / ${months}${eligible ? '' : ' (לא זכאי — 0)'}`, value: toIls(theoreticalMonthlyExemption) },
    { label: 'שיעור הפטור', formula: `פטור חודשי / תקרת קצבה מזכה ${toIls(ceiling)}`, value: toPercent(effectiveExemptionRate, 2) },
    { label: 'חלק חייב בקצבה', formula: `${toIls(money(input.monthlyEligiblePension))} − ${toIls(monthlyExemption)}`, value: toIls(taxablePension) },
  )

  // --- Estimated tax on the taxable pension portion ---
  // Pension income (קצבה) is יגיעה אישית by the Ordinance's own definition —
  // personal-exertion brackets apply regardless of age.
  const creditPoints = params.incomeTax.residentCreditPoints.value + (input.gender === 'F' ? params.incomeTax.femaleAdditionalCreditPoints.value : 0)
  const taxResult = calculateIncomeTax(params, {
    annualIncome: taxablePension.times(12).toNumber(),
    incomeType: 'personal_exertion',
    age: Math.floor(actualAgeMonths / 12),
    creditPoints,
    taxYear: input.taxYear,
  })
  const estimatedMonthlyTax = money(taxResult.value.netTax).dividedBy(12)
  const netMonthlyPension = money(input.monthlyEligiblePension).minus(estimatedMonthlyTax).plus(input.monthlyRecognizedPension)

  breakdown.push(
    { label: 'מס חודשי משוער על החלק החייב', formula: `מס שנתי ${toIls(money(taxResult.value.netTax))} / 12 (כולל ${creditPoints} נק' זיכוי)`, value: toIls(estimatedMonthlyTax) },
    { label: 'קצבה חודשית נטו', formula: 'קצבה מזכה − מס + קצבה מוכרת (פטורה)', value: toIls(netMonthlyPension) },
  )

  warnings.push({
    code: 'ALLOCATION_OPTIMIZER_PENDING',
    message: 'מנוע האופטימיזציה להשוואת תרחישי הקצאה (spec §5.6) טרם מומש — דורש טבלאות תוחלת חיים של הלמ"ס ומנוע NPV. allocationOptions ריק בכוונה.',
    severity: 'INFO',
  })

  return {
    value: {
      eligible,
      exemptCapitalCap: cap.toNumber(),
      grantsOffset: grantsOffset.toDecimalPlaces(2).toNumber(),
      capitalizationsOffset: capitalizationsOffset.toDecimalPlaces(2).toNumber(),
      remainingExemptCapital: remainingExemptCapital.toDecimalPlaces(2).toNumber(),
      monthlyPensionExemption: theoreticalMonthlyExemption.toDecimalPlaces(2).toNumber(),
      effectiveExemptionRate,
      taxablePensionPortion: taxablePension.toDecimalPlaces(2).toNumber(),
      estimatedMonthlyTax: estimatedMonthlyTax.toDecimalPlaces(2).toNumber(),
      netMonthlyPension: netMonthlyPension.toDecimalPlaces(2).toNumber(),
      allocationOptions: [],
    },
    breakdown,
    assumptions: [
      { label: 'שנת מס', value: String(input.taxYear) },
      { label: 'סיווג קצבה', value: 'קצבה מזכה ממוסה כיגיעה אישית; קצבה מוכרת פטורה ממילא' },
      { label: 'נקודות זיכוי', value: String(creditPoints) },
    ],
    warnings,
    paramsVersion: params.meta.version,
    computedAt: new Date().toISOString(),
    legalRefs: ['סעיף 9א לפקודת מס הכנסה', 'טופס 161ד — מדריך רשות המסים'],
  }
}
