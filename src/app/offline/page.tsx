'use client'

import { WifiOff } from 'lucide-react'

/**
 * Offline navigation fallback (Phase 12). Served by the service worker only
 * when a navigation request has no network and no matching cache entry —
 * see the `fallbacks` config in src/app/sw.ts. Never served in place of an
 * authenticated route: the fallback only fires for genuinely uncached
 * navigations, and login/session state is unaffected by it.
 */
export default function OfflinePage() {
  return (
    <main dir="rtl" style={containerStyle}>
      <div style={cardStyle}>
        <WifiOff size={40} color="var(--text-muted, #6B7280)" />
        <h1 style={titleStyle}>אין חיבור לאינטרנט</h1>
        <p style={textStyle}>
          העמוד המבוקש לא היה זמין במטמון המקומי. ברגע שהחיבור לרשת יחזור, נסו לרענן.
        </p>
        <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
          נסה שוב
        </button>
      </div>
    </main>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  fontFamily: 'var(--font-main, sans-serif)',
  background: 'var(--bg-shell, #F5F7FA)',
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 12,
  maxWidth: 360,
  textAlign: 'center',
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--separator, #E5E7EB)',
  borderRadius: 16,
  padding: '32px 28px',
  boxShadow: 'var(--shadow-card, 0 2px 12px rgba(15,25,41,0.06))',
}

const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: 'var(--text-heading, #111827)', margin: 0 }
const textStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted, #6B7280)', margin: 0 }
const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  minHeight: 42,
  padding: '0 20px',
  border: 0,
  borderRadius: 12,
  background: 'var(--abd-accent, #003cff)',
  color: '#fff',
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
