'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart2,
  Calculator,
  CalendarClock,
  Radar,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  LogOut,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { BRANDING_EVENT, readBrandingSettings, type BrandingSettings } from '@/lib/branding'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { Dialog } from '@/components/ui/Dialog'

type NavItem = { tab: string; icon: typeof LayoutDashboard; label: string }

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'עבודה עם לקוח',
    items: [
      { tab: 'funds', icon: LayoutDashboard, label: 'קופות' },
      { tab: 'insurance', icon: Shield, label: 'ביטוח' },
      { tab: 'recommendations', icon: Lightbulb, label: 'המלצות' },
      { tab: 'summary', icon: FileText, label: 'סיכום פגישה' },
      { tab: 'meetings', icon: CalendarClock, label: 'פגישות' },
      { tab: 'meeting-summaries', icon: FileText, label: 'סיכומי פגישות' },
      { tab: 'smart-agent', icon: Radar, label: 'Smart Agent' },
    ],
  },
  {
    title: 'כלים',
    items: [
      { tab: 'simulations', icon: TrendingUp, label: 'סימולציות' },
      { tab: 'calculators', icon: Calculator, label: 'מחשבונים' },
      { tab: 'client-returns', icon: BarChart2, label: 'תשואות הלקוח' },
      { tab: 'abd-returns', icon: LineChart, label: 'תשואות השוק' },
    ],
  },
]

const WORKSPACE_KEYS = [
  'abd-workspace-v2',
  'abd_next_funds',
  'abd_next_insurance',
  'abd_next_client',
  'abd_next_needs',
  'abd_next_recommendations',
  'abd_next_infrastructure_ids',
]

