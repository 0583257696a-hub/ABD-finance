import { CrmError, type CrmAdapter, type CrmConnection } from '../types'
import { crmFetch, digitsOnly, splitName } from './http'

/**
 * Fireberry (לשעבר Powerlink) — the CRM most common in Israeli insurance /
 * pension agencies. REST API with a per-user token (`tokenid` header):
 *   POST /api/query                    search records (objecttype + query string)
 *   POST /api/record/{objecttype}      create
 *   PUT  /api/record/{objecttype}/{id} update
 * Object type numbers and field names differ between accounts (custom
 * objects/fields are the norm), so they are CONFIGURABLE per connection with
 * the common defaults pre-filled: 1 = Account/לקוח, 6 = Task/משימה,
 * 10 = Note/הערה. "בדיקת חיבור" runs a real query against the contact object
 * type, so a wrong number surfaces immediately, not on the first meeting.
 */

const BASE = 'https://api.fireberry.com'

function creds(connection: CrmConnection) {
  const token = connection.credentials.token?.trim()
  if (!token) throw new CrmError('NOT_CONFIGURED', 'Fireberry token missing', 'fireberry')
  return {
    headers: { tokenid: token, 'content-type': 'application/json', accept: 'application/json' },
    contactType: connection.credentials.contactObjectType?.trim() || '1',
    taskType: connection.credentials.taskObjectType?.trim() || '6',
    noteType: connection.credentials.noteObjectType?.trim() || '10',
    nameField: connection.credentials.nameField?.trim() || 'accountname',
    emailField: connection.credentials.emailField?.trim() || 'emailaddress1',
    phoneField: connection.credentials.phoneField?.trim() || 'telephone1',
    idField: connection.credentials.idNumberField?.trim() || 'idnumber',
    // The lookup field on task/note records that points at the contact/account.
    parentField: connection.credentials.parentField?.trim() || 'accountid',
  }
}

type QueryResponse = { success?: boolean; data?: { Data?: Array<Record<string, unknown>>; Total_Records?: number } }
type RecordResponse = { success?: boolean; data?: { Record?: Record<string, unknown> } & Record<string, unknown>; message?: string }

function idOf(record: Record<string, unknown> | undefined, objectType: string): string {
  if (!record) return ''
  const candidates = [`${objectType}id`, 'accountid', 'contactid', 'id', 'recordid', 'activityid', 'taskid']
  for (const key of candidates) if (record[key]) return String(record[key])
  const anyId = Object.entries(record).find(([key, value]) => /id$/i.test(key) && value)
  return anyId ? String(anyId[1]) : ''
}

