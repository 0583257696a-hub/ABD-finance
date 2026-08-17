import { ensureSystemSchema, findD1UserById, listD1Users, parseUserSettings, writeAuditEvent, type SystemUserRecord } from '@/lib/system-db'

/**
 * Admin-panel data layer: agencies (real rows, not derived from registration
 * text), agency membership, support tickets, full user deletion, audit
 * listing and system-wide stats. Everything here is admin-only and is
 * reached through /api/admin/*, which enforces the admin session.
 *
 * Schema is self-provisioning like the rest of the app (CREATE IF NOT EXISTS
 * on first use), so a deploy needs no manual migration.
 */

type Db = NonNullable<Awaited<ReturnType<typeof ensureSystemSchema>>>

let adminSchemaReady = false

async function getDb(): Promise<Db | null> {
  const db = await ensureSystemSchema()
  if (!db) return null
  if (!adminSchemaReady) {
    const statements = [
      `CREATE TABLE IF NOT EXISTS agencies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tax_id TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        plan_id TEXT NOT NULL DEFAULT 'trial',
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      // One user belongs to at most one agency (user_id is the primary key).
      `CREATE TABLE IF NOT EXISTS agency_members (
        user_id TEXT PRIMARY KEY,
        agency_id TEXT NOT NULL,
        member_role TEXT NOT NULL DEFAULT 'employee',
        created_at TEXT NOT NULL,
        FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id)`,
      `CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'normal',
        internal_notes TEXT NOT NULL DEFAULT '',
        replies_json TEXT NOT NULL DEFAULT '[]',
        page_url TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        closed_at TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at)`,
    ]
    for (const statement of statements) await db.prepare(statement).run()
    adminSchemaReady = true
  }
  return db
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type AdminUserRow = {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
  phone: string
  userType: string
  planId: string
  subscriptionStatus: string
  trialEndsAt: string | null
  registeredBusinessName: string
  requestedAgencyName: string
  agencyId: string | null
  agencyName: string | null
  agencyRole: string | null
  meetingsCount: number
  summariesCount: number
}

export async function listAdminUsers(): Promise<AdminUserRow[] | null> {
  const db = await getDb()
  if (!db) return null
  const users = await listD1Users()
  if (!users) return null

  const membership = await db.prepare(
    `SELECT m.user_id, m.agency_id, m.member_role, a.name AS agency_name
     FROM agency_members m JOIN agencies a ON a.id = m.agency_id`,
  ).all<{ user_id: string; agency_id: string; member_role: string; agency_name: string }>()
  const byUser = new Map((membership.results || []).map(row => [row.user_id, row]))

  // Per-user activity counts — meetings/summaries are keyed by email.
  const meetingCounts = await db.prepare(`SELECT user_email, COUNT(*) AS n FROM meetings GROUP BY user_email`).all<{ user_email: string; n: number }>().catch(() => ({ results: [] as Array<{ user_email: string; n: number }> }))
  const summaryCounts = await db.prepare(`SELECT user_email, COUNT(*) AS n FROM meeting_summaries GROUP BY user_email`).all<{ user_email: string; n: number }>().catch(() => ({ results: [] as Array<{ user_email: string; n: number }> }))
  const meetingsBy = new Map((meetingCounts.results || []).map(row => [row.user_email.toLowerCase(), Number(row.n) || 0]))
  const summariesBy = new Map((summaryCounts.results || []).map(row => [row.user_email.toLowerCase(), Number(row.n) || 0]))

  return users.map(user => {
    const settings = parseUserSettings(user)
    const registration = settings.registration
    const subscription = settings.subscription
    const member = byUser.get(user.id)
    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role || 'advisor',
      status: registration?.status || user.status || 'active',
      createdAt: user.created_at,
      phone: registration?.phone || '',
      userType: registration?.userType || 'legacy',
      planId: subscription?.planId || registration?.planId || 'legacy',
      subscriptionStatus: subscription?.status || registration?.subscriptionStatus || user.status || 'active',
      trialEndsAt: subscription?.trialEndsAt || registration?.trialEndsAt || null,
      registeredBusinessName: registration?.business?.name || '',
      requestedAgencyName: registration?.agencyJoin?.agencyName || '',
      agencyId: member?.agency_id || null,
      agencyName: member?.agency_name || null,
      agencyRole: member?.member_role || null,
      meetingsCount: meetingsBy.get(user.email.toLowerCase()) || 0,
      summariesCount: summariesBy.get(user.email.toLowerCase()) || 0,
    }
  })
}

export async function setD1UserRole(userId: string, role: 'admin' | 'advisor') {
  const db = await getDb()
  if (!db) return false
  await db.prepare(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`).bind(role, new Date().toISOString(), userId).run()
  return true
}

