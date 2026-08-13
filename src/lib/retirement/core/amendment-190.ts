import Decimal from 'decimal.js'
import { floorAtZero, money, toIls, toPercent, type Money } from './money'
import type { RetirementParams } from '../params/schema'
import type { BreakdownStep, CalculatorResult, Warning } from './tax-brackets'

/**
 * מחשבון תיקון 190 — spec §7.
 * Compares investing free cash via an Amendment-190 provident fund
 * (capital withdrawal at 15% NOMINAL tax, or annuity at 0%), a
 * kupat-gemel-lehashkaa (25% REAL tax), and a managed portfolio (25% real
 * with annual realization drag). The nominal-vs-real distinction is the
 * heart of the comparison (spec §7.5) — including the inflation rate at
 * which the ranking flips.
 */

export type Amendment190Input = {
  depositAmount: number
  currentAge: number
  withdrawalAge: number
  /** Annual nominal gross return, e.g. 0.06. */
  expectedNominalReturn: number
  /** Annual inflation assumption, e.g. 0.02. */
  expectedInflation: number
  managementFees: {
    amendment190: { fromDeposit: number; fromAccumulation: number }
    investmentGemel: { fromAccumulation: number }
    managedPortfolio: { annualFee: number; tradingCosts: number }
  }
  /** שיעור מימוש שנתי בתיק מנוהל — fraction of gains realized (and taxed) each year. */
  portfolioTurnoverRate: number
  /** קצבה מזערית מוכחת נוכחית ₪/חודש — gate check 2. */
  currentPension: number
  intendedUse: 'capital' | 'annuity' | 'inheritance'
}

export type Amendment190Track = {
  name: string
  finalValue: number
  totalTax: number
  netValue: number
  effectiveTaxOnGain: number
}

export type Amendment190Value = {
  eligible: boolean
  tracks: Amendment190Track[]
  /** Index of the best net-value track among those actually available to the client. */
  bestTrack: number
  /** Inflation rate at which 190-capital and gemel-lehashkaa net values cross (spec §7.5), null if no crossover in [0, 20%]. */
  breakEvenInflation: number | null
  inheritanceNotes: string[]
}

function netAnnualRate(gross: number, fee: number): Decimal {
  return new Decimal(1 + gross - fee)
}

