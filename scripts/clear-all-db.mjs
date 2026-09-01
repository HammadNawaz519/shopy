import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function clearDatabase() {
  console.log("🧹 Starting complete database wipe...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Disable foreign key constraints during wipe
    console.log("🗑️ Truncating all data tables...");
    await client.query(`
      TRUNCATE TABLE 
        order_items,
        orders,
        reviews,
        product_images,
        products,
        categories,
        discounts,
        user_carts,
        inquiries,
        newsletter_subscribers,
        users
      RESTART IDENTITY CASCADE;
    `);

    // Try wiping media_assets if it exists
    try {
      await client.query(`TRUNCATE TABLE media_assets RESTART IDENTITY CASCADE;`);
    } catch {}

    // Reset store_settings to clean initial default
    console.log("⚙️ Resetting store_settings to defaults...");
    await client.query(`
      DELETE FROM store_settings;
      INSERT INTO store_settings (
        id, store_name, support_email, currency, currency_symbol,
        free_shipping_threshold, flat_shipping_rate, tax_percentage,
        order_notifications, inventory_alert_threshold,
        cod_enabled, bank_transfer_enabled,
        updated_at
      ) VALUES (
        'settings_default', 'SHOPY Atelier', 'concierge@shopy.com', 'PKR', 'Rs.',
        15000, 500, 0,
        true, 5,
        true, true,
        NOW()
      );
    `);

    // Reset homepage_config to clean initial default
    console.log("🖼️ Resetting homepage_config to defaults...");
    await client.query(`
      DELETE FROM homepage_config;
      INSERT INTO homepage_config (
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
      );
    `);

    // Reset navigation_items to default clean items
    console.log("🧭 Resetting navigation_items to defaults...");
    await client.query(`
      DELETE FROM navigation_items;
      INSERT INTO navigation_items (id, name, href, order_index, is_active, category_slug)
      VALUES
        ('nav_1', 'home', '/', 0, true, null),
        ('nav_2', 'view all', '/products', 1, true, null),
        ('nav_3', 'tops', '/collections/tops', 2, true, 'tops'),
        ('nav_4', 'bottoms', '/collections/bottoms', 3, true, 'bottoms'),
        ('nav_5', 'co-ord sets', '/collections/co-ord-sets', 4, true, 'co-ord-sets'),
        ('nav_6', 'footwear', '/collections/footwear', 5, true, 'footwear'),
        ('nav_7', 'fragrances', '/collections/fragrances', 6, true, 'fragrances'),
        ('nav_8', 'collections', '/collections', 7, true, null)
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query("COMMIT");
    console.log("✅ Database wiped completely and committed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to clear database:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

clearDatabase().catch(console.error);
