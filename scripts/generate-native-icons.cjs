// One-off generator: writes SHOPY's native app icon (public/app-icon-source.png,
// a full-bleed square photo) into every native icon slot (Android mipmaps +
// adaptive foregrounds, iOS AppIcon). Native-shell assets only — does not
// touch the web app/UI or the PWA web icons.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "app-icon-source.png");
const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const DENSITIES = [
  { d: "mdpi", icon: 48, fg: 108 },
  { d: "hdpi", icon: 72, fg: 162 },
  { d: "xhdpi", icon: 96, fg: 216 },
  { d: "xxhdpi", icon: 144, fg: 324 },
  { d: "xxxhdpi", icon: 192, fg: 432 },
];

// The source is a full square photo, so each slot is a plain cover-resize.
// Launchers / iOS mask the shape themselves (square tile for PNG slots,
// circular/system mask for adaptive + iOS), so no padding or background fill.
async function photoTile(size) {
  return sharp(SRC).resize(size, size, { fit: "cover" }).png().toBuffer();
}

(async () => {
  const writes = [];

  for (const { d, icon, fg } of DENSITIES) {
    const dir = path.join(ANDROID_RES, `mipmap-${d}`);
    const tile = await photoTile(icon);
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher.png"), tile));
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher_round.png"), tile));
    // Adaptive foreground is the photo full-bleed too, so the system mask
    // crops it like any photographic app icon instead of floating a small
    // logo on a brand background.
    const fgTile = await photoTile(fg);
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher_foreground.png"), fgTile));
  }

  // iOS single full-bleed 1024×1024 AppIcon (Xcode scales for all device sizes).
  const iosDir = path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset");
  const ios = await photoTile(1024);
  writes.push(fs.promises.writeFile(path.join(iosDir, "AppIcon-512@2x.png"), ios));

  await Promise.all(writes);
  console.log(`[icons] Wrote ${writes.length} native icon files from public/app-icon-source.png`);
})().catch((e) => {
  console.error("[icons] Failed:", e);
  process.exit(1);
});
