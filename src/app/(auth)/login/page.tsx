'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Lock, Mail } from 'lucide-react'

// useSearchParams() requires a Suspense boundary on a statically
// prerendered page — without it `next build` fails on /login.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'no-account') {
      setError('חשבון Google זה אינו רשום במערכת. יש להירשם תחילה או להתחבר עם אימייל וסיסמה.')
    } else if (errorParam) {
      setError('ההתחברות נכשלה — נסה שוב.')
    }
  }, [searchParams])

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
                  placeholder="name@company.com"
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

            <div style={dividerStyle}>
              <span style={dividerLineStyle} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 700 }}>או</span>
              <span style={dividerLineStyle} />
            </div>

            <button
              type="button"
              onClick={() => void signIn('google', { callbackUrl: '/' })}
              style={googleButtonStyle}
            >
              <GoogleIcon />
              כניסה עם Google
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
const dividerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 }
const dividerLineStyle: React.CSSProperties = { flex: 1, height: 1, background: '#D7EAFB' }
const googleButtonStyle: React.CSSProperties = { minHeight: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1px solid #CFE6FA', borderRadius: 14, background: '#FFFFFF', color: 'var(--text-heading)', fontFamily: 'var(--font-main)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}

