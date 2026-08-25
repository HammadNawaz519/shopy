import { query, transaction } from "./client";

export const ADMIN_EMAIL = "hammadnawaz276@gmail.com";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "UNPAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "cod" | "online" | "card";

export interface OrderPaymentDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  paymentContact?: string;
  instructions?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  storagePath?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  description: string;
  tag?: string;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  composition: string[];
  careInstructions: string[];
  details: string[];
  featured?: boolean;
  inStock: boolean;
  stockCount: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  resetToken?: string;
  resetTokenExpiry?: number;
  createdAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDetails?: OrderPaymentDetails;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder?: number;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  expiresAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  supportEmail: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  flatShippingRate: number;
  taxPercentage: number;
  orderNotifications: boolean;
  inventoryAlertThreshold: number;
  // Bank & Online Payment Configuration
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIban?: string;
  bankPaymentContact?: string;
  bankPaymentInstructions?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialLinkedIn?: string;
  socialYouTube?: string;
}

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  orderIndex: number;
  isActive: boolean;
  categorySlug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomepageConfig {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtaText: string;
  heroCtaLink: string;
  featuredTitle: string;
  featuredSubtitle: string;
  editorialTag: string;
  editorialTitle: string;
  editorialQuote: string;
  editorialImage1: string;
  editorialImage2: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  updatedAt?: string;
}

// Transform PostgreSQL Row to Product Interface
function mapProductRow(row: any): Product {
  let images: string[] = [];
  if (Array.isArray(row.ordered_images)) {
    images = row.ordered_images.filter(Boolean);
  } else if (typeof row.ordered_images === "string") {
    try {
      const parsed = JSON.parse(row.ordered_images);
      if (Array.isArray(parsed)) images = parsed.filter(Boolean);
    } catch {}
  }
  if (images.length === 0 && Array.isArray(row.images)) {
    images = row.images.filter(Boolean);
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category_slug || "tops",
    categoryLabel: row.category_label || "Tops",
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    description: row.description,
    tag: row.tag || "NEW",
    images: images.length > 0 ? images : ["/editorial-craft.jpg"],
    colors: Array.isArray(row.colors) ? row.colors : typeof row.colors === "string" ? JSON.parse(row.colors) : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    composition: Array.isArray(row.composition) ? row.composition : [],
    careInstructions: Array.isArray(row.care_instructions) ? row.care_instructions : [],
    details: Array.isArray(row.details) ? row.details : [],
    featured: Boolean(row.featured),
    inStock: Boolean(row.in_stock),
    stockCount: Number(row.stock_count || 0),
  };
}

