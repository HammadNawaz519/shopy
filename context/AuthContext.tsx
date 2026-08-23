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
  refreshUser: () => Promise<void>;
}

const AUTH_STORAGE_KEY = "shopy_auth_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Optimistic initial hydration from localStorage for instant 0ms rendering
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(AUTH_STORAGE_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(AUTH_STORAGE_KEY);
        return !cached; // If cached user exists, don't block the UI
      } catch {
        return true;
      }
    }
    return true;
  });

  // Background silent revalidation with server
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
          } catch {}
        } else {
          setUser(null);
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {}
      }
    } catch {
      // Network hiccup: preserve optimistic state if present
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
      setUser(data.user);
      try {
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
        setUser(data.user);
        try {
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
      setUser(data.user);
      try {
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
      setUser(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setUser(null);
      try {
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
