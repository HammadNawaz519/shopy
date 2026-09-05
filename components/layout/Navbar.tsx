"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MobileMenu from "@/components/layout/MobileMenu";
import SearchModal from "@/components/search/SearchModal";

export interface NavItem {
  name: string;
  href: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Shop All", href: "/products" },
  { name: "Tops", href: "/collections/tops" },
  { name: "Bottoms", href: "/collections/bottoms" },
  { name: "Co-Ord Sets", href: "/collections/co-ord-sets" },
  { name: "Footwear", href: "/collections/footwear" },
  { name: "Fragrances", href: "/collections/fragrances" },
  { name: "Accessories", href: "/collections/accessories" },
  { name: "Collections", href: "/collections" },
];

/**
 * Deduplicate and sanitize navigation items to prevent duplicate headings/links.
 */
export function deduplicateNavLinks(items: NavItem[]): NavItem[] {
  if (!Array.isArray(items)) return DEFAULT_NAV_ITEMS;

  const seenHrefs = new Set<string>();
  const seenNames = new Set<string>();
  const deduplicated: NavItem[] = [];

  for (const item of items) {
    if (!item || typeof item.name !== "string" || typeof item.href !== "string") continue;
    const trimmedName = item.name.trim();
    const trimmedHref = item.href.trim();
    if (!trimmedName || !trimmedHref) continue;

    // Normalize href (remove trailing slashes, lowercase)
    const normHref = trimmedHref.toLowerCase().replace(/\/+$/, "") || "/";
    const normName = trimmedName.toLowerCase();

    // Skip redundant "Home" link in the top nav bar (Brand logo links to /)
    if (normHref === "/" && (normName === "home" || normName === "shopy")) {
      continue;
    }

    // Skip if href is duplicate (e.g. "view all" and "Shop All" pointing to /products)
    if (seenHrefs.has(normHref)) {
      continue;
    }

    // Skip if name is duplicate (case-insensitive)
    if (seenNames.has(normName)) {
      continue;
    }

    seenHrefs.add(normHref);
    seenNames.add(normName);

    // Format clean display name
    let displayName = trimmedName;
    if (normName === "view all" || normName === "all products" || normName === "shop all") {
      displayName = "Shop All";
    } else if (normName === "co-ord sets" || normName === "coord sets") {
      displayName = "Co-Ord Sets";
    } else if (displayName === displayName.toLowerCase()) {
      // Capitalize first letter of each word
      displayName = displayName.replace(/\b\w/g, (char) => char.toUpperCase());
    }

    deduplicated.push({
      name: displayName,
      href: trimmedHref,
    });
  }

  return deduplicated.length > 0 ? deduplicated : DEFAULT_NAV_ITEMS;
}

let cachedNavItems: NavItem[] | null = null;

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const { user } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [rawNavItems, setRawNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);

  const isHome = pathname === "/";

  // Deduplicated navigation list guaranteed to have zero duplicate hrefs or labels
  const navLinks = useMemo(() => deduplicateNavLinks(rawNavItems), [rawNavItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Clear legacy un-deduplicated sessionStorage cache
    try {
      sessionStorage.removeItem("shopy_nav");
    } catch {}

    if (cachedNavItems && cachedNavItems.length > 0) {
      setRawNavItems(cachedNavItems);
      return;
    }

    try {
      const stored = sessionStorage.getItem("shopy_nav_v3");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = deduplicateNavLinks(parsed);
          cachedNavItems = clean;
          setRawNavItems(clean);
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
            const mapped: NavItem[] = data.navigation.map((i: any) => ({
              name: i.name,
              href: i.href,
            }));
            const clean = deduplicateNavLinks(mapped);
            cachedNavItems = clean;
            try {
              sessionStorage.setItem("shopy_nav_v3", JSON.stringify(clean));
            } catch {}
            setRawNavItems(clean);
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

  const isTransparent = isHome && !isScrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 select-none ${
          isTransparent
            ? "bg-gradient-to-b from-black/65 via-black/25 to-transparent text-white"
            : "bg-[#F4F4F2]/95 backdrop-blur-md text-[#495464] border-b border-[#BBBFCA]/40 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
        }`}
      >
        <div className="max-w-[1720px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-6">
          {/* Left: Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 hover:opacity-70 transition-opacity"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>
            <Link
              href="/"
              prefetch={false}
              className={`font-serif tracking-[0.35em] text-xl lg:text-2xl font-light whitespace-nowrap transition-colors ${
                isTransparent ? "text-white hover:text-white/90" : "text-[#495464] hover:text-[#181a1d]"
              }`}
            >
              SHOPY
            </Link>
          </div>

          {/* Center / Desktop Navigation Links (Deduplicated & Cleanly Spaced) */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 overflow-hidden">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={`${link.name}-${link.href}`}
                  href={link.href}
                  prefetch={false}
                  className={`text-[11px] font-medium tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-300 relative py-1 ${
                    isActive
                      ? isTransparent
                        ? "text-white font-semibold after:w-full"
                        : "text-[#495464] font-semibold after:w-full"
                      : isTransparent
                      ? "text-white/80 hover:text-white after:w-0"
                      : "text-[#495464]/80 hover:text-[#495464] after:w-0"
                  } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-current after:transition-all after:duration-300 hover:after:w-full`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Sleek Minimal Action Icons (Search, Account, Bag) */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 hover:opacity-60 transition-opacity rounded-xs"
              title="Search Catalogue"
              aria-label="Search"
            >
              <Search className="w-4 h-4 stroke-[1.5]" />
            </button>

            {/* Account */}
            <Link
              href={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
              prefetch={false}
              className="p-2 hover:opacity-60 transition-opacity relative rounded-xs"
              title={user ? `Account (${user.name})` : "Account"}
              aria-label="Account"
            >
              <User className="w-4 h-4 stroke-[1.5]" />
              {user && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-[#F4F4F2]" />
              )}
            </Link>

            {/* Shopping Bag */}
            <button
              onClick={openCart}
              className="p-2 hover:opacity-60 transition-opacity relative rounded-xs"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                {totalCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full text-[8px] font-semibold flex items-center justify-center transition-colors shadow-xs ${
                      isTransparent
                        ? "bg-white text-[#495464]"
                        : "bg-[#495464] text-[#F4F4F2]"
                    }`}
                  >
                    {totalCount}
                  </span>
                )}
              </div>
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
