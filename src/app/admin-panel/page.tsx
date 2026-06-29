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
  status?: string
  statusLabel?: string
  userTypeLabel?: string
  planId?: string
  subscriptionStatus?: string
  businessName?: string
  agencyName?: string
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
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({})
  const returnsInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'

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
    setLoadingUsers(true)
    const res = await fetch('/api/admin/users')
    setLoadingUsers(false)

    if (!res.ok) {
      setMessage('אין הרשאה לטעון משתמשים')
      return
    }

    const data = await res.json()
    setUsers(Array.isArray(data.users) ? data.users : [])
    if (data.mode === 'static-auth') {
      setMessage('המערכת פועלת כרגע במצב static-auth. ניהול משתמשים מלא דורש מסד נתונים פעיל.')
    }
  }

  async function patchUser(userId: string, body: Record<string, unknown>, successMessage: string, errorMessage: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...body }),
    })
    setMessage(res.ok ? successMessage : errorMessage)
    if (res.ok) await loadUsers()
  }

  async function resetPassword(userId: string) {
    const nextPassword = newPasswords[userId]
    if (!nextPassword) {
      setMessage('יש להזין סיסמה חדשה')
      return
    }

    await patchUser(userId, { action: 'reset_password', password: nextPassword }, 'הסיסמה עודכנה בהצלחה', 'עדכון הסיסמה נכשל')
    setNewPasswords(prev => ({ ...prev, [userId]: '' }))
  }

  function uploadReturns(files: FileList | null) {
    if (!files?.length) return
    setMessage(`${files.length} קבצי תשואות נקלטו בפאנל הניהול. בשלב הבא נחבר אותם לשמירה מרכזית במסד הנתונים.`)
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
          <p style={mutedStyle}>ניהול הרשמות, אישורי משתמשים, סיסמאות וקבצי תשואות מרכזיים.</p>
        </div>
        <span style={adminBadgeStyle}>System Admin</span>
      </header>

      {message && <div style={noticeStyle}>{message}</div>}

      <section style={gridStyle}>
        <article style={cardStyle}>
          <Users size={24} color="var(--abd-accent)" />
          <h2 style={sectionTitleStyle}>משתמשים והרשמות</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם</th>
                  <th style={thStyle}>מייל</th>
                  <th style={thStyle}>טלפון</th>
                  <th style={thStyle}>סוג משתמש</th>
                  <th style={thStyle}>תוכנית</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>פעולות</th>
                  <th style={thStyle}>שינוי סיסמה</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={tdStyle}>{user.name || '-'}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.phone || 'לא הוזן'}</td>
                    <td style={tdStyle}>{user.userTypeLabel || 'משתמש קיים'}</td>
                    <td style={tdStyle}>{user.planId || '-'}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(user.status)}>{user.statusLabel || (user.approved ? 'מאושר' : 'ממתין לאישור')}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" onClick={() => void patchUser(user.id, { action: 'approve' }, 'המשתמש אושר', 'אישור המשתמש נכשל')} style={smallButtonStyle}>אשר</button>
                        <button type="button" onClick={() => void patchUser(user.id, { action: 'block' }, 'המשתמש נחסם', 'חסימת המשתמש נכשלה')} style={dangerButtonStyle}>חסום</button>
                      </div>
                    </td>
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
                {!users.length && (
                  <tr>
                    <td style={tdStyle} colSpan={8}>{loadingUsers ? 'טוען משתמשים...' : 'אין משתמשים להצגה.'}</td>
                  </tr>
                )}
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
            <span>התשתית מוכנה. שמירה מרכזית מלאה תחובר בהמשך למסד הנתונים בלי לחשוף אותה בהגדרות משתמש רגיל.</span>
          </div>
        </article>

        <article style={cardStyle}>
          <KeyRound size={24} color="var(--abd-accent)" />
          <h2 style={sectionTitleStyle}>מדיניות סיסמאות</h2>
          <p style={mutedStyle}>סיסמאות נשמרות מוצפנות. מנהל יכול לאפס סיסמה, אך לא ניתן לשחזר סיסמה מקורית לאחר הצפנה.</p>
        </article>
      </section>
    </main>
  )
}

function statusPillStyle(status?: string): React.CSSProperties {
  if (status === 'active') return { ...pillBaseStyle, background: 'var(--status-active-bg)', color: 'var(--status-active-text)' }
  if (status === 'blocked') return { ...pillBaseStyle, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
  return { ...pillBaseStyle, background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
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
const dangerButtonStyle: React.CSSProperties = { ...smallButtonStyle, background: 'var(--status-danger)', color: '#fff' }
const errorStyle: React.CSSProperties = { color: 'var(--status-danger-text)', background: 'var(--status-danger-bg)', borderRadius: 12, padding: 10, fontWeight: 800 }
const noticeStyle: React.CSSProperties = { background: '#EAF6FF', color: 'var(--abd-primary)', border: '1px solid #CFE6FA', borderRadius: 14, padding: 12, marginBottom: 18, fontWeight: 900 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #D7EAFB', borderRadius: 14 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 1020 }
const thStyle: React.CSSProperties = { textAlign: 'right', background: 'var(--abd-primary)', color: '#fff', padding: 11, whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: 11, borderBottom: '1px solid #E6EEF7', color: 'var(--abd-primary)', fontWeight: 700, verticalAlign: 'middle' }
const pillBaseStyle: React.CSSProperties = { borderRadius: 999, padding: '5px 9px', fontWeight: 900, whiteSpace: 'nowrap' }
const rowActionsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const passwordResetStyle: React.CSSProperties = { display: 'flex', gap: 8 }
const smallInputStyle: React.CSSProperties = { ...inputStyle, minHeight: 36, width: 150 }
const uploadBoxStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', color: 'var(--abd-primary)', border: '1px dashed #CFE6FA', borderRadius: 14, padding: 14, background: '#F8FBFF' }
