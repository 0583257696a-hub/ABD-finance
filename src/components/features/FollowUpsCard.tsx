'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckSquare, ListChecks, Plus, Trash2 } from 'lucide-react'
import { Surface } from '@/components/ui/Surface'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/format-date'

/**
 * Open follow-ups across all clients (proposal §5.4). Created automatically
 * from the summary's "המשך טיפול" at end of meeting; here the advisor ticks
 * them off, sets a due date, flips owner (advisor/client), adds ad-hoc ones.
 * Overdue tasks are surfaced first, in red.
 */

export type FollowUp = { id: string; meeting_id: string | null; summary_id: string | null; client_name: string; text: string; owner: 'advisor' | 'client'; due_date: string | null; status: 'open' | 'done'; created_at: string; done_at: string | null }

export function FollowUpsCard({ compact = false, clientName }: { compact?: boolean; clientName?: string }) {
  const toast = useToast()
  const [items, setItems] = useState<FollowUp[]>([])
  const [showDone, setShowDone] = useState(false)
  const [newText, setNewText] = useState('')
  const [newClient, setNewClient] = useState(clientName || '')
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (showDone) params.set('includeDone', '1')
      if (clientName) params.set('client', clientName)
      const response = await fetch(`/api/follow-ups?${params.toString()}`)
      if (!response.ok) return
      const data = await response.json() as { followUps: FollowUp[] }
      setItems(data.followUps || [])
    } catch { /* keep what we have */ }
  }, [showDone, clientName])

  useEffect(() => { void load() }, [load, reload])

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true)
    try {
      const response = await fetch('/api/follow-ups', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) })
      if (!response.ok) toast('עדכון המשימה נכשל', 'error')
      setReload(key => key + 1)
    } finally { setBusy(false) }
  }

  async function add() {
    if (!newText.trim()) return
    setBusy(true)
    try {
      const response = await fetch('/api/follow-ups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText, clientName: newClient }) })
      if (response.ok) { setNewText(''); toast('המשימה נוספה', 'success'); setReload(key => key + 1) }
      else toast('הוספת המשימה נכשלה', 'error')
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      await fetch(`/api/follow-ups?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setReload(key => key + 1)
    } finally { setBusy(false) }
  }

  const today = new Date().toISOString().slice(0, 10)
  const open = items.filter(item => item.status === 'open')
  const done = items.filter(item => item.status === 'done')
  const overdue = open.filter(item => item.due_date && item.due_date < today).length

  return (
    <Surface style={{ padding: compact ? 14 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-heading)', fontSize: compact ? 15 : 16, fontWeight: 700, margin: 0 }}>
          <ListChecks size={17} /> משימות פתוחות ({open.length}){overdue ? <span style={{ color: 'var(--destructive-text, #991B1B)', fontSize: 12.5, fontWeight: 700 }}> · {overdue} באיחור</span> : null}
        </h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showDone} onChange={event => setShowDone(event.target.checked)} /> הצג גם שבוצעו
        </label>
      </div>

      {open.length ? (
        <div style={{ display: 'grid', gap: 6 }}>
          {open.map(item => {
            const late = Boolean(item.due_date && item.due_date < today)
            return (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: late ? 'var(--destructive-bg, #FEF2F2)' : 'var(--bg-surface-sunken)' }}>
                <input type="checkbox" checked={false} disabled={busy} onChange={() => void patch(item.id, { status: 'done' })} title="סמן כבוצע" style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-heading)', fontSize: 13.5, overflowWrap: 'anywhere' }}>{item.text}</div>
                  <div style={{ color: late ? 'var(--destructive-text, #991B1B)' : 'var(--text-muted)', fontSize: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {item.client_name && <span>{item.client_name}</span>}
                    <span>{item.owner === 'client' ? 'באחריות הלקוח' : 'באחריותי'}</span>
                    <input type="date" value={item.due_date || ''} onChange={event => void patch(item.id, { dueDate: event.target.value || null })} title="תאריך יעד" style={{ border: '1px solid var(--separator)', borderRadius: 6, padding: '1px 6px', fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-surface)', color: late ? 'var(--destructive-text, #991B1B)' : 'var(--text-heading)' }} />
                    {late && <strong>באיחור</strong>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Button size="sm" variant="ghost" title={item.owner === 'client' ? 'העבר לאחריותי' : 'העבר לאחריות הלקוח'} onClick={() => void patch(item.id, { owner: item.owner === 'client' ? 'advisor' : 'client' })}>{item.owner === 'client' ? '👤' : '🧑‍💼'}</Button>
                  <Button size="sm" variant="ghost" title="מחיקה" onClick={() => void remove(item.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={<CheckSquare size={26} />} title="אין משימות פתוחות" description='משימות נוצרות אוטומטית מ"המשך טיפול" בסיכום הפגישה, או ידנית כאן.' />
      )}

      {showDone && done.length > 0 && (
        <div style={{ display: 'grid', gap: 4, marginTop: 10, opacity: 0.7 }}>
          {done.map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 10, alignItems: 'center', padding: '6px 10px', fontSize: 13 }}>
              <input type="checkbox" checked readOnly onClick={() => void patch(item.id, { status: 'open' })} title="החזר לפתוח" style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.text}{item.client_name ? ` · ${item.client_name}` : ''}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(item.done_at)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 180px) auto', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <input value={newText} onChange={event => setNewText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void add() }} placeholder="משימה חדשה…" style={inputStyle} />
        {!clientName && <input value={newClient} onChange={event => setNewClient(event.target.value)} placeholder="לקוח (לא חובה)" style={inputStyle} />}
        <Button size="sm" variant="secondary" disabled={busy || !newText.trim()} onClick={() => void add()}><Plus size={14} /> הוסף</Button>
      </div>
    </Surface>
  )
}

const inputStyle: React.CSSProperties = { minHeight: 36, border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '6px 10px', fontFamily: 'inherit', fontSize: 13.5, background: 'var(--bg-surface)', color: 'var(--text-heading)', width: '100%' }
