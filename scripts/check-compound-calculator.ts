/**
 * Compound-calculator engine checks, validated against the user-supplied
 * reference implementation (compound-calculator-embed_1.html): with its
 * default inputs (5,000 initial, 2,000/month, 7% annual, 20 years, 0.6%
 * accumulation fee, 0 deposit fee, 2.5% inflation) the reference produces
 * net 991,828 and accumulation fees 47,818. The engine must reproduce
 * those numbers — they pin the calculation convention (annual/12 monthly
 * rate, deposit at month start, fee on post-return balance, CPI-indexed
 * cost basis for real tax).
 *
 * Usage: npx tsx scripts/check-compound-calculator.ts
 */
import { calculateCompoundProjection, type CompoundInputs } from '../src/lib/compound-calculator'

let failures = 0
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.info(`✓ ${label}`)
  else { failures++; console.error(`✗ ${label}`, detail ?? '') }
}

const referenceInputs: CompoundInputs = {
  initialAmount: '5000',
  monthlyDeposit: '2000',
  annualReturn: '7',
  years: '20',
  depositFee: '0',
  annualFee: '0.6',
  inflation: '2.5',
  taxType: 'real',
  linked: false,
  scenario: 'base',
}

const result = calculateCompoundProjection(referenceInputs)

check('net final matches reference 991,828 (±1)', Math.abs(result.netFinal - 991828) <= 1, { netFinal: result.netFinal })
check('accumulation fees match reference 47,818 (±1)', Math.abs(result.totalAccumulationFees - 47818) <= 1, { fees: result.totalAccumulationFees })

// Reference tax figures derived from the same run: basis = indexed cost,
// taxable = net - basis, tax = 25% of taxable.
{
  const grossDeposits = 5000 + 2000 * 240
  check('gross deposits accounted', result.grossDeposits === grossDeposits, { grossDeposits: result.grossDeposits })
  check('nominal profit = net - deposits', Math.abs(result.nominalProfit - (result.netFinal - grossDeposits)) < 0.01)
  check('real (taxable) profit < nominal profit (CPI indexation shields part)', result.realProfit > 0 && result.realProfit < result.nominalProfit, { real: result.realProfit, nominal: result.nominalProfit })
  check('tax = 25% of real profit', Math.abs(result.taxFinal - result.realProfit * 0.25) < 0.01, { tax: result.taxFinal })
  const effectiveRate = result.taxFinal / result.nominalProfit
  check('effective tax rate below 25% thanks to indexation', effectiveRate > 0 && effectiveRate < 0.25, { effectiveRate })
}

// No-fee comparison run: fee impact must exceed the fees actually collected
// (the collected shekels also stopped compounding).
check('fee impact > fees collected (lost compounding)', result.feeImpact > result.totalFees, { feeImpact: result.feeImpact, totalFees: result.totalFees })

// Exempt tax type: zero tax, same balance.
{
  const exempt = calculateCompoundProjection({ ...referenceInputs, taxType: 'exempt' })
  check('exempt tax type produces zero tax', exempt.taxFinal === 0 && exempt.netFinal === result.netFinal)
}

console.info(`\n${failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`}`)
if (failures > 0) process.exit(1)
