import { CrmError, type CrmProviderId } from '../types'

/**
 * Small fetch wrapper shared by adapters: JSON in/out, 15s timeout, and HTTP
 * status → CrmError code mapping so the sync layer/UI can explain failures
 * uniformly ("token rejected" vs "rate limited" vs "unreachable").
 */
export async function crmFetch<T = unknown>(
  provider: CrmProviderId,
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<{ status: number; data: T | null; text: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 15_000)
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    clearTimeout(timer)
    throw new CrmError('NETWORK', error instanceof Error ? error.message : 'network error', provider)
  }
  clearTimeout(timer)
  const text = await response.text().catch(() => '')
  let data: T | null = null
  try { data = text ? JSON.parse(text) as T : null } catch { data = null }
  if (response.status === 401 || response.status === 403) throw new CrmError('AUTH', `HTTP ${response.status}`, provider, response.status)
  if (response.status === 429) throw new CrmError('RATE_LIMIT', 'HTTP 429', provider, 429)
  if (response.status === 404) throw new CrmError('NOT_FOUND', 'HTTP 404', provider, 404)
  if (response.status >= 400) throw new CrmError('API', `HTTP ${response.status}: ${text.slice(0, 300)}`, provider, response.status)
  return { status: response.status, data, text }
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function digitsOnly(value: string | undefined): string {
  return String(value || '').replace(/\D/g, '')
}