// Transform PostgreSQL Row to OrderRecord Interface
function mapOrderRow(row: any): OrderRecord {
  let items: OrderItemRecord[] = [];
  if (Array.isArray(row.items)) {
    items = row.items
      .filter((it: any) => it && it.id)
      .map((it: any) => ({
        id: it.id,
        orderId: it.order_id || row.id,
        productId: it.product_id,
        name: it.name,
        price: Number(it.price),
        quantity: Number(it.quantity),
        size: it.size,
        color: it.color,
        image: it.image,
      }));
  }

  const shippingAddress =
    typeof row.shipping_address === "string"
      ? JSON.parse(row.shipping_address)
      : row.shipping_address || {};

  let paymentDetails: OrderPaymentDetails | undefined = undefined;
  if (row.payment_details) {
    paymentDetails =
      typeof row.payment_details === "string"
        ? JSON.parse(row.payment_details)
        : row.payment_details;
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    shipping: Number(row.shipping || 0),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status || "PENDING",
    paymentMethod: row.payment_method || "cod",
    paymentDetails,
    shippingAddress,
    notes: row.notes,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

// Transform PostgreSQL Row to UserRecord Interface
function mapUserRow(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role === "admin" || row.email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user",
    resetToken: row.reset_token || undefined,
    resetTokenExpiry: row.reset_token_expiry ? Number(row.reset_token_expiry) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

let schemaEnsured = false;

export async function ensurePaymentSchema(): Promise<void> {
  if (schemaEnsured) return;
  try {
    // 1. Add bank payment columns to store_settings
    await query(`
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255) DEFAULT 'SHOPY Retail Private Limited';
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_account_title VARCHAR(255) DEFAULT 'SHOPY Main Operations';
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255) DEFAULT 'Meezan Bank Limited';
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100) DEFAULT '01020304050607';
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_iban VARCHAR(100) DEFAULT 'PK12MEZN0001020304050607';
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_payment_contact VARCHAR(100) DEFAULT '+92 300 1234567';
      ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bank_payment_instructions TEXT DEFAULT 'Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.';
    `);

    // 2. Add payment_details JSONB snapshot to orders
    await query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB;
    `);

    // 3. Relax constraints to safely support 'online' and 'UNPAID'
    await query(`
      DO $$
      BEGIN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
        ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cod', 'online', 'card'));
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      DO $$
      BEGIN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
        ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('PENDING', 'PAID', 'UNPAID', 'FAILED', 'REFUNDED'));
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    schemaEnsured = true;
  } catch (err) {
    console.error("[SCHEMA MIGRATION ERROR]", err);
  }
}

class SupabaseDataStore {
  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  async getProducts(filter?: { category?: string; featured?: boolean; search?: string; sort?: string }): Promise<Product[]> {
    await this.ensureTablesExist();
    let sql = `
      SELECT p.*,
        (
          SELECT json_agg(pi.image_url ORDER BY pi.sort_order ASC, pi.created_at ASC)
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) as ordered_images
      FROM products p
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.category) {
      params.push(filter.category.toLowerCase());
      sql += ` AND LOWER(p.category_slug) = $${params.length}`;
    }

    if (filter?.featured !== undefined) {
      params.push(filter.featured);
      sql += ` AND p.featured = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.description) LIKE $${params.length})`;
    }

    if (filter?.sort === "price-asc") {
      sql += ` ORDER BY p.price ASC;`;
    } else if (filter?.sort === "price-desc") {
      sql += ` ORDER BY p.price DESC;`;
    } else {
      sql += ` ORDER BY p.created_at DESC;`;
    }

    const res = await query(sql, params);
    return res.rows.map(mapProductRow);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    await this.ensureTablesExist();
    const res = await query(
      `SELECT p.*,
        (
          SELECT json_agg(pi.image_url ORDER BY pi.sort_order ASC, pi.created_at ASC)
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) as ordered_images
      FROM products p
      WHERE p.id = $1 OR p.slug = $1
      LIMIT 1;`,
      [id]
    );
    if (res.rows.length === 0) return undefined;
    return mapProductRow(res.rows[0]);
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      await this.ensureTablesExist();
      const res = await query(
        `SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC;`,
        [productId]
      );
      return res.rows.map((r) => ({
        id: r.id,
        productId: r.product_id,
        imageUrl: r.image_url,
        storagePath: r.storage_path || undefined,
        sortOrder: Number(r.sort_order || 0),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
      }));
    } catch (err) {
      console.error("[GET PRODUCT IMAGES ERROR]", err);
      return [];
    }
  }

  async syncProductImages(productId: string, images: string[]): Promise<void> {
    try {
      await this.ensureTablesExist();
      const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

      // Remove existing rows to ensure atomic sequential ordering without duplicate ranks
      await query(`DELETE FROM product_images WHERE product_id = $1;`, [productId]);

      // Insert sequentially with exact sort_order (0 = primary, 1 = secondary, ...)
      for (let i = 0; i < validImages.length; i++) {
        const url = validImages[i];
        const imgId = `img_${productId}_${i}_${Math.random().toString(36).substr(2, 6)}`;
        await query(
          `INSERT INTO product_images (id, product_id, image_url, sort_order)
           VALUES ($1, $2, $3, $4);`,
          [imgId, productId, url, i]
        );
      }

      // Keep products.images in sync for backward compatibility
      await query(
        `UPDATE products SET images = $2, updated_at = NOW() WHERE id = $1;`,
        [productId, validImages]
      );
    } catch (err) {
      console.error("[SYNC PRODUCT IMAGES ERROR]", err);
    }
  }

  async addProduct(productData: Omit<Product, "id"> & { id?: string }): Promise<Product> {
    await this.ensureTablesExist();
    const id = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    let slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) slug = `product-${Date.now()}`;
    const stockCount = productData.stockCount !== undefined ? productData.stockCount : 15;

    const categoryInput = typeof productData.category === "string" ? productData.category.trim() : "tops";
    
    // Resolve dynamic category_id from PostgreSQL categories table
    let categoryId: string | null = null;
    let categorySlug = categoryInput.toLowerCase();
    let categoryLabel = productData.categoryLabel || categoryInput.toUpperCase();

    try {
      const catRes = await query(
        `SELECT id, name, slug FROM categories WHERE LOWER(slug) = LOWER($1) OR id = $1 OR LOWER(name) = LOWER($1) LIMIT 1;`,
        [categoryInput]
      );
      if (catRes.rows.length > 0) {
        categoryId = catRes.rows[0].id;
        categorySlug = catRes.rows[0].slug;
        categoryLabel = catRes.rows[0].name;
      }
    } catch {
      // ignore
    }

    // Ensure unique slug by appending suffix if duplicate
    try {
      const existingSlug = await query(`SELECT id FROM products WHERE slug = $1 LIMIT 1;`, [slug]);
      if (existingSlug.rows.length > 0) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    } catch {}

    const validImages = Array.isArray(productData.images) ? productData.images.filter(Boolean) : [];

    const res = await query(
      `INSERT INTO products (
        id, name, slug, category_id, category_slug, category_label, price, original_price,
        description, tag, images, colors, sizes, composition, care_instructions, details,
        featured, in_stock, stock_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;`,
      [
        id,
        productData.name,
        slug,
        categoryId,
        categorySlug,
        categoryLabel,
        productData.price,
        productData.originalPrice || null,
        productData.description || "",
        productData.tag || "NEW",
        validImages,
        JSON.stringify(productData.colors || []),
        productData.sizes || [],
        productData.composition || [],
        productData.careInstructions || [],
        productData.details || [],
        Boolean(productData.featured),
        stockCount > 0,
        stockCount,
      ]
    );

    if (validImages.length > 0) {
      await this.syncProductImages(id, validImages);
    }

    return mapProductRow({ ...res.rows[0], ordered_images: validImages });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    await this.ensureTablesExist();
    const existing = await this.getProductById(id);
    if (!existing) return undefined;

    const stockCount = updates.stockCount !== undefined ? updates.stockCount : existing.stockCount;
    const inStock = stockCount > 0;

    let categoryId: string | null = null;
    let categorySlug: string | null = updates.category ? updates.category.toLowerCase() : null;
    let categoryLabel: string | null = updates.categoryLabel || null;

    if (updates.category) {
      try {
        const catRes = await query(
          `SELECT id, name, slug FROM categories WHERE LOWER(slug) = LOWER($1) OR id = $1 OR LOWER(name) = LOWER($1) LIMIT 1;`,
          [updates.category]
        );
        if (catRes.rows.length > 0) {
          categoryId = catRes.rows[0].id;
          categorySlug = catRes.rows[0].slug;
          categoryLabel = catRes.rows[0].name;
        }
      } catch {}
    }

    const res = await query(
      `UPDATE products SET
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        category_id = COALESCE($4, category_id),
        category_slug = COALESCE($5, category_slug),
        category_label = COALESCE($6, category_label),
        price = COALESCE($7, price),
        original_price = $8,
        description = COALESCE($9, description),
        tag = COALESCE($10, tag),
        featured = COALESCE($11, featured),
        stock_count = $12,
        in_stock = $13,
        images = COALESCE($14, images),
        colors = COALESCE($15, colors),
        sizes = COALESCE($16, sizes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.name || null,
        updates.slug || null,
        categoryId,
        categorySlug,
        categoryLabel,
        updates.price !== undefined ? updates.price : null,
        updates.originalPrice !== undefined ? updates.originalPrice : (existing.originalPrice || null),
        updates.description !== undefined ? updates.description : null,
        updates.tag || null,
        updates.featured !== undefined ? updates.featured : null,
        stockCount,
        inStock,
        updates.images || null,
        updates.colors ? JSON.stringify(updates.colors) : null,
        updates.sizes || null,
      ]
    );

    if (Array.isArray(updates.images)) {
      // Clean up media assets for any removed image URLs
      try {
        const oldImages = await this.getProductImages(id);
        const newUrls = updates.images.filter(Boolean);
        for (const oldImg of oldImages) {
          if (oldImg.imageUrl && !newUrls.includes(oldImg.imageUrl)) {
            if (oldImg.imageUrl.includes("/api/media/")) {
              await this.deleteMediaAsset(oldImg.imageUrl);
            }
          }
        }
      } catch {}

      await this.syncProductImages(id, updates.images);
    }

    const updatedRow = res.rows[0];
    return mapProductRow({
      ...updatedRow,
      ordered_images: Array.isArray(updates.images) ? updates.images : undefined,
    });
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.ensureTablesExist();

      // 1. Find all product images and clean up any uploaded media assets from database & disk
      const images = await this.getProductImages(id);
      for (const img of images) {
        if (img.imageUrl && img.imageUrl.includes("/api/media/")) {
          await this.deleteMediaAsset(img.imageUrl);
        }
      }

      // 2. Delete product_images rows
      await query(`DELETE FROM product_images WHERE product_id = $1;`, [id]);

      // 3. Delete product reviews
      await query(`DELETE FROM reviews WHERE product_id = $1;`, [id]);

      // 4. Delete product row (order_items.product_id is set to NULL automatically via ON DELETE SET NULL, preserving all historical order invoices)
      const res = await query(`DELETE FROM products WHERE id = $1;`, [id]);
      return (res.rowCount || 0) > 0;
    } catch (err) {
      console.error("[DELETE PRODUCT ERROR]", err);
      return false;
    }
  }

  async safeDeleteProduct(id: string): Promise<{ success: boolean; archived: boolean; message: string }> {
    const deleted = await this.deleteProduct(id);
    return {
      success: deleted,
      archived: false,
      message: deleted ? "Product and owned media assets permanently deleted. Order history preserved." : "Failed to delete product.",
    };
  }

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  async getCategories() {
    const res = await query(`
      SELECT c.*, COUNT(p.id)::int as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id OR LOWER(c.slug) = LOWER(p.category_slug)
      GROUP BY c.id
      ORDER BY c.name ASC;
    `);
    return res.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      image: row.image,
      description: row.description,
      aspectRatio: row.aspect_ratio || "tall",
      featured: Boolean(row.featured),
      productCount: Number(row.product_count || 0),
    }));
  }

  async getCategoryBySlug(slug: string) {
    try {
      await this.ensureTablesExist();
      const res = await query(
        `SELECT c.*, COUNT(p.id)::int as product_count
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id OR LOWER(c.slug) = LOWER(p.category_slug)
         WHERE LOWER(c.slug) = LOWER($1) OR c.id = $1
         GROUP BY c.id
         LIMIT 1;`,
        [slug.trim()]
      );
      if (res.rows.length === 0) return undefined;
      const row = res.rows[0];
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        image: row.image,
        description: row.description,
        aspectRatio: row.aspect_ratio || "tall",
        featured: Boolean(row.featured),
        productCount: Number(row.product_count || 0),
      };
    } catch (err) {
      console.error("[GET CATEGORY BY SLUG ERROR]", err);
      return undefined;
    }
  }

  async addCategory(cat: { id?: string; name: string; slug: string; tagline?: string; image: string; description?: string; featured?: boolean }) {
    const id = cat.id || `cat_${Date.now()}`;
    const res = await query(
      `INSERT INTO categories (id, name, slug, tagline, image, description, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [id, cat.name, cat.slug, cat.tagline || "", cat.image, cat.description || "", Boolean(cat.featured)]
    );
    return res.rows[0];
  }

  async updateCategory(id: string, updates: Partial<{ name: string; slug: string; tagline?: string; image?: string; description?: string; featured?: boolean }>) {
    const current = await query(`SELECT * FROM categories WHERE id = $1 OR slug = $1 LIMIT 1;`, [id]);
    if (current.rows.length === 0) return undefined;
    const row = current.rows[0];

    // If image is being replaced, clean up old media asset
    if (updates.image && row.image && updates.image !== row.image) {
      if (row.image.includes("/api/media/")) {
        await this.deleteMediaAsset(row.image);
      }
    }

    const newName = updates.name !== undefined ? updates.name : row.name;
    const newSlug = updates.slug !== undefined ? updates.slug : row.slug;
    const newTagline = updates.tagline !== undefined ? updates.tagline : row.tagline;
    const newImage = updates.image !== undefined ? updates.image : row.image;
    const newDesc = updates.description !== undefined ? updates.description : row.description;
    const newFeatured = updates.featured !== undefined ? Boolean(updates.featured) : Boolean(row.featured);

    const res = await query(
      `UPDATE categories SET
        name = $2,
        slug = $3,
        tagline = $4,
        image = $5,
        description = $6,
        featured = $7
      WHERE id = $1 OR slug = $1
      RETURNING *;`,
      [row.id, newName, newSlug, newTagline, newImage, newDesc, newFeatured]
    );
    if (res.rows.length === 0) return undefined;
    return res.rows[0];
  }

  async deleteCategory(idOrSlug: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureTablesExist();
      const catRes = await query(`SELECT id, slug, image FROM categories WHERE id = $1 OR slug = $1 LIMIT 1;`, [idOrSlug]);
      if (catRes.rows.length === 0) {
        return { success: false, error: "Category not found." };
      }
      const cat = catRes.rows[0];

      // 1. If category image was an uploaded media asset, clean it up
      if (cat.image && cat.image.includes("/api/media/")) {
        await this.deleteMediaAsset(cat.image);
      }

      // 2. Decouple products safely: set category_id = NULL and category_slug = 'uncategorized'
      // NEVER delete products belonging to the category!
      await query(
        `UPDATE products 
         SET category_id = NULL, category_slug = 'uncategorized', category_label = 'Uncategorized', updated_at = NOW() 
         WHERE category_id = $1 OR LOWER(category_slug) = LOWER($2);`,
        [cat.id, cat.slug]
      );

      // 3. Remove navigation item linking to this category
      await query(
        `DELETE FROM navigation_items WHERE category_slug = $1 OR LOWER(category_slug) = LOWER($2);`,
        [cat.slug, cat.slug]
      );

      // 4. Delete the category record
      const res = await query(`DELETE FROM categories WHERE id = $1;`, [cat.id]);
      return { success: (res.rowCount || 0) > 0 };
    } catch (err: any) {
      console.error("[DELETE CATEGORY ERROR]", err);
      return { success: false, error: err.message || "Failed to delete category." };
    }
  }

  // --------------------------------------------------------------------------
  // MEDIA ASSETS (PostgreSQL Ultra-Fast High-Definition Image Storage)
  // --------------------------------------------------------------------------
  async saveMediaAsset(id: string, filename: string, mimeType: string, buffer: Buffer) {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS media_assets (
          id VARCHAR(100) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          mime_type VARCHAR(50) NOT NULL,
          data BYTEA NOT NULL,
          size_bytes INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await query(
        `INSERT INTO media_assets (id, filename, mime_type, data, size_bytes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           filename = EXCLUDED.filename,
           mime_type = EXCLUDED.mime_type,
           data = EXCLUDED.data,
           size_bytes = EXCLUDED.size_bytes,
           created_at = NOW();`,
        [id, filename, mimeType, buffer, buffer.length]
      );
      return `/api/media/${id}`;
    } catch (err) {
      console.error("[DB MEDIA ASSET ERROR]", err);
      throw err;
    }
  }

  async getMediaAsset(id: string) {
    try {
      const cleanId = id.replace(/\.(webp|png|jpg|jpeg|avif)$/i, "");
      const res = await query(
        `SELECT id, filename, mime_type, data, size_bytes FROM media_assets WHERE id = $1 LIMIT 1;`,
        [cleanId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return null;
    }
  }

  async deleteMediaAsset(urlOrId: string): Promise<boolean> {
    if (!urlOrId) return false;
    try {
      let cleanId = urlOrId;
      if (cleanId.includes("/api/media/")) {
        cleanId = cleanId.split("/api/media/")[1];
      }
      cleanId = cleanId.split("?")[0].replace(/\.(webp|png|jpg|jpeg|avif)$/i, "").trim();
      if (!cleanId) return false;

      await query(`DELETE FROM media_assets WHERE id = $1 OR filename LIKE $2;`, [cleanId, `${cleanId}%`]);

      // If local uploads file exists, delete it
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const filename = `${cleanId}.webp`;
        await fs.unlink(path.join(uploadsDir, filename)).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.error("[DELETE MEDIA ASSET ERROR]", err);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // USERS & AUTHENTICATION
  // --------------------------------------------------------------------------
  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    const res = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`, [email.trim()]);
    if (res.rows.length === 0) return undefined;
    return mapUserRow(res.rows[0]);
  }

  async findUserById(id: string): Promise<UserRecord | undefined> {
    const res = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1;`, [id]);
    if (res.rows.length === 0) return undefined;
    return mapUserRow(res.rows[0]);
  }

  async findUserByResetToken(token: string): Promise<UserRecord | undefined> {
    const now = Date.now();
    const res = await query(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > $2 LIMIT 1;`,
      [token.trim(), now]
    );
    if (res.rows.length === 0) return undefined;
    return mapUserRow(res.rows[0]);
  }

  async createUser(user: Omit<UserRecord, "id" | "createdAt"> & { id?: string }): Promise<UserRecord> {
    const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const role = user.email.toLowerCase() === ADMIN_EMAIL ? "admin" : (user.role || "user");

    const res = await query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [id, user.name, user.email.toLowerCase().trim(), user.passwordHash, role]
    );

    return mapUserRow(res.rows[0]);
  }

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | undefined> {
    const res = await query(
      `UPDATE users SET
        name = COALESCE($2, name),
        password_hash = COALESCE($3, password_hash),
        role = COALESCE($4, role),
        reset_token = $5,
        reset_token_expiry = $6,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.name || null,
        updates.passwordHash || null,
        updates.role || null,
        updates.resetToken !== undefined ? updates.resetToken : null,
        updates.resetTokenExpiry !== undefined ? updates.resetTokenExpiry : null,
      ]
    );

    if (res.rows.length === 0) return undefined;
    return mapUserRow(res.rows[0]);
  }

  async getAllUsers(): Promise<UserRecord[]> {
    const res = await query(`SELECT * FROM users ORDER BY created_at DESC;`);
    return res.rows.map(mapUserRow);
  }

  // --------------------------------------------------------------------------
  // ORDERS & ATOMIC CHECKOUT TRANSACTIONS
  // --------------------------------------------------------------------------
  async getAllOrders(filter?: { status?: string; search?: string }): Promise<OrderRecord[]> {
    let sql = `
      SELECT o.*, 
             COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as items
      FROM orders o
      LEFT JOIN order_items i ON o.id = i.order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.status && filter.status !== "ALL") {
      params.push(filter.status.toUpperCase());
      sql += ` AND o.status = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      sql += ` AND (LOWER(o.order_number) LIKE $${params.length} OR LOWER(o.shipping_address->>'firstName') LIKE $${params.length} OR LOWER(o.shipping_address->>'lastName') LIKE $${params.length} OR LOWER(o.shipping_address->>'email') LIKE $${params.length})`;
    }

    sql += ` GROUP BY o.id ORDER BY o.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows.map(mapOrderRow);
  }

  async getOrderById(id: string): Promise<OrderRecord | undefined> {
    const res = await query(
      `SELECT o.*, 
              COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as items
       FROM orders o
       LEFT JOIN order_items i ON o.id = i.order_id
       WHERE o.id = $1 OR o.order_number = $1
       GROUP BY o.id
       LIMIT 1;`,
      [id]
    );

    if (res.rows.length === 0) return undefined;
    return mapOrderRow(res.rows[0]);
  }

  async getOrdersByUserId(userId: string): Promise<OrderRecord[]> {
    const res = await query(
      `SELECT o.*, 
              COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as items
       FROM orders o
       LEFT JOIN order_items i ON o.id = i.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC;`,
      [userId]
    );

    return res.rows.map(mapOrderRow);
  }

  /**
   * Recalculates cart items and pricing authoritatively from Supabase PostgreSQL.
   */
  async recalculateCart(
    items: { productId?: string; id?: string; quantity: number; size?: string; color?: string }[],
    promoCode?: string
  ) {
    let subtotal = 0;
    const verifiedItems: {
      productId?: string;
      name: string;
      price: number;
      quantity: number;
      size?: string;
      color?: string;
      image?: string;
    }[] = [];

    for (const item of items) {
      const pid = item.productId || item.id;
      if (!pid) continue;
      const product = await this.getProductById(pid);
      if (product) {
        const price = product.price;
        const quantity = Math.max(1, item.quantity);
        subtotal += price * quantity;
        verifiedItems.push({
          productId: product.id,
          name: product.name,
          price,
          quantity,
          size: item.size,
          color: item.color,
          image: product.images[0] || "",
        });
      }
    }

    const settings = await this.getStoreSettings();
    let discount = 0;

    if (promoCode) {
      const coupon = await this.findDiscountByCode(promoCode);
      if (coupon && coupon.active) {
        if (!coupon.minOrder || subtotal >= coupon.minOrder) {
          if (coupon.type === "percentage") {
            discount = (subtotal * coupon.value) / 100;
          } else {
            discount = Math.min(coupon.value, subtotal);
          }
        }
      }
    }

    const shipping =
      subtotal === 0 || subtotal >= settings.freeShippingThreshold
        ? 0
        : settings.flatShippingRate;

    const total = Math.max(0, subtotal - discount + shipping);

    return {
      items: verifiedItems,
      subtotal,
      discount,
      shipping,
      total,
    };
  }

  /**
   * Creates an order with relational line items, snapshots payment details if online, and atomically deducts inventory.
   */
  async createOrder(orderData: {
    userId?: string;
    items: {
      productId?: string;
      name: string;
      price: number;
      quantity: number;
      size?: string;
      color?: string;
      image?: string;
    }[];
    subtotal: number;
    discount?: number;
    shipping?: number;
    total: number;
    paymentMethod?: PaymentMethod;
    shippingAddress: any;
    notes?: string;
  }): Promise<OrderRecord> {
    await ensurePaymentSchema();

    // Snapshot bank details at creation time if paymentMethod is 'online'
    let paymentDetails: OrderPaymentDetails | undefined = undefined;
    if (orderData.paymentMethod === "online") {
      const settings = await this.getStoreSettings();
      paymentDetails = {
        accountHolderName: settings.bankAccountHolder || "SHOPY Retail Private Limited",
        bankName: settings.bankName || "Meezan Bank Limited",
        accountNumber: settings.bankAccountNumber || "01020304050607",
        iban: settings.bankIban || "PK12MEZN0001020304050607",
        paymentContact: settings.bankPaymentContact || "+92 300 1234567",
        instructions: settings.bankPaymentInstructions || "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
      };
    }

    return transaction(async (client) => {
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const orderNumber = `SHP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insert Master Order Record
      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, subtotal, discount, shipping, total,
          status, payment_status, payment_method, payment_details, shipping_address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
        [
          orderId,
          orderNumber,
          orderData.userId || null,
          orderData.subtotal,
          orderData.discount || 0,
          orderData.shipping || 0,
          orderData.total,
          "CONFIRMED",
          "PENDING",
          orderData.paymentMethod || "cod",
          paymentDetails ? JSON.stringify(paymentDetails) : null,
          JSON.stringify(orderData.shippingAddress),
          orderData.notes || null,
        ]
      );

      // 2. Insert Order Items & Deduct Product Inventory
      const insertedItems: OrderItemRecord[] = [];
      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        const itemId = `item_${orderId}_${i + 1}`;

        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [
            itemId,
            orderId,
            item.productId || null,
            item.name,
            item.price,
            item.quantity,
            item.size || null,
            item.color || null,
            item.image || null,
          ]
        );

        insertedItems.push({
          id: itemId,
          orderId,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
        });

        // Deduct inventory in products table
        if (item.productId) {
          await client.query(
            `UPDATE products 
             SET stock_count = GREATEST(0, stock_count - $1),
                 in_stock = (stock_count - $1 > 0),
                 updated_at = NOW()
             WHERE id = $2;`,
            [item.quantity, item.productId]
          );
        }
      }

      return {
        id: orderId,
        orderNumber,
        userId: orderData.userId,
        items: insertedItems,
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total,
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        paymentMethod: orderData.paymentMethod || "cod",
        paymentDetails,
        shippingAddress: orderData.shippingAddress,
        notes: orderData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  async updateOrderStatus(
    id: string,
    status: OrderRecord["status"],
    notes?: string
  ): Promise<OrderRecord | undefined> {
    const res = await query(
      `UPDATE orders 
       SET status = $1, 
           notes = COALESCE($2, notes), 
           updated_at = NOW() 
       WHERE id = $3 OR order_number = $3
       RETURNING id;`,
      [status, notes || null, id]
    );

    if (res.rows.length === 0) return undefined;
    return this.getOrderById(res.rows[0].id);
  }

  async updateOrderPaymentStatus(
    id: string,
    paymentStatus: OrderRecord["paymentStatus"]
  ): Promise<OrderRecord | undefined> {
    const res = await query(
      `UPDATE orders 
       SET payment_status = $1, 
           updated_at = NOW() 
       WHERE id = $2 OR order_number = $2
       RETURNING id;`,
      [paymentStatus, id]
    );

    if (res.rows.length === 0) return undefined;
    return this.getOrderById(res.rows[0].id);
  }

  // --------------------------------------------------------------------------
  // DISCOUNTS & PROMOTIONS
  // --------------------------------------------------------------------------
  async getDiscounts(): Promise<DiscountCoupon[]> {
    const res = await query(`SELECT * FROM discounts ORDER BY created_at DESC;`);
    return res.rows.map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      value: Number(r.value),
      minOrder: r.min_order ? Number(r.min_order) : undefined,
      usageLimit: r.usage_limit ? Number(r.usage_limit) : undefined,
      usageCount: Number(r.usage_count || 0),
      active: Boolean(r.active),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : undefined,
    }));
  }

  async findDiscountByCode(code: string): Promise<DiscountCoupon | undefined> {
    const res = await query(`SELECT * FROM discounts WHERE UPPER(code) = UPPER($1) AND active = true LIMIT 1;`, [code.trim()]);
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      code: r.code,
      type: r.type,
      value: Number(r.value),
      minOrder: r.min_order ? Number(r.min_order) : undefined,
      usageLimit: r.usage_limit ? Number(r.usage_limit) : undefined,
      usageCount: Number(r.usage_count || 0),
      active: Boolean(r.active),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : undefined,
    };
  }

  async addDiscount(coupon: Omit<DiscountCoupon, "id" | "usageCount">): Promise<DiscountCoupon> {
    const id = `dsc_${Date.now()}`;
    const res = await query(
      `INSERT INTO discounts (id, code, type, value, min_order, usage_limit, active, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        id,
        coupon.code.toUpperCase().trim(),
        coupon.type,
        coupon.value,
        coupon.minOrder || 0,
        coupon.usageLimit || null,
        coupon.active !== undefined ? coupon.active : true,
        coupon.expiresAt || null,
      ]
    );

    const r = res.rows[0];
    return {
      id: r.id,
      code: r.code,
      type: r.type,
      value: Number(r.value),
      minOrder: r.min_order ? Number(r.min_order) : undefined,
      usageLimit: r.usage_limit ? Number(r.usage_limit) : undefined,
      usageCount: Number(r.usage_count || 0),
      active: Boolean(r.active),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : undefined,
    };
  }

  async updateDiscount(id: string, updates: Partial<DiscountCoupon>): Promise<DiscountCoupon | undefined> {
    const res = await query(
      `UPDATE discounts SET
        code = COALESCE($2, code),
        type = COALESCE($3, type),
        value = COALESCE($4, value),
        min_order = COALESCE($5, min_order),
        active = COALESCE($6, active)
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.code ? updates.code.toUpperCase().trim() : null,
        updates.type || null,
        updates.value !== undefined ? updates.value : null,
        updates.minOrder !== undefined ? updates.minOrder : null,
        updates.active !== undefined ? updates.active : null,
      ]
    );

    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      code: r.code,
      type: r.type,
      value: Number(r.value),
      minOrder: r.min_order ? Number(r.min_order) : undefined,
      usageLimit: r.usage_limit ? Number(r.usage_limit) : undefined,
      usageCount: Number(r.usage_count || 0),
      active: Boolean(r.active),
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : undefined,
    };
  }

  async deleteDiscount(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM discounts WHERE id = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --------------------------------------------------------------------------
  // REVIEWS
  // --------------------------------------------------------------------------
  async getReviews(filter?: { status?: string; productId?: string }): Promise<ProductReview[]> {
    let sql = `SELECT * FROM reviews WHERE 1=1`;
    const params: any[] = [];

    if (filter?.status && filter.status !== "all") {
      params.push(filter.status);
      sql += ` AND status = $${params.length}`;
    }

    if (filter?.productId) {
      params.push(filter.productId);
      sql += ` AND product_id = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC;`;

    const res = await query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      rating: Number(r.rating),
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  }

  async addReview(review: Omit<ProductReview, "id" | "createdAt" | "status">): Promise<ProductReview> {
    const id = `rev_${Date.now()}`;
    const res = await query(
      `INSERT INTO reviews (id, product_id, product_name, customer_name, customer_email, rating, comment, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *;`,
      [
        id,
        review.productId,
        review.productName,
        review.customerName,
        review.customerEmail,
        review.rating,
        review.comment,
      ]
    );

    const r = res.rows[0];
    return {
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      rating: Number(r.rating),
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  async updateReviewStatus(id: string, status: "approved" | "rejected"): Promise<ProductReview | undefined> {
    const res = await query(
      `UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *;`,
      [status, id]
    );
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      rating: Number(r.rating),
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  async deleteReview(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM reviews WHERE id = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --------------------------------------------------------------------------
  // STORE SETTINGS
  // --------------------------------------------------------------------------
  async getStoreSettings(): Promise<StoreSettings> {
    await ensurePaymentSchema();
    try {
      const res = await query(`SELECT * FROM store_settings LIMIT 1;`);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          storeName: r.store_name || "SHOPY Atelier",
          supportEmail: r.support_email || "shopy.support@gmail.com",
          currency: r.currency || "PKR",
          currencySymbol: r.currency_symbol || "Rs.",
          freeShippingThreshold: Number(r.free_shipping_threshold ?? 15000),
          flatShippingRate: Number(r.flat_shipping_rate ?? 500),
          taxPercentage: Number(r.tax_percentage ?? 0),
          orderNotifications: Boolean(r.order_notifications ?? true),
          inventoryAlertThreshold: Number(r.inventory_alert_threshold ?? 5),
          bankAccountHolder: r.bank_account_holder || "SHOPY Retail Private Limited",
          bankName: r.bank_name || "Meezan Bank Limited",
          bankAccountNumber: r.bank_account_number || "01020304050607",
          bankIban: r.bank_iban || "PK12MEZN0001020304050607",
          bankPaymentContact: r.bank_payment_contact || "+92 300 1234567",
          bankPaymentInstructions: r.bank_payment_instructions || "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
        };
      }
    } catch (err) {
      console.error("[GET STORE SETTINGS ERROR]", err);
    }

    return {
      id: "settings_default",
      storeName: "SHOPY Atelier",
      supportEmail: "shopy.support@gmail.com",
      currency: "PKR",
      currencySymbol: "Rs.",
      freeShippingThreshold: 15000,
      flatShippingRate: 500,
      taxPercentage: 0,
      orderNotifications: true,
      inventoryAlertThreshold: 5,
      bankAccountHolder: "SHOPY Retail Private Limited",
      bankName: "Meezan Bank Limited",
      bankAccountNumber: "01020304050607",
      bankIban: "PK12MEZN0001020304050607",
      bankPaymentContact: "+92 300 1234567",
      bankPaymentInstructions: "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
    };
  }

  async updateStoreSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    await ensurePaymentSchema();
    const current = await this.getStoreSettings();
    const targetId = current.id || "settings_default";
    const merged: StoreSettings = {
      id: targetId,
      storeName: updates.storeName !== undefined ? updates.storeName : current.storeName,
      supportEmail: updates.supportEmail !== undefined ? updates.supportEmail : current.supportEmail,
      currency: updates.currency !== undefined ? updates.currency : current.currency,
      currencySymbol: updates.currencySymbol !== undefined ? updates.currencySymbol : current.currencySymbol,
      freeShippingThreshold: updates.freeShippingThreshold !== undefined ? Number(updates.freeShippingThreshold) : current.freeShippingThreshold,
      flatShippingRate: updates.flatShippingRate !== undefined ? Number(updates.flatShippingRate) : current.flatShippingRate,
      taxPercentage: updates.taxPercentage !== undefined ? Number(updates.taxPercentage) : current.taxPercentage,
      orderNotifications: updates.orderNotifications !== undefined ? Boolean(updates.orderNotifications) : current.orderNotifications,
      inventoryAlertThreshold: updates.inventoryAlertThreshold !== undefined ? Number(updates.inventoryAlertThreshold) : current.inventoryAlertThreshold,
      bankAccountHolder: updates.bankAccountHolder !== undefined ? updates.bankAccountHolder : current.bankAccountHolder,
      bankName: updates.bankName !== undefined ? updates.bankName : current.bankName,
      bankAccountNumber: updates.bankAccountNumber !== undefined ? updates.bankAccountNumber : current.bankAccountNumber,
      bankIban: updates.bankIban !== undefined ? updates.bankIban : current.bankIban,
      bankPaymentContact: updates.bankPaymentContact !== undefined ? updates.bankPaymentContact : current.bankPaymentContact,
      bankPaymentInstructions: updates.bankPaymentInstructions !== undefined ? updates.bankPaymentInstructions : current.bankPaymentInstructions,
    };

    const res = await query(
      `INSERT INTO store_settings (
        id, store_name, support_email, currency, currency_symbol,
        free_shipping_threshold, flat_shipping_rate, tax_percentage,
        order_notifications, inventory_alert_threshold,
        bank_account_holder, bank_name,
        bank_account_number, bank_iban, bank_payment_contact, bank_payment_instructions,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        support_email = EXCLUDED.support_email,
        currency = EXCLUDED.currency,
        currency_symbol = EXCLUDED.currency_symbol,
        free_shipping_threshold = EXCLUDED.free_shipping_threshold,
        flat_shipping_rate = EXCLUDED.flat_shipping_rate,
        tax_percentage = EXCLUDED.tax_percentage,
        order_notifications = EXCLUDED.order_notifications,
        inventory_alert_threshold = EXCLUDED.inventory_alert_threshold,
        bank_account_holder = EXCLUDED.bank_account_holder,
        bank_name = EXCLUDED.bank_name,
        bank_account_number = EXCLUDED.bank_account_number,
        bank_iban = EXCLUDED.bank_iban,
        bank_payment_contact = EXCLUDED.bank_payment_contact,
        bank_payment_instructions = EXCLUDED.bank_payment_instructions,
        updated_at = NOW()
      RETURNING *;`,
      [
        merged.id,
        merged.storeName,
        merged.supportEmail,
        merged.currency,
        merged.currencySymbol,
        merged.freeShippingThreshold,
        merged.flatShippingRate,
        merged.taxPercentage,
        merged.orderNotifications,
        merged.inventoryAlertThreshold,
        merged.bankAccountHolder || null,
        merged.bankName || null,
        merged.bankAccountNumber || null,
        merged.bankIban || null,
        merged.bankPaymentContact || null,
        merged.bankPaymentInstructions || null,
      ]
    );

    if (res.rows.length > 0) {
      const r = res.rows[0];
      return {
        id: r.id,
        storeName: r.store_name,
        supportEmail: r.support_email,
        currency: r.currency,
        currencySymbol: r.currency_symbol,
        freeShippingThreshold: Number(r.free_shipping_threshold),
        flatShippingRate: Number(r.flat_shipping_rate),
        taxPercentage: Number(r.tax_percentage),
        orderNotifications: Boolean(r.order_notifications),
        inventoryAlertThreshold: Number(r.inventory_alert_threshold),
        bankAccountHolder: r.bank_account_holder || undefined,
        bankName: r.bank_name || undefined,
        bankAccountNumber: r.bank_account_number || undefined,
        bankIban: r.bank_iban || undefined,
        bankPaymentContact: r.bank_payment_contact || undefined,
        bankPaymentInstructions: r.bank_payment_instructions || undefined,
      };
    }

    return merged;
  }

  // --------------------------------------------------------------------------
  // INQUIRIES & NEWSLETTER
  // --------------------------------------------------------------------------
  async addInquiry(inquiry: { name: string; email: string; subject: string; message: string }): Promise<{ id: number; name: string; email: string; subject: string; message: string }> {
    const res = await query(
      `INSERT INTO inquiries (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [inquiry.name, inquiry.email, inquiry.subject, inquiry.message]
    );
    return res.rows[0];
  }

  async subscribeNewsletter(email: string): Promise<boolean> {
    const res = await query(
      `INSERT INTO newsletter_subscribers (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING;`,
      [email.toLowerCase().trim()]
    );
    return (res.rowCount || 0) > 0;
  }

  // --------------------------------------------------------------------------
  // NAVIGATION ITEMS (HEADER & MENU CONTROL)
  // --------------------------------------------------------------------------
  private _tablesInitialized = false;
  private _initPromise: Promise<void> | null = null;

  async ensureTablesExist(): Promise<void> {
    if (this._tablesInitialized) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS navigation_items (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            href VARCHAR(255) NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            category_slug VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      } catch {}

      try {
        await query(`
          CREATE TABLE IF NOT EXISTS homepage_config (
            id VARCHAR(50) PRIMARY KEY,
            hero_title VARCHAR(255) NOT NULL DEFAULT 'ARCHITECTURAL ELEGANCE',
            hero_subtitle VARCHAR(255) NOT NULL DEFAULT 'EDITION 01 • AUTUMN / WINTER 2026',
            hero_image TEXT NOT NULL DEFAULT '/hero-luxury.jpg',
            hero_cta_text VARCHAR(100) NOT NULL DEFAULT 'Explore Collection',
            hero_cta_link VARCHAR(255) NOT NULL DEFAULT '/products',
            featured_title VARCHAR(255) NOT NULL DEFAULT 'Featured Essentials',
            featured_subtitle VARCHAR(255) NOT NULL DEFAULT 'SELECTION OF THE SEASON',
            editorial_tag VARCHAR(100) NOT NULL DEFAULT 'EDITORIAL CAMPAIGN',
            editorial_title VARCHAR(255) NOT NULL DEFAULT 'Permanence in Form & Texture',
            editorial_quote TEXT NOT NULL DEFAULT 'We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence, heavyweight organic knits, and architectural draping.',
            editorial_image_1 TEXT NOT NULL DEFAULT '/editorial-craft.jpg',
            editorial_image_2 TEXT NOT NULL DEFAULT '/category-tops.jpg',
            newsletter_title VARCHAR(255) NOT NULL DEFAULT 'Join The Maison Gazette',
            newsletter_subtitle VARCHAR(255) NOT NULL DEFAULT 'Receive private vernissage previews, seasonal lookbooks, and invitation-only atelier dispatches.',
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      } catch {}

      try {
        // Seed default navigation if empty
        const navCount = await query(`SELECT COUNT(*)::int as count FROM navigation_items;`);
        if (navCount.rows[0]?.count === 0) {
          await query(`
            INSERT INTO navigation_items (id, name, href, order_index, is_active, category_slug)
            VALUES
              ('nav_1', 'home', '/', 0, true, null),
              ('nav_2', 'view all', '/products', 1, true, null),
              ('nav_3', 'tops', '/collections/tops', 2, true, 'tops'),
              ('nav_4', 'bottoms', '/collections/bottoms', 3, true, 'bottoms'),
              ('nav_5', 'co-ord sets', '/collections/co-ord-sets', 4, true, 'co-ord-sets'),
              ('nav_6', 'footwear', '/collections/footwear', 5, true, 'footwear'),
              ('nav_7', 'fragrances', '/collections/fragrances', 6, true, 'fragrances'),
              ('nav_8', 'collections', '/collections', 7, true, null)
            ON CONFLICT (id) DO NOTHING;
          `);
        }
      } catch {}

      try {
        await query(`
          CREATE TABLE IF NOT EXISTS product_images (
            id VARCHAR(100) PRIMARY KEY,
            product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            storage_path TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await query(`CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(product_id, sort_order);`);

        // Safe auto-migration: if product_images is empty, migrate existing products.images array into product_images
        const imgCountRes = await query(`SELECT COUNT(*)::int as count FROM product_images;`);
        if (imgCountRes.rows[0]?.count === 0) {
          const prodRows = await query(`SELECT id, images FROM products WHERE images IS NOT NULL;`);
          for (const p of prodRows.rows) {
            if (Array.isArray(p.images) && p.images.length > 0) {
              for (let i = 0; i < p.images.length; i++) {
                const url = p.images[i];
                if (url) {
                  await query(
                    `INSERT INTO product_images (id, product_id, image_url, sort_order)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (id) DO NOTHING;`,
                    [`img_${p.id}_${i}`, p.id, url, i]
                  );
                }
              }
            }
          }
        }
      } catch {}

      this._tablesInitialized = true;
      this._initPromise = null;
    })();

    return this._initPromise;
  }

  async getNavigationItems(onlyActive = false): Promise<NavigationItem[]> {
    try {
      await this.ensureTablesExist();
      let sql = `SELECT * FROM navigation_items`;
      if (onlyActive) {
        sql += ` WHERE is_active = true`;
      }
      sql += ` ORDER BY order_index ASC, name ASC;`;
      const res = await query(sql);
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          id: r.id,
          name: r.name,
          href: r.href,
          orderIndex: Number(r.order_index || 0),
          isActive: Boolean(r.is_active),
          categorySlug: r.category_slug || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
        }));
      }
    } catch (err) {
      console.error("[GET NAV ITEMS ERROR]", err);
    }

    return [
      { id: "nav_1", name: "home", href: "/", orderIndex: 0, isActive: true },
      { id: "nav_2", name: "view all", href: "/products", orderIndex: 1, isActive: true },
      { id: "nav_3", name: "tops", href: "/collections/tops", orderIndex: 2, isActive: true, categorySlug: "tops" },
      { id: "nav_4", name: "bottoms", href: "/collections/bottoms", orderIndex: 3, isActive: true, categorySlug: "bottoms" },
      { id: "nav_5", name: "co-ord sets", href: "/collections/co-ord-sets", orderIndex: 4, isActive: true, categorySlug: "co-ord-sets" },
      { id: "nav_6", name: "footwear", href: "/collections/footwear", orderIndex: 5, isActive: true, categorySlug: "footwear" },
      { id: "nav_7", name: "fragrances", href: "/collections/fragrances", orderIndex: 6, isActive: true, categorySlug: "fragrances" },
      { id: "nav_8", name: "collections", href: "/collections", orderIndex: 7, isActive: true },
    ];
  }

  async addNavigationItem(item: { name: string; href: string; orderIndex?: number; isActive?: boolean; categorySlug?: string }): Promise<NavigationItem> {
    await this.ensureTablesExist();
    const id = `nav_${Date.now()}`;
    const res = await query(
      `INSERT INTO navigation_items (id, name, href, order_index, is_active, category_slug)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        id,
        item.name.toLowerCase().trim(),
        item.href.trim(),
        item.orderIndex !== undefined ? item.orderIndex : 99,
        item.isActive !== undefined ? item.isActive : true,
        item.categorySlug || null,
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      href: r.href,
      orderIndex: Number(r.order_index || 0),
      isActive: Boolean(r.is_active),
      categorySlug: r.category_slug || undefined,
    };
  }

  async updateNavigationItem(id: string, updates: Partial<NavigationItem>): Promise<NavigationItem | undefined> {
    await this.ensureTablesExist();
    const res = await query(
      `UPDATE navigation_items SET
        name = COALESCE($2, name),
        href = COALESCE($3, href),
        order_index = COALESCE($4, order_index),
        is_active = COALESCE($5, is_active),
        category_slug = $6,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.name ? updates.name.toLowerCase().trim() : null,
        updates.href ? updates.href.trim() : null,
        updates.orderIndex !== undefined ? updates.orderIndex : null,
        updates.isActive !== undefined ? updates.isActive : null,
        updates.categorySlug !== undefined ? updates.categorySlug : null,
      ]
    );
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      href: r.href,
      orderIndex: Number(r.order_index || 0),
      isActive: Boolean(r.is_active),
      categorySlug: r.category_slug || undefined,
    };
  }

  async deleteNavigationItem(id: string): Promise<boolean> {
    await this.ensureTablesExist();
    const res = await query(`DELETE FROM navigation_items WHERE id = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --------------------------------------------------------------------------
  // HOMEPAGE CONFIGURATION
  // --------------------------------------------------------------------------
  async getHomepageConfig(): Promise<HomepageConfig> {
    try {
      await this.ensureTablesExist();
      const res = await query(`SELECT * FROM homepage_config LIMIT 1;`);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          heroTitle: r.hero_title || "ARCHITECTURAL ELEGANCE",
          heroSubtitle: r.hero_subtitle || "EDITION 01 • AUTUMN / WINTER 2026",
          heroImage: r.hero_image || "/hero-luxury.jpg",
          heroCtaText: r.hero_cta_text || "Explore Collection",
          heroCtaLink: r.hero_cta_link || "/products",
          featuredTitle: r.featured_title || "Featured Essentials",
          featuredSubtitle: r.featured_subtitle || "SELECTION OF THE SEASON",
          editorialTag: r.editorial_tag || "EDITORIAL CAMPAIGN",
          editorialTitle: r.editorial_title || "Permanence in Form & Texture",
          editorialQuote: r.editorial_quote || "We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence, heavyweight organic knits, and architectural draping.",
          editorialImage1: r.editorial_image_1 || "/editorial-craft.jpg",
          editorialImage2: r.editorial_image_2 || "/category-tops.jpg",
          newsletterTitle: r.newsletter_title || "Join The Maison Gazette",
          newsletterSubtitle: r.newsletter_subtitle || "Receive private vernissage previews, seasonal lookbooks, and invitation-only atelier dispatches.",
        };
      }
    } catch (err) {
      console.error("[GET HOMEPAGE CONFIG ERROR]", err);
    }

    return {
      id: "home_default",
      heroTitle: "ARCHITECTURAL ELEGANCE",
      heroSubtitle: "EDITION 01 • AUTUMN / WINTER 2026",
      heroImage: "/hero-luxury.jpg",
      heroCtaText: "Explore Collection",
      heroCtaLink: "/products",
      featuredTitle: "Featured Essentials",
      featuredSubtitle: "SELECTION OF THE SEASON",
      editorialTag: "EDITORIAL CAMPAIGN",
      editorialTitle: "Permanence in Form & Texture",
      editorialQuote: "We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence, heavyweight organic knits, and architectural draping.",
      editorialImage1: "/editorial-craft.jpg",
      editorialImage2: "/category-tops.jpg",
      newsletterTitle: "Join The Maison Gazette",
      newsletterSubtitle: "Receive private vernissage previews, seasonal lookbooks, and invitation-only atelier dispatches.",
    };
  }

  async updateHomepageConfig(updates: Partial<HomepageConfig>): Promise<HomepageConfig> {
    await this.ensureTablesExist();
    const current = await this.getHomepageConfig();
    const merged: HomepageConfig = {
      id: "home_default",
      heroTitle: updates.heroTitle !== undefined ? updates.heroTitle : current.heroTitle,
      heroSubtitle: updates.heroSubtitle !== undefined ? updates.heroSubtitle : current.heroSubtitle,
      heroImage: updates.heroImage !== undefined ? updates.heroImage : current.heroImage,
      heroCtaText: updates.heroCtaText !== undefined ? updates.heroCtaText : current.heroCtaText,
      heroCtaLink: updates.heroCtaLink !== undefined ? updates.heroCtaLink : current.heroCtaLink,
      featuredTitle: updates.featuredTitle !== undefined ? updates.featuredTitle : current.featuredTitle,
      featuredSubtitle: updates.featuredSubtitle !== undefined ? updates.featuredSubtitle : current.featuredSubtitle,
      editorialTag: updates.editorialTag !== undefined ? updates.editorialTag : current.editorialTag,
      editorialTitle: updates.editorialTitle !== undefined ? updates.editorialTitle : current.editorialTitle,
      editorialQuote: updates.editorialQuote !== undefined ? updates.editorialQuote : current.editorialQuote,
      editorialImage1: updates.editorialImage1 !== undefined ? updates.editorialImage1 : current.editorialImage1,
      editorialImage2: updates.editorialImage2 !== undefined ? updates.editorialImage2 : current.editorialImage2,
      newsletterTitle: updates.newsletterTitle !== undefined ? updates.newsletterTitle : current.newsletterTitle,
      newsletterSubtitle: updates.newsletterSubtitle !== undefined ? updates.newsletterSubtitle : current.newsletterSubtitle,
    };

    const res = await query(
      `INSERT INTO homepage_config (
        id, hero_title, hero_subtitle, hero_image, hero_cta_text, hero_cta_link,
        featured_title, featured_subtitle, editorial_tag, editorial_title, editorial_quote,
        editorial_image_1, editorial_image_2, newsletter_title, newsletter_subtitle, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (id) DO UPDATE SET
        hero_title = EXCLUDED.hero_title,
        hero_subtitle = EXCLUDED.hero_subtitle,
        hero_image = EXCLUDED.hero_image,
        hero_cta_text = EXCLUDED.hero_cta_text,
        hero_cta_link = EXCLUDED.hero_cta_link,
        featured_title = EXCLUDED.featured_title,
        featured_subtitle = EXCLUDED.featured_subtitle,
        editorial_tag = EXCLUDED.editorial_tag,
        editorial_title = EXCLUDED.editorial_title,
        editorial_quote = EXCLUDED.editorial_quote,
        editorial_image_1 = EXCLUDED.editorial_image_1,
        editorial_image_2 = EXCLUDED.editorial_image_2,
        newsletter_title = EXCLUDED.newsletter_title,
        newsletter_subtitle = EXCLUDED.newsletter_subtitle,
        updated_at = NOW()
      RETURNING *;`,
      [
        merged.id,
        merged.heroTitle,
        merged.heroSubtitle,
        merged.heroImage,
        merged.heroCtaText,
        merged.heroCtaLink,
        merged.featuredTitle,
        merged.featuredSubtitle,
        merged.editorialTag,
        merged.editorialTitle,
        merged.editorialQuote,
        merged.editorialImage1,
        merged.editorialImage2,
        merged.newsletterTitle,
        merged.newsletterSubtitle,
      ]
    );

    if (res.rows.length > 0) {
      return this.getHomepageConfig();
    }
    return merged;
  }

  // --------------------------------------------------------------------------
  // REAL STORAGE & DATABASE METRICS (PostgreSQL + Supabase Media Assets)
  // --------------------------------------------------------------------------
  async getStorageMetrics() {
    try {
      await this.ensureTablesExist();

      // 1. Calculate actual PostgreSQL database size in bytes
      let dbSizeBytes = 0;
      try {
        const dbRes = await query(`SELECT pg_database_size(current_database())::bigint as db_bytes;`);
        dbSizeBytes = Number(dbRes.rows[0]?.db_bytes || 0);
      } catch {}

      // 2. Calculate media assets stored in PostgreSQL BYTEA table
      let mediaSizeBytes = 0;
      let mediaCount = 0;
      try {
        const mediaRes = await query(`
          SELECT COALESCE(SUM(size_bytes), 0)::bigint as media_bytes, 
                 COUNT(*)::bigint as media_count 
          FROM media_assets;
        `);
        mediaSizeBytes = Number(mediaRes.rows[0]?.media_bytes || 0);
        mediaCount = Number(mediaRes.rows[0]?.media_count || 0);
      } catch {}

      // 3. Count product gallery images
      let productImagesCount = 0;
      try {
        const imgRes = await query(`SELECT COUNT(*)::bigint as img_count FROM product_images;`);
        productImagesCount = Number(imgRes.rows[0]?.img_count || 0);
      } catch {}

      // 4. Products & Orders counts
      let productsCount = 0;
      let ordersCount = 0;
      try {
        const pRes = await query(`SELECT COUNT(*)::bigint as p_count FROM products;`);
        productsCount = Number(pRes.rows[0]?.p_count || 0);
        const oRes = await query(`SELECT COUNT(*)::bigint as o_count FROM orders;`);
        ordersCount = Number(oRes.rows[0]?.o_count || 0);
      } catch {}

      const formatBytes = (bytes: number): string => {
        if (bytes <= 0) return "0 B";
        const k = 1024;
        const dm = 1;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
      };

      return {
        dbSizeBytes,
        dbSizeFormatted: formatBytes(dbSizeBytes),
        mediaSizeBytes,
        mediaSizeFormatted: formatBytes(mediaSizeBytes),
        mediaCount,
        productImagesCount,
        productsCount,
        ordersCount,
        totalStorageFormatted: formatBytes(dbSizeBytes + mediaSizeBytes),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("[STORAGE METRICS ERROR]", err);
      return {
        dbSizeBytes: 0,
        dbSizeFormatted: "0 MB",
        mediaSizeBytes: 0,
        mediaSizeFormatted: "0 MB",
        mediaCount: 0,
        productImagesCount: 0,
        productsCount: 0,
        ordersCount: 0,
        totalStorageFormatted: "0 MB",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // --------------------------------------------------------------------------
  // HIGH-PERFORMANCE SQL AGGREGATIONS (ADMIN DASHBOARD & ANALYTICS)
  // --------------------------------------------------------------------------
  async getAdminMetricsSummary() {
    await this.ensureTablesExist();
    const settings = await this.getStoreSettings();
    const threshold = settings.inventoryAlertThreshold || 5;

    const [orderStats, productStats, customerStats, lowStockRes, recentOrdersRes, recentCustomersRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*)::int as total_orders,
          COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END), 0)::numeric as total_revenue,
          COUNT(CASE WHEN status IN ('PENDING', 'CONFIRMED') THEN 1 END)::int as pending_orders,
          COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END)::int as processing_orders,
          COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END)::int as shipped_orders,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END)::int as delivered_orders,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int as cancelled_orders
        FROM orders;
      `),
      query(`
        SELECT 
          COUNT(*)::int as total_products,
          COUNT(CASE WHEN stock_count = 0 OR in_stock = false THEN 1 END)::int as out_of_stock_count,
          COUNT(CASE WHEN stock_count > 0 AND stock_count <= $1 THEN 1 END)::int as low_stock_count
        FROM products;
      `, [threshold]),
      query(`
        SELECT COUNT(*)::int as total_customers FROM users WHERE role != 'admin';
      `),
      query(`
        SELECT id, name, category_label, price, stock_count, in_stock, images
        FROM products
        WHERE stock_count > 0 AND stock_count <= $1
        ORDER BY stock_count ASC
        LIMIT 5;
      `, [threshold]),
      query(`
        SELECT o.*, 
               COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as items
        FROM orders o
        LEFT JOIN order_items i ON o.id = i.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 6;
      `),
      query(`
        SELECT id, name, email, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5;
      `),
    ]);

    const os = orderStats.rows[0] || {};
    const ps = productStats.rows[0] || {};
    const cs = customerStats.rows[0] || {};

    return {
      metrics: {
        totalRevenue: Number(os.total_revenue || 0),
        totalOrders: Number(os.total_orders || 0),
        pendingOrders: Number(os.pending_orders || 0),
        processingOrders: Number(os.processing_orders || 0),
        shippedOrders: Number(os.shipped_orders || 0),
        deliveredOrders: Number(os.delivered_orders || 0),
        cancelledOrders: Number(os.cancelled_orders || 0),
        totalCustomers: Number(cs.total_customers || 0),
        totalProducts: Number(ps.total_products || 0),
        lowStockCount: Number(ps.low_stock_count || 0),
        outOfStockCount: Number(ps.out_of_stock_count || 0),
      },
      pipeline: {
        pending: Number(os.pending_orders || 0),
        processing: Number(os.processing_orders || 0),
        shipped: Number(os.shipped_orders || 0),
        delivered: Number(os.delivered_orders || 0),
        cancelled: Number(os.cancelled_orders || 0),
      },
      recentOrders: recentOrdersRes.rows.map(mapOrderRow),
      recentCustomers: recentCustomersRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })),
      lowStockProducts: lowStockRes.rows.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category_label,
        price: Number(p.price),
        stockCount: Number(p.stock_count),
        image: Array.isArray(p.images) ? p.images[0] : "",
      })),
    };
  }

  async getAdminAnalyticsSummary() {
    await this.ensureTablesExist();
    const [overviewRes, catBreakdownRes, statusRes, topProductsRes] = await Promise.all([
      query(`
        SELECT 
          COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END), 0)::numeric as total_revenue,
          COUNT(*)::int as total_orders,
          COUNT(CASE WHEN status != 'CANCELLED' THEN 1 END)::int as completed_orders
        FROM orders;
      `),
      query(`
        SELECT 
          COALESCE(p.category_label, 'Tops') as category,
          SUM(i.price * i.quantity)::numeric as revenue
        FROM order_items i
        JOIN orders o ON i.order_id = o.id
        LEFT JOIN products p ON i.product_id = p.id
        WHERE o.status != 'CANCELLED'
        GROUP BY COALESCE(p.category_label, 'Tops')
        ORDER BY revenue DESC;
      `),
      query(`
        SELECT status, COUNT(*)::int as count
        FROM orders
        GROUP BY status;
      `),
      query(`
        SELECT 
          i.name,
          COALESCE(i.product_id, i.name) as product_id,
          MAX(i.image) as image,
          SUM(i.quantity)::int as quantity,
          SUM(i.price * i.quantity)::numeric as revenue
        FROM order_items i
        JOIN orders o ON i.order_id = o.id
        WHERE o.status != 'CANCELLED'
        GROUP BY i.name, COALESCE(i.product_id, i.name)
        ORDER BY revenue DESC
        LIMIT 5;
      `),
    ]);

    const ov = overviewRes.rows[0] || {};
    const totalRevenue = Number(ov.total_revenue || 0);
    const completedOrders = Number(ov.completed_orders || 0);
    const aov = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

    const statusCounts: Record<string, number> = {
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const row of statusRes.rows) {
      if (row.status) {
        statusCounts[row.status] = Number(row.count || 0);
      }
    }

    const categoryBreakdown = catBreakdownRes.rows.map((r) => {
      const revenue = Number(r.revenue || 0);
      return {
        category: r.category,
        revenue,
        percent: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
      };
    });

    const topProducts = topProductsRes.rows.map((r) => ({
      name: r.name,
      quantity: Number(r.quantity || 0),
      revenue: Number(r.revenue || 0),
      image: r.image || "",
    }));

    return {
      analytics: {
        totalRevenue,
        totalOrders: Number(ov.total_orders || 0),
        aov,
        topProducts,
        categoryBreakdown,
        statusDistribution: statusCounts,
      },
    };
  }

  async getCustomersSummary(search?: string) {
    await this.ensureTablesExist();
    let sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        COUNT(DISTINCT o.id)::int as order_count,
        COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total ELSE 0 END), 0)::numeric as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id OR LOWER(u.email) = LOWER(o.shipping_address->>'email')
      WHERE 1=1
    `;
    const params: any[] = [];
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }
    sql += ` GROUP BY u.id ORDER BY u.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      orderCount: Number(r.order_count || 0),
      totalSpent: Number(r.total_spent || 0),
      lastOrderDate: r.last_order_date ? new Date(r.last_order_date).toISOString() : null,
    }));
  }
}

export const db = new SupabaseDataStore();

// React Server Component request-scoped deduplication
import * as React from "react";
const serverCache = typeof (React as any).cache === "function" ? (React as any).cache : (<T extends (...args: any[]) => any>(fn: T) => fn);

export const getCachedProductById = serverCache(async (idOrSlug: string) => {
  return db.getProductById(idOrSlug);
});

export const getCachedCategoryBySlug = serverCache(async (slug: string) => {
  return db.getCategoryBySlug(slug);
});

