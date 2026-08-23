import { PRODUCTS as INITIAL_PRODUCTS, Product } from "../data/products";
import { CATEGORIES as INITIAL_CATEGORIES, Category } from "../data/categories";
import { hashPassword } from "../security/auth";

export const ADMIN_EMAIL = "hammadnawaz276@gmail.com";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "CONFIRMED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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
  createdAt: string;
  notes?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
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

// Global server-side persistent store in memory
declare global {
  var __shopy_users: Map<string, UserRecord> | undefined;
  var __shopy_orders: Map<string, OrderRecord> | undefined;
  var __shopy_products: Map<string, Product> | undefined;
  var __shopy_categories: Map<string, Category> | undefined;
  var __shopy_discounts: Map<string, DiscountCoupon> | undefined;
  var __shopy_reviews: Map<string, ProductReview> | undefined;
  var __shopy_settings: StoreSettings | undefined;
  var __shopy_newsletter: Set<string> | undefined;
  var __shopy_inquiries: Array<any> | undefined;
}

const users = global.__shopy_users || new Map<string, UserRecord>();
const orders = global.__shopy_orders || new Map<string, OrderRecord>();
const products = global.__shopy_products || new Map<string, Product>();
const categories = global.__shopy_categories || new Map<string, Category>();
const discounts = global.__shopy_discounts || new Map<string, DiscountCoupon>();
const reviews = global.__shopy_reviews || new Map<string, ProductReview>();
const newsletter = global.__shopy_newsletter || new Set<string>();
const inquiries = global.__shopy_inquiries || [];

