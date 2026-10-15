"use client";

import React, { createContext, useContext, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { AdminOrderNotificationProvider } from "@/context/AdminOrderNotificationContext";

interface AdminNavContextType {
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  isMobileOpen: boolean;
}

const AdminNavContext = createContext<AdminNavContextType>({
  openMobileMenu: () => {},
  closeMobileMenu: () => {},
  isMobileOpen: false,
});

export function useAdminNav() {
  return useContext(AdminNavContext);
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminOrderNotificationProvider>
      <AdminNavContext.Provider
        value={{
          openMobileMenu: () => setMobileOpen(true),
          closeMobileMenu: () => setMobileOpen(false),
          isMobileOpen: mobileOpen,
        }}
      >
        <div
          className="min-h-screen bg-[#E8E8E8]/40 text-[#495464] flex"
          style={{ marginTop: "calc(-1 * env(safe-area-inset-top, 0px))" }}
        >
          {/* Sidebar */}
          <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">{children}</div>
        </div>
      </AdminNavContext.Provider>
    </AdminOrderNotificationProvider>
  );
}
