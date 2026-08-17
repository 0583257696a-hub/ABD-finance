'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Small anchored popup positioned at explicit viewport coordinates (already
 * clamped to stay on-screen by the caller). Closes on outside click / Escape.
 * Generalizes the color-picker popover pattern used in abd-returns/page.tsx.
 */
export function Popover({
  open,
  x,
  y,
  onClose,
  children,
  width = 160,
}: {
  open: boolean
  x: number
  y: number
  onClose: () => void
  children: ReactNode
  width?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  // Rendered into <body> via portal: overlays are position:fixed, and a fixed
  // element is positioned against its nearest TRANSFORMED ancestor, not the
  // viewport. Page-enter animations (main/section) carry transforms, so an
  // in-tree overlay would be sized/clipped to that ancestor — the archive-sheet
  // bug. Portaling makes the overlay immune to any ancestor transform.
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        zIndex: 1300,
        left: x,
        top: y,
        width,
        padding: 10,
        background: 'var(--bg-surface)',
        border: '1px solid var(--separator-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-floating)',
        animation: 'ui-scale-in var(--duration-fast) var(--easing-standard) both',
      }}
    >
      {children}
    </div>
  , document.body)
}
