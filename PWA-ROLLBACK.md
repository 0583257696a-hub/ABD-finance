# PWA rollback / kill switch

A deployed service worker persists on users' devices after the app code is
reverted or the branch is rolled back — `git revert` alone does **not**
remove it from anyone's browser. If the PWA needs to be turned off for
everyone, follow this procedure.

## Why a code revert alone doesn't work

Once a user's browser has installed `public/sw.js`, that worker keeps
running and keeps intercepting requests on every future visit — checking
for updates, but continuing to serve from its own cache — regardless of
what the currently-deployed app code looks like. Removing the PWA code from
the repo does not reach into users' browsers and remove the worker they
already have.

## Rollback steps

1. **Deploy the kill switch in place of the live worker.** The file is
   `public/sw-kill-switch.js`, already committed. Copy it over the live
   `public/sw.js` (or update the build so `public/sw.js` is generated *from*
   `sw-kill-switch.js` instead of `src/app/sw.ts`) and deploy normally.
2. **Confirm the cache headers on `/sw.js` are still in effect** —
   `Cache-Control: no-cache, no-store, must-revalidate` (set via
   `public/_headers` — `/sw.js` is served as a static asset directly by
   Cloudflare's ASSETS binding, which bypasses next.config.ts's `headers()`
   entirely; that's why this lives in `_headers` and not there). This is
   what guarantees browsers re-fetch the file
   promptly instead of serving a stale cached copy of the *old* worker
   indefinitely. Without this, some clients could take far longer to pick
   up the kill switch.
3. **Wait for propagation.** Each open tab picks up the new `/sw.js` on its
   own update-check cadence (the browser checks roughly every 24h, or
   sooner if the user navigates and the previous worker's `waiting` logic
   fires). There is no way to force this remotely for a already-open tab
   that a user hasn't returned to.
4. **What happens automatically once a client gets it:** the kill switch
   installs, skips waiting immediately, and on activation deletes every
   cache this app created and unregisters itself. The next navigation is a
   normal network request — no service worker, no PWA behavior.
5. **Revert the app code** (remove the Serwist integration, manifest, icons,
   prompts — or `git revert` the relevant commits) once you're not
   depending on the kill switch being live anymore. This is independent of
   step 1–4 and only affects *new* installs going forward.

## Local/dev unregister (for debugging, not a real rollback)

In any browser's devtools:

```js
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
caches.keys().then(names => names.forEach(name => caches.delete(name)))
```

Or: DevTools → Application → Service Workers → Unregister, and
Application → Storage → Clear site data.
