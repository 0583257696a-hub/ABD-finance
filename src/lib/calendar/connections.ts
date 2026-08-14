import { getD1Database } from '../system-db'
import type { CalendarProviderId } from './types'

/**
 * Server-side OAuth token storage for calendar providers.
 *
 * Security contract (spec §20): tokens live ONLY here, in D1, reachable only
 * from server code. No API route ever returns access/refresh tokens to the
 * client — the client learns nothing beyond "connected: true/false". Identity
 * (who the user is) stays in next-auth; calendar permission is a separate
 * grant recorded here, so signing in never implies calendar access.
 */

type D1Like = NonNullable<Awaited<ReturnType<typeof getD1Database>>>

export type CalendarConnection = {
  user_email: string
  provider: CalendarProviderId
  access_token: string
  refresh_token: string | null
  /** ISO timestamp; null when the provider issues non-expiring tokens. */
  expires_at: string | null
  scope: string
  account_label: string
  created_at: string
  updated_at: string
}

let schemaEnsured = false

async function getDb(): Promise<D1Like | null> {
  const db = await getD1Database()
  if (!db) return null
  if (!schemaEnsured) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS calendar_connections (
      user_email TEXT NOT NULL,
      provider TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TEXT,
      scope TEXT NOT NULL DEFAULT '',
      account_label TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_email, provider)
    )`).run()
    schemaEnsured = true
  }
  return db
}

export async function getConnection(userEmail: string, provider: CalendarProviderId): Promise<CalendarConnection | null> {
  const db = await getDb()
  if (!db) return null
  const row = await db.prepare('SELECT * FROM calendar_connections WHERE user_email = ? AND provider = ?')
    .bind(userEmail, provider)
    .first<CalendarConnection>()
  return row || null
}

export async function saveConnection(input: {
  userEmail: string
  provider: CalendarProviderId
  accessToken: string
  refreshToken?: string | null
  expiresAt?: string | null
  scope?: string
  accountLabel?: string
}): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  const now = new Date().toISOString()
  await db.prepare(
    `INSERT INTO calendar_connections (user_email, provider, access_token, refresh_token, expires_at, scope, account_label, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_email, provider) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, calendar_connections.refresh_token),
       expires_at = excluded.expires_at,
       scope = excluded.scope,
       account_label = excluded.account_label,
       updated_at = excluded.updated_at`,
  ).bind(
    input.userEmail,
    input.provider,
    input.accessToken,
    input.refreshToken ?? null,
    input.expiresAt ?? null,
    input.scope ?? '',
    input.accountLabel ?? '',
    now,
    now,
  ).run()
  return true
}

export async function deleteConnection(userEmail: string, provider: CalendarProviderId): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare('DELETE FROM calendar_connections WHERE user_email = ? AND provider = ?').bind(userEmail, provider).run()
  return true
}

/** Client-safe view: never includes tokens. */
export async function listConnectedProviders(userEmail: string): Promise<Array<{ provider: CalendarProviderId; accountLabel: string; expired: boolean }>> {
  const db = await getDb()
  if (!db) return []
  const result = await db.prepare('SELECT provider, expires_at, account_label FROM calendar_connections WHERE user_email = ?')
    .bind(userEmail)
    .all<{ provider: CalendarProviderId; expires_at: string | null; account_label: string }>()
  const now = Date.now()
  return (result?.results || []).map(row => ({
    provider: row.provider,
    accountLabel: row.account_label,
    expired: Boolean(row.expires_at && new Date(row.expires_at).getTime() <= now),
  }))
}
