/**
 * KILL SWITCH — not part of the normal build, not registered by default.
 *
 * A deployed service worker persists on users' devices after the app code
 * is reverted; `git revert` does not remove it. If the PWA ever needs to be
 * turned off for everyone, deploy THIS FILE in place of the live worker (see
 * README-pwa-rollback.md for the exact steps). Any client still holding the
 * old service worker will fetch this on its next update check, install it,
 * and on activation it deletes every cache this app created and unregisters
 * itself — after that the site behaves as a normal, non-PWA site again.
 *
 * Full procedure: PWA-ROLLBACK.md in the repo root.
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      await self.registration.unregister()

      const clientsList = await self.clients.matchAll({ type: 'window' })
      for (const client of clientsList) {
        client.navigate(client.url)
      }
    })(),
  )
})
