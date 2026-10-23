import { Pool } from "pg";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * SHOPY — Store Pages one-time schema migration
 *
 * Creates the admin "Pages" feature schema:
 *   1. landing_pages table (custom storefront landing pages)
 *   2. categories.target_page (collection image link target; NULL = standard collection page)
 *   3. homepage_config.collections_title (editable "Collections" section title)
 *
 * All statements are idempotent (IF NOT EXISTS) and never drop or rewrite data.
 * Safe to run repeatedly. Usage:
 *
 *   node scripts/migrate-store-pages.mjs
 *
 * Connection resolution (first match wins; real env vars always beat files):
 *   1. process.env.DIRECT_URL / process.env.DATABASE_URL, or
 *   2. the same keys from the project's .env.local / .env (plain `node` does
 *      not load them automatically — parsed here), or
 *   3. the built-in fallback (Supabase pooler).
 * The DIRECT connection (port 5432) is tried before the pooler: DDL on a
 * dedicated connection is the most reliable path, and pooler connections from
 * some local networks time out.
 *
 * Modeled on scripts/migrate-homepage-schema.mjs (repository migration convention).
 */

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env / .env.local loader for bare `node` invocations (no dependencies).
function loadProjectEnv() {
  for (const file of [".env.local", ".env"]) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) continue;
    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      if (key in process.env) continue; // real environment always wins
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1);
      }
      if (value) process.env[key] = value;
    }
  }
}

const FALLBACK_POOLER_URL =
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

loadProjectEnv();

// DIRECT connection first (dedicated 5432), then the pooler, then the fallback.
const candidateUrls = [process.env.DIRECT_URL, process.env.DATABASE_URL, FALLBACK_POOLER_URL].filter(
  (url, index, list) => url && list.indexOf(url) === index
);

const statusSql = `
  SELECT
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'landing_pages') AS landing_pages,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'target_page') AS categories_target_page,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_config' AND column_name = 'collections_title') AS homepage_collections_title;
`;

function poolFor(connectionString) {
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
}

async function run() {
  let lastError = null;

  for (const connectionString of candidateUrls) {
    const source = connectionString === FALLBACK_POOLER_URL ? "built-in fallback" : process.env.DIRECT_URL === connectionString ? "DIRECT_URL" : "DATABASE_URL";
    console.log(`Trying connection (${source}): ${connectionString.replace(/:\/\/[^@]+@/, "://***@")}`);

    const pool = poolFor(connectionString);
    try {
      const client = await pool.connect();

      const before = await client.query(statusSql);
      console.log("Store-pages schema status before:", before.rows[0]);

      // 1. Landing pages table (admin-managed custom storefront pages)
      await client.query(`
        CREATE TABLE IF NOT EXISTS landing_pages (
          id VARCHAR(50) PRIMARY KEY,
          slug VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          body TEXT,
          order_index INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("✅ landing_pages table ready");

      // 2. Collection image link target (nullable — existing rows untouched)
      await client.query(`
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS target_page VARCHAR(100);
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_categories_target_page ON categories(target_page);
      `);
      console.log("✅ categories.target_page + index ready");

      // 3. Editable collections section title (existing row backfilled with the default)
      await client.query(`
        ALTER TABLE homepage_config ADD COLUMN IF NOT EXISTS collections_title VARCHAR(100) NOT NULL DEFAULT 'Collections';
      `);
      console.log("✅ homepage_config.collections_title ready");

      const after = await client.query(statusSql);
      console.log("Store-pages schema status after:", after.rows[0]);

      const s = after.rows[0];
      client.release();
      await pool.end();

      if (s.landing_pages && s.categories_target_page && s.homepage_collections_title) {
        console.log("Migration successful: store-pages schema complete.");
        return;
      }
      console.error("Migration incomplete: some objects were not created. Check the messages above.");
      process.exitCode = 1;
      return;
    } catch (err) {
      lastError = err;
      console.error(`Connection/step failed via ${source}: ${err.message}`);
      try {
        await pool.end();
      } catch {}
      // Try the next candidate connection.
    }
  }

  console.error("\nAll connection candidates failed. Last error:");
  console.error(lastError);
  console.error("\nHints: check your network/VPN, or set $env:DIRECT_URL / $env:DATABASE_URL and re-run.");
  process.exitCode = 1;
}

run();
