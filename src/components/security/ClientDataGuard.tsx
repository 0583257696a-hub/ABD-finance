'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'

const LAST_ACTIVE_KEY = 'abd_last_active_at'
const IDLE_TIMEOUT_MS = 20 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 10_000
const CHECK_INTERVAL_MS = 30_000

// Client-data-bearing keys beyond what resetWorkspace() already clears
// (compound/Phoenix simulation inputs are seeded from a specific client's
// real numbers; returns favorites reference a specific client's fund IDs).
// Pure UI prefs (column widths, active-tab memory, sidebar collapse) are
// deliberately left alone — clearing those on every timeout would just be
// friction with no privacy benefit.
const EXTRA_CLIENT_DATA_KEYS = [
  'abd_next_simulations_compound_inputs',
  'abd_next_phoenix_inputs',
  'abd_next_phoenix_selected_parts',
  'abd_returns_favorites',
]

const EXEMPT_PATH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/client-form', '/pending-approval']

/**
 * Enforces two things wherever client data is loaded in the workspace:
 *
 * 1. Idle/away timeout — if 20 minutes pass with no activity (whether the
 *    tab stayed open unattended, or the browser was closed and reopened
 *    later), force a fresh login and clear the loaded client's data. A
 *    5-minute absence does neither, since lastActiveAt is a persisted
 *    (localStorage) timestamp checked on focus/visibility, not reset by
 *    closing the tab itself.
 * 2. A native "leave site?" warning on tab/browser close while data is
 *    loaded. This is the browser's own generic prompt — the web platform
 *    does not allow a page to add custom buttons (e.g. a real "Save") to
 *    that dialog; it exists specifically to prevent sites from doing that.
 */
export default function ClientDataGuard() {
  const hasClientData = useWorkspaceStore(state => state.hydrated && (state.funds.length > 0 || Boolean(state.client)))
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace)
  const pathname = usePathname()
  const lastThrottleRef = useRef(0)
  const isExempt = EXEMPT_PATH_PREFIXES.some(prefix => pathname?.startsWith(prefix))

  useEffect(() => {
    if (isExempt) return

    function markActive() {
      const now = Date.now()
      if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return
      lastThrottleRef.current = now
      localStorage.setItem(LAST_ACTIVE_KEY, String(now))
    }

    if (!localStorage.getItem(LAST_ACTIVE_KEY)) markActive()

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    activityEvents.forEach(evt => window.addEventListener(evt, markActive, { passive: true }))

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, markActive))
    }
  }, [isExempt])

  useEffect(() => {
    if (isExempt || !hasClientData) return

    function forceReauth() {
      EXTRA_CLIENT_DATA_KEYS.forEach(key => localStorage.removeItem(key))
      resetWorkspace()
      localStorage.removeItem(LAST_ACTIVE_KEY)
      window.location.href = '/api/auth/logout'
    }

    function checkIdle() {
      const last = Number(localStorage.getItem(LAST_ACTIVE_KEY) || Date.now())
      if (Date.now() - last > IDLE_TIMEOUT_MS) forceReauth()
    }

    // Catches "was closed/backgrounded past the timeout, just reopened".
    checkIdle()

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') checkIdle()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onVisibilityChange)

    // Catches "left the tab open and visible, but genuinely idle" — a real
    // unattended-session risk, not just a literal close.
    const interval = setInterval(checkIdle, CHECK_INTERVAL_MS)

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onVisibilityChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
      clearInterval(interval)
    }
  }, [isExempt, hasClientData, resetWorkspace])

  return null
}
