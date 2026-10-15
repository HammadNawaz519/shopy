#!/usr/bin/env node
/**
 * SHOPY startup / navigation timing probe (production server only).
 *
 * Run against `next start` (NOT the dev server) — usage:
 *   node scripts/measure-startup.mjs [baseURL]   (default http://localhost:3000)
 *
 * Measures, with a browser-realistic Accept header and no cookies:
 *   - COLD  : first request after server start (lambda/process cold — TTFB
 *             includes SSR data lookups against the live Redis/PG).
 *   - WARM  : repeated requests (ISR/Redis hot path).
 *   - NAV   : client-side navigation cost — the App Router "flight" request
 *             the browser makes when tapping a link (RSC: 1 header).
 *
 * Reports TTFB + total time + document bytes, and the /api/navigation request
 * count proxy: how many bytes /api/navigation returned (we only count the
 * endpoint's latency; the SSR-removal win is that the page HTML no longer
 * requires it).
 */

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

async function timeFetch(path, headers = {}, label = path) {
  const t0 = Date.now();
  let ttfb = null;
  const res = await fetch(base + path, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
      ...headers,
    },
  });
  const timer = setTimeout(() => {}, 0); // keep process alive during stream
  const reader = res.body.getReader();
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value?.length || 0;
    if (ttfb === null) ttfb = Date.now() - t0;
  }
  clearTimeout(timer);
  const total = Date.now() - t0;
  console.log(
    `  ${label.padEnd(28)} status=${res.status}  TTFB=${ttfb}ms  total=${total}ms  bytes=${(bytes / 1024).toFixed(1)}KB`
  );
  return { status: res.status, ttfb, total, bytes };
}

// Discover a real product id from the API so the product-page nav test is
// valid even if the catalog changed.
async function findProductId() {
  try {
    const res = await fetch(base + "/api/products");
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.products?.[0];
    return p?.id || null;
  } catch {
    return null;
  }
}

const productId = await findProductId();
console.log(`Base: ${base}\n`);

console.log("COLD (first hits — SSR + data lookups):");
const coldHome = await timeFetch("/", {}, "GET / (cold)");
const warmHome = await timeFetch("/", {}, "GET / (warm)");
const warmHome2 = await timeFetch("/", {}, "GET / (warm #2)");
await timeFetch("/products", {}, "GET /products (warm)");
if (productId) {
  await timeFetch(`/product/${productId}`, {}, "GET /product/" + productId + " (warm)");
  // Client-side navigation: App Router flight request (what a Link tap does).
  await timeFetch(
    `/product/${productId}`,
    { rsc: "1", "next-router-prefetch": "1" },
    "flight /product/" + productId + " (tap)"
  );
  await timeFetch("/", { rsc: "1", "next-router-prefetch": "1" }, "flight / (tap)");
}
await timeFetch("/api/navigation", {}, "GET /api/navigation");

const avg = (a, b, c) => Math.round((a + b + c) / 3);
console.log(`\nSummary: home TTFB cold=${coldHome.ttfb}ms  warm=${avg(warmHome.ttfb, warmHome2.ttfb, warmHome.ttfb)}ms  doc=${(coldHome.bytes / 1024).toFixed(1)}KB`);
