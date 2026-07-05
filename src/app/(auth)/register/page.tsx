'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, CheckCircle2, UserRound } from 'lucide-react'
import { checkPasswordPolicy } from '@/lib/password-policy'

type UserType = 'independent_advisor' | 'agency_manager' | 'agency_employee'

const planOptions = [
  { id: 'trial', name: 'ניסיון', text: 'בדיקת המערכת לפני הפעלה מסחרית.' },
  { id: 'basic', name: 'בסיסי', text: 'ליועץ עצמאי בתחילת עבודה שוטפת.' },
  { id: 'professional', name: 'מקצועי', text: 'ליועצים פעילים עם תבניות, ייצוא ומיתוג.' },
  { id: 'agency', name: 'סוכנות', text: 'ניהול צוות ומשתמשים תחת סוכנות.' },
]

const userTypes: Array<{ id: UserType; title: string; text: string }> = [
  { id: 'independent_advisor', title: 'יועץ עצמאי', text: 'חשבון אישי ליועץ / סוכן יחיד.' },
  { id: 'agency_manager', title: 'מנהל סוכנות', text: 'ניהול משתמשים וצוות בהמשך.' },
  { id: 'agency_employee', title: 'עובד סוכנות', text: 'הצטרפות לסוכנות קיימת באישור מנהל.' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    userType: 'independent_advisor' as UserType,
    fullName: '',
    email: '',
    phone: '',
    roleTitle: '',
    password: '',
    confirmPassword: '',
    planId: 'trial',
    businessName: '',
    businessId: '',
    businessAddress: '',
    businessEmail: '',
    businessPhone: '',
    businessField: '',
    estimatedEmployees: '',
    agencyName: '',
    managerEmail: '',
    joinMessage: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
  })

  const isAgencyEmployee = form.userType === 'agency_employee'
  const selectedPlan = useMemo(() => planOptions.find(plan => plan.id === form.planId) || planOptions[0], [form.planId])
  const passwordPolicy = useMemo(() => checkPasswordPolicy(form.password), [form.password])

  function update(name: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))

    setSubmitting(false)
    if (!res.ok) {
      setError(data.error || 'ההרשמה נכשלה.')
      return
    }

    router.push(`/pending-approval?email=${encodeURIComponent(form.email)}`)
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <section style={shellStyle}>
        <aside style={sideStyle}>
          <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
          <div>
            <span style={eyebrowStyle}>בקשת הצטרפות</span>
            <h1 style={titleStyle}>פתיחת משתמש Smart Meeting</h1>
            <p style={leadStyle}>
              ההרשמה יוצרת משתמש במצב ממתין לאישור. מנהל המערכת מאשר את החשבון מפאנל האדמין לפני כניסה למערכת.
            </p>
          </div>

          <div style={summaryCardStyle}>
            <CheckCircle2 size={22} color="var(--abd-accent)" />
            <div>
              <strong>{selectedPlan.name}</strong>
              <span>{selectedPlan.text}</span>
            </div>
          </div>
        </aside>

        <form onSubmit={submit} style={formStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>סוג משתמש</h2>
            <div style={choiceGridStyle}>
              {userTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => update('userType', type.id)}
                  style={{
                    ...choiceStyle,
                    borderColor: form.userType === type.id ? 'var(--abd-accent)' : '#D7EAFB',
                    background: form.userType === type.id ? '#EFF6FF' : '#FFFFFF',
                  }}
                >
                  {type.id === 'agency_employee' ? <Building2 size={20} /> : <UserRound size={20} />}
                  <strong>{type.title}</strong>
                  <span>{type.text}</span>
                </button>
              ))}
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>פרטים אישיים</h2>
            <div style={gridStyle}>
              <Field label="שם מלא" value={form.fullName} onChange={value => update('fullName', value)} required />
              <Field label="אימייל" type="email" value={form.email} onChange={value => update('email', value)} required />
              <Field label="טלפון" value={form.phone} onChange={value => update('phone', value)} required />
              <Field label="תפקיד" value={form.roleTitle} onChange={value => update('roleTitle', value)} />
              <Field label="סיסמה" type="password" value={form.password} onChange={value => update('password', value)} required />
              <Field label="אימות סיסמה" type="password" value={form.confirmPassword} onChange={value => update('confirmPassword', value)} required />
              <PasswordPolicyView policy={passwordPolicy} />
            </div>
          </section>

          {!isAgencyEmployee ? (
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>פרטי עסק / סוכנות</h2>
              <div style={gridStyle}>
                <Field label="שם עסק / סוכנות" value={form.businessName} onChange={value => update('businessName', value)} required />
                <Field label="ח.פ / עוסק" value={form.businessId} onChange={value => update('businessId', value)} />
                <Field label="כתובת" value={form.businessAddress} onChange={value => update('businessAddress', value)} />
                <Field label="אימייל עסקי" type="email" value={form.businessEmail} onChange={value => update('businessEmail', value)} />
                <Field label="טלפון עסקי" value={form.businessPhone} onChange={value => update('businessPhone', value)} />
                <Field label="תחום פעילות" value={form.businessField} onChange={value => update('businessField', value)} />
              </div>
            </section>
          ) : (
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>הצטרפות לסוכנות קיימת</h2>
              <div style={gridStyle}>
                <Field label="שם סוכנות" value={form.agencyName} onChange={value => update('agencyName', value)} required />
                <Field label="אימייל מנהל סוכנות" type="email" value={form.managerEmail} onChange={value => update('managerEmail', value)} required />
              </div>
              <label style={labelStyle}>
                הודעה למנהל
                <textarea value={form.joinMessage} onChange={event => update('joinMessage', event.target.value)} style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }} />
              </label>
            </section>
          )}

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>תוכנית שימוש</h2>
            <div style={planGridStyle}>
              {planOptions.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => update('planId', plan.id)}
                  style={{
                    ...planStyle,
                    borderColor: form.planId === plan.id ? 'var(--abd-accent)' : '#D7EAFB',
                    background: form.planId === plan.id ? '#EFF6FF' : '#FFFFFF',
                  }}
                >
                  <strong>{plan.name}</strong>
                  <span>{plan.text}</span>
                </button>
              ))}
            </div>
          </section>

          <section style={sectionStyle}>
            <label style={checkStyle}>
              <input type="checkbox" checked={form.acceptedTerms} onChange={event => update('acceptedTerms', event.target.checked)} />
              אני מאשר את תנאי השימוש.
            </label>
            <label style={checkStyle}>
              <input type="checkbox" checked={form.acceptedPrivacy} onChange={event => update('acceptedPrivacy', event.target.checked)} />
              אני מאשר את מדיניות הפרטיות.
            </label>
          </section>

          {error && <p style={errorStyle}>{error}</p>}

          <div style={actionsStyle}>
            <button type="submit" disabled={submitting || !passwordPolicy.valid} style={{ ...primaryButtonStyle, opacity: submitting || !passwordPolicy.valid ? 0.65 : 1 }}>
              {submitting ? 'שולח בקשה...' : 'שליחת בקשת הרשמה'}
              <ArrowLeft size={18} />
            </button>
            <Link href="/login" style={secondaryLinkStyle}>חזרה לכניסה</Link>
          </div>
        </form>
      </section>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} style={inputStyle} />
    </label>
  )
}

