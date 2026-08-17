'use client'

import { useCallback, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'

/**
 * Shared types + small building blocks for the admin panel tabs. Every tab
 * fetches its own data through `useAdminRequest` (uniform error toasts) and
 * deletes through `ConfirmDelete` (uniform "are you sure" dialog), so the
 * behaviour is identical across users / agencies / plans / tickets / log.
 */

// ---- Types mirrored from the API ------------------------------------------

export type AdminUser = {
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

export type AgencyMember = { userId: string; email: string; name: string; memberRole: string; status: string }

export type Agency = {
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
  members: AgencyMember[]
}

export type Plan = {
  id: string
  name: string
  shortDescription?: string
  status: string
  monthlyPrice: number
  annualPrice?: number
  includedUsers: number
  monthlyMeetings: number
  clientLimit?: number
  features?: Record<string, boolean>
}

export type RegistrationRules = {
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

export type Infrastructure = { plans: Plan[]; registration: RegistrationRules } & Record<string, unknown>

export type Ticket = {
  id: string
  user_email: string
  user_name: string
  subject: string
  message: string
  category: string
  status: 'open' | 'in_progress' | 'closed'
  priority: string
  internal_notes: string
  replies_json: string
  page_url: string
  created_at: string
  updated_at: string
  closed_at: string | null
}

export type AuditEvent = { id: string; actor_email: string | null; action: string; target_id: string | null; metadata_json: string | null; created_at: string }

export type Stats = {
  usersTotal: number; usersActive: number; usersPending: number; usersBlocked: number; admins: number
  agencies: number
  meetingsTotal: number; meetingsThisMonth: number
  summariesTotal: number; summariesThisMonth: number
  formsSent: number; formsSubmitted: number
  ticketsOpen: number; ticketsInProgress: number; ticketsClosed: number
  auditFailures24h: number
}

// ---- Labels ---------------------------------------------------------------

export const USER_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'accent' }> = {
  active: { label: 'פעיל', tone: 'success' },
  pending_approval: { label: 'ממתין לאישור', tone: 'warning' },
  blocked: { label: 'חסום', tone: 'destructive' },
}

export const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: 'פעיל',
  trial_active: 'ניסיון פעיל',
  trial_pending: 'ניסיון — ממתין',
  trial: 'ניסיון',
  expired: 'פג תוקף',
  blocked: 'חסום',
  suspended: 'מוקפא',
  cancelled: 'בוטל',
}

export const USER_TYPE: Record<string, string> = {
  independent_advisor: 'יועץ עצמאי',
  agency_manager: 'מנהל סוכנות',
  agency_employee: 'עובד סוכנות',
  legacy: 'משתמש מערכת',
}

export const AGENCY_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'accent' }> = {
  active: { label: 'פעילה', tone: 'success' },
  trial: { label: 'בתקופת ניסיון', tone: 'accent' },
  suspended: { label: 'מוקפאת', tone: 'warning' },
  archived: { label: 'ארכיון', tone: 'neutral' },
}

export const TICKET_STATUS: Record<Ticket['status'], { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'accent' }> = {
  open: { label: 'פתוחה', tone: 'warning' },
  in_progress: { label: 'בטיפול', tone: 'accent' },
  closed: { label: 'סגורה', tone: 'neutral' },
}

export const TICKET_PRIORITY: Record<string, string> = { low: 'נמוכה', normal: 'רגילה', high: 'גבוהה', urgent: 'דחופה' }
export const TICKET_CATEGORY: Record<string, string> = { general: 'כללי', bug: 'תקלה', billing: 'חיוב ומנוי', feature: 'בקשת יכולת', access: 'גישה והרשאות' }

export const PLAN_FEATURES: Array<{ key: string; label: string }> = [
  { key: 'pdfExport', label: 'ייצוא PDF' },
  { key: 'excelExport', label: 'ייצוא Excel' },
  { key: 'simulators', label: 'סימולטורים ומחשבונים' },
  { key: 'portfolioAnalysis', label: 'ניתוח תיק' },
  { key: 'advancedTemplates', label: 'תבניות מתקדמות' },
  { key: 'customBranding', label: 'מיתוג מותאם' },
  { key: 'extendedSupport', label: 'תמיכה מורחבת' },
  { key: 'ai', label: 'סיכום AI' },
]

export function formatDate(iso?: string | null, withTime = false): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return withTime
    ? date.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function planName(plans: Plan[] | undefined, id: string): string {
  return plans?.find(plan => plan.id === id)?.name || (id === 'legacy' ? 'ללא תוכנית' : id || '—')
}

// ---- Fetch helper ---------------------------------------------------------

export function useAdminRequest() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const request = useCallback(async <T = Record<string, unknown>>(url: string, init?: RequestInit, successMessage?: string): Promise<T | null> => {
    setBusy(true)
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      })
      const data = await response.json().catch(() => ({})) as T & { error?: string }
      if (!response.ok) {
        toast(data?.error || 'הפעולה נכשלה', 'error')
        return null
      }
      if (successMessage) toast(successMessage, 'success')
      return data
    } catch {
      toast('שגיאת רשת — נסה שוב', 'error')
      return null
    } finally {
      setBusy(false)
    }
  }, [toast])
  return { request, busy }
}

// ---- Confirm delete ---------------------------------------------------------

/**
 * Uniform delete confirmation. Renders the Dialog while `target` is set;
 * caller passes what to say and what to do. Always destructive styling.
 */
export function ConfirmDelete({ open, title, description, confirmLabel = 'מחק', busy, onConfirm, onCancel }: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      confirmLabel={busy ? 'מוחק…' : confirmLabel}
      destructive
      onConfirm={onConfirm}
      onCancel={() => { if (!busy) onCancel() }}
    />
  )
}

// ---- Small layout pieces ---------------------------------------------------

export function StatusPill({ status, map }: { status: string; map: Record<string, { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'accent' }> }) {
  const entry = map[status] || { label: status || '—', tone: 'neutral' as const }
  return <StatusBadge label={entry.label} tone={entry.tone} />
}

export function KpiTile({ label, value, note, tone = 'neutral' }: { label: string; value: number | string; note?: string; tone?: 'neutral' | 'success' | 'warning' | 'destructive' | 'accent' }) {
  const color = tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning, #B45309)' : tone === 'destructive' ? 'var(--destructive)' : tone === 'accent' ? 'var(--abd-accent)' : 'var(--text-heading)'
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'grid', gap: 4, minWidth: 0 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      <strong style={{ color, fontSize: 26, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      {note && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{note}</span>}
    </div>
  )
}

export function Field({ label, children, hint, style }: { label: string; children: ReactNode; hint?: string; style?: CSSProperties }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', minWidth: 0, ...style }}>
      <span>{label}</span>
      {children}
      {hint && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>{hint}</span>}
    </label>
  )
}

export const inputStyle: CSSProperties = {
  minHeight: 40,
  border: '1px solid var(--separator-strong, var(--separator))',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  fontFamily: 'inherit',
  fontSize: 14,
  background: 'var(--bg-surface)',
  color: 'var(--text-heading)',
  width: '100%',
  fontWeight: 400,
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--separator)', fontSize: 13.5 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-heading)', fontWeight: 600, textAlign: 'start', minWidth: 0, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (next: boolean) => void; label: string; hint?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: 'var(--text-heading)' }}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
      <span style={{ display: 'grid', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {hint && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{hint}</span>}
      </span>
    </label>
  )
}

export function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ color: 'var(--text-heading)', fontSize: 16, fontWeight: 700, margin: 0 }}>{children}</h2>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}

export const actionsCellStyle: CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-start' }
