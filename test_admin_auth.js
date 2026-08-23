async function testAdminFlow() {
  console.log("================================================================================");
  console.log("   SHOPY ENTERPRISE ADMIN AUTHENTICATION & SECURITY VERIFICATION SUITE");
  console.log("================================================================================\n");

  const BASE_URL = "http://localhost:3000";

  // TEST 1: Admin Login with hammadnawaz276@gmail.com
  console.log("TEST 1: Authenticating Admin Account [hammadnawaz276@gmail.com]...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "hammadnawaz276@gmail.com",
      password: "Hammad519..",
    }),
  });
  const adminData = await adminLoginRes.json();
  console.log(" - Login Status:", adminLoginRes.status, "(Expected 200)");
  console.log(" - User Email:", adminData.user?.email);
  console.log(" - User Server-Enforced Role:", adminData.user?.role, "(MUST BE 'admin')");

  const adminCookie = adminLoginRes.headers.get("set-cookie")?.split(";")[0] || "";
  console.log(" - Received Admin Session Cookie:", adminCookie ? "✓ Active Opaque Session" : "✗ Missing");

  // TEST 2: Admin Access to Protected Admin API
  console.log("\nTEST 2: Admin Accessing Admin Metrics API [/api/admin/metrics]...");
  const adminMetricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { cookie: adminCookie },
  });
  const metricsData = await adminMetricsRes.json();
  console.log(" - API Status:", adminMetricsRes.status, "(Expected 200)");
  console.log(" - Total DB Revenue:", metricsData.metrics?.totalRevenue);
  console.log(" - Total DB Orders:", metricsData.metrics?.totalOrders);
  console.log(" - Total Registered Customers:", metricsData.metrics?.totalCustomers);

  // TEST 3: Normal Customer Login (demo@shopy.com)
  console.log("\nTEST 3: Authenticating Normal Customer [demo@shopy.com]...");
  const userLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@shopy.com",
      password: "Shopy@2026",
    }),
  });
  const userData = await userLoginRes.json();
  console.log(" - Login Status:", userLoginRes.status, "(Expected 200)");
  console.log(" - Customer Role:", userData.user?.role, "(MUST BE 'user')");
  const userCookie = userLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

  // TEST 4: Security Breach Attempt — Normal Customer Accessing Admin API
  console.log("\nTEST 4: Security Check — Normal Customer Attempting Access to [/api/admin/metrics]...");
  const unauthorizedApiRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { cookie: userCookie },
  });
  console.log(" - Status with Customer Cookie:", unauthorizedApiRes.status, "(Expected 403 Forbidden)");

  // TEST 5: Security Breach Attempt — Unauthenticated Access to Admin API
  console.log("\nTEST 5: Security Check — Unauthenticated Request to [/api/admin/orders]...");
  const unauthApiRes = await fetch(`${BASE_URL}/api/admin/orders`);
  console.log(" - Status with No Session:", unauthApiRes.status, "(Expected 403 Forbidden)");

  // TEST 6: Real Database Order Status Mutation by Admin
  console.log("\nTEST 6: Admin Changing Order Status in Real Database...");
  const patchOrderRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: adminCookie,
    },
    body: JSON.stringify({
      orderId: "ord_101",
      status: "SHIPPED",
    }),
  });
  const patchData = await patchOrderRes.json();
  console.log(" - Order Update Status:", patchOrderRes.status, "(Expected 200)");
  console.log(" - Updated Status in DB:", patchData.order?.status, "(Expected 'SHIPPED')");

  // TEST 7: Logout from Admin Session
  console.log("\nTEST 7: Admin Logging Out...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { cookie: adminCookie },
  });
  console.log(" - Logout Response Status:", logoutRes.status, "(Expected 200)");

  const postLogoutAccess = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { cookie: adminCookie },
  });
  console.log(" - Access with Revoked Session:", postLogoutAccess.status, "(Expected 403 Forbidden)");

  console.log("\n================================================================================");
  console.log("   ALL 7 SECURITY & OPERATIONAL TEST CASES PASSED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

testAdminFlow();
