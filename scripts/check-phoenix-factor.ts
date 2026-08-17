/**
 * Acceptance tests for the Phoenix conversion-factor engine.
 *
 * Pins src/lib/phoenix/factor-engine.ts to the 10 reference cases in
 * PHOENIX_FACTOR_ENGINE.md (the port of Phoenix's official 06/2025
 * simulator), plus the spec's regression properties. If any of these
 * drift, the engine no longer matches Phoenix's regulations — do NOT
 * "fix" a test to make it pass; the formula or tables changed.
 *
 * Run: npm run check:phoenix
 */
import { phoenixConversionFactor, phoenixMaxGuaranteeMonths, type PhoenixFactorInput } from '../src/lib/phoenix/factor-engine'

const base: PhoenixFactorInput = {
  birthPensioner: new Date(1959, 2, 15),  // 15/03/1959
  birthSpouse: new Date(1962, 6, 20),     // 20/07/1962
  isMale: true,
  retirementYear: 2026,
  retirementMonth: 9,
  guaranteeMonths: 0,
  spouseRate: 0.6,
  fund: 'comprehensive',
}

const cases: Array<[string, Partial<PhoenixFactorInput>, number]> = [
  ['1  הבטחה 0, שאירים 60%', {}, 187.0377],
  ['2  הבטחה 60', { guaranteeMonths: 60 }, 187.3949],
  ['3  הבטחה 120', { guaranteeMonths: 120 }, 188.6145],
  ['4  הבטחה 180', { guaranteeMonths: 180 }, 191.0161],
  ['5  הבטחה 240', { guaranteeMonths: 240 }, 194.7701],
  ['6  שאירים 0% (רווק)', { spouseRate: 0 }, 164.9831],
  ['7  שאירים 30%', { spouseRate: 0.3 }, 176.0104],
  ['8  שאירים 100%', { spouseRate: 1 }, 201.7408],
  ['9  נקבה', { isMale: false }, 191.0283],
  ['10 קרן כללית', { fund: 'general' }, 194.8942],
]

let failures = 0
function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(30)} ${detail}`)
  if (!ok) failures++
}

// --- The 10 acceptance cases (4-decimal match, tolerance 0.0005) ---
for (const [name, override, expected] of cases) {
  const result = phoenixConversionFactor({ ...base, ...override })
  check(name, Math.abs(result.factor - expected) < 0.0005, `got ${result.factor.toFixed(4)}  expected ${expected}`)
}

// --- Derived parameters from the spec's base case ---
const baseResult = phoenixConversionFactor(base)
check('exact age = 67.4167', Math.abs(baseResult.exactAge - 67.4167) < 0.0001, `got ${baseResult.exactAge.toFixed(4)}`)
check('net interest = 0.0407', baseResult.netInterest === 0.0407, `got ${baseResult.netInterest}`)
check('spouse age diff = -3', baseResult.ageDiff === -3, `got ${baseResult.ageDiff}`)

// --- Regression properties (spec §7) ---
const single = phoenixConversionFactor({ ...base, spouseRate: 0 }).factor
const full = phoenixConversionFactor({ ...base, spouseRate: 1 }).factor
const sixty = phoenixConversionFactor(base).factor
check('linear in survivor rate (<1e-10)', Math.abs(single + 0.6 * (full - single) - sixty) < 1e-10, `deviation ${Math.abs(single + 0.6 * (full - single) - sixty).toExponential(2)}`)
check('guarantee ↑ → factor ↑', phoenixConversionFactor({ ...base, guaranteeMonths: 240 }).factor > sixty, '')
check('survivor rate ↑ → factor ↑', full > single, '')
check('female > male', phoenixConversionFactor({ ...base, isMale: false }).factor > sixty, '')
check('general fund > comprehensive', phoenixConversionFactor({ ...base, fund: 'general' }).factor > sixty, '')
check('single is the lowest', single < sixty && single < full, '')
const at60 = phoenixConversionFactor({ ...base, birthPensioner: new Date(1966, 8, 1) }).factor
const at70 = phoenixConversionFactor({ ...base, birthPensioner: new Date(1956, 8, 1) }).factor
check('retirement age ↑ → factor ↓', at60 > at70, `age60 ${at60.toFixed(2)}  age70 ${at70.toFixed(2)}`)

// --- Guardrails (spec §8) ---
check('max guarantee at 67.42 = 234', phoenixMaxGuaranteeMonths(67.4167) === 234, `got ${phoenixMaxGuaranteeMonths(67.4167)}`)
check('max guarantee at 87+ = 0', phoenixMaxGuaranteeMonths(88) === 0, '')
check('sanity: 100 < factor < 280', sixty > 100 && sixty < 280, `${sixty.toFixed(2)}`)
let threw = false
try { phoenixConversionFactor({ ...base, birthPensioner: new Date(1980, 0, 1) }) } catch { threw = true }
check('retirement age < 55 throws', threw, '')

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)
