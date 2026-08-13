/**
 * Parameter file schema for the retirement calculators module.
 * Every value-bearing field is a Parameter<T>, never a bare scalar — see
 * RETIREMENT_CALCULATORS_SPEC.md §0.1/§1.3. This is the single point where
 * "what does a parameter look like" is defined; params/YYYY.json and
 * loader.ts both depend on this shape.
 */

export type ReviewCadence = 'annual-january' | 'as-needed'

export type Parameter<T> = {
  value: T
  unit?: string
  label: string
  source: string
  sourceUrl?: string
  lastVerified: string // ISO date
  reviewCadence: ReviewCadence
  /** Set when a value is derived from a formula rather than published directly (e.g. offsetCoefficient). */
  derived?: boolean
  /** Free-text caveat, e.g. "תלוי-נסיבות או שנוי במחלוקת בין מקורות". */
  caveat?: string
}

export type TaxBracket = {
  upTo: number | null // null = no upper bound (top bracket)
  rate: number // e.g. 0.10 for 10%
}

export type RetirementAgeFemaleRow = {
  bornBefore?: string // "1959-12" style cutoff, inclusive
  bornYear?: number
  ageYears: number
  ageMonths: number
}

export type RetirementParams = {
  meta: {
    taxYear: number
    version: string
    lastFullReview: string
  }
  incomeTax: {
    eligiblePensionCeiling: Parameter<number>
    maxExemptionRate: Parameter<number>
    maxMonthlyExemption: Parameter<number>
    exemptCapitalCap: Parameter<number>
    capitalizationMonths: Parameter<number>
    offsetCoefficient: Parameter<number>
    grantLookbackYears: Parameter<number>
    exemptSeveranceCeilingPerYear: Parameter<number>
    spreadMaxYearsForward: Parameter<number>
    spreadYearsPerFourWorkYears: Parameter<number>
    creditPointValue: Parameter<number>
    residentCreditPoints: Parameter<number>
    femaleAdditionalCreditPoints: Parameter<number>
    amendment190MinPension: Parameter<number>
    amendment190TaxRate: Parameter<number>
    capitalGainsRateReal: Parameter<number>
    illegalWithdrawalRate: Parameter<number>
    surtaxThreshold: Parameter<number>
    surtaxRatePersonalExertion: Parameter<number>
    surtaxRateOther: Parameter<number>
  }
  taxBrackets: {
    /** From age 60, "other income" uses these same brackets — see spec §1.4 note; the type carries no separate over-60 table. */
    personalExertion: Parameter<TaxBracket[]>
    otherIncomeUnder60: Parameter<TaxBracket[]>
  }
  nationalInsurance: {
    oldAgeBaseSingle: Parameter<number>
    oldAgeSingleWithSpouse: Parameter<number>
    age80Supplement: Parameter<number>
    childSupplement: Parameter<number>
    seniorityRatePerYear: Parameter<number>
    seniorityMaxRate: Parameter<number>
    deferralRatePerYear: Parameter<number>
    deferralMaxRate: Parameter<number>
    healthInsuranceDeduction: Parameter<number>
    unconditionalAge: Parameter<number>
    incomeTestSingleFullPension: Parameter<number>
    incomeTestSingleZeroPension: Parameter<number>
    incomeTestWithSpouseFullPension: Parameter<number>
    incomeTestWithSpouseZeroPension: Parameter<number>
    incomeTestReductionRate: Parameter<number>
  }
  retirementAgeFemale: Parameter<RetirementAgeFemaleRow[]>
  retirementAgeMale: Parameter<number>
  mandatoryRetirementAge: Parameter<number>
  earlyRetirementMinAge: Parameter<number>
}

const PARAMETER_REQUIRED_KEYS: Array<keyof Parameter<unknown>> = ['value', 'label', 'source', 'lastVerified', 'reviewCadence']

export function isParameterShape(value: unknown): value is Parameter<unknown> {
  if (!value || typeof value !== 'object') return false
  return PARAMETER_REQUIRED_KEYS.every(key => key in (value as Record<string, unknown>))
}