function PasswordPolicyView({ policy }: { policy: ReturnType<typeof checkPasswordPolicy> }) {
  return (
    <div style={passwordPolicyStyle}>
      <strong>חוזק סיסמה: {policy.label}</strong>
      <span style={{ color: policy.minLength ? 'var(--status-active-text)' : 'var(--text-muted)' }}>{policy.minLength ? '✓' : '○'} לפחות 8 תווים</span>
      <span style={{ color: policy.upperEnglish ? 'var(--status-active-text)' : 'var(--text-muted)' }}>{policy.upperEnglish ? '✓' : '○'} אות גדולה באנגלית</span>
      <span style={{ color: policy.lowerEnglish ? 'var(--status-active-text)' : 'var(--text-muted)' }}>{policy.lowerEnglish ? '✓' : '○'} אות קטנה באנגלית</span>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: 28,
  fontFamily: 'var(--font-main)',
  background: 'linear-gradient(135deg, #F8FBFF 0%, #EAF2FB 100%)',
}
const shellStyle: React.CSSProperties = {
  width: 'min(1180px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  gap: 18,
}
const sideStyle: React.CSSProperties = {
  position: 'sticky',
  top: 28,
  alignSelf: 'start',
  display: 'grid',
  gap: 22,
  padding: 28,
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #D7EAFB',
  boxShadow: 'var(--shadow-card)',
}
const logoStyle: React.CSSProperties = { width: 170, height: 96, objectFit: 'contain' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 12px', borderRadius: 999, background: '#EFF6FF', color: 'var(--abd-accent)', fontWeight: 900, marginBottom: 12 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 34, fontWeight: 900, lineHeight: 1.12 }
const leadStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.75, marginTop: 12 }
const summaryCardStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, background: '#F8FBFF', border: '1px solid #D7EAFB', color: 'var(--abd-primary)' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const sectionStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 20, borderRadius: 22, background: '#fff', border: '1px solid #D7EAFB', boxShadow: 'var(--shadow-card)' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900 }
const choiceGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const choiceStyle: React.CSSProperties = { display: 'grid', gap: 8, textAlign: 'right', padding: 16, borderRadius: 18, border: '1px solid', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', cursor: 'pointer' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: 'var(--abd-primary)', fontWeight: 900 }
const inputStyle: React.CSSProperties = { minHeight: 44, border: '1px solid #CFE6FA', borderRadius: 12, padding: '8px 12px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', background: '#FBFDFF', outline: 0 }
const planGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }
const planStyle: React.CSSProperties = { display: 'grid', gap: 7, textAlign: 'right', padding: 14, borderRadius: 16, border: '1px solid', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', cursor: 'pointer' }
const checkStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', color: 'var(--abd-primary)', fontWeight: 900 }
const actionsStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center' }
const primaryButtonStyle: React.CSSProperties = { minHeight: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 0, borderRadius: 14, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 18px', cursor: 'pointer' }
const secondaryLinkStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontWeight: 900, textDecoration: 'none' }
const errorStyle: React.CSSProperties = { borderRadius: 12, padding: 12, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', fontWeight: 900 }
const passwordPolicyStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 12, borderRadius: 14, background: '#F8FBFF', border: '1px solid #D7EAFB', color: 'var(--abd-primary)', fontSize: 13, fontWeight: 800 }
