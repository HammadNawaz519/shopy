// SHOPY Enhanced Service Worker — production-safe, offline-first app shell.
//
// Design goals (see PWA spec):
//   - PAINT FIRST: serve the cached app shell immediately on repeat/offline launch.
//   - REFRESH: stale-while-revalidate public data in the background.
//   - AUTH IS SERVER-AUTHORITATIVE: never cache sensitive auth responses; when
//     offline the app layer (IndexedDB) supplies the last-known user.
//   - NEVER fake anything: mutations (POST/PATCH/DELETE), admin, checkout and
//     payment/order endpoints are always network-only — offline they simply fail
//     rather than invent data.
//
// Cache namespaces are versioned. On activation we delete any cache that no
// longer belongs to the current version (including legacy `shopy-atelier-*` and
// older `shopy-pwa-v*` caches) without touching unrelated browser storage.

const CACHE_NAMESPACE = 'shopy-pwa';
const VERSION = 'v2';

const CACHE_NAMES = {
  // Immutable, content-hashed build assets: cache-first.
  STATIC: `${CACHE_NAMESPACE}-${VERSION}-static`,
  // Fresh-but-tolerant resources (public APIs, optimized images): SWR.
  RUNTIME: `${CACHE_NAMESPACE}-${VERSION}-runtime`,
  // App-shell HTML documents: network-first with cached-shell fallback.
  PAGES: `${CACHE_NAMESPACE}-${VERSION}-pages`,
  // App Router RSC flight payloads (client-side navigations/prefetches).
  // Dedicated cache because caches match by URL+method ONLY (headers ignored),
  // so a route's HTML document and its flight payload must live apart.
  FLIGHT: `${CACHE_NAMESPACE}-${VERSION}-flight`,
};

// Minimal precache (the app shell). Kept small and correct: only URLs that are
// guaranteed to exist. Sub-resources fill in on first load via runtime caching.
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/logo.svg',
];

// Endpoints that must ALWAYS hit the network and are NEVER cached. These are
// the places where caching could leak or fabricate data:
//   - /api/admin/*  : admin data (never a shared cache)
//   - /api/auth/*   : session validation (server stays authoritative)
//   - /api/cart, /api/orders : user-scoped / payment-critical (offline state is
//                              held in user-scoped IndexedDB, not the SW)
//   - /account, /admin, /checkout : session-gated / payment pages
const NEVER_CACHE = [
  /^\/api\/admin/,
  /^\/api\/auth/,
  /^\/api\/cart/,
  /^\/api\/orders/,
  /^\/account/,
  /^\/admin/,
  /^\/checkout/,
];

// Public, GET-safe endpoints that may be served stale-while-revalidate.
const SWR_PUBLIC_APIS = [
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/collections/,
  /^\/api\/homepage/,
  /^\/api\/navigation/,
  /^\/api\/settings\/payment/,
  /^\/api\/reviews/,
  /^\/api\/search/,
  /^\/api\/discounts/,
];

// --- Install: precache the shell without letting one failure abort the rest ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_URLS.map((path) => {
          if (path === '/') {
            return cache.add(new Request('/', { credentials: 'same-origin' }));
          }
          return cache.add(new Request(path, { credentials: 'same-origin' }));
        })
      );
      // Signal success even if an individual asset 404'd — install must not fail
      // on a single missing file.
    })
  );
});

// --- Activate: clean up stale caches, claim clients, warm public data ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const current = Object.values(CACHE_NAMES);
      const all = await caches.keys();
      await Promise.all(
        all
          .filter(
            (name) =>
              // Remove any of our caches that aren't the current version, plus
              // any legacy SHOPY caches, while leaving unrelated caches alone.
              (name.startsWith(CACHE_NAMESPACE) && !current.includes(name)) ||
              name.startsWith('shopy-atelier-')
          )
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      await warmUpCriticalData().catch(() => {});
    })()
  );
});

