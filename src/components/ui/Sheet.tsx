'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

type SheetPlacement = 'side' | 'bottom' | 'center'

/**
 * Panel geometry per placement. Deliberately NO transform-based positioning:
 * the entrance keyframes animate `transform`, and with animation-fill-mode
 * "both" the keyframe's final transform overrides any static transform used
 * for layout — that's exactly how the centered sheet was ending up shoved
 * off-screen. Centering is done by the overlay's flex layout instead, so the
 * panel's own transform is free for the animation.
 *
 * `side` uses inset-inline-start (RTL-aware) so the panel slides in from the
 * start edge — the same side as the sidebar in this RTL app — not hard-coded
 * `left: 0`, which put it on the wrong side.
 */
const placementStyle: Record<SheetPlacement, React.CSSProperties> = {
  side: { height: '100%', width: 'min(560px, 100vw)', borderRadius: 0, animationName: 'ui-sheet-in-side' },
  bottom: { width: '100%', maxHeight: '86vh', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', animationName: 'ui-sheet-in-bottom' },
  center: { width: 'min(720px, calc(100vw - 32px))', maxHeight: '90vh', borderRadius: 'var(--radius-xl)', animationName: 'ui-sheet-in-center' },
}

/** How the overlay lays out the panel for each placement. */
const overlayLayout: Record<SheetPlacement, React.CSSProperties> = {
  side: { display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch' },
  bottom: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 },
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  placement = 'side',
  children,
  footer,
  width,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  placement?: SheetPlacement
  children: ReactNode
  footer?: ReactNode
  /** Overrides the placement's default width (e.g. a wider side sheet for data-dense content). */
  width?: string
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
      style={{ position: 'fixed', inset: 0, zIndex: 1100, overflow: 'hidden', background: 'rgba(15,25,41,0.28)', backdropFilter: 'blur(2px)', animation: 'ui-fade-in var(--duration-fast) var(--easing-standard) both', ...overlayLayout[placement] }}
    >
      <style>{`
        @keyframes ui-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ui-sheet-in-side { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes ui-sheet-in-bottom { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ui-sheet-in-center { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { [data-ui-sheet] { animation: none !important; } }
        /* The global body[data-animations] hover rule adds translateY(-1px) to every button/a — harmless on buttons, but a transform on the panel itself would nudge it; pin the panel. */
        [data-ui-sheet]:hover { transform: none; }
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
          ...(width ? { width } : {}),
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--separator)',
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</strong>
            {subtitle && <div style={{ marginTop: 2, fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>}
          </div>
          <IconButton label="סגירה" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20 }}>{children}</div>
        {footer && (
          <footer style={{ padding: '14px 20px', borderTop: '1px solid var(--separator)', flexShrink: 0 }}>{footer}</footer>
        )}
      </div>
    </div>
  )
}
