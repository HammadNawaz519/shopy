"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MobileMenu from "@/components/layout/MobileMenu";
import SearchModal from "@/components/search/SearchModal";

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const { user } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const isHome = pathname === "/";

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
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchNav = async () => {
      try {
        const res = await fetch("/api/navigation", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.navigation)) {
            setNavItems(data.navigation.map((i: any) => ({ name: i.name, href: i.href })));
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
  const navLinks = navItems;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 select-none ${
          isTransparent
            ? "bg-gradient-to-b from-black/60 via-black/20 to-transparent text-white"
            : "bg-[#F4F4F2]/95 backdrop-blur-md text-[#495464] border-b border-[#BBBFCA]/30 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
        }`}
      >
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
              className={`font-serif tracking-[0.3em] text-lg font-light ${
                isTransparent ? "text-white" : "text-[#495464]"
              }`}
            >
              SHOPY
            </Link>
          </div>

          {/* Left Group: Logo + Navigation Links Moved Left */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            <Link
              href="/"
              className={`font-serif tracking-[0.35em] text-xl lg:text-2xl font-light transition-colors whitespace-nowrap ${
                isTransparent ? "text-white" : "text-[#495464]"
              }`}
            >
              SHOPY
            </Link>

            {/* Desktop Navigation Links — Small, lowercase, non-wrapping, clean tracking */}
            <nav className="flex items-center space-x-5 xl:space-x-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-[12px] font-normal tracking-wider lowercase whitespace-nowrap transition-all duration-300 relative py-1 ${
                      isActive
                        ? isTransparent
                          ? "text-white font-medium after:w-full"
                          : "text-[#495464] font-medium after:w-full"
                        : isTransparent
                        ? "text-white/80 hover:text-white after:w-0"
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
                  <span
                    className={`absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full text-[8px] font-medium flex items-center justify-center transition-colors ${
                      isTransparent
                        ? "bg-white text-[#495464]"
                        : "bg-[#495464] text-[#F4F4F2]"
                    }`}
                  >
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
