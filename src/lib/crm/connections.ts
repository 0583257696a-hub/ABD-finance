import { getD1Database } from '../system-db'
import { decryptCredentials, encryptCredentials } from './crypto'
import { DEFAULT_CRM_SETTINGS, type CrmConnection, type CrmProviderId, type CrmSyncEntity, type CrmSyncLogEntry, type CrmSyncSettings } from './types'

/**
 * Server-side store for CRM connections + a sync log.
 *
 * Security contract (same as calendar_connections): credentials live ONLY in
 * D1, encrypted at rest (crm/crypto.ts), reachable only from server code. No
 * API route ever returns them — the client learns "connected + account label"
 * and nothing more. One connection per (advisor, provider); the app currently
 * uses at most one active provider per advisor.
 */

type D1Like = NonNullable<Awaited<ReturnType<typeof getD1Database>>>

type ConnectionRow = {
  user_email: string
  provider: string
  credentials_json: string
  settings_json: string
  account_label: string
  status: string
  last_error: string | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

let schemaEnsured = false

async function getDb(): Promise<D1Like | null> {
  const db = await getD1Database()
  if (!db) return null
  if (!schemaEnsured) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS crm_connections (
      user_email TEXT NOT NULL,
      provider TEXT NOT NULL,
      credentials_json TEXT NOT NULL,
      settings_json TEXT NOT NULL DEFAULT '{}',
      account_label TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      last_error TEXT,
      last_sync_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_email, provider)
    )`).run()
    await db.prepare(`CREATE TABLE IF NOT EXISTS crm_sync_log (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      provider TEXT NOT NULL,
      entity TEXT NOT NULL,
      local_id TEXT,
      external_id TEXT,
      status TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL
    )`).run()
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_crm_sync_log_user ON crm_sync_log (user_email, created_at DESC)').run().catch(() => null)
    schemaEnsured = true
  }
  return db
}

function parseSettings(json: string | null | undefined): CrmSyncSettings {
  try {
    const parsed = JSON.parse(json || '{}') as Partial<CrmSyncSettings>
    return { ...DEFAULT_CRM_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_CRM_SETTINGS }
  }
}

async function rowToConnection(row: ConnectionRow): Promise<CrmConnection> {
  return {
    user_email: row.user_email,
    provider: row.provider as CrmProviderId,
    credentials: await decryptCredentials(row.credentials_json),
    settings: parseSettings(row.settings_json),
    account_label: row.account_label || '',
    status: row.status === 'error' ? 'error' : 'active',
    last_error: row.last_error,
    last_sync_at: row.last_sync_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getCrmConnection(userEmail: string, provider: CrmProviderId): Promise<CrmConnection | null> {
  const db = await getDb()
  if (!db) return null
  const row = await db.prepare('SELECT * FROM crm_connections WHERE user_email = ? AND provider = ?').bind(userEmail, provider).first<ConnectionRow>()
  return row ? rowToConnection(row) : null
}

/** The advisor's active connection (first by most recent update); at most one is used for sync. */
export async function getActiveCrmConnection(userEmail: string): Promise<CrmConnection | null> {
  const db = await getDb()
  if (!db) return null
  const row = await db.prepare('SELECT * FROM crm_connections WHERE user_email = ? ORDER BY updated_at DESC LIMIT 1').bind(userEmail).first<ConnectionRow>()
  return row ? rowToConnection(row) : null
}

export async function listCrmConnections(userEmail: string): Promise<CrmConnection[]> {
  const db = await getDb()
  if (!db) return []
  const result = await db.prepare('SELECT * FROM crm_connections WHERE user_email = ? ORDER BY updated_at DESC').bind(userEmail).all<ConnectionRow>()
  return Promise.all((result.results || []).map(rowToConnection))
}

export async function saveCrmConnection(input: {
  userEmail: string
  provider: CrmProviderId
  credentials: Record<string, string>
  settings?: Partial<CrmSyncSettings>
  accountLabel?: string
}): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  const now = new Date().toISOString()
  const existing = await getCrmConnection(input.userEmail, input.provider)
  const settings = { ...DEFAULT_CRM_SETTINGS, ...(existing?.settings || {}), ...(input.settings || {}) }
  await db.prepare(
    `INSERT INTO crm_connections (user_email, provider, credentials_json, settings_json, account_label, status, last_error, last_sync_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?)
     ON CONFLICT(user_email, provider) DO UPDATE SET
       credentials_json = excluded.credentials_json,
       settings_json = excluded.settings_json,
       account_label = excluded.account_label,
       status = 'active',
       last_error = NULL,
       updated_at = excluded.updated_at`,
  ).bind(
    input.userEmail,
    input.provider,
    await encryptCredentials(input.credentials),
    JSON.stringify(settings),
    input.accountLabel ?? existing?.account_label ?? '',
    existing?.last_sync_at ?? null,
    existing?.created_at ?? now,
    now,
  ).run()
  return true
}

export async function updateCrmSettings(userEmail: string, provider: CrmProviderId, settings: Partial<CrmSyncSettings>): Promise<CrmSyncSettings | null> {
  const db = await getDb()
  if (!db) return null
  const existing = await getCrmConnection(userEmail, provider)
  if (!existing) return null
  const next = { ...existing.settings, ...settings }
  await db.prepare('UPDATE crm_connections SET settings_json = ?, updated_at = ? WHERE user_email = ? AND provider = ?')
    .bind(JSON.stringify(next), new Date().toISOString(), userEmail, provider).run()
  return next
}

export async function markCrmConnectionResult(userEmail: string, provider: CrmProviderId, result: { ok: boolean; error?: string | null }): Promise<void> {
  const db = await getDb()
  if (!db) return
  const now = new Date().toISOString()
  if (result.ok) {
    await db.prepare("UPDATE crm_connections SET status = 'active', last_error = NULL, last_sync_at = ?, updated_at = updated_at WHERE user_email = ? AND provider = ?").bind(now, userEmail, provider).run()
  } else {
    await db.prepare("UPDATE crm_connections SET status = 'error', last_error = ? WHERE user_email = ? AND provider = ?").bind(String(result.error || 'error').slice(0, 400), userEmail, provider).run()
  }
}

export async function deleteCrmConnection(userEmail: string, provider: CrmProviderId): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare('DELETE FROM crm_connections WHERE user_email = ? AND provider = ?').bind(userEmail, provider).run()
  return true
}

export async function writeCrmSyncLog(entry: {
  userEmail: string
  provider: CrmProviderId
  entity: CrmSyncEntity
  localId?: string | null
  externalId?: string | null
  status: 'ok' | 'error' | 'skipped'
  message?: string | null
}): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.prepare('INSERT INTO crm_sync_log (id, user_email, provider, entity, local_id, external_id, status, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), entry.userEmail, entry.provider, entry.entity, entry.localId ?? null, entry.externalId ?? null, entry.status, entry.message ? String(entry.message).slice(0, 500) : null, new Date().toISOString())
    .run()
    .catch(() => null)
}

export async function listCrmSyncLog(userEmail: string, limit = 20): Promise<CrmSyncLogEntry[]> {
  const db = await getDb()
  if (!db) return []
  const result = await db.prepare('SELECT * FROM crm_sync_log WHERE user_email = ? ORDER BY created_at DESC LIMIT ?').bind(userEmail, limit).all<CrmSyncLogEntry>()
  return result.results || []
}

/** Was this local entity already pushed successfully? (idempotency for re-runs) */
export async function findSyncedExternalId(userEmail: string, provider: CrmProviderId, entity: CrmSyncEntity, localId: string): Promise<string | null> {
  const db = await getDb()
  if (!db) return null
  const row = await db.prepare("SELECT external_id FROM crm_sync_log WHERE user_email = ? AND provider = ? AND entity = ? AND local_id = ? AND status = 'ok' AND external_id IS NOT NULL ORDER BY created_at DESC LIMIT 1")
    .bind(userEmail, provider, entity, localId).first<{ external_id: string }>()
  return row?.external_id || null
}

/** Admin wipe helper (user delete = full data delete). */
export async function deleteAllCrmDataForUser(userEmail: string): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.prepare('DELETE FROM crm_connections WHERE user_email = ?').bind(userEmail).run().catch(() => null)
  await db.prepare('DELETE FROM crm_sync_log WHERE user_email = ?').bind(userEmail).run().catch(() => null)
}