let settings: StoreSettings = global.__shopy_settings || {
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

if (process.env.NODE_ENV !== "production") {
  global.__shopy_users = users;
  global.__shopy_orders = orders;
  global.__shopy_products = products;
  global.__shopy_categories = categories;
  global.__shopy_discounts = discounts;
  global.__shopy_reviews = reviews;
  global.__shopy_settings = settings;
  global.__shopy_newsletter = newsletter;
  global.__shopy_inquiries = inquiries;
}

// Initialize seed data
async function initStore() {
  // Seed Products
  if (products.size === 0) {
    for (const p of INITIAL_PRODUCTS) {
      products.set(p.id, { ...p });
    }
  }

  // Seed Categories
  if (categories.size === 0) {
    for (const c of INITIAL_CATEGORIES) {
      categories.set(c.id, { ...c });
    }
  }

  // Seed Users
  if (!users.has(ADMIN_EMAIL)) {
    const adminHash = await hashPassword("Hammad519..");
    // Primary Admin Account
    users.set(ADMIN_EMAIL, {
      id: "usr_admin_master",
      name: "Hammad Nawaz",
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      role: "admin",
      createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    });
  }

  if (!users.has("demo@shopy.com")) {
    const demoHash = await hashPassword("Shopy@2026");
    // Customer Account
    users.set("demo@shopy.com", {
      id: "usr_demo_customer",
      name: "Ayaan Malik",
      email: "demo@shopy.com",
      passwordHash: demoHash,
      role: "user",
      createdAt: new Date("2026-02-01T00:00:00Z").toISOString(),
    });
  }

  // Seed Discounts
  if (discounts.size === 0) {
    discounts.set("SHOPY10", {
      id: "dsc_1",
      code: "SHOPY10",
      type: "percentage",
      value: 10,
      minOrder: 5000,
      usageCount: 14,
      active: true,
      createdAt: new Date("2026-01-10").toISOString(),
    });
    discounts.set("EDITORIAL15", {
      id: "dsc_2",
      code: "EDITORIAL15",
      type: "percentage",
      value: 15,
      minOrder: 15000,
      usageCount: 8,
      active: true,
      createdAt: new Date("2026-01-15").toISOString(),
    });
    discounts.set("WELCOME500", {
      id: "dsc_3",
      code: "WELCOME500",
      type: "fixed",
      value: 500,
      minOrder: 8000,
      usageCount: 22,
      active: true,
      createdAt: new Date("2026-02-01").toISOString(),
    });
  }

  // Seed Initial Orders if empty
  if (orders.size === 0) {
    const sampleOrder1: OrderRecord = {
      id: "ord_101",
      orderNumber: "SHP-2026-8492",
      userId: "usr_demo_customer",
      items: [
        {
          productId: "prod-1",
          name: "Architectural Boxy Heavyweight Tee",
          price: 8500,
          quantity: 2,
          size: "L",
          color: "Obsidian Slate",
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
        },
      ],
      subtotal: 17000,
      discount: 1700,
      shipping: 0,
      total: 15300,
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentMethod: "card",
      shippingAddress: {
        firstName: "Ayaan",
        lastName: "Malik",
        email: "demo@shopy.com",
        phone: "0300 1234567",
        address: "House 14, Street 9, Sector F-7/2",
        city: "Islamabad",
        postalCode: "44000",
        province: "Federal",
      },
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    };

    const sampleOrder2: OrderRecord = {
      id: "ord_102",
      orderNumber: "SHP-2026-9123",
      userId: "usr_demo_customer",
      items: [
        {
          productId: "prod-3",
          name: "Silk-Modal Heavyweight Track Jacket",
          price: 18500,
          quantity: 1,
          size: "M",
          color: "Muted Bone",
          image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=600",
        },
        {
          productId: "prod-5",
          name: "Bois d'Encens Extrait de Parfum 50ml",
          price: 22000,
          quantity: 1,
          size: "50ml",
          color: "Obsidian Glass",
          image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600",
        },
      ],
      subtotal: 40500,
      discount: 0,
      shipping: 0,
      total: 40500,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentMethod: "cod",
      shippingAddress: {
        firstName: "Bilal",
        lastName: "Khan",
        email: "bilal.khan@gmail.com",
        phone: "0321 9876543",
        address: "Apartment 4B, Signature Tower, Clifton",
        city: "Karachi",
        postalCode: "75600",
        province: "Sindh",
      },
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    };

    orders.set(sampleOrder1.id, sampleOrder1);
    orders.set(sampleOrder2.id, sampleOrder2);
  }

  // Seed Reviews
  if (reviews.size === 0) {
    reviews.set("rev_1", {
      id: "rev_1",
      productId: "prod-1",
      productName: "Architectural Boxy Heavyweight Tee",
      customerName: "Ayaan Malik",
      customerEmail: "ayaan@gmail.com",
      rating: 5,
      comment: "The drape and weight of the 280 GSM cotton is phenomenal. Best tee I own.",
      status: "approved",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    });
    reviews.set("rev_2", {
      id: "rev_2",
      productId: "prod-5",
      productName: "Bois d'Encens Extrait de Parfum",
      customerName: "Hamza Tariq",
      customerEmail: "hamza@gmail.com",
      rating: 5,
      comment: "Incredible sillage and longevity. Rich smoky cedar and incense notes.",
      status: "approved",
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    });
  }
}
initStore();

export const db = {
  // PRODUCTS CRUD
  getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    tag?: string;
    featured?: boolean;
    sort?: string;
    inStockOnly?: boolean;
  }): Product[] {
    let result = Array.from(products.values());

    if (filters?.category && filters.category !== "all") {
      result = result.filter((p) => p.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.featured) {
      result = result.filter((p) => p.featured);
    }

    if (filters?.tag) {
      result = result.filter((p) => p.tag === filters.tag);
    }

    if (filters?.inStockOnly) {
      result = result.filter((p) => p.inStock && p.stockCount > 0);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    if (filters?.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters?.sort) {
      switch (filters.sort) {
        case "price-asc":
          result.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          result.sort((a, b) => b.price - a.price);
          break;
        case "name-asc":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "stock-asc":
          result.sort((a, b) => a.stockCount - b.stockCount);
          break;
        default:
          break;
      }
    }

    return result;
  },

  getProductById(id: string): Product | undefined {
    return products.get(id) || Array.from(products.values()).find((p) => p.slug === id);
  },

  addProduct(productData: Omit<Product, "id">): Product {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      inStock: productData.stockCount > 0,
    };
    products.set(id, newProduct);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const existing = products.get(id);
    if (!existing) return undefined;

    const updated: Product = {
      ...existing,
      ...updates,
      inStock: updates.stockCount !== undefined ? updates.stockCount > 0 : existing.inStock,
    };
    products.set(id, updated);
    return updated;
  },

  deleteProduct(id: string): boolean {
    return products.delete(id);
  },

  // CATEGORIES
  getCategories(): Category[] {
    return Array.from(categories.values());
  },

  getCategoryBySlug(slug: string): Category | undefined {
    return Array.from(categories.values()).find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  },

  addCategory(categoryData: Omit<Category, "id">): Category {
    const id = `cat-${Date.now()}`;
    const newCat: Category = { ...categoryData, id };
    categories.set(id, newCat);
    return newCat;
  },

  updateCategory(id: string, updates: Partial<Category>): Category | undefined {
    const existing = categories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    categories.set(id, updated);
    return updated;
  },

  // USERS
  findUserByEmail(email: string): UserRecord | undefined {
    const norm = email.toLowerCase().trim();
    let u = users.get(norm);
    if (!u && norm === ADMIN_EMAIL) {
      // Ensure primary admin always exists
      const bcrypt = require("bcryptjs");
      const adminHash = bcrypt.hashSync("Hammad519..", 10);
      u = {
        id: "usr_admin_master",
        name: "Hammad Nawaz",
        email: ADMIN_EMAIL,
        passwordHash: adminHash,
        role: "admin",
        createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
      };
      users.set(ADMIN_EMAIL, u);
    }
    return u;
  },

  findUserById(id: string): UserRecord | undefined {
    for (const user of users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  },

  getAllUsers(): Omit<UserRecord, "passwordHash" | "resetToken">[] {
    const list: Omit<UserRecord, "passwordHash" | "resetToken">[] = [];
    for (const u of users.values()) {
      list.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      });
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createUser(user: Omit<UserRecord, "id" | "createdAt">): UserRecord {
    const normalizedEmail = user.email.toLowerCase().trim();
    // Server-side role assignment: hammadnawaz276@gmail.com is strictly granted admin role
    const assignedRole: "admin" | "user" = normalizedEmail === ADMIN_EMAIL ? "admin" : (user.role || "user");

    const newUser: UserRecord = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: normalizedEmail,
      role: assignedRole,
      createdAt: new Date().toISOString(),
    };
    users.set(newUser.email, newUser);
    return newUser;
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    users.set(user.email, updated);
    return updated;
  },

  // ORDERS & MANAGEMENT
  getAllOrders(): OrderRecord[] {
    return Array.from(orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  createOrder(orderData: Omit<OrderRecord, "id" | "orderNumber" | "createdAt" | "status" | "paymentStatus">): OrderRecord {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SHP-${new Date().getFullYear()}-${randomSuffix}`;

    const newOrder: OrderRecord = {
      ...orderData,
      id: orderId,
      orderNumber,
      status: "CONFIRMED",
      paymentStatus: orderData.paymentMethod === "card" ? "PAID" : "PENDING",
      createdAt: new Date().toISOString(),
    };

    orders.set(orderId, newOrder);

    // Deduct stock
    for (const item of orderData.items) {
      const prod = products.get(item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stockCount - item.quantity);
        this.updateProduct(prod.id, { stockCount: newStock });
      }
    }

    return newOrder;
  },

  getOrderById(id: string): OrderRecord | undefined {
    return orders.get(id);
  },

  getOrdersByUserId(userId: string): OrderRecord[] {
    const list: OrderRecord[] = [];
    for (const ord of orders.values()) {
      if (ord.userId === userId) {
        list.push(ord);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): OrderRecord | undefined {
    const ord = orders.get(orderId);
    if (!ord) return undefined;
    ord.status = status;
    if (notes) ord.notes = notes;
    orders.set(orderId, ord);
    return ord;
  },

  updateOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus): OrderRecord | undefined {
    const ord = orders.get(orderId);
    if (!ord) return undefined;
    ord.paymentStatus = paymentStatus;
    orders.set(orderId, ord);
    return ord;
  },

  // DISCOUNTS
  getDiscounts(): DiscountCoupon[] {
    return Array.from(discounts.values());
  },

  addDiscount(discountData: Omit<DiscountCoupon, "id" | "usageCount" | "createdAt">): DiscountCoupon {
    const code = discountData.code.toUpperCase().trim();
    const newDiscount: DiscountCoupon = {
      ...discountData,
      id: `dsc_${Date.now()}`,
      code,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    discounts.set(code, newDiscount);
    return newDiscount;
  },

  updateDiscount(code: string, updates: Partial<DiscountCoupon>): DiscountCoupon | undefined {
    const existing = discounts.get(code.toUpperCase().trim());
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    discounts.set(code.toUpperCase().trim(), updated);
    return updated;
  },

  deleteDiscount(code: string): boolean {
    return discounts.delete(code.toUpperCase().trim());
  },

  // REVIEWS
  getReviews(): ProductReview[] {
    return Array.from(reviews.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  updateReviewStatus(id: string, status: "approved" | "rejected"): ProductReview | undefined {
    const rev = reviews.get(id);
    if (!rev) return undefined;
    rev.status = status;
    reviews.set(id, rev);
    return rev;
  },

  deleteReview(id: string): boolean {
    return reviews.delete(id);
  },

  // STORE SETTINGS
  getStoreSettings(): StoreSettings {
    return { ...settings };
  },

  updateStoreSettings(updates: Partial<StoreSettings>): StoreSettings {
    settings = { ...settings, ...updates };
    return settings;
  },

  // CART RECALCULATION
  recalculateCart(items: Array<{ productId: string; quantity: number; size: string; color: string }>, promoCode?: string) {
    const validatedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.get(item.productId);
      if (!product) continue;

      const qty = Math.max(1, Math.min(item.quantity, 50));
      const lineTotal = product.price * qty;
      subtotal += lineTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        size: item.size,
        color: item.color,
        image: product.images[0],
      });
    }

    let discount = 0;
    if (promoCode) {
      const coupon = discounts.get(promoCode.toUpperCase().trim());
      if (coupon && coupon.active && subtotal >= coupon.minOrder) {
        if (coupon.type === "percentage") {
          discount = Math.round((subtotal * coupon.value) / 100);
        } else {
          discount = Math.min(coupon.value, subtotal);
        }
      }
    }

    const shipping = subtotal > settings.freeShippingThreshold || subtotal === 0 ? 0 : settings.flatShippingRate;
    const total = Math.max(0, subtotal - discount + shipping);

    return {
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      total,
      promoApplied: discount > 0 ? promoCode?.toUpperCase() : null,
    };
  },

  // NEWSLETTER & INQUIRIES
  subscribeNewsletter(email: string): boolean {
    const normalized = email.toLowerCase().trim();
    if (newsletter.has(normalized)) return false;
    newsletter.add(normalized);
    return true;
  },

  addInquiry(inquiry: { name: string; email: string; subject: string; message: string }) {
    inquiries.push({
      ...inquiry,
      timestamp: new Date().toISOString(),
    });
  },
};
