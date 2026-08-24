const { db } = require('../lib/db/store');
const { query } = require('../lib/db/client');

async function runLifecycleTestSuite() {
  console.log('================================================================');
  console.log('  STARTING PRODUCT & CATEGORY LIFECYCLE & CLEANUP TEST SUITE  ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Individual Image Removal and Storage / Media Cleanup
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Product Multi-Image & Media Asset Cleanup ---');
  const dummyBuffer = Buffer.from('FAKE_WEBP_IMAGE_DATA_FOR_TESTING');
  const mediaAssetId = `med_test_${Date.now()}`;
  const mediaUrl = await db.saveMediaAsset(mediaAssetId, `${mediaAssetId}.webp`, 'image/webp', dummyBuffer);
  console.log('1.1. Uploaded media asset:', mediaUrl);

  const initialAssetCheck = await db.getMediaAsset(mediaAssetId);
  if (!initialAssetCheck) throw new Error('Media asset was not created in DB');
  console.log('✓ Verified media asset exists in media_assets table');

  const prodId = `prod_test_${Date.now()}`;
  const initialImages = [
    mediaUrl,
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
  ];

  const createdProd = await db.addProduct({
    id: prodId,
    name: 'Lifecycle Test Silhouette',
    slug: `test-lifecycle-${Date.now()}`,
    category: 'tops',
    categoryLabel: 'Tops',
    price: 15000,
    description: 'Testing lifecycle deletion and media asset cleaning',
    images: initialImages,
    stockCount: 10,
    inStock: true
  });
  console.log('1.2. Created product with 3 images (1 media_asset, 2 external):', createdProd.id);

  // Remove the media_asset image by updating product images to only the remaining 2
  console.log('1.3. Removing media asset image from product...');
  const updatedImages = [initialImages[1], initialImages[2]];
  await db.updateProduct(prodId, { images: updatedImages });

  const assetAfterRemoval = await db.getMediaAsset(mediaAssetId);
  if (assetAfterRemoval) {
    throw new Error('Media asset was NOT cleaned up when removed from product!');
  }
  console.log('✓ Confirmed: Removed media asset was permanently deleted from media_assets table');

  const prodImagesAfterRemoval = await db.getProductImages(prodId);
  if (prodImagesAfterRemoval.length !== 2) {
    throw new Error(`Expected 2 product_images records, got ${prodImagesAfterRemoval.length}`);
  }
  console.log('✓ Confirmed: product_images re-indexed with remaining 2 records sequentially');

  // --------------------------------------------------------------------------
  // TEST 2: Product Deletion & Complete Cleanup
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Product Permanent Deletion & Cleanup ---');
  // Upload a second media asset and attach it
  const mediaAssetId2 = `med_test2_${Date.now()}`;
  const mediaUrl2 = await db.saveMediaAsset(mediaAssetId2, `${mediaAssetId2}.webp`, 'image/webp', dummyBuffer);
  await db.updateProduct(prodId, { images: [mediaUrl2, initialImages[1]] });

  console.log('2.1. Deleting product completely:', prodId);
  const deleteResult = await db.deleteProduct(prodId);
  if (!deleteResult) throw new Error('deleteProduct returned false');

  const prodCheck = await db.getProductById(prodId);
  if (prodCheck) throw new Error('Product row was not deleted from products table');
  console.log('✓ Product row deleted from products table');

  const prodImagesCheck = await db.getProductImages(prodId);
  if (prodImagesCheck.length !== 0) throw new Error('product_images rows were not deleted');
  console.log('✓ All product_images rows deleted');

  const asset2Check = await db.getMediaAsset(mediaAssetId2);
  if (asset2Check) throw new Error('Media asset attached to deleted product was NOT deleted');
  console.log('✓ All owned media_assets permanently cleaned up');

  // --------------------------------------------------------------------------
  // TEST 3: Order History Integrity Preservation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Order History Preservation on Product Deletion ---');
  const orderTestProdId = `prod_order_test_${Date.now()}`;
  await db.addProduct({
    id: orderTestProdId,
    name: 'Historical Purchased Jacket',
    slug: `historical-jacket-${Date.now()}`,
    category: 'tops',
    categoryLabel: 'Tops',
    price: 24000,
    description: 'Ordered item for history verification',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
    stockCount: 5,
    inStock: true
  });

  const testOrderId = `ord_test_${Date.now()}`;
  await query(`
    INSERT INTO orders (id, order_number, user_id, subtotal, discount, shipping, total, status, payment_status, shipping_address)
    VALUES ($1, $2, 'usr_demo_customer', 24000, 0, 0, 24000, 'CONFIRMED', 'PAID', '{"city": "Lahore"}'::jsonb);
  `, [testOrderId, `ORD-TEST-${Date.now()}`]);

  await query(`
    INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color, image)
    VALUES ($1, $2, $3, 'Historical Purchased Jacket', 24000, 1, 'L', 'Obsidian Slate', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800');
  `, [`item_${Date.now()}`, testOrderId, orderTestProdId]);

  console.log('3.1. Created order with order item referencing product:', orderTestProdId);

  // Now delete the product
  console.log('3.2. Deleting product referenced by historical order...');
  await db.deleteProduct(orderTestProdId);

  const orderCheck = await db.getOrderById(testOrderId);
  if (!orderCheck) throw new Error('CRITICAL ERROR: Order was deleted when product was deleted!');
  console.log('✓ Order still exists with total:', orderCheck.total);

  if (!orderCheck.items || orderCheck.items.length === 0) {
    throw new Error('CRITICAL ERROR: Order items were deleted!');
  }
  const item = orderCheck.items[0];
  console.log('✓ Order item preserved snapshot details:', {
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    productId: item.productId // Expected null
  });

  if (item.name !== 'Historical Purchased Jacket' || item.price !== 24000) {
    throw new Error('Historical order item price or name was corrupted');
  }
  console.log('✓ Historical order receipts completely intact and usable');

  // Clean up test order
  await query(`DELETE FROM orders WHERE id = $1;`, [testOrderId]);

  // --------------------------------------------------------------------------
  // TEST 4: Category Deletion Without Deleting Products
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Category Deletion Without Product Loss ---');
  const catMediaId = `med_cat_${Date.now()}`;
  const catMediaUrl = await db.saveMediaAsset(catMediaId, `${catMediaId}.webp`, 'image/webp', dummyBuffer);

  const testCatId = `cat_test_${Date.now()}`;
  const testCatSlug = `test-category-${Date.now()}`;
  const createdCat = await db.addCategory({
    id: testCatId,
    name: 'Temporary Test Category',
    slug: testCatSlug,
    tagline: 'Test category for deletion verification',
    image: catMediaUrl,
    description: 'Category to test safe decoupling',
    featured: false
  });

  const catProd1 = `prod_cat1_${Date.now()}`;
  const catProd2 = `prod_cat2_${Date.now()}`;
  await db.addProduct({
    id: catProd1,
    name: 'Category Test Piece 1',
    slug: `cat-piece-1-${Date.now()}`,
    category: testCatSlug,
    categoryLabel: 'Temporary Test Category',
    price: 9000,
    description: 'Product 1 in test category',
    images: ['/editorial-craft.jpg'],
    stockCount: 5,
    inStock: true
  });
  await db.addProduct({
    id: catProd2,
    name: 'Category Test Piece 2',
    slug: `cat-piece-2-${Date.now()}`,
    category: testCatSlug,
    categoryLabel: 'Temporary Test Category',
    price: 11000,
    description: 'Product 2 in test category',
    images: ['/editorial-craft.jpg'],
    stockCount: 8,
    inStock: true
  });

  console.log('4.1. Created category and 2 products assigned to it');

  // Delete category
  console.log('4.2. Deleting category...');
  const catDeleteRes = await db.deleteCategory(createdCat.id || testCatId);
  if (!catDeleteRes.success) throw new Error(`Category deletion failed: ${catDeleteRes.error}`);

  const catCheck = await query(`SELECT * FROM categories WHERE id = $1;`, [createdCat.id || testCatId]);
  if (catCheck.rows.length !== 0) throw new Error('Category row was not deleted');
  console.log('✓ Category row deleted from categories table');

  const catAssetCheck = await db.getMediaAsset(catMediaId);
  if (catAssetCheck) throw new Error('Category media asset was not deleted');
  console.log('✓ Category media asset cleaned up');

  // Verify products STILL exist!
  const p1Check = await db.getProductById(catProd1);
  const p2Check = await db.getProductById(catProd2);
  if (!p1Check || !p2Check) {
    throw new Error('CRITICAL ERROR: Products were accidentally deleted when category was deleted!');
  }
  console.log('✓ Products preserved! Product 1 category:', p1Check.category, '| Product 2 category:', p2Check.category);

  // Clean up test products
  await db.deleteProduct(catProd1);
  await db.deleteProduct(catProd2);

  // --------------------------------------------------------------------------
  // TEST 5: Sold-Out Product Lifecycle
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Sold-Out Product Lifecycle ---');
  const soldOutProdId = `prod_soldout_${Date.now()}`;
  await db.addProduct({
    id: soldOutProdId,
    name: 'Limited Sold-Out Silhouette',
    slug: `soldout-piece-${Date.now()}`,
    category: 'tops',
    categoryLabel: 'Tops',
    price: 19500,
    description: 'Product to test sold out behavior',
    images: ['/editorial-craft.jpg'],
    stockCount: 0,
    inStock: false
  });

  const soldOutCheck = await db.getProductById(soldOutProdId);
  if (!soldOutCheck) throw new Error('Sold out product was not created in DB');
  if (soldOutCheck.inStock !== false || soldOutCheck.stockCount !== 0) {
    throw new Error('Sold out product state was not accurately set');
  }
  console.log('✓ Sold out product exists in DB with stockCount = 0 and inStock = false');

  // Restock product
  await db.updateProduct(soldOutProdId, { stockCount: 20 });
  const restockedCheck = await db.getProductById(soldOutProdId);
  if (restockedCheck.stockCount !== 20 || restockedCheck.inStock !== true) {
    throw new Error('Restocked product state was not updated to inStock = true');
  }
  console.log('✓ Restocked product is now active with stockCount = 20 and inStock = true');

  // Clean up
  await db.deleteProduct(soldOutProdId);

  console.log('\n================================================================');
  console.log('  ALL LIFECYCLE & CLEANUP TESTS PASSED WITH 100% SUCCESS  ');
  console.log('================================================================');
}

runLifecycleTestSuite().catch(err => {
  console.error('Lifecycle Test Suite Failure:', err);
  process.exit(1);
});
