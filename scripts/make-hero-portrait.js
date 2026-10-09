/*
 * One-off asset generator: portrait 9:16 hero crop for the mobile app shell.
 *
 * The default editorial photo (public/hero-beige.jpg) is a wide 2560x1440
 * frame. On phones the hero section is a tall portrait container, so a
 * plain object-cover zoom-crops the wide frame and the shot looks stretched
 * and soft. This script writes public/hero-beige-portrait.jpg — a centered
 * 9:16 crop upscaled (lanczos) to Retina size — so the mobile hero fills
 * the frame 1:1 with no zoom.
 *
 * Run: node scripts/make-hero-portrait.js
 */

const path = require("path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "public", "hero-beige.jpg");
const OUT = path.join(__dirname, "..", "public", "hero-beige-portrait.jpg");

(async () => {
  const meta = await sharp(SRC).metadata();
  const { width, height } = meta;

  // 9:16 portrait region, centered on the model
  const cropW = Math.round((height * 9) / 16); // 810 from 1440
  const left = Math.round((width - cropW) / 2);

  // Output 1240x2203 (9:16) — covers @2x–@3x phone widths (up to ~413 CSS px)
  const outW = 1240;
  const outH = Math.round((outW * 16) / 9); // 2203

  await sharp(SRC)
    .extract({ left, top: 0, width: cropW, height })
    .resize(outW, outH, { kernel: "lanczos3" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(OUT);

  console.log(
    `[hero-portrait] ${width}x${height} -> crop ${cropW}x${height} -> ${outW}x${outH} written to ${path.relative(process.cwd(), OUT)}`
  );
})().catch((err) => {
  console.error("[hero-portrait] failed:", err.message);
  process.exit(1);
});
