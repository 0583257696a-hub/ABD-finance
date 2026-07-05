'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', { email, password, redirect: false })

    setLoading(false)
    if (res?.error) {
      setError('אימייל או סיסמה שגויים')
      return
    }
    router.push('/')
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <section style={shellStyle}>
        <aside style={brandPanelStyle}>
          <div style={logoFrameStyle}>
            <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
          </div>

          <div>
            <h1 style={brandTitleStyle}>ABD Finance</h1>
            <p style={brandTextStyle}>
              מערכת פרישה ופיננסים ליועצים: קופות, פוליסות, תשואות, סימולציות וסיכום פגישה במקום אחד.
            </p>
          </div>

          <div style={brandStatsStyle}>
            <div style={brandStatStyle}><strong>RTL</strong><span>עברית מלאה</span></div>
            <div style={brandStatStyle}><strong>SaaS</strong><span>סביבת יועץ</span></div>
            <div style={brandStatStyle}><strong>ABD</strong><span>Finance</span></div>
          </div>
        </aside>

        <section style={loginCardStyle}>
          <div style={loginHeaderStyle}>
            <span style={eyebrowStyle}>כניסה מאובטחת</span>
            <h2 style={loginTitleStyle}>כניסה למערכת</h2>
            <p style={mutedStyle}>הזן את פרטי היועץ כדי להמשיך לסביבת העבודה.</p>
          </div>

          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={fieldStyle}>
              <span>אימייל</span>
              <div style={inputWrapStyle}>
                <Mail size={18} color="#7EA0C9" />
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                  placeholder="admin@abd-finance.co.il"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>
            </label>

            <label style={fieldStyle}>
              <span>סיסמה</span>
              <div style={inputWrapStyle}>
                <Lock size={18} color="#7EA0C9" />
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </div>
            </label>

            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" disabled={loading} style={{ ...primaryButtonStyle, opacity: loading ? 0.72 : 1 }}>
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
              <ArrowLeft size={18} />
            </button>

            <Link href="/register" style={registerButtonStyle}>
              הרשמה ליועץ חדש
            </Link>
            <Link href="/forgot-password" style={forgotPasswordStyle}>
              שכחתי סיסמה
            </Link>
          </form>
        </section>
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 28,
  fontFamily: 'var(--font-main)',
  background: 'radial-gradient(circle at 15% 18%, rgba(37,99,235,0.14), transparent 28%), linear-gradient(135deg, #F8FBFF 0%, #EAF2FB 100%)',
}

const shellStyle: React.CSSProperties = {
  width: 'min(1060px, 100%)',
  minHeight: 620,
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.9fr',
  overflow: 'hidden',
  borderRadius: 28,
  background: '#FFFFFF',
  border: '1px solid #D7EAFB',
  boxShadow: '0 24px 70px rgba(15,25,41,0.14)',
}

const brandPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 28,
  padding: 44,
  background: 'linear-gradient(160deg, #F8FBFF 0%, #E7F4FF 100%)',
  color: 'var(--abd-primary)',
}

const logoFrameStyle: React.CSSProperties = {
  width: 210,
  height: 132,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 24,
  background: '#FFFFFF',
  border: '1px solid #D7EAFB',
  boxShadow: 'var(--shadow-card)',
}

const logoStyle: React.CSSProperties = { display: 'block', width: 168, height: 96, maxWidth: 168, maxHeight: 96, objectFit: 'contain' }
const brandTitleStyle: React.CSSProperties = { fontSize: 44, fontWeight: 900, lineHeight: 1, marginBottom: 16, color: 'var(--abd-primary)' }
const brandTextStyle: React.CSSProperties = { maxWidth: 500, color: '#6F8DB5', fontSize: 17, lineHeight: 1.9 }
const brandStatsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const brandStatStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.72)', border: '1px solid #D7EAFB', color: 'var(--abd-primary)' }
const loginCardStyle: React.CSSProperties = { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 44 }
const topLinksStyle: React.CSSProperties = { position: 'absolute', top: 22, left: 22 }
const adminLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #D7EAFB', borderRadius: 999, padding: '7px 10px', color: 'var(--abd-primary)', textDecoration: 'none', fontSize: 12, fontWeight: 900, background: '#fff' }
const loginHeaderStyle: React.CSSProperties = { marginBottom: 28 }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 12px', borderRadius: 999, background: 'var(--abd-accent-light)', color: 'var(--abd-accent)', fontSize: 13, fontWeight: 900, marginBottom: 14 }
const loginTitleStyle: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 32, fontWeight: 900, marginBottom: 8 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.7 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, color: 'var(--abd-primary)', fontWeight: 800 }
const inputWrapStyle: React.CSSProperties = { minHeight: 50, display: 'grid', gridTemplateColumns: '24px 1fr', alignItems: 'center', gap: 10, border: '1px solid #CFE6FA', borderRadius: 14, padding: '0 14px', background: '#FBFDFF' }
const inputStyle: React.CSSProperties = { border: 0, outline: 0, background: 'transparent', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', fontSize: 15, fontWeight: 700 }
const primaryButtonStyle: React.CSSProperties = { minHeight: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 0, borderRadius: 14, background: 'var(--abd-accent)', color: '#FFFFFF', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer' }
const registerButtonStyle: React.CSSProperties = { minHeight: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #CFE6FA', borderRadius: 14, background: '#FFFFFF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 900, cursor: 'pointer', textDecoration: 'none' }
const forgotPasswordStyle: React.CSSProperties = { textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-main)', fontWeight: 800, textDecoration: 'none' }
const errorStyle: React.CSSProperties = { borderRadius: 12, padding: 10, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', textAlign: 'center', fontWeight: 800 }

