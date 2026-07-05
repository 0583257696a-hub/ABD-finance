'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const KEY = 'abd_cookie_consent_v1'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!localStorage.getItem(KEY))
  }, [])

  function choose(value: 'essential' | 'all') {
    localStorage.setItem(KEY, JSON.stringify({
      value,
      version: '2026-07-05',
      acceptedAt: new Date().toISOString(),
    }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <section aria-label="הסכמה לעוגיות" style={bannerStyle}>
      <div>
        <strong style={titleStyle}>שימוש בעוגיות</strong>
        <p style={textStyle}>
          אנו משתמשים בעוגיות חיוניות להפעלת המערכת. עוגיות לא חיוניות או אנליטיקה יופעלו רק לאחר הסכמה.
          {' '}<Link href="/cookies" style={linkStyle}>מדיניות עוגיות</Link>
        </p>
      </div>
      <div style={actionsStyle}>
        <button type="button" onClick={() => choose('essential')} style={secondaryStyle}>חיוניות בלבד</button>
        <button type="button" onClick={() => choose('all')} style={primaryStyle}>מאשר</button>
      </div>
    </section>
  )
}

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 1000,
  right: 18,
  left: 18,
  bottom: 18,
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 18,
  borderRadius: 18,
  background: '#fff',
  border: '1px solid #D7EAFB',
  boxShadow: '0 18px 50px rgba(15,25,41,.16)',
  fontFamily: 'var(--font-main)',
}
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontWeight: 900 }
const textStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }
const linkStyle: React.CSSProperties = { color: 'var(--abd-accent)', fontWeight: 900 }
const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexShrink: 0 }
const primaryStyle: React.CSSProperties = { border: 0, borderRadius: 12, padding: '10px 16px', background: 'var(--abd-accent)', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const secondaryStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 12, padding: '10px 16px', background: '#fff', color: 'var(--abd-primary)', fontWeight: 900, cursor: 'pointer' }
