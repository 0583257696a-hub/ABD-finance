'use client'

import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
      }))
      .catch(() => {})
  }, [])

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, phone: profile.phone }),
    })
    setLoading(false)
    setMessage(res.ok ? 'הפרטים עודכנו.' : 'לא ניתן לעדכן פרטים כרגע.')
  }

  async function downloadData() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/profile/export')
    setLoading(false)
    if (!res.ok) {
      setMessage('לא ניתן לייצא מידע כרגע.')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'smart-meeting-user-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function requestDeletion(mode: 'request' | 'delete-now') {
    if (mode === 'delete-now' && !confirm('מחיקת החשבון תמחק את משתמש המערכת. להמשיך?')) return
    setLoading(true)
    const res = await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    setLoading(false)
    setMessage(res.ok ? (mode === 'delete-now' ? 'החשבון נמחק.' : 'בקשת המחיקה נשמרה.') : 'לא ניתן לבצע את הפעולה כרגע.')
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>פרטיות וזכויות משתמש</p>
        <h1 style={titleStyle}>הפרופיל שלי</h1>
        <p style={mutedStyle}>כאן ניתן לייצא מידע אישי שמור, לבקש מחיקה או למחוק את החשבון. נתוני קבצים פיננסיים שהועלו אינם מיועדים לשמירה בשרת.</p>
        <form onSubmit={saveProfile} style={formStyle}>
          <label style={labelStyle}>שם מלא
            <input value={profile.name} onChange={event => setProfile(prev => ({ ...prev, name: event.target.value }))} style={inputStyle} />
          </label>
          <label style={labelStyle}>אימייל
            <input value={profile.email} disabled style={inputStyle} />
          </label>
          <label style={labelStyle}>טלפון
            <input value={profile.phone} onChange={event => setProfile(prev => ({ ...prev, phone: event.target.value }))} style={inputStyle} />
          </label>
          <button disabled={loading} style={primaryStyle}>שמירת פרטים</button>
        </form>
        <div style={actionsStyle}>
          <button disabled={loading} onClick={downloadData} style={primaryStyle}>הורדת המידע שלי</button>
          <button disabled={loading} onClick={() => requestDeletion('request')} style={secondaryStyle}>בקשת מחיקה</button>
          <button disabled={loading} onClick={() => requestDeletion('delete-now')} style={dangerStyle}>מחיקת חשבון</button>
        </div>
        {message && <p role="status" style={statusStyle}>{message}</p>}
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg-shell)', fontFamily: 'var(--font-main)' }
const cardStyle: React.CSSProperties = { width: 'min(760px, 100%)', display: 'grid', gap: 16, padding: 30, borderRadius: 24, background: '#fff', border: '1px solid #D7EAFB', boxShadow: 'var(--shadow-card)' }
const eyebrowStyle: React.CSSProperties = { color: 'var(--abd-accent)', fontWeight: 900 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 36, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.8 }
const formStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, alignItems: 'end' }
const labelStyle: React.CSSProperties = { display: 'grid', gap: 7, color: 'var(--abd-primary)', fontWeight: 900 }
const inputStyle: React.CSSProperties = { minHeight: 42, border: '1px solid #CFE6FA', borderRadius: 12, padding: '8px 12px', color: 'var(--abd-primary)', background: '#FBFDFF' }
const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const primaryStyle: React.CSSProperties = { border: 0, borderRadius: 12, padding: '12px 16px', background: 'var(--abd-accent)', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const secondaryStyle: React.CSSProperties = { border: '1px solid #CFE6FA', borderRadius: 12, padding: '12px 16px', background: '#fff', color: 'var(--abd-primary)', fontWeight: 900, cursor: 'pointer' }
const dangerStyle: React.CSSProperties = { ...secondaryStyle, color: 'var(--status-danger-text)', background: 'var(--status-danger-bg)' }
const statusStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontWeight: 900 }