export function calculateAmendment190(params: RetirementParams, input: Amendment190Input): CalculatorResult<Amendment190Value> {
  const warnings: Warning[] = []
  const breakdown: BreakdownStep[] = []

  const years = input.withdrawalAge - input.currentAge
  if (years <= 0) throw new Error('calculateAmendment190: withdrawalAge must be after currentAge.')

  // --- Gate checks (spec §7.2) ---
  const minPension = params.incomeTax.amendment190MinPension.value
  const ageOk = input.currentAge >= 60
  const pensionOk = input.currentPension >= minPension
  const eligible = ageOk && pensionOk

  if (!ageOk) {
    warnings.push({ code: 'A190_UNDER_60', message: `גיל ${input.currentAge} — משיכה הונית לפי תיקון 190 אפשרית רק מגיל 60.`, severity: 'HIGH' })
  }
  if (!pensionOk) {
    warnings.push({
      code: 'A190_NO_MIN_PENSION',
      message: `קצבה נוכחית ${toIls(money(input.currentPension))} מתחת לקצבה המזערית ${toIls(money(minPension))} (נדרשים 3 תלושים) — משיכה תסווג "שלא כדין": ${toPercent(params.incomeTax.illegalWithdrawalRate.value)} מס על הקרן והרווחים.`,
      severity: 'HIGH',
    })
  }

  const principal = money(input.depositAmount)
  const nominalTaxRate = params.incomeTax.amendment190TaxRate.value
  const realTaxRate = params.incomeTax.capitalGainsRateReal.value
  const inflationFactor = new Decimal(1 + input.expectedInflation).pow(years)

  // --- Track 1: Amendment 190, capital withdrawal — 15% NOMINAL (spec §7.4) ---
  const p190 = principal.times(1 - input.managementFees.amendment190.fromDeposit)
  const fv190 = p190.times(netAnnualRate(input.expectedNominalReturn, input.managementFees.amendment190.fromAccumulation).pow(years))
  const gain190 = floorAtZero(fv190.minus(principal))
  const tax190 = gain190.times(nominalTaxRate)
  const net190 = fv190.minus(tax190)

  // --- Track 2: Amendment 190, annuity — 0% tax (spec §7.4) ---
  const net190Annuity = fv190

  // --- Track 3: kupat gemel lehashkaa — 25% REAL (spec §7.4) ---
  const fvGemel = principal.times(netAnnualRate(input.expectedNominalReturn, input.managementFees.investmentGemel.fromAccumulation).pow(years))
  const realGainGemel = floorAtZero(fvGemel.minus(principal.times(inflationFactor)))
  const taxGemel = realGainGemel.times(realTaxRate)
  const netGemel = fvGemel.minus(taxGemel)

  // --- Track 4: managed portfolio — 25% real with annual realization drag (spec §7.4) ---
  const annualFee = input.managementFees.managedPortfolio.annualFee + input.managementFees.managedPortfolio.tradingCosts
  let balance = principal
  let costBasis = principal
  let portfolioTaxPaid: Money = money(0)
  for (let year = 0; year < years; year++) {
    const gainYear = balance.times(input.expectedNominalReturn)
    const realized = gainYear.times(input.portfolioTurnoverRate)
    // Inflation-linked share of the realized gain is exempt (real taxation).
    const inflationaryShare = realized.times(new Decimal(input.expectedInflation).dividedBy(Math.max(input.expectedNominalReturn, 1e-9)))
    const realGainRealized = floorAtZero(realized.minus(inflationaryShare))
    const taxYear = realGainRealized.times(realTaxRate)
    const fees = balance.times(annualFee)
    balance = balance.plus(gainYear).minus(taxYear).minus(fees)
    costBasis = costBasis.plus(realized.minus(taxYear))
    portfolioTaxPaid = portfolioTaxPaid.plus(taxYear)
  }
  // Final tax on the remaining unrealized real gain.
  const unrealizedRealGain = floorAtZero(balance.minus(costBasis.times(inflationFactor)))
  const finalPortfolioTax = unrealizedRealGain.times(realTaxRate)
  const netPortfolio = balance.minus(finalPortfolioTax)
  portfolioTaxPaid = portfolioTaxPaid.plus(finalPortfolioTax)

  const tracks: Amendment190Track[] = [
    { name: 'תיקון 190 — משיכה הונית (15% נומינלי)', finalValue: fv190.toDecimalPlaces(0).toNumber(), totalTax: tax190.toDecimalPlaces(0).toNumber(), netValue: net190.toDecimalPlaces(0).toNumber(), effectiveTaxOnGain: gain190.gt(0) ? tax190.dividedBy(gain190).toDecimalPlaces(4).toNumber() : 0 },
    { name: 'תיקון 190 — משיכה כקצבה (פטור ממס)', finalValue: fv190.toDecimalPlaces(0).toNumber(), totalTax: 0, netValue: net190Annuity.toDecimalPlaces(0).toNumber(), effectiveTaxOnGain: 0 },
    { name: 'קופת גמל להשקעה (25% ריאלי)', finalValue: fvGemel.toDecimalPlaces(0).toNumber(), totalTax: taxGemel.toDecimalPlaces(0).toNumber(), netValue: netGemel.toDecimalPlaces(0).toNumber(), effectiveTaxOnGain: fvGemel.minus(principal).gt(0) ? taxGemel.dividedBy(fvGemel.minus(principal)).toDecimalPlaces(4).toNumber() : 0 },
    { name: 'תיק מנוהל (25% ריאלי, מס שוטף על מימושים)', finalValue: balance.toDecimalPlaces(0).toNumber(), totalTax: portfolioTaxPaid.toDecimalPlaces(0).toNumber(), netValue: netPortfolio.toDecimalPlaces(0).toNumber(), effectiveTaxOnGain: balance.minus(principal).gt(0) ? portfolioTaxPaid.dividedBy(balance.minus(principal)).toDecimalPlaces(4).toNumber() : 0 },
  ]

  // 190 tracks require eligibility; if not eligible, best track only among the others.
  const candidateIndexes = eligible ? [0, 1, 2, 3] : [2, 3]
  let bestTrack = candidateIndexes[0]
  for (const index of candidateIndexes) {
    if (tracks[index].netValue > tracks[bestTrack].netValue) bestTrack = index
  }

  // --- Break-even inflation (spec §7.5): solve 0.15×(FV−P) = 0.25×(FV−P(1+i)^n) ---
  // Numeric scan over i in [0, 20%] — the equation is monotone in i, so a
  // simple sign-change scan with refinement is robust and dependency-free.
  let breakEvenInflation: number | null = null
  {
    const diffAt = (inflation: number): number => {
      const fvG = principal.times(netAnnualRate(input.expectedNominalReturn, input.managementFees.investmentGemel.fromAccumulation).pow(years))
      const realGain = floorAtZero(fvG.minus(principal.times(new Decimal(1 + inflation).pow(years))))
      const netG = fvG.minus(realGain.times(realTaxRate))
      return net190.minus(netG).toNumber() // >0: 190 wins
    }
    let lower = 0
    let upper = 0.20
    const atLower = diffAt(lower)
    const atUpper = diffAt(upper)
    if (Math.sign(atLower) !== Math.sign(atUpper)) {
      for (let iter = 0; iter < 60; iter++) {
        const mid = (lower + upper) / 2
        if (Math.sign(diffAt(mid)) === Math.sign(diffAt(lower))) lower = mid
        else upper = mid
      }
      breakEvenInflation = Number(((lower + upper) / 2).toFixed(4))
    }
  }

  const inheritanceNotes = [
    'פטירה לפני גיל 75: המוטבים מושכים בפטור מלא ממס רווחי הון (בתוך 90 יום).',
    'פטירה אחרי גיל 75: 15% נומינלי על הרווחים ברכיב הקצבה המוכרת; פטור מלא על רכיב הקצבה המזכה.',
    'משיכה מאוחרת מ-90 יום: 25% על רווחים חדשים שנצברו לאחר הפטירה.',
  ]
  if (input.intendedUse === 'inheritance') {
    warnings.push({ code: 'A190_INHERITANCE_DIMENSION', message: 'הייעוד הוא הורשה — מימד ההורשה (גיל 75) עשוי להיות הגורם המכריע, ר\' inheritanceNotes.', severity: 'INFO' })
  }

  breakdown.push(
    { label: 'שנות צבירה', formula: `${input.withdrawalAge} − ${input.currentAge}`, value: String(years) },
    { label: 'תיקון 190 הוני', formula: `FV ${toIls(fv190)} − מס ${toPercent(nominalTaxRate)} נומינלי ${toIls(tax190)}`, value: toIls(net190) },
    { label: 'גמל להשקעה', formula: `FV ${toIls(fvGemel)} − מס ${toPercent(realTaxRate)} ריאלי ${toIls(taxGemel)}`, value: toIls(netGemel) },
    { label: 'תיק מנוהל', formula: `יתרה ${toIls(balance)} − מס סופי ${toIls(finalPortfolioTax)}`, value: toIls(netPortfolio) },
    { label: 'אינפלציית איזון', formula: '0.15×(FV−P) = 0.25×(FV−P(1+i)^n)', value: breakEvenInflation != null ? toPercent(breakEvenInflation, 2) : 'אין היפוך בטווח 0-20%' },
  )

  return {
    value: { eligible, tracks, bestTrack, breakEvenInflation, inheritanceNotes },
    breakdown,
    assumptions: [
      { label: 'תשואה נומינלית שנתית', value: toPercent(input.expectedNominalReturn) },
      { label: 'אינפלציה שנתית', value: toPercent(input.expectedInflation) },
      { label: 'שיעור מימוש שנתי בתיק', value: toPercent(input.portfolioTurnoverRate) },
    ],
    warnings,
    paramsVersion: params.meta.version,
    computedAt: new Date().toISOString(),
    legalRefs: ['תיקון 190 לפקודת מס הכנסה', 'סעיף 9א — קצבה מזערית'],
  }
}
