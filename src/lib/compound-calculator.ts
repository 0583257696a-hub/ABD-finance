// Shared compound-interest projection engine. Previously duplicated (and diverged)
// between simulations/page.tsx and calculators/page.tsx — this is the single
// source of truth now. Validates inputs, runs the fee-aware month-by-month
// simulation, and derives a no-fee comparison run to isolate real fee impact.

export type Scenario = 'conservative' | 'base' | 'optimistic'
export type TaxType = 'real' | 'nominal' | 'exempt'

export type CompoundInputs = {
  initialAmount: string
  monthlyDeposit: string
  annualReturn: string
  years: string
  depositFee: string
  annualFee: string
  inflation: string
  taxType: TaxType
  linked: boolean
  scenario: Scenario
}

export type AnnualRow = {
  year: number
  grossDeposits: number
  netBalance: number
  realBalance: number
  nominalGain: number
  realGain: number
  taxAmount: number
  afterTax: number
  depositFees: number
  accumulationFees: number
  totalFees: number
}

export type MonthlyRow = {
  month: number
  openingBalance: number
  grossDeposit: number
  depositFeeAmount: number
  netDeposit: number
  monthlyReturnAmount: number
  accumulationFeeAmount: number
  closingBalance: number
}

export type CompoundValidation = {
  valid: boolean
  errors: Partial<Record<keyof CompoundInputs, string>>
  messages: string[]
}

export const defaultCompoundInputs: CompoundInputs = {
  initialAmount: '100000',
  monthlyDeposit: '1500',
  annualReturn: '6',
  years: '20',
  depositFee: '0',
  annualFee: '0.6',
  inflation: '2',
  taxType: 'real',
  linked: false,
  scenario: 'base',
}

