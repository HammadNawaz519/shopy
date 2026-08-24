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
        return reject(new Error(`Failed to fetch ${url}: status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Generating perfect centered beige headless luxury hero image...');

  // Male / Headless luxury beige tailored suit & coat (pure beige aesthetic, cropped strictly below neck)
  const heroUrl = 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=2400&q=95';
  console.log('Fetching raw beige hero image...');
  const heroBuf = await downloadBuffer(heroUrl);
  const heroMeta = await sharp(heroBuf).metadata();
  console.log('Hero dimensions:', heroMeta.width, 'x', heroMeta.height);

  // Strictly crop out head/neck: take from 28% down to 88%
  const cropTop = Math.floor(heroMeta.height * 0.26);
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
      position: 'center'
    })
    .modulate({
      brightness: 0.96,
      saturation: 1.05
    })
    .sharpen({
      sigma: 1.1,
      m1: 0.7,
      m2: 2.2
    })
    .jpeg({
      quality: 86,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer();

  const heroPath1 = path.join(PUBLIC_DIR, 'hero-beige.jpg');
  const heroPath2 = path.join(PUBLIC_DIR, 'hero-luxury.jpg');
  const heroPath3 = path.join(PUBLIC_DIR, 'hero-beige-male.jpg');

  fs.writeFileSync(heroPath1, processed);
  fs.writeFileSync(heroPath2, processed);
  fs.writeFileSync(heroPath3, processed);

  console.log(`✓ Perfect Beige Hero written successfully (${(processed.length / 1024).toFixed(1)} KB)!`);
}

run().catch(console.error);
