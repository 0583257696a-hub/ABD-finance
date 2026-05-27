'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Database, FileUp, KeyRound, ShieldCheck, Users } from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  name?: string | null
  phone?: string
  approved?: boolean
  passwordPreview?: string
  createdAt: string
}

export default function AdminPanelPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('admin@abd-finance.co.il')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [message, setMessage] = useState('')
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({})
  const returnsInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = session?.user?.email === 'admin@abd-finance.co.il'

  useEffect(() => {
    if (!isAdmin) return
    void loadUsers()
  }, [isAdmin])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setLoginError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) setLoginError('פרטי מנהל מערכת שגויים')
  }

  async function loadUsers() {
    const res = await fetch('/api/admin/users')
    if (!res.ok) {
      setMessage('אין הרשאה לטעון משתמשים')
      return
    }
    const data = await res.json()
    setUsers(Array.isArray(data.users) ? data.users : [])
  }

  async function resetPassword(userId: string) {
    const nextPassword = newPasswords[userId]
    if (!nextPassword) {
      setMessage('יש להזין סיסמה חדשה')
      return
    }
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password: nextPassword }),
    })
    setMessage(res.ok ? 'הסיסמה עודכנה בהצלחה' : 'עדכון הסיסמה נכשל')
    if (res.ok) {
      setNewPasswords(prev => ({ ...prev, [userId]: '' }))
      await loadUsers()
    }
  }

  function uploadReturns(files: FileList | null) {
    if (!files?.length) return
    setMessage(`${files.length} קבצי תשואות נקלטו לפאנל הניהול. בשלב הבא נחבר אותם לשמירה מרכזית במסד הנתונים.`)
  }

  if (status !== 'loading' && !isAdmin) {
    return (
      <main dir="rtl" style={loginPageStyle}>
        <form onSubmit={login} style={loginCardStyle}>
          <ShieldCheck size={34} color="var(--abd-accent)" />
          <h1 style={titleStyle}>Admin Panel</h1>
          <p style={mutedStyle}>כניסה לפאנל מנהל מערכת בלבד.</p>
          <input value={email} onChange={event => setEmail(event.target.value)} placeholder="אימייל מנהל" style={inputStyle} />
          <input value={password} onChange={event => setPassword(event.target.value)} placeholder="סיסמת מנהל" type="password" style={inputStyle} />
          {loginError && <p style={errorStyle}>{loginError}</p>}
          <button type="submit" style={primaryButtonStyle}>כניסה לפאנל אדמין</button>
        </form>
      </main>
    )
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>פאנל מנהל מערכת</h1>
          <p style={mutedStyle}>ניהול הרשאות, משתמשים וקבצי תשואות מרכזיים. לא מופיע בהגדרות משתמש רגיל.</p>
        </div>
        <span style={adminBadgeStyle}>System Admin</span>
      </header>

      {message && <div style={noticeStyle}>{message}</div>}

      <section style={gridStyle}>
        <article style={cardStyle}>
          <Users size={24} color="var(--abd-accent)" />
          <h2 style={sectionTitleStyle}>משתמשים והרשאות</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם</th>
                  <th style={thStyle}>מייל</th>
                  <th style={thStyle}>טלפון</th>
                  <th style={thStyle}>סיסמה</th>
                  <th style={thStyle}>אישור</th>
                  <th style={thStyle}>שינוי סיסמה</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={tdStyle}>{user.name || '-'}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.phone || 'לא הוזן'}</td>
                    <td style={tdStyle}>{user.passwordPreview || 'מוצפנת'}</td>
                    <td style={tdStyle}><span style={approvedStyle}>{user.approved ? 'מאושר' : 'ממתין לאישור'}</span></td>
                    <td style={tdStyle}>
                      <div style={passwordResetStyle}>
                        <input
                          value={newPasswords[user.id] || ''}
                          onChange={event => setNewPasswords(prev => ({ ...prev, [user.id]: event.target.value }))}
                          placeholder="סיסמה חדשה"
                          style={smallInputStyle}
                        />
                        <button type="button" onClick={() => void resetPassword(user.id)} style={smallButtonStyle}>עדכן</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td style={tdStyle} colSpan={6}>אין משתמשים להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article style={cardStyle}>
          <FileUp size={24} color="var(--abd-accent)" />
          <h2 style={sectionTitleStyle}>העלאת קבצי תשואות רשות שוק ההון</h2>
          <p style={mutedStyle}>ניתן לבחור את שלושת קבצי התשואות במקביל: גמל/השתלמות, פנסיה ופוליסות.</p>
          <input ref={returnsInputRef} hidden multiple type="file" accept=".xlsx,.xls,.xml,.csv" onChange={event => uploadReturns(event.target.files)} />
          <button type="button" onClick={() => returnsInputRef.current?.click()} style={primaryButtonStyle}>העלה קבצי תשואות במקביל</button>
          <div style={uploadBoxStyle}>
            <Database size={22} />
            <span>שמירה מרכזית למסד הנתונים תחובר בשלב הבא, בלי להעביר את האפשרות להגדרות משתמש.</span>
          </div>
        </article>

        <article style={cardStyle}>
          <KeyRound size={24} color="var(--abd-accent)" />
          <h2 style={sectionTitleStyle}>מדיניות סיסמאות</h2>
          <p style={mutedStyle}>המערכת שומרת סיסמאות מוצפנות. ניתן לאפס סיסמה, אך לא לשחזר סיסמה מקורית לאחר הצפנה.</p>
        </article>
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', padding: 28, fontFamily: 'var(--font-main)', background: 'var(--bg-shell)' }
const loginPageStyle: React.CSSProperties = { ...pageStyle, display: 'grid', placeItems: 'center' }
const loginCardStyle: React.CSSProperties = { width: 'min(420px, 92vw)', display: 'grid', gap: 14, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 22, padding: 28, boxShadow: 'var(--shadow-hover)' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 22 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 5 }
const adminBadgeStyle: React.CSSProperties = { height: 38, border: '1px solid #CFE6FA', borderRadius: 999, padding: '8px 14px', background: '#fff', color: 'var(--abd-primary)', fontWeight: 900 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 18, alignItems: 'start' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 12, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-card)' }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900 }
const inputStyle: React.CSSProperties = { minHeight: 44, border: '1px solid #CFE6FA', borderRadius: 12, padding: '8px 12px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)' }
const primaryButtonStyle: React.CSSProperties = { minHeight: 44, border: 0, borderRadius: 12, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 16px', cursor: 'pointer' }
const smallButtonStyle: React.CSSProperties = { ...primaryButtonStyle, minHeight: 36, padding: '0 10px' }
const errorStyle: React.CSSProperties = { color: 'var(--status-danger-text)', background: 'var(--status-danger-bg)', borderRadius: 12, padding: 10, fontWeight: 800 }
const noticeStyle: React.CSSProperties = { background: '#EAF6FF', color: 'var(--abd-primary)', border: '1px solid #CFE6FA', borderRadius: 14, padding: 12, marginBottom: 18, fontWeight: 900 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #D7EAFB', borderRadius: 14 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 760 }
const thStyle: React.CSSProperties = { textAlign: 'right', background: 'var(--abd-primary)', color: '#fff', padding: 11, whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: 11, borderBottom: '1px solid #E6EEF7', color: 'var(--abd-primary)', fontWeight: 700 }
const approvedStyle: React.CSSProperties = { borderRadius: 999, padding: '5px 9px', background: 'var(--status-active-bg)', color: 'var(--status-active-text)', fontWeight: 900 }
const passwordResetStyle: React.CSSProperties = { display: 'flex', gap: 8 }
const smallInputStyle: React.CSSProperties = { ...inputStyle, minHeight: 36, width: 150 }
const uploadBoxStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', color: 'var(--abd-primary)', border: '1px dashed #CFE6FA', borderRadius: 14, padding: 14, background: '#F8FBFF' }
