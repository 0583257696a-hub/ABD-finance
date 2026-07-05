'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart2,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { BRANDING_EVENT, readBrandingSettings, type BrandingSettings } from '@/lib/branding'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'

const NAV_ITEMS = [
  { tab: 'funds', icon: LayoutDashboard, label: 'קופות' },
  { tab: 'insurance', icon: Shield, label: 'ביטוח' },
  { tab: 'simulations', icon: TrendingUp, label: 'סימולציות' },
  { tab: 'client-returns', icon: BarChart2, label: 'תשואות' },
  { tab: 'recommendations', icon: Lightbulb, label: 'המלצות' },
  { tab: 'summary', icon: FileText, label: 'סיכום' },
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

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || pathnameToTab(pathname) || 'funds'
  const { data: session } = useSession()
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace)
  const [branding, setBranding] = useState<BrandingSettings | null>(null)

  useEffect(() => {
    setBranding(readBrandingSettings())
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

  function newClient() {
    if (!window.confirm('לפתוח לקוח חדש? הנתונים המקומיים של הלקוח הנוכחי יימחקו מהדפדפן.')) return
    WORKSPACE_KEYS.forEach(key => localStorage.removeItem(key))
    resetWorkspace()
    router.push('/?tab=funds')
    router.refresh()
  }

  function logout() {
    window.location.href = '/api/auth/logout'
  }

  return (
    <aside style={sidebarStyle}>
      <div style={logoWrapStyle}>
        <img src={branding?.logoData || '/assets/abd-finance-logo.png'} alt={branding?.companyName || 'ABD Finance'} style={logoStyle} />
      </div>

      <button type="button" onClick={newClient} title="לקוח חדש" style={newClientStyle}>
        <Plus size={18} />
        <span>לקוח חדש</span>
      </button>

      <nav style={navStyle}>
        {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
          const active = activeTab === tab
          return (
            <Link
              key={`${tab}-${label}`}
              href={`/?tab=${tab}`}
              title={label}
              style={{
                ...navItemStyle,
                background: active ? '#E6F3FF' : 'transparent',
                color: active ? 'var(--abd-primary)' : '#6F8DB5',
                borderColor: active ? '#B9DDF7' : 'transparent',
              }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={bottomStyle}>
        <Link href="/?tab=settings" title="הגדרות" style={settingsStyle}>
          <Settings size={19} />
          <span>הגדרות</span>
        </Link>
        {session?.user && (
          <button type="button" onClick={logout} style={logoutStyle}>
            יציאה
          </button>
        )}
      </div>
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
  width: 104,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '14px 10px',
  background: 'var(--bg-sidebar)',
  borderLeft: '1px solid #D7EAFB',
  boxShadow: '0 12px 36px rgba(15,25,41,0.08)',
  backdropFilter: 'blur(10px)',
}

const logoWrapStyle: React.CSSProperties = {
  width: 66,
  height: 54,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 18,
  border: '1px solid #D7EAFB',
  background: 'var(--bg-card)',
  marginBottom: 10,
}

const logoStyle: React.CSSProperties = {
  display: 'block',
  width: 52,
  height: 32,
  objectFit: 'contain',
}

const navStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  display: 'grid',
  alignContent: 'start',
  gap: 7,
  overflowY: 'auto',
}

const navItemStyle: React.CSSProperties = {
  minHeight: 56,
  display: 'grid',
  placeItems: 'center',
  gap: 4,
  border: '1px solid transparent',
  borderRadius: 16,
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 900,
  transition: '160ms ease',
}

const newClientStyle: React.CSSProperties = {
  ...navItemStyle,
  width: '100%',
  minHeight: 50,
  marginBottom: 10,
  background: 'var(--abd-accent)',
  color: '#fff',
  borderColor: 'var(--abd-accent)',
  fontFamily: 'var(--font-main)',
  cursor: 'pointer',
}

const bottomStyle: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: 8,
}

const settingsStyle: React.CSSProperties = {
  ...navItemStyle,
  color: 'var(--abd-primary)',
  background: '#F8FBFF',
  borderColor: '#D7EAFB',
}

const logoutStyle: React.CSSProperties = {
  minHeight: 34,
  border: '1px solid #D7EAFB',
  borderRadius: 12,
  background: '#fff',
  color: '#6F8DB5',
  fontFamily: 'var(--font-main)',
  fontWeight: 900,
  cursor: 'pointer',
}
