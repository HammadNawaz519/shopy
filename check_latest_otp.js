const { Pool } = require("pg");

async function checkLatestOtp() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });

  const res = await pool.query("SELECT email, reset_token, reset_token_expiry FROM users WHERE email = 'hammadnawaz276@gmail.com';");
  console.log("Latest User in DB:", res.rows[0]);
  await pool.end();
}

checkLatestOtp();
