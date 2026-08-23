async function testLoginPerf2() {
  const BASE_URL = "http://localhost:3000";

  const startHome = performance.now();
  const homeRes = await fetch(`${BASE_URL}/`);
  const endHome = performance.now();
  console.log(`✓ Home Page (/) Status: ${homeRes.status} | Time: ${(endHome - startHome).toFixed(2)}ms`);

  const startLogin = performance.now();
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "hammadnawaz276@gmail.com",
      password: "Hammad519..",
    }),
  });
  const endLogin = performance.now();
  const loginData = await loginRes.json();
  console.log(`✓ Login API (/api/auth/login) Status: ${loginRes.status} | Time: ${(endLogin - startLogin).toFixed(2)}ms`);

  const rawCookie = loginRes.headers.get("set-cookie");
  if (rawCookie) {
    const cookieHeader = rawCookie.split(";")[0];
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meData = await meRes.json();
    console.log(`✓ Me API (/api/auth/me) Status: ${meRes.status} | User Role:`, meData.user?.role);
  }
}

testLoginPerf2();
