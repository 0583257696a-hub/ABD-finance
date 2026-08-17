'use client'

import { useState } from 'react'
import { BriefcaseBusiness, Copy, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Surface } from '@/components/ui/Surface'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDelete, Field, Toggle, inputStyle, useAdminRequest, PLAN_FEATURES, type Infrastructure, type Plan, type AdminUser } from './shared'

/**
 * Plans tab: the subscription catalogue. Cards → sheet editor with a single
 * Save (no per-keystroke PATCH). Delete is blocked while users are on the
 * plan (the count is shown), so a plan can't vanish from under a subscriber.
 */

const PLAN_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'פעילה', tone: 'success' },
  draft: { label: 'טיוטה', tone: 'warning' },
  archived: { label: 'ארכיון', tone: 'neutral' },
}

export function AdminPlans({ infrastructure, users, onChanged }: {
  infrastructure: Infrastructure
  users: AdminUser[]
  onChanged: () => void | Promise<void>
}) {
  const { request, busy } = useAdminRequest()
  const [editing, setEditing] = useState<Plan | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [toDelete, setToDelete] = useState<Plan | null>(null)
  const plans = infrastructure.plans || []

  const subscribers = (planId: string) => users.filter(user => user.planId === planId).length

  async function savePlans(next: Plan[], success: string) {
    const result = await request('/api/admin/infrastructure', { method: 'PATCH', body: JSON.stringify({ infrastructure: { ...infrastructure, plans: next } }) }, success)
    if (result) await onChanged()
    return Boolean(result)
  }

  function newPlan(): Plan {
    return { id: `plan-${Date.now().toString(36)}`, name: '', shortDescription: '', status: 'draft', monthlyPrice: 0, annualPrice: 0, includedUsers: 1, monthlyMeetings: 20, clientLimit: 50, features: Object.fromEntries(PLAN_FEATURES.map(feature => [feature.key, false])) }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>{plans.length} תוכניות · {plans.filter(plan => plan.status === 'active').length} פעילות</p>
        <Button variant="primary" onClick={() => { setEditing(newPlan()); setIsNew(true) }}><Plus size={16} /> תוכנית חדשה</Button>
      </div>

      {plans.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {plans.map(plan => {
            const count = subscribers(plan.id)
            const status = PLAN_STATUS[plan.status] || { label: plan.status, tone: 'neutral' as const }
            return (
              <Surface key={plan.id} padding={16} style={{ display: 'grid', gap: 10, cursor: 'pointer' }} onClick={() => { setEditing(plan); setIsNew(false) }} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') { setEditing(plan); setIsNew(false) } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ color: 'var(--text-heading)', fontSize: 16 }}>{plan.name || 'ללא שם'}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{plan.shortDescription || '—'}</div>
                  </div>
                  <StatusBadge label={status.label} tone={status.tone} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <strong style={{ fontSize: 24, color: 'var(--text-heading)', fontVariantNumeric: 'tabular-nums' }}>₪{plan.monthlyPrice}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>/ חודש{plan.annualPrice ? ` · ₪${plan.annualPrice} / שנה` : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 12.5 }}>
                  <Stat label="משתמשים" value={plan.includedUsers} />
                  <Stat label="פגישות/חודש" value={plan.monthlyMeetings} />
                  <Stat label="לקוחות" value={plan.clientLimit ?? '∞'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTop: '1px solid var(--separator)', paddingTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{count ? `${count} מנויים` : 'ללא מנויים'} · {PLAN_FEATURES.filter(feature => plan.features?.[feature.key]).length}/{PLAN_FEATURES.length} יכולות</span>
                  <div style={{ display: 'flex', gap: 4 }} onClick={event => event.stopPropagation()}>
                    <Button size="sm" variant="ghost" title="שכפול" onClick={() => void savePlans([{ ...plan, id: `${plan.id}-copy-${Date.now().toString(36)}`, name: `${plan.name} — עותק`, status: 'draft' }, ...plans], 'התוכנית שוכפלה')}><Copy size={14} /></Button>
                    <Button size="sm" variant="ghost" title={count ? 'לא ניתן למחוק תוכנית עם מנויים' : 'מחיקה'} disabled={count > 0} onClick={() => setToDelete(plan)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </Surface>
            )
          })}
        </div>
      ) : (
        <Surface style={{ padding: 24 }}><EmptyState icon={<BriefcaseBusiness size={28} />} title="אין תוכניות" description="צור תוכנית ראשונה." /></Surface>
      )}

      {editing && (
        <PlanSheet
          plan={editing}
          isNew={isNew}
          busy={busy}
          takenIds={plans.filter(plan => plan.id !== editing.id).map(plan => plan.id)}
          onClose={() => setEditing(null)}
          onSave={async (next) => {
            const list = isNew ? [next, ...plans] : plans.map(plan => plan.id === editing.id ? next : plan)
            const ok = await savePlans(list, isNew ? 'התוכנית נוצרה' : 'התוכנית נשמרה')
            if (ok) setEditing(null)
          }}
        />
      )}

      <ConfirmDelete
        open={Boolean(toDelete)}
        title={`למחוק את התוכנית "${toDelete?.name}"?`}
        description="התוכנית תוסר מהקטלוג. אין לה מנויים פעילים, כך שאף משתמש לא מושפע."
        confirmLabel="מחק תוכנית"
        busy={busy}
        onConfirm={async () => { if (toDelete) { const ok = await savePlans(plans.filter(plan => plan.id !== toDelete.id), 'התוכנית נמחקה'); if (ok) setToDelete(null) } }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)', padding: '6px 8px', display: 'grid', gap: 1 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{label}</span>
      <strong style={{ color: 'var(--text-heading)', fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
    </div>
  )
}

function PlanSheet({ plan, isNew, busy, takenIds, onClose, onSave }: { plan: Plan; isNew: boolean; busy: boolean; takenIds: string[]; onClose: () => void; onSave: (next: Plan) => Promise<void> }) {
  const [draft, setDraft] = useState<Plan>({ ...plan, features: { ...(plan.features || {}) } })
  const idTaken = takenIds.includes(draft.id)
  const valid = draft.name.trim() && draft.id.trim() && !idTaken

  function set<K extends keyof Plan>(key: K, value: Plan[K]) { setDraft(current => ({ ...current, [key]: value })) }
  const num = (value: string) => Math.max(0, Number(value) || 0)

  return (
    <Sheet
      open
      onClose={onClose}
      placement="side"
      width="min(560px, 100vw)"
      title={isNew ? 'תוכנית חדשה' : `עריכת תוכנית — ${plan.name}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>ביטול</Button>
          <Button variant="primary" disabled={busy || !valid} onClick={() => void onSave({ ...draft, name: draft.name.trim(), id: draft.id.trim() })}>{isNew ? 'צור תוכנית' : 'שמור שינויים'}</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={grid2}>
          <Field label="שם התוכנית *"><input value={draft.name} onChange={event => set('name', event.target.value)} style={inputStyle} /></Field>
          <Field label="מזהה (id)" hint={idTaken ? 'המזהה כבר בשימוש' : 'באנגלית, ללא רווחים. משמש בשיוך מנויים.'}>
            <input value={draft.id} onChange={event => set('id', event.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())} style={{ ...inputStyle, borderColor: idTaken ? 'var(--destructive)' : undefined }} dir="ltr" disabled={!isNew} />
          </Field>
          <Field label="תיאור קצר" style={{ gridColumn: '1 / -1' }}><input value={draft.shortDescription || ''} onChange={event => set('shortDescription', event.target.value)} style={inputStyle} /></Field>
          <Field label="סטטוס">
            <select value={draft.status} onChange={event => set('status', event.target.value)} style={inputStyle}>
              {Object.entries(PLAN_STATUS).map(([value, entry]) => <option key={value} value={value}>{entry.label}</option>)}
            </select>
          </Field>
        </div>

        <section>
          <h3 style={h3Style}>מחיר ומכסות</h3>
          <div style={grid2}>
            <Field label="מחיר חודשי (₪)"><input type="number" min={0} value={draft.monthlyPrice} onChange={event => set('monthlyPrice', num(event.target.value))} style={inputStyle} dir="ltr" /></Field>
            <Field label="מחיר שנתי (₪)"><input type="number" min={0} value={draft.annualPrice ?? 0} onChange={event => set('annualPrice', num(event.target.value))} style={inputStyle} dir="ltr" /></Field>
            <Field label="משתמשים כלולים"><input type="number" min={1} value={draft.includedUsers} onChange={event => set('includedUsers', Math.max(1, num(event.target.value)))} style={inputStyle} dir="ltr" /></Field>
            <Field label="פגישות בחודש"><input type="number" min={0} value={draft.monthlyMeetings} onChange={event => set('monthlyMeetings', num(event.target.value))} style={inputStyle} dir="ltr" /></Field>
            <Field label="מגבלת לקוחות" hint="0 = ללא הגבלה"><input type="number" min={0} value={draft.clientLimit ?? 0} onChange={event => set('clientLimit', num(event.target.value))} style={inputStyle} dir="ltr" /></Field>
          </div>
        </section>

        <section>
          <h3 style={h3Style}>יכולות כלולות</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PLAN_FEATURES.map(feature => (
              <Toggle key={feature.key} label={feature.label} checked={Boolean(draft.features?.[feature.key])} onChange={next => set('features', { ...(draft.features || {}), [feature.key]: next })} />
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  )
}

const h3Style: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
