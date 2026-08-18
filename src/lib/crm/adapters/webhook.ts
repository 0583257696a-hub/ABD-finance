import { CrmError, type CrmAdapter, type CrmConnection } from '../types'
import { crmFetch } from './http'

/**
 * Generic outbound webhook — the universal adapter. Every event is one signed
 * JSON POST to a URL the advisor/agency controls: Zapier, Make, n8n, Power
 * Automate, monday.com, Salesforce Flow, Zoho, Priority, a custom endpoint —
 * anything that can receive HTTP. This is how a CRM without a native adapter
 * gets connected in minutes, and how an agency's IT keeps full control over
 * mapping.
 *
 * Contract (documented in SETUP-GUIDE.md):
 *   POST <url>
 *   Headers: content-type: application/json
 *            x-abd-event: contact.upsert | meeting.note | task.create | connection.test
 *            x-abd-timestamp: <unix ms>
 *            x-abd-signature: sha256=<hex HMAC-SHA256(secret, timestamp + "." + body)>
 *   Body:    { event, sentAt, advisorEmail, data: {...} }
 *   Response (optional): { id: "<external id>", url: "<record url>" } — stored
 *            as the external reference so tasks/notes can point at the contact.
 *
 * Verify on the receiving side by recomputing the HMAC — the timestamp is in
 * the signed payload, so replays outside a short window can be rejected.
 */

async function sign(secret: string, timestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`))
  return `sha256=${Array.from(new Uint8Array(mac)).map(byte => byte.toString(16).padStart(2, '0')).join('')}`
}

type WebhookReply = { id?: string | number; url?: string; ok?: boolean }

async function post(connection: CrmConnection, event: string, data: Record<string, unknown>): Promise<WebhookReply> {
  const url = connection.credentials.url?.trim()
  // https only — except plain-http localhost in development, for testing receivers.
  const devLocal = process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url || '')
  if (!url || (!/^https:\/\//i.test(url) && !devLocal)) throw new CrmError('VALIDATION', 'כתובת ה-Webhook חייבת להתחיל ב-https://', 'webhook')
  const secret = connection.credentials.secret?.trim() || ''
  const timestamp = String(Date.now())
  const body = JSON.stringify({ event, sentAt: new Date().toISOString(), advisorEmail: connection.user_email, data })
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-abd-event': event, 'x-abd-timestamp': timestamp }
  if (secret) headers['x-abd-signature'] = await sign(secret, timestamp, body)
  if (connection.credentials.authHeader?.trim()) headers.authorization = connection.credentials.authHeader.trim()
  const { data: reply } = await crmFetch<WebhookReply>('webhook', url, { method: 'POST', headers, body })
  return reply || {}
}

export const webhookAdapter: CrmAdapter = {
  id: 'webhook',
  name: 'Webhook כללי (Zapier / Make / monday / מותאם)',
  authType: 'webhook_secret',
  description: 'שולח כל אירוע (לקוח, סיכום, משימה) כ-JSON חתום לכתובת שתבחרו — מתאים לכל CRM דרך Zapier/Make/n8n או API פנימי.',
  fields: [
    { key: 'url', label: 'Webhook URL (https)', required: true, placeholder: 'https://hooks.zapier.com/hooks/catch/…' },
    { key: 'secret', label: 'Signing secret (מומלץ)', secret: true, help: 'מחרוזת אקראית. הצד המקבל מאמת HMAC-SHA256 בכותרת x-abd-signature.' },
    { key: 'authHeader', label: 'Authorization header (לא חובה)', secret: true, placeholder: 'Bearer …', help: 'אם ה-endpoint דורש כותרת Authorization קבועה.' },
  ],

  async testConnection(connection) {
    await post(connection, 'connection.test', { message: 'Smart Meeting connection test' })
    let host = 'webhook'
    try { host = new URL(connection.credentials.url).host } catch { /* label only */ }
    return { accountLabel: host }
  },

  async findContact() {
    // Webhooks are one-way; de-duplication is the receiver's job (upsert by email/id).
    return null
  },

  async upsertContact(connection, input) {
    const reply = await post(connection, 'contact.upsert', { ...input })
    return { externalId: reply.id ? String(reply.id) : `webhook:${input.email || input.idNumber || input.fullName}`, url: reply.url, created: false }
  },

  async createNote(connection, input) {
    const reply = await post(connection, 'meeting.note', { ...input, contactExternalId: input.contact?.externalId || null })
    return { externalId: reply.id ? String(reply.id) : `webhook:note:${input.summaryId || input.meetingId || Date.now()}`, url: reply.url }
  },

  async createTask(connection, input) {
    const reply = await post(connection, 'task.create', { ...input, contactExternalId: input.contact?.externalId || null })
    return { externalId: reply.id ? String(reply.id) : `webhook:task:${input.followUpId || Date.now()}`, url: reply.url }
  },
}
