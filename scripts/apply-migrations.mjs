import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("Applying database performance indexes...");

  // 1. New indexes for customer email join and review moderation
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_shipping_email ON orders USING btree (LOWER(shipping_address->>'email'));
    CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON reviews USING btree (status, created_at DESC);
  `);
  console.log("✅ Created idx_orders_shipping_email and idx_reviews_status_created");

  // 2. Drop genuinely redundant indexes that duplicate existing UNIQUE constraints
  await pool.query(`
    DROP INDEX IF EXISTS idx_categories_slug;
    DROP INDEX IF EXISTS idx_products_slug;
    DROP INDEX IF EXISTS idx_orders_order_number;
  `);
  console.log("✅ Removed redundant duplicate indexes (idx_categories_slug, idx_products_slug, idx_orders_order_number)");

  await pool.end();
}

main().catch(console.error);
