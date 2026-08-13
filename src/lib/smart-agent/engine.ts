import type { Fund } from '@/types/fund'
import type { InsurancePolicy } from '@/types/insurance'
import { findAbdTrackForFund, getAllAbdTracks, normalizeProductType } from '@/lib/returns-catalog'

/**
 * Smart Agent — deterministic portfolio anomaly-detection engine.
 *
 * The one rule that overrides everything (per the Smart Agent architecture
 * spec): DETECTION, never RECOMMENDATION. The pipeline is
 *   PORTFOLIO DATA → RULE ENGINE → FINDING → EXPLANATION → POSSIBLE ACTION
 * — never DATA → AI → RECOMMENDATION. A finding says "management fees are
 * above the configured threshold"; it never says "move the client to
 * company X". AI's only role (separate endpoint) is explaining a finding
 * in plain language, behind the same output guardrails as the summary.
 *
 * Privacy by architecture:
 * - Runs CLIENT-SIDE on the in-browser workspace data — portfolio data
 *   never leaves the machine for detection.
 * - Every finding references a pseudonymous portfolio ref (PORT-XXXX,
 *   derived by hashing, no reversible mapping stored anywhere) — never the
 *   account number. Evidence values are product attributes only.
 * - Rules are versioned; a stored finding keeps the rule version that
 *   created it even after rules evolve.
 */

export type FindingSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type FindingStatus = 'NEW' | 'REVIEWED' | 'DISCUSSED' | 'ACTION_CREATED' | 'RESOLVED' | 'DISMISSED'

export type FindingEvidence = { label: string; value: string }

export type Finding = {
  id: string
  ruleId: string
  ruleVersion: string
  severity: FindingSeverity
  /** Pseudonymous portfolio reference (PORT-XXXX) — never an account number. */
  portfolioRef: string
  /** Product-attribute context safe to show/send: type + manufacturer. */
  productLabel: string
  /** The detection — a factual statement, never a recommendation. */
  title: string
  detail: string
  evidence: FindingEvidence[]
  /** Neutral possible actions for the advisor to consider — never naming a target vendor. */
  possibleActions: string[]
  status: FindingStatus
  dismissReason?: string
  createdAt: string
  updatedAt: string
}

export type AnalysisResult = {
  analysisId: string
  ranAt: string
  engineVersion: string
  findings: Finding[]
  scannedFunds: number
  scannedPolicies: number
}

export const ENGINE_VERSION = '1.0.0'
const STORAGE_KEY = 'abd_smart_agent_findings_v1'

// --- Thresholds: named constants, single place, part of each rule's contract ---
const THRESHOLDS = {
  balanceFeeMediumPct: 0.7,
  balanceFeeHighPct: 1.05,
  depositFeeMediumPct: 4,
  underperformGapPp: 1.5,
  minBalanceForFindings: 1000,
}

