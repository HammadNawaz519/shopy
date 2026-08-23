"use client";

import React from "react";
import Link from "next/link";
import { Menu, ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminNav } from "./AdminLayoutClient";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export default function AdminHeader({ title, subtitle, onOpenMobileMenu }: AdminHeaderProps) {
  const { user, logout } = useAuth();
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

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#BBBFCA] text-xs uppercase tracking-wider text-[#495464] hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Live Store</span>
        </Link>

        {/* Admin Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#BBBFCA]/40">
          <div className="w-8 h-8 rounded-full bg-[#495464] text-[#F4F4F2] flex items-center justify-center text-xs font-semibold">
            HN
          </div>
          <div className="hidden md:block text-left">
            <span className="text-xs font-medium text-[#495464] block leading-tight">
              {user?.name || "Hammad Nawaz"}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              Super Admin
            </span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="p-1.5 text-[#495464]/70 hover:text-[#495464] transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
