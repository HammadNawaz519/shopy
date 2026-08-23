const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function checkAdminPassword() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });

  const res = await pool.query("SELECT * FROM users WHERE email = 'hammadnawaz276@gmail.com';");
  const user = res.rows[0];
  console.log("Admin user in DB:", { id: user.id, email: user.email, role: user.role });

  const matches = await bcrypt.compare("Hammad519..", user.password_hash);
  console.log("Password 'Hammad519..' matches hash?:", matches);

  if (!matches) {
    console.log("Updating password hash for Hammad519..");
    const newHash = await bcrypt.hash("Hammad519..", 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'hammadnawaz276@gmail.com';", [newHash]);
    console.log("✓ Password hash updated successfully to Hammad519..");
  }

  await pool.end();
}

checkAdminPassword();
