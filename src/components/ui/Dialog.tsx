'use client'

import { useEffect } from 'react'
import { Button } from './Button'
import { createPortal } from 'react-dom'

/**
 * Blocking confirm dialog. Use ONLY for genuinely interrupting/destructive
 * actions (e.g. "clear all funds") — replaces window.confirm(). For anything
 * else prefer a Sheet or Popover.
 */
export function Dialog({
  open,
  title,
  description,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  // Rendered into <body> via portal: overlays are position:fixed, and a fixed
  // element is positioned against its nearest TRANSFORMED ancestor, not the
  // viewport. Page-enter animations (main/section) carry transforms, so an
  // in-tree overlay would be sized/clipped to that ancestor — the archive-sheet
  // bug. Portaling makes the overlay immune to any ancestor transform.
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15,25,41,0.32)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'ui-fade-in var(--duration-fast) var(--easing-standard) both',
      }}
    >
      <style>{'@keyframes ui-fade-in { from { opacity: 0 } to { opacity: 1 } } @keyframes ui-scale-in { from { opacity: 0; transform: scale(.96) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }'}</style>
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={event => event.stopPropagation()}
        style={{
          width: 'min(400px, 100%)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-floating)',
          padding: 24,
          animation: 'ui-scale-in var(--duration-base) var(--easing-standard) both',
        }}
      >
        <strong style={{ display: 'block', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: description ? 8 : 20 }}>{title}</strong>
        {description && <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: 20 }}>{description}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm} autoFocus>{confirmLabel}</Button>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
        </div>
      </div>
    </div>
  , document.body)
}