/**
 * FULL deletion of a user and everything they own. Product decision: deleting
 * a user from the admin panel removes all of their data — meetings,
 * summaries, questionnaires (sent and templates), notifications, calendar
 * connections, agency membership, reset tokens, settings. Not reversible.
 * Returns per-table counts so the admin sees exactly what went away.
 */
export async function deleteD1UserCompletely(userId: string): Promise<{ ok: boolean; email?: string; removed: Record<string, number> }> {
  const db = await getDb()
  if (!db) return { ok: false, removed: {} }
  const user = await findD1UserById(userId)
  if (!user) return { ok: false, removed: {} }
  const email = user.email

  const removed: Record<string, number> = {}
  async function wipe(table: string, column: string, value: string) {
    try {
      const count = await db!.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`).bind(value).first<{ n: number }>()
      await db!.prepare(`DELETE FROM ${table} WHERE ${column} = ?`).bind(value).run()
      removed[table] = Number(count?.n) || 0
    } catch {
      // Table may not exist yet in this environment (created lazily by its own module).
      removed[table] = 0
    }
  }

  await wipe('meeting_summaries', 'user_email', email)
  await wipe('meetings', 'user_email', email)
  await wipe('client_forms', 'user_email', email)
  await wipe('questionnaire_templates', 'user_email', email)
  await wipe('notifications', 'user_email', email)
  await wipe('calendar_connections', 'user_email', email)
  await wipe('agency_members', 'user_id', userId)
  await wipe('password_reset_tokens', 'user_id', userId)
  await wipe('user_settings', 'user_id', userId)
  await db.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run()
  removed.users = 1
  return { ok: true, email, removed }
}

// ---------------------------------------------------------------------------
// Agencies
// ---------------------------------------------------------------------------

export type AgencyRecord = {
  id: string
  name: string
  tax_id: string
  address: string
  phone: string
  email: string
  plan_id: string
  status: string
  notes: string
  created_at: string
  updated_at: string
}

export type AgencyMemberRow = { userId: string; email: string; name: string; memberRole: string; status: string }

export type AgencyWithMembers = AgencyRecord & { members: AgencyMemberRow[] }

/**
 * Links a user to an agency based on what they filled in at registration —
 * once, and only after they are APPROVED (pending/blocked sign-ups never
 * create agency rows). Marks registration_json.agencyLinkedAt so an admin's
 * later reassignment/removal is never undone by re-running this.
 *
 *  - agency_manager with a business name → agency row created if missing,
 *    user becomes its manager.
 *  - agency_employee who asked to join an agency → linked as employee ONLY if
 *    an agency with that exact name already exists (typing a name must not
 *    grant membership to an arbitrary agency); otherwise stays unassigned
 *    and the users tab shows the request for the admin to act on.
 */
export async function linkUserToAgencyFromRegistration(userId: string): Promise<{ linked: boolean; agencyId?: string; created?: boolean }> {
  const db = await getDb()
  if (!db) return { linked: false }
  const user = await findD1UserById(userId)
  if (!user) return { linked: false }
  const settings = parseUserSettings(user)
  const registration = settings.registration
  if (!registration || registration.agencyLinkedAt) return { linked: false }
  if ((registration.status || user.status) !== 'active') return { linked: false }
  const already = await db.prepare(`SELECT agency_id FROM agency_members WHERE user_id = ?`).bind(userId).first<{ agency_id: string }>()
  const now = new Date().toISOString()

  async function mark() {
    await db!.prepare(`UPDATE user_settings SET registration_json = ?, updated_at = ? WHERE user_id = ?`)
      .bind(JSON.stringify({ ...registration, agencyLinkedAt: now }), now, userId).run()
  }
  if (already) { await mark(); return { linked: false } }

  async function findAgencyByName(name: string) {
    return db!.prepare(`SELECT id FROM agencies WHERE lower(trim(name)) = lower(trim(?))`).bind(name).first<{ id: string }>()
  }

  if (registration.userType === 'agency_manager' && registration.business?.name) {
    const business = registration.business
    let agencyId = (await findAgencyByName(business.name))?.id
    let created = false
    if (!agencyId) {
      agencyId = crypto.randomUUID()
      created = true
      await db.prepare(
        `INSERT INTO agencies (id, name, tax_id, address, phone, email, plan_id, status, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?)`,
      ).bind(agencyId, business.name.trim(), business.id || '', business.address || '', business.phone || '', business.email || '', registration.planId || 'trial', now, now).run()
    }
    await db.prepare(`INSERT OR IGNORE INTO agency_members (user_id, agency_id, member_role, created_at) VALUES (?, ?, 'manager', ?)`).bind(userId, agencyId, now).run()
    await mark()
    return { linked: true, agencyId, created }
  }

  if (registration.userType === 'agency_employee' && registration.agencyJoin?.agencyName) {
    const found = await findAgencyByName(registration.agencyJoin.agencyName)
    if (found) {
      await db.prepare(`INSERT OR IGNORE INTO agency_members (user_id, agency_id, member_role, created_at) VALUES (?, ?, 'employee', ?)`).bind(userId, found.id, now).run()
      await mark()
      return { linked: true, agencyId: found.id }
    }
    // Leave unmarked so the link happens automatically once the agency exists.
    return { linked: false }
  }

  await mark()
  return { linked: false }
}

/** Runs the per-user linking for every approved user that hasn't been processed — cheap, idempotent. */
async function linkApprovedUsersFromRegistrations() {
  const users = (await listD1Users()) || []
  // Managers first so their agencies exist before employees try to join.
  const ordered = [...users].sort((a, b) => Number(parseUserSettings(b).registration?.userType === 'agency_manager') - Number(parseUserSettings(a).registration?.userType === 'agency_manager'))
  for (const user of ordered) {
    const registration = parseUserSettings(user).registration
    if (!registration || registration.agencyLinkedAt) continue
    if ((registration.status || user.status) !== 'active') continue
    await linkUserToAgencyFromRegistration(user.id).catch(() => {})
  }
}

export async function listAgencies(): Promise<AgencyWithMembers[] | null> {
  const db = await getDb()
  if (!db) return null
  await linkApprovedUsersFromRegistrations()
  const agencies = await db.prepare(`SELECT * FROM agencies ORDER BY name COLLATE NOCASE`).all<AgencyRecord>()
  const members = await db.prepare(
    `SELECT m.agency_id, m.user_id, m.member_role, u.email, u.name, u.status
     FROM agency_members m JOIN users u ON u.id = m.user_id
     ORDER BY CASE m.member_role WHEN 'manager' THEN 0 ELSE 1 END, u.name COLLATE NOCASE`,
  ).all<{ agency_id: string; user_id: string; member_role: string; email: string; name: string | null; status: string }>()
  const grouped = new Map<string, AgencyMemberRow[]>()
  for (const row of members.results || []) {
    const list = grouped.get(row.agency_id) || []
    list.push({ userId: row.user_id, email: row.email, name: row.name || '', memberRole: row.member_role, status: row.status })
    grouped.set(row.agency_id, list)
  }
  return (agencies.results || []).map(agency => ({ ...agency, members: grouped.get(agency.id) || [] }))
}

export type AgencyInput = Partial<Pick<AgencyRecord, 'name' | 'tax_id' | 'address' | 'phone' | 'email' | 'plan_id' | 'status' | 'notes'>>

export async function createAgency(input: AgencyInput & { name: string }): Promise<string | null> {
  const db = await getDb()
  if (!db) return null
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  await db.prepare(
    `INSERT INTO agencies (id, name, tax_id, address, phone, email, plan_id, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, input.name, input.tax_id || '', input.address || '', input.phone || '', input.email || '', input.plan_id || 'trial', input.status || 'active', input.notes || '', now, now).run()
  return id
}

export async function updateAgency(id: string, patch: AgencyInput): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  const current = await db.prepare(`SELECT * FROM agencies WHERE id = ?`).bind(id).first<AgencyRecord>()
  if (!current) return false
  const next = { ...current, ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) } as AgencyRecord
  await db.prepare(
    `UPDATE agencies SET name = ?, tax_id = ?, address = ?, phone = ?, email = ?, plan_id = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?`,
  ).bind(next.name, next.tax_id, next.address, next.phone, next.email, next.plan_id, next.status, next.notes, new Date().toISOString(), id).run()
  return true
}

