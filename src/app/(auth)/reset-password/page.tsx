'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { checkPasswordPolicy } from '@/lib/password-policy'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main style={pageStyle} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const policy = useMemo(() => checkPasswordPolicy(password), [password])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, confirmPassword }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'איפוס הסיסמה נכשל.')
      return
    }
    setMessage('הסיסמה עודכנה בהצלחה. ניתן להתחבר למערכת.')
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
        <h1 style={titleStyle}>בחירת סיסמה חדשה</h1>
        <input type="password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="סיסמה חדשה" style={inputStyle} />
        <PasswordPolicyView policy={policy} />
        <input type="password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="אימות סיסמה" style={inputStyle} />
        {error && <p style={errorStyle}>{error}</p>}
        {message && <p style={successStyle}>{message}</p>}
        <button type="submit" disabled={loading || !policy.valid} style={{ ...buttonStyle, opacity: loading || !policy.valid ? 0.6 : 1 }}>{loading ? 'מעדכן...' : 'עדכון סיסמה'}</button>
        <Link href="/login" style={linkStyle}>חזרה לכניסה</Link>
      </form>
    </main>
  )
}

function PasswordPolicyView({ policy }: { policy: ReturnType<typeof checkPasswordPolicy> }) {
  return (
    <div style={policyBoxStyle}>
      <span style={policyTitleStyle}>חוזק סיסמה: {policy.label}</span>
      <PolicyItem ok={policy.minLength} text="לפחות 8 תווים" />
      <PolicyItem ok={policy.upperEnglish} text="אות גדולה באנגלית" />
      <PolicyItem ok={policy.lowerEnglish} text="אות קטנה באנגלית" />
    </div>
  )
}

function PolicyItem({ ok, text }: { ok: boolean; text: string }) {
  return <span style={{ color: ok ? 'var(--status-active-text)' : 'var(--text-muted)', fontWeight: 800 }}>{ok ? '✓' : '○'} {text}</span>
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'linear-gradient(135deg,#f8fbff,#eaf2fb)', fontFamily: 'var(--font-main)' }
const cardStyle: React.CSSProperties = { width: 'min(440px,100%)', display: 'grid', gap: 14, padding: 30, borderRadius: 24, background: '#fff', border: '1px solid #d7eafb', boxShadow: 'var(--shadow-hover)' }
const logoStyle: React.CSSProperties = { width: 150, height: 84, objectFit: 'contain', margin: '0 auto' }
const titleStyle: React.CSSProperties = { margin: 0, textAlign: 'center', color: 'var(--abd-primary)', fontSize: 28, fontWeight: 900 }
const inputStyle: React.CSSProperties = { minHeight: 48, border: '1px solid #cfe6fa', borderRadius: 14, padding: '0 14px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)' }
const buttonStyle: React.CSSProperties = { minHeight: 48, border: 0, borderRadius: 14, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const linkStyle: React.CSSProperties = { textAlign: 'center', color: 'var(--abd-primary)', fontWeight: 900, textDecoration: 'none' }
const policyBoxStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 12, borderRadius: 14, background: '#f8fbff', border: '1px solid #d7eafb', fontSize: 13 }
const policyTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontWeight: 900 }
const errorStyle: React.CSSProperties = { margin: 0, borderRadius: 12, padding: 10, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', fontWeight: 800, textAlign: 'center' }
const successStyle: React.CSSProperties = { margin: 0, borderRadius: 12, padding: 10, background: 'var(--status-active-bg)', color: 'var(--status-active-text)', fontWeight: 800, textAlign: 'center' }
