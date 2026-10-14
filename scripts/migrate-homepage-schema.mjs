import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Checking columns for homepage_config...");
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'homepage_config';
    `);
    console.log("Existing columns:", res.rows.map(r => r.column_name));

    // Add new columns safely
    await client.query(`
      ALTER TABLE homepage_config 
      ADD COLUMN IF NOT EXISTS hero_text_color VARCHAR(30) DEFAULT '#FFFFFF',
      ADD COLUMN IF NOT EXISTS hero_image_fit VARCHAR(30) DEFAULT 'cover',
      ADD COLUMN IF NOT EXISTS hero_image_position VARCHAR(30) DEFAULT 'center',
      ADD COLUMN IF NOT EXISTS hero_mobile_image TEXT DEFAULT '';
    `);
    console.log("Migration successful: Added hero_text_color, hero_image_fit, hero_image_position, hero_mobile_image");

    const updated = await client.query(`SELECT * FROM homepage_config LIMIT 1;`);
    console.log("Current row:", updated.rows[0]);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
