// One-off generator: writes SHOPY's public/icon.png into every native icon
// slot (Android mipmaps + adaptive foregrounds, iOS AppIcon). Native-shell
// assets only — does not touch the web app/UI.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "icon.png");
const BG = { r: 244, g: 244, b: 242, alpha: 1 }; // #F4F4F2 (SHOPY bg)

const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const DENSITIES = [
  { d: "mdpi", icon: 48, fg: 108 },
  { d: "hdpi", icon: 72, fg: 162 },
  { d: "xhdpi", icon: 96, fg: 216 },
  { d: "xxhdpi", icon: 144, fg: 324 },
  { d: "xxxhdpi", icon: 192, fg: 432 },
];

// Square launcher tile: logo cover-cropped onto the brand background.
async function logoOnBrand(size) {
  return sharp(SRC).resize(size, size, { fit: "cover", background: BG }).png().toBuffer();
}

// Adaptive foreground: logo centered inside a transparent canvas (safe-zone padding)
// so circular/system masks don't crop it; sits over @color/ic_launcher_background.
async function adaptiveForeground(fgSize) {
  const inner = Math.round(fgSize * 0.62);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "cover", background: BG })
    .png()
    .toBuffer();
  const canvas = sharp({
    create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  });
  const off = Math.round((fgSize - inner) / 2);
  return canvas.composite([{ input: logo, top: off, left: off }]).png().toBuffer();
}

(async () => {
  const writes = [];

  for (const { d, icon, fg } of DENSITIES) {
    const dir = path.join(ANDROID_RES, `mipmap-${d}`);
    const tile = await logoOnBrand(icon);
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher.png"), tile));
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher_round.png"), tile));
    const fgBuf = await adaptiveForeground(fg);
    writes.push(fs.promises.writeFile(path.join(dir, "ic_launcher_foreground.png"), fgBuf));
  }

  // iOS single full-bleed 1024×1024 AppIcon (Xcode scales for all device sizes).
  const iosDir = path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset");
  const ios = await logoOnBrand(1024);
  writes.push(fs.promises.writeFile(path.join(iosDir, "AppIcon-512@2x.png"), ios));

  await Promise.all(writes);
  console.log(`[icons] Wrote ${writes.length} native icon files from public/icon.png`);
})().catch((e) => {
  console.error("[icons] Failed:", e);
  process.exit(1);
});
