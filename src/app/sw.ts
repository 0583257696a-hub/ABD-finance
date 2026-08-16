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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST?.filter(entry => !isExcludedFromPrecache(entry)),
  // Phase 9 (update strategy): the app controls activation via a user-confirmed
  // prompt — a newly installed worker must never take over automatically.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
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

serwist.addEventListeners()

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
