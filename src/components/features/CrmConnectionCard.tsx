'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Link2, RefreshCw, Unlink, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/format-date'
import type { CrmProviderId, CrmStatus, CrmSyncLogEntry, CrmSyncSettings } from '@/lib/crm/types'

/**
 * Settings → חיבורים → "חיבור CRM". Pick a provider, paste its key, test,
 * choose what syncs. Credentials go straight to /api/crm (same-origin
 * session) and are never shown again — the card only ever displays
 * "connected as …". Below: the sync timeline (last 25 pushes) so the advisor
 * sees exactly what reached the CRM and what failed and why.
 */

type CrmPayload = { providers: CrmStatus[]; log: CrmSyncLogEntry[] }

const SETTING_LABELS: Array<{ key: keyof CrmSyncSettings; label: string; hint: string }> = [
  { key: 'autoSync', label: 'סנכרון אוטומטי בסיום פגישה', hint: 'כבוי = רק דרך הכפתור "שלח ל-CRM" בארכיון' },
  { key: 'syncContacts', label: 'עדכון/יצירת לקוח ב-CRM', hint: 'שם, אימייל, טלפון (וללא כפילויות — מאתר לפי אימייל/ת.ז)' },
  { key: 'syncSummaries', label: 'סיכום הפגישה כהערה על הלקוח', hint: 'המלצות, המשך טיפול, מה הטריד את הלקוח. התמליל לעולם לא נשלח' },
  { key: 'syncTasks', label: 'משימות המשך כמשימות ב-CRM', hint: 'כולל בעלים ותאריך יעד' },
  { key: 'includeFacts', label: 'לכלול תמצית נתונים בהערה', hint: 'יתרות, קצבה משוערת וכו\'. כבוי כברירת מחדל — מידע רגיש' },
  { key: 'sendIdNumber', label: 'לשלוח תעודת זהות כשדה לקוח', hint: 'מערכות CRM ישראליות מזהות לפי ת.ז' },
]

const ENTITY_LABEL: Record<string, string> = { contact: 'לקוח', note: 'הערה', task: 'משימה', test: 'בדיקה' }

