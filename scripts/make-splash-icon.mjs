// Renders public/logo.svg into the native splash icon PNG so the Android
// splash screen shows the exact SHOPY label box + serif wordmark.
//
//   node scripts/make-splash-icon.mjs
//
// Output: android/app/src/main/res/drawable-nodpi/shopy_splash_logo.png
//   - 480x135 px (crisp on xxhdpi+), nodpi so it is never density-scaled
//   - rounded-corner cutouts filled with #F4F4F2 so it blends into the
//     cream splash background (res/values/ic_launcher_background.xml)
//
// Also removes any stale `drawable/shopy_splash_logo.xml` vector placeholder
// so the PNG is always the resource the splash theme resolves to.

import { readFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svgPath = path.join(root, "public", "logo.svg");
const outDir = path.join(root, "android", "app", "src", "main", "res", "drawable-nodpi");
const outPath = path.join(outDir, "shopy_splash_logo.png");
const staleVector = path.join(root, "android", "app", "src", "main", "res", "drawable", "shopy_splash_logo.xml");

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("[splash-icon] sharp is missing - run `npm install` (it is a project dependency).");
  process.exit(1);
}

// Never let a stale same-named vector outrank the generated PNG.
await rm(staleVector, { force: true });

const svg = await readFile(svgPath).catch(() => {
  console.error(`[splash-icon] missing ${path.relative(root, svgPath)} - cannot build the splash icon.`);
  process.exit(1);
});

await mkdir(outDir, { recursive: true });
await sharp(svg, {
  // Solid #F4F4F2 behind the rounded-corner cutouts (splash background color).
  background: { r: 244, g: 244, b: 242, alpha: 1 },
})
  .resize(480, 135, { fit: "inside" })
  .png()
  .toFile(outPath);

console.log(`[splash-icon] wrote ${path.relative(root, outPath)}`);
