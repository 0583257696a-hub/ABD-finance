/**
 * CRM integration layer — provider-agnostic contracts.
 *
 * Mirrors the calendar layer (src/lib/calendar): one adapter per provider,
 * one registry, one server-side connection store. The app talks ONLY to
 * these types; a new CRM = one adapter file + one registry entry.
 *
 * What flows to a CRM (each switchable per advisor in settings):
 *   contact  — the client as a CRM contact/account (name, email, phone, id number)
 *   note     — a meeting summary as a timeline note/activity on that contact
 *   task     — a follow-up ("המשך טיפול") as a CRM task with owner + due date
 * Nothing flows FROM the CRM into the meeting workspace (privacy design:
 * client financial data stays in the browser). Reads are limited to
 * "find contact by email/phone/id" so records are updated, not duplicated.
 */

export type CrmProviderId = 'hubspot' | 'fireberry' | 'webhook'

export type CrmAuthType = 'api_key' | 'webhook_secret'

export type CrmCredentialField = {
  key: string
  label: string
  /** Rendered as a password input and never echoed back to the client. */
  secret?: boolean
  placeholder?: string
  help?: string
  required?: boolean
  defaultValue?: string
}

/** Advisor-facing switches, stored per connection. */
export type CrmSyncSettings = {
  /** Upsert the client as a contact when a meeting ends. */
  syncContacts: boolean
  /** Attach the meeting summary as a note/activity. */
  syncSummaries: boolean
  /** Create CRM tasks from follow-ups. */
  syncTasks: boolean
  /** Include the facts table (balances, pension figures) in the note text. */
  includeFacts: boolean
  /** Send the client's ID number as a contact field (Israeli CRMs key on it). */
  sendIdNumber: boolean
  /** Push automatically at end of meeting (else only via the manual button). */
  autoSync: boolean
}

export const DEFAULT_CRM_SETTINGS: CrmSyncSettings = {
  syncContacts: true,
  syncSummaries: true,
  syncTasks: true,
  includeFacts: false,
  sendIdNumber: true,
  autoSync: true,
}

export type CrmConnection = {
  user_email: string
  provider: CrmProviderId
  /** Decrypted credential map (adapter-specific keys). Never leaves the server. */
  credentials: Record<string, string>
  settings: CrmSyncSettings
  account_label: string
  status: 'active' | 'error'
  last_error: string | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export type CrmContactInput = {
  fullName: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  idNumber?: string
  /** Free text the adapter may map to a "notes"/"description" field. */
  description?: string
}

export type CrmContactRef = { externalId: string; url?: string; created: boolean }

export type CrmNoteInput = {
  contact: CrmContactRef | null
  title: string
  body: string
  occurredAt: string
  meetingId?: string | null
  summaryId?: string | null
}

export type CrmTaskInput = {
  contact: CrmContactRef | null
  title: string
  body?: string
  dueAt?: string | null
  owner: 'advisor' | 'client'
  followUpId?: string | null
}

export type CrmRecordRef = { externalId: string; url?: string }

export type CrmErrorCode = 'NOT_CONFIGURED' | 'AUTH' | 'RATE_LIMIT' | 'NOT_FOUND' | 'API' | 'NETWORK' | 'UNSUPPORTED' | 'VALIDATION'

export class CrmError extends Error {
  code: CrmErrorCode
  provider: CrmProviderId
  status?: number
  constructor(code: CrmErrorCode, message: string, provider: CrmProviderId, status?: number) {
    super(message)
    this.name = 'CrmError'
    this.code = code
    this.provider = provider
    this.status = status
  }
}

export interface CrmAdapter {
  id: CrmProviderId
  name: string
  authType: CrmAuthType
  /** Short Hebrew description shown under the provider name. */
  description: string
  docsUrl?: string
  fields: CrmCredentialField[]
  /** Cheap authenticated call; resolves to a human label for the account. */
  testConnection(connection: CrmConnection): Promise<{ accountLabel: string }>
  findContact(connection: CrmConnection, query: { email?: string; phone?: string; idNumber?: string }): Promise<CrmContactRef | null>
  upsertContact(connection: CrmConnection, input: CrmContactInput): Promise<CrmContactRef>
  createNote(connection: CrmConnection, input: CrmNoteInput): Promise<CrmRecordRef>
  createTask(connection: CrmConnection, input: CrmTaskInput): Promise<CrmRecordRef>
}

export type CrmSyncEntity = 'contact' | 'note' | 'task' | 'test'

export type CrmSyncLogEntry = {
  id: string
  user_email: string
  provider: CrmProviderId
  entity: CrmSyncEntity
  /** Our side: meeting id / summary id / follow-up id. */
  local_id: string | null
  external_id: string | null
  status: 'ok' | 'error' | 'skipped'
  message: string | null
  created_at: string
}

/** What the client (browser) is allowed to know about a connection. */
export type CrmStatus = {
  provider: CrmProviderId
  name: string
  description: string
  configured: boolean
  connected: boolean
  accountLabel: string
  status: 'active' | 'error' | null
  lastError: string | null
  lastSyncAt: string | null
  settings: CrmSyncSettings
  fields: CrmCredentialField[]
  docsUrl?: string
}

export function describeCrmError(error: unknown): string {
  if (error instanceof CrmError) {
    switch (error.code) {
      case 'AUTH': return 'ה-CRM דחה את המפתח/הטוקן. בדוק שהוא תקף ושיש לו הרשאות ליצירת אנשי קשר, הערות ומשימות.'
      case 'RATE_LIMIT': return 'ה-CRM הגביל את קצב הבקשות. נסה שוב בעוד דקה.'
      case 'NOT_CONFIGURED': return 'החיבור ל-CRM אינו מוגדר.'
      case 'NOT_FOUND': return 'הרשומה לא נמצאה ב-CRM.'
      case 'NETWORK': return 'לא ניתן להגיע ל-CRM (רשת/כתובת שגויה).'
      case 'UNSUPPORTED': return 'הפעולה אינה נתמכת בספק זה.'
      case 'VALIDATION': return error.message
      default: return `שגיאת CRM: ${error.message}`
    }
  }
  return error instanceof Error ? error.message : String(error)
}
