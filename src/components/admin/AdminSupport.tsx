'use client'

import { useMemo, useState } from 'react'
import { LifeBuoy, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { SearchField } from '@/components/ui/SearchField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Surface } from '@/components/ui/Surface'
import { ConfirmDelete, Field, KV, StatusPill, inputStyle, formatDate, useAdminRequest, TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORY, type Ticket } from './shared'

/**
 * Support tab: the working ticket queue. Users open tickets from the sidebar
 * "תמיכה" sheet (POST /api/support, which also emails the support inbox);
 * here the admin triages (status, priority, internal notes) and replies —
 * replies are emailed to the user and stay on the thread.
 */

type Filter = 'active' | 'open' | 'in_progress' | 'closed' | 'all'

export function AdminSupport({ tickets, onChanged }: { tickets: Ticket[]; onChanged: () => void | Promise<void> }) {
  const { request, busy } = useAdminRequest()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('active')
  const [openId, setOpenId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Ticket | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter(ticket => {
      if (filter === 'active' && ticket.status === 'closed') return false
      if (filter !== 'all' && filter !== 'active' && ticket.status !== filter) return false
      if (!q) return true
      return [ticket.subject, ticket.message, ticket.user_email, ticket.user_name, ticket.id].some(value => String(value || '').toLowerCase().includes(q))
    })
  }, [tickets, filter, search])

  const counts = useMemo(() => ({
    open: tickets.filter(ticket => ticket.status === 'open').length,
    in_progress: tickets.filter(ticket => ticket.status === 'in_progress').length,
    closed: tickets.filter(ticket => ticket.status === 'closed').length,
  }), [tickets])

  const open = openId ? tickets.find(ticket => ticket.id === openId) || null : null

  async function patch(id: string, body: Record<string, unknown>, success: string) {
    const result = await request<{ ok: boolean; emailed?: boolean }>('/api/admin/support', { method: 'PATCH', body: JSON.stringify({ id, ...body }) }, success)
    if (result) await onChanged()
    return result
  }

  const columns: DataTableColumn<Ticket>[] = [
    { key: 'subject', label: 'פנייה', width: 300, render: row => (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-heading)', overflowWrap: 'anywhere' }}>{row.subject}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12.5, overflowWrap: 'anywhere' }}>{row.user_name ? `${row.user_name} · ` : ''}{row.user_email}</div>
      </div>
    ) },
    { key: 'status', label: 'סטטוס', width: 110, render: row => <StatusPill status={row.status} map={TICKET_STATUS} /> },
    { key: 'priority', label: 'עדיפות', width: 100, sortValue: row => ['low', 'normal', 'high', 'urgent'].indexOf(row.priority), render: row => <span style={{ color: row.priority === 'urgent' ? 'var(--destructive)' : row.priority === 'high' ? 'var(--warning-text, #B45309)' : undefined, fontWeight: row.priority === 'urgent' || row.priority === 'high' ? 700 : 400 }}>{TICKET_PRIORITY[row.priority] || row.priority}</span> },
    { key: 'category', label: 'קטגוריה', width: 120, render: row => TICKET_CATEGORY[row.category] || row.category },
    { key: 'replies', label: 'תשובות', width: 80, numeric: true, sortValue: row => safeReplies(row.replies_json).length, render: row => safeReplies(row.replies_json).length },
    { key: 'created_at', label: 'נפתחה', width: 140, sortValue: row => row.created_at, render: row => formatDate(row.created_at, true) },
    { key: 'actions', label: '', width: 70, render: row => (
      <div onClick={event => event.stopPropagation()}>
        <Button size="sm" variant="ghost" onClick={() => setToDelete(row)} title="מחיקת פנייה"><Trash2 size={14} /></Button>
      </div>
    ) },
  ]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', maxWidth: 420 }}><SearchField value={search} onChange={setSearch} placeholder="חיפוש בנושא, תוכן, שם או מייל…" /></div>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: `לטיפול (${counts.open + counts.in_progress})` },
            { value: 'open', label: `פתוחות (${counts.open})` },
            { value: 'in_progress', label: `בטיפול (${counts.in_progress})` },
            { value: 'closed', label: `סגורות (${counts.closed})` },
            { value: 'all', label: `הכל (${tickets.length})` },
          ]}
        />
      </div>

      {filtered.length ? (
        <DataTable<Ticket>
          columns={columns}
          rows={filtered}
          rowKey={row => row.id}
          onRowClick={row => setOpenId(row.id)}
          initialSort={{ key: 'created_at', direction: 'desc' }}
          storageKey="admin_support_table_v1"
        />
      ) : (
        <Surface style={{ padding: 24 }}>
          <EmptyState icon={<LifeBuoy size={28} />} title={tickets.length ? 'אין פניות בסינון הזה' : 'אין פניות תמיכה'} description={tickets.length ? 'נסה סינון אחר.' : 'פניות שמשתמשים פותחים דרך "תמיכה" בתפריט הצד יופיעו כאן, ובמקביל נשלחות למייל support@abd-finance.co.il.'} />
        </Surface>
      )}

      {open && (
        <TicketSheet
          ticket={open}
          busy={busy}
          onClose={() => setOpenId(null)}
          onPatch={(body, success) => patch(open.id, body, success)}
          onDelete={() => setToDelete(open)}
        />
      )}

      <ConfirmDelete
        open={Boolean(toDelete)}
        title="למחוק את הפנייה?"
        description={`הפנייה "${toDelete?.subject}" של ${toDelete?.user_email} תימחק לצמיתות, כולל התשובות שנשלחו. אם רק סיימת לטפל — עדיף לסגור אותה במקום למחוק.`}
        confirmLabel="מחק פנייה"
        busy={busy}
        onConfirm={async () => {
          if (!toDelete) return
          const result = await request(`/api/admin/support?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE' }, 'הפנייה נמחקה')
          if (result) { if (openId === toDelete.id) setOpenId(null); setToDelete(null); await onChanged() }
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function safeReplies(json: string): Array<{ at: string; by: string; text: string }> {
  try { return JSON.parse(json || '[]') } catch { return [] }
}

function TicketSheet({ ticket, busy, onClose, onPatch, onDelete }: {
  ticket: Ticket
  busy: boolean
  onClose: () => void
  onPatch: (body: Record<string, unknown>, success: string) => Promise<{ ok: boolean; emailed?: boolean } | null>
  onDelete: () => void
}) {
  const [notes, setNotes] = useState(ticket.internal_notes || '')
  const [reply, setReply] = useState('')
  const replies = safeReplies(ticket.replies_json)

  return (
    <Sheet
      open
      onClose={onClose}
      placement="side"
      width="min(640px, 100vw)"
      title={ticket.subject}
      subtitle={<span>{ticket.user_name ? `${ticket.user_name} · ` : ''}{ticket.user_email} · נפתחה {formatDate(ticket.created_at, true)} · #{ticket.id.slice(0, 8)}</span>}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onDelete} style={{ color: 'var(--destructive)' }}><Trash2 size={15} /> מחיקת פנייה</Button>
          <Button variant="secondary" onClick={onClose}>סגירה</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="סטטוס">
              <select value={ticket.status} onChange={event => void onPatch({ status: event.target.value }, 'הסטטוס עודכן')} style={inputStyle} disabled={busy}>
                {Object.entries(TICKET_STATUS).map(([value, entry]) => <option key={value} value={value}>{entry.label}</option>)}
              </select>
            </Field>
            <Field label="עדיפות">
              <select value={ticket.priority} onChange={event => void onPatch({ priority: event.target.value }, 'העדיפות עודכנה')} style={inputStyle} disabled={busy}>
                {Object.entries(TICKET_PRIORITY).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>
          <KV label="קטגוריה" value={TICKET_CATEGORY[ticket.category] || ticket.category} />
          {ticket.page_url && <KV label="מסך" value={<span dir="ltr">{ticket.page_url}</span>} />}
          {ticket.closed_at && <KV label="נסגרה" value={formatDate(ticket.closed_at, true)} />}
        </section>

        <section>
          <h3 style={h3Style}>תוכן הפנייה</h3>
          <div style={bubbleStyle}>{ticket.message}</div>
        </section>

        <section>
          <h3 style={h3Style}>שרשור תשובות ({replies.length})</h3>
          {replies.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {replies.map((item, index) => (
                <div key={`${item.at}-${index}`} style={{ ...bubbleStyle, background: 'var(--bg-surface)', border: '1px solid var(--separator)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{item.by} · {formatDate(item.at, true)}</div>
                  {item.text}
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>טרם נשלחה תשובה.</p>}
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <Field label="תשובה למשתמש" hint="נשלחת במייל לכתובת המשתמש ונשמרת בשרשור.">
              <textarea rows={4} value={reply} onChange={event => setReply(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} placeholder="שלום, בדקנו את הפנייה…" />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" disabled={busy || !reply.trim()} onClick={async () => { const r = await onPatch({ reply, status: ticket.status === 'open' ? 'in_progress' : ticket.status }, 'התשובה נשמרה'); if (r) { setReply(''); if (!r.emailed) alert('התשובה נשמרה בשרשור, אך שליחת המייל למשתמש נכשלה. בדוק את הגדרות הדואר.') } }}><Send size={14} /> שלח תשובה</Button>
              <Button variant="primary" disabled={busy || !reply.trim()} onClick={async () => { const r = await onPatch({ reply, status: 'closed' }, 'התשובה נשלחה והפנייה נסגרה'); if (r) setReply('') }}>שלח וסגור</Button>
            </div>
          </div>
        </section>

        <section>
          <h3 style={h3Style}>הערות פנימיות</h3>
          <textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} placeholder="לא נראה למשתמש" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" size="sm" disabled={busy || notes === (ticket.internal_notes || '')} onClick={() => void onPatch({ internalNotes: notes }, 'ההערות נשמרו')}>שמור הערות</Button>
          </div>
        </section>
      </div>
    </Sheet>
  )
}

const h3Style: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }
const bubbleStyle: React.CSSProperties = { background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-heading)', overflowWrap: 'anywhere' }
