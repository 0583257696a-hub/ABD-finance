'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Registers the service worker (production only, per Phase 7) and implements
 * the Phase 9 update flow: a newly installed worker never activates itself.
 * We detect it waiting, show a non-blocking prompt, and only send
 * SKIP_WAITING on explicit user confirmation — then reload exactly once,
 * only in direct response to that confirmation (never on an unrelated
 * `controlling` event), which is what prevents reload loops.
 *
 * "Later" just leaves `waitingWorker` set and the banner hidden for this
 * mount — since this component lives in the root layout and layouts don't
 * remount on client-side navigation, that's naturally "for the rest of this
 * session"; a full page load remounts it fresh, and the same waiting worker
 * (still waiting, since we never skip it) reappears there.
 */
export default function ServiceWorkerManager() {
  const [hasWaitingWorker, setHasWaitingWorker] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const serwistRef = useRef<import('@serwist/window').Serwist | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let cancelled = false

    import('@serwist/window').then(({ Serwist }) => {
      if (cancelled) return
      const serwist = new Serwist('/sw.js')
      serwistRef.current = serwist

      serwist.addEventListener('waiting', () => setHasWaitingWorker(true))

      void serwist.register()
    })

    return () => {
      cancelled = true
    }
  }, [])

  function applyUpdate() {
    const serwist = serwistRef.current
    if (!serwist) return
    setUpdating(true)
    // Only listen for controllerchange now, in direct response to the
    // user's click — a stray earlier `controlling` event (e.g. from the
    // very first install) must never trigger a reload.
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    serwist.messageSkipWaiting()
  }

  if (!hasWaitingWorker || dismissed) return null

  return (
    <div role="status" style={bannerStyle}>
      <RefreshCw size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>גרסה חדשה של המערכת זמינה.</span>
      <Button size="sm" variant="primary" disabled={updating} onClick={applyUpdate}>
        {updating ? 'מעדכן…' : 'עדכן עכשיו'}
      </Button>
      <Button size="sm" variant="ghost" disabled={updating} onClick={() => setDismissed(true)}>
        מאוחר יותר
      </Button>
    </div>
  )
}

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  insetInlineStart: 16,
  insetInlineEnd: 16,
  bottom: 'calc(16px + env(safe-area-inset-bottom))',
  zIndex: 2500,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  maxWidth: 480,
  marginInlineStart: 'auto',
  padding: '12px 16px',
  borderRadius: 14,
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--separator, #E5E7EB)',
  boxShadow: 'var(--shadow-hover, 0 8px 28px rgba(15,25,41,0.12))',
  fontFamily: 'var(--font-main, sans-serif)',
  fontSize: 13.5,
  color: 'var(--text-heading, #111827)',
}
