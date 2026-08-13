/**
 * Runs the retirement-calculators golden cases + structural sanity checks.
 * Phase 1 gate per RETIREMENT_CALCULATORS_SPEC.md §14: "אחרי כל Phase: עצור,
 * הרץ את כל ה-golden cases... לפני שממשיכים."
 *
 * IMPORTANT: the numeric golden cases here are mechanically derived from the
 * published bracket table (params/2026.json), NOT yet cross-checked against
 * the live gov.il calculator as spec §2.2/§11.2 requires before production
 * use. That external validation is still outstanding.
 *
 * Usage: npx tsx scripts/run-retirement-golden-cases.ts
 */
import goldenCases from '../src/lib/retirement/validation/golden-cases/basic-tax.json'
import { loadRetirementParams } from '../src/lib/retirement/params/loader'
import { calculateCombinedIncomeTax, calculateIncomeTax, type IncomeTaxInput } from '../src/lib/retirement/core/tax-brackets'
import { money } from '../src/lib/retirement/core/money'
import { indexAmount, loadCpiSeries } from '../src/lib/retirement/core/indexation'
import { calculateGrantRevaluation } from '../src/lib/retirement/core/grant-revaluation'
import { calculateRightsFixation } from '../src/lib/retirement/core/rights-fixation'

let failures = 0

function fail(label: string, detail: unknown) {
  failures++
  console.error(`✗ ${label}`, detail)
}

function pass(label: string) {
  console.info(`✓ ${label}`)
}

const { params, warnings } = loadRetirementParams(2026)
if (warnings.length) {
  console.warn('Param warnings:', warnings)
}

for (const testCase of goldenCases as Array<{
  id: string
  description: string
  input: IncomeTaxInput
  expected: { grossTax: number; netTax: number; marginalRate: number }
  tolerance: { absolute: number }
}>) {
  const result = calculateIncomeTax(params, testCase.input)
  const { grossTax, netTax, marginalRate } = result.value

  const checks: Array<[string, number, number]> = [
    ['grossTax', grossTax, testCase.expected.grossTax],
    ['netTax', netTax, testCase.expected.netTax],
    ['marginalRate', marginalRate, testCase.expected.marginalRate],
  ]

  let caseOk = true
  for (const [field, actual, expected] of checks) {
    if (Math.abs(actual - expected) > testCase.tolerance.absolute) {
      caseOk = false
      fail(`${testCase.id} (${testCase.description}) — ${field}`, { expected, actual })
    }
  }
  if (caseOk) pass(`${testCase.id} — ${testCase.description}`)
}

// --- Property tests (spec §11.3) ---

function propertyTest(label: string, ok: boolean, detail?: unknown) {
  if (ok) pass(`property: ${label}`)
  else fail(`property: ${label}`, detail)
}

// Monotonicity: more income never produces less net tax.
{
  const base: IncomeTaxInput = { annualIncome: 50000, incomeType: 'personal_exertion', age: 30, creditPoints: 2.25, taxYear: 2026 }
  const lower = calculateIncomeTax(params, base).value.netTax
  const higher = calculateIncomeTax(params, { ...base, annualIncome: 60000 }).value.netTax
  propertyTest('monotonicity (higher income -> netTax does not decrease)', higher >= lower, { lower, higher })
}

// Non-negativity: net tax is never below zero even with excess credit points.
{
  const result = calculateIncomeTax(params, { annualIncome: 10000, incomeType: 'personal_exertion', age: 30, creditPoints: 20, taxYear: 2026 })
  propertyTest('non-negativity (excess credits do not create negative tax)', result.value.netTax === 0, result.value)
}

// Effective rate never exceeds marginal rate.
{
  const result = calculateIncomeTax(params, { annualIncome: 400000, incomeType: 'personal_exertion', age: 30, creditPoints: 2.25, taxYear: 2026 })
  propertyTest('effective rate <= marginal rate', result.value.effectiveRate <= result.value.marginalRate, result.value)
}

// Zero grants/capitalizations sanity check on the exempt capital cap itself (spec §5.7 Case A) —
// pure arithmetic check on the published constant, not the rights-fixation calculator (not built yet).
{
  const cap = money(params.incomeTax.exemptCapitalCap.value)
  const months = params.incomeTax.capitalizationMonths.value
  const monthlyExemption = cap.dividedBy(months).toDecimalPlaces(2).toNumber()
  propertyTest('exempt capital cap / 180 = max monthly exemption (spec §5.7 Case A)', monthlyExemption === params.incomeTax.maxMonthlyExemption.value, { monthlyExemption, expected: params.incomeTax.maxMonthlyExemption.value })
}

