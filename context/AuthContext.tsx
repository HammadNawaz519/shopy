"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresOtp?: boolean; user?: User; error?: string }>;
  verifyRegisterOtp: (email: string, otpCode: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  resendRegisterOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: (force?: boolean) => Promise<void>;
}

const AUTH_STORAGE_KEY = "shopy_auth_user";

// In-flight request deduplication singleton & verification timestamp
let mePromise: Promise<User | null> | null = null;
let lastVerifiedTimestamp = 0;
const REVALIDATION_INTERVAL_MS = 60 * 1000; // 60s memory cache to prevent redundant edge requests

// Exported so enhanced/alternate providers can publish values on the same
// context object, keeping every existing `useAuth()` consumer working.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hydrate user from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}
  }, []);

  // Deduplicated background session validation with server
  const refreshUser = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    if (!force && lastVerifiedTimestamp > 0 && now - lastVerifiedTimestamp < REVALIDATION_INTERVAL_MS) {
      setLoading(false);
      return;
    }

    // Guest optimization: if no auth marker cookie exists and no cached user in storage, avoid network request
    if (!force && typeof document !== "undefined") {
      const hasClientAuth = document.cookie.includes("shopy_client_auth=1");
      const hasCached = Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
      if (!hasClientAuth && !hasCached) {
        lastVerifiedTimestamp = now;
        setUser(null);
        setLoading(false);
        return;
      }
    }

    if (mePromise) {
      try {
        const u = await mePromise;
        setUser(u);
      } finally {
        setLoading(false);
      }
      return;
    }

    mePromise = (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          lastVerifiedTimestamp = Date.now();
          if (data.user) {
            try {
              document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
            } catch {}
            return data.user as User;
          }
        }
        lastVerifiedTimestamp = Date.now();
        try {
          document.cookie = "shopy_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {}
        return null;
      } catch {
        return null;
      } finally {
        mePromise = null;
      }
    })();

    try {
      const verifiedUser = await mePromise;
      setUser(verifiedUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Login failed" };
      }
      lastVerifiedTimestamp = Date.now();
      setUser(data.user);
      try {
        document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      } catch {}
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      if (data.requiresOtp) {
        return { success: true, requiresOtp: true };
      }
      if (data.user) {
        lastVerifiedTimestamp = Date.now();
        setUser(data.user);
        try {
          document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        } catch {}
      }
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const verifyRegisterOtp = async (email: string, otpCode: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode, action: "verify" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Verification failed" };
      }
      lastVerifiedTimestamp = Date.now();
      setUser(data.user);
      try {
        document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      } catch {}
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const resendRegisterOtp = async (email: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "resend" }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to resend code" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      lastVerifiedTimestamp = 0;
      setUser(null);
      try {
        document.cookie = "shopy_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setUser(null);
      try {
        document.cookie = "shopy_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyRegisterOtp,
        resendRegisterOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
