"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Product } from "@/lib/data/products";
import { useEnhancedAuth } from "@/context/EnhancedAuthContext";
import { CartContext as BaseCartContext } from "@/context/CartContext";
import { offlineStorage, storage } from "@/lib/storage/indexedDB";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
  lastSynced?: number;
  isPendingSync?: boolean;
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
  isOffline: boolean;
  hasPendingSync: boolean;
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
  syncWithServer: () => Promise<void>;
  getOfflineStatus: () => { isOffline: boolean; pendingItems: number };
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "shopy_cart_v2";

export function EnhancedCartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isOffline: networkOffline } = useEnhancedAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [serverCalculation, setServerCalculation] = useState<ServerCartCalculation | null>(null);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  const isSyncingWithServer = useRef(false);
  const initialUserSyncRef = useRef<string | null>(null);
  const pendingSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Hydrate from multiple sources on initial boot
  useEffect(() => {
    const hydrateCart = async () => {
      try {
        let loadedItems: CartItem[] = [];

        // First, try IndexedDB (user-scoped if available)
        if (user?.id) {
          const cachedCart = (await storage.cart.get(user.id)) as
            | { items: Array<{ lastSynced?: number; isPendingSync?: boolean }> }
            | null;
          if (cachedCart && Array.isArray(cachedCart.items)) {
            loadedItems = cachedCart.items.map((item: any) => ({
              ...item,
              lastSynced: item.lastSynced || Date.now(),
            }));
          }
        }

        // If no IndexedDB data, try localStorage (legacy)
        if (loadedItems.length === 0) {
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              loadedItems = parsed
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
                  lastSynced: i.lastSynced || Date.now(),
                }));
            }
          }
        }

        setItems(loadedItems);

        // Check for pending sync items
        const hasPending = loadedItems.some(item => item.isPendingSync);
        setHasPendingSync(hasPending);
      } catch (error) {
        console.warn("[Cart] Hydration failed:", error);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateCart();
  }, [user?.id]);

  // 2. Synchronize with PostgreSQL database when user is authenticated
  useEffect(() => {
    if (!isHydrated || authLoading) return;

    if (user) {
      if (initialUserSyncRef.current !== user.id) {
        initialUserSyncRef.current = user.id;
        // First login for this user: pull in the server cart (multi-device merge).
        syncWithServer("merge");
      }
    } else {
      initialUserSyncRef.current = null;
    }
  }, [user, authLoading, isHydrated]);

  // 3. Save to persistent storage
  useEffect(() => {
    if (!isHydrated) return;

    const saveCart = async () => {
      try {
        // Save to localStorage (legacy support)
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

        // Save to IndexedDB (user-scoped)
        if (user?.id) {
          await storage.cart.set(user.id, {
            items,
            updatedAt: Date.now(),
          });
        }

        // Check for pending sync
        const hasPending = items.some(item => item.isPendingSync);
        setHasPendingSync(hasPending);

        // Queue sync if online and not already syncing
        if (!networkOffline && user && !isSyncingWithServer.current) {
          if (pendingSyncTimeoutRef.current) {
            clearTimeout(pendingSyncTimeoutRef.current);
          }

          pendingSyncTimeoutRef.current = setTimeout(() => {
            syncWithServer();
          }, 1000);
        }
      } catch (error) {
        console.warn("[Cart] Failed to save cart:", error);
      }
    };

    saveCart();

    return () => {
      if (pendingSyncTimeoutRef.current) {
        clearTimeout(pendingSyncTimeoutRef.current);
      }
    };
  }, [items, isHydrated, user, networkOffline]);

  // Sync cart with server.
  //
  // `mode` selects how the server cart is reconciled:
  //   - "merge"   : union of server + local (first login, multi-device pull-in)
  //   - "replace" : server is replaced by this device's validated local items
  //                 (used to reconcile local offline changes on reconnect, so
  //                 offline additions AND removals both propagate)
  //
  // In both cases the server remains authoritative for pricing/inventory: this
  // only persists the line items; /api/cart/validate and /api/orders recompute
  // totals from server data. Nothing here ever fakes a successful sync.
  const syncWithServer = useCallback(async (mode: "merge" | "replace" = "replace") => {
    if (!user?.id || isSyncingWithServer.current || networkOffline) {
      return;
    }

    isSyncingWithServer.current = true;

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, merge: mode === "merge" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          // Update items with server data and mark as synced
          const syncedItems = data.items.map((item: any) => ({
            ...item,
            lastSynced: Date.now(),
            isPendingSync: false,
          }));

          setItems(syncedItems);

          // Update local storage
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(syncedItems));

          // Update IndexedDB
          if (user.id) {
            await storage.cart.set(user.id, {
              items: syncedItems,
              updatedAt: Date.now(),
            });
          }
        }
      }
    } catch (error) {
      console.error("[Cart] Sync error:", error);

      // Mark items as pending sync
      const pendingItems = items.map(item => ({
        ...item,
        isPendingSync: true,
      }));

      setItems(pendingItems);
      setHasPendingSync(true);
    } finally {
      setTimeout(() => {
        isSyncingWithServer.current = false;
      }, 300);
    }
  }, [items, user, networkOffline]);

  // Validate cart with server (price calculation)
  const validateWithServer = useCallback(
    async (promo?: string): Promise<ServerCartCalculation | null> => {
      if (items.length === 0) {
        setServerCalculation(null);
        return null;
      }

      // If offline, return cached calculation or compute locally
      if (networkOffline) {
        const cachedCalc = await offlineStorage.getAppState<ServerCartCalculation>("cart_calculation");
        if (cachedCalc) {
          setServerCalculation(cachedCalc);
          return cachedCalc;
        }

        // Compute basic subtotal offline
        const offlineCalc: ServerCartCalculation = {
          subtotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
          discount: 0,
          shipping: 0,
          total: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
          promoApplied: null,
        };

        setServerCalculation(offlineCalc);
        await offlineStorage.setAppState("cart_calculation", offlineCalc);
        return offlineCalc;
      }

      // Online: validate with server
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

          // Cache the calculation for offline use
          await offlineStorage.setAppState("cart_calculation", data.cart);

          return data.cart;
        }
        return null;
      } catch {
        return null;
      } finally {
        setIsLoadingServer(false);
      }
    },
    [items, promoCode, networkOffline]
  );

  // Recalculate server price (debounced)
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

  // Cart operations
  const openCart = () => {
    setIsOpen(true);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

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
      (Array.isArray(product.images) &&
      product.images.length > 0 &&
      typeof product.images[0] === "string" &&
      product.images[0].trim() !== ""
        ? product.images[0]
        : "/editorial-craft.jpg");

    setItems((prev) => {
      const sanitized = prev.filter(
        (i) =>
          Boolean(i && i.productId && i.name && typeof i.price === "number" && i.quantity > 0)
      );

      const existingIdx = sanitized.findIndex(
        (i) => i.productId === product.id && i.size === size && i.color === color
      );

      if (existingIdx > -1) {
        const next = [...sanitized];
        next[existingIdx].quantity += Math.max(1, quantity);
        next[existingIdx].isPendingSync = networkOffline || !user?.id;
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
          lastSynced: networkOffline ? undefined : Date.now(),
          isPendingSync: networkOffline || !user?.id,
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

    // Reconciliation is handled by the save effect: online it calls
    // syncWithServer() (replace), offline the change is held locally and synced
    // automatically when connectivity returns. (No per-item server queue — a
    // bare delete payload to /api/cart would clear the whole cart.)
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
          return {
            ...item,
            quantity,
            isPendingSync: networkOffline || !user?.id,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setServerCalculation(null);
    setPromoCode("");
    setHasPendingSync(false);

    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}

    if (user) {
      // Clear IndexedDB
      storage.cart.set(user.id, { items: [], updatedAt: Date.now() });

      // Clear server cart if online
      if (!networkOffline) {
        fetch("/api/cart", { method: "DELETE" }).catch(() => {});
      }
    }
  };

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const getOfflineStatus = () => ({
    isOffline: networkOffline,
    pendingItems: items.filter(item => item.isPendingSync).length,
  });

  const value: CartContextType = {
    items,
    isOpen,
    isOffline: networkOffline,
    hasPendingSync,
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
    syncWithServer,
    getOfflineStatus,
  };

  // Publish on BOTH the enhanced cart context (used by `useEnhancedCart`) and
  // the original cart context (used by every pre-existing `useCart` consumer).
  // The enhanced value is a structural superset of the original type, so
  // existing consumers keep working unchanged while gaining offline support.
  return (
    <CartContext.Provider value={value}>
      <BaseCartContext.Provider value={value}>
        {children}
      </BaseCartContext.Provider>
    </CartContext.Provider>
  );
}

export function useEnhancedCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useEnhancedCart must be used within an EnhancedCartProvider");
  }
  return context;
}