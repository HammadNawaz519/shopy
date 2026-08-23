async function debug() {
  const BASE_URL = "http://localhost:3000";
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "hammadnawaz276@gmail.com",
      password: "Hammad519..",
    }),
  });
  console.log("Login status:", loginRes.status);
  const text = await loginRes.text();
  console.log("Login response text:", text.substring(0, 300));
}
debug();
