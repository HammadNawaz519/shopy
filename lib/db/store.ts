import { PRODUCTS, Product } from "../data/products";
import { CATEGORIES, Category } from "../data/categories";
import { hashPassword } from "../security/auth";

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

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED";
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
}

// Global in-memory storage simulating a secure database
declare global {
  var __shopy_users: Map<string, UserRecord> | undefined;
  var __shopy_orders: Map<string, OrderRecord> | undefined;
  var __shopy_newsletter: Set<string> | undefined;
  var __shopy_inquiries: Array<any> | undefined;
}

const users = global.__shopy_users || new Map<string, UserRecord>();
const orders = global.__shopy_orders || new Map<string, OrderRecord>();
const newsletter = global.__shopy_newsletter || new Set<string>();
const inquiries = global.__shopy_inquiries || [];

if (process.env.NODE_ENV !== "production") {
  global.__shopy_users = users;
  global.__shopy_orders = orders;
  global.__shopy_newsletter = newsletter;
  global.__shopy_inquiries = inquiries;
}

// Initialize demo user if empty
async function initDefaultUsers() {
  if (users.size === 0) {
    const demoHash = await hashPassword("Shopy@2026");
    users.set("demo@shopy.com", {
      id: "user-demo-1",
      name: "Ayaan Malik",
      email: "demo@shopy.com",
      passwordHash: demoHash,
      role: "user",
      createdAt: new Date().toISOString(),
    });
  }
}
initDefaultUsers();

// Promo codes database
const PROMO_CODES: Record<string, number> = {
  SHOPY10: 0.1, // 10% discount
  EDITORIAL15: 0.15, // 15% discount
  WELCOME500: 500, // Rs. 500 flat discount
};

export const db = {
  // PRODUCTS
  getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    tag?: string;
    featured?: boolean;
    sort?: string;
  }): Product[] {
    let result = [...PRODUCTS];

    if (filters?.category && filters.category !== "all") {
      result = result.filter((p) => p.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.featured) {
      result = result.filter((p) => p.featured);
    }

    if (filters?.tag) {
      result = result.filter((p) => p.tag === filters.tag);
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
        default:
          break;
      }
    }

    return result;
  },

  getProductById(id: string): Product | undefined {
    return PRODUCTS.find((p) => p.id === id || p.slug === id);
  },

  getCategories(): Category[] {
    return CATEGORIES;
  },

  getCategoryBySlug(slug: string): Category | undefined {
    return CATEGORIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  },

  // USERS
  findUserByEmail(email: string): UserRecord | undefined {
    return users.get(email.toLowerCase().trim());
  },

  findUserById(id: string): UserRecord | undefined {
    for (const user of users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  },

  findUserByResetToken(token: string): UserRecord | undefined {
    const now = Date.now();
    for (const user of users.values()) {
      if (
        user.resetToken === token &&
        user.resetTokenExpiry &&
        user.resetTokenExpiry > now
      ) {
        return user;
      }
    }
    return undefined;
  },

  createUser(user: Omit<UserRecord, "id" | "createdAt">): UserRecord {
    const newUser: UserRecord = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: user.email.toLowerCase().trim(),
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

  // CART & SERVER-SIDE PRICE RECALCULATION
  recalculateCart(items: Array<{ productId: string; quantity: number; size: string; color: string }>, promoCode?: string) {
    const validatedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = PRODUCTS.find((p) => p.id === item.productId);
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
    if (promoCode && PROMO_CODES[promoCode.toUpperCase()]) {
      const value = PROMO_CODES[promoCode.toUpperCase()];
      if (value < 1) {
        discount = Math.round(subtotal * value);
      } else {
        discount = Math.min(value, subtotal);
      }
    }

    // Free shipping above Rs. 15,000, otherwise flat Rs. 500
    const shipping = subtotal > 15000 || subtotal === 0 ? 0 : 500;
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

  // ORDERS
  createOrder(orderData: Omit<OrderRecord, "id" | "orderNumber" | "createdAt" | "status">): OrderRecord {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SHP-${new Date().getFullYear()}-${randomSuffix}`;

    const newOrder: OrderRecord = {
      ...orderData,
      id: orderId,
      orderNumber,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    orders.set(orderId, newOrder);
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
