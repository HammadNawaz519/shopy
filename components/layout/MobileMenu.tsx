"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Search, User, ArrowRight, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ name: string; href: string }>;
  onOpenSearch: () => void;
}

const EXCLUDED_NAMES = new Set(["about", "contact", "accessories"]);
const EXCLUDED_HREFS = new Set(["/about", "/contact", "/collections/accessories"]);

export default function MobileMenu({
  isOpen,
  onClose,
  navLinks,
  onOpenSearch,
}: MobileMenuProps) {
  const { user } = useAuth();

  const filteredLinks = (navLinks || []).filter(
    (link) =>
      link &&
      !EXCLUDED_NAMES.has((link.name || "").trim().toLowerCase()) &&
      !EXCLUDED_HREFS.has((link.href || "").trim().toLowerCase().replace(/\/+$/, "") || "/")
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#F4F4F2] text-[#495464] h-full flex flex-col justify-between px-8 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] z-10 shadow-2xl animate-slideLeft overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#BBBFCA]/30">
            <Link href="/" onClick={onClose} className="font-serif text-xl tracking-[0.35em] font-light">
              SHOPY
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 text-[#495464] hover:opacity-70 transition-opacity"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Quick Search Button */}
          <div className="mt-6">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between bg-[#E8E8E8] border border-[#BBBFCA]/40 px-4 py-3 text-[11px] tracking-[0.2em] uppercase text-[#495464]/80 font-light"
            >
              <span className="flex items-center gap-2.5">
                <Search className="w-3.5 h-3.5 stroke-[1.5]" />
                Search Catalogue...
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="mt-8 flex flex-col space-y-2">
            {filteredLinks.map((link) => (
              <Link
                key={`${link.name}-${link.href}`}
                href={link.href}
                onClick={onClose}
                className="group flex items-center justify-between text-xs tracking-[0.22em] uppercase font-light py-3 border-b border-[#BBBFCA]/15 hover:text-black transition-colors"
              >
                <span>{link.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#495464]" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="pt-6 border-t border-[#BBBFCA]/30 space-y-4">
          <Link
            href="https://github.com/HammadNawaz519/shopy/releases/download/Shopy/shopy.apk"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between w-full text-xs tracking-[0.2em] uppercase font-light text-[#495464] hover:text-black transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Smartphone className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Download App</span>
            </span>
            <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 bg-[#E8E8E8] text-[#495464]">
              APK
            </span>
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            onClick={onClose}
            className="flex items-center gap-2.5 text-xs tracking-[0.2em] uppercase font-light text-[#495464]"
          >
            <User className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>{user ? `Account (${user.name})` : "Sign In / Register"}</span>
          </Link>

          <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-[#495464]/60">
            <span>PAKISTAN / PKR</span>
            <span>© 2026 SHOPY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

