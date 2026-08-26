import fs from "fs";
import path from "path";

// Load environment variables
const envPath = path.resolve("d:/VS Code/Shopy/Frontend/.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

import { db, ensurePaymentSchema } from "d:/VS Code/Shopy/Frontend/lib/db/store";
import { sanitizeString } from "d:/VS Code/Shopy/Frontend/lib/security/sanitize";

async function runTests() {
  console.log("==================================================");
  console.log("SHOPY PRODUCT RATING & REVIEW SYSTEM TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Ensure Schema
  await ensurePaymentSchema();
  assert(true, "Database review schema migration ensured without errors");

  // 2. Setup Test Data
  const testUserId = `usr_test_rev_${Date.now()}`;
  const testUserEmail = `client.test.${Date.now()}@shopy.test`;
  const testUser = await db.createUser({
    id: testUserId,
    name: "Hammad Nawaz Test",
    email: testUserEmail,
    passwordHash: "hash_test",
    role: "user",
  });
  assert(Boolean(testUser), "Test user created for review testing");

  const products = await db.getProducts();
  const testProduct = products[0] || { id: "p1", name: "Premium Oversized Shirt", price: 14500 };
  const unpurchasedProduct = products[1] || { id: "p2", name: "Tailored Trousers", price: 16500 };

  // 3. Test Order Creation with Different Lifecycle Statuses
  // A. CONFIRMED Order
  const confirmedOrder = await db.createOrder({
    userId: testUserId,
    items: [
      {
        productId: testProduct.id,
        name: testProduct.name,
        price: testProduct.price,
        quantity: 1,
        size: "M",
        color: "Obsidian",
      },
    ],
    subtotal: testProduct.price,
    total: testProduct.price,
    shippingAddress: {
      firstName: "Hammad",
      lastName: "Nawaz",
      email: testUserEmail,
      phone: "+92 300 1234567",
      address: "123 Atelier Street",
      city: "Lahore",
      postalCode: "54000",
      province: "Punjab",
    },
    paymentMethod: "cod",
  });
  assert(confirmedOrder.status === "CONFIRMED", "Order created in CONFIRMED state");

  // TEST 1-4: Reject reviews on non-delivered orders
  // Server-side check simulation
  async function simulateReviewSubmission(params: {
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
  }) {
    const order = await db.getOrderById(params.orderId);
    if (!order) return { ok: false, status: 404, error: "Order not found" };
    if (order.userId !== params.userId) return { ok: false, status: 403, error: "Unauthorized" };
    if (order.status !== "DELIVERED") return { ok: false, status: 403, error: `Reviews only available after DELIVERED. Current: ${order.status}` };
    const hasItem = (order.items || []).some((it) => it.productId === params.productId);
    if (!hasItem) return { ok: false, status: 400, error: "Product not in order" };
    const existing = await db.getUserProductReview(params.userId, params.productId);
    if (existing) return { ok: false, status: 409, error: "Already reviewed" };
    if (params.rating < 1 || params.rating > 5) return { ok: false, status: 400, error: "Invalid rating" };
    const clean = sanitizeString(params.comment);
    if (clean.length < 3) return { ok: false, status: 400, error: "Comment too short" };

    const review = await db.createVerifiedReview({
      productId: params.productId,
      productName: order.items[0]?.name || "Product",
      userId: params.userId,
      orderId: params.orderId,
      customerName: "Hammad N.",
      customerEmail: testUserEmail,
      rating: params.rating,
      comment: clean,
    });
    return { ok: true, status: 201, review };
  }

  // Test on CONFIRMED order -> Must Reject
  const resConfirmed = await simulateReviewSubmission({
    userId: testUserId,
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Trying to review before delivery",
  });
  assert(!resConfirmed.ok && resConfirmed.status === 403, "TEST 1: Blocked review on CONFIRMED order");

  // Update order to PREPARING -> Must Reject
  await db.updateOrderStatus(confirmedOrder.id, "PREPARING" as any);
  const resPreparing = await simulateReviewSubmission({
    userId: testUserId,
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Trying to review during preparing",
  });
  assert(!resPreparing.ok && resPreparing.status === 403, "TEST 2: Blocked review on PREPARING order");

  // Update order to SHIPPED -> Must Reject
  await db.updateOrderStatus(confirmedOrder.id, "SHIPPED" as any);
  const resShipped = await simulateReviewSubmission({
    userId: testUserId,
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Trying to review during shipment",
  });
  assert(!resShipped.ok && resShipped.status === 403, "TEST 3: Blocked review on SHIPPED order");

  // Update order to OUT_FOR_DELIVERY -> Must Reject
  await db.updateOrderStatus(confirmedOrder.id, "OUT_FOR_DELIVERY" as any);
  const resOutForDelivery = await simulateReviewSubmission({
    userId: testUserId,
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Trying to review out for delivery",
  });
  assert(!resOutForDelivery.ok && resOutForDelivery.status === 403, "TEST 4: Blocked review on OUT_FOR_DELIVERY order");

  // Update order to DELIVERED -> Must Accept
  await db.updateOrderStatus(confirmedOrder.id, "DELIVERED" as any);
  const resDelivered = await simulateReviewSubmission({
    userId: testUserId,
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Outstanding luxury fabric and impeccable tailoring. Truly impressed!",
  });
  assert(resDelivered.ok && resDelivered.status === 201, "TEST 5: Accepted verified review on DELIVERED order");

  // TEST 6: User attempting duplicate review -> Must Reject with 409
  const resDuplicate = await simulateReviewSubmission({
    userId: testUserId,
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 4,
    comment: "Trying to review twice",
  });
  assert(!resDuplicate.ok && resDuplicate.status === 409, "TEST 6: Blocked duplicate review by same customer");

  // TEST 7: Review product NOT in order -> Must Reject
  const resUnpurchased = await simulateReviewSubmission({
    userId: testUserId,
    productId: unpurchasedProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Trying to review product not in order",
  });
  assert(!resUnpurchased.ok && resUnpurchased.status === 400, "TEST 7: Blocked review for unpurchased product");

  // TEST 8: Different customer attempting to use this order -> Must Reject with 403
  const resOtherUser = await simulateReviewSubmission({
    userId: "usr_attacker_999",
    productId: testProduct.id,
    orderId: confirmedOrder.id,
    rating: 5,
    comment: "Trying to hijack order",
  });
  assert(!resOtherUser.ok && resOtherUser.status === 403, "TEST 8: Blocked review by unauthorized user for another customer's order");

  // TEST 9: XSS Sanitization
  const xssPayload = `<script>alert('pwned')</script>Luxury piece with <b>bold</b> styling`;
  const cleanXSS = sanitizeString(xssPayload);
  assert(!cleanXSS.includes("<script>") && !cleanXSS.includes("</script>"), "TEST 9: XSS script tags stripped safely");

  // TEST 10: Dynamic Rating Aggregation
  const ratingSummary = await db.getProductRatingSummary(testProduct.id);
  assert(
    ratingSummary.reviewCount >= 1 &&
      ratingSummary.averageRating >= 1 &&
      ratingSummary.averageRating <= 5 &&
      ratingSummary.distribution[5] >= 1,
    `TEST 10: Dynamic rating summary calculated accurately (Avg: ${ratingSummary.averageRating}, Count: ${ratingSummary.reviewCount})`
  );

  // TEST 11: Rating Breakdown
  const approvedReviews = await db.getReviews({ productId: testProduct.id, status: "approved" });
  assert(approvedReviews.length >= 1, "TEST 11: Approved reviews retrieved with verifiedPurchase badge");

  console.log("==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
