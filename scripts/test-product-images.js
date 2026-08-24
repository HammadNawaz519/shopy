const { db } = require('../lib/db/store');

async function testSuite() {
  console.log('=== RUNNING MULTI-IMAGE HARDENING TEST SUITE ===');

  const testId = `test_prod_${Date.now()}`;
  const initialImages = [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800'
  ];

  console.log('1. Creating test product with 3 images...');
  const created = await db.addProduct({
    id: testId,
    name: 'Multi-Image Test Silhouette',
    slug: `test-multi-image-${Date.now()}`,
    category: 'tops',
    categoryLabel: 'Tops',
    price: 12500,
    description: 'Test product for multiple image verification',
    images: initialImages,
    stockCount: 10,
    inStock: true
  });

  console.log('✓ Product created:', created.id, 'Images count:', created.images.length);
  if (created.images.length !== 3) {
    throw new Error(`Expected 3 images, got ${created.images.length}`);
  }

  console.log('2. Verifying relational product_images table records...');
  const dbImages = await db.getProductImages(testId);
  console.log('✓ Found product_images records:', dbImages.length);
  dbImages.forEach((img, idx) => {
    console.log(`   [${idx}] sortOrder: ${img.sortOrder}, url: ${img.imageUrl.slice(0, 45)}...`);
    if (img.sortOrder !== idx) {
      throw new Error(`Sort order mismatch at index ${idx}: got ${img.sortOrder}`);
    }
  });

  console.log('3. Testing Reordering: Moving Image #3 to Primary position (Index 0)...');
  const reorderedImages = [initialImages[2], initialImages[0], initialImages[1]];
  await db.updateProduct(testId, { images: reorderedImages });

  const fetchedAfterReorder = await db.getProductById(testId);
  console.log('✓ Fetched after reorder. Primary image:', fetchedAfterReorder.images[0].slice(0, 45));
  if (fetchedAfterReorder.images[0] !== initialImages[2]) {
    throw new Error('Primary image did not update to reordered position 0');
  }

  console.log('4. Testing Appending a 4th image...');
  const fourthImage = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800';
  const appendedImages = [...fetchedAfterReorder.images, fourthImage];
  await db.updateProduct(testId, { images: appendedImages });

  const fetchedAfterAppend = await db.getProductById(testId);
  console.log('✓ Total images after append:', fetchedAfterAppend.images.length);
  if (fetchedAfterAppend.images.length !== 4 || fetchedAfterAppend.images[3] !== fourthImage) {
    throw new Error('Appending failed to preserve existing images');
  }

  console.log('5. Testing Deletion of Middle Image (Index 1)...');
  const afterDeleteImages = [fetchedAfterAppend.images[0], fetchedAfterAppend.images[2], fetchedAfterAppend.images[3]];
  await db.updateProduct(testId, { images: afterDeleteImages });

  const fetchedAfterDelete = await db.getProductById(testId);
  console.log('✓ Total images after delete:', fetchedAfterDelete.images.length);
  if (fetchedAfterDelete.images.length !== 3) {
    throw new Error('Deletion failed to maintain 3 remaining images');
  }

  console.log('6. Cleaning up test product...');
  await db.deleteProduct(testId);
  const remainingCheck = await db.getProductImages(testId);
  console.log('✓ Cascade deletion verified. Remaining records for testId:', remainingCheck.length);
  if (remainingCheck.length !== 0) {
    throw new Error('Cascade deletion failed');
  }

  console.log('=== ALL MULTI-IMAGE SYSTEM TESTS PASSED PERFECTLY ===');
}

testSuite().catch(err => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
