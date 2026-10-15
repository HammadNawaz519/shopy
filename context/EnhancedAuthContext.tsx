"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { offlineStorage, storage } from "@/lib/storage/indexedDB";
import { AuthContext as BaseAuthContext } from "@/context/AuthContext";

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
  isOffline: boolean;
  lastOnlineCheck: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresOtp?: boolean; user?: User; error?: string }>;
  verifyRegisterOtp: (email: string, otpCode: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  resendRegisterOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: (force?: boolean) => Promise<void>;
  checkConnectivity: () => Promise<boolean>;
  getCachedUserData: () => Promise<{ user: User | null; cachedAt: number }>;
}

// Storage keys
const AUTH_STORAGE_KEY = "shopy_auth_user";
const AUTH_CACHE_KEY = "shopy_auth_cache";
const LAST_SYNC_KEY = "shopy_auth_last_sync";

// In-flight request deduplication singleton & verification timestamp
let mePromise: Promise<User | null> | null = null;
let lastVerifiedTimestamp = 0;
const REVALIDATION_INTERVAL_MS = 60 * 1000; // 60s memory cache

// Network check configuration
const NETWORK_CHECK_INTERVAL = 30000; // 30 seconds
const OFFLINE_THRESHOLD = 10000; // 10 seconds without successful check

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastOnlineCheck, setLastOnlineCheck] = useState<number | null>(null);

  // Initialize offline storage with user ID
  useEffect(() => {
    if (user?.id) {
      offlineStorage.setUserId(user.id);
    } else {
      offlineStorage.setUserId(null);
    }
  }, [user?.id]);

  // Check connectivity periodically
  useEffect(() => {
    const checkConnectivity = async () => {
      const isOnline = await checkNetworkConnectivity();
      setIsOffline(!isOnline);
      setLastOnlineCheck(Date.now());
    };

    // Initial check
    checkConnectivity();

    // Periodic checks
    const interval = setInterval(checkConnectivity, NETWORK_CHECK_INTERVAL);

    // Listen for online/offline events
    window.addEventListener("online", checkConnectivity);
    window.addEventListener("offline", checkConnectivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnectivity);
      window.removeEventListener("offline", checkConnectivity);
    };
  }, []);

  // Hydrate user from multiple sources on mount (fast startup)
  useEffect(() => {
    const hydrateUser = async () => {
      setLoading(true);

      try {
        // 1. Try memory cache first (fastest)
        if (lastVerifiedTimestamp > 0 && Date.now() - lastVerifiedTimestamp < REVALIDATION_INTERVAL_MS) {
          const cached = localStorage.getItem(AUTH_STORAGE_KEY);
          if (cached) {
            const parsedUser = JSON.parse(cached);
            setUser(parsedUser);
            offlineStorage.setUserId(parsedUser.id);
            setLoading(false);
            return;
          }
        }

        // 2. Try IndexedDB cache (fast)
        const cachedData = await getCachedUserData();
        if (cachedData.user) {
          setUser(cachedData.user);
          offlineStorage.setUserId(cachedData.user.id);

          // Check if cache is fresh (less than 5 minutes old)
          const cacheAge = Date.now() - cachedData.cachedAt;
          if (cacheAge < 5 * 60 * 1000) {
            setLoading(false);

            // Validate in background
            setTimeout(() => {
              refreshUser(true).catch(() => {});
            }, 1000);
            return;
          }
        }

        // 3. Check client auth cookie marker (fast)
        if (typeof document !== "undefined") {
          const hasClientAuth = document.cookie.includes("shopy_client_auth=1");
          const hasCached = Boolean(localStorage.getItem(AUTH_STORAGE_KEY));

          if (!hasClientAuth && !hasCached) {
            // No auth markers at all - definitely not logged in
            lastVerifiedTimestamp = Date.now();
            setUser(null);
            setLoading(false);
            return;
          }
        }

        // 4. Full validation with server (slowest, but authoritative)
        await refreshUser();
      } catch (error) {
        console.error("[Auth] Hydration error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, []);

  // Network connectivity check
  const checkNetworkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Quick HEAD request to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("/api/auth/me", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Get cached user data from IndexedDB
  const getCachedUserData = useCallback(async (): Promise<{ user: User | null; cachedAt: number }> => {
    try {
      const cached = (await storage.auth.get()) as
        | { user: User | null; cachedAt: number }
        | null;
      if (cached) {
        return {
          user: cached.user,
          cachedAt: cached.cachedAt || Date.now(),
        };
      }
    } catch (error) {
      console.warn("[Auth] Failed to read from IndexedDB:", error);
    }

    // Fallback to localStorage
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          user: parsed.user,
          cachedAt: parsed.cachedAt || Date.now(),
        };
      }
    } catch (error) {
      console.warn("[Auth] Failed to read from localStorage:", error);
    }

    return { user: null, cachedAt: 0 };
  }, []);

  // Cache user data to IndexedDB and localStorage
  const cacheUserData = useCallback(async (userData: User | null) => {
    const cacheData = {
      user: userData,
      cachedAt: Date.now(),
    };

    try {
      // Cache in IndexedDB (primary)
      await storage.auth.set(cacheData);

      // Also cache in localStorage for fast fallback
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));

      if (userData) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("[Auth] Failed to cache user data:", error);
    }
  }, []);

  // Clear all cached auth data
  const clearAuthCache = useCallback(async () => {
    try {
      await storage.auth.set(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    } catch (error) {
      console.warn("[Auth] Failed to clear cache:", error);
    }
  }, []);

  // Deduplicated background session validation with server
  const refreshUser = useCallback(async (force: boolean = false) => {
    const now = Date.now();

    // Skip if recently validated (unless forced)
    if (!force && lastVerifiedTimestamp > 0 && now - lastVerifiedTimestamp < REVALIDATION_INTERVAL_MS) {
      setLoading(false);
      return;
    }

    // Guest optimization: if no auth markers exist, avoid network request
    if (!force && typeof document !== "undefined") {
      const hasClientAuth = document.cookie.includes("shopy_client_auth=1");
      const hasCached = Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
      if (!hasClientAuth && !hasCached) {
        lastVerifiedTimestamp = now;
        setUser(null);
        await cacheUserData(null);
        setLoading(false);
        return;
      }
    }

    // Deduplicate in-flight requests
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
        // Validate with the server in ONE bounded request instead of the old
        // HEAD-then-GET waterfall (2 RTTs at every launch). The catch below
        // already degrades to the cached/offline path when the network is
        // down or black-holed, and the abort timeout bounds the wait so a
        // stalled network can never hang session hydration.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch("/api/auth/me", {
          headers: {
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          lastVerifiedTimestamp = Date.now();

          if (data.user) {
            // Update client-side auth markers
            try {
              document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
            } catch {}

            // Cache user data
            await cacheUserData(data.user);

            return data.user as User;
          }
        }

        // No valid session
        lastVerifiedTimestamp = now;
        await clearAuthCache();
        return null;
      } catch (error) {
        console.warn("[Auth] Session validation failed:", error);

        // Network error - use cached data if available
        if (!force) {
          const cached = await getCachedUserData();
          if (cached.user) {
            console.log("[Auth] Using cached user data (network error)");
            return cached.user;
          }
        }

        return null;
      } finally {
        mePromise = null;
      }
    })();

    try {
      const verifiedUser = await mePromise;
      setUser(verifiedUser);
      offlineStorage.setUserId(verifiedUser?.id || null);
    } finally {
      setLoading(false);
    }
  }, [getCachedUserData, cacheUserData, clearAuthCache]);

  // Login function
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
      offlineStorage.setUserId(data.user.id);

      // Update client markers
      try {
        document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
      } catch {}

      // Cache user data
      await cacheUserData(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error("[Auth] Login error:", error);
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
        offlineStorage.setUserId(data.user.id);

        try {
          document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
        } catch {}

        await cacheUserData(data.user);
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
      offlineStorage.setUserId(data.user.id);

      try {
        document.cookie = "shopy_client_auth=1; path=/; max-age=2592000; SameSite=Lax";
      } catch {}

      await cacheUserData(data.user);

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
      offlineStorage.setUserId(null);

      // Clear all auth data
      await clearAuthCache();

      try {
        document.cookie = "shopy_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch {}

      // Clear user-specific indexedDB data
      if (user?.id) {
        await offlineStorage.clearUserData(user.id);
      }

      // Call server logout
      await fetch("/api/auth/logout", { method: "POST" });

      // Redirect to home
      window.location.href = "/";
    } catch {
      // Fallback cleanup
      setUser(null);
      offlineStorage.setUserId(null);

      try {
        document.cookie = "shopy_client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_CACHE_KEY);
      } catch {}

      window.location.href = "/";
    }
  };

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    const isOnline = await checkNetworkConnectivity();
    setIsOffline(!isOnline);
    setLastOnlineCheck(Date.now());
    return isOnline;
  }, [checkNetworkConnectivity]);

  const value: AuthContextType = {
    user,
    loading,
    isOffline,
    lastOnlineCheck,
    login,
    register,
    verifyRegisterOtp,
    resendRegisterOtp,
    logout,
    refreshUser,
    checkConnectivity,
    getCachedUserData,
  };

  // Publish on BOTH the enhanced context (used by `useEnhancedAuth`) and the
  // original context (used by every pre-existing `useAuth` consumer). The
  // enhanced value is a structural superset of the original type, so the
  // original consumers resolve to the enhanced, offline-aware implementation
  // with zero changes to their call sites.
  return (
    <AuthContext.Provider value={value}>
      <BaseAuthContext.Provider value={value}>
        {children}
      </BaseAuthContext.Provider>
    </AuthContext.Provider>
  );
}

export function useEnhancedAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useEnhancedAuth must be used within an EnhancedAuthProvider");
  }
  return context;
}