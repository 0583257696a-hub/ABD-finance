import { adminInfrastructureDefaults } from './defaults'
import type { AdminInfrastructureSnapshot } from './types'
import { getD1AdminSetting, setD1AdminSetting } from '@/lib/system-db'

/**
 * The stored admin "infrastructure" document (plans + registration settings).
 * Single accessor used by BOTH the admin panel and /api/register, so the
 * registration rules the admin sets are the ones actually enforced.
 * Falls back to code defaults when nothing is stored / D1 is absent.
 */
export const ADMIN_INFRASTRUCTURE_KEY = 'admin_infrastructure'

export async function getAdminInfrastructure(): Promise<{ infrastructure: AdminInfrastructureSnapshot; stored: boolean }> {
  const stored = await getD1AdminSetting<Partial<AdminInfrastructureSnapshot>>(ADMIN_INFRASTRUCTURE_KEY).catch(() => null)
  if (!stored) return { infrastructure: adminInfrastructureDefaults, stored: false }
  return {
    infrastructure: {
      ...adminInfrastructureDefaults,
      ...stored,
      plans: Array.isArray(stored.plans) && stored.plans.length ? stored.plans : adminInfrastructureDefaults.plans,
      registration: { ...adminInfrastructureDefaults.registration, ...(stored.registration || {}) },
    },
    stored: true,
  }
}

export async function saveAdminInfrastructure(next: AdminInfrastructureSnapshot): Promise<boolean> {
  return setD1AdminSetting(ADMIN_INFRASTRUCTURE_KEY, next)
}

/** Registration rules for /api/register — stored settings, else defaults. */
export async function getRegistrationRules() {
  return (await getAdminInfrastructure()).infrastructure.registration
}