function num(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Extracts a percent number out of "0.6%", "0.6", 0.6 — returns null when absent. */
function feePct(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = num(value)
  return parsed > 0 ? parsed : null
}

function money(value: number): string {
  return `${Math.round(value).toLocaleString('he-IL')} ₪`
}

/** FNV-1a hash → stable pseudonymous ref. One-way; the mapping back to the fund exists only transiently in the UI session. */
export function portfolioRef(sourceId: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < sourceId.length; i++) {
    hash ^= sourceId.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `PORT-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6)}`
}

function productLabel(fund: Fund): string {
  return `${fund.productType || 'מוצר'} · ${fund.manufacturer || 'יצרן לא ידוע'}`
}

type RuleContext = {
  funds: Fund[]
  policies: InsurancePolicy[]
  now: string
}

type RuleOutput = Omit<Finding, 'id' | 'status' | 'createdAt' | 'updatedAt'>

type Rule = {
  id: string
  version: string
  run: (context: RuleContext) => RuleOutput[]
}

const highManagementFee: Rule = {
  id: 'HIGH_MANAGEMENT_FEE',
  version: '1.0',
  run: ({ funds }) => {
    const outputs: RuleOutput[] = []
    for (const fund of funds) {
      if (num(fund.currentBalance) < THRESHOLDS.minBalanceForFindings) continue
      const fee = feePct(fund.balanceFee) ?? feePct(fund.managementFeeBalanceText)
      if (fee == null || fee <= THRESHOLDS.balanceFeeMediumPct) continue
      const high = fee > THRESHOLDS.balanceFeeHighPct
      outputs.push({
        ruleId: 'HIGH_MANAGEMENT_FEE',
        ruleVersion: '1.0',
        severity: high ? 'HIGH' : 'MEDIUM',
        portfolioRef: portfolioRef(fund.id),
        productLabel: productLabel(fund),
        title: 'דמי ניהול מצבירה מעל הסף',
        detail: `דמי הניהול מהצבירה (${fee}%) גבוהים מסף הבדיקה (${high ? THRESHOLDS.balanceFeeHighPct : THRESHOLDS.balanceFeeMediumPct}%). על צבירה של ${money(num(fund.currentBalance))} מדובר בעלות שנתית של כ-${money(num(fund.currentBalance) * fee / 100)}.`,
        evidence: [
          { label: 'דמי ניהול מצבירה', value: `${fee}%` },
          { label: 'סף הבדיקה', value: `${THRESHOLDS.balanceFeeMediumPct}%` },
          { label: 'צבירה', value: money(num(fund.currentBalance)) },
        ],
        possibleActions: ['בחינת דמי הניהול מול תנאי השוק', 'בדיקת זכאות להנחת דמי ניהול', 'שיחה עם הלקוח על מבנה העלויות'],
      })
    }
    return outputs
  },
}

const highDepositFee: Rule = {
  id: 'HIGH_DEPOSIT_FEE',
  version: '1.0',
  run: ({ funds }) => {
    const outputs: RuleOutput[] = []
    for (const fund of funds) {
      const fee = feePct(fund.depositFee) ?? feePct(fund.managementFeeDepositText)
      if (fee == null || fee <= THRESHOLDS.depositFeeMediumPct) continue
      outputs.push({
        ruleId: 'HIGH_DEPOSIT_FEE',
        ruleVersion: '1.0',
        severity: 'MEDIUM',
        portfolioRef: portfolioRef(fund.id),
        productLabel: productLabel(fund),
        title: 'דמי ניהול מהפקדה מעל הסף',
        detail: `דמי הניהול מהפקדה (${fee}%) גבוהים מסף הבדיקה (${THRESHOLDS.depositFeeMediumPct}%).`,
        evidence: [
          { label: 'דמי ניהול מהפקדה', value: `${fee}%` },
          { label: 'סף הבדיקה', value: `${THRESHOLDS.depositFeeMediumPct}%` },
        ],
        possibleActions: ['בחינת דמי ההפקדה מול תנאי השוק', 'בדיקת זכאות להנחה'],
      })
    }
    return outputs
  },
}

const duplicateProductType: Rule = {
  id: 'DUPLICATE_PRODUCT_TYPE',
  version: '1.0',
  run: ({ funds }) => {
    const groups = new Map<string, Fund[]>()
    for (const fund of funds) {
      if (num(fund.currentBalance) < THRESHOLDS.minBalanceForFindings) continue
      const key = normalizeProductType(fund.productType || '')
      if (!key) continue
      groups.set(key, [...(groups.get(key) || []), fund])
    }
    const outputs: RuleOutput[] = []
    for (const [type, group] of groups) {
      if (group.length < 2) continue
      const total = group.reduce((sum, fund) => sum + num(fund.currentBalance), 0)
      outputs.push({
        ruleId: 'DUPLICATE_PRODUCT_TYPE',
        ruleVersion: '1.0',
        severity: 'MEDIUM',
        portfolioRef: portfolioRef(group.map(fund => fund.id).sort().join('|')),
        productLabel: `${type} · ${group.length} קופות`,
        title: 'ריבוי קופות מאותו סוג מוצר',
        detail: `נמצאו ${group.length} קופות מסוג ${type} בסך צבירה כולל של ${money(total)}. פיצול עשוי לגרור כפל דמי ניהול וקושי במעקב.`,
        evidence: [
          { label: 'סוג מוצר', value: type },
          { label: 'מספר קופות', value: String(group.length) },
          { label: 'יצרנים', value: Array.from(new Set(group.map(fund => fund.manufacturer || 'לא ידוע'))).join(', ') },
          { label: 'סך צבירה', value: money(total) },
        ],
        possibleActions: ['בחינת איחוד צבירות מול הלקוח', 'השוואת דמי הניהול בין הקופות'],
      })
    }
    return outputs
  },
}

const inactiveWithBalance: Rule = {
  id: 'INACTIVE_FUND_WITH_BALANCE',
  version: '1.0',
  run: ({ funds }) => {
    const outputs: RuleOutput[] = []
    for (const fund of funds) {
      const status = String(fund.status || '')
      const inactive = /לא פעיל|מוקפא|מנותק|frozen|inactive/i.test(status)
      if (!inactive || num(fund.currentBalance) < THRESHOLDS.minBalanceForFindings) continue
      outputs.push({
        ruleId: 'INACTIVE_FUND_WITH_BALANCE',
        ruleVersion: '1.0',
        severity: 'MEDIUM',
        portfolioRef: portfolioRef(fund.id),
        productLabel: productLabel(fund),
        title: 'קופה לא פעילה עם צבירה',
        detail: `הקופה בסטטוס "${status}" עם צבירה של ${money(num(fund.currentBalance))}. קופות לא פעילות עלולות לצבור דמי ניהול ללא הפקדות שוטפות.`,
        evidence: [
          { label: 'סטטוס', value: status },
          { label: 'צבירה', value: money(num(fund.currentBalance)) },
        ],
        possibleActions: ['בירור סטטוס הקופה מול היצרן', 'בחינת איחוד לקופה פעילה'],
      })
    }
    return outputs
  },
}

const missingFeeData: Rule = {
  id: 'MISSING_FEE_DATA',
  version: '1.0',
  run: ({ funds }) => {
    const outputs: RuleOutput[] = []
    for (const fund of funds) {
      if (num(fund.currentBalance) < THRESHOLDS.minBalanceForFindings) continue
      const hasFee = feePct(fund.balanceFee) != null || feePct(fund.depositFee) != null || Boolean(fund.managementFeeText) || Boolean(fund.managementFeeBalanceText)
      if (hasFee) continue
      outputs.push({
        ruleId: 'MISSING_FEE_DATA',
        ruleVersion: '1.0',
        severity: 'LOW',
        portfolioRef: portfolioRef(fund.id),
        productLabel: productLabel(fund),
        title: 'חסרים נתוני דמי ניהול',
        detail: 'לא נמצאו נתוני דמי ניהול לקופה — לא ניתן לבדוק את סבירות העלויות.',
        evidence: [{ label: 'צבירה', value: money(num(fund.currentBalance)) }],
        possibleActions: ['השלמת נתוני דמי ניהול מהדוח השנתי או מהמסלקה'],
      })
    }
    return outputs
  },
}

const underperformingTrack: Rule = {
  id: 'UNDERPERFORMING_TRACK',
  version: '1.0',
  run: ({ funds }) => {
    // Category benchmark: median 5y annual return per normalized product type.
    const byType = new Map<string, number[]>()
    for (const track of getAllAbdTracks()) {
      const annual5 = track.returns?.annual5
      if (annual5 == null || !Number.isFinite(annual5)) continue
      const key = normalizeProductType(track.productType)
      byType.set(key, [...(byType.get(key) || []), annual5])
    }
    const medians = new Map<string, number>()
    for (const [type, values] of byType) {
      const sorted = [...values].sort((a, b) => a - b)
      medians.set(type, sorted[Math.floor(sorted.length / 2)])
    }

    const outputs: RuleOutput[] = []
    for (const fund of funds) {
      if (num(fund.currentBalance) < THRESHOLDS.minBalanceForFindings) continue
      const matched = findAbdTrackForFund(fund.productType, fund.manufacturer, fund.investmentTrack || fund.productName)
      const annual5 = matched?.returns?.annual5
      if (annual5 == null || !Number.isFinite(annual5)) continue
      const median = medians.get(normalizeProductType(fund.productType || ''))
      if (median == null) continue
      const gap = median - annual5
      if (gap < THRESHOLDS.underperformGapPp) continue
      outputs.push({
        ruleId: 'UNDERPERFORMING_TRACK',
        ruleVersion: '1.0',
        severity: gap >= THRESHOLDS.underperformGapPp * 2 ? 'HIGH' : 'MEDIUM',
        portfolioRef: portfolioRef(fund.id),
        productLabel: productLabel(fund),
        title: 'תשואת המסלול נמוכה מחציון הקטגוריה',
        detail: `תשואת 5 שנים של המסלול (${annual5.toFixed(2)}%) נמוכה ב-${gap.toFixed(1)} נק' אחוז מחציון הקטגוריה (${median.toFixed(2)}%). תשואת עבר אינה מבטיחה תשואה עתידית — זהו נתון השוואתי בלבד.`,
        evidence: [
          { label: 'מסלול', value: matched?.trackName || fund.investmentTrack || '' },
          { label: 'תשואה שנתית 5 שנים', value: `${annual5.toFixed(2)}%` },
          { label: 'חציון הקטגוריה', value: `${median.toFixed(2)}%` },
          { label: 'מקור', value: 'נתוני רשות שוק ההון (ABD RETURNS)' },
        ],
        possibleActions: ['בחינת התאמת מסלול ההשקעה לפרופיל הלקוח', 'השוואת ביצועים מול מסלולים דומים'],
      })
    }
    return outputs
  },
}

const duplicateInsuranceCoverage: Rule = {
  id: 'DUPLICATE_INSURANCE_COVERAGE',
  version: '1.0',
  run: ({ policies }) => {
    const groups = new Map<string, InsurancePolicy[]>()
    for (const policy of policies) {
      if (/מבוטל|מסולק|cancel/i.test(String(policy.status || ''))) continue
      const key = `${policy.mainBranch || ''}|${policy.secondaryBranch || ''}`.trim()
      if (key === '|') continue
      groups.set(key, [...(groups.get(key) || []), policy])
    }
    const outputs: RuleOutput[] = []
    for (const [, group] of groups) {
      if (group.length < 2) continue
      const totalPremium = group.reduce((sum, policy) => sum + num(policy.premium), 0)
      outputs.push({
        ruleId: 'DUPLICATE_INSURANCE_COVERAGE',
        ruleVersion: '1.0',
        severity: 'MEDIUM',
        portfolioRef: portfolioRef(group.map(policy => policy.id).sort().join('|')),
        productLabel: `${group[0].mainBranch || 'ביטוח'}${group[0].secondaryBranch ? ` · ${group[0].secondaryBranch}` : ''}`,
        title: 'כיסוי ביטוחי כפול אפשרי',
        detail: `נמצאו ${group.length} פוליסות פעילות באותו ענף כיסוי, בפרמיה כוללת של ${money(totalPremium)} — ייתכן כפל ביטוח.`,
        evidence: [
          { label: 'ענף', value: `${group[0].mainBranch || ''} ${group[0].secondaryBranch || ''}`.trim() },
          { label: 'מספר פוליסות', value: String(group.length) },
          { label: 'חברות', value: Array.from(new Set(group.map(policy => policy.company || policy.manufacturer || 'לא ידוע'))).join(', ') },
          { label: 'פרמיה כוללת', value: money(totalPremium) },
        ],
        possibleActions: ['בדיקת חפיפת הכיסויים מול תנאי הפוליסות', 'שיחה עם הלקוח על הצורך בכפל'],
      })
    }
    return outputs
  },
}

export const RULES: Rule[] = [
  highManagementFee,
  highDepositFee,
  duplicateProductType,
  inactiveWithBalance,
  missingFeeData,
  underperformingTrack,
  duplicateInsuranceCoverage,
]

const SEVERITY_ORDER: Record<FindingSeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3 }

