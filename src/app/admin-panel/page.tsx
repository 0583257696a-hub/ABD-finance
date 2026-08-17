'use client'

import { useCallback, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Building2, LayoutDashboard, LifeBuoy, RefreshCw, ScrollText, Settings, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AdminUsers } from '@/components/admin/AdminUsers'
import { AdminAgencies } from '@/components/admin/AdminAgencies'
import { AdminPlans } from '@/components/admin/AdminPlans'
import { AdminSupport } from '@/components/admin/AdminSupport'
import { AdminSecurity } from '@/components/admin/AdminSecurity'
import { AdminSettings } from '@/components/admin/AdminSettings'
import type { AdminUser, Agency, AuditEvent, Infrastructure, Stats, Ticket } from '@/components/admin/shared'

/**
 * Admin panel shell. Seven tabs, each a focused component under
 * src/components/admin/. This file only owns: the admin gate, tab nav, and
 * loading/refreshing the shared data every tab reads. All mutations happen
 * inside the tabs through /api/admin/* and call `refresh()` afterwards, so
 * every list is always what the database says.
 *
 * Removed on purpose (were stubs with no backing data): leads/CRM (a
 * duplicate of the users list), landing-page CMS, messages, templates,
 * data-files, reports, workspace matrix, feature flags, roles matrix.
 */

const ADMIN_PANEL_VERSION = 'admin-v3'

type Tab = 'dashboard' | 'users' | 'agencies' | 'plans' | 'support' | 'security' | 'settings'

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { id: 'users', label: 'משתמשים', icon: Users },
  { id: 'agencies', label: 'סוכנויות', icon: Building2 },
  { id: 'plans', label: 'תוכניות ומנויים', icon: BriefcaseBusiness },
  { id: 'support', label: 'תמיכה ופניות', icon: LifeBuoy },
  { id: 'security', label: 'לוג פעילות', icon: ScrollText },
  { id: 'settings', label: 'הגדרות מערכת', icon: Settings },
]

type PanelData = {
  users: AdminUser[]
  usersMode: 'd1' | 'static-auth'
  agencies: Agency[]
  infrastructure: Infrastructure | null
  infraMode: 'd1' | 'defaults' | 'static-auth'
  tickets: Ticket[]
  events: AuditEvent[]
  stats: Stats | null
}

const EMPTY: PanelData = { users: [], usersMode: 'd1', agencies: [], infrastructure: null, infraMode: 'defaults', tickets: [], events: [], stats: null }

