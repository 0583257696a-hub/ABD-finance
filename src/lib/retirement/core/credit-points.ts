import { money, multiply, type Money } from './money'
import type { RetirementParams } from '../params/schema'

/**
 * Annual value of a given number of tax credit points.
 * creditPointValue in params is monthly (ILS/month) — see spec §1.4.
 */
export function annualCreditValue(params: RetirementParams, creditPoints: number): Money {
  const monthlyValue = params.incomeTax.creditPointValue.value
  return multiply(multiply(money(monthlyValue), 12), creditPoints)
}

/**
 * Standard resident credit points, optionally with the female addition.
 * additionalCredits are extra points from other sources (children, new
 * immigrant, etc.) the caller has already determined — this function does
 * not enumerate every credit-point rule, only composes the base + female
 * addition + whatever the caller supplies.
 */
export function totalCreditPoints(params: RetirementParams, options: { isFemale: boolean; additionalCredits?: number }): number {
  const base = params.incomeTax.residentCreditPoints.value
  const femaleAddition = options.isFemale ? params.incomeTax.femaleAdditionalCreditPoints.value : 0
  return base + femaleAddition + (options.additionalCredits ?? 0)
}
