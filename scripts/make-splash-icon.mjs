// Copies the chosen splash icon into the Android res tree so the splash
// theme's windowSplashScreenAnimatedIcon always resolves.
//
//   node scripts/make-splash-icon.mjs
//
// Source : ..\logo.jpg  (the image the user chose as the splash icon -
//           swap the SRC below to change it; kept as a copy so res/ never
//           points outside the native tree)
// Output : android/app/src/main/res/drawable-nodpi/shopy_splash_logo.jpg
//          (nodpi = shown at native size, never density-scaled; the system
//           then fits it into its centered 96dp box)
//
// Stale same-named variants (shopy_splash_logo.png / .xml / other images)
// are removed so exactly one resource backs the theme reference.
//
// The splash background stays the app cream (#F4F4F2,
// res/values/ic_launcher_background.xml).

import { copyFile, mkdir, rm, access, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(root, "..", "logo.jpg");
const resDir = path.join(root, "android", "app", "src", "main", "res", "drawable-nodpi");
const outPath = path.join(resDir, "shopy_splash_logo.jpg");

// The source must exist - without it the splash resource cannot build.
await access(SRC).catch(() => {
  console.error(`[splash-icon] missing source ${SRC} - cannot build the splash icon.`);
  process.exit(1);
});

// Never let stale same-named resources (other file types) outrank the
// chosen image.
for (const dir of [resDir, path.join(root, "android", "app", "src", "main", "res", "drawable")]) {
  let entries = [];
  try {
    entries = await readdir(dir);
  } catch {
    continue; // folder absent - nothing to clean
  }
  for (const name of entries) {
    if (name.startsWith("shopy_splash_logo.") && name !== path.basename(outPath)) {
      await rm(path.join(dir, name), { force: true });
    }
  }
}

await mkdir(resDir, { recursive: true });
await copyFile(SRC, outPath);
console.log(`[splash-icon] copied ${path.basename(SRC)} -> ${path.relative(root, outPath)}`);
