const { Pool } = require("pg");

async function testRegisterOtpFlow() {
  console.log("================================================================================");
  console.log("   SHOPY REAL-WORLD REGISTRATION OTP & ROLE ROUTING TEST SUITE");
  console.log("================================================================================\n");

  const pool = new Pool({
    connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });

  const BASE_URL = "http://localhost:3000";

  // --------------------------------------------------------------------------
  // TEST 1: ADMIN ACCOUNT (hammadnawaz276@gmail.com)
  // --------------------------------------------------------------------------
  console.log("TEST 1: Registration / Access for Super Admin [hammadnawaz276@gmail.com]...");
  
  // Step 1: Request OTP Code
  const adminReq = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hammad Nawaz",
      email: "hammadnawaz276@gmail.com",
      password: "Hammad519..",
    }),
  });
  const adminReqData = await adminReq.json();
  console.log(" - Step 1 Status:", adminReq.status, "(Expected 200)");
  console.log(" - Requires OTP:", adminReqData.requiresOtp, "(Expected true)");
  console.log(" - Message:", adminReqData.message);

  // Retrieve OTP code from PostgreSQL
  const dbAdmin = await pool.query("SELECT reset_token FROM users WHERE email = 'hammadnawaz276@gmail.com';");
  const adminOtp = dbAdmin.rows[0].reset_token;
  console.log(" - Dispatched Admin OTP Code from PostgreSQL:", adminOtp);

  // Step 2: Verify OTP Code
  const adminVerify = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "hammadnawaz276@gmail.com",
      otpCode: adminOtp,
      action: "verify",
    }),
  });
  const adminVerifyData = await adminVerify.json();
  console.log(" - Step 2 Status:", adminVerify.status, "(Expected 200)");
  console.log(" - Authenticated Role:", adminVerifyData.user?.role, "(Expected 'admin')");

  if (adminVerifyData.user?.role !== "admin") {
    throw new Error("Admin user did not receive 'admin' role upon verification!");
  }
  console.log("✓ Super Admin correctly verified with role = 'admin' -> Routes to /admin!");

  // --------------------------------------------------------------------------
  // TEST 2: CUSTOMER ACCOUNT (new_customer@shopy.com)
  // --------------------------------------------------------------------------
  console.log("\nTEST 2: Registration for Standard Customer [new_customer@shopy.com]...");

  // Step 1: Request OTP Code
  const custReq = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Taimoor Ali",
      email: "new_customer@shopy.com",
      password: "Customer519..",
    }),
  });
  const custReqData = await custReq.json();
  console.log(" - Step 1 Status:", custReq.status, "(Expected 200)");
  console.log(" - Requires OTP:", custReqData.requiresOtp, "(Expected true)");

  // Retrieve OTP code from PostgreSQL
  const dbCust = await pool.query("SELECT reset_token FROM users WHERE email = 'new_customer@shopy.com';");
  const custOtp = dbCust.rows[0].reset_token;
  console.log(" - Dispatched Customer OTP Code from PostgreSQL:", custOtp);

  // Step 2: Verify OTP Code
  const custVerify = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "new_customer@shopy.com",
      otpCode: custOtp,
      action: "verify",
    }),
  });
  const custVerifyData = await custVerify.json();
  console.log(" - Step 2 Status:", custVerify.status, "(Expected 200)");
  console.log(" - Authenticated Role:", custVerifyData.user?.role, "(Expected 'user')");

  if (custVerifyData.user?.role !== "user") {
    throw new Error("Customer user did not receive 'user' role upon verification!");
  }
  console.log("✓ Customer correctly verified with role = 'user' -> Routes to /account / website!");

  await pool.end();
  console.log("\n================================================================================");
  console.log("   ALL REGISTRATION OTP & ROLE ROUTING TESTS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

testRegisterOtpFlow();
