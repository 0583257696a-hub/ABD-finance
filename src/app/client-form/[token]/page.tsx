'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { isSpouseRelevant, type QuestionnaireQuestion } from '@/lib/questionnaires'

/**
 * Public client-facing intake form (שאלון הכנה לפגישה) — reached via the
 * tokenized link the advisor emails from the meetings tab. Unauthenticated
 * by design; the token is the capability. Single-submit.
 *
 * Fully dynamic: renders whatever question snapshot was attached to this
 * form when it was sent (base questionnaire or an advisor-built custom one).
 * Spouse-marked questions appear only when a partnered marital status is
 * selected.
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
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])

  useEffect(() => {
    fetch(`/api/client-form-public/${token}`)
      .then(async response => {
        if (!response.ok) { setState('invalid'); return }
        const data = await response.json() as { clientName: string; status: string; questions: QuestionnaireQuestion[] }
        setClientName(data.clientName)
        setQuestions(Array.isArray(data.questions) ? data.questions : [])
        setState(data.status === 'submitted' ? 'already' : 'ready')
      })
      .catch(() => setState('invalid'))
  }, [token])

  function update(field: string, value: string) {
    setFields(current => ({ ...current, [field]: value }))
  }

  const spouseRelevant = isSpouseRelevant(fields)

  const visibleQuestions = useMemo(
    () => questions.filter(question => !question.spouseOnly || spouseRelevant),
    [questions, spouseRelevant],
  )

  const sections = useMemo(() => {
    const ordered: Array<{ section: string; items: QuestionnaireQuestion[] }> = []
    for (const question of visibleQuestions) {
      const last = ordered[ordered.length - 1]
      if (last && last.section === question.section) last.items.push(question)
      else ordered.push({ section: question.section, items: [question] })
    }
    return ordered
  }, [visibleQuestions])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const missing = visibleQuestions.find(question => question.required && !String(fields[question.id] || '').trim())
    if (missing) {
      setError(`נא למלא: ${missing.label}`)
      return
    }
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
          {state === 'ready' && <p style={mutedStyle}>שלום {clientName || 'לך'}, מילוי השאלון עוזר לנו להגיע מוכנים לפגישה. המידע ישמש להכנת הפגישה בלבד.</p>}
        </header>

        {state === 'loading' && <p style={mutedStyle}>טוען…</p>}
        {state === 'invalid' && <p style={mutedStyle}>הקישור אינו תקין, פג תוקפו או בוטל על ידי היועץ. פנה ליועץ לקבלת קישור חדש.</p>}
        {state === 'already' && <p style={mutedStyle}>השאלון כבר נשלח — תודה! נתראה בפגישה.</p>}
        {state === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>השאלון נשלח בהצלחה ✓</h2>
            <p style={mutedStyle}>תודה {clientName}! היועץ יקבל את הפרטים לקראת הפגישה.</p>
          </div>
        )}

        {(state === 'ready' || state === 'submitting') && (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            {sections.map(({ section, items }) => (
              <div key={section} style={{ display: 'grid', gap: 12 }}>
                <h2 style={sectionStyle}>{section}</h2>
                {items.map(question => (
                  <QuestionField key={question.id} question={question} value={fields[question.id] || ''} onChange={value => update(question.id, value)} />
                ))}
              </div>
            ))}

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

function QuestionField({ question, value, onChange }: { question: QuestionnaireQuestion; value: string; onChange: (value: string) => void }) {
  const label = question.required ? `${question.label} *` : question.label

  if (question.type === 'textarea') {
    return (
      <label style={fieldStyle}>
        <span>{label}</span>
        <textarea rows={3} value={value} onChange={event => onChange(event.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
      </label>
    )
  }

  if (question.type === 'yes-no') {
    return (
      <label style={fieldStyle}>
        <span>{label}</span>
        <select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>
          <option value="">בחר…</option>
          {YES_NO.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    )
  }

  if (question.type === 'select') {
    return (
      <label style={fieldStyle}>
        <span>{label}</span>
        <select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>
          <option value="">בחר…</option>
          {(question.options || []).map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    )
  }

  if (question.type === 'multiple-choice') {
    // "שאלה אמריקאית" — radio group.
    return (
      <fieldset style={{ ...fieldStyle, border: '1px solid var(--separator, #E5E5EA)', borderRadius: 12, padding: '12px 14px', margin: 0 }}>
        <legend style={{ padding: '0 6px', fontWeight: 600, fontSize: 13.5 }}>{label}</legend>
        <div style={{ display: 'grid', gap: 8 }}>
          {(question.options || []).map(option => (
            <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, cursor: 'pointer' }}>
              <input type="radio" name={question.id} value={option} checked={value === option} onChange={() => onChange(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <input
        dir={question.type === 'number' ? 'ltr' : undefined}
        inputMode={question.type === 'number' ? 'numeric' : undefined}
        value={value}
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
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
const submitStyle: React.CSSProperties = { minHeight: 46, border: 0, borderRadius: 12, background: 'var(--abd-accent, #1F2937)', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 6 }
