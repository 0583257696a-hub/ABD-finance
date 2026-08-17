'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker (production only) and keeps every client on
 * the current build.
 *
 * Model: a new worker activates immediately (skipWaiting in sw.ts) and
 * purges old caches. This component reloads the tab ONCE when a new worker
 * takes over — and only for a genuine upgrade. It must never reload on the
 * very first install: `clientsClaim` on a fresh page fires `controllerchange`
 * too (controller goes from null → the new worker), and reloading on that
 * produced a reload loop. So we only reload if there was already a
 * controller before the change (i.e. an old build was in charge).
 */
export default function ServiceWorkerManager() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let cancelled = false
    let registration: ServiceWorkerRegistration | undefined
    let interval: ReturnType<typeof setInterval> | undefined

    // Snapshot whether a worker was already controlling this page BEFORE we
    // register. Only that case is a real upgrade worth reloading for.
    const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller)
    let reloaded = false

    function onControllerChange() {
      if (reloaded || !hadControllerAtLoad) return
      reloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    import('@serwist/window').then(async ({ Serwist }) => {
      if (cancelled) return
      const serwist = new Serwist('/sw.js')
      registration = await serwist.register()
      // Re-check for a newer worker periodically while the tab stays open,
      // so long-lived tabs don't sit on an old build until a full reload.
      interval = setInterval(() => void registration?.update(), 60 * 60 * 1000)
      if (cancelled) clearInterval(interval)
    })

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
