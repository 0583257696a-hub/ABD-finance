'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker (production only) and keeps every client on
 * the current build.
 *
 * Model: a new worker activates immediately (skipWaiting in sw.ts), purges
 * old caches, and reloads open tabs itself. This component's job is just to
 * register, keep checking for updates while the tab stays open, and honor
 * an explicit reload request from the worker. There is deliberately no
 * "update now / later" prompt anymore — the earlier prompt-based model left
 * users stranded on stale builds indefinitely, because a stale cached page
 * never runs the new prompt code in the first place.
 */
export default function ServiceWorkerManager() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let cancelled = false
    let registration: ServiceWorkerRegistration | undefined

    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'RELOAD_FOR_UPDATE') window.location.reload()
    }
    navigator.serviceWorker.addEventListener('message', onMessage)

    // Belt-and-braces: when the controlling worker changes (a new build took
    // over), reload once so this tab is running the fresh assets.
    let refreshing = false
    function onControllerChange() {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    import('@serwist/window').then(async ({ Serwist }) => {
      if (cancelled) return
      const serwist = new Serwist('/sw.js')
      registration = await serwist.register()
      // Re-check for a newer worker periodically while the tab stays open,
      // so long-lived tabs don't sit on an old build until a full reload.
      const interval = setInterval(() => void registration?.update(), 60 * 60 * 1000)
      if (cancelled) clearInterval(interval)
    })

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('message', onMessage)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