export function CrmConnectionCard() {
  const toast = useToast()
  const [data, setData] = useState<CrmPayload | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<CrmProviderId | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState<CrmProviderId | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/crm')
      .then(async response => {
        if (!response.ok) throw new Error(String(response.status))
        const payload = await response.json() as CrmPayload
        if (!cancelled) { setData(payload); setError('') }
      })
      .catch(() => { if (!cancelled) setError('לא ניתן לטעון את סטטוס ה-CRM.') })
    return () => { cancelled = true }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey(key => key + 1), [])

  const connected = data?.providers.find(provider => provider.connected) || null
  const editing = selected ? data?.providers.find(provider => provider.provider === selected) || null : null

  function startEdit(provider: CrmStatus) {
    setSelected(provider.provider)
    setForm(Object.fromEntries(provider.fields.map(field => [field.key, field.defaultValue || ''])))
  }

  async function post(body: Record<string, unknown>) {
    const response = await fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string; accountLabel?: string; field?: string }
    return { ok: response.ok && payload.ok !== false, payload }
  }

  async function connect() {
    if (!editing) return
    setBusy(true)
    try {
      const { ok, payload } = await post({ action: 'connect', provider: editing.provider, credentials: form })
      if (ok) {
        toast(`חובר ל-${editing.name}${payload.accountLabel ? ` (${payload.accountLabel})` : ''}`, 'success')
        setSelected(null); setForm({}); reload()
      } else {
        toast(payload.error === 'missing-field' ? 'חסר שדה חובה.' : payload.error || 'החיבור נכשל.', 'error')
      }
    } finally { setBusy(false) }
  }

  async function test(provider: CrmProviderId) {
    setBusy(true)
    try {
      const { ok, payload } = await post({ action: 'test', provider })
      toast(ok ? `החיבור תקין${payload.accountLabel ? ` — ${payload.accountLabel}` : ''}` : payload.error || 'הבדיקה נכשלה.', ok ? 'success' : 'error')
      reload()
    } finally { setBusy(false) }
  }

  async function updateSetting(provider: CrmProviderId, key: keyof CrmSyncSettings, value: boolean) {
    setData(current => current ? { ...current, providers: current.providers.map(item => item.provider === provider ? { ...item, settings: { ...item.settings, [key]: value } } : item) } : current)
    const { ok } = await post({ action: 'settings', provider, settings: { [key]: value } })
    if (!ok) { toast('שמירת ההגדרה נכשלה.', 'error'); reload() }
  }

  async function disconnect(provider: CrmProviderId) {
    setConfirmDisconnect(null)
    setBusy(true)
    try {
      const { ok } = await post({ action: 'disconnect', provider })
      toast(ok ? 'החיבור נותק והמפתח נמחק.' : 'הניתוק נכשל.', ok ? 'success' : 'error')
      reload()
    } finally { setBusy(false) }
  }

  if (error) return <p style={{ color: 'var(--destructive-text, #c0392b)' }}>{error}</p>
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>טוען סטטוס CRM…</p>

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>
        בסיום פגישה המערכת יכולה לעדכן את ה-CRM שלך: הלקוח, סיכום הפגישה כהערה, ומשימות ההמשך. המפתח נשמר מוצפן בשרת ואינו מוצג שוב. חיבור אחד פעיל בכל רגע.
      </p>

      {/* Connected state */}
      {connected && !selected && (
        <div style={{ display: 'grid', gap: 12, padding: 14, border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-sunken)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <StatusBadge tone={connected.status === 'error' ? 'warning' : 'success'} label={connected.status === 'error' ? 'שגיאה' : 'מחובר'} />
            <strong style={{ color: 'var(--text-heading)' }}>{connected.name}</strong>
            {connected.accountLabel && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{connected.accountLabel}</span>}
            {connected.lastSyncAt && <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>· סנכרון אחרון {formatDate(connected.lastSyncAt)}</span>}
            <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void test(connected.provider)}><RefreshCw size={13} /> בדיקת חיבור</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDisconnect(connected.provider)}><Unlink size={13} /> נתק</Button>
            </span>
          </div>
          {connected.lastError && <p style={{ margin: 0, color: 'var(--destructive-text, #c0392b)', fontSize: 13 }}>שגיאה אחרונה: {connected.lastError}</p>}
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {SETTING_LABELS.map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13.5, color: 'var(--text-heading)' }}>
                <input type="checkbox" checked={connected.settings[item.key]} onChange={event => void updateSetting(connected.provider, item.key, event.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
                <span style={{ display: 'grid', gap: 1 }}>
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Provider picker */}
      {!connected && !selected && (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {data.providers.map(provider => (
            <button
              key={provider.provider}
              type="button"
              onClick={() => startEdit(provider)}
              style={{ textAlign: 'start', display: 'grid', gap: 6, padding: 14, border: '1px solid var(--separator-strong)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--text-heading)' }}><Link2 size={15} /> {provider.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.5 }}>{provider.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Credential form */}
      {editing && (
        <div style={{ display: 'grid', gap: 12, padding: 14, border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-sunken)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ color: 'var(--text-heading)' }}>חיבור {editing.name}</strong>
            {editing.docsUrl && <a href={editing.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--abd-primary)', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>תיעוד API <ExternalLink size={12} /></a>}
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {editing.fields.map(field => (
              <label key={field.key} style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                <input
                  dir="ltr"
                  type={field.secret ? 'password' : 'text'}
                  autoComplete="off"
                  value={form[field.key] || ''}
                  onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  style={{ minHeight: 38, border: '1px solid var(--separator-strong)', borderRadius: 'var(--radius-md)', padding: '6px 10px', fontFamily: 'inherit', fontSize: 13.5, background: 'var(--bg-surface)', color: 'inherit' }}
                />
                {field.help && <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 }}>{field.help}</span>}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => { setSelected(null); setForm({}) }}>ביטול</Button>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => void connect()}>{busy ? 'בודק…' : 'בדוק וחבר'}</Button>
          </div>
        </div>
      )}

      {/* Sync log */}
      {data.log.length > 0 && (
        <details open={Boolean(connected)}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>יומן סנכרון ({data.log.length} אחרונים)</summary>
          <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
            {data.log.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '6px 8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-sunken)' }}>
                {entry.status === 'ok' ? <CheckCircle2 size={14} style={{ color: 'var(--success-text, #065F46)', flexShrink: 0 }} /> : <XCircle size={14} style={{ color: entry.status === 'error' ? 'var(--destructive-text, #c0392b)' : 'var(--text-muted)', flexShrink: 0 }} />}
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(entry.created_at)}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-heading)', flexShrink: 0 }}>{ENTITY_LABEL[entry.entity] || entry.entity}</span>
                <span style={{ color: entry.status === 'error' ? 'var(--destructive-text, #c0392b)' : 'var(--text-heading)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.message || ''}>{entry.message || (entry.status === 'ok' ? 'הצליח' : entry.status)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <Dialog
        open={Boolean(confirmDisconnect)}
        title="לנתק את ה-CRM?"
        description="המפתח יימחק מהשרת ולא יישלחו עוד עדכונים. רשומות שכבר נוצרו ב-CRM נשארות שם."
        confirmLabel="נתק"
        cancelLabel="ביטול"
        destructive
        onConfirm={() => { if (confirmDisconnect) void disconnect(confirmDisconnect) }}
        onCancel={() => setConfirmDisconnect(null)}
      />
    </div>
  )
}
