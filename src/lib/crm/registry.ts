import { hubspotAdapter } from './adapters/hubspot'
import { fireberryAdapter } from './adapters/fireberry'
import { webhookAdapter } from './adapters/webhook'
import { listCrmConnections } from './connections'
import { CrmError, DEFAULT_CRM_SETTINGS, type CrmAdapter, type CrmProviderId, type CrmStatus } from './types'

/**
 * Provider registry. Adding a CRM = write an adapter implementing CrmAdapter
 * and list it here — settings UI, API routes and sync all pick it up.
 */
const ADAPTERS: Record<CrmProviderId, CrmAdapter> = {
  hubspot: hubspotAdapter,
  fireberry: fireberryAdapter,
  webhook: webhookAdapter,
}

export const CRM_PROVIDER_IDS = Object.keys(ADAPTERS) as CrmProviderId[]

export function isCrmProviderId(value: unknown): value is CrmProviderId {
  return typeof value === 'string' && value in ADAPTERS
}

export function getCrmAdapter(providerId: CrmProviderId): CrmAdapter {
  const adapter = ADAPTERS[providerId]
  if (!adapter) throw new CrmError('NOT_CONFIGURED', `Unknown CRM provider ${providerId}`, providerId)
  return adapter
}

export function listCrmAdapters(): CrmAdapter[] {
  return Object.values(ADAPTERS)
}

/** Client-safe status for every provider (never includes credentials). */
export async function getCrmStatuses(userEmail: string): Promise<CrmStatus[]> {
  const connections = await listCrmConnections(userEmail)
  return listCrmAdapters().map(adapter => {
    const connection = connections.find(item => item.provider === adapter.id)
    return {
      provider: adapter.id,
      name: adapter.name,
      description: adapter.description,
      configured: true,
      connected: Boolean(connection),
      accountLabel: connection?.account_label || '',
      status: connection?.status ?? null,
      lastError: connection?.last_error ?? null,
      lastSyncAt: connection?.last_sync_at ?? null,
      settings: connection?.settings || { ...DEFAULT_CRM_SETTINGS },
      fields: adapter.fields,
      docsUrl: adapter.docsUrl,
    }
  })
}
