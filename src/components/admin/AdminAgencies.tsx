'use client'

import { useMemo, useState } from 'react'
import { Building2, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { SearchField } from '@/components/ui/SearchField'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Surface } from '@/components/ui/Surface'
import {
  ConfirmDelete, Field, StatusPill, inputStyle, formatDate, planName, useAdminRequest,
  AGENCY_STATUS, USER_STATUS,
  type Agency, type AdminUser, type Plan,
} from './shared'

/**
 * Agencies tab: real agency records with a clear hierarchy — the agency, its
 * manager(s), its employees. Create/edit in a sheet with a Save button;
 * assign any user from a picker; remove members; delete agency (members
 * become unassigned, users are never deleted from here).
 */

export function AdminAgencies({ agencies, users, plans, onChanged }: {
  agencies: Agency[]
  users: AdminUser[]
  plans: Plan[]
  onChanged: () => void | Promise<void>
}) {
  const { request, busy } = useAdminRequest()
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Agency | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return agencies
    return agencies.filter(agency => [agency.name, agency.email, agency.phone, agency.tax_id, ...agency.members.map(member => `${member.name} ${member.email}`)].some(value => String(value || '').toLowerCase().includes(q)))
  }, [agencies, search])

  const open = openId ? agencies.find(agency => agency.id === openId) || null : null

  async function confirmDelete() {
    if (!toDelete) return
    const result = await request(`/api/admin/agencies?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE' }, `הסוכנות "${toDelete.name}" נמחקה. ${toDelete.members.length ? `${toDelete.members.length} משתמשים הפכו לבלתי-משויכים.` : ''}`)
    if (result) {
      if (openId === toDelete.id) setOpenId(null)
      setToDelete(null)
      await onChanged()
    }
  }

  const columns: DataTableColumn<Agency>[] = [
    { key: 'name', label: 'סוכנות', width: 240, render: row => (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{row.name}</div>
        {(row.email || row.phone) && <div style={{ color: 'var(--text-muted)', fontSize: 12.5, overflowWrap: 'anywhere' }}>{[row.email, row.phone].filter(Boolean).join(' · ')}</div>}
      </div>
    ) },
    { key: 'status', label: 'סטטוס', width: 130, render: row => <StatusPill status={row.status} map={AGENCY_STATUS} /> },
    { key: 'manager', label: 'מנהל/ים', width: 200, sortValue: row => row.members.filter(member => member.memberRole === 'manager').map(member => member.name || member.email).join(', '), render: row => {
      const managers = row.members.filter(member => member.memberRole === 'manager')
      return managers.length ? managers.map(member => member.name || member.email).join(', ') : <span style={{ color: 'var(--text-muted)' }}>ללא מנהל</span>
    } },
    { key: 'members', label: 'עובדים', width: 90, numeric: true, sortValue: row => row.members.length, render: row => row.members.filter(member => member.memberRole !== 'manager').length },
    { key: 'plan', label: 'תוכנית', width: 140, sortValue: row => planName(plans, row.plan_id), render: row => planName(plans, row.plan_id) },
    { key: 'created', label: 'נוצרה', width: 110, sortValue: row => row.created_at, render: row => formatDate(row.created_at) },
    { key: 'actions', label: '', width: 70, render: row => (
      <div onClick={event => event.stopPropagation()}>
        <Button size="sm" variant="ghost" onClick={() => setToDelete(row)} title="מחיקת סוכנות"><Trash2 size={14} /></Button>
      </div>
    ) },
  ]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 260px', maxWidth: 420 }}><SearchField value={search} onChange={setSearch} placeholder="חיפוש סוכנות, מנהל או עובד…" /></div>
        <Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> סוכנות חדשה</Button>
      </div>

      {filtered.length ? (
        <DataTable<Agency>
          columns={columns}
          rows={filtered}
          rowKey={row => row.id}
          onRowClick={row => setOpenId(row.id)}
          initialSort={{ key: 'name', direction: 'asc' }}
          storageKey="admin_agencies_table_v3"
        />
      ) : (
        <Surface style={{ padding: 24 }}>
          <EmptyState
            icon={<Building2 size={28} />}
            title={search ? 'לא נמצאו סוכנויות' : 'אין סוכנויות עדיין'}
            description={search ? 'נסה חיפוש אחר.' : 'צור סוכנות ושייך אליה מנהל ועובדים. משתמשים שנרשמו כ"מנהל סוכנות" או "עובד סוכנות" ניתן לשייך מתוך כרטיס הסוכנות או מכרטיס המשתמש.'}
            action={<Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> סוכנות חדשה</Button>}
          />
        </Surface>
      )}

      {(open || creating) && (
        <AgencySheet
          agency={creating ? null : open}
          users={users}
          plans={plans}
          busy={busy}
          onClose={() => { setOpenId(null); setCreating(false) }}
          onSave={async (payload) => {
            const result = creating
              ? await request<{ ok: boolean; id: string }>('/api/admin/agencies', { method: 'POST', body: JSON.stringify(payload) }, 'הסוכנות נוצרה')
              : await request('/api/admin/agencies', { method: 'PATCH', body: JSON.stringify({ action: 'update', id: open!.id, ...payload }) }, 'פרטי הסוכנות נשמרו')
            if (result) {
              await onChanged()
              if (creating) { setCreating(false); setOpenId((result as { id?: string }).id || null) }
            }
          }}
          onAssign={async (userId, memberRole) => {
            if (!open) return
            const result = await request('/api/admin/agencies', { method: 'PATCH', body: JSON.stringify({ action: 'assign', id: open.id, userId, memberRole }) }, 'המשתמש שויך לסוכנות')
            if (result) await onChanged()
          }}
          onUnassign={async (userId) => {
            const result = await request('/api/admin/agencies', { method: 'PATCH', body: JSON.stringify({ action: 'unassign', userId }) }, 'המשתמש הוסר מהסוכנות')
            if (result) await onChanged()
          }}
          onDelete={() => open && setToDelete(open)}
        />
      )}

      <ConfirmDelete
        open={Boolean(toDelete)}
        title={`למחוק את הסוכנות "${toDelete?.name}"?`}
        description={`הסוכנות תימחק לצמיתות. ${toDelete?.members.length ? `${toDelete.members.length} המשתמשים המשויכים אליה לא יימחקו — הם יהפכו לבלתי-משויכים ויוכלו להמשיך לעבוד כעצמאיים.` : 'אין משתמשים משויכים.'}`}
        confirmLabel="מחק סוכנות"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

type AgencyPayload = { name: string; taxId: string; address: string; phone: string; email: string; planId: string; status: string; notes: string }

function AgencySheet({ agency, users, plans, busy, onClose, onSave, onAssign, onUnassign, onDelete }: {
  agency: Agency | null
  users: AdminUser[]
  plans: Plan[]
  busy: boolean
  onClose: () => void
  onSave: (payload: AgencyPayload) => Promise<void>
  onAssign: (userId: string, memberRole: 'manager' | 'employee') => Promise<void>
  onUnassign: (userId: string) => Promise<void>
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<AgencyPayload>({
    name: agency?.name || '',
    taxId: agency?.tax_id || '',
    address: agency?.address || '',
    phone: agency?.phone || '',
    email: agency?.email || '',
    planId: agency?.plan_id || plans[0]?.id || 'trial',
    status: agency?.status || 'active',
    notes: agency?.notes || '',
  })
  const [pickUserId, setPickUserId] = useState('')
  const [pickRole, setPickRole] = useState<'manager' | 'employee'>('employee')
  const [removeMember, setRemoveMember] = useState<{ userId: string; label: string } | null>(null)

  const memberIds = new Set((agency?.members || []).map(member => member.userId))
  const candidates = users.filter(user => !memberIds.has(user.id))
  const managers = (agency?.members || []).filter(member => member.memberRole === 'manager')
  const employees = (agency?.members || []).filter(member => member.memberRole !== 'manager')

  const dirty = !agency || draft.name !== agency.name || draft.taxId !== agency.tax_id || draft.address !== agency.address || draft.phone !== agency.phone || draft.email !== agency.email || draft.planId !== agency.plan_id || draft.status !== agency.status || draft.notes !== agency.notes

  function set<K extends keyof AgencyPayload>(key: K, value: AgencyPayload[K]) {
    setDraft(current => ({ ...current, [key]: value }))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      placement="side"
      width="min(640px, 100vw)"
      title={agency ? agency.name : 'סוכנות חדשה'}
      subtitle={agency ? <span>נוצרה {formatDate(agency.created_at)} · {agency.members.length} חברים</span> : 'מלא את פרטי הסוכנות ולחץ שמור. לאחר מכן ניתן לשייך מנהל ועובדים.'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {agency ? <Button variant="ghost" onClick={onDelete} style={{ color: 'var(--destructive)' }}><Trash2 size={15} /> מחיקת סוכנות</Button> : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>סגירה</Button>
            <Button variant="primary" disabled={busy || !draft.name.trim() || !dirty} onClick={() => void onSave({ ...draft, name: draft.name.trim() })}>{agency ? 'שמור שינויים' : 'צור סוכנות'}</Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 22 }}>
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={h3Style}>פרטי הסוכנות</h3>
          <div style={grid2}>
            <Field label="שם הסוכנות *"><input value={draft.name} onChange={event => set('name', event.target.value)} style={inputStyle} /></Field>
            <Field label="ח.פ / ע.מ"><input value={draft.taxId} onChange={event => set('taxId', event.target.value)} style={inputStyle} dir="ltr" /></Field>
            <Field label="אימייל"><input type="email" value={draft.email} onChange={event => set('email', event.target.value)} style={inputStyle} dir="ltr" /></Field>
            <Field label="טלפון"><input value={draft.phone} onChange={event => set('phone', event.target.value)} style={inputStyle} dir="ltr" /></Field>
            <Field label="כתובת" style={{ gridColumn: '1 / -1' }}><input value={draft.address} onChange={event => set('address', event.target.value)} style={inputStyle} /></Field>
            <Field label="תוכנית">
              <select value={draft.planId} onChange={event => set('planId', event.target.value)} style={inputStyle}>
                {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </Field>
            <Field label="סטטוס">
              <select value={draft.status} onChange={event => set('status', event.target.value)} style={inputStyle}>
                {Object.entries(AGENCY_STATUS).map(([value, entry]) => <option key={value} value={value}>{entry.label}</option>)}
              </select>
            </Field>
            <Field label="הערות פנימיות" style={{ gridColumn: '1 / -1' }}><textarea rows={3} value={draft.notes} onChange={event => set('notes', event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
          </div>
        </section>

        {agency && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h3 style={h3Style}>היררכיה — מנהלים ועובדים</h3>
            <MemberGroup title="מנהלים" members={managers} emptyText="לא הוגדר מנהל לסוכנות." onRemove={member => setRemoveMember({ userId: member.userId, label: member.name || member.email })} />
            <MemberGroup title="עובדים" members={employees} emptyText="אין עובדים משויכים." onRemove={member => setRemoveMember({ userId: member.userId, label: member.name || member.email })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'end', paddingTop: 6, borderTop: '1px solid var(--separator)' }}>
              <Field label="שיוך משתמש קיים">
                <select value={pickUserId} onChange={event => setPickUserId(event.target.value)} style={inputStyle}>
                  <option value="">בחר משתמש…</option>
                  {candidates.map(user => <option key={user.id} value={user.id}>{user.name || user.email} — {user.email}{user.agencyName ? ` (כיום ב-${user.agencyName})` : ''}</option>)}
                </select>
              </Field>
              <Field label="תפקיד">
                <select value={pickRole} onChange={event => setPickRole(event.target.value as 'manager' | 'employee')} style={inputStyle}>
                  <option value="employee">עובד</option>
                  <option value="manager">מנהל</option>
                </select>
              </Field>
              <Button variant="secondary" disabled={busy || !pickUserId} onClick={async () => { await onAssign(pickUserId, pickRole); setPickUserId('') }}><UserPlus size={15} /> שייך</Button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>משתמש יכול להשתייך לסוכנות אחת בלבד — שיוך לסוכנות זו מעביר אותו ממקום קודם.</p>
          </section>
        )}
      </div>

      <ConfirmDelete
        open={Boolean(removeMember)}
        title={`להסיר את ${removeMember?.label} מהסוכנות?`}
        description="המשתמש לא יימחק — הוא רק יפסיק להיות משויך לסוכנות זו וימשיך לעבוד כעצמאי."
        confirmLabel="הסר מהסוכנות"
        busy={busy}
        onConfirm={async () => { if (removeMember) { await onUnassign(removeMember.userId); setRemoveMember(null) } }}
        onCancel={() => setRemoveMember(null)}
      />
    </Sheet>
  )
}

function MemberGroup({ title, members, emptyText, onRemove }: { title: string; members: Agency['members']; emptyText: string; onRemove: (member: Agency['members'][number]) => void }) {
  return (
    <div style={{ background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{title} ({members.length})</div>
      {members.length ? (
        <div style={{ display: 'grid', gap: 4 }}>
          {members.map(member => (
            <div key={member.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                <strong style={{ color: 'var(--text-heading)' }}>{member.name || member.email}</strong>
                {member.name && <span style={{ color: 'var(--text-muted)' }}> · {member.email}</span>}
                <span style={{ marginInlineStart: 8 }}><StatusPill status={member.status} map={USER_STATUS} /></span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => onRemove(member)} title="הסרה מהסוכנות"><UserMinus size={14} /></Button>
            </div>
          ))}
        </div>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emptyText}</span>}
    </div>
  )
}

const h3Style: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: 0 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
