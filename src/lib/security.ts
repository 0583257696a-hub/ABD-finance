import { NextResponse } from 'next/server'

type Bucket = {
  count: number
  resetAt: number
  blockedUntil?: number
}

const buckets = new Map<string, Bucket>()

export function sanitizeText(value: unknown, maxLength = 2000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || ''
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

export function requireSameOrigin(request: Request) {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null

  const origin = request.headers.get('origin')
  if (!origin) return null

  const expected = new URL(request.url).origin
  if (origin !== expected) {
    return NextResponse.json({ error: 'בקשה נחסמה מטעמי אבטחה.' }, { status: 403 })
  }
  return null
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number; blockMs?: number },
) {
  const now = Date.now()
  const existing = buckets.get(key)

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.blockedUntil - now) / 1000),
    }
  }

  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + options.windowMs }

  bucket.count += 1
  if (bucket.count > options.limit) {
    bucket.blockedUntil = now + (options.blockMs || options.windowMs)
    buckets.set(key, bucket)
    return {
      allowed: false,
      retryAfter: Math.ceil(((options.blockMs || options.windowMs)) / 1000),
    }
  }

  buckets.set(key, bucket)
  return { allowed: true, remaining: Math.max(0, options.limit - bucket.count) }
}

export function rateLimitResponse(retryAfter = 60) {
  return NextResponse.json(
    { error: 'בוצעו יותר מדי ניסיונות. נסה שוב מאוחר יותר.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  )
}
