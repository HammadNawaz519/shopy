/**
 * SHOPY instant-launch shell builder.
 *
 * Produces `cap-shell/` — the APK-local landing page — from the EXISTING app:
 *   - reuses components/home/* + components/layout/* verbatim (esbuild
 *     aliases next/image, next/link, next/navigation to local-shell shims,
 *     and the @/* path alias to the repo root)
 *   - reuses app/globals.css through the SAME Tailwind/PostCSS pipeline the
 *     web app uses, so the generated utilities are identical
 *   - self-hosts the two brand fonts from the .next build's own woff2 files
 *   - bundles the landing images from public/ next to the shell root so the
 *     components' absolute "/asset.jpg" URLs resolve inside the APK
 *   - embeds a data snapshot: live production data when reachable at build
 *     time, otherwise the static catalog fallback
 *   - inlines the current build's immutable asset paths so the shell can
 *     pre-warm the live app's HTTP cache ahead of handoff
 *
 * Run order (see package.json):
 *   npm run build                 # next build (fonts land in .next/static)
 *   node scripts/build-cap-shell.mjs
 *   npx cap sync android          # webDir = cap-shell
 */
import {
  readFileSync,
  readdirSync,
  statSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT = path.join(ROOT, "cap-shell");
const PROD_URL = (process.env.SHOPY_PROD_URL || "https://buyatshopy.vercel.app").replace(/\/$/, "");

function log(...args) {
  console.log("[cap-shell]", ...args);
}

/** Resolve "@/..." imports to the repo root for every esbuild invocation. */
function repoPathsPlugin() {
  return {
    name: "shopy-repo-paths",
    setup(build) {
      build.onResolve({ filter: /^@\// }, (args) => {
        return {
          path: path.join(ROOT, args.path.slice(2)),
          kind: args.kind,
          external: false,
        };
      });
    },
  };
}

async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Extract the @font-face rules for the two brand families out of the
 *  production build's CSS and point them at the copied local woff2 files. */
function buildFontsCss() {
  const cssDir = path.join(ROOT, ".next/static/css");
  const mediaDir = path.join(ROOT, ".next/static/media");
  if (!existsSync(cssDir) || !existsSync(mediaDir)) {
    throw new Error("Missing .next build output — run `npm run build` first.");
  }
  const fontsOutDir = path.join(OUT, "fonts");
  mkdirSync(fontsOutDir, { recursive: true });

  let css = "";
  for (const file of readdirSync(cssDir)) {
    if (!file.endsWith(".css")) continue;
    css += readFileSync(path.join(cssDir, file), "utf8");
  }

  const blocks = css.match(/@font-face\{[^}]*\}/g) || [];
  // next/font registers the families under hashed internal names; the shell
  // CSS addresses them by their public names, so rewrite on extraction.
  const cormorantName = /__Cormorant_Garamond_[0-9a-f]+/;
  const jakartaName = /__Plus_Jakarta_Sans_[0-9a-f]+/;
  const seenFonts = new Set();
  const out = [];
  for (const block of blocks) {
    const familyMatch = block.match(/font-family:([^;]+);/);
    const family = familyMatch ? familyMatch[1].trim() : "";
    const isCormorant = cormorantName.test(family);
    const isJakarta = jakartaName.test(family);
    // Keep the real font-face rules; drop the metric-fallback (src:local) ones.
    if ((!isCormorant && !isJakarta) || block.includes("src:local(")) continue;
    let rule = block
      .replace(cormorantName, '"Cormorant Garamond"')
      .replace(jakartaName, '"Plus Jakarta Sans"');
    const urlMatch = block.match(/url\(([^)"]+)\)/);
    if (urlMatch) {
      const mediaFile = urlMatch[1].replace(/^\/_next\//, "");
      const base = path.basename(mediaFile);
      // The original src points at the .next layout; point it at the shell
      // root's /fonts/ copy instead.
      rule = rule.replace(/url\([^)]*\)/, `url("/fonts/${base}")`);
      const src = path.join(ROOT, ".next", mediaFile);
      const dest = path.join(fontsOutDir, base);
      if (existsSync(src) && !seenFonts.has(dest)) {
        copyFileSync(src, dest);
        seenFonts.add(dest);
      }
    }
    out.push(rule);
  }
  if (out.length === 0) {
    throw new Error("No @font-face rules found in .next/static/css — font config changed?");
  }
  writeFileSync(path.join(OUT, "fonts.css"), out.join("\n"));
  log(`fonts.css written (${out.length} rules, ${seenFonts.size} woff2 files)`);
}

/** Bundle the images the landing page can reference, at the shell root so
 *  the components' absolute "/hero-beige.jpg" style URLs resolve as-is. */
function bundleLandingImages() {
  const names = [
    "logo.svg",
    "logo.png",
    "shopy-logo-square.svg",
    "shopy-dark-label.svg",
    "hero-beige.jpg",
    "hero-beige-portrait.jpg",
    "hero-beige-male.jpg",
    "hero-luxury.jpg",
    "hero-headless-v1.jpg",
    "category-tops.jpg",
    "category-bottoms.jpg",
    "category-footwear.jpg",
    "category-fragrances.jpg",
    "category-coord-sets.jpg",
    "category-accessories.jpg",
    "editorial-craft.jpg",
    "atelier-still-life.jpg",
    "product-knit-cardigan.jpg",
    "product-linen-overshirt.jpg",
    "product-linen-pants.jpg",
  ];
  let copied = 0;
  for (const name of names) {
    const src = path.join(ROOT, "public", name);
    if (existsSync(src) && !existsSync(path.join(OUT, name))) {
      copyFileSync(src, path.join(OUT, name));
      copied++;
    }
  }
  // Snapshot-referenced images that live in public/ get bundled too.
  const manifestPath = path.join(OUT, "image-manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const extra = JSON.parse(readFileSync(manifestPath, "utf8"));
      for (const ref of extra) {
        const base = String(ref).replace(/^.*\//, "");
        const src = path.join(ROOT, "public", base);
        const dest = path.join(OUT, base);
        if (existsSync(src) && !existsSync(dest)) {
          copyFileSync(src, dest);
          copied++;
        }
      }
    } catch {
      /* optional manifest */
    }
  }
  rmSync(manifestPath, { force: true });
  log(`images: ${copied} files bundled at shell root`);
}

async function buildSnapshot() {
  let snapshot;
  let source = "live";
  try {
    const [home, cats, prods, nav, quote] = await Promise.all([
      fetchJson(`${PROD_URL}/api/homepage`).catch(() => null),
      fetchJson(`${PROD_URL}/api/categories`).catch(() => null),
      fetchJson(`${PROD_URL}/api/products?featured=true`).catch(() => null),
      fetchJson(`${PROD_URL}/api/navigation`).catch(() => null),
      fetchJson(`${PROD_URL}/api/editorial/quote`).catch(() => null),
    ]);
    const categories = cats?.categories ?? [];
    const products = prods?.products ?? [];
    const navigation = nav?.navigation ?? [];
    const quoteData = quote?.data ?? null;
    if (home?.config || categories.length > 0 || products.length > 0) {
      snapshot = {
        homepage: home?.config ?? null,
        categories,
        products,
        navigation,
        quote: quoteData,
        source,
      };
    } else {
      throw new Error("live snapshot empty");
    }
  } catch {
    source = "static-fallback";
    log(`live snapshot unavailable (${PROD_URL}); using static fallback`);
    const { build } = await import("esbuild");
    const result = await build({
      entryPoints: [path.join(ROOT, "local-shell/defaults-source.ts")],
      bundle: true,
      format: "cjs",
      platform: "node",
      write: false,
      logLevel: "silent",
      plugins: [repoPathsPlugin()],
      define: { "process.env.NODE_ENV": '"production"' },
    });
    const code = result.outputFiles[0].text;
    const module_ = { exports: {} };
    // CJS wrapper; require is unused (the module is pure data + types).
    new Function("module", "exports", "require", code)(
      module_,
      module_.exports,
      () => {
        throw new Error("require is not available in the shell fallback bundle");
      }
    );
    snapshot = module_.exports.staticFallbackSnapshot();
  }

  writeFileSync(path.join(OUT, "snapshot.json"), JSON.stringify(snapshot, null, 2));

  // Collect public image paths referenced by the snapshot for bundling.
  const refs = JSON.stringify(snapshot).match(/\/[a-z0-9._-]+\.(?:jpe?g|png|svg|webp)/gi) || [];
  const unique = Array.from(new Set(refs.map((r) => r.replace(/\?.*$/, ""))));
  writeFileSync(path.join(OUT, "image-manifest.json"), JSON.stringify(unique, null, 2));
  log(`snapshot: source=${source}, ${unique.length} image refs`);
  return snapshot;
}

/** The current build's immutable static assets (same content-hashed names as
 *  the production deployment of this source tree). */
function remoteStaticList() {
  const staticDir = path.join(ROOT, ".next/static");
  if (!existsSync(staticDir)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(css|js|woff2|woff|png|svg|ico|webp|jpe?g)$/i.test(entry.name)) {
        out.push("/_next/" + full.slice(staticDir.length).split(path.sep).join("/"));
      }
    }
  };
  walk(staticDir);
  return out;
}

async function bundleShell(snapshot) {
  const { build } = await import("esbuild");
  const staticAssets = remoteStaticList();
  const cssOut = path.join(OUT, "app.css");
  const jsOut = path.join(OUT, "app.js");

  await build({
    entryPoints: [path.join(ROOT, "local-shell/main.tsx")],
    bundle: true,
    minify: true,
    sourcemap: false,
    format: "esm",
    target: "es2018",
    platform: "browser",
    logLevel: "warning",
    jsx: "automatic",
    outfile: path.join(OUT, "app.js"), // CSS lands next to it as app.css
    plugins: [repoPathsPlugin()],
    alias: {
      "next/image": path.join(ROOT, "local-shell/shims/next-image.tsx"),
      "next/link": path.join(ROOT, "local-shell/shims/next-link.tsx"),
      "next/navigation": path.join(ROOT, "local-shell/shims/next-navigation.ts"),
    },
    define: {
      "process.env.NODE_ENV": '"production"',
      global: "globalThis",
      __SHOPY_SHELL_SNAPSHOT__: JSON.stringify(JSON.stringify(snapshot)),
      __SHOPY_SHELL_REMOTE_STATIC__: JSON.stringify(JSON.stringify(staticAssets)),
    },
  });

  // esbuild emits app.css with the @tailwind directives still inlined — run
  // the same Tailwind + Autoprefixer pipeline as the web app so the utilities
  // are generated identically.
  const postcss = (await import("postcss")).default;
  const tailwind = (await import("tailwindcss")).default;
  const autoprefixer = (await import("autoprefixer")).default;
  const cssInput = readFileSync(cssOut, "utf8");
  const cssOutput = await postcss([
    tailwind({ config: path.join(ROOT, "tailwind.config.js") }),
    autoprefixer,
  ]).process(cssInput, { from: cssOut, to: cssOut, map: false });
  writeFileSync(cssOut, cssOutput.css);
  log(
    `shell bundle built (app.js ${(statSync(jsOut).size / 1024).toFixed(1)} kB, ` +
      `app.css ${(statSync(cssOut).size / 1024).toFixed(1)} kB, ` +
      `${staticAssets.length} warm-up asset refs)`
  );
}

function writeIndexHtml() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
    />
    <meta name="theme-color" content="#F4F4F2" />
    <title>SHOPY</title>
    <!-- Zero-flash: window background matches the SHOPY surface before CSS lands -->
    <style>html,body{background:#F4F4F2;margin:0}</style>
    <link rel="stylesheet" href="/fonts.css" />
    <link rel="stylesheet" href="/app.css" />
  </head>
  <body class="font-sans antialiased min-h-screen flex flex-col bg-[#F4F4F2] text-[#495464]">
    <div id="root"></div>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`;
  writeFileSync(path.join(OUT, "index.html"), html);
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  log(`building instant-launch shell → ${path.relative(ROOT, OUT)}`);
  const snapshot = await buildSnapshot();
  buildFontsCss();
  bundleLandingImages();
  await bundleShell(snapshot);
  writeIndexHtml();
  log("done.");
}

main().catch((err) => {
  console.error("[cap-shell] build failed:", err);
  process.exit(1);
});
