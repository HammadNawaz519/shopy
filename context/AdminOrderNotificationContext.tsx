"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export interface UnseenOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
}

interface AdminOrderNotificationContextType {
  unseenCount: number;
  unseenOrders: UnseenOrderSummary[];
  markAllAsSeen: () => void;
  refreshUnseen: () => Promise<void>;
}

const STORAGE_KEY_LAST_SEEN = "shopy_admin_last_seen_order_at";
const STORAGE_KEY_LAST_SEEN_ID = "shopy_admin_last_seen_order_id";
const BROADCAST_CHANNEL_NAME = "shopy_admin_orders_channel";

const AdminOrderNotificationContext = createContext<AdminOrderNotificationContextType>({
  unseenCount: 0,
  unseenOrders: [],
  markAllAsSeen: () => {},
  refreshUnseen: async () => {},
});

export function useAdminOrderNotification() {
  return useContext(AdminOrderNotificationContext);
}

export function AdminOrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unseenCount, setUnseenCount] = useState<number>(0);
  const [unseenOrders, setUnseenOrders] = useState<UnseenOrderSummary[]>([]);
  
  // Ref to track latest seen timestamp & ID without causing re-renders
  const lastSeenRef = useRef<string | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const isOnOrdersPage = pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");

  // 1. Mark All Orders as Seen
  const markAllAsSeen = useCallback(() => {
    const nowIso = new Date().toISOString();
    lastSeenRef.current = nowIso;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SEEN, nowIso);
    } catch {}

    setUnseenCount(0);
    setUnseenOrders([]);

    // Broadcast cross-tab synchronization
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: "ORDERS_MARKED_SEEN", timestamp: nowIso });
      } catch {}
    }
  }, []);

  // 2. Fetch Unseen Orders from Server
  const fetchUnseenOrders = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      let currentLastSeen = lastSeenRef.current;
      let currentLastSeenId = lastSeenIdRef.current;

      if ((!currentLastSeen || !currentLastSeenId) && typeof window !== "undefined") {
        currentLastSeen = currentLastSeen || localStorage.getItem(STORAGE_KEY_LAST_SEEN);
        currentLastSeenId = currentLastSeenId || localStorage.getItem(STORAGE_KEY_LAST_SEEN_ID);
        lastSeenRef.current = currentLastSeen;
        lastSeenIdRef.current = currentLastSeenId;
      }

      const params = new URLSearchParams();
      if (currentLastSeen) params.set("after", currentLastSeen);
      if (currentLastSeenId) params.set("afterId", currentLastSeenId);

      const url = `/api/admin/orders/unseen?${params.toString()}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();

      if (!currentLastSeen && data.latestTimestamp) {
        // Initial setup: anchor to the latest existing order timestamp so old orders are not counted
        lastSeenRef.current = data.latestTimestamp;
        lastSeenIdRef.current = data.latestId || null;
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SEEN, data.latestTimestamp);
          if (data.latestId) localStorage.setItem(STORAGE_KEY_LAST_SEEN_ID, data.latestId);
        } catch {}
        setUnseenCount(0);
        setUnseenOrders([]);
        return;
      }

      if (data.orders && Array.isArray(data.orders)) {
        if (isOnOrdersPage) {
          // If the admin is actively viewing the Orders section, immediately treat incoming orders as seen
          if (data.orders.length > 0) {
            const latestIso = data.latestTimestamp || new Date().toISOString();
            const latestId = data.latestId || data.orders[0]?.id || null;
            lastSeenRef.current = latestIso;
            lastSeenIdRef.current = latestId;
            try {
              localStorage.setItem(STORAGE_KEY_LAST_SEEN, latestIso);
              if (latestId) localStorage.setItem(STORAGE_KEY_LAST_SEEN_ID, latestId);
            } catch {}
          }
          setUnseenCount(0);
          setUnseenOrders([]);
        } else {
          // Deduplicate and set unseen orders
          const uniqueOrders: UnseenOrderSummary[] = [];
          const seenIds = new Set<string>();

          for (const order of data.orders) {
            if (!seenIds.has(order.id)) {
              seenIds.add(order.id);
              uniqueOrders.push(order);
            }
          }

          setUnseenCount(uniqueOrders.length);
          setUnseenOrders(uniqueOrders);
        }
      }
    } catch (err) {
      console.error("[ADMIN NOTIFICATION FETCH ERROR]", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [isOnOrdersPage]);

  // 3. Initialize & Route Tracking
  useEffect(() => {
    // Setup BroadcastChannel for cross-tab sync
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data?.type === "ORDERS_MARKED_SEEN") {
            lastSeenRef.current = event.data.timestamp;
            setUnseenCount(0);
            setUnseenOrders([]);
          } else if (event.data?.type === "NEW_ORDER_ARRIVED") {
            fetchUnseenOrders();
          }
        };
      } catch {}
    }

    // Storage event fallback for older browsers
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LAST_SEEN) {
        lastSeenRef.current = e.newValue;
        if (e.newValue) {
          fetchUnseenOrders();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [fetchUnseenOrders]);

  // 4. Handle Navigation to/from Orders Page
  useEffect(() => {
    if (isOnOrdersPage) {
      markAllAsSeen();
    } else {
      fetchUnseenOrders();
    }
  }, [pathname, isOnOrdersPage, markAllAsSeen, fetchUnseenOrders]);

  // 5. Periodic Realtime Polling & Window Focus Trigger
  useEffect(() => {
    // Initial fetch
    fetchUnseenOrders();

    // Background interval check every 8 seconds
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchUnseenOrders();
      }
    }, 8000);

    // Focus listener: immediate check when admin returns to tab
    const handleFocus = () => {
      fetchUnseenOrders();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUnseenOrders]);

  return (
    <AdminOrderNotificationContext.Provider
      value={{
        unseenCount,
        unseenOrders,
        markAllAsSeen,
        refreshUnseen: fetchUnseenOrders,
      }}
    >
      {children}
    </AdminOrderNotificationContext.Provider>
  );
}
