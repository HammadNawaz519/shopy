"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Product } from "@/lib/data/products";

import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface ServerCartCalculation {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoApplied: string | null;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string, color: string, quantity?: number, customImage?: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  serverCalculation: ServerCartCalculation | null;
  validateWithServer: (promo?: string) => Promise<ServerCartCalculation | null>;
  isLoadingServer: boolean;
}

// Exported so enhanced/alternate providers can publish values on the same
// context object, keeping every existing `useCart()` consumer working.
export const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "shopy_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [serverCalculation, setServerCalculation] = useState<ServerCartCalculation | null>(null);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const isSyncingWithServer = React.useRef(false);
  const initialUserSyncRef = React.useRef<string | null>(null);

  // 1. Hydrate and sanitize from localStorage on initial boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .filter(
              (i: any) =>
                i &&
                typeof i === "object" &&
                typeof i.productId === "string" &&
                i.productId.trim() !== "" &&
                typeof i.name === "string" &&
                i.name.trim() !== "" &&
                typeof i.price === "number" &&
                !isNaN(i.price) &&
                typeof i.quantity === "number" &&
                i.quantity > 0
            )
            .map((i: any) => ({
              productId: i.productId.trim(),
              name: i.name.trim(),
              price: Number(i.price),
              quantity: Math.max(1, Number(i.quantity)),
              size: i.size || "M",
              color: i.color || "Default",
              image:
                typeof i.image === "string" && i.image.trim() !== ""
                  ? i.image
                  : "/editorial-craft.jpg",
            }));
          setItems(sanitized);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Synchronize with PostgreSQL database when user is authenticated (Multi-Device Sync)
  useEffect(() => {
    if (!isHydrated || authLoading) return;

    if (user) {
      if (initialUserSyncRef.current !== user.id) {
        initialUserSyncRef.current = user.id;

        const syncWithServerCart = async () => {
          isSyncingWithServer.current = true;
          try {
            const res = await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items, merge: true }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.items && Array.isArray(data.items)) {
                setItems(data.items);
                try {
                  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.items));
                } catch {}
              }
            }
          } catch (err) {
            console.error("[CART SYNC ERROR]", err);
          } finally {
            setTimeout(() => {
              isSyncingWithServer.current = false;
            }, 300);
          }
        };

        syncWithServerCart();
      }
    } else {
      initialUserSyncRef.current = null;
    }
  }, [user, authLoading, isHydrated]);

  // 3. Save to localStorage and debounce persist to Database for logged in user
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}

    if (user && !isSyncingWithServer.current && initialUserSyncRef.current === user.id) {
      const timer = setTimeout(async () => {
        try {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items, merge: false }),
          });
        } catch {}
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [items, isHydrated, user]);

  const validateWithServer = useCallback(
    async (promo?: string): Promise<ServerCartCalculation | null> => {
      if (items.length === 0) {
        setServerCalculation(null);
        return null;
      }
      setIsLoadingServer(true);
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              size: i.size || "M",
              color: i.color || "Default",
              image: i.image,
            })),
            promoCode: promo !== undefined ? promo : promoCode,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setServerCalculation(data.cart);
          return data.cart;
        }
        return null;
      } catch {
        return null;
      } finally {
        setIsLoadingServer(false);
      }
    },
    [items, promoCode]
  );

  // Recalculate server price only when cart drawer is active or promoCode is applied.
  // Debounced 500ms to coalesce rapid quantity changes into a single validate request.
  useEffect(() => {
    if (!isHydrated) return;
    if (items.length === 0) {
      setServerCalculation(null);
      return;
    }
    if (!isOpen && !promoCode) return;

    const timer = setTimeout(() => {
      validateWithServer();
    }, 500);

    return () => clearTimeout(timer);
  }, [items, isHydrated, isOpen, promoCode, validateWithServer]);

  const openCart = () => {
    setIsOpen(true);
  };
  const closeCart = () => setIsOpen(false);

  const addItem = (
    product: Product,
    size: string,
    color: string,
    quantity = 1,
    customImage?: string
  ) => {
    if (!product || !product.id || !product.name) return;
    const matchedColor = Array.isArray(product.colors)
      ? product.colors.find((c: any) => c && c.name === color)
      : null;
    const resolvedImage =
      customImage ||
      matchedColor?.imageUrl ||
      (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === "string" && product.images[0].trim() !== ""
        ? product.images[0]
        : "/editorial-craft.jpg");

    setItems((prev) => {
      const sanitized = prev.filter(
        (i) => Boolean(i && i.productId && i.name && typeof i.price === "number" && i.quantity > 0)
      );
      const existingIdx = sanitized.findIndex(
        (i) => i.productId === product.id && i.size === size && i.color === color
      );
      if (existingIdx > -1) {
        const next = [...sanitized];
        next[existingIdx].quantity += Math.max(1, quantity);
        return next;
      }
      return [
        ...sanitized,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: Math.max(1, quantity),
          size: size || "M",
          color: color || "Default",
          image: resolvedImage,
        },
      ];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string, size: string, color: string) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.size === size && i.color === color)
      )
    );
  };

  const updateQuantity = (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.size === size && item.color === color) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setServerCalculation(null);
    setPromoCode("");
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
    if (user) {
      fetch("/api/cart", { method: "DELETE" }).catch(() => {});
    }
  };

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        promoCode,
        setPromoCode,
        serverCalculation,
        validateWithServer,
        isLoadingServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
