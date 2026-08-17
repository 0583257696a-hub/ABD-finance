'use client'

import { LogOut } from 'lucide-react'
import { useSession } from 'next-auth/react'

/**
 * Always-visible logout, pinned to the top corner of every dashboard page —
 * independent of the sidebar's scroll position, collapse state, or bottom
 * section. The sidebar keeps its own logout entry too; this one exists so
 * there is never a viewport where signing out isn't one click away.
 */
export default function LogoutButton() {
  const { data: session } = useSession()
  if (!session?.user) return null

  return (
    <button
      type="button"
      onClick={() => { window.location.href = '/api/auth/logout' }}
      title="התנתק מהמערכת"
      style={buttonStyle}
    >
      <LogOut size={15} />
      <span>התנתק</span>
    </button>
  )
}

const buttonStyle: React.CSSProperties = {
  position: 'fixed',
  top: 14,
  left: 16,
  zIndex: 60,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 36,
  padding: '0 14px',
  border: '1px solid var(--separator)',
  borderRadius: 999,
  background: 'var(--bg-surface)',
  color: 'var(--text-heading)',
  fontFamily: 'var(--font-main)',
  fontSize: 13,
  fontWeight: 700,
  boxShadow: 'var(--shadow-1)',
  cursor: 'pointer',
}
