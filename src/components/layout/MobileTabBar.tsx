'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Archive, CalendarClock, Search, Settings, Zap } from 'lucide-react'
import { COMMAND_PALETTE_EVENT } from '@/components/features/CommandPalette'

/**
 * Bottom tab bar for phones (design spec p.16). Hidden on desktop by CSS
 * (.abd-mobile-tabbar is display:none above 820px — globals.css). The center
 * action is the one primary verb of the product: start a meeting.
 */
export default function MobileTabBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || (pathname === '/' ? 'meetings' : '')

  const item = (active: boolean): React.CSSProperties => ({
    display: 'grid', placeItems: 'center', gap: 2, flex: 1, padding: '6px 0 8px', textDecoration: 'none',
    color: active ? 'var(--abd-primary)' : 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, fontFamily: 'var(--font-main)',
    border: 0, background: 'transparent', cursor: 'pointer',
  })

  return (
    <nav className="abd-mobile-tabbar" aria-label="ניווט תחתון" dir="rtl">
      <Link href="/?tab=meetings" style={item(tab === 'meetings' || tab === 'summary')}>
        <CalendarClock size={20} strokeWidth={tab === 'meetings' ? 2.2 : 1.8} />
        פגישות
      </Link>
      <Link href="/?tab=meeting-summaries" style={item(tab === 'meeting-summaries')}>
        <Archive size={20} strokeWidth={tab === 'meeting-summaries' ? 2.2 : 1.8} />
        ארכיון
      </Link>
      <Link href="/?tab=meetings&start=1" aria-label="התחל פגישה" style={{ ...item(false), flex: '0 0 auto', padding: '0 6px' }}>
        <span style={{ width: 46, height: 46, marginTop: -16, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'var(--btn-primary-bg, #1C1D1F)', color: 'var(--btn-primary-text, #fff)', boxShadow: 'var(--shadow-floating)' }}>
          <Zap size={21} />
        </span>
      </Link>
      <button type="button" onClick={() => window.dispatchEvent(new Event(COMMAND_PALETTE_EVENT))} style={item(false)}>
        <Search size={20} strokeWidth={1.8} />
        חיפוש
      </button>
      <Link href="/?tab=settings" style={item(tab === 'settings')}>
        <Settings size={20} strokeWidth={tab === 'settings' ? 2.2 : 1.8} />
        הגדרות
      </Link>
    </nav>
  )
}
