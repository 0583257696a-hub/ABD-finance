'use client'

import { useMemo, useState } from 'react'
import { ScrollText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchField } from '@/components/ui/SearchField'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Surface } from '@/components/ui/Surface'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDelete, formatDate, useAdminRequest, type AuditEvent } from './shared'

/**
 * Security tab: the SERVER-side audit log (audit_events). Every admin
 * mutation and every privacy/registration/login-relevant event lands here —
 * not an in-memory list that vanished on refresh, which is what the old
 * panel showed.
 */

const ACTION_LABEL: Record<string, string> = {
  'admin.user.approved': 'אישור משתמש',
  'admin.user.blocked': 'חסימת משתמש',
  'admin.user.unblocked': 'הסרת חסימה',
  'admin.user.trial_extended': 'הארכת ניסיון',
  'admin.user.subscription_changed': 'שינוי מנוי',
  'admin.user.password_reset': 'איפוס סיסמה ע"י מנהל',
  'admin.user.role_changed': 'שינוי הרשאת מנהל',
  'admin.user.deleted': 'מחיקת משתמש (מלאה)',
  'admin.agency.created': 'יצירת סוכנות',
  'admin.agency.updated': 'עדכון סוכנות',
  'admin.agency.deleted': 'מחיקת סוכנות',
  'admin.agency.member_assigned': 'שיוך לסוכנות',
  'admin.agency.member_removed': 'הסרה מסוכנות',
  'admin.support.updated': 'טיפול בפנייה',
  'admin.support.deleted': 'מחיקת פנייה',
  'admin.infrastructure_saved': 'שמירת תוכניות/הגדרות',
  'admin.audit.cleared': 'ניקוי לוג',
  'privacy.deletion_requested': 'בקשת מחיקת חשבון',
  'privacy.profile_updated': 'עדכון פרופיל',
  'registration.created': 'הרשמה חדשה',
}

function tone(action: string): 'destructive' | 'warning' | 'success' | 'neutral' | 'accent' {
  if (/deleted|blocked|cleared|fail|denied|error/.test(action)) return 'destructive'
  if (/password|role|subscription/.test(action)) return 'warning'
  if (/approved|created|unblocked|assigned/.test(action)) return 'success'
  if (action.startsWith('admin.')) return 'accent'
  return 'neutral'
}

function metadataSummary(json: string | null): string {
  if (!json) return ''
  try {
    const data = JSON.parse(json) as Record<string, unknown>
    return Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length))
      .slice(0, 5)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
      .join(' · ')
  } catch { return '' }
}

export function AdminSecurity({ events, onChanged }: { events: AuditEvent[]; onChanged: () => void | Promise<void> }) {
  const { request, busy } = useAdminRequest()
  const [search, setSearch] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter(event => [event.actor_email, event.action, ACTION_LABEL[event.action], event.target_id, event.metadata_json].some(value => String(value || '').toLowerCase().includes(q)))
  }, [events, search])

  const columns: DataTableColumn<AuditEvent>[] = [
    { key: 'created_at', label: 'מועד', width: 150, sortValue: row => row.created_at, render: row => formatDate(row.created_at, true) },
    { key: 'action', label: 'פעולה', width: 200, sortValue: row => ACTION_LABEL[row.action] || row.action, render: row => <StatusBadge label={ACTION_LABEL[row.action] || row.action} tone={tone(row.action)} /> },
    { key: 'actor_email', label: 'מבצע', width: 200, sortValue: row => row.actor_email || '', render: row => <span style={{ overflowWrap: 'anywhere' }}>{row.actor_email || 'מערכת'}</span> },
    { key: 'details', label: 'פרטים', width: 380, render: row => <span style={{ color: 'var(--text-muted)', fontSize: 12.5, overflowWrap: 'anywhere' }}>{metadataSummary(row.metadata_json) || row.target_id || '—'}</span> },
  ]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 260px', maxWidth: 420 }}><SearchField value={search} onChange={setSearch} placeholder="חיפוש לפי פעולה, מבצע, יעד…" /></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{events.length} רשומות אחרונות</span>
          <Button variant="ghost" size="sm" disabled={!events.length || busy} onClick={() => setConfirmClear(true)}><Trash2 size={14} /> ניקוי לוג</Button>
        </div>
      </div>

      {filtered.length ? (
        <DataTable<AuditEvent> columns={columns} rows={filtered} rowKey={row => row.id} initialSort={{ key: 'created_at', direction: 'desc' }} storageKey="admin_audit_table_v1" />
      ) : (
        <Surface style={{ padding: 24 }}><EmptyState icon={<ScrollText size={28} />} title="אין רשומות בלוג" description="פעולות ניהול (אישור, חסימה, מחיקה, שינוי מנוי, שיוך לסוכנות, טיפול בפניות) נרשמות כאן אוטומטית." /></Surface>
      )}

      <ConfirmDelete
        open={confirmClear}
        title="לנקות את לוג הפעילות?"
        description={`כל ${events.length} הרשומות יימחקו לצמיתות. הפעולה עצמה תירשם כרשומה הראשונה בלוג החדש.`}
        confirmLabel="נקה לוג"
        busy={busy}
        onConfirm={async () => { const result = await request('/api/admin/audit', { method: 'DELETE' }, 'הלוג נוקה'); if (result) { setConfirmClear(false); await onChanged() } }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
