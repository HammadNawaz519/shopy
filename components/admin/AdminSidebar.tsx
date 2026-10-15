"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  FolderTree,
  Compass,
  Layers,
  Boxes,
  Users,
  Percent,
  Star,
  TrendingUp,
  Settings,
  ExternalLink,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminOrderNotification } from "@/context/AdminOrderNotificationContext";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Tag },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Navigation", href: "/admin/navigation", icon: Compass },
  { name: "Homepage", href: "/admin/homepage", icon: Layers },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Discounts", href: "/admin/discounts", icon: Percent },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { unseenCount } = useAdminOrderNotification();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#181A1D] text-[#F4F4F2] border-r border-[#495464]/40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#495464]/40 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-[#495464] px-2.5 py-1 text-xs font-serif font-semibold tracking-widest text-[#F4F4F2]">
            ADMIN
          </div>
          <span className="font-serif text-xl tracking-[0.25em] font-light text-[#F4F4F2]">
            SHOPY
          </span>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-[#BBBFCA] hover:text-[#F4F4F2]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#BBBFCA]/60">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={false}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${isActive
                  ? "bg-[#495464] text-[#F4F4F2] font-semibold border-l-2 border-[#F4F4F2]"
                  : "text-[#BBBFCA] hover:bg-[#495464]/30 hover:text-[#F4F4F2]"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.name === "Orders" && unseenCount > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[19px] h-4.5 px-1.5 text-[10px] font-bold font-mono tracking-tight bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/60 rounded-full shadow-xs transition-all duration-300 transform scale-100 animate-fadeIn"
                  title={`${unseenCount} new unseen ${unseenCount === 1 ? "order" : "orders"}`}
                >
                  {unseenCount > 99 ? "99+" : unseenCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Shortcuts */}
      <div className="p-4 border-t border-[#495464]/40 space-y-2 text-xs">
        <Link
          href="/"
          target="_blank"
          prefetch={false}
          className="flex items-center justify-between px-3 py-2 text-[#BBBFCA] hover:text-[#F4F4F2] hover:bg-[#495464]/20 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#BBBFCA]/60">View</span>
        </Link>

        <div className="pt-2 flex items-center justify-between px-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#F4F4F2] truncate">{user?.name || "Admin"}</p>
            <p className="text-[9px] text-[#BBBFCA]/60 truncate">{user?.email || "hammadnawaz276@gmail.com"}</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-[#BBBFCA] hover:text-red-400 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block w-64 sticky flex-shrink-0 z-30"
        style={{
          top: "env(safe-area-inset-top, 0px)",
          height: "calc(100vh - env(safe-area-inset-top, 0px))",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 z-50 lg:hidden flex"
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 h-full z-10 animate-slideLeft">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