const COLLAPSE_KEY = 'abd_sidebar_collapsed'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || pathnameToTab(pathname) || 'funds'
  const { data: session } = useSession()
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace)
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [confirmNewClient, setConfirmNewClient] = useState(false)
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    setBranding(readBrandingSettings())
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    function refresh(event?: Event) {
      setBranding(event instanceof CustomEvent && event.detail ? event.detail : readBrandingSettings())
    }
    window.addEventListener(BRANDING_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(BRANDING_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '76px' : '212px')
  }, [collapsed])

  function toggleCollapsed() {
    setCollapsed(current => {
      const next = !current
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  function newClient() {
    WORKSPACE_KEYS.forEach(key => localStorage.removeItem(key))
    resetWorkspace()
    setConfirmNewClient(false)
    router.push('/?tab=funds')
    router.refresh()
  }

  function logout() {
    window.location.href = '/api/auth/logout'
  }

  return (
    <aside style={{ ...sidebarStyle, width: collapsed ? 76 : 212 }}>
      <div style={{ ...topRowStyle, justifyContent: collapsed ? 'center' : 'space-between' }}>
        <div style={logoWrapStyle}>
          <img src={branding?.logoData || '/assets/abd-finance-logo.png'} alt={branding?.companyName || 'ABD Finance'} style={logoStyle} />
        </div>
        {!collapsed && (
          <button type="button" onClick={toggleCollapsed} title="כיווץ תפריט" style={collapseButtonStyle}>
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
      {collapsed && (
        <button type="button" onClick={toggleCollapsed} title="הרחבת תפריט" style={{ ...collapseButtonStyle, margin: '2px auto 6px' }}>
          <ChevronsLeft size={16} />
        </button>
      )}

      <button type="button" onClick={() => setConfirmNewClient(true)} title="לקוח חדש" style={newClientStyle}>
        <Plus size={18} />
        {!collapsed && <span>לקוח חדש</span>}
      </button>

      <nav style={navStyle}>
        {NAV_GROUPS.map(group => (
          <div key={group.title} style={groupStyle}>
            {!collapsed && <span style={groupTitleStyle}>{group.title}</span>}
            {group.items.map(({ tab, icon: Icon, label }) => {
              const active = activeTab === tab
              return (
                <Link
                  key={tab}
                  href={`/?tab=${tab}`}
                  title={label}
                  style={{
                    ...navItemStyle,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? 'var(--abd-accent-light)' : 'transparent',
                    color: active ? 'var(--abd-accent)' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={bottomStyle}>
        <Link
          href="/?tab=settings"
          title="הגדרות"
          style={{
            ...navItemStyle,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: activeTab === 'settings' ? 'var(--abd-accent-light)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--abd-accent)' : 'var(--text-muted)',
          }}
        >
          <Settings size={18} />
          {!collapsed && <span>הגדרות</span>}
        </Link>
        {isAdmin && (
          <Link href="/admin-panel" title="ניהול מערכת" style={{ ...navItemStyle, justifyContent: collapsed ? 'center' : 'flex-start', color: 'var(--text-muted)' }}>
            <ShieldCheck size={18} />
            {!collapsed && <span>ניהול מערכת</span>}
          </Link>
        )}
        {session?.user && (
          <button type="button" onClick={logout} title="יציאה" style={{ ...navItemStyle, justifyContent: collapsed ? 'center' : 'flex-start', color: 'var(--text-muted)', cursor: 'pointer', border: 0, background: 'transparent', fontFamily: 'var(--font-main)' }}>
            <LogOut size={18} />
            {!collapsed && <span>יציאה</span>}
          </button>
        )}
      </div>

      <Dialog
        open={confirmNewClient}
        title="לפתוח לקוח חדש?"
        description="הנתונים המקומיים של הלקוח הנוכחי יימחקו מהדפדפן. פעולה זו אינה הפיכה."
        confirmLabel="פתיחת לקוח חדש"
        destructive
        onConfirm={newClient}
        onCancel={() => setConfirmNewClient(false)}
      />
    </aside>
  )
}

function pathnameToTab(pathname: string) {
  if (pathname.includes('/insurance')) return 'insurance'
  if (pathname.includes('/simulations')) return 'simulations'
  if (pathname.includes('/abd-returns')) return 'abd-returns'
  if (pathname.includes('/returns')) return 'client-returns'
  if (pathname.includes('/calculators')) return 'calculators'
  if (pathname.includes('/recommendations')) return 'recommendations'
  if (pathname.includes('/meeting-summary')) return 'summary'
  if (pathname.includes('/settings')) return 'settings'
  return 'funds'
}

const sidebarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  zIndex: 50,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  padding: '14px 10px',
  background: 'var(--bg-sidebar)',
  borderLeft: '1px solid var(--separator)',
  boxShadow: 'var(--shadow-2)',
  transition: `width var(--duration-base) var(--easing-standard)`,
  overflow: 'hidden',
}

const topRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 10,
}

const logoWrapStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-surface-sunken)',
  border: '1px solid var(--separator)',
}

const logoStyle: React.CSSProperties = {
  display: 'block',
  width: 32,
  height: 24,
  objectFit: 'contain',
}

const collapseButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
}

const navStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  display: 'grid',
  alignContent: 'start',
  gap: 14,
  overflowY: 'auto',
  overflowX: 'hidden',
}

const groupStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
}

const groupTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  padding: '0 10px',
  marginBottom: 4,
  whiteSpace: 'nowrap',
}

const navItemStyle: React.CSSProperties = {
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 10px',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none',
  fontSize: 13.5,
  fontWeight: 600,
  fontFamily: 'var(--font-main)',
  whiteSpace: 'nowrap',
  transition: `background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)`,
}

const newClientStyle: React.CSSProperties = {
  ...navItemStyle,
  width: '100%',
  minHeight: 40,
  marginBottom: 12,
  justifyContent: 'flex-start',
  background: 'var(--abd-accent)',
  color: '#fff',
  border: 0,
  cursor: 'pointer',
}

const bottomStyle: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: 2,
  paddingTop: 10,
  borderTop: '1px solid var(--separator)',
}