function quote(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

async function query(connection: CrmConnection, objectType: string, condition: string, fields: string) {
  const { headers } = creds(connection)
  const { data } = await crmFetch<QueryResponse>('fireberry', `${BASE}/api/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ objecttype: Number(objectType), page_size: 1, page_number: 1, fields, query: condition }),
  })
  return data?.data?.Data?.[0]
}

export const fireberryAdapter: CrmAdapter = {
  id: 'fireberry',
  name: 'Fireberry (Powerlink)',
  authType: 'api_key',
  description: 'לקוחות, הערות ומשימות ב-Fireberry — ה-CRM הנפוץ בסוכנויות ביטוח ופנסיה בישראל.',
  docsUrl: 'https://developers.fireberry.com/',
  fields: [
    { key: 'token', label: 'API Token', secret: true, required: true, help: 'Fireberry → הגדרות → API → יצירת טוקן למשתמש.' },
    { key: 'contactObjectType', label: 'מספר אובייקט לקוח', defaultValue: '1', placeholder: '1', help: 'ברירת מחדל 1 (חשבון/לקוח). אם אתם עובדים על "איש קשר" — 2.' },
    { key: 'nameField', label: 'שדה שם', defaultValue: 'accountname', placeholder: 'accountname' },
    { key: 'emailField', label: 'שדה אימייל', defaultValue: 'emailaddress1', placeholder: 'emailaddress1' },
    { key: 'phoneField', label: 'שדה טלפון', defaultValue: 'telephone1', placeholder: 'telephone1' },
    { key: 'idNumberField', label: 'שדה ת.ז', defaultValue: 'idnumber', placeholder: 'idnumber', help: 'השם הפנימי של שדה תעודת הזהות באובייקט הלקוח.' },
    { key: 'taskObjectType', label: 'מספר אובייקט משימה', defaultValue: '6', placeholder: '6' },
    { key: 'noteObjectType', label: 'מספר אובייקט הערה', defaultValue: '10', placeholder: '10' },
    { key: 'parentField', label: 'שדה קישור ללקוח במשימה/הערה', defaultValue: 'accountid', placeholder: 'accountid' },
  ],

  async testConnection(connection) {
    const c = creds(connection)
    // A real (cheap) query proves both the token and the object type.
    await query(connection, c.contactType, `${c.nameField} != ''`, c.nameField)
    return { accountLabel: `Fireberry · אובייקט ${c.contactType}` }
  },

  async findContact(connection, q) {
    const c = creds(connection)
    const conditions: string[] = []
    if (q.idNumber) conditions.push(`${c.idField} = ${quote(digitsOnly(q.idNumber))}`)
    if (q.email) conditions.push(`${c.emailField} = ${quote(q.email.trim().toLowerCase())}`)
    if (q.phone) conditions.push(`${c.phoneField} = ${quote(q.phone)}`)
    for (const condition of conditions) {
      const hit = await query(connection, c.contactType, condition, `${c.contactType}id,${c.nameField}`)
      const id = idOf(hit, c.contactType)
      if (id) return { externalId: id, created: false }
    }
    return null
  },

  async upsertContact(connection, input) {
    const c = creds(connection)
    const record: Record<string, unknown> = { [c.nameField]: input.fullName }
    if (input.email) record[c.emailField] = input.email.trim().toLowerCase()
    if (input.phone) record[c.phoneField] = input.phone
    if (input.idNumber) record[c.idField] = digitsOnly(input.idNumber)
    if (c.contactType === '2') { const { firstName, lastName } = splitName(input.fullName); record.firstname = firstName; record.lastname = lastName }

    const existing = await this.findContact(connection, { idNumber: input.idNumber, email: input.email, phone: input.phone })
    if (existing) {
      await crmFetch<RecordResponse>('fireberry', `${BASE}/api/record/${c.contactType}/${existing.externalId}`, { method: 'PUT', headers: c.headers, body: JSON.stringify(record) })
      return { ...existing, created: false }
    }
    const { data } = await crmFetch<RecordResponse>('fireberry', `${BASE}/api/record/${c.contactType}`, { method: 'POST', headers: c.headers, body: JSON.stringify(record) })
    const id = idOf((data?.data?.Record as Record<string, unknown>) || data?.data, c.contactType)
    if (!id) throw new CrmError('API', `Fireberry did not return a record id (${JSON.stringify(data).slice(0, 200)})`, 'fireberry')
    return { externalId: id, created: true }
  },

  async createNote(connection, input) {
    const c = creds(connection)
    const record: Record<string, unknown> = { subject: input.title.slice(0, 200), notetext: input.body.slice(0, 30_000), description: input.body.slice(0, 30_000) }
    if (input.contact) record[c.parentField] = input.contact.externalId
    const { data } = await crmFetch<RecordResponse>('fireberry', `${BASE}/api/record/${c.noteType}`, { method: 'POST', headers: c.headers, body: JSON.stringify(record) })
    const id = idOf((data?.data?.Record as Record<string, unknown>) || data?.data, c.noteType)
    if (!id) throw new CrmError('API', 'Fireberry did not return a note id', 'fireberry')
    return { externalId: id }
  },

  async createTask(connection, input) {
    const c = creds(connection)
    const record: Record<string, unknown> = { subject: input.title.slice(0, 200), description: (input.body || '').slice(0, 30_000) }
    if (input.dueAt) record.scheduledend = new Date(input.dueAt).toISOString()
    if (input.contact) record[c.parentField] = input.contact.externalId
    const { data } = await crmFetch<RecordResponse>('fireberry', `${BASE}/api/record/${c.taskType}`, { method: 'POST', headers: c.headers, body: JSON.stringify(record) })
    const id = idOf((data?.data?.Record as Record<string, unknown>) || data?.data, c.taskType)
    if (!id) throw new CrmError('API', 'Fireberry did not return a task id', 'fireberry')
    return { externalId: id }
  },
}
