/**
 * Smart Agent rule-engine checks: fixture portfolios -> expected findings.
 * Deterministic engine, deterministic tests. Also asserts the privacy
 * contract: no account number appears anywhere in a finding's fields.
 *
 * Usage: npx tsx scripts/check-smart-agent-rules.ts
 */
import { runAnalysis, portfolioRef } from '../src/lib/smart-agent/engine'
import type { Fund } from '../src/types/fund'
import type { InsurancePolicy } from '../src/types/insurance'

let failures = 0
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.info(`✓ ${label}`)
  else { failures++; console.error(`✗ ${label}`, detail ?? '') }
}

const ACCOUNT_NUMBER = '987654321'

const fixtureFunds: Fund[] = [
  // High balance fee -> HIGH_MANAGEMENT_FEE (HIGH: 1.2% > 1.05%)
  { id: 'fund-a', accountNumber: ACCOUNT_NUMBER, manufacturer: 'הפניקס', productType: 'קופת גמל', currentBalance: 200000, balanceFee: '1.2%', status: 'פעיל' } as Fund,
  // Same product type again -> DUPLICATE_PRODUCT_TYPE; fee fine
  { id: 'fund-b', manufacturer: 'מגדל', productType: 'קופת גמל', currentBalance: 150000, balanceFee: 0.5, status: 'פעיל' } as Fund,
  // Inactive with balance -> INACTIVE_FUND_WITH_BALANCE; no fee data -> MISSING_FEE_DATA
  { id: 'fund-c', manufacturer: 'כלל', productType: 'קרן השתלמות', currentBalance: 80000, status: 'לא פעיל' } as Fund,
  // Tiny balance -> excluded from findings entirely
  { id: 'fund-d', manufacturer: 'מור', productType: 'קופת גמל להשקעה', currentBalance: 200, status: 'פעיל' } as Fund,
]

const fixturePolicies: InsurancePolicy[] = [
  { id: 'pol-1', company: 'הראל', mainBranch: 'בריאות', secondaryBranch: 'ניתוחים', premium: 120, status: 'פעיל' },
  { id: 'pol-2', company: 'מנורה', mainBranch: 'בריאות', secondaryBranch: 'ניתוחים', premium: 90, status: 'פעיל' },
  { id: 'pol-3', company: 'כלל', mainBranch: 'חיים', secondaryBranch: 'ריסק', premium: 60, status: 'מבוטל' },
]

const result = runAnalysis(fixtureFunds, fixturePolicies)
const byRule = (ruleId: string) => result.findings.filter(finding => finding.ruleId === ruleId)

check('HIGH_MANAGEMENT_FEE fires with HIGH severity for 1.2% fee', byRule('HIGH_MANAGEMENT_FEE').some(f => f.severity === 'HIGH'), byRule('HIGH_MANAGEMENT_FEE'))
check('HIGH_MANAGEMENT_FEE does not fire for 0.5% fee', byRule('HIGH_MANAGEMENT_FEE').length === 1, byRule('HIGH_MANAGEMENT_FEE').map(f => f.portfolioRef))
check('DUPLICATE_PRODUCT_TYPE fires for two gemel funds', byRule('DUPLICATE_PRODUCT_TYPE').length === 1, byRule('DUPLICATE_PRODUCT_TYPE'))
check('INACTIVE_FUND_WITH_BALANCE fires for frozen fund', byRule('INACTIVE_FUND_WITH_BALANCE').length === 1)
check('MISSING_FEE_DATA fires for fund without fee info', byRule('MISSING_FEE_DATA').some(f => f.portfolioRef === portfolioRef('fund-c')))
check('DUPLICATE_INSURANCE_COVERAGE fires for two active same-branch policies', byRule('DUPLICATE_INSURANCE_COVERAGE').length === 1)
check('cancelled policy does not create a duplicate-coverage group', !byRule('DUPLICATE_INSURANCE_COVERAGE').some(f => f.evidence.some(e => e.value.includes('כלל'))))
check('tiny-balance fund produces no findings', !result.findings.some(f => f.portfolioRef === portfolioRef('fund-d')))

// Privacy contract: account number must not appear anywhere in any finding.
const serialized = JSON.stringify(result.findings)
check('privacy: account number absent from all findings', !serialized.includes(ACCOUNT_NUMBER))
check('privacy: portfolio refs are pseudonymous PORT-XXXX', result.findings.every(f => /^PORT-[0-9A-F]{6}$/.test(f.portfolioRef)), result.findings.map(f => f.portfolioRef))

// Detection-language contract: findings never phrase recommendations.
check('language: no recommendation phrasing in findings', !/אני ממליץ|מומלץ לעבור ל|כדאי לעבור ל/.test(serialized))

// Status carry-over: re-run keeps triage state for recurring findings.
const triaged = result.findings.map(f => f.ruleId === 'HIGH_MANAGEMENT_FEE' ? { ...f, status: 'DISMISSED' as const, dismissReason: 'נבדק' } : f)
const second = runAnalysis(fixtureFunds, fixturePolicies, triaged)
check('re-run carries over DISMISSED status + reason', second.findings.some(f => f.ruleId === 'HIGH_MANAGEMENT_FEE' && f.status === 'DISMISSED' && f.dismissReason === 'נבדק'))
check('re-run keeps stable finding ids for recurring findings', second.findings.every(f => result.findings.some(prev => prev.id === f.id && prev.ruleId === f.ruleId)))

// Rule versioning recorded on every finding.
check('every finding carries ruleId + ruleVersion', result.findings.every(f => f.ruleId && /^\d+\.\d+$/.test(f.ruleVersion)))

console.info(`\n${failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`}`)
if (failures > 0) process.exit(1)