/** Deletes the agency; its members become unassigned (users are NOT deleted). */
export async function deleteAgency(id: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(`DELETE FROM agency_members WHERE agency_id = ?`).bind(id).run()
  await db.prepare(`DELETE FROM agencies WHERE id = ?`).bind(id).run()
  const remaining = await db.prepare(`SELECT id FROM agencies WHERE id = ?`).bind(id).first<{ id: string }>()
  return !remaining
}

/** Assigns (or moves) a user to an agency with a role; a user is in one agency at a time. */
export async function assignAgencyMember(agencyId: string, userId: string, memberRole: 'manager' | 'employee'): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  const agency = await db.prepare(`SELECT id FROM agencies WHERE id = ?`).bind(agencyId).first<{ id: string }>()
  const user = await db.prepare(`SELECT id FROM users WHERE id = ?`).bind(userId).first<{ id: string }>()
  if (!agency || !user) return false
  await db.prepare(
    `INSERT INTO agency_members (user_id, agency_id, member_role, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET agency_id = excluded.agency_id, member_role = excluded.member_role`,
  ).bind(userId, agencyId, memberRole, new Date().toISOString()).run()
  return true
}

export async function removeAgencyMember(userId: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(`DELETE FROM agency_members WHERE user_id = ?`).bind(userId).run()
  return true
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

export type SupportTicketStatus = 'open' | 'in_progress' | 'closed'

export type SupportTicketRecord = {
  id: string
  user_email: string
  user_name: string
  subject: string
  message: string
  category: string
  status: SupportTicketStatus
  priority: string
  internal_notes: string
  replies_json: string
  page_url: string
  created_at: string
  updated_at: string
  closed_at: string | null
}

export type SupportReply = { at: string; by: string; text: string }

export async function createSupportTicket(input: { userEmail: string; userName: string; subject: string; message: string; category?: string; pageUrl?: string }): Promise<string | null> {
  const db = await getDb()
  if (!db) return null
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  await db.prepare(
    `INSERT INTO support_tickets (id, user_email, user_name, subject, message, category, status, priority, internal_notes, replies_json, page_url, created_at, updated_at, closed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', 'normal', '', '[]', ?, ?, ?, NULL)`,
  ).bind(id, input.userEmail, input.userName, input.subject, input.message, input.category || 'general', input.pageUrl || '', now, now).run()
  return id
}

export async function listSupportTickets(): Promise<SupportTicketRecord[] | null> {
  const db = await getDb()
  if (!db) return null
  const result = await db.prepare(
    `SELECT * FROM support_tickets ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, created_at DESC LIMIT 500`,
  ).all<SupportTicketRecord>()
  return result.results || []
}

export async function listSupportTicketsForUser(userEmail: string): Promise<SupportTicketRecord[]> {
  const db = await getDb()
  if (!db) return []
  const result = await db.prepare(`SELECT * FROM support_tickets WHERE user_email = ? ORDER BY created_at DESC LIMIT 50`).bind(userEmail).all<SupportTicketRecord>()
  return result.results || []
}

export async function getSupportTicket(id: string): Promise<SupportTicketRecord | null> {
  const db = await getDb()
  if (!db) return null
  return (await db.prepare(`SELECT * FROM support_tickets WHERE id = ?`).bind(id).first<SupportTicketRecord>()) || null
}

export async function updateSupportTicket(id: string, patch: { status?: SupportTicketStatus; priority?: string; internalNotes?: string; appendReply?: SupportReply }): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  const current = await getSupportTicket(id)
  if (!current) return false
  const now = new Date().toISOString()
  let replies: SupportReply[] = []
  try { replies = JSON.parse(current.replies_json || '[]') } catch { replies = [] }
  if (patch.appendReply) replies.push(patch.appendReply)
  const status = patch.status || current.status
  await db.prepare(
    `UPDATE support_tickets SET status = ?, priority = ?, internal_notes = ?, replies_json = ?, updated_at = ?, closed_at = ? WHERE id = ?`,
  ).bind(
    status,
    patch.priority || current.priority,
    patch.internalNotes ?? current.internal_notes,
    JSON.stringify(replies),
    now,
    status === 'closed' ? (current.closed_at || now) : null,
    id,
  ).run()
  return true
}

