/**
 * Instant-launch shell providers.
 *
 * The real app's layout wires `EnhancedAuthProvider` + `EnhancedCartProvider`
 * on top of the base contexts. Those enhanced providers perform session
 * validation, cart synchronization, connectivity polling and IndexedDB
 * hydration — none of which may delay the first landing frame.
 *
 * Both base context modules export their context object specifically so an
 * alternate provider can publish values on the same context (the comment in
 * context/CartContext.tsx documents this contract). The shell therefore
 * supplies *slim* providers: the landing components consume exactly
 * `user` / `totalCount` / `openCart` and never block.
 *
 * Everything private — real session, personal cart, checkout — is restored
 * the moment any navigation lands in the live application, where the
 * unmodified real providers take over with the app's session cookies and
 * Supabase storage.
 */
import React from "react";
import { AuthContext, type User } from "@/context/AuthContext";
import {
  CartContext,
  type CartItem,
  type ServerCartCalculation,
} from "@/context/CartContext";
import type { Product } from "@/lib/data/products";
import { remotePath } from "./constants";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function navigateToLiveApp(path = "/") {
  window.location.assign(remotePath(path));
}

const DECLINED = { success: false as const };

export function ShellAuthProvider({ children }: { children: React.ReactNode }) {
  // The session belongs to the live app origin (HttpOnly cookie + Supabase
  // storage there). The shell renders the anonymous view of the navbar; the
  // user's identity and role reappear automatically on handoff.
  const user: User | null = null;
  const value = React.useMemo(
    () => ({
      user,
      loading: false,
      login: async (_email?: string, _password?: string) => ({
        ...DECLINED,
        error: "Sign in in the SHOPY app.",
      }),
      register: async (_name?: string, _email?: string, _password?: string) => ({
        ...DECLINED,
        error: "Create an account in the SHOPY app.",
      }),
      verifyRegisterOtp: async (_email?: string, _otpCode?: string) => DECLINED,
      resendRegisterOtp: async (_email?: string) => DECLINED,
      logout: async () => {
        navigateToLiveApp("/");
      },
      refreshUser: async (_force?: boolean) => {},
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

const EMPTY_ITEMS: CartItem[] = [];

export function ShellCartProvider({ children }: { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({
      items: EMPTY_ITEMS,
      isOpen: false,
      openCart: () => {
        // Hand the bag to the live app, where the personal cart, promo
        // codes and checkout all live.
        navigateToLiveApp("/cart");
      },
      closeCart: () => {},
      addItem: (
        product: Product,
        _size: string,
        _color: string,
        _quantity?: number,
        _customImage?: string
      ) => {
        // Quick-add from the landing product cards: open the live product
        // page so sizing/colour/quantity and the bag work in the real app.
        navigateToLiveApp(`/product/${product?.id ?? ""}`);
      },
      removeItem: (_productId: string, _size: string, _color: string) => {},
      updateQuantity: (
        _productId: string,
        _size: string,
        _color: string,
        _quantity: number
      ) => {},
      clearCart: () => {},
      totalCount: 0,
      subtotal: 0,
      promoCode: "",
      setPromoCode: (_code: string) => {},
      serverCalculation: null as ServerCartCalculation | null,
      validateWithServer: async (_promo?: string) => null,
      isLoadingServer: false,
    }),
    []
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
