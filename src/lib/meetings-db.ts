import { getD1Database } from './system-db'

/**
 * D1 layer for the meetings + client-intake-forms integrations.
 * Follows system-db.ts's self-provisioning pattern: CREATE TABLE IF NOT
 * EXISTS via prepare().run() on first touch, no separate migration required
 * (D1 is the source of truth for system-level data; client financial data
 * stays client-side).
 */

type D1Like = NonNullable<Awaited<ReturnType<typeof getD1Database>>>

export type MeetingSource = 'google_calendar' | 'microsoft_outlook' | 'calendly' | 'spontaneous'

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
  // --- Meeting Session fields (added with the Meeting Workspace architecture) ---
  /** Where this meeting came from. Legacy rows default to 'spontaneous'. */
  source: MeetingSource
  /** Provider's own event id when the meeting originated from a calendar. */
  external_event_id: string | null
  meeting_url: string | null
  participants_json: string | null
  /** Set when the advisor presses "start" — the session, not the calendar slot. */
  started_at: string | null
  ended_at: string | null
  /** Links to the archived summary produced when the session ended. */
  summary_id: string | null
}

export type MeetingSummaryRecord = {
  id: string
  user_email: string
  meeting_id: string | null
  title: string
  client_name: string
  /** Serialized MeetingSummaryData — the full document as it stood at meeting end. */
  summary_json: string
  source: MeetingSource
  external_event_id: string | null
  meeting_started_at: string | null
  meeting_ended_at: string | null
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
    `CREATE TABLE IF NOT EXISTS meeting_summaries (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      meeting_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      client_name TEXT NOT NULL DEFAULT '',
      summary_json TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'spontaneous',
      external_event_id TEXT,
      meeting_started_at TEXT,
      meeting_ended_at TEXT,
      created_at TEXT NOT NULL
    )`,
  ]
  for (const statement of statements) {
    await db.prepare(statement).run()
  }

  // Additive migration for deployments whose `meetings` table predates the
  // Meeting Session architecture. SQLite has no "ADD COLUMN IF NOT EXISTS",
  // and re-adding an existing column throws — so each one is attempted
  // independently and a duplicate-column error is the expected no-op.
  const addedColumns = [
    "ALTER TABLE meetings ADD COLUMN source TEXT NOT NULL DEFAULT 'spontaneous'",
    'ALTER TABLE meetings ADD COLUMN external_event_id TEXT',
    'ALTER TABLE meetings ADD COLUMN meeting_url TEXT',
    'ALTER TABLE meetings ADD COLUMN participants_json TEXT',
    'ALTER TABLE meetings ADD COLUMN started_at TEXT',
    'ALTER TABLE meetings ADD COLUMN ended_at TEXT',
    'ALTER TABLE meetings ADD COLUMN summary_id TEXT',
  ]
  for (const statement of addedColumns) {
    try {
      await db.prepare(statement).run()
    } catch {
      // Column already present — expected on every run after the first.
    }
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

export type CreateMeetingInput = Pick<MeetingRecord, 'id' | 'user_email' | 'client_name' | 'client_email' | 'title' | 'starts_at' | 'ends_at' | 'location' | 'notes' | 'status'>
  & Partial<Pick<MeetingRecord, 'source' | 'external_event_id' | 'meeting_url' | 'participants_json'>>

export async function createMeeting(meeting: CreateMeetingInput): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(
    `INSERT INTO meetings (id, user_email, client_name, client_email, title, starts_at, ends_at, location, notes, status, invite_sent_at, created_at, source, external_event_id, meeting_url, participants_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`
  ).bind(
    meeting.id, meeting.user_email, meeting.client_name, meeting.client_email, meeting.title,
    meeting.starts_at, meeting.ends_at, meeting.location, meeting.notes, meeting.status,
    new Date().toISOString(),
    meeting.source || 'spontaneous',
    meeting.external_event_id ?? null,
    meeting.meeting_url ?? null,
    meeting.participants_json ?? null,
  ).run()
  return true
}

/**
 * Finds an already-imported meeting for a calendar event, so starting the
 * same calendar event twice reuses one Smart Meeting session instead of
 * creating duplicates.
 */
export async function findMeetingByExternalEvent(userEmail: string, externalEventId: string): Promise<MeetingRecord | null> {
  const db = await getDb()
  if (!db) return null
  const row = await db.prepare('SELECT * FROM meetings WHERE user_email = ? AND external_event_id = ? LIMIT 1')
    .bind(userEmail, externalEventId)
    .first<MeetingRecord>()
  return row || null
}

/** Marks the session as started — this is the Smart Meeting session, not the calendar slot. */
export async function startMeetingSession(userEmail: string, id: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare("UPDATE meetings SET started_at = COALESCE(started_at, ?), status = 'scheduled' WHERE id = ? AND user_email = ?")
    .bind(new Date().toISOString(), id, userEmail)
    .run()
  return true
}

export async function endMeetingSession(userEmail: string, id: string, summaryId: string | null): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare("UPDATE meetings SET ended_at = ?, status = 'done', summary_id = ? WHERE id = ? AND user_email = ?")
    .bind(new Date().toISOString(), summaryId, id, userEmail)
    .run()
  return true
}

// --- Meeting summaries archive (spec §10: every finished meeting is stored) ---

export async function saveMeetingSummary(summary: Omit<MeetingSummaryRecord, 'created_at'>): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(
    `INSERT INTO meeting_summaries (id, user_email, meeting_id, title, client_name, summary_json, source, external_event_id, meeting_started_at, meeting_ended_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    summary.id, summary.user_email, summary.meeting_id, summary.title, summary.client_name,
    summary.summary_json, summary.source, summary.external_event_id,
    summary.meeting_started_at, summary.meeting_ended_at,
    new Date().toISOString(),
  ).run()
  return true
}

export async function listMeetingSummaries(userEmail: string): Promise<Array<Omit<MeetingSummaryRecord, 'summary_json'>>> {
  const db = await getDb()
  if (!db) return []
  // Deliberately omits summary_json — the list view never needs the full document.
  const result = await db.prepare(
    'SELECT id, user_email, meeting_id, title, client_name, source, external_event_id, meeting_started_at, meeting_ended_at, created_at FROM meeting_summaries WHERE user_email = ? ORDER BY created_at DESC LIMIT 200'
  ).bind(userEmail).all<Omit<MeetingSummaryRecord, 'summary_json'>>()
  return result?.results || []
}

export async function getMeetingSummary(userEmail: string, id: string): Promise<MeetingSummaryRecord | null> {
  const db = await getDb()
  if (!db) return null
  const row = await db.prepare('SELECT * FROM meeting_summaries WHERE id = ? AND user_email = ?')
    .bind(id, userEmail)
    .first<MeetingSummaryRecord>()
  return row || null
}

export async function updateMeetingNotes(userEmail: string, id: string, notes: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare('UPDATE meetings SET notes = ? WHERE id = ? AND user_email = ?').bind(notes, id, userEmail).run()
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