export default function AdminPanelPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('admin@abd-finance.co.il')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<PanelData>(EMPTY)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
  const adminEmail = session?.user?.email || ''

  const refresh = useCallback(async () => {
    const get = async <T,>(url: string): Promise<T | null> => {
      try {
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) return null
        return await response.json() as T
      } catch { return null }
    }
    const [users, agencies, infra, tickets, events, stats] = await Promise.all([
      get<{ users: AdminUser[]; mode: 'd1' | 'static-auth' }>('/api/admin/users'),
      get<{ agencies: Agency[] }>('/api/admin/agencies'),
      get<{ infrastructure: Infrastructure; mode: 'd1' | 'defaults' }>('/api/admin/infrastructure'),
      get<{ tickets: Ticket[] }>('/api/admin/support'),
      get<{ events: AuditEvent[] }>('/api/admin/audit'),
      get<{ stats: Stats | null }>('/api/admin/stats'),
    ])
    if (!users && !infra) { setLoadState('error'); return }
    setData({
      users: users?.users || [],
      usersMode: users?.mode || 'static-auth',
      agencies: agencies?.agencies || [],
      infrastructure: infra?.infrastructure || null,
      infraMode: users?.mode === 'static-auth' ? 'static-auth' : (infra?.mode || 'defaults'),
      tickets: tickets?.tickets || [],
      events: events?.events || [],
      stats: stats?.stats || null,
    })
    setLoadState('ready')
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) { setLoadState('loading'); void refresh() } })
    return () => { cancelled = true }
  }, [isAdmin, refresh])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setLoginError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) setLoginError('פרטי מנהל מערכת שגויים')
  }

  if (status === 'loading') {
    return <main dir="rtl" style={loginPageStyle}><p style={{ color: 'var(--text-muted)' }}>טוען…</p></main>
  }

  if (!isAdmin) {
    return (
      <main dir="rtl" style={loginPageStyle}>
        <form onSubmit={login} style={loginCardStyle}>
          <ShieldCheck size={34} color="var(--abd-accent)" />
          <h1 style={{ color: 'var(--text-heading)', fontSize: 24, fontWeight: 700, margin: 0 }}>פאנל ניהול</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{session?.user ? 'החשבון המחובר אינו מנהל מערכת. התחבר עם חשבון מנהל.' : 'כניסה למנהלי מערכת בלבד.'}</p>
          <input value={email} onChange={event => setEmail(event.target.value)} placeholder="אימייל מנהל" style={inputStyle} autoComplete="username" dir="ltr" />
          <input value={password} onChange={event => setPassword(event.target.value)} placeholder="סיסמה" type="password" style={inputStyle} autoComplete="current-password" dir="ltr" />
          {loginError && <p style={{ color: 'var(--destructive)', fontWeight: 600, margin: 0 }}>{loginError}</p>}
          <Button type="submit" variant="primary">כניסה</Button>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>חזרה למערכת</Link>
        </form>
      </main>
    )
  }

  const current = TABS.find(item => item.id === tab)!
  const pendingCount = data.users.filter(user => user.status === 'pending_approval').length
  const openTickets = data.tickets.filter(ticket => ticket.status !== 'closed').length
  const badge = (id: Tab) => id === 'users' ? pendingCount : id === 'support' ? openTickets : 0

  return (
    <main dir="rtl" style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={brandStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
          <div style={{ display: 'grid' }}>
            <strong style={{ fontSize: 14, fontWeight: 700 }}>ABD Admin</strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ניהול מערכת</span>
          </div>
        </div>
        <nav style={{ display: 'grid', gap: 2 }} aria-label="לשוניות ניהול">
          {TABS.map(item => {
            const Icon = item.icon
            const active = tab === item.id
            const count = badge(item.id)
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} style={navButtonStyle(active)} aria-current={active ? 'page' : undefined}>
                <Icon size={16} />
                <span style={{ flex: 1, textAlign: 'start' }}>{item.label}</span>
                {count > 0 && <span style={countBadgeStyle}>{count}</span>}
              </button>
            )
          })}
        </nav>
        <div style={{ marginTop: 'auto', display: 'grid', gap: 6, paddingTop: 16 }}>
          <Link href="/" style={backLinkStyle}><ArrowRight size={14} /> חזרה למערכת</Link>
          <span style={{ color: 'var(--text-muted)', fontSize: 11.5, padding: '0 10px', direction: 'ltr', textAlign: 'right' }}>{ADMIN_PANEL_VERSION}</span>
        </div>
      </aside>

      <section style={contentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ color: 'var(--text-heading)', fontSize: 24, fontWeight: 700, margin: 0 }}>{current.label}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>{SUBTITLES[tab]}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={adminBadgeStyle}>{session?.user?.name || adminEmail}</span>
            <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loadState === 'loading'} title="רענון נתונים"><RefreshCw size={14} /></Button>
          </div>
        </header>

        {loadState === 'error' && (
          <div style={errorNoticeStyle}>
            <span>טעינת נתוני הניהול נכשלה.</span>
            <Button variant="secondary" size="sm" onClick={() => { setLoadState('loading'); void refresh() }}>נסה שוב</Button>
          </div>
        )}
        {loadState === 'loading' && !data.infrastructure && <p style={{ color: 'var(--text-muted)' }}>טוען נתונים…</p>}

        {(loadState === 'ready' || data.infrastructure) && (
          <>
            {tab === 'dashboard' && <AdminDashboard stats={data.stats} users={data.users} tickets={data.tickets} onGo={setTab} />}
            {tab === 'users' && <AdminUsers users={data.users} agencies={data.agencies} plans={data.infrastructure?.plans || []} currentAdminEmail={adminEmail} mode={data.usersMode} onChanged={refresh} />}
            {tab === 'agencies' && <AdminAgencies agencies={data.agencies} users={data.users} plans={data.infrastructure?.plans || []} onChanged={refresh} />}
            {tab === 'plans' && data.infrastructure && <AdminPlans infrastructure={data.infrastructure} users={data.users} onChanged={refresh} />}
            {tab === 'support' && <AdminSupport tickets={data.tickets} onChanged={refresh} />}
            {tab === 'security' && <AdminSecurity events={data.events} onChanged={refresh} />}
            {tab === 'settings' && data.infrastructure && <AdminSettings key={JSON.stringify(data.infrastructure.registration)} infrastructure={data.infrastructure} mode={data.infraMode} appVersion={ADMIN_PANEL_VERSION} onChanged={refresh} />}
          </>
        )}
      </section>
    </main>
  )
}