// Combined-income stacking rule (spec §2.2) — annualized version of the spec's own
// worked example (5,700 work + 3,000 rent /month, age 50 -> ×12 for the annual engine),
// hand-derived: personal 68,400 @ 10% = 6,840; other 36,000 stacked from 68,400,
// entirely inside the otherIncomeUnder60 first bracket (up to 301,200) @ 31% = 11,160.
{
  const result = calculateCombinedIncomeTax(params, {
    personalExertionIncome: 68400,
    otherIncome: 36000,
    age: 50,
    creditPoints: 2.25,
    taxYear: 2026,
  })
  const expected = { grossTax: 18000, netTax: 11466, marginalRate: 0.31 }
  const ok = Math.abs(result.value.grossTax - expected.grossTax) < 0.01
    && Math.abs(result.value.netTax - expected.netTax) < 0.01
    && Math.abs(result.value.marginalRate - expected.marginalRate) < 0.0001
  if (ok) pass('COMBINED-001 — stacking rule, annualized spec §2.2 worked example')
  else fail('COMBINED-001 — stacking rule', { expected, actual: result.value })
}

// --- CPI series (Phase 2 blocker, populated 2026-08-13 via CBS API) ---

{
  const { series: cpiSeries, warnings: cpiWarnings } = loadCpiSeries()
  if (cpiWarnings.length) console.warn('CPI warnings:', cpiWarnings)

  propertyTest('CPI series covers 1975+ (spec §1.4 minimum)', Object.keys(cpiSeries).some(key => key <= '1975-01'), { earliestPresent: Object.keys(cpiSeries).sort()[0] })
  propertyTest('CPI series reaches recent months', Object.keys(cpiSeries).sort().slice(-1)[0] >= '2026-01', { latest: Object.keys(cpiSeries).sort().slice(-1)[0] })

  // Real-world sanity check, not a fabricated golden case: Israeli CPI rose
  // roughly 10-13% cumulatively from Jan-2020 to Jan-2024 (published,
  // widely-reported figure for that period) — a wildly different result
  // here would mean the chain-linking logic in update-cpi-series.ts is broken.
  const result = indexAmount({
    amount: money(100),
    fromDate: new Date(2020, 0, 1),
    toDate: new Date(2024, 1, 1), // +1 month so 'known' basis resolves to 2024-01
    cpiSeries,
    indexBasis: 'known',
  })
  const pctChange = result.factor.minus(1).times(100).toDecimalPlaces(1).toNumber()
  propertyTest('CPI 2020-01 -> 2024-01 cumulative change is in the real-world 8-15% range', pctChange >= 8 && pctChange <= 15, { pctChange })
}

// --- Phase 2: rights fixation (spec §5.7 cases A/B/C — exact, deterministic from params) ---

const fixationBase = {
  gender: 'M' as const,
  birthDate: new Date(1958, 0, 15),        // age 68 at eligibility — past male age 67
  eligibilityDate: new Date(2026, 5, 1),
  hasSubmitted161H: false,
  monthlyEligiblePension: 9430,
  monthlyRecognizedPension: 0,
  isDisability75Plus: false,
  taxYear: 2026,
}

// Case A — no past withdrawals: full cap remains.
{
  const result = calculateRightsFixation(params, { ...fixationBase, indexedExemptGrants: 0, previousCapitalizations: 0 })
  const okRemaining = result.value.remainingExemptCapital === 976005
  const okMonthly = result.value.monthlyPensionExemption === 5422.25
  const okRate = Math.abs(result.value.effectiveExemptionRate - 0.575) < 0.0001
  if (okRemaining && okMonthly && okRate) pass('FIXATION-A — ללא משיכות עבר (spec §5.7 A)')
  else fail('FIXATION-A', result.value)
}

// Case B — 100,000₪ indexed exempt grant: ×1.35 offset.
{
  const result = calculateRightsFixation(params, { ...fixationBase, indexedExemptGrants: 100000, previousCapitalizations: 0 })
  const okOffset = result.value.grantsOffset === 135000
  const okRemaining = result.value.remainingExemptCapital === 841005
  const okMonthly = result.value.monthlyPensionExemption === 4672.25
  const okRate = Math.abs(result.value.effectiveExemptionRate - 0.4955) < 0.0001
  if (okOffset && okRemaining && okMonthly && okRate) pass('FIXATION-B — מענק משוערך 100,000₪ (spec §5.7 B)')
  else fail('FIXATION-B', result.value)
}

// Case C — 200,000₪ capitalization: 1:1 offset, NOT 1.35.
{
  const result = calculateRightsFixation(params, { ...fixationBase, indexedExemptGrants: 0, previousCapitalizations: 200000 })
  const okOffset = result.value.capitalizationsOffset === 200000
  const okRemaining = result.value.remainingExemptCapital === 776005
  const okMonthly = Math.abs(result.value.monthlyPensionExemption - 4311.14) < 0.01
  if (okOffset && okRemaining && okMonthly) pass('FIXATION-C — היוון 200,000₪ בקיזוז 1:1 (spec §5.7 C)')
  else fail('FIXATION-C', result.value)
}

