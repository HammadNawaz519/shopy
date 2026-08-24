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

// Curated high-definition luxury photography configuration
// Hero: Strictly headless/faceless luxury tailoring (torso/outfit only)
// Last section: Pure tactile luxury fabric/textile material (no human, no shop)
const IMAGE_CONFIGS = [
  {
    name: 'hero-luxury.jpg',
    // Strictly faceless luxury beige/stone tailored coat & outfit (chest down)
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=2400&q=95',
    width: 2400,
    height: 1350,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.3, m1: 0.7, m2: 2.8 },
  },
  {
    name: 'hero-beige-male.jpg', // Keep synchronized with hero-luxury
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=2400&q=95',
    width: 2400,
    height: 1350,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.3, m1: 0.7, m2: 2.8 },
  },
  {
    name: 'atelier-still-life.jpg',
    // Ultra high-end luxury material/fabric texture: folded cashmere, woven raw wool, dramatic studio light (NO human, NO shop)
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=2000&q=95',
    width: 1800,
    height: 1200,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.4, m1: 0.8, m2: 3.0 },
  },
  {
    name: 'category-tops.jpg',
    // Clean minimalist luxury heavyweight tee / tailored top
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=90',
    width: 1200,
    height: 1600,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'category-bottoms.jpg',
    // Pleated fluid wool trousers / tailored bottoms
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1600&q=90',
    width: 1200,
    height: 1600,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'category-footwear.jpg',
    // Sculptural calfskin loafers / luxury leather footwear
    url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1600&q=90',
    width: 1400,
    height: 1400,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.3, m1: 0.7, m2: 2.8 },
  },
  {
    name: 'category-fragrances.jpg',
    // Minimalist amber glass perfume flacon / extrait de parfum
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1600&q=90',
    width: 1400,
    height: 1400,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.3, m1: 0.7, m2: 2.8 },
  },
  {
    name: 'category-coord-sets.jpg',
    // Monochromatic co-ord set / tailored tracksuit
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=90',
    width: 1600,
    height: 1000,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'category-accessories.jpg',
    // Structured Italian leather tote / luxury bag
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1600&q=90',
    width: 1200,
    height: 1600,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'product-linen-overshirt.jpg',
    // Heavyweight textured linen overshirt
    url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1600&q=90',
    width: 1200,
    height: 1500,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'product-linen-pants.jpg',
    // Relaxed linen drawstring pants
    url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1600&q=90',
    width: 1200,
    height: 1500,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'product-knit-cardigan.jpg',
    // Chunky knit cashmere/merino cardigan
    url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1600&q=90',
    width: 1200,
    height: 1500,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.2, m1: 0.6, m2: 2.5 },
  },
  {
    name: 'editorial-craft.jpg',
    // Tailoring craft, fine textile weave & craftsmanship
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1800&q=90',
    width: 1600,
    height: 1100,
    fit: 'cover',
    position: 'center',
    sharpen: { sigma: 1.3, m1: 0.7, m2: 2.8 },
  }
];

async function run() {
  console.log('Generating razor-sharp, instant-load luxury assets...');
  
  for (const item of IMAGE_CONFIGS) {
    try {
      console.log(`Processing ${item.name}...`);
      const rawBuf = await downloadBuffer(item.url);
      
      let pipeline = sharp(rawBuf)
        .resize({
          width: item.width,
          height: item.height,
          fit: item.fit || 'cover',
          position: item.position || 'center',
        });
      
      if (item.sharpen) {
        pipeline = pipeline.sharpen(item.sharpen);
      }
      
      // Save with progressive JPEG and mozjpeg for razor-sharp instant loading
      const outPath = path.join(PUBLIC_DIR, item.name);
      await pipeline
        .jpeg({
          quality: 88,
          progressive: true,
          mozjpeg: true,
        })
        .toFile(outPath);
      
      const stats = fs.statSync(outPath);
      console.log(`✓ Generated ${item.name} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Error processing ${item.name}:`, err.message);
    }
  }

  // Clean up unused/unreferenced demo files in public directory
  const filesInPublic = fs.readdirSync(PUBLIC_DIR);
  const activeNames = new Set(IMAGE_CONFIGS.map(c => c.name));
  
  // Whitelist standard icons and logos
  const preservedFiles = new Set([
    'logo.svg', 'logo.png', 'shopy-dark-label.svg', 'shopy-logo-square.svg',
    'favicon.ico', 'favicon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png',
    'apple-touch-icon.png', 'icon.png', 'icon-192x192.png', 'icon-512x512.png'
  ]);

  for (const file of filesInPublic) {
    if (!activeNames.has(file) && !preservedFiles.has(file) && (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp'))) {
      const filePath = path.join(PUBLIC_DIR, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Deleted unneeded file: ${file}`);
      } catch (e) {
        console.log(`Could not delete ${file}:`, e.message);
      }
    }
  }

  console.log('All demo pictures generated and optimized successfully!');
}

run();