const SUBTITLES: Record<Tab, string> = {
  dashboard: 'מדדים חיים ותורים שדורשים טיפול',
  users: 'אישור, חסימה, מנוי, שיוך לסוכנות, איפוס סיסמה ומחיקה — לחיצה על שורה פותחת את כרטיס המשתמש',
  agencies: 'סוכנויות, מנהלים ועובדים — לחיצה על שורה פותחת את כרטיס הסוכנות',
  plans: 'קטלוג התוכניות — לחיצה על כרטיס פותחת עריכה',
  support: 'פניות שנפתחו מתוך המערכת — טיפול, תשובה במייל וסגירה',
  security: 'כל פעולות הניהול נרשמות כאן בשרת',
  settings: 'כללי ההרשמה שחלים על נרשמים חדשים',
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '232px minmax(0, 1fr)', background: 'var(--bg-shell)', fontFamily: 'var(--font-main)' }
const sidebarStyle: React.CSSProperties = { minHeight: '100vh', padding: '18px 12px', background: 'var(--bg-surface-sunken)', borderLeft: '1px solid var(--separator)', position: 'sticky', top: 0, alignSelf: 'start', display: 'flex', flexDirection: 'column' }
const brandStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 16px', color: 'var(--text-heading)' }
const logoStyle: React.CSSProperties = { width: 40, height: 40, objectFit: 'contain', borderRadius: 9, background: 'var(--bg-surface)' }
const contentStyle: React.CSSProperties = { padding: '24px 28px', minWidth: 0 }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 }
const adminBadgeStyle: React.CSSProperties = { height: 32, display: 'flex', alignItems: 'center', border: '1px solid var(--separator)', borderRadius: 999, padding: '0 12px', background: 'var(--bg-surface)', color: 'var(--text-heading)', fontWeight: 600, fontSize: 13 }
const countBadgeStyle: React.CSSProperties = { minWidth: 20, height: 20, borderRadius: 999, background: 'var(--abd-accent)', color: '#fff', fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }
const backLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, padding: '8px 10px', textDecoration: 'none' }
const loginPageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-shell)', fontFamily: 'var(--font-main)', padding: 20 }
const loginCardStyle: React.CSSProperties = { width: 'min(420px, 92vw)', display: 'grid', gap: 14, background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-xl)', padding: 28, boxShadow: 'var(--shadow-floating)' }
const inputStyle: React.CSSProperties = { minHeight: 42, border: '1px solid var(--separator-strong, var(--separator))', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-heading)' }
const errorNoticeStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--destructive-bg, #FEE2E2)', color: 'var(--destructive-text, #991B1B)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-lg)', padding: 12, marginBottom: 14, fontWeight: 600 }

function navButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 38, padding: '0 10px', border: 0, borderRadius: 'var(--radius-md)',
    background: active ? 'var(--bg-surface)' : 'transparent', color: active ? 'var(--text-heading)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 500, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', boxShadow: active ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.05))' : 'none',
  }
}
