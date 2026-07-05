'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null)
    setLoading(false)
    setSent(true)
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
        <h1 style={titleStyle}>איפוס סיסמה</h1>
        <p style={mutedStyle}>הזן את האימייל שלך. אם קיים חשבון פעיל, יישלח אליו קישור מאובטח לאיפוס הסיסמה.</p>
        <input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" style={inputStyle} />
        {sent && <p style={successStyle}>אם החשבון קיים, נשלח מייל לאיפוס הסיסמה.</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'שולח...' : 'שליחת קישור איפוס'}</button>
        <Link href="/login" style={linkStyle}>חזרה לכניסה</Link>
      </form>
    </main>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'linear-gradient(135deg,#f8fbff,#eaf2fb)', fontFamily: 'var(--font-main)' }
const cardStyle: React.CSSProperties = { width: 'min(440px,100%)', display: 'grid', gap: 16, padding: 30, borderRadius: 24, background: '#fff', border: '1px solid #d7eafb', boxShadow: 'var(--shadow-hover)' }
const logoStyle: React.CSSProperties = { width: 150, height: 84, objectFit: 'contain', margin: '0 auto' }
const titleStyle: React.CSSProperties = { margin: 0, textAlign: 'center', color: 'var(--abd-primary)', fontSize: 30, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 1.7, textAlign: 'center' }
const inputStyle: React.CSSProperties = { minHeight: 48, border: '1px solid #cfe6fa', borderRadius: 14, padding: '0 14px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', direction: 'ltr' }
const buttonStyle: React.CSSProperties = { minHeight: 48, border: 0, borderRadius: 14, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const linkStyle: React.CSSProperties = { textAlign: 'center', color: 'var(--abd-primary)', fontWeight: 900, textDecoration: 'none' }
const successStyle: React.CSSProperties = { margin: 0, borderRadius: 12, padding: 10, background: 'var(--status-active-bg)', color: 'var(--status-active-text)', fontWeight: 800, textAlign: 'center' }
