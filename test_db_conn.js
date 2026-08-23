const { Pool } = require("pg");

async function testVariousConnections() {
  const configs = [
    {
      name: "Pooler Port 6543 (Transaction Mode)",
      connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    },
    {
      name: "Pooler Port 5432 (Session Mode)",
      connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    },
    {
      name: "Direct Host Port 5432",
      connectionString: "postgresql://postgres:Hammad519..@db.apcaymgrxzjrlbtnohxx.supabase.co:5432/postgres",
    },
  ];

  for (const cfg of configs) {
    console.log(`\nTesting: ${cfg.name}...`);
    const pool = new Pool({
      connectionString: cfg.connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      const res = await pool.query("SELECT NOW() as current_time, version();");
      console.log(`✓ SUCCESS on ${cfg.name}!`);
      console.log(" - DB Time:", res.rows[0].current_time);
      await pool.end();
      return cfg.connectionString;
    } catch (err) {
      console.log(`✗ Failed on ${cfg.name}: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
}

testVariousConnections();
