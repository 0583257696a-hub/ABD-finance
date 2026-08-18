'use client'

import { use, useEffect, useState } from 'react'
import { describeAnswers, type DescribedAnswer } from '@/lib/questionnaires'

/**
 * Print-optimized view of a submitted questionnaire, for the advisor.
 * "הורד PDF" works through the browser's print dialog (destination: save as
 * PDF) — auto-opened on load. Data comes from the advisor's own
 * authenticated /api/client-forms list, so a token here is only viewable by
 * the advisor who owns it.
 */

type ClientForm = {
  token: string
  client_name: string
  client_email: string
  status: string
  payload_json: string | null
  questions_json: string | null
  submitted_at: string | null
}

export default function ClientFormPrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [form, setForm] = useState<ClientForm | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    fetch('/api/client-forms')
      .then(async response => {
        if (!response.ok) throw new Error('failed')
        const data = await response.json() as { forms: ClientForm[] }
        const found = (data.forms || []).find(item => item.token === token)
        if (!found || found.status !== 'submitted') { setState('error'); return }
        setForm(found)
        setState('ready')
        // Give the fonts/layout a beat before opening the print dialog.
        setTimeout(() => window.print(), 600)
      })
      .catch(() => setState('error'))
  }, [token])

  if (state === 'loading') return <main dir="rtl" style={centerStyle}>טוען…</main>
  if (state === 'error' || !form) return <main dir="rtl" style={centerStyle}>השאלון לא נמצא או שאין הרשאה לצפות בו. ודא שאתה מחובר למערכת.</main>

  const answers: Record<string, string> = form.payload_json ? JSON.parse(form.payload_json) : {}
  const rows = describeAnswers(form.questions_json, answers)
  const sections: Array<{ section: string; items: DescribedAnswer[] }> = []
  for (const row of rows) {
    const last = sections[sections.length - 1]
    if (last && last.section === row.section) last.items.push(row)
    else sections.push({ section: row.section, items: [row] })
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <div className="no-print" style={printBarStyle}>
        <button type="button" onClick={() => window.print()} style={printButtonStyle}>הדפס / שמור כ-PDF</button>
      </div>
      <style>{'@media print { .no-print { display: none !important; } body { background: #fff !important; } }'}</style>

      <header style={{ marginBottom: 24, borderBottom: '2px solid #111827', paddingBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#6B7280' }}>ABD FINANCE — SMART MEETING</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '6px 0 4px' }}>שאלון הכנה לפגישת ייעוץ</h1>
        <div style={{ fontSize: 13.5, color: '#374151' }}>
          {form.client_name || form.client_email}
          {form.submitted_at ? ` · מולא בתאריך ${new Date(form.submitted_at).toLocaleDateString('he-IL')}` : ''}
        </div>
      </header>

      {sections.map(({ section, items }) => (
        <section key={section} style={{ marginBottom: 20, breakInside: 'avoid' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', borderBottom: '1px solid #D1D5DB', paddingBottom: 4, marginBottom: 10 }}>{section}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <tbody>
              {items.map(row => (
                <tr key={row.id}>
                  <td style={{ padding: '6px 0', color: '#6B7280', width: '45%', verticalAlign: 'top' }}>{row.label}</td>
                  <td style={{ padding: '6px 0', color: '#111827', fontWeight: 600, whiteSpace: 'pre-wrap' }}><bdi>{row.value}</bdi></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer style={{ marginTop: 30, paddingTop: 10, borderTop: '1px solid #D1D5DB', fontSize: 11, color: '#9CA3AF' }}>
        המסמך הופק ממערכת Smart Meeting. המידע נמסר על ידי הלקוח ומיועד להכנת פגישת הייעוץ בלבד.
      </footer>
    </main>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: '32px 28px', background: '#fff', color: '#111827', fontFamily: 'var(--font-main, Arial)', minHeight: '100vh' }
const centerStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-main, Arial)', color: '#6B7280' }
const printBarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }
const printButtonStyle: React.CSSProperties = { minHeight: 40, padding: '0 18px', border: 0, borderRadius: 10, background: '#111827', color: '#fff', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }
