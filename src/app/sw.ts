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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
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
