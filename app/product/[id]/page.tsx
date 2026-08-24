"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, Product } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import ProductCard from "@/components/product/ProductCard";
import {
  ChevronDown,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = PRODUCTS.find((p) => p.id === params.id || p.slug === params.id);

  if (!product) {
    notFound();
  }

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "Default");
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");

  const { addItem, openCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor, quantity);
    showToast(`Added ${product.name} (${selectedSize}) to bag`, "success");
  };

  const handleBuyNow = () => {
    addItem(product, selectedSize, selectedColor, quantity);
    openCart();
  };

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  return (
    <div className="pt-12 sm:pt-16 pb-16 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#495464]/60">
          <Link href="/products" className="hover:text-[#495464] flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Catalogue</span>
          </Link>
          <span>/</span>
          <Link href={`/collections/${product.category}`} className="hover:text-[#495464]">
            {product.categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-[#495464] font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery (Thumbnails + Main View) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 lg:gap-4">
            {/* Thumbnails (Preserved Size for Clear Demo Preview) */}
            {product.images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 lg:w-24 flex-shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 sm:w-full aspect-[3/4] bg-[#E8E8E8] overflow-hidden border transition-all ${
                      selectedImageIdx === idx
                        ? "border-[#495464] opacity-100 shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumb ${idx + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image (Scaled down to fit screen gracefully) */}
            <div className="relative flex-1 aspect-[3/4] max-h-[460px] sm:max-h-[500px] lg:max-h-[540px] bg-[#E8E8E8] overflow-hidden border border-[#BBBFCA]/30">
              <Image
                src={product.images[selectedImageIdx]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              {product.tag && (
                <span className="absolute top-3 left-3 bg-[#495464] text-[#F4F4F2] text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 z-10">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          {/* Right: Product Purchase Controls & Details (Compact & Refined) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Category & Name */}
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#495464]/60 font-medium block mb-1">
                  {product.categoryLabel}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#495464] leading-snug mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg font-medium text-[#495464] tracking-wider">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs sm:text-sm text-[#495464]/50 line-through tracking-wider">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#495464]/80 leading-relaxed tracking-normal font-normal">
                {product.description}
              </p>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="pt-1">
                  <div className="flex justify-between text-[11px] uppercase tracking-wider text-[#495464] mb-1.5 font-medium">
                    <span>Colour: {selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`group relative flex items-center justify-center p-0.5 rounded-full border transition-all ${
                          selectedColor === c.name
                            ? "border-[#495464]"
                            : "border-transparent hover:border-[#BBBFCA]"
                        }`}
                        aria-label={c.name}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 block"
                          style={{ backgroundColor: c.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] uppercase tracking-wider text-[#495464] mb-1.5 font-medium">
                  <span>Size: {selectedSize}</span>
                  <Link
                    href="/size-guide"
                    className="text-[#495464]/70 hover:text-[#495464] underline normal-case"
                  >
                    Size Guide
                  </Link>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 text-[11px] uppercase tracking-wider font-medium border transition-all ${
                        selectedSize === sz
                          ? "border-[#495464] bg-[#495464] text-[#F4F4F2]"
                          : "border-[#BBBFCA]/60 bg-[#E8E8E8]/50 text-[#495464] hover:border-[#495464]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & CTA Buttons */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-[#BBBFCA] bg-[#E8E8E8]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-2.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-medium text-[#495464]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2.5 py-2.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Add to Bag Button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#495464] text-[#F4F4F2] py-2.5 px-4 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-sm"
                  >
                    Add to Bag • {formatPrice(product.price * quantity)}
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full border border-[#495464] text-[#495464] py-2.5 px-4 text-xs uppercase tracking-widest font-medium hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors"
                >
                  Instant Bag Review
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#BBBFCA]/30 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#495464]/80" />
                  <span className="text-[9px] uppercase tracking-wider text-[#495464]/70">
                    Complimentary Shipping
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-[#495464]/80" />
                  <span className="text-[9px] uppercase tracking-wider text-[#495464]/70">
                    14-Day Exchanges
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#495464]/80" />
                  <span className="text-[9px] uppercase tracking-wider text-[#495464]/70">
                    Atelier Authenticity
                  </span>
                </div>
              </div>

              {/* Accordions */}
              <div className="pt-2 border-t border-[#BBBFCA]/30 divide-y divide-[#BBBFCA]/20 text-xs">
                {/* Details & Fit */}
                <div className="py-2.5">
                  <button
                    onClick={() => toggleAccordion("details")}
                    className="w-full flex items-center justify-between font-medium uppercase tracking-wider text-[11px] text-[#495464] text-left"
                  >
                    <span>Details &amp; Silhouette</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        openAccordion === "details" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openAccordion === "details" && (
                    <ul className="mt-2 space-y-1 text-[#495464]/80 tracking-wider text-[11px] list-disc pl-4 animate-fadeIn">
                      {product.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Composition & Care */}
                <div className="py-2.5">
                  <button
                    onClick={() => toggleAccordion("care")}
                    className="w-full flex items-center justify-between font-medium uppercase tracking-wider text-[11px] text-[#495464] text-left"
                  >
                    <span>Composition &amp; Care</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        openAccordion === "care" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openAccordion === "care" && (
                    <div className="mt-2 space-y-2 text-[#495464]/80 tracking-wider text-[11px] animate-fadeIn">
                      <div>
                        <span className="font-semibold block text-[#495464] mb-0.5">
                          Fabrication:
                        </span>
                        <p>{product.composition.join(", ")}</p>
                      </div>
                      <div>
                        <span className="font-semibold block text-[#495464] mb-0.5">
                          Care Protocol:
                        </span>
                        <p>{product.careInstructions.join(" • ")}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping & Delivery */}
                <div className="py-2.5">
                  <button
                    onClick={() => toggleAccordion("shipping")}
                    className="w-full flex items-center justify-between font-medium uppercase tracking-wider text-[11px] text-[#495464] text-left"
                  >
                    <span>Shipping &amp; Returns</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        openAccordion === "shipping" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openAccordion === "shipping" && (
                    <p className="mt-2 text-[#495464]/80 tracking-wider text-[11px] leading-relaxed animate-fadeIn">
                      Orders placed before 2:00 PM PKT are processed the same business day from our Lahore atelier. Standard insured nationwide courier takes 2-4 business days. Complimentary delivery on orders over Rs. 15,000.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Pieces Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-[#BBBFCA]/30">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#495464]/60 block mb-1">
                  CURATED HARMONY
                </span>
                <h2 className="font-serif text-2xl font-medium text-[#495464]">
                  Complementary Creations
                </h2>
              </div>
              <Link
                href={`/collections/${product.category}`}
                className="text-[11px] uppercase tracking-widest text-[#495464] hover:opacity-70 transition-opacity"
              >
                View More {product.categoryLabel} →
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
