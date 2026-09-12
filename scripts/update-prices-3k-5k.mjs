import pg from "pg";
import { Redis } from "@upstash/redis";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const redisUrl = "https://gentle-mite-104611.upstash.io";
const redisToken = "ggAAAAAAAZijAAIgcDGUKO4Cz6SU63SrLAIPO35W_cADCfQ4ImsU_NMObTUGLw";

async function main() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const priceUpdates = [
    { id: "prod-1", price: 3200, original_price: 3800 },
    { id: "prod-8", price: 3500, original_price: 4200 },
    { id: "prod-9", price: 3600, original_price: null },
    { id: "prod-5", price: 3900, original_price: null },
    { id: "prod-10", price: 4100, original_price: null },
    { id: "prod-2", price: 4200, original_price: 4800 },
    { id: "prod-6", price: 4500, original_price: null },
    { id: "prod-3", price: 4600, original_price: 5200 },
    { id: "prod-7", price: 4800, original_price: null },
    { id: "prod-4", price: 4950, original_price: null },
  ];

  console.log("Updating product prices in Supabase PostgreSQL to 3k-5k range...");
  for (const item of priceUpdates) {
    await pool.query(
      `UPDATE products SET price = $1, original_price = $2, updated_at = NOW() WHERE id = $3;`,
      [item.price, item.original_price, item.id]
    );
    console.log(`Updated ${item.id}: Rs. ${item.price}${item.original_price ? ` (original: Rs. ${item.original_price})` : ""}`);
  }

  const res = await pool.query(
    "SELECT id, name, price, original_price FROM products ORDER BY price ASC;"
  );
  console.log("\nConfirmed products in database:");
  console.table(res.rows);

  await pool.end();

  // Invalidate Upstash Redis caches
  console.log("\nInvalidating Upstash Redis caches...");
  try {
    const redis = new Redis({ url: redisUrl, token: redisToken });
    const knownKeys = [
      'shopy:v4:products:all',
      'shopy:v4:products:{"featured":true}',
      'shopy:v4:products:{"category":"tops"}',
      'shopy:v4:products:{"category":"bottoms"}',
      'shopy:v4:products:{"category":"footwear"}',
      'shopy:v4:products:{"category":"fragrances"}',
      'shopy:v4:products:{"category":"accessories"}',
      'shopy:v4:products:{"category":"co-ord-sets"}',
      'shopy:v4:product:prod-1',
      'shopy:v4:product:prod-2',
      'shopy:v4:product:prod-3',
      'shopy:v4:product:prod-4',
      'shopy:v4:product:prod-5',
      'shopy:v4:product:prod-6',
      'shopy:v4:product:prod-7',
      'shopy:v4:product:prod-8',
      'shopy:v4:product:prod-9',
      'shopy:v4:product:prod-10',
      'shopy:v4:product:architectural-boxy-heavyweight-tee',
      'shopy:v4:product:pleated-fluid-wool-trousers',
      'shopy:v4:product:monochrome-minimalist-tracksuit',
      'shopy:v4:product:sculptural-calfskin-loafers',
      'shopy:v4:product:shopy-no-01-vetiver-smoky-amber',
      'shopy:v4:product:architectural-leather-minimalist-tote',
      'shopy:v4:product:oversized-cashmere-blend-knit-cardigan',
      'shopy:v4:product:relaxed-linen-drawstring-pants',
      'shopy:v4:product:raw-linen-dropped-shoulder-overshirt',
      'shopy:v4:product:shopy-no-02-santal-iris-blanc'
    ];
    const deletedCount = await redis.del(...knownKeys);
    console.log(`Deleted ${deletedCount} product cache keys from Upstash Redis!`);
  } catch (redisErr) {
    console.warn("Redis purge warning:", redisErr.message);
  }

  console.log("\nPrice update completed successfully!");
}

main().catch(console.error);
