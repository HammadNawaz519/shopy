// One-off generator: writes SHOPY's shared app icon source into the web/PWA
// icons and every native icon slot (Android mipmaps + adaptive foregrounds,
// iOS AppIcon).
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

// Legacy and iOS slots can use the complete square artwork. Android adaptive
// icons and maskable PWA icons need the artwork inside the launcher safe zone;
// otherwise the system mask crops the edges of the icon.
async function photoTile(size) {
  return sharp(SRC).resize(size, size, { fit: "cover" }).png().toBuffer();
}

async function safeTile(size) {
  const source = sharp(SRC);
  const { dominant } = await source.stats();
  const inset = Math.round(size * 0.66);
  const foreground = await source.resize(inset, inset, { fit: "fill" }).png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: dominant.r, g: dominant.g, b: dominant.b, alpha: 1 },
    },
  })
    .composite([{ input: foreground, gravity: "centre" }])
    .png()
    .toBuffer();
}

(async () => {
  const writes = [];

  for (const { d, icon, fg } of DENSITIES) {
    const dir = path.join(ANDROID_RES, `mipmap-${d}`);
    const tile = await photoTile(icon);
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher.png"), tile));
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher_round.png"), tile));
    const fgTile = await safeTile(fg);
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher_foreground.png"), fgTile));
  }

  // iOS single full-bleed 1024×1024 AppIcon (Xcode scales for all device sizes).
  const iosDir = path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset");
  const ios = await photoTile(1024);
  writes.push(fs.promises.writeFile(path.join(iosDir, "AppIcon-512@2x.png"), ios));

  writes.push(fs.promises.writeFile(path.join(ROOT, "public", "icon-192x192.png"), await photoTile(192)));
  writes.push(fs.promises.writeFile(path.join(ROOT, "public", "icon-512x512.png"), await photoTile(512)));
  writes.push(fs.promises.writeFile(path.join(ROOT, "public", "icon-512x512-maskable.png"), await safeTile(512)));
  writes.push(fs.promises.writeFile(path.join(ROOT, "public", "apple-touch-icon.png"), await photoTile(180)));

  await Promise.all(writes);
  console.log(`[icons] Wrote ${writes.length} native icon files from public/app-icon-source.png`);
})().catch((e) => {
  console.error("[icons] Failed:", e);
  process.exit(1);
});
