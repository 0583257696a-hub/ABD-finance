'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { Field, KV, SectionTitle, Toggle, inputStyle, useAdminRequest, type Infrastructure, type RegistrationRules } from './shared'

/**
 * Settings tab: registration rules — the ONLY system settings that actually
 * drive behaviour (/api/register reads them). Everything here persists to
 * D1 with a single Save; nothing is per-keystroke. The old "feature flags"
 * grid was client-side state wired to nothing and is gone.
 */

export function AdminSettings({ infrastructure, mode, appVersion, onChanged }: {
  infrastructure: Infrastructure
  mode: 'd1' | 'defaults' | 'static-auth'
  appVersion: string
  onChanged: () => void | Promise<void>
}) {
  const { request, busy } = useAdminRequest()
  const [draft, setDraft] = useState<RegistrationRules>(infrastructure.registration)

  // Parent remounts this component (key = registration JSON) whenever the
  // stored rules change, so the draft never needs an effect to resync.

  const dirty = JSON.stringify(draft) !== JSON.stringify(infrastructure.registration)
  function set<K extends keyof RegistrationRules>(key: K, value: RegistrationRules[K]) { setDraft(current => ({ ...current, [key]: value })) }

  async function save() {
    const result = await request('/api/admin/infrastructure', { method: 'PATCH', body: JSON.stringify({ infrastructure: { ...infrastructure, registration: draft } }) }, 'ההגדרות נשמרו — חלות מיידית על הרשמות חדשות')
    if (result) await onChanged()
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 820 }}>
      <Surface padding={20}>
        <SectionTitle actions={<Button variant="primary" disabled={busy || !dirty} onClick={() => void save()}>שמור הגדרות</Button>}>הרשמה למערכת</SectionTitle>
        <div style={{ display: 'grid', gap: 14 }}>
          <Toggle label="ההרשמה פתוחה" hint="כשכבוי — טופס ההרשמה מחזיר 'ההרשמה סגורה כרגע' ואף חשבון חדש לא נוצר." checked={draft.registrationOpen} onChange={next => set('registrationOpen', next)} />
          <Toggle label="אישור ידני של מנהל לכל נרשם" hint="כשדולק — נרשם חדש ממתין לאישור בלשונית משתמשים לפני שיוכל להתחבר. כשכבוי — הנרשם פעיל מיד עם תקופת ניסיון." checked={draft.manualApprovalRequired} onChange={next => set('manualApprovalRequired', next)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ימי ניסיון ברירת מחדל" hint="לחשבון חדש שאושר.">
              <input type="number" min={0} max={365} value={draft.defaultTrialDays} onChange={event => set('defaultTrialDays', Math.max(0, Math.min(365, Number(event.target.value) || 0)))} style={inputStyle} dir="ltr" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Toggle label="יועץ עצמאי" hint="ניתן להירשם כיועץ עצמאי" checked={draft.allowIndependentAdvisor} onChange={next => set('allowIndependentAdvisor', next)} />
            <Toggle label="מנהל סוכנות" hint="ניתן להירשם כמנהל סוכנות" checked={draft.allowAgencyManager} onChange={next => set('allowAgencyManager', next)} />
            <Toggle label="עובד סוכנות" hint="ניתן לבקש הצטרפות לסוכנות" checked={draft.allowAgencyEmployeeJoin} onChange={next => set('allowAgencyEmployeeJoin', next)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Toggle label="דרוש סיסמה חזקה" hint="8+ תווים, אות גדולה וקטנה" checked={draft.requireStrongPassword} onChange={next => set('requireStrongPassword', next)} />
            <Toggle label="דרוש אישור תנאי שימוש ופרטיות" checked={draft.requireTermsApproval} onChange={next => set('requireTermsApproval', next)} />
          </div>
          <Field label="הודעה לנרשם הממתין לאישור" hint="מוצגת אחרי שליחת הטופס כשנדרש אישור ידני.">
            <textarea rows={2} value={draft.pendingApprovalMessage} onChange={event => set('pendingApprovalMessage', event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
        </div>
      </Surface>

      <Surface padding={20}>
        <SectionTitle>מצב מערכת</SectionTitle>
        <KV label="אחסון הגדרות" value={mode === 'd1' ? 'Cloudflare D1 — הגדרות שמורות' : mode === 'defaults' ? 'Cloudflare D1 — טרם נשמרו הגדרות (ברירות מחדל)' : 'ללא מסד נתונים (static-auth) — שמירה לא זמינה'} />
        <KV label="גרסת פאנל" value={appVersion} />
        <KV label="מרכז תמיכה" value={<a href="mailto:support@abd-finance.co.il" style={{ color: 'var(--abd-accent)' }}>support@abd-finance.co.il</a>} />
      </Surface>
    </div>
  )
}
