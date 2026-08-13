import { getD1Database } from './system-db'

/**
 * D1 layer for the meetings + client-intake-forms integrations.
 * Follows system-db.ts's self-provisioning pattern: CREATE TABLE IF NOT
 * EXISTS via prepare().run() on first touch, no separate migration required
 * (D1 is the source of truth for system-level data; client financial data
 * stays client-side).
 */

type D1Like = NonNullable<Awaited<ReturnType<typeof getD1Database>>>

export type MeetingRecord = {
  id: string
  user_email: string
  client_name: string
  client_email: string
  title: string
  starts_at: string
  ends_at: string
  location: string
  notes: string
  status: 'scheduled' | 'done' | 'cancelled'
  invite_sent_at: string | null
  created_at: string
}

export type ClientFormRecord = {
  token: string
  user_email: string
  client_name: string
  client_email: string
  status: 'sent' | 'submitted'
  payload_json: string | null
  sent_at: string
  submitted_at: string | null
}

let schemaEnsured = false

async function ensureMeetingsSchema(db: D1Like) {
  if (schemaEnsured) return
  const statements = [
    `CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'scheduled',
      invite_sent_at TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS client_forms (
      token TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'sent',
      payload_json TEXT,
      sent_at TEXT NOT NULL,
      submitted_at TEXT
    )`,
  ]
  for (const statement of statements) {
    await db.prepare(statement).run()
  }
  schemaEnsured = true
}

async function getDb(): Promise<D1Like | null> {
  const db = await getD1Database()
  if (!db) return null
  await ensureMeetingsSchema(db)
  return db
}

export async function listMeetings(userEmail: string): Promise<MeetingRecord[]> {
  const db = await getDb()
  if (!db) return []
  const result = await db.prepare('SELECT * FROM meetings WHERE user_email = ? ORDER BY starts_at DESC LIMIT 200').bind(userEmail).all<MeetingRecord>()
  return result?.results || []
}

export async function createMeeting(meeting: Omit<MeetingRecord, 'created_at' | 'invite_sent_at'>): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(
    'INSERT INTO meetings (id, user_email, client_name, client_email, title, starts_at, ends_at, location, notes, status, invite_sent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)'
  ).bind(
    meeting.id, meeting.user_email, meeting.client_name, meeting.client_email, meeting.title,
    meeting.starts_at, meeting.ends_at, meeting.location, meeting.notes, meeting.status,
    new Date().toISOString(),
  ).run()
  return true
}

export async function updateMeetingStatus(userEmail: string, id: string, status: MeetingRecord['status']): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare('UPDATE meetings SET status = ? WHERE id = ? AND user_email = ?').bind(status, id, userEmail).run()
  return true
}

export async function markInviteSent(userEmail: string, id: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare('UPDATE meetings SET invite_sent_at = ? WHERE id = ? AND user_email = ?').bind(new Date().toISOString(), id, userEmail).run()
  return true
}

export async function getMeeting(userEmail: string, id: string): Promise<MeetingRecord | null> {
  const db = await getDb()
  if (!db) return null
  const result = await db.prepare('SELECT * FROM meetings WHERE id = ? AND user_email = ?').bind(id, userEmail).first<MeetingRecord>()
  return result || null
}

export async function createClientForm(form: Omit<ClientFormRecord, 'status' | 'payload_json' | 'submitted_at'>): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(
    "INSERT INTO client_forms (token, user_email, client_name, client_email, status, payload_json, sent_at, submitted_at) VALUES (?, ?, ?, ?, 'sent', NULL, ?, NULL)"
  ).bind(form.token, form.user_email, form.client_name, form.client_email, form.sent_at).run()
  return true
}

/** Public lookup by token — deliberately returns only what the client-facing form page needs, never the advisor's other data. */
export async function getClientFormByToken(token: string): Promise<Pick<ClientFormRecord, 'token' | 'client_name' | 'status'> | null> {
  const db = await getDb()
  if (!db) return null
  const result = await db.prepare('SELECT token, client_name, status FROM client_forms WHERE token = ?').bind(token).first<Pick<ClientFormRecord, 'token' | 'client_name' | 'status'>>()
  return result || null
}

export async function submitClientForm(token: string, payloadJson: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  // Single-use: only transitions 'sent' -> 'submitted'; verify the row actually changed.
  await db.prepare(
    "UPDATE client_forms SET status = 'submitted', payload_json = ?, submitted_at = ? WHERE token = ? AND status = 'sent'"
  ).bind(payloadJson, new Date().toISOString(), token).run()
  const after = await db.prepare("SELECT status FROM client_forms WHERE token = ?").bind(token).first<{ status: string }>()
  return after?.status === 'submitted'
}

export async function listClientForms(userEmail: string): Promise<ClientFormRecord[]> {
  const db = await getDb()
  if (!db) return []
  const result = await db.prepare('SELECT * FROM client_forms WHERE user_email = ? ORDER BY sent_at DESC LIMIT 200').bind(userEmail).all<ClientFormRecord>()
  return result?.results || []
}
