'use client'

import { use, useEffect, useState } from 'react'

/**
 * Public client-facing intake form (שאלון הכנה לפגישה) — reached via the
 * tokenized link the advisor emails from the meetings tab. Unauthenticated
 * by design; the token is the capability. Single-submit.
 */

type FormState = 'loading' | 'ready' | 'submitting' | 'done' | 'already' | 'invalid'

const YES_NO = [
  { value: 'yes', label: 'כן' },
  { value: 'no', label: 'לא' },
  { value: 'unknown', label: 'לא בטוח/ה' },
]

export default function ClientFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [state, setState] = useState<FormState>('loading')
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/client-form-public/${token}`)
      .then(async response => {
        if (!response.ok) { setState('invalid'); return }
        const data = await response.json() as { clientName: string; status: string }
        setClientName(data.clientName)
        setState(data.status === 'submitted' ? 'already' : 'ready')
      })
      .catch(() => setState('invalid'))
  }, [token])

  function update(field: string, value: string) {
    setFields(current => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('submitting')
    setError('')
    try {
      const response = await fetch(`/api/client-form-public/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (response.ok) setState('done')
      else if (response.status === 409) setState('already')
      else {
        setError('שליחת השאלון נכשלה — נסה שוב.')
        setState('ready')
      }
    } catch {
      setError('שליחת השאלון נכשלה — בדוק את החיבור ונסה שוב.')
      setState('ready')
    }
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <div style={cardStyle}>
        <header style={{ marginBottom: 20 }}>
          <strong style={brandStyle}>ABD Finance</strong>
          <h1 style={titleStyle}>שאלון הכנה לפגישת ייעוץ</h1>
          {state === 'ready' && <p style={mutedStyle}>שלום {clientName || 'לך'}, מילוי השאלון אורך כ-3 דקות ועוזר לנו להגיע מוכנים לפגישה. המידע ישמש להכנת הפגישה בלבד.</p>}
        </header>

        {state === 'loading' && <p style={mutedStyle}>טוען…</p>}
        {state === 'invalid' && <p style={mutedStyle}>הקישור אינו תקין או שפג תוקפו. פנה ליועץ לקבלת קישור חדש.</p>}
        {state === 'already' && <p style={mutedStyle}>השאלון כבר נשלח — תודה! נתראה בפגישה.</p>}
        {state === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>השאלון נשלח בהצלחה ✓</h2>
            <p style={mutedStyle}>תודה {clientName}! היועץ יקבל את הפרטים לקראת הפגישה.</p>
          </div>
        )}

        {(state === 'ready' || state === 'submitting') && (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <Section title="פרטים אישיים" />
            <Field label="שם מלא"><input value={fields.fullName || ''} onChange={event => update('fullName', event.target.value)} style={inputStyle} required /></Field>
            <div style={rowStyle}>
              <Field label="טלפון"><input dir="ltr" value={fields.phone || ''} onChange={event => update('phone', event.target.value)} style={inputStyle} /></Field>
              <Field label="שנת לידה"><input dir="ltr" inputMode="numeric" value={fields.birthYear || ''} onChange={event => update('birthYear', event.target.value)} style={inputStyle} /></Field>
            </div>
            <Field label="מצב משפחתי">
              <select value={fields.maritalStatus || ''} onChange={event => update('maritalStatus', event.target.value)} style={inputStyle}>
                <option value="">בחר…</option>
                <option>רווק/ה</option><option>נשוי/אה</option><option>גרוש/ה</option><option>אלמן/ה</option>
              </select>
            </Field>

            <Section title="תעסוקה והכנסה" />
            <Field label="סטטוס תעסוקה">
              <select value={fields.employmentStatus || ''} onChange={event => update('employmentStatus', event.target.value)} style={inputStyle}>
                <option value="">בחר…</option>
                <option>שכיר/ה</option><option>עצמאי/ת</option><option>שכיר/ה + עצמאי/ת</option><option>פנסיונר/ית</option><option>לא עובד/ת</option>
              </select>
            </Field>
            <Field label="שם מעסיק (אם רלוונטי)"><input value={fields.employerName || ''} onChange={event => update('employerName', event.target.value)} style={inputStyle} /></Field>
            <div style={rowStyle}>
              <Field label="הכנסה חודשית ברוטו (₪)"><input dir="ltr" inputMode="numeric" value={fields.monthlyIncome || ''} onChange={event => update('monthlyIncome', event.target.value)} style={inputStyle} /></Field>
              <Field label="הכנסת בן/בת זוג (₪)"><input dir="ltr" inputMode="numeric" value={fields.partnerMonthlyIncome || ''} onChange={event => update('partnerMonthlyIncome', event.target.value)} style={inputStyle} /></Field>
            </div>
            <Field label="הוצאות חודשיות משוערות (₪)"><input dir="ltr" inputMode="numeric" value={fields.monthlyExpenses || ''} onChange={event => update('monthlyExpenses', event.target.value)} style={inputStyle} /></Field>

            <Section title="מוצרים קיימים" />
            <div style={rowStyle}>
              <Choice label="קרן פנסיה / ביטוח מנהלים" field="hasPension" fields={fields} update={update} />
              <Choice label="קרן השתלמות" field="hasStudyFund" fields={fields} update={update} />
            </div>
            <div style={rowStyle}>
              <Choice label="ביטוח חיים" field="hasLifeInsurance" fields={fields} update={update} />
              <Choice label="ביטוח בריאות" field="hasHealthInsurance" fields={fields} update={update} />
            </div>

            <Section title="מטרות" />
            <Field label="גיל פרישה מתוכנן"><input dir="ltr" inputMode="numeric" value={fields.retirementAgeGoal || ''} onChange={event => update('retirementAgeGoal', event.target.value)} style={inputStyle} /></Field>
            <Field label="מה חשוב לך שנבחן בפגישה?"><textarea rows={3} value={fields.goals || ''} onChange={event => update('goals', event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
            <Field label="הערות נוספות"><textarea rows={2} value={fields.notes || ''} onChange={event => update('notes', event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></Field>

            {error && <p style={{ color: '#B91C1C', fontWeight: 600 }}>{error}</p>}
            <button type="submit" disabled={state === 'submitting'} style={submitStyle}>
              {state === 'submitting' ? 'שולח…' : 'שליחת השאלון'}
            </button>
            <p style={{ ...mutedStyle, fontSize: 12 }}>המידע נשמר באופן מאובטח ומשמש את היועץ להכנת הפגישה בלבד.</p>
          </form>
        )}
      </div>
    </main>
  )
}

function Section({ title }: { title: string }) {
  return <h2 style={sectionStyle}>{title}</h2>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={fieldStyle}><span>{label}</span>{children}</label>
}

function Choice({ label, field, fields, update }: { label: string; field: string; fields: Record<string, string>; update: (field: string, value: string) => void }) {
  return (
    <Field label={label}>
      <select value={fields[field] || ''} onChange={event => update(field, event.target.value)} style={inputStyle}>
        <option value="">בחר…</option>
        {YES_NO.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'start center', padding: '32px 16px', background: 'var(--bg-canvas, #F4F4F5)', fontFamily: 'var(--font-main, Arial)' }
const cardStyle: React.CSSProperties = { width: 'min(640px, 100%)', background: 'var(--bg-surface, #fff)', border: '1px solid var(--separator, #E5E5EA)', borderRadius: 18, padding: '28px 26px', boxShadow: '0 8px 30px rgba(15,25,41,0.06)' }
const brandStyle: React.CSSProperties = { color: 'var(--text-muted, #6B7280)', fontSize: 13, fontWeight: 700, letterSpacing: 1 }
const titleStyle: React.CSSProperties = { color: 'var(--text-heading, #111827)', fontSize: 24, fontWeight: 700, marginTop: 4 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted, #6B7280)', lineHeight: 1.7, marginTop: 8 }
const sectionStyle: React.CSSProperties = { color: 'var(--text-heading, #111827)', fontSize: 15, fontWeight: 700, marginTop: 10, paddingBottom: 6, borderBottom: '1px solid var(--separator, #E5E5EA)' }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6, color: 'var(--text-heading, #111827)', fontWeight: 600, fontSize: 13.5 }
const inputStyle: React.CSSProperties = { minHeight: 42, border: '1px solid var(--separator, #D1D5DB)', borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-canvas, #FAFAFA)', color: 'var(--text-heading, #111827)', width: '100%' }
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }
const submitStyle: React.CSSProperties = { minHeight: 46, border: 0, borderRadius: 12, background: 'var(--abd-accent, #1F2937)', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 6 }