// Eligibility gate: woman born 1964 (required age 63y6m) at age 62 — not eligible, zero exemption.
{
  const result = calculateRightsFixation(params, {
    ...fixationBase,
    gender: 'F',
    birthDate: new Date(1964, 3, 10),
    eligibilityDate: new Date(2026, 5, 1), // age 62y2m < 63y6m
    indexedExemptGrants: 0,
    previousCapitalizations: 0,
  })
  const flagged = result.warnings.some(warning => warning.code === 'EARLY_RETIREMENT_NO_EXEMPTION')
  propertyTest('fixation gate: early retirement blocks exemption (spec §5.5)', !result.value.eligible && flagged && result.value.monthlyPensionExemption === 0, { eligible: result.value.eligible, flagged, exemption: result.value.monthlyPensionExemption })
}

// --- Phase 2: grant revaluation (spec §4) with the real CPI series ---

{
  const { series: cpiSeries } = loadCpiSeries()
  const result = calculateGrantRevaluation(params, cpiSeries, {
    retirementDate: new Date(2026, 5, 1),
    eligibilityDate: new Date(2026, 5, 1),
    taxYear: 2026,
    grants: [
      { id: 'g1', employerName: 'מעסיק א', grantDate: new Date(2010, 2, 15), totalAmount: 120000, exemptAmount: 100000, workYears: 8, source: 'form_161', taxTreatment: 'exempt' },
      { id: 'g2', employerName: 'מעסיק ישן', grantDate: new Date(1990, 0, 10), totalAmount: 50000, exemptAmount: 50000, workYears: 5, source: 'form_161', taxTreatment: 'exempt' },
      { id: 'g3', employerName: 'מעסיק ב', grantDate: new Date(2015, 6, 1), totalAmount: 80000, exemptAmount: 80000, workYears: 6, source: 'client_declaration', taxTreatment: 'taxed_capital_gains' },
    ],
  })

  const g1 = result.value.grantDetails.find(grant => grant.id === 'g1')
  // Real-world check: Israeli CPI Mar-2010 -> Jun-2026 cumulative ≈ +27-35%.
  propertyTest('grant revaluation: 2010->2026 index factor in real-world 1.25-1.4 range', !!g1?.indexFactor && g1.indexFactor > 1.25 && g1.indexFactor < 1.4, { factor: g1?.indexFactor })
  propertyTest('grant revaluation: total equals the single included grant', !!g1?.indexedAmount && Math.abs(result.value.totalIndexedExemptGrants - g1.indexedAmount) < 0.01, { total: result.value.totalIndexedExemptGrants, g1: g1?.indexedAmount })
  propertyTest('grant revaluation: 1990 grant excluded (outside 32y lookback)', result.value.excludedGrants.some(grant => grant.id === 'g2' && grant.exclusionReason === 'OUTSIDE_32_YEAR_LOOKBACK'), result.value.excludedGrants)
  propertyTest('grant revaluation: capital-gains-taxed grant excluded (spec §4.4.2)', result.value.excludedGrants.some(grant => grant.id === 'g3' && grant.exclusionReason === 'NOT_AN_EXEMPT_WITHDRAWAL'), result.value.excludedGrants)
  propertyTest('grant revaluation: MISSING_161_FORMS raised for declaration-sourced grant', result.warnings.some(warning => warning.code === 'MISSING_161_FORMS'), result.warnings)
  propertyTest('grant revaluation: GRANTS_OUTSIDE_LOOKBACK raised', result.warnings.some(warning => warning.code === 'GRANTS_OUTSIDE_LOOKBACK'), result.warnings)
}

// End-to-end: grant revaluation output feeds the fixation offset (spec §4.5 shape).
{
  const { series: cpiSeries } = loadCpiSeries()
  const revaluation = calculateGrantRevaluation(params, cpiSeries, {
    retirementDate: new Date(2026, 5, 1),
    eligibilityDate: new Date(2026, 5, 1),
    taxYear: 2026,
    grants: [{ id: 'g1', employerName: 'מעסיק', grantDate: new Date(2010, 2, 15), totalAmount: 100000, exemptAmount: 100000, workYears: 8, source: 'form_161', taxTreatment: 'exempt' }],
  })
  const fixation = calculateRightsFixation(params, { ...fixationBase, indexedExemptGrants: revaluation.value.totalIndexedExemptGrants, previousCapitalizations: 0 })
  const expectedOffset = revaluation.value.totalIndexedExemptGrants * 1.35
  propertyTest('end-to-end: revaluated grant × 1.35 flows into fixation offset', Math.abs(fixation.value.grantsOffset - expectedOffset) < 0.01, { expectedOffset, actual: fixation.value.grantsOffset })
}

console.info(`\n${failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`}`)
if (failures > 0) process.exit(1)
