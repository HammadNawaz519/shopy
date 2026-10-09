"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MobileMenu from "@/components/layout/MobileMenu";
import SearchModal from "@/components/search/SearchModal";

let cachedNavItems: Array<{ name: string; href: string }> | null = null;

// Defensive deduplication helper to ensure no duplicate links, and remove about/contact/accessories
const EXCLUDED_NAMES = new Set(["about", "contact", "accessories"]);
const EXCLUDED_HREFS = new Set(["/about", "/contact", "/collections/accessories"]);

function deduplicateLinks(items: Array<{ name: string; href: string }>): Array<{ name: string; href: string }> {
  if (!Array.isArray(items)) return [];
  const seenHrefs = new Set<string>();
  const seenNames = new Set<string>();
  const result: Array<{ name: string; href: string }> = [];

  for (const item of items) {
    if (!item || !item.name || !item.href) continue;
    const normHref = item.href.trim().toLowerCase().replace(/\/+$/, "") || "/";
    const normName = item.name.trim().toLowerCase();

    // Remove about, contact, and accessories from navigation
    if (EXCLUDED_NAMES.has(normName) || EXCLUDED_HREFS.has(normHref)) {
      continue;
    }

    if (seenHrefs.has(normHref) || seenNames.has(normName)) {
      continue;
    }

    seenHrefs.add(normHref);
    seenNames.add(normName);
    result.push({
      name: item.name.trim(),
      href: item.href.trim(),
    });
  }

  return result;
}

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const { user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const [navItems, setNavItems] = useState<Array<{ name: string; href: string }>>([
    { name: "home", href: "/" },
    { name: "view all", href: "/products" },
    { name: "tops", href: "/collections/tops" },
    { name: "bottoms", href: "/collections/bottoms" },
    { name: "co-ord sets", href: "/collections/co-ord-sets" },
    { name: "footwear", href: "/collections/footwear" },
    { name: "fragrances", href: "/collections/fragrances" },
    { name: "collections", href: "/collections" },
  ]);

  useEffect(() => {
    // Purge legacy storage items
    try {
      sessionStorage.removeItem("shopy_nav");
      sessionStorage.removeItem("shopy_nav_v2");
      sessionStorage.removeItem("shopy_nav_v3");
    } catch {}

    if (cachedNavItems) {
      setNavItems(cachedNavItems);
      return;
    }

    try {
      const stored = sessionStorage.getItem("shopy_nav_v4");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deduplicated = deduplicateLinks(parsed);
          cachedNavItems = deduplicated;
          setNavItems(deduplicated);
          return;
        }
      }
    } catch {}

    let isMounted = true;
    const fetchNav = async () => {
      try {
        const res = await fetch("/api/navigation");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.navigation)) {
            const mapped = data.navigation.map((i: any) => ({ name: i.name, href: i.href }));
            const deduplicated = deduplicateLinks(mapped);
            cachedNavItems = deduplicated;
            try {
              sessionStorage.setItem("shopy_nav_v4", JSON.stringify(deduplicated));
            } catch {}
            setNavItems(deduplicated);
          }
        }
      } catch {}
    };
    fetchNav();
    return () => {
      isMounted = false;
    };
  }, []);

  // Do NOT render customer navbar on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = deduplicateLinks(navItems);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 select-none text-[#495464] pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1720px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          {/* Left: Mobile Toggle & Mobile Logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4 stroke-[1.5]" />
            </button>
            <Link
              href="/"
              className="font-serif tracking-[0.3em] text-lg font-light text-[#495464]"
            >
              SHOPY
            </Link>
          </div>

          {/* Left Group: Logo + Navigation Links Moved Left */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            <Link
              href="/"
              className="font-serif tracking-[0.35em] text-xl lg:text-2xl font-light transition-colors whitespace-nowrap text-[#495464]"
            >
              SHOPY
            </Link>

            {/* Desktop Navigation Links — Small, lowercase, non-wrapping, clean tracking */}
            <nav className="flex items-center space-x-5 xl:space-x-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={`${link.name}-${link.href}`}
                    href={link.href}
                    className={`text-[12px] font-normal tracking-wider lowercase whitespace-nowrap transition-all duration-300 relative py-1 ${
                      isActive
                        ? "text-[#495464] font-medium after:w-full"
                        : "text-[#495464]/80 hover:text-[#495464] after:w-0"
                    } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-current after:transition-all after:duration-300 hover:after:w-full`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Far Right Action Icons (Search, Account, Bag) */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Search */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-1.5 text-[12px] font-normal tracking-wide lowercase hover:opacity-60 transition-opacity whitespace-nowrap"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">search</span>
            </button>

            {/* Account */}
            <Link
              href={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
              className="flex items-center gap-1.5 text-[12px] font-normal tracking-wide lowercase hover:opacity-60 transition-opacity whitespace-nowrap"
              aria-label="Account"
            >
              <User className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">
                {user ? (user.role === "admin" ? "admin" : user.name.split(" ")[0].toLowerCase()) : "account"}
              </span>
            </Link>

            {/* Bag */}
            <button
              onClick={openCart}
              className="flex items-center gap-1.5 text-[12px] font-normal tracking-wide lowercase hover:opacity-60 transition-opacity relative whitespace-nowrap"
              aria-label="Shopping Bag"
            >
              <div className="relative">
                <ShoppingBag className="w-3.5 h-3.5 stroke-[1.5]" />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full text-[8px] font-medium flex items-center justify-center transition-colors bg-[#495464] text-[#F4F4F2]">
                    {totalCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">bag</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        onOpenSearch={() => {
          setMobileMenuOpen(false);
          setSearchModalOpen(true);
        }}
      />

      {/* Live Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

