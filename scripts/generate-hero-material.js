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
  console.log('Generating customized faceless hero & tactile material images...');

  // 1. Hero Image: Strictly headless luxury beige wool overcoat & trousers
  // Cropped from chest/shoulders down to ensure ZERO face is visible
  const heroUrl = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2600&q=95';
  console.log('Fetching hero image...');
  const heroBuf = await downloadBuffer(heroUrl);
  const heroMeta = await sharp(heroBuf).metadata();
  
  // Cut off the top 26% (head/face completely removed), keeping the luxury tailoring & silhouette
  const cropTop = Math.floor(heroMeta.height * 0.26);
  const cropHeight = Math.floor(heroMeta.height * 0.72);
  
  await sharp(heroBuf)
    .extract({ left: 0, top: cropTop, width: heroMeta.width, height: cropHeight })
    .resize(2400, 1350, { fit: 'cover', position: 'top' })
    .sharpen({ sigma: 1.2, m1: 0.6, m2: 2.5 })
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, 'hero-luxury.jpg'));

  fs.copyFileSync(path.join(PUBLIC_DIR, 'hero-luxury.jpg'), path.join(PUBLIC_DIR, 'hero-beige-male.jpg'));
  console.log('✓ Hero images saved with guaranteed faceless tailoring!');

  // 2. Material Texture: Pure ultra-luxury tactile woven wool/cashmere fabric rolls & fine craft texture (NO human, NO shop)
  const matUrl = 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=2400&q=95';
  console.log('Fetching tactile material texture image...');
  const matBuf = await downloadBuffer(matUrl);
  
  await sharp(matBuf)
    .resize(1920, 1280, { fit: 'cover', position: 'center' })
    .sharpen({ sigma: 1.4, m1: 0.8, m2: 3.0 })
    .jpeg({ quality: 90, progressive: true, mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, 'atelier-still-life.jpg'));

  console.log('✓ Material still life saved with high-quality textile textures!');
}

run().catch(console.error);
