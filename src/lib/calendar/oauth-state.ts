import { createHmac, timingSafeEqual } from 'crypto'
import type { CalendarProviderId } from './types'

/**
 * Signed OAuth `state` — binds a provider callback to the user who started
 * the flow, so a callback can't be replayed against a different account.
 * HMAC-signed and time-limited; nothing secret travels in the value itself.
 */

const STATE_TTL_MS = 10 * 60 * 1000

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'abd-finance-static-auth-secret-change-in-cloudflare'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export async function createOAuthState(userEmail: string, provider: CalendarProviderId): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ e: userEmail, p: provider, t: Date.now() }), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

export async function verifyOAuthState(state: string, expectedProvider: CalendarProviderId): Promise<{ userEmail: string } | null> {
  const [payload, signature] = String(state || '').split('.')
  if (!payload || !signature) return null

  const expected = sign(payload)
  const givenBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { e?: string; p?: string; t?: number }
    if (!decoded.e || decoded.p !== expectedProvider) return null
    if (!decoded.t || Date.now() - decoded.t > STATE_TTL_MS) return null
    return { userEmail: decoded.e }
  } catch {
    return null
  }
}