/**
 * Runs all rules. Carries over the advisor's status/dismissReason for a
 * finding that recurs (same ruleId + portfolioRef) so re-running analysis
 * never resets triage work; findings that no longer reproduce are dropped.
 */
export function runAnalysis(funds: Fund[], policies: InsurancePolicy[], previous: Finding[] = []): AnalysisResult {
  const now = new Date().toISOString()
  const context: RuleContext = { funds, policies, now }
  const previousByKey = new Map(previous.map(finding => [`${finding.ruleId}:${finding.portfolioRef}`, finding]))

  const findings: Finding[] = []
  for (const rule of RULES) {
    for (const output of rule.run(context)) {
      const key = `${output.ruleId}:${output.portfolioRef}`
      const existing = previousByKey.get(key)
      findings.push({
        ...output,
        id: existing?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${key}-${now}`),
        status: existing?.status || 'NEW',
        dismissReason: existing?.dismissReason,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      })
    }
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return {
    analysisId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `analysis-${now}`,
    ranAt: now,
    engineVersion: ENGINE_VERSION,
    findings,
    scannedFunds: funds.length,
    scannedPolicies: policies.length,
  }
}

export function loadStoredFindings(): { findings: Finding[]; ranAt: string | null } {
  if (typeof window === 'undefined') return { findings: [], ranAt: null }
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as { findings?: Finding[]; ranAt?: string } | null
    return { findings: raw?.findings || [], ranAt: raw?.ranAt || null }
  } catch {
    return { findings: [], ranAt: null }
  }
}

export function storeFindings(findings: Finding[], ranAt: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ findings, ranAt }))
}