export async function deleteSupportTicket(id: string): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  await db.prepare(`DELETE FROM support_tickets WHERE id = ?`).bind(id).run()
  const remaining = await db.prepare(`SELECT id FROM support_tickets WHERE id = ?`).bind(id).first<{ id: string }>()
  return !remaining
}

// ---------------------------------------------------------------------------
// Audit + stats
// ---------------------------------------------------------------------------

export type AuditEventRecord = { id: string; actor_email: string | null; action: string; target_id: string | null; metadata_json: string | null; created_at: string }

export async function listAuditEvents(limit = 300): Promise<AuditEventRecord[] | null> {
  const db = await getDb()
  if (!db) return null
  const result = await db.prepare(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?`).bind(limit).all<AuditEventRecord>()
  return result.results || []
}

export async function clearAuditEvents(): Promise<number> {
  const db = await getDb()
  if (!db) return 0
  const count = await db.prepare(`SELECT COUNT(*) AS n FROM audit_events`).first<{ n: number }>()
  await db.prepare(`DELETE FROM audit_events`).run()
  return Number(count?.n) || 0
}

export type AdminStats = {
  usersTotal: number
  usersActive: number
  usersPending: number
  usersBlocked: number
  admins: number
  agencies: number
  meetingsTotal: number
  meetingsThisMonth: number
  summariesTotal: number
  summariesThisMonth: number
  formsSent: number
  formsSubmitted: number
  ticketsOpen: number
  ticketsInProgress: number
  ticketsClosed: number
  auditFailures24h: number
}

export async function getAdminStats(): Promise<AdminStats | null> {
  const db = await getDb()
  if (!db) return null
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const monthIso = monthStart.toISOString()
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  async function count(sql: string, ...binds: unknown[]): Promise<number> {
    try {
      const row = await db!.prepare(sql).bind(...binds).first<{ n: number }>()
      return Number(row?.n) || 0
    } catch { return 0 }
  }

  const users = (await listD1Users()) || []
  const statusOf = (user: SystemUserRecord) => parseUserSettings(user).registration?.status || user.status || 'active'

  return {
    usersTotal: users.length,
    usersActive: users.filter(user => statusOf(user) === 'active').length,
    usersPending: users.filter(user => statusOf(user) === 'pending_approval').length,
    usersBlocked: users.filter(user => statusOf(user) === 'blocked').length,
    admins: users.filter(user => user.role === 'admin').length,
    agencies: await count(`SELECT COUNT(*) AS n FROM agencies`),
    meetingsTotal: await count(`SELECT COUNT(*) AS n FROM meetings`),
    meetingsThisMonth: await count(`SELECT COUNT(*) AS n FROM meetings WHERE created_at >= ?`, monthIso),
    summariesTotal: await count(`SELECT COUNT(*) AS n FROM meeting_summaries`),
    summariesThisMonth: await count(`SELECT COUNT(*) AS n FROM meeting_summaries WHERE created_at >= ?`, monthIso),
    formsSent: await count(`SELECT COUNT(*) AS n FROM client_forms`),
    formsSubmitted: await count(`SELECT COUNT(*) AS n FROM client_forms WHERE status = 'submitted'`),
    ticketsOpen: await count(`SELECT COUNT(*) AS n FROM support_tickets WHERE status = 'open'`),
    ticketsInProgress: await count(`SELECT COUNT(*) AS n FROM support_tickets WHERE status = 'in_progress'`),
    ticketsClosed: await count(`SELECT COUNT(*) AS n FROM support_tickets WHERE status = 'closed'`),
    auditFailures24h: await count(`SELECT COUNT(*) AS n FROM audit_events WHERE created_at >= ? AND (action LIKE '%fail%' OR action LIKE '%denied%' OR action LIKE '%error%')`, dayAgo),
  }
}

export { writeAuditEvent }
