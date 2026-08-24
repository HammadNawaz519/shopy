const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Failed to fetch ' + url + ': status ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Generating centered beige faceless hero image...');

  // High-res luxury beige tailored silhouette (perfectly centered, cropped strictly below neck)
  // photo-1594938298603-c8148c4dae35 or photo-1539109136881-3be0616acf4b or photo-1509631179647-0177331693ae
  const heroUrl = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2600&q=95';
  console.log('Fetching raw hero image...');
  const heroBuf = await downloadBuffer(heroUrl);
  const heroMeta = await sharp(heroBuf).metadata();
  console.log('Hero dimensions:', heroMeta.width, 'x', heroMeta.height);

  // Exact centering and headless crop:
  // Remove top 32% (eliminates head/face completely), keep centered chest, beige coat & trousers
  const cropTop = Math.floor(heroMeta.height * 0.32);
  const cropHeight = Math.floor(heroMeta.height * 0.65);

  const processed = await sharp(heroBuf)
    .extract({
      left: 0,
      top: cropTop,
      width: heroMeta.width,
      height: cropHeight
    })
    .resize(2400, 1350, {
      fit: 'cover',
      position: 'center' // Keep centered horizontally and vertically
    })
    .sharpen({
      sigma: 1.2,
      m1: 0.6,
      m2: 2.5
    })
    .jpeg({
      quality: 88,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer();

  const heroPath1 = path.join(PUBLIC_DIR, 'hero-luxury.jpg');
  const heroPath2 = path.join(PUBLIC_DIR, 'hero-beige-male.jpg');

  fs.writeFileSync(heroPath1, processed);
  fs.writeFileSync(heroPath2, processed);

  console.log(`✓ Centered beige faceless hero generated successfully (${(processed.length / 1024).toFixed(1)} KB)!`);
}

run().catch(console.error);