// --- Fetch ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only same-origin GETs are eligible for any caching decision. Everything
  // else (POST/PATCH/DELETE, cross-origin, other methods) is left untouched so
  // it always reaches the network — mutations and checkouts can never be faked.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never-cache list: sensitive, user-scoped, admin, checkout. Pass through so
  // the network is authoritative and nothing is served from a shared cache.
  if (NEVER_CACHE.some((p) => p.test(url.pathname))) {
    return;
  }

  // Immutable build assets, fonts, and local media: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.STATIC));
    return;
  }

  // Optimized images (/_next/image): stale-while-revalidate so new product
  // imagery appears while remaining usable offline.
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(staleWhileRevalidate(event, request, CACHE_NAMES.RUNTIME));
    return;
  }

  // Public data APIs: stale-while-revalidate.
  if (SWR_PUBLIC_APIS.some((p) => p.test(url.pathname))) {
    if (url.pathname === '/api/navigation') {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(staleWhileRevalidate(event, request, CACHE_NAMES.RUNTIME));
    return;
  }

  // App Router flight data: the client router GETs each route path again with
  // an `RSC: 1` (real navigation) or `Next-Router-Prefetch: 1` header to fetch
  // that page's serialized React payload. Without a cache entry for a route,
  // an offline tap falls back to a full reload and bounces to the cached home
  // shell — the exact "clicking a product takes me back home" bug. Cache these
  // stale-while-revalidate so client-side navigation works fully offline.
  const isFlightRequest =
    (request.headers.get('Next-Router-Prefetch') || request.headers.get('RSC')) &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/_next') &&
    !url.pathname.startsWith('/uploads/');
  if (isFlightRequest) {
    event.respondWith(staleWhileRevalidate(event, request, CACHE_NAMES.FLIGHT));
    return;
  }

  // HTML navigation: network-first, fall back to the cached app shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(navigateWithShellFallback(request, CACHE_NAMES.PAGES));
    return;
  }

  // Default (misc same-origin GETs): network-first with cache fallback.
  event.respondWith(networkFirst(request, CACHE_NAMES.RUNTIME));
});

// --- Helpers ---

// A "static asset" is a same-origin resource that is safe to serve cache-first:
// hashed build chunks, fonts, and local media/icons. API routes and the image
// optimizer are excluded here (handled separately) so dynamic data is never
// misclassified as an immutable file.
function isStaticAsset(url) {
  const p = url.pathname;
  if (p.startsWith('/api/')) return false;
  if (p.startsWith('/_next/image')) return false;
  if (p.startsWith('/_next/static/')) return true;
  if (p.startsWith('/uploads/')) return true;
  if (p.match(/\.(png|jpe?g|svg|webp|avif|ico|woff2?|ttf|otf|json|css|js)$/i)) {
    return true;
  }
  return false;
}

// --- Strategies ---

// Cache-first with background revalidation and network fallback.
function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) {
      // Opportunistically refresh; never block on it.
      const refresh = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            caches.open(cacheName).then((cache) => cache.put(request, res.clone())).catch(() => {});
          }
        })
        .catch(() => {});
      return cached;
    }
    return fetch(request)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(cacheName).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => cached || new Response('', { status: 503 }));
  });
}

// Network-first with cache fallback (for content that should stay fresh but
// still work offline).
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((res) => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone)).catch(() => {});
      }
      return res;
    })
    .catch(() =>
      caches.match(request).then(
        (cached) =>
          cached ||
          new Response('', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
      )
    );
}

// Stale-while-revalidate: answer instantly from cache, refresh in the
// background; if there's no cache yet, wait for the network once.
function staleWhileRevalidate(event, request, cacheName) {
  const cachedPromise = caches.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone)).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  // Never let the background refresh block the response.
  if (event && event.waitUntil) {
    event.waitUntil(refresh);
  }

  return cachedPromise.then((cached) => {
    if (cached) return cached;
    return refresh.then((fresh) => fresh || new Response('', { status: 503 }));
  });
}

// Navigation: try the network, and when offline (or the exact page was never
// cached) serve the cached app shell so the SPA still boots and can hydrate from
// its own local data. When the served document is NOT the requested url (i.e.
// the fallback shell, or an ignoreSearch variant), inject the intended target
// so the SPA can re-route to it on boot — offline deep links stop bouncing to
// the home page.
function navigateWithShellFallback(request, cacheName) {
  const target = new URL(request.url);
  const requestedPath = target.pathname + target.search;
  return fetch(request)
    .then((res) => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone)).catch(() => {});
      }
      return res;
    })
    .catch(() =>
      caches
        .match(request)
        .then((cached) => cached || caches.match(request, { ignoreSearch: true }))
        .then((cached) => cached || caches.match('/', { ignoreSearch: true }))
    )
    .then((document) => {
      if (!document) {
        return new Response('You are offline. Reconnect to continue.', {
          status: 503,
          headers: { 'Content-Type': 'text/html' },
        });
      }
      const documentPath = new URL(document.url, request.url).pathname +
        new URL(document.url, request.url).search;
      // Only rewrite when the document is a stand-in for a different url.
      if (documentPath !== requestedPath) {
        return injectOfflineTarget(document, requestedPath);
      }
      return document;
    });
}

