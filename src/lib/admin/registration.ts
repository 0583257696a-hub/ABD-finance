export type RegistrationUserType = 'independent_advisor' | 'agency_manager' | 'agency_employee'

export type RegistrationStatus = 'pending_approval' | 'active' | 'blocked'

export type RegistrationProfile = {
  status: RegistrationStatus
  userType: RegistrationUserType
  phone: string
  roleTitle: string
  planId: string
  subscriptionStatus: string
  submittedAt: string
  approvedAt?: string
  approvedBy?: string
  blockedAt?: string
  blockedBy?: string
  trialExtendedAt?: string
  trialEndsAt?: string
  business?: {
    name: string
    id: string
    address: string
    email: string
    phone: string
    field: string
    estimatedEmployees: string
  }
  agencyJoin?: {
    agencyName: string
    managerEmail: string
    message: string
  }
  terms?: {
    acceptedTermsAt: string
    acceptedPrivacyAt: string
    termsVersion?: string
    privacyVersion?: string
    source?: string
  }
}

export type RegistrationSettings = {
  registration?: RegistrationProfile
  subscription?: {
    status: string
    planId: string
    trialDays: number
    trialStartedAt?: string
    trialExtendedAt?: string
    trialEndsAt?: string
  }
  [key: string]: unknown
}

export function normalizeRegistrationEmail(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function getRegistrationSettings(value: unknown): RegistrationSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as RegistrationSettings
}

export function isApprovedRegistration(settingsValue: unknown) {
  const settings = getRegistrationSettings(settingsValue)
  const status = settings.registration?.status
  return !status || status === 'active'
}

export function getRegistrationStatusLabel(status?: string) {
  if (status === 'active') return 'מאושר'
  if (status === 'blocked') return 'חסום'
  return 'ממתין לאישור'
}

export function getUserTypeLabel(type?: string) {
  if (type === 'agency_manager') return 'מנהל סוכנות'
  if (type === 'agency_employee') return 'עובד סוכנות'
  return 'יועץ עצמאי'
}

export function mergeRegistrationSettings(
  currentValue: unknown,
  registrationPatch: Partial<RegistrationProfile>,
  subscriptionPatch?: Partial<NonNullable<RegistrationSettings['subscription']>>,
): RegistrationSettings {
  const current = getRegistrationSettings(currentValue)
  const currentRegistration = current.registration
  const nextRegistration = currentRegistration
    ? { ...currentRegistration, ...registrationPatch }
    : registrationPatch

  return {
    ...current,
    registration: nextRegistration as RegistrationProfile,
    subscription: {
      status: current.subscription?.status || 'trial_pending',
      planId: current.subscription?.planId || currentRegistration?.planId || 'trial',
      trialDays: current.subscription?.trialDays || 14,
      ...subscriptionPatch,
    },
  }
}
