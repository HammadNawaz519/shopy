// Copies the chosen splash icon (Icon-3.png) into the Android res tree so
// the splash theme's windowSplashScreenAnimatedIcon always resolves.
//
//   node scripts/make-splash-icon.mjs
//
// Source : Icon-3.png            (project root - swap this file to change the
//                                   splash icon; kept as a copy so res/ never
//                                   points outside the native tree)
// Output : android/app/src/main/res/drawable-nodpi/shopy_splash_logo.png
//          (nodpi = shown at native size, never density-scaled)
//
// The splash background stays the app cream (#F4F4F2,
// res/values/ic_launcher_background.xml).

import { copyFile, mkdir, rm, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcPath = path.join(root, "Icon-3.png");
const outDir = path.join(root, "android", "app", "src", "main", "res", "drawable-nodpi");
const outPath = path.join(outDir, "shopy_splash_logo.png");
const staleVector = path.join(root, "android", "app", "src", "main", "res", "drawable", "shopy_splash_logo.xml");

// The source must exist - without it the splash resource cannot build.
await access(srcPath).catch(() => {
  console.error(`[splash-icon] missing source ${path.relative(root, srcPath)} - cannot build the splash icon.`);
  process.exit(1);
});

// Never let a stale same-named vector outrank the PNG.
await rm(staleVector, { force: true });

await mkdir(outDir, { recursive: true });
await copyFile(srcPath, outPath);
console.log(`[splash-icon] copied ${path.relative(root, srcPath)} -> ${path.relative(root, outPath)}`);
