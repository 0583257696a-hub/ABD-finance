'use client'

import { useMemo, useState } from 'react'
import { Trash2, ShieldCheck, ShieldOff, KeyRound, Check, Ban, RotateCcw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { SearchField } from '@/components/ui/SearchField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Surface } from '@/components/ui/Surface'
import { Users } from 'lucide-react'
import {
  ConfirmDelete, Field, KV, StatusPill, inputStyle, formatDate, planName, useAdminRequest,
  USER_STATUS, USER_TYPE, SUBSCRIPTION_STATUS,
  type AdminUser, type Agency, type Plan,
} from './shared'

/**
 * Users tab. One table, one search, one status filter. Clicking a row opens
 * the user sheet with every action grouped: approval/blocking, admin role,
 * subscription, agency membership, password reset, and (at the bottom, red)
 * full deletion behind a confirm dialog that spells out what gets erased.
 * No inline per-keystroke saves — the subscription form saves on a button.
 */

type Filter = 'all' | 'pending_approval' | 'active' | 'blocked' | 'admins'

export function AdminUsers({ users, agencies, plans, currentAdminEmail, mode, onChanged }: {
  users: AdminUser[]
  agencies: Agency[]
  plans: Plan[]
  currentAdminEmail: string
  mode: 'd1' | 'static-auth'
  onChanged: () => void | Promise<void>
}) {
  const { request, busy } = useAdminRequest()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<AdminUser | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(user => {
      if (filter === 'admins' && user.role !== 'admin') return false
      if (filter !== 'all' && filter !== 'admins' && user.status !== filter) return false
      if (!q) return true
      return [user.name, user.email, user.phone, user.agencyName, user.registeredBusinessName, user.requestedAgencyName, USER_TYPE[user.userType], planName(plans, user.planId)]
        .some(value => String(value || '').toLowerCase().includes(q))
    })
  }, [users, filter, search, plans])

  const counts = useMemo(() => ({
    all: users.length,
    pending_approval: users.filter(user => user.status === 'pending_approval').length,
    active: users.filter(user => user.status === 'active').length,
    blocked: users.filter(user => user.status === 'blocked').length,
    admins: users.filter(user => user.role === 'admin').length,
  }), [users])

  const open = openId ? users.find(user => user.id === openId) || null : null

  async function act(user: AdminUser, body: Record<string, unknown>, success: string) {
    const result = await request('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ userId: user.id, ...body }) }, success)
    if (result) await onChanged()
    return Boolean(result)
  }

  async function confirmDelete() {
    if (!toDelete) return
    const result = await request<{ ok: boolean; removed: Record<string, number> }>(`/api/admin/users?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE' })
    if (result?.ok) {
      const parts = Object.entries(result.removed || {}).filter(([, n]) => n > 0).map(([table, n]) => `${TABLE_LABEL[table] || table}: ${n}`)
      setToDelete(null)
      if (openId === toDelete.id) setOpenId(null)
      await onChanged()
      // Surface what was actually erased.
      if (parts.length) window.setTimeout(() => alert(`המשתמש ${toDelete.email} נמחק לצמיתות.\nהוסרו: ${parts.join(' · ')}`), 50)
    }
  }

  const columns: DataTableColumn<AdminUser>[] = [
    { key: 'name', label: 'משתמש', width: 240, sortValue: row => row.name || row.email, render: row => (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {row.name || '—'}
          {row.role === 'admin' && <span title="מנהל מערכת" style={{ color: 'var(--abd-accent)', display: 'inline-flex' }}><ShieldCheck size={14} /></span>}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12.5, overflowWrap: 'anywhere' }}>{row.email}</div>
      </div>
    ) },
    { key: 'status', label: 'סטטוס', width: 130, render: row => <StatusPill status={row.status} map={USER_STATUS} /> },
    { key: 'userType', label: 'סוג', width: 130, sortValue: row => USER_TYPE[row.userType] || row.userType, render: row => USER_TYPE[row.userType] || row.userType },
    { key: 'agencyName', label: 'סוכנות', width: 170, sortValue: row => row.agencyName || '', render: row => row.agencyName
      ? <span>{row.agencyName}<span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · {row.agencyRole === 'manager' ? 'מנהל' : 'עובד'}</span></span>
      : row.userType === 'agency_employee' && row.requestedAgencyName
        ? <span style={{ color: 'var(--text-muted)' }} title="ביקש להצטרף בהרשמה — טרם שויך">ביקש: {row.requestedAgencyName}</span>
        : row.userType === 'agency_manager' && row.registeredBusinessName
          ? <span style={{ color: 'var(--text-muted)' }} title="סוכנות מהטופס — תיווצר באישור">בהמתנה: {row.registeredBusinessName}</span>
          : <span style={{ color: 'var(--text-muted)' }}>עצמאי</span> },
    { key: 'planId', label: 'תוכנית', width: 150, sortValue: row => planName(plans, row.planId), render: row => (
      <div style={{ minWidth: 0 }}>
        <div>{planName(plans, row.planId)}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{SUBSCRIPTION_STATUS[row.subscriptionStatus] || row.subscriptionStatus}</div>
      </div>
    ) },
    { key: 'activity', label: 'פעילות', width: 110, numeric: true, sortValue: row => row.meetingsCount, render: row => <span title="פגישות / סיכומים">{row.meetingsCount} / {row.summariesCount}</span> },
    { key: 'createdAt', label: 'נרשם', width: 110, sortValue: row => row.createdAt, render: row => formatDate(row.createdAt) },
    { key: 'actions', label: '', width: 130, render: row => (
      <div style={{ display: 'flex', gap: 4 }} onClick={event => event.stopPropagation()}>
        {row.status === 'pending_approval' && <Button size="sm" variant="primary" onClick={() => void act(row, { action: 'approve' }, 'המשתמש אושר')} title="אישור"><Check size={14} /></Button>}
        <Button size="sm" variant="ghost" onClick={() => setToDelete(row)} title="מחיקת משתמש" disabled={row.email.toLowerCase() === currentAdminEmail.toLowerCase()}><Trash2 size={14} /></Button>
      </div>
    ) },
  ]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {mode === 'static-auth' && (
        <div style={noticeStyle}>המערכת פועלת ללא מסד נתונים (static-auth). ניהול משתמשים מלא זמין רק כש-D1 מחובר.</div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', maxWidth: 420 }}><SearchField value={search} onChange={setSearch} placeholder="חיפוש לפי שם, מייל, טלפון, סוכנות…" /></div>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `הכל (${counts.all})` },
            { value: 'pending_approval', label: `ממתינים (${counts.pending_approval})` },
            { value: 'active', label: `פעילים (${counts.active})` },
            { value: 'blocked', label: `חסומים (${counts.blocked})` },
            { value: 'admins', label: `מנהלים (${counts.admins})` },
          ]}
        />
      </div>

      {filtered.length ? (
        <DataTable<AdminUser>
          columns={columns}
          rows={filtered}
          rowKey={row => row.id}
          onRowClick={row => setOpenId(row.id)}
          initialSort={{ key: 'createdAt', direction: 'desc' }}
          storageKey="admin_users_table_v3"
        />
      ) : (
        <Surface style={{ padding: 24 }}>
          <EmptyState icon={<Users size={28} />} title="אין משתמשים להצגה" description={search || filter !== 'all' ? 'נסה לשנות את החיפוש או הסינון.' : 'משתמשים חדשים יופיעו כאן לאחר הרשמה.'} />
        </Surface>
      )}

      {open && (
        <UserSheet
          user={open}
          agencies={agencies}
          plans={plans}
          isSelf={open.email.toLowerCase() === currentAdminEmail.toLowerCase()}
          busy={busy}
          onClose={() => setOpenId(null)}
          onAct={(body, success) => act(open, body, success)}
          onAssignAgency={async (agencyId, memberRole) => {
            const result = agencyId
              ? await request('/api/admin/agencies', { method: 'PATCH', body: JSON.stringify({ action: 'assign', id: agencyId, userId: open.id, memberRole }) }, 'השיוך לסוכנות עודכן')
              : await request('/api/admin/agencies', { method: 'PATCH', body: JSON.stringify({ action: 'unassign', userId: open.id }) }, 'המשתמש הוסר מהסוכנות')
            if (result) await onChanged()
          }}
          onDelete={() => setToDelete(open)}
        />
      )}

      <ConfirmDelete
        open={Boolean(toDelete)}
        title={`למחוק את ${toDelete?.name || toDelete?.email}?`}
        description={`מחיקה מלאה ובלתי הפיכה של המשתמש ${toDelete?.email} וכל הנתונים שלו: ${toDelete?.meetingsCount ?? 0} פגישות, ${toDelete?.summariesCount ?? 0} סיכומי פגישה, שאלונים ותבניות, התראות, חיבורי יומן והגדרות. המשתמש לא יוכל להתחבר יותר.`}
        confirmLabel="מחק לצמיתות"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

const TABLE_LABEL: Record<string, string> = {
  users: 'משתמש', meetings: 'פגישות', meeting_summaries: 'סיכומים', client_forms: 'שאלונים', questionnaire_templates: 'תבניות שאלון',
  notifications: 'התראות', calendar_connections: 'חיבורי יומן', agency_members: 'שיוך לסוכנות', password_reset_tokens: 'קישורי איפוס', user_settings: 'הגדרות',
}

function UserSheet({ user, agencies, plans, isSelf, busy, onClose, onAct, onAssignAgency, onDelete }: {
  user: AdminUser
  agencies: Agency[]
  plans: Plan[]
  isSelf: boolean
  busy: boolean
  onClose: () => void
  onAct: (body: Record<string, unknown>, success: string) => Promise<boolean>
  onAssignAgency: (agencyId: string, memberRole: 'manager' | 'employee') => Promise<void>
  onDelete: () => void
}) {
  const [planId, setPlanId] = useState(user.planId === 'legacy' ? (plans[0]?.id || 'trial') : user.planId)
  const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscriptionStatus || 'active')
  const [agencyId, setAgencyId] = useState(user.agencyId || '')
  const [agencyRole, setAgencyRole] = useState<'manager' | 'employee'>(user.agencyRole === 'manager' ? 'manager' : 'employee')
  const [password, setPassword] = useState('')

  return (
    <Sheet
      open
      onClose={onClose}
      placement="side"
      width="min(620px, 100vw)"
      title={user.name || user.email}
      subtitle={<span>{user.email} · <StatusPill status={user.status} map={USER_STATUS} /></span>}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onDelete} disabled={isSelf} title={isSelf ? 'לא ניתן למחוק את עצמך' : undefined} style={{ color: 'var(--destructive)' }}>
            <Trash2 size={15} /> מחיקת משתמש וכל נתוניו
          </Button>
          <Button variant="secondary" onClick={onClose}>סגירה</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 22 }}>
        <section>
          <h3 style={h3Style}>פרטים</h3>
          <KV label="שם" value={user.name || '—'} />
          <KV label="אימייל" value={user.email} />
          <KV label="טלפון" value={user.phone || '—'} />
          <KV label="סוג משתמש" value={USER_TYPE[user.userType] || user.userType} />
          <KV label="נרשם" value={formatDate(user.createdAt, true)} />
          <KV label="פעילות" value={`${user.meetingsCount} פגישות · ${user.summariesCount} סיכומים`} />
          {user.userType === 'agency_manager' && user.registeredBusinessName && (
            <KV label="סוכנות מהטופס" value={`${user.registeredBusinessName}${user.agencyId ? '' : ' — תיווצר אוטומטית באישור המשתמש'}`} />
          )}
          {user.userType === 'agency_employee' && user.requestedAgencyName && (
            <KV label="ביקש להצטרף ל" value={`${user.requestedAgencyName}${user.agencyId ? '' : ' — ישויך אוטומטית באישור אם הסוכנות קיימת'}`} />
          )}
          {user.userType === 'independent_advisor' && user.registeredBusinessName && (
            <KV label="שם העסק" value={user.registeredBusinessName} />
          )}
        </section>

        <section>
          <h3 style={h3Style}>גישה למערכת</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user.status === 'pending_approval' && <Button variant="primary" size="sm" disabled={busy} onClick={() => void onAct({ action: 'approve' }, 'המשתמש אושר')}><Check size={14} /> אשר משתמש</Button>}
            {user.status !== 'blocked' && <Button variant="secondary" size="sm" disabled={busy || isSelf} onClick={() => void onAct({ action: 'block' }, 'המשתמש נחסם')}><Ban size={14} /> חסום</Button>}
            {user.status === 'blocked' && <Button variant="primary" size="sm" disabled={busy} onClick={() => void onAct({ action: 'unblock' }, 'החסימה הוסרה')}><RotateCcw size={14} /> הסר חסימה</Button>}
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => void onAct({ action: 'extend_trial' }, 'תקופת הניסיון הוארכה ב-14 יום')}><Clock size={14} /> הארך ניסיון 14 יום</Button>
            {user.role === 'admin'
              ? <Button variant="secondary" size="sm" disabled={busy || isSelf} onClick={() => void onAct({ action: 'set_role', role: 'advisor' }, 'הרשאת מנהל הוסרה')}><ShieldOff size={14} /> הסר הרשאת מנהל</Button>
              : <Button variant="secondary" size="sm" disabled={busy} onClick={() => void onAct({ action: 'set_role', role: 'admin' }, 'המשתמש הוגדר כמנהל מערכת')}><ShieldCheck size={14} /> הפוך למנהל מערכת</Button>}
          </div>
          {user.trialEndsAt && <p style={hintStyle}>תקופת הניסיון מסתיימת: {formatDate(user.trialEndsAt)}</p>}
        </section>

        <section>
          <h3 style={h3Style}>מנוי ותוכנית</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <Field label="תוכנית">
              <select value={planId} onChange={event => setPlanId(event.target.value)} style={inputStyle}>
                {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </Field>
            <Field label="סטטוס מנוי">
              <select value={subscriptionStatus} onChange={event => setSubscriptionStatus(event.target.value)} style={inputStyle}>
                {Object.entries(SUBSCRIPTION_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Button variant="primary" disabled={busy} onClick={() => void onAct({ action: 'set_subscription', planId, subscriptionStatus }, 'המנוי עודכן')}>שמור</Button>
          </div>
        </section>

        <section>
          <h3 style={h3Style}>שיוך לסוכנות</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <Field label="סוכנות">
              <select value={agencyId} onChange={event => setAgencyId(event.target.value)} style={inputStyle}>
                <option value="">— ללא סוכנות (עצמאי) —</option>
                {agencies.map(agency => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
              </select>
            </Field>
            <Field label="תפקיד בסוכנות">
              <select value={agencyRole} onChange={event => setAgencyRole(event.target.value as 'manager' | 'employee')} style={inputStyle} disabled={!agencyId}>
                <option value="employee">עובד</option>
                <option value="manager">מנהל</option>
              </select>
            </Field>
            <Button variant="primary" disabled={busy || (agencyId === (user.agencyId || '') && (agencyId === '' || agencyRole === (user.agencyRole || 'employee')))} onClick={() => void onAssignAgency(agencyId, agencyRole)}>שמור</Button>
          </div>
          {!agencies.length && <p style={hintStyle}>אין סוכנויות עדיין — צור סוכנות בלשונית „סוכנויות”.</p>}
        </section>

        <section>
          <h3 style={h3Style}>איפוס סיסמה</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <Field label="סיסמה חדשה" hint="לפחות 8 תווים. המשתמש יתבקש להשתמש בה בכניסה הבאה.">
              <input type="text" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} style={inputStyle} dir="ltr" />
            </Field>
            <Button variant="secondary" disabled={busy || password.length < 8} onClick={async () => { const ok = await onAct({ action: 'reset_password', password }, 'הסיסמה עודכנה'); if (ok) setPassword('') }}><KeyRound size={14} /> עדכן סיסמה</Button>
          </div>
        </section>
      </div>
    </Sheet>
  )
}

const h3Style: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }
const hintStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12.5, marginTop: 8 }
const noticeStyle: React.CSSProperties = { background: 'var(--warning-bg, #FEF3C7)', color: 'var(--warning-text, #92400E)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, fontWeight: 600, fontSize: 13.5 }
