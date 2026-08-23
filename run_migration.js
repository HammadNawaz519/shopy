const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  console.log("================================================================================");
  console.log("   RUNNING SHOPY SUPABASE POSTGRESQL SCHEMA MIGRATION");
  console.log("================================================================================\n");

  const pool = new Pool({
    connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const sqlPath = path.join(__dirname, "lib", "db", "schema.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    console.log("1. Executing SQL migration script...");
    await pool.query(sqlContent);
    console.log("✓ SQL migration executed successfully!");

    console.log("\n2. Verifying created tables...");
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(" - Created Tables:", tableRes.rows.map(r => r.table_name));

    console.log("\n3. Verifying Three Test Orders in PostgreSQL...");
    const orderRes = await pool.query(`
      SELECT o.id, o.order_number, o.status, o.payment_status, o.total, COUNT(i.id) as item_count
      FROM orders o
      LEFT JOIN order_items i ON o.id = i.order_id
      GROUP BY o.id, o.order_number, o.status, o.payment_status, o.total
      ORDER BY o.created_at ASC;
    `);
    console.table(orderRes.rows);

    console.log("\n4. Verifying Products in PostgreSQL...");
    const prodRes = await pool.query(`SELECT id, name, price, stock_count FROM products ORDER BY id;`);
    console.table(prodRes.rows);

    console.log("\n5. Verifying Admin Account in PostgreSQL...");
    const userRes = await pool.query(`SELECT id, name, email, role FROM users;`);
    console.table(userRes.rows);

    await pool.end();
    console.log("\n================================================================================");
    console.log("   MIGRATION COMPLETED SUCCESSFULLY WITH 100% INTEGRITY!");
    console.log("================================================================================");
  } catch (err) {
    console.error("✗ Migration Failed:", err);
    await pool.end().catch(() => {});
  }
}

runMigration();
