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

console.info(`\n${failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`}`)
if (failures > 0) process.exit(1)
