export type AdminRoleId =
  | 'super_admin'
  | 'system_admin'
  | 'business_manager'
  | 'support'
  | 'content_manager'
  | 'agency_admin'
  | 'advisor'
  | 'operations_user'
  | 'viewer'

export type AdminPermissionId =
  | 'view_admin'
  | 'view_users'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_agencies'
  | 'manage_plans'
  | 'manage_subscriptions'
  | 'manage_landing_page'
  | 'manage_templates'
  | 'upload_returns_files'
  | 'view_audit_logs'
  | 'manage_system_settings'
  | 'manage_leads'
  | 'manage_support'
  | 'manage_email_templates'
  | 'view_reports'

export type AdminUserStatus =
  | 'pending_approval'
  | 'active'
  | 'blocked'
  | 'suspended'
  | 'trial'
  | 'expired'
  | 'archived'

export type SubscriptionStatus =
  | 'trial_pending'
  | 'trial_active'
  | 'active'
  | 'expired'
  | 'blocked'
  | 'cancelled'

export type LandingSectionType =
  | 'hero'
  | 'benefits'
  | 'audience'
  | 'how_it_works'
  | 'features'
  | 'plans'
  | 'testimonials'
  | 'faq'
  | 'contact'
  | 'cta'
  | 'footer'

export type LandingSectionDraft = {
  id: string
  type: LandingSectionType
  title: string
  text: string
  imageUrl?: string
  icon?: string
  primaryButtonLabel?: string
  primaryButtonHref?: string
  secondaryButtonLabel?: string
  secondaryButtonHref?: string
  backgroundColor?: string
  sortOrder: number
  active: boolean
  desktopVisible: boolean
  mobileVisible: boolean
}

export type LandingPageDraft = {
  status: 'draft' | 'published' | 'archived'
  title: string
  metaDescription: string
  slug: string
  canonicalUrl?: string
  openGraphImage?: string
  sections: LandingSectionDraft[]
}

export type RegistrationSettings = {
  registrationOpen: boolean
  manualApprovalRequired: boolean
  defaultTrialDays: number
  allowIndependentAdvisor: boolean
  allowAgencyManager: boolean
  allowAgencyEmployeeJoin: boolean
  requireStrongPassword: boolean
  requireTermsApproval: boolean
  pendingApprovalMessage: string
}

export type PlanFeatureKey =
  | 'pdfExport'
  | 'excelExport'
  | 'simulators'
  | 'portfolioAnalysis'
  | 'advancedTemplates'
  | 'ai'
  | 'extendedSupport'
  | 'customBranding'

export type SubscriptionPlanDraft = {
  id: string
  name: string
  shortDescription: string
  monthlyPrice: number
  annualPrice: number
  includedUsers: number
  monthlyMeetings: number
  clientLimit: number
  features: Record<PlanFeatureKey, boolean>
  status: 'draft' | 'active' | 'hidden' | 'archived'
}

export type EmailTemplateDraft = {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  active: boolean
}

export type DataImportKind =
  | 'gemel_returns'
  | 'pension_returns'
  | 'hishtalmut_returns'
  | 'policy_returns'
  | 'management_fees'
  | 'institution_codes'
  | 'investment_tracks'
  | 'deposit_accounts'
  | 'service_centers'
  | 'agent_links'
  | 'general_forms'

export type AdminAuditAction =
  | 'admin_login'
  | 'user_approved'
  | 'user_blocked'
  | 'role_changed'
  | 'permissions_changed'
  | 'agency_changed'
  | 'plan_changed'
  | 'subscription_changed'
  | 'returns_file_uploaded'
  | 'template_changed'
  | 'landing_page_published'
  | 'system_settings_changed'

export type AdminInfrastructureSnapshot = {
  roles: Array<{
    id: AdminRoleId
    label: string
    description: string
    permissions: AdminPermissionId[]
  }>
  permissions: Array<{
    id: AdminPermissionId
    label: string
    description: string
  }>
  plans: SubscriptionPlanDraft[]
  registration: RegistrationSettings
  landingPageDraft: LandingPageDraft
  emailTemplates: EmailTemplateDraft[]
  dataImportKinds: Array<{
    id: DataImportKind
    label: string
    requiredColumns: string[]
    accepts: string[]
  }>
  auditActions: Array<{
    id: AdminAuditAction
    label: string
    sensitive: boolean
  }>
}
