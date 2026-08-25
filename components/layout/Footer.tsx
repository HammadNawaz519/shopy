"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Instagram, Facebook, Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Do NOT render footer on admin, checkout, account, order-confirmation, auth, and product detail pages
  const noFooterRoutes = [
    "/admin",
    "/checkout",
    "/account",
    "/order-confirmation",
    "/login",
    "/register",
    "/forgot-password",
    "/product",
  ];

  if (noFooterRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const shopLinks = [
    { name: "View All", href: "/products" },
    { name: "Tops", href: "/collections/tops" },
    { name: "Bottoms", href: "/collections/bottoms" },
    { name: "Footwear", href: "/collections/footwear" },
    { name: "Fragrances", href: "/collections/fragrances" },
    { name: "Co-Ord Sets", href: "/collections/co-ord-sets" },
    { name: "Accessories", href: "/collections/accessories" },
  ];

  const infoLinks = [
    { name: "About SHOPY", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Shipping", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Size Guide", href: "/size-guide" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy", href: "/returns" },
  ];

  return (
    <footer className="relative bg-[#F4F4F2] text-[#495464] pt-16 pb-0 border-t border-[#BBBFCA]/30 overflow-hidden select-none">
      {/* Upper Footer Navigation Grid */}
      <div className="max-w-[1720px] mx-auto px-6 lg:px-16 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Brand Manifesto */}
          <div className="col-span-2 lg:col-span-2 space-y-4 pr-6">
            <span className="font-serif tracking-widest text-xl font-medium block text-[#495464]">
              HAUTE ATELIER
            </span>
            <p className="text-xs text-[#495464]/80 leading-relaxed max-w-sm tracking-wider uppercase">
              A contemporary editorial house exploring architectural silhouettes, tactile fabrications, and sensory extraits. Crafted for permanence.
            </p>
            <div className="pt-2 flex items-center space-x-5 text-[#495464]">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-60 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 stroke-[1.5]" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-60 transition-opacity"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 stroke-[1.5]" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-60 transition-opacity"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 stroke-[1.5]" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-60 transition-opacity"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4 stroke-[1.5]" />
              </a>
            </div>
          </div>

          {/* Column 1: Collections */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#495464] mb-6">
              Collections
            </h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-xs text-[#495464]/80 hover:text-[#495464] tracking-wider transition-colors inline-block hover:translate-x-0.5 duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Client Concierge */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#495464] mb-6">
              Concierge
            </h4>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-xs text-[#495464]/80 hover:text-[#495464] tracking-wider transition-colors inline-block hover:translate-x-0.5 duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Maison */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#495464] mb-6">
              Maison
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-xs text-[#495464]/80 hover:text-[#495464] tracking-wider transition-colors inline-block hover:translate-x-0.5 duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MANDATORY GIANT OVERSIZED CROPPED SHOPY SIGNATURE TYPOGRAPHY */}
      <div className="w-full relative overflow-hidden pointer-events-none flex justify-center items-end leading-none border-t border-[#BBBFCA]/20 pt-8 pb-0">
        <span
          className="font-serif text-[#495464]/10 font-bold tracking-tight select-none block text-center whitespace-nowrap -mb-[0.18em]"
          style={{
            fontSize: "clamp(8rem, 25vw, 32rem)",
            lineHeight: "0.72",
            letterSpacing: "-0.04em",
          }}
        >
          SHOPY
        </span>
      </div>

      {/* Minimal Final Row */}
      <div className="border-t border-[#BBBFCA]/30 bg-[#F4F4F2] py-6 px-6 lg:px-16 text-xs text-[#495464]/70 tracking-widest uppercase">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span>© 2026 SHOPY — ALL RIGHTS RESERVED</span>
          <div className="flex items-center gap-6">
            <span>SECURE CHECKOUT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
