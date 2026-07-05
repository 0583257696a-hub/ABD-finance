import { createHash } from 'crypto'

type D1Result<T = unknown> = {
  results?: T[]
  success?: boolean
  meta?: unknown
}

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement
  first: <T = unknown>() => Promise<T | null>
  all: <T = unknown>() => Promise<D1Result<T>>
  run: () => Promise<D1Result>
}

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatement
  batch?: (statements: D1PreparedStatement[]) => Promise<D1Result[]>
}

export type SystemUserRecord = {
  id: string
  email: string
  name: string | null
  password_hash: string
  role: string
  status: string
  created_at: string
  updated_at: string
  registration_json?: string | null
  subscription_json?: string | null
}

let schemaReady = false

export async function getCloudflareEnv(): Promise<Record<string, any> | null> {
  try {
    const mod = await import('@opennextjs/cloudflare')
    const context = await mod.getCloudflareContext({ async: true })
    return (context?.env || null) as Record<string, any> | null
  } catch {
    return null
  }
}

export async function getD1Database(): Promise<D1DatabaseLike | null> {
  const env = await getCloudflareEnv()
  if (!env) return null

  const named = env.DB || env.D1 || env.ABD_DB || env.SMART_MEETING_DB || env.SMART_MEETING_D1
  if (named?.prepare) return named as D1DatabaseLike

  const dynamic = Object.values(env).find((value: any) => value?.prepare && typeof value.prepare === 'function')
  return (dynamic as D1DatabaseLike | undefined) || null
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function ensureSystemSchema(db?: D1DatabaseLike | null) {
  const database = db || await getD1Database()
  if (!database || schemaReady) return database

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'advisor',
      status TEXT NOT NULL DEFAULT 'pending_approval',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      registration_json TEXT,
      subscription_json TEXT,
      general_settings_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS email_outbox (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      html TEXT,
      text TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      error TEXT,
      created_at TEXT NOT NULL,
      sent_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_id TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    )`,
  ]

  for (const statement of statements) {
    await database.prepare(statement).run()
  }

  schemaReady = true
  return database
}

export async function findD1UserByEmail(email: string) {
  const db = await ensureSystemSchema()
  if (!db) return null
  return db.prepare(
    `SELECT u.*, s.registration_json, s.subscription_json
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE lower(u.email) = lower(?)`,
  ).bind(email).first<SystemUserRecord>()
}

export async function findD1UserById(id: string) {
  const db = await ensureSystemSchema()
  if (!db) return null
  return db.prepare(
    `SELECT u.*, s.registration_json, s.subscription_json
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = ?`,
  ).bind(id).first<SystemUserRecord>()
}

export async function createD1User(input: {
  email: string
  name: string
  passwordHash: string
  status: string
  role?: string
  registration: unknown
  subscription: unknown
}) {
  const db = await ensureSystemSchema()
  if (!db) return null

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  await db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, input.email, input.name, input.passwordHash, input.role || 'advisor', input.status, now, now).run()

  await db.prepare(
    `INSERT INTO user_settings (user_id, registration_json, subscription_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(id, JSON.stringify(input.registration || {}), JSON.stringify(input.subscription || {}), now, now).run()

  return findD1UserById(id)
}

export async function listD1Users() {
  const db = await ensureSystemSchema()
  if (!db) return null
  const result = await db.prepare(
    `SELECT u.*, s.registration_json, s.subscription_json
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     ORDER BY u.created_at DESC`,
  ).all<SystemUserRecord>()
  return result.results || []
}

export async function updateD1UserStatus(userId: string, status: string, registrationPatch: Record<string, unknown>, subscriptionPatch: Record<string, unknown>) {
  const db = await ensureSystemSchema()
  if (!db) return false
  const user = await findD1UserById(userId)
  if (!user) return false

  const now = new Date().toISOString()
  const registration = { ...(safeJson(user.registration_json) || {}), ...registrationPatch }
  const subscription = { ...(safeJson(user.subscription_json) || {}), ...subscriptionPatch }

  await db.prepare(`UPDATE users SET status = ?, updated_at = ? WHERE id = ?`).bind(status, now, userId).run()
  await db.prepare(
    `INSERT INTO user_settings (user_id, registration_json, subscription_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       registration_json = excluded.registration_json,
       subscription_json = excluded.subscription_json,
       updated_at = excluded.updated_at`,
  ).bind(userId, JSON.stringify(registration), JSON.stringify(subscription), now, now).run()
  return true
}

export async function updateD1UserPassword(userId: string, passwordHash: string) {
  const db = await ensureSystemSchema()
  if (!db) return false
  await db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).bind(passwordHash, new Date().toISOString(), userId).run()
  return true
}

export async function createPasswordResetToken(userId: string, token: string, expiresAt: string) {
  const db = await ensureSystemSchema()
  if (!db) return false
  await db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), userId, hashToken(token), expiresAt, new Date().toISOString()).run()
  return true
}

export async function getValidPasswordResetToken(token: string) {
  const db = await ensureSystemSchema()
  if (!db) return null
  return db.prepare(
    `SELECT t.*, u.email, u.name
     FROM password_reset_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > ?`,
  ).bind(hashToken(token), new Date().toISOString()).first<{ id: string; user_id: string; email: string; name: string | null }>()
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  const db = await ensureSystemSchema()
  if (!db) return false
  await db.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE id = ?`).bind(new Date().toISOString(), tokenId).run()
  return true
}

export async function writeEmailOutbox(input: {
  to: string
  subject: string
  html?: string
  text?: string
  status: string
  error?: string
}) {
  const db = await ensureSystemSchema()
  if (!db) return
  await db.prepare(
    `INSERT INTO email_outbox (id, to_email, subject, html, text, status, error, created_at, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    input.to,
    input.subject,
    input.html || '',
    input.text || '',
    input.status,
    input.error || '',
    new Date().toISOString(),
    input.status === 'sent' ? new Date().toISOString() : null,
  ).run()
}

export function parseUserSettings(user: Pick<SystemUserRecord, 'registration_json' | 'subscription_json'>) {
  return {
    registration: safeJson(user.registration_json),
    subscription: safeJson(user.subscription_json),
  }
}

function safeJson(value: unknown) {
  if (!value || typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
