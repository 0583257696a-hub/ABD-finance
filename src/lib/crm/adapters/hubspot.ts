import { CrmError, type CrmAdapter, type CrmConnection } from '../types'
import { crmFetch, splitName } from './http'

/**
 * HubSpot — CRM v3 API with a Private App access token (Settings →
 * Integrations → Private Apps). Required scopes: crm.objects.contacts.read/
 * write, crm.objects.notes.write (or the "sales" note scopes), crm.objects.
 * tasks.write. Contacts are de-duplicated by email (HubSpot enforces unique
 * email). Notes/tasks are associated to the contact via the standard
 * association type ids (note→contact 202, task→contact 204).
 */

const BASE = 'https://api.hubapi.com'
const NOTE_TO_CONTACT = 202
const TASK_TO_CONTACT = 204

function headers(connection: CrmConnection) {
  const token = connection.credentials.accessToken?.trim()
  if (!token) throw new CrmError('NOT_CONFIGURED', 'HubSpot token missing', 'hubspot')
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
}

type HubSpotObject = { id: string; properties?: Record<string, string> }
type SearchResponse = { total?: number; results?: HubSpotObject[] }

function contactUrl(portalId: string | undefined, id: string) {
  return portalId ? `https://app.hubspot.com/contacts/${portalId}/record/0-1/${id}` : undefined
}

export const hubspotAdapter: CrmAdapter = {
  id: 'hubspot',
  name: 'HubSpot',
  authType: 'api_key',
  description: 'אנשי קשר, הערות ומשימות ב-HubSpot CRM דרך Private App token.',
  docsUrl: 'https://developers.hubspot.com/docs/api/private-apps',
  fields: [
    { key: 'accessToken', label: 'Private App Access Token', secret: true, required: true, placeholder: 'pat-eu1-…', help: 'HubSpot → Settings → Integrations → Private Apps → Create. הרשאות: contacts read/write, notes write, tasks write.' },
    { key: 'portalId', label: 'Portal ID (לא חובה)', placeholder: '12345678', help: 'משמש רק לבניית קישורים לרשומות.' },
    { key: 'idNumberProperty', label: 'שם שדה מותאם לת.ז (לא חובה)', placeholder: 'id_number', help: 'אם יצרת ב-HubSpot מאפיין contact מותאם לתעודת זהות — שמו הפנימי. ריק = לא נשלח ת.ז.' },
  ],

  async testConnection(connection) {
    const { data: details } = await crmFetch<{ portalId?: number; uiDomain?: string }>('hubspot', `${BASE}/account-info/v3/details`, { headers: headers(connection) })
    return { accountLabel: details?.portalId ? `HubSpot #${details.portalId}` : 'HubSpot' }
  },

  async findContact(connection, query) {
    const filters: Array<{ propertyName: string; operator: string; value: string }> = []
    if (query.email) filters.push({ propertyName: 'email', operator: 'EQ', value: query.email.trim().toLowerCase() })
    else if (query.phone) filters.push({ propertyName: 'phone', operator: 'EQ', value: query.phone })
    else return null
    const { data } = await crmFetch<SearchResponse>('hubspot', `${BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: headers(connection),
      body: JSON.stringify({ filterGroups: [{ filters }], properties: ['email'], limit: 1 }),
    })
    const hit = data?.results?.[0]
    return hit ? { externalId: hit.id, url: contactUrl(connection.credentials.portalId, hit.id), created: false } : null
  },

  async upsertContact(connection, input) {
    const { firstName, lastName } = input.firstName || input.lastName ? { firstName: input.firstName || '', lastName: input.lastName || '' } : splitName(input.fullName)
    const properties: Record<string, string> = { firstname: firstName, lastname: lastName }
    if (input.email) properties.email = input.email.trim().toLowerCase()
    if (input.phone) properties.phone = input.phone
    // ID number has no standard HubSpot property; advisors can create a custom
    // property named `id_number` — sent only when configured to avoid a 400.
    if (input.idNumber && connection.credentials.idNumberProperty) properties[connection.credentials.idNumberProperty] = input.idNumber

    const existing = await this.findContact(connection, { email: input.email, phone: input.phone })
    if (existing) {
      await crmFetch<HubSpotObject>('hubspot', `${BASE}/crm/v3/objects/contacts/${existing.externalId}`, { method: 'PATCH', headers: headers(connection), body: JSON.stringify({ properties }) })
      return { ...existing, created: false }
    }
    const { data } = await crmFetch<HubSpotObject>('hubspot', `${BASE}/crm/v3/objects/contacts`, { method: 'POST', headers: headers(connection), body: JSON.stringify({ properties }) })
    if (!data?.id) throw new CrmError('API', 'HubSpot did not return a contact id', 'hubspot')
    return { externalId: data.id, url: contactUrl(connection.credentials.portalId, data.id), created: true }
  },

  async createNote(connection, input) {
    const body = {
      properties: { hs_timestamp: new Date(input.occurredAt).toISOString(), hs_note_body: `${input.title}\n\n${input.body}`.slice(0, 65_000) },
      associations: input.contact ? [{ to: { id: input.contact.externalId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_CONTACT }] }] : [],
    }
    const { data } = await crmFetch<HubSpotObject>('hubspot', `${BASE}/crm/v3/objects/notes`, { method: 'POST', headers: headers(connection), body: JSON.stringify(body) })
    if (!data?.id) throw new CrmError('API', 'HubSpot did not return a note id', 'hubspot')
    return { externalId: data.id }
  },

  async createTask(connection, input) {
    const body = {
      properties: {
        hs_timestamp: (input.dueAt ? new Date(input.dueAt) : new Date(Date.now() + 7 * 86_400_000)).toISOString(),
        hs_task_subject: input.title.slice(0, 250),
        hs_task_body: (input.body || '').slice(0, 65_000),
        hs_task_status: 'NOT_STARTED',
        hs_task_priority: 'MEDIUM',
        hs_task_type: 'TODO',
      },
      associations: input.contact ? [{ to: { id: input.contact.externalId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: TASK_TO_CONTACT }] }] : [],
    }
    const { data } = await crmFetch<HubSpotObject>('hubspot', `${BASE}/crm/v3/objects/tasks`, { method: 'POST', headers: headers(connection), body: JSON.stringify(body) })
    if (!data?.id) throw new CrmError('API', 'HubSpot did not return a task id', 'hubspot')
    return { externalId: data.id }
  },
}