// Rewrite the cached HTML so the SPA knows where the user actually wanted to
// go. The injected script sets window.__shopyOfflineTarget; the client reads
// it on boot, router.replace()s to the target (served from the FLIGHT cache
// when offline) and clears the flag so it only ever fires once.
function injectOfflineTarget(response, targetPath) {
  return response
    .clone()
    .text()
    .then((html) => {
      const script = `<script>window.__shopyOfflineTarget=${JSON.stringify(targetPath)};</script>`;
      const body = html.includes('</head>')
        ? html.replace('</head>', `${script}</head>`)
        : script + html;
      const headers = new Headers(response.headers);
      headers.delete('Content-Length');
      headers.set('Content-Type', 'text/html');
      return new Response(body, { status: 200, headers });
    })
    .catch(() => response);
}

// --- Warm up public data on activation (best-effort, never fatal) ---
async function warmUpCriticalData() {
  const endpoints = ['/api/categories', '/api/homepage', '/api/navigation', '/api/products'];
  await Promise.allSettled(
    endpoints.map((path) =>
      fetch(path, { credentials: 'same-origin' }).then((res) => {
        if (res && res.ok) {
          return caches.open(CACHE_NAMES.RUNTIME).then((cache) => cache.put(new Request(path), res.clone()));
        }
      })
    )
  );
}

// --- Offline catalog warming (driven by the client, runs while online) ---
// Caches each route in two shapes:
//   PAGES  : the HTML document   → covers cold open / deep link / full reloads
//   FLIGHT : the RSC payload     → covers client-side router navigation
// Both are only useful AFTER a fresh online fetch, so this is never run when
// the network is down — warming always stores the freshest data.
async function warmOfflinePaths(paths) {
  const pageCache = await caches.open(CACHE_NAMES.PAGES);
  const flightCache = await caches.open(CACHE_NAMES.FLIGHT);
  let warmed = 0;
  let failed = 0;
  await Promise.allSettled(
    paths.map(async (path) => {
      // 1. HTML document (for navigations and deep links).
      try {
        const htmlRes = await fetch(path, { method: 'GET', credentials: 'same-origin' });
        if (htmlRes && htmlRes.ok) {
          await pageCache.put(path, htmlRes.clone());
        }
      } catch {
        /* offline path — never fatal */
      }
      // 2. RSC flight payload (for in-app router navigation).
      try {
        const flightReq = new Request(path, {
          headers: { RSC: '1', 'Next-Router-Prefetch': '1' },
        });
        const flightRes = await fetch(flightReq, { credentials: 'same-origin' });
        if (flightRes && flightRes.ok) {
          await flightCache.put(path, flightRes.clone());
          warmed += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    })
  );
  return { warmed, failed };
}

// --- Messaging: let the app control updates and cache lifecycle ---
self.addEventListener('message', (event) => {
  const { data } = event || {};
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Client asks to warm the offline catalog: for each path cache BOTH the HTML
  // document (deep links / full reloads while offline) and the RSC flight
  // payload (client-side navigation while offline). Runs in the background;
  // progress is posted back on the returned port or as regular messages.
  if (data.type === 'WARM_OFFLINE' && Array.isArray(data.paths)) {
    warmOfflinePaths(data.paths).then((result) => {
      event.source &&
        event.source.postMessage({
          type: 'WARM_OFFLINE_RESULT',
          warmed: result.warmed,
          failed: result.failed,
        });
    });
    return;
  }

  if (data.data && data.data.type === 'CLEAR_CACHE') {
    // Only clear SHOPY-owned caches; never touch unrelated browser storage.
    const owned = caches
      .keys()
      .then((names) =>
        names.filter((n) => n.startsWith(CACHE_NAMESPACE) || n.startsWith('shopy-atelier-'))
      )
      .then((names) => Promise.all(names.map((n) => caches.delete(n))));

    Promise.resolve(owned)
      .then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
      .catch(() => {});
  }
});

// --- Background sync hook (reserved; order creation is intentionally NOT queued) ---
self.addEventListener('sync', (event) => {
  // We intentionally do not implement offline order/checkout submission.
  // This hook exists only so the protocol is available for safe future use.
  if (event.tag === 'sync-cart') {
    // No-op: cart reconciliation is handled by the app layer over the
    // server-authoritative /api/cart endpoint when connectivity returns.
  }
});
