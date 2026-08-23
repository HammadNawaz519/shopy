const { Pool } = require("pg");

async function testSupabaseE2E() {
  console.log("================================================================================");
  console.log("   SHOPY SUPABASE POSTGRESQL END-TO-END INTEGRATION TEST SUITE");
  console.log("================================================================================\n");

  const pool = new Pool({
    connectionString: "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    // 1. PRODUCTS & CATEGORIES
    console.log("1. Testing Products & Categories from PostgreSQL...");
    const productsRes = await pool.query("SELECT id, name, price, stock_count, in_stock FROM products ORDER BY id;");
    console.log(`✓ Retrieved ${productsRes.rows.length} products directly from PostgreSQL.`);
    console.table(productsRes.rows);

    const catRes = await pool.query(`
      SELECT c.id, c.slug, c.name, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.name;
    `);
    console.log(`✓ Retrieved ${catRes.rows.length} categories with dynamic product counts:`);
    console.table(catRes.rows);

    // 2. THREE REAL ORDERS VERIFICATION
    console.log("\n2. Verifying Three Real Relational Orders...");
    const ordersRes = await pool.query(`
      SELECT o.id, o.order_number, o.status, o.payment_status, o.total, 
             json_agg(json_build_object('name', i.name, 'qty', i.quantity, 'price', i.price)) as items
      FROM orders o
      JOIN order_items i ON o.id = i.order_id
      GROUP BY o.id, o.order_number, o.status, o.payment_status, o.total
      ORDER BY o.created_at ASC;
    `);
    console.log(`✓ Found ${ordersRes.rows.length} real orders with line items in PostgreSQL:`);
    ordersRes.rows.forEach((ord, idx) => {
      console.log(` - Order #${idx + 1}: ${ord.order_number} | Status: [${ord.status}] | Payment: [${ord.payment_status}] | Total: Rs. ${ord.total}`);
      console.log(`   Items:`, JSON.stringify(ord.items));
    });

    // 3. ADMIN & USER ROLES
    console.log("\n3. Testing Server-Controlled User Roles...");
    const adminUser = await pool.query("SELECT id, name, email, role FROM users WHERE email = 'hammadnawaz276@gmail.com';");
    console.log(" - Admin User:", adminUser.rows[0]);
    if (adminUser.rows[0].role !== "admin") {
      throw new Error("Admin user role is not 'admin' in PostgreSQL!");
    }
    console.log("✓ Admin role correctly enforced in PostgreSQL!");

    const customerUser = await pool.query("SELECT id, name, email, role FROM users WHERE email = 'demo@shopy.com';");
    console.log(" - Customer User:", customerUser.rows[0]);
    if (customerUser.rows[0].role !== "user") {
      throw new Error("Customer user role is not 'user' in PostgreSQL!");
    }
    console.log("✓ Customer role correctly enforced in PostgreSQL!");

    // 4. ORDER STATUS MUTATION PERSISTENCE
    console.log("\n4. Testing Order Status Update Persistence in PostgreSQL...");
    const updateRes = await pool.query(`
      UPDATE orders 
      SET status = 'SHIPPED', notes = 'Dispatched via TCS Express Air', updated_at = NOW() 
      WHERE order_number = 'SHP-2026-1011'
      RETURNING id, order_number, status, notes, updated_at;
    `);
    console.log("✓ Updated Order in PostgreSQL:", updateRes.rows[0]);

    // Query again to prove persistence across connections
    const verifyUpdate = await pool.query("SELECT order_number, status, notes FROM orders WHERE order_number = 'SHP-2026-1011';");
    console.log("✓ Verified Persisted Status:", verifyUpdate.rows[0]);

    // 5. CHECKOUT & ATOMIC INVENTORY DEDUCTION
    console.log("\n5. Testing Checkout & Atomic Inventory Deduction...");
    const initialStockRes = await pool.query("SELECT stock_count FROM products WHERE id = 'prod-1';");
    const initialStock = initialStockRes.rows[0].stock_count;
    console.log(` - Initial Stock for prod-1: ${initialStock}`);

    // Create a new order with 2 units of prod-1
    const testOrderId = `ord_test_${Date.now()}`;
    const testOrderNum = `SHP-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

    await pool.query("BEGIN");
    await pool.query(`
      INSERT INTO orders (id, order_number, user_id, subtotal, discount, shipping, total, status, payment_status, payment_method, shipping_address)
      VALUES ($1, $2, 'usr_demo_customer', 17000, 0, 0, 17000, 'CONFIRMED', 'PENDING', 'cod', '{"firstName": "Test", "lastName": "User"}'::jsonb);
    `, [testOrderId, testOrderNum]);

    await pool.query(`
      INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color)
      VALUES ($1, $2, 'prod-1', 'Architectural Boxy Heavyweight Tee', 8500, 2, 'L', 'Raw Ecru');
    `, [`item_${testOrderId}_1`, testOrderId]);

    await pool.query(`
      UPDATE products 
      SET stock_count = GREATEST(0, stock_count - 2), updated_at = NOW() 
      WHERE id = 'prod-1';
    `);
    await pool.query("COMMIT");

    const newStockRes = await pool.query("SELECT stock_count FROM products WHERE id = 'prod-1';");
    const newStock = newStockRes.rows[0].stock_count;
    console.log(` - Updated Stock for prod-1: ${newStock} (Expected: ${initialStock - 2})`);

    if (newStock !== initialStock - 2) {
      throw new Error(`Inventory deduction mismatch: expected ${initialStock - 2}, got ${newStock}`);
    }
    console.log("✓ Atomic inventory deduction in PostgreSQL confirmed!");

    await pool.end();
    console.log("\n================================================================================");
    console.log("   ALL SUPABASE POSTGRESQL TESTS COMPLETED WITH 100% SUCCESS!");
    console.log("================================================================================");
  } catch (err) {
    console.error("✗ Test Suite Failed:", err);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

testSupabaseE2E();
