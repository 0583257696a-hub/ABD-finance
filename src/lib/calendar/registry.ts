import { googleCalendarAdapter } from './adapters/google'
import { outlookAdapter } from './adapters/outlook'
import { calendlyAdapter } from './adapters/calendly'
import {
  CalendarError,
  describeCalendarError,
  type CalendarAdapter,
  type CalendarProviderId,
  type CreateEventInput,
  type ProviderStatus,
  type UnifiedMeeting,
} from './types'

/**
 * The unified calendar API. Everything above this line is provider-agnostic:
 *
 *   getUpcomingMeetings() / createMeeting() / cancelMeeting() / getProviderStatuses()
 *
 * Adding a provider means adding an adapter here — no call site changes.
 */

const ADAPTERS: CalendarAdapter[] = [googleCalendarAdapter, outlookAdapter, calendlyAdapter]

export function getAdapter(providerId: CalendarProviderId): CalendarAdapter {
  const adapter = ADAPTERS.find(candidate => candidate.id === providerId)
  if (!adapter) throw new CalendarError('NOT_CONFIGURED', `Unknown provider ${providerId}.`)
  return adapter
}

export function listAdapters(): CalendarAdapter[] {
  return ADAPTERS
}

/** Client-safe provider status list — configured/connected flags + capabilities, never tokens. */
export async function getProviderStatuses(userEmail: string): Promise<ProviderStatus[]> {
  return await Promise.all(ADAPTERS.map(async adapter => {
    const configured = await adapter.isConfigured()
    return {
      id: adapter.id,
      name: adapter.name,
      configured,
      connected: configured ? await adapter.isConnected(userEmail).catch(() => false) : false,
      capabilities: adapter.capabilities,
    }
  }))
}

export type ProviderMeetingsResult = {
  provider: CalendarProviderId
  providerName: string
  meetings: UnifiedMeeting[]
  /** Present when this provider failed — the UI shows message + action instead of raw errors. */
  error?: { code: string; message: string; action: string; actionLabel: string }
}

function toUiError(error: unknown, adapter: CalendarAdapter) {
  const code = error instanceof CalendarError ? error.code : 'PROVIDER_UNAVAILABLE'
  const described = describeCalendarError(code, adapter.name)
  return { code, message: described.message, action: described.hint.action, actionLabel: described.hint.label }
}

/**
 * Upcoming meetings across every CONNECTED provider, merged and sorted.
 * A provider that fails degrades to an error entry — one broken integration
 * never blocks the others.
 */
export async function getUpcomingMeetings(userEmail: string, options?: { limit?: number }): Promise<ProviderMeetingsResult[]> {
  const results: ProviderMeetingsResult[] = []

  for (const adapter of ADAPTERS) {
    if (!(await adapter.isConfigured())) continue
    const connected = await adapter.isConnected(userEmail).catch(() => false)
    if (!connected) continue

    try {
      const meetings = await adapter.listUpcoming(userEmail, { limit: options?.limit })
      results.push({
        provider: adapter.id,
        providerName: adapter.name,
        meetings: meetings.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      })
    } catch (error) {
      results.push({ provider: adapter.id, providerName: adapter.name, meetings: [], error: toUiError(error, adapter) })
    }
  }

  return results
}

export async function createMeeting(userEmail: string, providerId: CalendarProviderId, input: CreateEventInput): Promise<UnifiedMeeting> {
  const adapter = getAdapter(providerId)
  if (!adapter.capabilities.createEvent || !adapter.createEvent) {
    throw new CalendarError('NOT_SUPPORTED', `${adapter.name} does not support creating events through its API.`, providerId)
  }
  return await adapter.createEvent(userEmail, input)
}

export async function cancelMeeting(userEmail: string, providerId: CalendarProviderId, externalEventId: string): Promise<void> {
  const adapter = getAdapter(providerId)
  if (!adapter.capabilities.cancelEvent || !adapter.cancelEvent) {
    throw new CalendarError('NOT_SUPPORTED', `${adapter.name} does not support cancelling events.`, providerId)
  }
  await adapter.cancelEvent(userEmail, externalEventId)
}

export { describeCalendarError, CalendarError }
