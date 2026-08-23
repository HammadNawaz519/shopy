"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Product } from "@/lib/data/products";

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
  addItem: (product: Product, size: string, color: string, quantity?: number) => void;
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

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "shopy_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [serverCalculation, setServerCalculation] = useState<ServerCartCalculation | null>(null);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

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
              quantity: i.quantity,
              size: i.size,
              color: i.color,
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

  // Recalculate server price only when cart drawer is active or promoCode is applied
  useEffect(() => {
    if (isHydrated && items.length > 0 && (isOpen || promoCode)) {
      validateWithServer();
    } else if (items.length === 0) {
      setServerCalculation(null);
    }
  }, [items, isHydrated, isOpen, promoCode, validateWithServer]);

  const openCart = () => {
    setIsOpen(true);
    if (items.length > 0) {
      validateWithServer();
    }
  };
  const closeCart = () => setIsOpen(false);

  const addItem = (product: Product, size: string, color: string, quantity = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.size === size && i.color === color
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          size,
          color,
          image: product.images[0],
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
    localStorage.removeItem(CART_STORAGE_KEY);
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
