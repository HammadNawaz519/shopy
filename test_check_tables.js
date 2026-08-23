const { Pool } = require("pg");

async function checkExistingTables() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });

  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log("Existing tables in public schema:", res.rows.map(r => r.table_name));
  await pool.end();
}

checkExistingTables();