function num(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function scenarioAnnualReturn(inputs: CompoundInputs) {
  const base = num(inputs.annualReturn)
  if (inputs.scenario === 'conservative') return base - 2
  if (inputs.scenario === 'optimistic') return base + 2
  return base
}

function calculateTax(taxType: TaxType, nominalProfit: number, realProfit: number) {
  if (taxType === 'exempt') return 0
  if (taxType === 'nominal') return Math.max(0, nominalProfit * 0.25)
  return Math.max(0, realProfit * 0.25)
}

export function validateCompoundInputs(inputs: CompoundInputs): CompoundValidation {
  const errors: CompoundValidation['errors'] = {}
  const checks: Array<[keyof CompoundInputs, string, number, number]> = [
    ['initialAmount', 'סכום התחלתי חייב להיות בין 0 ל-100,000,000', 0, 100_000_000],
    ['monthlyDeposit', 'הפקדה חודשית חייבת להיות בין 0 ל-1,000,000', 0, 1_000_000],
    ['years', 'מספר שנים חייב להיות בין 0 ל-100', 0, 100],
    ['depositFee', 'דמי ניהול מהפקדה חייבים להיות בין 0% ל-100%', 0, 100],
    ['annualFee', 'דמי ניהול מצבירה חייבים להיות בין 0% ל-100%', 0, 100],
    ['inflation', 'אינפלציה שנתית חייבת להיות בין 20%- ל-100%', -20, 100],
  ]

  checks.forEach(([key, message, min, max]) => {
    const value = num(inputs[key])
    if (!Number.isFinite(value) || value < min || value > max) errors[key] = message
  })

  const annualReturn = scenarioAnnualReturn(inputs)
  if (!Number.isFinite(annualReturn) || annualReturn <= -100 || annualReturn > 100) {
    errors.annualReturn = 'תשואה שנתית חייבת להיות גדולה מ-100%- ועד 100%.'
  }

  const messages = Object.values(errors).filter(Boolean) as string[]
  return { valid: messages.length === 0, errors, messages }
}

function emptyCompoundResult(inputs: CompoundInputs, validation: CompoundValidation) {
  return {
    inputs,
    validation,
    annualRows: [] as AnnualRow[],
    monthlyRows: [] as MonthlyRow[],
    effectiveMonthlyReturn: 0,
    annualReturnWithScenario: scenarioAnnualReturn(inputs),
    grossDeposits: 0,
    netFinal: 0,
    realFinal: 0,
    nominalProfit: 0,
    realProfit: 0,
    taxFinal: 0,
    afterTaxFinal: 0,
    profits: 0,
    totalDepositFees: 0,
    totalAccumulationFees: 0,
    totalFees: 0,
    totalBalanceFees: 0,
    feeImpact: 0,
    investmentMultiplier: null as number | null,
  }
}

function runCompoundSimulation(params: {
  initialAmount: number
  monthlyDeposit: number
  years: number
  annualReturn: number
  depositFee: number
  annualAccumulationFee: number
  inflation: number
  taxType: TaxType
  linked?: boolean
}) {
  const totalMonths = Math.round(params.years * 12)
  // Nominal-rate convention: annual/12, matching the standard Israeli
  // calculator convention (and the reference implementation this engine was
  // validated against) — NOT geometric (1+r)^(1/12)-1. Same for the
  // accumulation fee. Inflation indexation stays geometric because CPI
  // linkage compounds monthly by definition.
  const monthlyRate = params.annualReturn / 100 / 12
  const monthlyFeeRate = params.annualAccumulationFee / 100 / 12
  const monthlyInflationFactor = Math.pow(1 + params.inflation / 100, 1 / 12)
  let balance = params.initialAmount
  let grossDeposit = params.monthlyDeposit
  let grossDeposits = params.initialAmount
  let totalDepositFees = 0
  let totalAccumulationFees = 0
  // CPI-indexed original cost (עלות מקורית צמודה) — the exempt basis for
  // real capital-gains tax: every shekel put in is indexed from ITS deposit
  // month to the current month, deposit-by-deposit. Recurrence:
  // basis_t = (basis_{t-1} + deposit_t) × monthlyInflationFactor.
  let indexedCostBasis = params.initialAmount
  const monthlyRows: MonthlyRow[] = []
  const annualRows: AnnualRow[] = []

  for (let month = 1; month <= totalMonths; month += 1) {
    const openingBalance = balance
    const depositFeeAmount = grossDeposit * (params.depositFee / 100)
    const netDeposit = grossDeposit - depositFeeAmount
    const balanceAfterDeposit = openingBalance + netDeposit
    // סדר החישוב: הפקדה נטו נכנסת בתחילת החודש, לאחר מכן תשואה חודשית (שנתי/12), ואז דמי ניהול מצבירה (שנתי/12) על היתרה לאחר תשואה.
    const balanceAfterReturn = balanceAfterDeposit * (1 + monthlyRate)
    const monthlyReturnAmount = balanceAfterReturn - balanceAfterDeposit
    const accumulationFeeAmount = balanceAfterReturn * monthlyFeeRate
    const closingBalance = balanceAfterReturn - accumulationFeeAmount

    grossDeposits += grossDeposit
    totalDepositFees += depositFeeAmount
    totalAccumulationFees += accumulationFeeAmount
    balance = closingBalance
    indexedCostBasis = (indexedCostBasis + grossDeposit) * monthlyInflationFactor

    monthlyRows.push({
      month,
      openingBalance,
      grossDeposit,
      depositFeeAmount,
      netDeposit,
      monthlyReturnAmount,
      accumulationFeeAmount,
      closingBalance,
    })

    if (params.linked) grossDeposit *= monthlyInflationFactor

    if (month % 12 === 0 || month === totalMonths) {
      const elapsedYears = month / 12
      const realBalance = balance / Math.pow(1 + params.inflation / 100, elapsedYears)
      const nominalGain = balance - grossDeposits
      // רווח ריאלי חייב במס = שווי נוכחי פחות העלות המקורית הצמודה (הצמדה
      // פר-הפקדה ממועד ההפקדה שלה) — שיטת המס הישראלית בפועל.
      const realGain = Math.max(0, balance - indexedCostBasis)
      const taxAmount = calculateTax(params.taxType, nominalGain, realGain)
      annualRows.push({
        year: elapsedYears,
        grossDeposits,
        netBalance: balance,
        realBalance,
        nominalGain,
        realGain,
        taxAmount,
        afterTax: balance - taxAmount,
        depositFees: totalDepositFees,
        accumulationFees: totalAccumulationFees,
        totalFees: totalDepositFees + totalAccumulationFees,
      })
    }
  }

  const elapsedYears = totalMonths / 12
  const realFinal = balance / Math.pow(1 + params.inflation / 100, elapsedYears)
  const nominalProfit = balance - grossDeposits
  const realProfit = Math.max(0, balance - indexedCostBasis)
  const taxFinal = calculateTax(params.taxType, nominalProfit, realProfit)

  return {
    annualRows,
    monthlyRows,
    grossDeposits,
    netFinal: balance,
    realFinal,
    nominalProfit,
    realProfit,
    taxFinal,
    afterTaxFinal: balance - taxFinal,
    totalDepositFees,
    totalAccumulationFees,
    totalFees: totalDepositFees + totalAccumulationFees,
    effectiveMonthlyReturn: monthlyRate - monthlyFeeRate,
  }
}

export function calculateCompoundProjection(inputs: CompoundInputs) {
  const validation = validateCompoundInputs(inputs)
  if (!validation.valid) return emptyCompoundResult(inputs, validation)

  const annualReturn = scenarioAnnualReturn(inputs)
  const base = runCompoundSimulation({
    initialAmount: num(inputs.initialAmount),
    monthlyDeposit: num(inputs.monthlyDeposit),
    years: num(inputs.years),
    annualReturn,
    depositFee: num(inputs.depositFee),
    annualAccumulationFee: num(inputs.annualFee),
    inflation: num(inputs.inflation),
    taxType: inputs.taxType,
    linked: inputs.linked,
  })
  const noFee = runCompoundSimulation({
    initialAmount: num(inputs.initialAmount),
    monthlyDeposit: num(inputs.monthlyDeposit),
    years: num(inputs.years),
    annualReturn,
    depositFee: 0,
    annualAccumulationFee: 0,
    inflation: num(inputs.inflation),
    taxType: inputs.taxType,
    linked: inputs.linked,
  })

  return {
    inputs,
    validation,
    annualRows: base.annualRows,
    monthlyRows: base.monthlyRows,
    effectiveMonthlyReturn: base.effectiveMonthlyReturn,
    annualReturnWithScenario: annualReturn,
    grossDeposits: base.grossDeposits,
    netFinal: base.netFinal,
    realFinal: base.realFinal,
    nominalProfit: base.nominalProfit,
    realProfit: base.realProfit,
    taxFinal: base.taxFinal,
    afterTaxFinal: base.afterTaxFinal,
    profits: base.nominalProfit,
    totalDepositFees: base.totalDepositFees,
    totalAccumulationFees: base.totalAccumulationFees,
    totalFees: base.totalFees,
    totalBalanceFees: base.totalAccumulationFees,
    feeImpact: Math.max(0, noFee.netFinal - base.netFinal),
    investmentMultiplier: base.grossDeposits > 0 ? base.netFinal / base.grossDeposits : null,
  }
}

export function buildScenarioRows(inputs: CompoundInputs) {
  const scenarios: Array<{ id: Scenario; label: string }> = [
    { id: 'conservative', label: 'שמרני' },
    { id: 'base', label: 'בסיס' },
    { id: 'optimistic', label: 'אופטימי' },
  ]
  const base = calculateCompoundProjection({ ...inputs, scenario: 'base' })
  return scenarios.map((scenario) => {
    const result = calculateCompoundProjection({ ...inputs, scenario: scenario.id })
    return {
      ...scenario,
      netFinal: result.netFinal,
      realFinal: result.realFinal,
      afterTaxFinal: result.afterTaxFinal,
      gapFromBase: result.netFinal - base.netFinal,
    }
  })
}
