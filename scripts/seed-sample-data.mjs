import { Pool } from "pg";
import { Redis } from "@upstash/redis";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://gentle-mite-104611.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "ggAAAAAAAZijAAIgcDGUKO4Cz6SU63SrLAIPO35W_cADCfQ4ImsU_NMObTUGLw",
});

async function seed() {
  console.log("🚀 Starting SHOPY sample data seeding...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Categories
    console.log("📦 Seeding Categories...");
    const categories = [
      {
        id: "cat-1",
        slug: "tops",
        name: "TOPS",
        tagline: "Tailored Shirts, Heavyweight Tees & Knitwear",
        image: "/category-tops.jpg",
        description: "Architectural silhouettes crafted in heavyweight organic cotton, breathable linen, and Italian merino wool.",
        aspect_ratio: "tall",
        featured: true,
      },
      {
        id: "cat-2",
        slug: "bottoms",
        name: "BOTTOMS",
        tagline: "Pleated Trousers, Cargo Pants & Denim",
        image: "/category-bottoms.jpg",
        description: "Relaxed drape, high-rise cuts, and precision-tailored pleated trousers designed for fluid motion.",
        aspect_ratio: "tall",
        featured: true,
      },
      {
        id: "cat-3",
        slug: "footwear",
        name: "FOOTWEAR",
        tagline: "Minimalist Leather Loafers & Sculptural Boots",
        image: "/category-footwear.jpg",
        description: "Handcrafted calfskin leather footwear bridging timeless craftsmanship with contemporary proportions.",
        aspect_ratio: "square",
        featured: true,
      },
      {
        id: "cat-4",
        slug: "fragrances",
        name: "FRAGRANCES",
        tagline: "Artisanal Extrait de Parfum",
        image: "/category-fragrances.jpg",
        description: "Sensory compositions exploring smoky vetiver, amber resin, cedarwood, and delicate desert florals.",
        aspect_ratio: "square",
        featured: true,
      },
      {
        id: "cat-5",
        slug: "co-ord-sets",
        name: "CO-ORD SETS",
        tagline: "Monochromatic Tracksuits & Tailored Sets",
        image: "/category-coord-sets.jpg",
        description: "Effortless sartorial sets engineered for seamless everyday transitions with relaxed luxury.",
        aspect_ratio: "wide",
        featured: true,
      },
      {
        id: "cat-6",
        slug: "accessories",
        name: "ACCESSORIES",
        tagline: "Leather Goods, Hardware & Eyewear",
        image: "/category-accessories.jpg",
        description: "Tactile leather totes, minimal brass jewelry, and handcrafted titanium sunglasses.",
        aspect_ratio: "tall",
        featured: true,
      },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, slug, name, tagline, image, description, aspect_ratio, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           name = EXCLUDED.name,
           tagline = EXCLUDED.tagline,
           image = EXCLUDED.image,
           description = EXCLUDED.description,
           aspect_ratio = EXCLUDED.aspect_ratio,
           featured = EXCLUDED.featured,
           updated_at = NOW();`,
        [cat.id, cat.slug, cat.name, cat.tagline, cat.image, cat.description, cat.aspect_ratio, cat.featured]
      );
    }

    // 2. Products
    console.log("👕 Seeding Products...");
    const products = [
      {
        id: "prod-1",
        name: "Architectural Boxy Heavyweight Tee",
        slug: "architectural-boxy-heavyweight-tee",
        category_id: "cat-1",
        category_slug: "tops",
        category_label: "Tops",
        price: 3200,
        original_price: 3800,
        description: "Constructed from 280 GSM custom-milled organic French terry cotton. Features dropped shoulders, an oversized silhouette, and a structured mock-rib collar.",
        tag: "NEW",
        images: ["/category-tops.jpg", "/product-linen-overshirt.jpg"],
        colors: [
          { name: "Raw Ecru", hex: "#F4F4F2" },
          { name: "Obsidian Slate", hex: "#495464" },
          { name: "Muted Bone", hex: "#E8E8E8" },
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        composition: ["100% Organic Heavyweight Cotton", "Pre-shrunk 280 GSM fabric"],
        care_instructions: ["Machine wash cold inside out", "Hang dry in shade", "Iron low heat"],
        details: [
          "Signature drop shoulder fit",
          "Reinforced twin-needle stitching",
          "Fabric washed for ultra-soft hand feel",
          "Made in Lahore atelier",
        ],
        featured: true,
        in_stock: true,
        stock_count: 24,
      },
      {
        id: "prod-2",
        name: "Pleated Fluid Wool Trousers",
        slug: "pleated-fluid-wool-trousers",
        category_id: "cat-2",
        category_slug: "bottoms",
        category_label: "Bottoms",
        price: 4200,
        original_price: 4800,
        description: "Double front-pleated wide-leg trousers cut in lightweight tropical wool blend. Designed with a clean high-rise waist and concealed horn button fastening.",
        tag: "LIMITED",
        images: ["/category-bottoms.jpg", "/product-linen-pants.jpg"],
        colors: [
          { name: "Charcoal Slate", hex: "#495464" },
          { name: "Pebble Grey", hex: "#BBBFCA" },
        ],
        sizes: ["28", "30", "32", "34", "36"],
        composition: ["70% Virgin Tropical Wool", "30% Sustainable Viscose", "Viscose lining"],
        care_instructions: ["Dry clean only", "Steam press at low setting"],
        details: [
          "Deep double front pleats",
          "Adjustable side cinch tabs",
          "Concealed hook and zipper fly",
          "Side slant pockets and back welt pockets",
        ],
        featured: true,
        in_stock: true,
        stock_count: 18,
      },
      {
        id: "prod-3",
        name: "Monochrome Minimalist Tracksuit",
        slug: "monochrome-minimalist-tracksuit",
        category_id: "cat-5",
        category_slug: "co-ord-sets",
        category_label: "Co-Ord Sets",
        price: 4600,
        original_price: 5200,
        description: "Two-piece relaxed set featuring a minimalist zip jacket with stand collar and coordinating tapered cargo pants in textured double-knit fleece.",
        tag: "SALE",
        images: ["/category-coord-sets.jpg"],
        colors: [
          { name: "Ecru Shadow", hex: "#E8E8E8" },
          { name: "Deep Charcoal", hex: "#495464" },
        ],
        sizes: ["S", "M", "L", "XL"],
        composition: ["85% Compact Cotton", "15% Recycled Polyester"],
        care_instructions: ["Machine wash cold with similar colors", "Do not tumble dry"],
        details: [
          "Matte gunmetal two-way zipper",
          "Elasticated waistband with tonal drawcord",
          "Inseam concealed pockets",
          "Embossed micro SHOPY hallmark on hem",
        ],
        featured: true,
        in_stock: true,
        stock_count: 12,
      },
      {
        id: "prod-4",
        name: "Sculptural Calfskin Loafers",
        slug: "sculptural-calfskin-loafers",
        category_id: "cat-3",
        category_slug: "footwear",
        category_label: "Footwear",
        price: 4950,
        original_price: null,
        description: "Modern square-toe slip-on loafers crafted from full-grain Italian calfskin with an exaggerated welt and stacked leather heel.",
        tag: "NEW",
        images: ["/category-footwear.jpg"],
        colors: [
          { name: "Onyx Black", hex: "#1A1A1A" },
          { name: "Deep Espresso", hex: "#495464" },
        ],
        sizes: ["40", "41", "42", "43", "44", "45"],
        composition: ["100% Full Grain Calf Leather", "Leather sole with rubber traction insert"],
        care_instructions: ["Condition with neutral leather balm", "Store in cotton dust bag with cedar shoe trees"],
        details: [
          "Handmade Goodyear welt construction",
          "Sculpted square toe profile",
          "Natural veg-tan leather insole",
          "Custom brass hardware accents",
        ],
        featured: true,
        in_stock: true,
        stock_count: 9,
      },
      {
        id: "prod-5",
        name: "SHOPY N° 01 — Vetiver & Smoky Amber Extrait",
        slug: "shopy-no-01-vetiver-smoky-amber",
        category_id: "cat-4",
        category_slug: "fragrances",
        category_label: "Fragrances",
        price: 3900,
        original_price: null,
        description: "An intoxicating 30% concentration extrait de parfum opening with bergamot and pink pepper, settling into smoky Haitian vetiver, leather, and golden amber.",
        tag: "LIMITED",
        images: ["/category-fragrances.jpg", "/atelier-still-life.jpg"],
        colors: [
          { name: "Amber Flacon (50ml)", hex: "#BBBFCA" },
        ],
        sizes: ["50ml", "100ml"],
        composition: ["30% Fragrance Oil Concentration", "Alcohol Denat., Parfum, Aqua"],
        care_instructions: ["Store in a cool, dry place away from direct sunlight"],
        details: [
          "Top Notes: Calabrian Bergamot, Pink Peppercorn",
          "Heart Notes: Smoked Cedar, Orris Butter, Cardamom",
          "Base Notes: Haitian Vetiver, Ambergris, Dark Musk",
          "Heavy weighted magnetic flacon cap",
        ],
        featured: true,
        in_stock: true,
        stock_count: 30,
      },
      {
        id: "prod-6",
        name: "Architectural Leather Minimalist Tote",
        slug: "architectural-leather-minimalist-tote",
        category_id: "cat-6",
        category_slug: "accessories",
        category_label: "Accessories",
        price: 4500,
        original_price: null,
        description: "Structured daily tote constructed from semi-rigid vegetable-tanned leather. Fits up to a 16-inch laptop with an internal zipped sleeve.",
        tag: "NEW",
        images: ["/category-accessories.jpg"],
        colors: [
          { name: "Slate Grey", hex: "#495464" },
          { name: "Natural Sand", hex: "#E8E8E8" },
        ],
        sizes: ["One Size"],
        composition: ["100% Vegetable Tanned Italian Leather", "Raw suede interior"],
        care_instructions: ["Wipe clean with a soft dry cloth", "Avoid prolonged water exposure"],
        details: [
          "Reinforced structural base",
          "Magnetic top bridge closure",
          "Interior zip compartment with key tether",
          "Laser-engraved understated SHOPY logo",
        ],
        featured: true,
        in_stock: true,
        stock_count: 15,
      },
      {
        id: "prod-7",
        name: "Oversized Cashmere-Blend Knit Cardigan",
        slug: "oversized-cashmere-blend-knit-cardigan",
        category_id: "cat-1",
        category_slug: "tops",
        category_label: "Tops",
        price: 4800,
        original_price: null,
        description: "Heavy-gauge waffle knit cardigan spun from Mongolian cashmere and merino wool. Finished with raw horn buttons and relaxed dropped shoulders.",
        tag: "NEW",
        images: ["/product-knit-cardigan.jpg", "/category-tops.jpg"],
        colors: [
          { name: "Oatmeal Heather", hex: "#F4F4F2" },
          { name: "Smoke Ash", hex: "#BBBFCA" },
        ],
        sizes: ["S", "M", "L", "XL"],
        composition: ["30% Grade-A Cashmere", "70% Extra Fine Merino Wool"],
        care_instructions: ["Hand wash in cold water with wool detergent", "Dry flat"],
        details: [
          "5-gauge heavy English rib stitch",
          "Genuine polished buffalo horn buttons",
          "Deep front welt pockets",
          "Relaxed editorial fit",
        ],
        featured: true,
        in_stock: true,
        stock_count: 14,
      },
      {
        id: "prod-8",
        name: "Relaxed Linen Drawstring Pants",
        slug: "relaxed-linen-drawstring-pants",
        category_id: "cat-2",
        category_slug: "bottoms",
        category_label: "Bottoms",
        price: 3500,
        original_price: 4200,
        description: "Breathable European flax linen pants featuring a continuous elastic waistband with internal cotton drawstring and straight relaxed legs.",
        tag: "SALE",
        images: ["/product-linen-pants.jpg", "/category-bottoms.jpg"],
        colors: [
          { name: "Bleached Sand", hex: "#E8E8E8" },
          { name: "Dark Slate", hex: "#495464" },
        ],
        sizes: ["S", "M", "L", "XL"],
        composition: ["100% Normandy Flax Linen (Garment Washed)"],
        care_instructions: ["Machine wash gentle cycle cold", "Line dry in shade"],
        details: [
          "Pre-washed for relaxed drape and zero shrinkage",
          "Deep slash front pockets",
          "Internal drawstring with metal aglets",
          "French seam interior finishing",
        ],
        featured: true,
        in_stock: true,
        stock_count: 20,
      },
      {
        id: "prod-9",
        name: "Raw Linen Dropped Shoulder Overshirt",
        slug: "raw-linen-dropped-shoulder-overshirt",
        category_id: "cat-1",
        category_slug: "tops",
        category_label: "Tops",
        price: 3600,
        original_price: null,
        description: "Unstructured utilitarian overshirt cut in heavyweight Belgian raw flax linen with concealed placket and oversized chest patch pockets.",
        tag: "NEW",
        images: ["/product-linen-overshirt.jpg", "/category-tops.jpg"],
        colors: [
          { name: "Natural Flax", hex: "#E8E8E8" },
          { name: "Charcoal Slate", hex: "#495464" },
        ],
        sizes: ["S", "M", "L", "XL"],
        composition: ["100% Belgian Heavyweight Linen (320 GSM)"],
        care_instructions: ["Gentle cold wash", "Hang dry"],
        details: [
          "Clean concealed horn button placket",
          "Dual architectural chest patch pockets",
          "Curved step hem with side gussets",
        ],
        featured: false,
        in_stock: true,
        stock_count: 16,
      },
      {
        id: "prod-10",
        name: "SHOPY N° 02 — Santal & Iris Blanc Extrait",
        slug: "shopy-no-02-santal-iris-blanc",
        category_id: "cat-4",
        category_slug: "fragrances",
        category_label: "Fragrances",
        price: 4100,
        original_price: null,
        description: "A velvety, creamy extrait de parfum showcasing Australian sandalwood, Florentine iris pallida, cardamom, and soft white amber.",
        tag: "NEW",
        images: ["/atelier-still-life.jpg", "/category-fragrances.jpg"],
        colors: [
          { name: "Frosted Flacon (50ml)", hex: "#F4F4F2" },
        ],
        sizes: ["50ml", "100ml"],
        composition: ["30% Pure Perfume Extrait Concentration", "Organic Alcohol"],
        care_instructions: ["Keep in cool dark environment"],
        details: [
          "Top Notes: Violet Leaves, Cardamom seed",
          "Heart Notes: Iris Pallida Butter, Cedar",
          "Base Notes: Mysore Sandalwood, Cashmere Wood, White Musk",
        ],
        featured: false,
        in_stock: true,
        stock_count: 22,
      },
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO products (
          id, name, slug, category_id, category_slug, category_label, price, original_price,
          description, tag, images, colors, sizes, composition, care_instructions, details,
          featured, in_stock, stock_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          category_id = EXCLUDED.category_id,
          category_slug = EXCLUDED.category_slug,
          category_label = EXCLUDED.category_label,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          description = EXCLUDED.description,
          tag = EXCLUDED.tag,
          images = EXCLUDED.images,
          colors = EXCLUDED.colors,
          sizes = EXCLUDED.sizes,
          composition = EXCLUDED.composition,
          care_instructions = EXCLUDED.care_instructions,
          details = EXCLUDED.details,
          featured = EXCLUDED.featured,
          in_stock = EXCLUDED.in_stock,
          stock_count = EXCLUDED.stock_count,
          updated_at = NOW();`,
        [
          p.id,
          p.name,
          p.slug,
          p.category_id,
          p.category_slug,
          p.category_label,
          p.price,
          p.original_price,
          p.description,
          p.tag,
          p.images,
          JSON.stringify(p.colors),
          p.sizes,
          p.composition,
          p.care_instructions,
          p.details,
          p.featured,
          p.in_stock,
          p.stock_count,
        ]
      );

      // Clean & sync product images table
      await client.query(`DELETE FROM product_images WHERE product_id = $1;`, [p.id]);
      for (let i = 0; i < p.images.length; i++) {
        const imgId = `img_${p.id}_${i}`;
        await client.query(
          `INSERT INTO product_images (id, product_id, image_url, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order;`,
          [imgId, p.id, p.images[i], i]
        );
      }
    }

    // 3. Reviews
    console.log("⭐ Seeding Reviews...");
    const reviews = [
      {
        id: "rev-1",
        product_id: "prod-1",
        product_name: "Architectural Boxy Heavyweight Tee",
        customer_name: "Ayaan Malik",
        customer_email: "ayaan.malik@example.com",
        rating: 5,
        comment: "The drape and weight of the 280 GSM cotton is phenomenal. The collar stays structured even after several washes. Truly top tier craftsmanship.",
        status: "approved",
        verified_purchase: true,
      },
      {
        id: "rev-2",
        product_id: "prod-1",
        product_name: "Architectural Boxy Heavyweight Tee",
        customer_name: "Zainab Shah",
        customer_email: "zainab.shah@example.com",
        rating: 5,
        comment: "Best heavyweight tee in Pakistan hands down. The boxy silhouette sits perfectly on dropped shoulders.",
        status: "approved",
        verified_purchase: true,
      },
      {
        id: "rev-3",
        product_id: "prod-2",
        product_name: "Pleated Fluid Wool Trousers",
        customer_name: "Bilal Tariq",
        customer_email: "bilal.t@example.com",
        rating: 5,
        comment: "The double pleat drape is exquisite. Breathable tropical wool that moves gracefully. Adjustable side tabs make belt unnecessary.",
        status: "approved",
        verified_purchase: true,
      },
      {
        id: "rev-4",
        product_id: "prod-4",
        product_name: "Sculptural Calfskin Loafers",
        customer_name: "Hamza Sheikh",
        customer_email: "hamza.s@example.com",
        rating: 5,
        comment: "Flawless Italian calfskin. The square toe gives it such a contemporary, sculptural edge. Extremely comfortable footbed.",
        status: "approved",
        verified_purchase: true,
      },
      {
        id: "rev-5",
        product_id: "prod-5",
        product_name: "SHOPY N° 01 — Vetiver & Smoky Amber Extrait",
        customer_name: "Dr. Usman Farooq",
        customer_email: "usman.f@example.com",
        rating: 5,
        comment: "Unbelievable sillage and 12+ hour longevity. The smoky vetiver paired with ambergris is pure luxury. Flacon cap has nice magnetic weight.",
        status: "approved",
        verified_purchase: true,
      },
      {
        id: "rev-6",
        product_id: "prod-7",
        product_name: "Oversized Cashmere-Blend Knit Cardigan",
        customer_name: "Areeba Khan",
        customer_email: "areeba.k@example.com",
        rating: 5,
        comment: "Super plush and warm without feeling heavy. Buffalo horn buttons add that genuine artisanal feel. Worth every rupee.",
        status: "approved",
        verified_purchase: true,
      },
      {
        id: "rev-7",
        product_id: "prod-3",
        product_name: "Monochrome Minimalist Tracksuit",
        customer_name: "Saad Qureshi",
        customer_email: "saad.q@example.com",
        rating: 4,
        comment: "Great quality double-knit fabric. The two-way gunmetal zipper is smooth. Fits slightly oversized which I love.",
        status: "approved",
        verified_purchase: true,
      },
    ];

    for (const r of reviews) {
      await client.query(
        `INSERT INTO reviews (id, product_id, product_name, customer_name, customer_email, rating, comment, status, verified_purchase, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           rating = EXCLUDED.rating,
           comment = EXCLUDED.comment,
           status = EXCLUDED.status,
           verified_purchase = EXCLUDED.verified_purchase;`,
        [r.id, r.product_id, r.product_name, r.customer_name, r.customer_email, r.rating, r.comment, r.status, r.verified_purchase]
      );
    }

    // 4. Discounts / Promo Codes
    console.log("🎟️ Seeding Discounts...");
    const discounts = [
      {
        id: "dsc-welcome10",
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        min_order: 5000,
        usage_limit: 500,
        usage_count: 32,
        active: true,
      },
      {
        id: "dsc-shopyvip",
        code: "SHOPYVIP",
        type: "percentage",
        value: 15,
        min_order: 15000,
        usage_limit: 100,
        usage_count: 14,
        active: true,
      },
      {
        id: "dsc-atelier2500",
        code: "ATELIER2500",
        type: "fixed",
        value: 2500,
        min_order: 20000,
        usage_limit: 50,
        usage_count: 8,
        active: true,
      },
      {
        id: "dsc-freeship",
        code: "FREESHIP",
        type: "fixed",
        value: 500,
        min_order: 3000,
        usage_limit: 1000,
        usage_count: 45,
        active: true,
      },
    ];

    for (const d of discounts) {
      await client.query(
        `INSERT INTO discounts (id, code, type, value, min_order, usage_limit, usage_count, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           type = EXCLUDED.type,
           value = EXCLUDED.value,
           min_order = EXCLUDED.min_order,
           active = EXCLUDED.active;`,
        [d.id, d.code, d.type, d.value, d.min_order, d.usage_limit, d.usage_count, d.active]
      );
    }

    // 5. Store Settings
    console.log("⚙️ Seeding Store Settings...");
    await client.query(
      `INSERT INTO store_settings (
        id, store_name, support_email, currency, currency_symbol,
        free_shipping_threshold, flat_shipping_rate, tax_percentage,
        order_notifications, inventory_alert_threshold,
        cod_enabled, bank_transfer_enabled,
        bank_account_holder, bank_name, bank_account_title,
        bank_account_number, bank_iban, bank_raast_id,
        bank_payment_contact, bank_payment_instructions,
        updated_at
      ) VALUES (
        'settings_default', 'SHOPY Atelier', 'shopy.support@gmail.com', 'PKR', 'Rs.',
        15000, 500, 0,
        true, 5,
        true, true,
        'SHOPY Retail Private Limited', 'Meezan Bank Limited', 'SHOPY Main Operations',
        '01020304050607', 'PK12MEZN0001020304050607', '03001234567',
        '+92 300 1234567', 'Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.',
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        support_email = EXCLUDED.support_email,
        currency = EXCLUDED.currency,
        currency_symbol = EXCLUDED.currency_symbol,
        free_shipping_threshold = EXCLUDED.free_shipping_threshold,
        flat_shipping_rate = EXCLUDED.flat_shipping_rate,
        cod_enabled = EXCLUDED.cod_enabled,
        bank_transfer_enabled = EXCLUDED.bank_transfer_enabled,
        updated_at = NOW();`
    );

    // 6. Homepage Config
    console.log("🖼️ Seeding Homepage Config...");
    await client.query(
      `INSERT INTO homepage_config (
        id, hero_title, hero_subtitle, hero_image, hero_cta_text, hero_cta_link,
        featured_title, featured_subtitle, editorial_tag, editorial_title, editorial_quote,
        editorial_image_1, editorial_image_2, newsletter_title, newsletter_subtitle, updated_at
      ) VALUES (
        'home_default',
        'ARCHITECTURAL ELEGANCE',
        'EDITION 01 • AUTUMN / WINTER 2026',
        '/hero-luxury.jpg',
        'Explore Collection',
        '/products',
        'Featured Essentials',
        'SELECTION OF THE SEASON',
        'EDITORIAL CAMPAIGN',
        'Permanence in Form & Texture',
        'We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence, heavyweight organic knits, and architectural draping.',
        '/editorial-craft.jpg',
        '/category-tops.jpg',
        'Join The Maison Gazette',
        'Receive private vernissage previews, seasonal lookbooks, and invitation-only atelier dispatches.',
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        hero_title = EXCLUDED.hero_title,
        hero_subtitle = EXCLUDED.hero_subtitle,
        hero_image = EXCLUDED.hero_image,
        hero_cta_text = EXCLUDED.hero_cta_text,
        hero_cta_link = EXCLUDED.hero_cta_link,
        featured_title = EXCLUDED.featured_title,
        featured_subtitle = EXCLUDED.featured_subtitle,
        editorial_tag = EXCLUDED.editorial_tag,
        editorial_title = EXCLUDED.editorial_title,
        editorial_quote = EXCLUDED.editorial_quote,
        editorial_image_1 = EXCLUDED.editorial_image_1,
        editorial_image_2 = EXCLUDED.editorial_image_2,
        newsletter_title = EXCLUDED.newsletter_title,
        newsletter_subtitle = EXCLUDED.newsletter_subtitle,
        updated_at = NOW();`
    );

    // 7. Navigation Items
    console.log("🧭 Seeding Navigation Items...");
    const navItems = [
      { id: "nav-1", name: "Shop All", href: "/products", order_index: 0, is_active: true },
      { id: "nav-2", name: "Tops", href: "/collections/tops", order_index: 1, is_active: true, category_slug: "tops" },
      { id: "nav-3", name: "Bottoms", href: "/collections/bottoms", order_index: 2, is_active: true, category_slug: "bottoms" },
      { id: "nav-4", name: "Footwear", href: "/collections/footwear", order_index: 3, is_active: true, category_slug: "footwear" },
      { id: "nav-5", name: "Fragrances", href: "/collections/fragrances", order_index: 4, is_active: true, category_slug: "fragrances" },
      { id: "nav-6", name: "Co-Ord Sets", href: "/collections/co-ord-sets", order_index: 5, is_active: true, category_slug: "co-ord-sets" },
      { id: "nav-7", name: "Accessories", href: "/collections/accessories", order_index: 6, is_active: true, category_slug: "accessories" },
      { id: "nav-8", name: "About", href: "/about", order_index: 7, is_active: true },
      { id: "nav-9", name: "Contact", href: "/contact", order_index: 8, is_active: true },
    ];

    for (const nav of navItems) {
      await client.query(
        `INSERT INTO navigation_items (id, name, href, order_index, is_active, category_slug)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           href = EXCLUDED.href,
           order_index = EXCLUDED.order_index,
           is_active = EXCLUDED.is_active,
           category_slug = EXCLUDED.category_slug;`,
        [nav.id, nav.name, nav.href, nav.order_index, nav.is_active, nav.category_slug || null]
      );
    }

    // 8. Sample Demo Customers & Admin
    console.log("👤 Seeding Users...");
    const users = [
      {
        id: "usr_admin_master",
        name: "Hammad Nawaz",
        email: "hammadnawaz276@gmail.com",
        password_hash: "$2a$10$tZ8Q7R6s5wUq3h3hC6.YjeBvD8uM2gS7D3O1eO1yR2d1aW2c3e4f5",
        role: "admin",
      },
      {
        id: "usr_demo_1",
        name: "Ayaan Malik",
        email: "ayaan.malik@example.com",
        password_hash: "$2a$10$w0vHnF3l1Jt7p4YvV1s3a.K1yG6t4q7a8s9d0f1g2h3j4k5l6z7x8",
        role: "user",
      },
      {
        id: "usr_demo_2",
        name: "Fatima Tariq",
        email: "fatima.tariq@example.com",
        password_hash: "$2a$10$w0vHnF3l1Jt7p4YvV1s3a.K1yG6t4q7a8s9d0f1g2h3j4k5l6z7x8",
        role: "user",
      },
      {
        id: "usr_demo_3",
        name: "Zain Ahmed",
        email: "zain.ahmed@example.com",
        password_hash: "$2a$10$w0vHnF3l1Jt7p4YvV1s3a.K1yG6t4q7a8s9d0f1g2h3j4k5l6z7x8",
        role: "user",
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role;`,
        [u.id, u.name, u.email, u.password_hash, u.role]
      );
    }

    // 9. Sample Orders for Testing Admin Dashboard, Status Flows, and Account Orders
    console.log("📋 Seeding Sample Orders...");
    const sampleOrders = [
      {
        id: "ord_sample_101",
        order_number: "SHP-2026-8801",
        user_id: "usr_demo_1",
        subtotal: 27000,
        discount: 2700,
        shipping: 0,
        total: 24300,
        status: "DELIVERED",
        payment_status: "PAID",
        payment_method: "card",
        shipping_address: {
          firstName: "Ayaan",
          lastName: "Malik",
          email: "ayaan.malik@example.com",
          phone: "0300 1234567",
          address: "House 14, Street 9, Sector F-7/2",
          city: "Islamabad",
          postalCode: "44000",
          province: "Federal",
        },
        items: [
          {
            id: "item_101_1",
            product_id: "prod-1",
            name: "Architectural Boxy Heavyweight Tee",
            price: 8500,
            quantity: 1,
            size: "L",
            color: "Obsidian Slate",
            image: "/category-tops.jpg",
          },
          {
            id: "item_101_2",
            product_id: "prod-2",
            name: "Pleated Fluid Wool Trousers",
            price: 18500,
            quantity: 1,
            size: "32",
            color: "Charcoal Slate",
            image: "/category-bottoms.jpg",
          },
        ],
      },
      {
        id: "ord_sample_102",
        order_number: "SHP-2026-8802",
        user_id: "usr_demo_2",
        subtotal: 16500,
        discount: 0,
        shipping: 0,
        total: 16500,
        status: "SHIPPED",
        payment_status: "PAID",
        payment_method: "bank_transfer",
        shipping_address: {
          firstName: "Fatima",
          lastName: "Tariq",
          email: "fatima.tariq@example.com",
          phone: "0321 9876543",
          address: "Apartment 5B, Signature Residence, Gulberg III",
          city: "Lahore",
          postalCode: "54660",
          province: "Punjab",
        },
        items: [
          {
            id: "item_102_1",
            product_id: "prod-5",
            name: "SHOPY N° 01 — Vetiver & Smoky Amber Extrait",
            price: 16500,
            quantity: 1,
            size: "50ml",
            color: "Amber Flacon (50ml)",
            image: "/category-fragrances.jpg",
          },
        ],
      },
      {
        id: "ord_sample_103",
        order_number: "SHP-2026-8803",
        user_id: "usr_demo_3",
        subtotal: 32000,
        discount: 0,
        shipping: 0,
        total: 32000,
        status: "PREPARING",
        payment_status: "PAID",
        payment_method: "online",
        shipping_address: {
          firstName: "Zain",
          lastName: "Ahmed",
          email: "zain.ahmed@example.com",
          phone: "0333 5551234",
          address: "Bungalow 42, Block 5, Clifton",
          city: "Karachi",
          postalCode: "75600",
          province: "Sindh",
        },
        items: [
          {
            id: "item_103_1",
            product_id: "prod-4",
            name: "Sculptural Calfskin Loafers",
            price: 32000,
            quantity: 1,
            size: "42",
            color: "Onyx Black",
            image: "/category-footwear.jpg",
          },
        ],
      },
      {
        id: "ord_sample_104",
        order_number: "SHP-2026-8804",
        user_id: "usr_demo_1",
        subtotal: 24500,
        discount: 0,
        shipping: 0,
        total: 24500,
        status: "CONFIRMED",
        payment_status: "UNPAID",
        payment_method: "cod",
        shipping_address: {
          firstName: "Ayaan",
          lastName: "Malik",
          email: "ayaan.malik@example.com",
          phone: "0300 1234567",
          address: "House 14, Street 9, Sector F-7/2",
          city: "Islamabad",
          postalCode: "44000",
          province: "Federal",
        },
        items: [
          {
            id: "item_104_1",
            product_id: "prod-3",
            name: "Monochrome Minimalist Tracksuit",
            price: 24500,
            quantity: 1,
            size: "M",
            color: "Ecru Shadow",
            image: "/category-coord-sets.jpg",
          },
        ],
      },
      {
        id: "ord_sample_105",
        order_number: "SHP-2026-8805",
        user_id: "usr_demo_2",
        subtotal: 48000,
        discount: 2500,
        shipping: 0,
        total: 45500,
        status: "VERIFYING_PAYMENT",
        payment_status: "PENDING_VERIFICATION",
        payment_method: "bank_transfer",
        shipping_address: {
          firstName: "Fatima",
          lastName: "Tariq",
          email: "fatima.tariq@example.com",
          phone: "0321 9876543",
          address: "Apartment 5B, Signature Residence, Gulberg III",
          city: "Lahore",
          postalCode: "54660",
          province: "Punjab",
        },
        items: [
          {
            id: "item_105_1",
            product_id: "prod-7",
            name: "Oversized Cashmere-Blend Knit Cardigan",
            price: 26000,
            quantity: 1,
            size: "M",
            color: "Oatmeal Heather",
            image: "/product-knit-cardigan.jpg",
          },
          {
            id: "item_105_2",
            product_id: "prod-6",
            name: "Architectural Leather Minimalist Tote",
            price: 22000,
            quantity: 1,
            size: "One Size",
            color: "Slate Grey",
            image: "/category-accessories.jpg",
          },
        ],
      },
    ];

    for (const ord of sampleOrders) {
      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, subtotal, discount, shipping, total,
          status, payment_status, payment_method, shipping_address, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          payment_status = EXCLUDED.payment_status,
          total = EXCLUDED.total,
          updated_at = NOW();`,
        [
          ord.id,
          ord.order_number,
          ord.user_id,
          ord.subtotal,
          ord.discount,
          ord.shipping,
          ord.total,
          ord.status,
          ord.payment_status,
          ord.payment_method,
          JSON.stringify(ord.shipping_address),
        ]
      );

      await client.query(`DELETE FROM order_items WHERE order_id = $1;`, [ord.id]);
      for (const it of ord.items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING;`,
          [it.id, ord.id, it.product_id, it.name, it.price, it.quantity, it.size, it.color, it.image]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ PostgreSQL Seed Transaction committed successfully!");

    // 10. Clear Redis cache
    console.log("🧹 Flushing Redis Cache...");
    try {
      await redis.flushdb();
      console.log("✅ Redis Cache flushed!");
    } catch (e) {
      console.warn("⚠️ Redis flush warning (ignored):", e.message);
    }

    console.log("🎉 Sample things added successfully! Your website is ready for look and testing!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
