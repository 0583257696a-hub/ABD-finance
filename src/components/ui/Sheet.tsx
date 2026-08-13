'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

type SheetPlacement = 'side' | 'bottom' | 'center'

const placementStyle: Record<SheetPlacement, React.CSSProperties> = {
  side: { position: 'fixed', top: 0, bottom: 0, left: 0, width: 'min(560px, 100vw)', borderRadius: 0, animationName: 'ui-sheet-in-side' },
  bottom: { position: 'fixed', left: 0, right: 0, bottom: 0, maxHeight: '86vh', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', animationName: 'ui-sheet-in-bottom' },
  center: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(720px, calc(100vw - 32px))', maxHeight: '90vh', borderRadius: 'var(--radius-xl)', animationName: 'ui-sheet-in-center' },
}

export function Sheet({
  open,
  onClose,
  title,
  placement = 'side',
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  placement?: SheetPlacement
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,25,41,0.28)', backdropFilter: 'blur(2px)', animation: 'ui-fade-in var(--duration-fast) var(--easing-standard) both' }}
    >
      <style>{`
        @keyframes ui-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ui-sheet-in-side { from { opacity: 0; transform: translateX(-16px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes ui-sheet-in-bottom { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ui-sheet-in-center { from { opacity: 0; transform: translate(-50%, -46%) scale(.98) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
        @media (prefers-reduced-motion: reduce) { [data-ui-sheet] { animation: none !important; } }
      `}</style>
      <div
        data-ui-sheet
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-floating)',
          overflow: 'hidden',
          animationDuration: 'var(--duration-base)',
          animationTimingFunction: 'var(--easing-standard)',
          animationFillMode: 'both',
          ...placementStyle[placement],
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--separator)',
            flexShrink: 0,
          }}
        >
          <strong style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</strong>
          <IconButton label="סגירה" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</div>
        {footer && (
          <footer style={{ padding: '14px 20px', borderTop: '1px solid var(--separator)', flexShrink: 0 }}>{footer}</footer>
        )}
      </div>
    </div>
  )
}
