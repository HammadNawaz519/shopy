"use client";

import React from "react";
import { Menu } from "lucide-react";
import { useAdminNav } from "./AdminLayoutClient";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export default function AdminHeader({ title, subtitle, onOpenMobileMenu }: AdminHeaderProps) {
  const { openMobileMenu } = useAdminNav();

  const handleToggle = onOpenMobileMenu || openMobileMenu;

  return (
    <header className="h-16 bg-[#F4F4F2] border-b border-[#BBBFCA]/40 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="lg:hidden p-1.5 text-[#495464] hover:bg-[#E8E8E8] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-serif text-lg sm:text-xl font-medium text-[#495464] tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] uppercase tracking-widest text-[#495464]/60 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side is intentionally left clean as profile & live store shortcuts are in the sidebar */}
    </header>
  );
}
