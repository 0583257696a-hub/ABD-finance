/**
 * Regulatory management-fee ceilings by product (Israel, annual %):
 *   קרן פנסיה מקיפה   — 0.5% balance / 6% deposit
 *   קופת גמל / קה"ש / גמל להשקעה — 1.05% balance / 4% deposit
 *   ביטוח מנהלים / פוליסה (post-2013) — 1.05% balance / 4% deposit
 * A value above the cap is either a genuinely non-standard product (old
 * policies) or a parsing artefact — both deserve a flag, never silence.
 * Used by the funds table to mark "נתון חריג — לאימות" (QA P2-5).
 */
export type FeeCap = { balance: number; deposit: number; label: string }

export function feeCapFor(productType?: string): FeeCap {
  const text = String(productType || '')
  if (/פנסיה/.test(text)) return { balance: 0.5, deposit: 6, label: 'קרן פנסיה מקיפה' }
  if (/גמל|השתלמות/.test(text)) return { balance: 1.05, deposit: 4, label: 'קופת גמל / קה"ש' }
  if (/מנהלים|פוליסה|ביטוח|פיננס/.test(text)) return { balance: 1.05, deposit: 4, label: 'פוליסת ביטוח (לאחר 2013)' }
  return { balance: 1.05, deposit: 4, label: 'תקרה מקובלת' }
}

export function feeAnomaly(productType: string | undefined, balanceFee: number | null, depositFee: number | null): string | null {
  const cap = feeCapFor(productType)
  const problems: string[] = []
  if (balanceFee != null && balanceFee > cap.balance + 1e-9) problems.push(`מצבירה ${balanceFee}% מעל התקרה (${cap.balance}%)`)
  if (depositFee != null && depositFee > cap.deposit + 1e-9) problems.push(`מהפקדה ${depositFee}% מעל התקרה (${cap.deposit}%)`)
  return problems.length ? `נתון חריג — לאימות: ${problems.join(', ')} עבור ${cap.label}` : null
}
