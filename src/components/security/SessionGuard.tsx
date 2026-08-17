'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const EXEMPT_PATH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/client-form', '/pending-approval', '/offline']

/**
 * Bounces a tab whose session is dead to the login page.
 *
 * Why the server-side redirect in the dashboard layout isn't enough: the
 * PWA service worker serves the app shell for "/" from cache
 * (NetworkFirst-with-cache-fallback for HTML). So a user whose session
 * has been invalidated — expired, logged out elsewhere, or a deliberate
 * session-generation cutover — can still get the cached authenticated
 * chrome rendered, and then every API call underneath it 401s. That is
 * exactly the "401 on חיבורי יומן with the page otherwise showing" state.
 * This checks the real session on mount and on tab focus, and hard-redirects
 * to /login (a full navigation, so it goes through the network and lands
 * on the fresh build) the moment it's gone.
 */
export default function SessionGuard() {
  const pathname = usePathname()
  const isExempt = EXEMPT_PATH_PREFIXES.some(prefix => pathname?.startsWith(prefix))

  useEffect(() => {
    if (isExempt) return
    let cancelled = false

    async function check() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' })
        if (!response.ok) return
        const session = await response.json() as { user?: { email?: string } }
        if (!cancelled && !session?.user?.email) {
          window.location.href = '/login?error=session-expired'
        }
      } catch { /* network blip — don't bounce on a transient error */ }
    }

    void check()
    function onVisible() {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [isExempt, pathname])

  return null
}
