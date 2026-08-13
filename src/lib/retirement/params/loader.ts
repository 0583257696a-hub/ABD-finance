import params2026 from './2026.json'
import { isParameterShape, type Parameter, type RetirementParams } from './schema'

export type RetirementWarning = {
  code: string
  message: string
  severity: 'INFO' | 'MEDIUM' | 'HIGH'
}

export type LoadedParams = {
  params: RetirementParams
  warnings: RetirementWarning[]
}

const PARAMS_BY_YEAR: Record<number, unknown> = {
  2026: params2026,
}

const STALE_MONTHS = 13

function monthsSince(isoDate: string, now: Date): number {
  const then = new Date(isoDate)
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
}

function collectParameters(node: unknown, path: string, out: Array<{ path: string; param: Parameter<unknown> }>) {
  if (isParameterShape(node)) {
    out.push({ path, param: node })
    return
  }
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      collectParameters(value, path ? `${path}.${key}` : key, out)
    }
  }
}

/**
 * Loads the parameter file for a given tax year, validates every Parameter<T>
 * carries the required fields (spec §1.3), and flags any parameter whose
 * lastVerified is stale (spec §1.3: "loader.ts יזרוק אזהרה... אם lastVerified
 * ישן מ-13 חודשים"). Throws only on structural failure (missing/malformed
 * file) — staleness is a warning, never a hard error, per spec.
 */
export function loadRetirementParams(taxYear: number, now: Date = new Date()): LoadedParams {
  const raw = PARAMS_BY_YEAR[taxYear]
  if (!raw) {
    throw new Error(`No retirement params file found for tax year ${taxYear}. Available years: ${Object.keys(PARAMS_BY_YEAR).join(', ')}`)
  }

  const params = raw as RetirementParams
  const warnings: RetirementWarning[] = []

  const collected: Array<{ path: string; param: Parameter<unknown> }> = []
  collectParameters(params, '', collected)

  if (!collected.length) {
    throw new Error(`Params file for ${taxYear} contains no recognizable Parameter<T> entries — file is likely malformed.`)
  }

  for (const { path, param } of collected) {
    if (monthsSince(param.lastVerified, now) > STALE_MONTHS) {
      warnings.push({
        code: 'PARAMS_STALE',
        message: `Parameter "${path}" (${param.label}) last verified ${param.lastVerified}, over ${STALE_MONTHS} months ago.`,
        severity: 'HIGH',
      })
    }
  }

  return { params, warnings }
}

export function getParamValue<T>(param: Parameter<T>): T {
  return param.value
}
