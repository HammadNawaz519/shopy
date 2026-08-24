import { query, transaction } from "./client";

export const ADMIN_EMAIL = "hammadnawaz276@gmail.com";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface ProductColor {
  name: string;
  hex: string;
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
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "cod" | "card";
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
}

// Transform PostgreSQL Row to Product Interface
function mapProductRow(row: any): Product {
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
    images: Array.isArray(row.images) ? row.images : [],
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

class SupabaseDataStore {
  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  async getProducts(filter?: { category?: string; featured?: boolean; search?: string; sort?: string }): Promise<Product[]> {
    let sql = `SELECT * FROM products WHERE 1=1`;
    const params: any[] = [];

    if (filter?.category) {
      params.push(filter.category.toLowerCase());
      sql += ` AND LOWER(category_slug) = $${params.length}`;
    }

    if (filter?.featured !== undefined) {
      params.push(filter.featured);
      sql += ` AND featured = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
    }

    if (filter?.sort === "price-asc") {
      sql += ` ORDER BY price ASC;`;
    } else if (filter?.sort === "price-desc") {
      sql += ` ORDER BY price DESC;`;
    } else {
      sql += ` ORDER BY created_at DESC;`;
    }

    const res = await query(sql, params);
    return res.rows.map(mapProductRow);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const res = await query(`SELECT * FROM products WHERE id = $1 OR slug = $1 LIMIT 1;`, [id]);
    if (res.rows.length === 0) return undefined;
    return mapProductRow(res.rows[0]);
  }

  async addProduct(productData: Omit<Product, "id"> & { id?: string }): Promise<Product> {
    const id = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const stockCount = productData.stockCount !== undefined ? productData.stockCount : 15;

    const categorySlug = typeof productData.category === "string" ? productData.category.toLowerCase() : "tops";
    const categoryLabel = productData.categoryLabel || categorySlug.toUpperCase();

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
        "cat-1",
        categorySlug,
        categoryLabel,
        productData.price,
        productData.originalPrice || null,
        productData.description,
        productData.tag || "NEW",
        productData.images || [],
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

    return mapProductRow(res.rows[0]);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const existing = await this.getProductById(id);
    if (!existing) return undefined;

    const stockCount = updates.stockCount !== undefined ? updates.stockCount : existing.stockCount;
    const inStock = stockCount > 0;

    const res = await query(
      `UPDATE products SET
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        price = COALESCE($4, price),
        original_price = $5,
        description = COALESCE($6, description),
        tag = COALESCE($7, tag),
        featured = COALESCE($8, featured),
        stock_count = $9,
        in_stock = $10,
        images = COALESCE($11, images),
        colors = COALESCE($12, colors),
        sizes = COALESCE($13, sizes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.name || null,
        updates.slug || null,
        updates.price !== undefined ? updates.price : null,
        updates.originalPrice !== undefined ? updates.originalPrice : (existing.originalPrice || null),
        updates.description || null,
        updates.tag || null,
        updates.featured !== undefined ? updates.featured : null,
        stockCount,
        inStock,
        updates.images || null,
        updates.colors ? JSON.stringify(updates.colors) : null,
        updates.sizes || null,
      ]
    );

    return mapProductRow(res.rows[0]);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM products WHERE id = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  async getCategories() {
    const res = await query(`
      SELECT c.*, COUNT(p.id)::int as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
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

  async addCategory(cat: { name: string; slug: string; tagline?: string; image: string; description?: string }) {
    const id = `cat_${Date.now()}`;
    const res = await query(
      `INSERT INTO categories (id, name, slug, tagline, image, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [id, cat.name, cat.slug, cat.tagline || "", cat.image, cat.description || ""]
    );
    return res.rows[0];
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
   * Creates an order with relational line items and atomically deducts inventory.
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
    paymentMethod?: "cod" | "card";
    shippingAddress: any;
    notes?: string;
  }): Promise<OrderRecord> {
    return transaction(async (client) => {
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const orderNumber = `SHP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insert Master Order Record
      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, subtotal, discount, shipping, total,
          status, payment_status, payment_method, shipping_address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
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
    try {
      const res = await query(`SELECT * FROM store_settings LIMIT 1;`);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          storeName: r.store_name || "SHOPY Atelier",
          supportEmail: r.support_email || "concierge@shopy.com",
          currency: r.currency || "PKR",
          currencySymbol: r.currency_symbol || "Rs.",
          freeShippingThreshold: Number(r.free_shipping_threshold ?? 15000),
          flatShippingRate: Number(r.flat_shipping_rate ?? 500),
          taxPercentage: Number(r.tax_percentage ?? 0),
          orderNotifications: Boolean(r.order_notifications ?? true),
          inventoryAlertThreshold: Number(r.inventory_alert_threshold ?? 5),
        };
      }
    } catch (err) {
      console.error("[GET STORE SETTINGS ERROR]", err);
    }

    return {
      id: "settings_default",
      storeName: "SHOPY Atelier",
      supportEmail: "concierge@shopy.com",
      currency: "PKR",
      currencySymbol: "Rs.",
      freeShippingThreshold: 15000,
      flatShippingRate: 500,
      taxPercentage: 0,
      orderNotifications: true,
      inventoryAlertThreshold: 5,
    };
  }

  async updateStoreSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getStoreSettings();
    const merged: StoreSettings = {
      id: "settings_default",
      storeName: updates.storeName !== undefined ? updates.storeName : current.storeName,
      supportEmail: updates.supportEmail !== undefined ? updates.supportEmail : current.supportEmail,
      currency: updates.currency !== undefined ? updates.currency : current.currency,
      currencySymbol: updates.currencySymbol !== undefined ? updates.currencySymbol : current.currencySymbol,
      freeShippingThreshold: updates.freeShippingThreshold !== undefined ? Number(updates.freeShippingThreshold) : current.freeShippingThreshold,
      flatShippingRate: updates.flatShippingRate !== undefined ? Number(updates.flatShippingRate) : current.flatShippingRate,
      taxPercentage: updates.taxPercentage !== undefined ? Number(updates.taxPercentage) : current.taxPercentage,
      orderNotifications: updates.orderNotifications !== undefined ? Boolean(updates.orderNotifications) : current.orderNotifications,
      inventoryAlertThreshold: updates.inventoryAlertThreshold !== undefined ? Number(updates.inventoryAlertThreshold) : current.inventoryAlertThreshold,
    };

    const res = await query(
      `INSERT INTO store_settings (
        id, store_name, support_email, currency, currency_symbol,
        free_shipping_threshold, flat_shipping_rate, tax_percentage,
        order_notifications, inventory_alert_threshold, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
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
      };
    }

    return merged;
  }

  // --------------------------------------------------------------------------
  // INQUIRIES & NEWSLETTER
  // --------------------------------------------------------------------------
  async addInquiry(inquiry: { name: string; email: string; subject: string; message: string }) {
    await query(
      `INSERT INTO inquiries (name, email, subject, message)
       VALUES ($1, $2, $3, $4);`,
      [inquiry.name, inquiry.email, inquiry.subject, inquiry.message]
    );
    return true;
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
}

export const db = new SupabaseDataStore();
