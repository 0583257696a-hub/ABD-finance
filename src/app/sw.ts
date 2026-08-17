/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker'
import { NetworkOnly, Serwist } from 'serwist'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/**
 * Excludes files from the precache that Cloudflare's ASSETS binding sweeps
 * up as public/ files but never actually serves (public/_headers is
 * Cloudflare's own header-config convention, consumed as build metadata —
 * requesting it 404s), plus non-app assets that shouldn't be precached at
 * all (the icon-generation source material, the kill switch).
 *
 * This has to filter the final self.__SW_MANIFEST here, not via
 * next.config.ts's manifestTransforms — @serwist/next appends its own
 * public-directory-scanning transform AFTER whatever manifestTransforms is
 * passed in, so entries it adds never pass through a transform placed
 * there. self.__SW_MANIFEST is what's left after every transform has run.
 *
 * Confirmed via live production debugging: precaching public/_headers 404s,
 * and that thrown error silently hangs the whole install forever instead of
 * failing loudly — a real bug in @serwist/utils's parallel() helper (an
 * async function used directly as a Promise executor drops the rejection
 * instead of propagating it, so Promise.all(queues) never settles).
 */
function isExcludedFromPrecache(entry: PrecacheEntry | string): boolean {
  const rawUrl = typeof entry === 'string' ? entry : entry.url
  const url = rawUrl.replace(/\\/g, '/')
  if (url === '/_headers' || url === '/_redirects') return true
  if (url.startsWith('/brand-source/')) return true
  if (url === '/sw-kill-switch.js') return true
  return false
}

/**
 * Bump this whenever a deploy MUST reach every user immediately. Old
 * clients keep serving whatever their installed worker cached; a new
 * worker only replaces it once it activates. On activate we purge every
 * cache belonging to a different version, then reload open clients — so a
 * user on a stale build is pulled forward automatically on their next
 * navigation, with no "update now" prompt they'd have to notice.
 */
const APP_CACHE_VERSION = '2026-08-17-3'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST?.filter(entry => !isExcludedFromPrecache(entry)),
  // A newly installed worker takes over immediately. The earlier
  // "wait for user confirmation" model (skipWaiting: false + update banner)
  // left users stranded on stale builds indefinitely — old cached pages
  // don't even run the new banner code, so nobody ever saw the prompt.
  // Any deploy in a live-in-use app must reach everyone on their next load.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  cacheId: `smart-meeting-${APP_CACHE_VERSION}`,
  runtimeCaching: [
    // Every /api/* route in this app is either authenticated/personal (funds,
    // meetings, calendar status, meeting-summaries, AI drafts) or mutating.
    // defaultCache's generic /api/* rule below caches GET responses for 24h,
    // which is unsafe here — this NetworkOnly entry matches first and
    // overrides it. /api/client-form-public/[token] is the one genuinely
    // public GET, and it's single-use/time-sensitive anyway, so it's correct
    // to leave it uncached too.
    {
      matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    // Authenticated HTML shell — never serve from cache. defaultCache's
    // NetworkFirst-with-cache-fallback for HTML meant a user whose session
    // was dead (expired, logged out elsewhere, or a session cutover) still
    // got the cached authenticated chrome rendered, with every API call
    // underneath it 401ing. Navigations for app pages must always reach the
    // server so its auth redirect actually runs; the /offline fallback
    // (precached) still covers the genuinely-offline case via `fallbacks`.
    {
      matcher: ({ request, sameOrigin, url: { pathname } }) =>
        sameOrigin && request.mode === 'navigate' && !pathname.startsWith('/client-form/') && pathname !== '/offline',
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

// On activation: delete every cache that isn't ours for THIS version — that
// covers Serwist's default-named caches from earlier builds, the old
// un-namespaced precache, and anything a previous worker left behind.
//
// Deliberately does NOT reload/navigate clients from here. The page reloads
// itself exactly once on `controllerchange` (ServiceWorkerManager); having
// the worker ALSO navigate clients produced a reload loop — worker navigates
// → fresh page's controllerchange reloads again → clientsClaim on that load
// fires controllerchange once more → …  One reload source only.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = `smart-meeting-${APP_CACHE_VERSION}`
    const names = await caches.keys()
    await Promise.all(names.filter(name => !name.includes(keep)).map(name => caches.delete(name)))
  })())
})

serwist.addEventListeners()

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
