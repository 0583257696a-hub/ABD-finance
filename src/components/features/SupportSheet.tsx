'use client'

import { useEffect, useState } from 'react'
import { LifeBuoy, Mail } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

/**
 * "תמיכה" sheet opened from the sidebar. Opens a support ticket (POST
 * /api/support → stored for the admin panel + emailed to the support
 * inbox) and shows the user's own tickets with any replies. The mailto
 * remains as a secondary path for people who prefer their mail client.
 */

type MyTicket = { id: string; subject: string; status: 'open' | 'in_progress' | 'closed'; createdAt: string; updatedAt: string; replies: Array<{ at: string; by: string; text: string }> }

const STATUS: Record<MyTicket['status'], { label: string; tone: 'warning' | 'accent' | 'neutral' }> = {
  open: { label: 'התקבלה', tone: 'warning' },
  in_progress: { label: 'בטיפול', tone: 'accent' },
  closed: { label: 'נסגרה', tone: 'neutral' },
}

const CATEGORIES = [
  { value: 'general', label: 'שאלה כללית' },
  { value: 'bug', label: 'תקלה במערכת' },
  { value: 'access', label: 'גישה והרשאות' },
  { value: 'billing', label: 'חיוב ומנוי' },
  { value: 'feature', label: 'בקשה ליכולת חדשה' },
]

export function SupportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [mine, setMine] = useState<MyTicket[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/support').then(async response => {
      if (!response.ok) return
      const data = await response.json() as { tickets: MyTicket[] }
      if (!cancelled) setMine(data.tickets || [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [open, reloadKey])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!subject.trim() || !message.trim()) { setError('נא למלא נושא ותיאור.'); return }
    setState('sending'); setError('')
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category, pageUrl: typeof window !== 'undefined' ? window.location.href : '' }),
      })
      const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string; emailed?: boolean }
      if (!response.ok || !data.ok) { setError(data.error || 'שליחת הפנייה נכשלה — נסה שוב.'); setState('error'); return }
      setState('sent'); setSubject(''); setMessage(''); setCategory('general')
      setReloadKey(key => key + 1)
    } catch {
      setError('שגיאת רשת — נסה שוב.'); setState('error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      placement="side"
      width="min(520px, 100vw)"
      title="מרכז התמיכה של ABD Finance"
      subtitle="יש לך בעיה? נשמח לעזור. הפנייה נשמרת במערכת ומגיעה לצוות התמיכה במייל."
    >
      <div style={{ display: 'grid', gap: 22 }}>
        {state === 'sent' ? (
          <div style={{ background: 'var(--success-bg, #ECFDF5)', color: 'var(--success-text, #065F46)', borderRadius: 'var(--radius-lg)', padding: 14, display: 'grid', gap: 8 }}>
            <strong>הפנייה נשלחה ✓</strong>
            <span style={{ fontSize: 13.5 }}>צוות התמיכה קיבל את הפנייה ויחזור אליך למייל. ניתן לעקוב אחרי הסטטוס כאן למטה.</span>
            <div><Button size="sm" variant="secondary" onClick={() => setState('idle')}>פנייה נוספת</Button></div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <label style={labelStyle}>
              <span>נושא</span>
              <input value={subject} onChange={event => setSubject(event.target.value)} style={inputStyle} maxLength={160} placeholder="למשל: לא מצליח לחבר יומן Google" />
            </label>
            <label style={labelStyle}>
              <span>קטגוריה</span>
              <select value={category} onChange={event => setCategory(event.target.value)} style={inputStyle}>
                {CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              <span>תיאור</span>
              <textarea rows={5} value={message} onChange={event => setMessage(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} maxLength={4000} placeholder="מה ניסית לעשות, מה קרה בפועל, ובאיזה מסך." />
            </label>
            {error && <p style={{ color: 'var(--destructive)', fontWeight: 600, margin: 0, fontSize: 13.5 }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <a href="mailto:support@abd-finance.co.il" style={{ color: 'var(--text-muted)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> support@abd-finance.co.il</a>
              <Button type="submit" variant="primary" disabled={state === 'sending'}><LifeBuoy size={15} /> {state === 'sending' ? 'שולח…' : 'שלח פנייה'}</Button>
            </div>
          </form>
        )}

        <section>
          <h3 style={{ color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>הפניות שלי ({mine.length})</h3>
          {mine.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {mine.map(ticket => (
                <div key={ticket.id} style={{ border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: 'var(--text-heading)', fontSize: 13.5, overflowWrap: 'anywhere' }}>{ticket.subject}</strong>
                    <StatusBadge label={STATUS[ticket.status].label} tone={STATUS[ticket.status].tone} />
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>נפתחה {new Date(ticket.createdAt).toLocaleDateString('he-IL')} · #{ticket.id.slice(0, 8)}</span>
                  {ticket.replies.map((reply, index) => (
                    <div key={`${reply.at}-${index}`} style={{ background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)', padding: '8px 10px', fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text-heading)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginBottom: 2 }}>תשובת התמיכה · {new Date(reply.at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      {reply.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>עדיין לא פתחת פניות.</p>}
        </section>
      </div>
    </Sheet>
  )
}

const labelStyle: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }
const inputStyle: React.CSSProperties = { minHeight: 40, border: '1px solid var(--separator-strong, var(--separator))', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-heading)', width: '100%', fontWeight: 400 }
