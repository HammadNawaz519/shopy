"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasBeenHovered, setHasBeenHovered] = useState(false);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const hasSecondImage = Array.isArray(product.images) && product.images.length > 1;

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, size, product.colors?.[0]?.name || "Default", 1);
    showToast(`Added ${product.name} (${size}) to bag`, "success");
    setShowQuickAdd(false);
  };

  return (
    <div
      className="group flex flex-col select-none"
      onMouseEnter={() => {
        setIsHovered(true);
        if (!hasBeenHovered && hasSecondImage) {
          setHasBeenHovered(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickAdd(false);
      }}
    >
      {/* Image Container with Elegant Tonal Placeholder */}
      <div className="relative aspect-[3/4] w-full bg-[#E8E8E8] overflow-hidden">
        <Link
          href={`/product/${product.id}`}
          prefetch={false}
          className="block w-full h-full"
        >
          {/* Primary Image with Crisp Retina Delivery & Fade-in */}
          <Image
            src={product.images?.[0] || "/editorial-craft.jpg"}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onLoad={() => setIsLoaded(true)}
            className={`object-cover object-center transition-all duration-700 ${
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
            } ${hasSecondImage && isHovered && hasBeenHovered ? "!opacity-0" : ""}`}
          />

          {/* Secondary Hover Image — Loaded On-Demand upon first hover */}
          {hasSecondImage && hasBeenHovered && (
            <Image
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover object-center transition-all duration-700 absolute inset-0 ${
                isHovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
            />
          )}
        </Link>

        {/* Status Badges */}
        {(product.stockCount <= 0 || product.inStock === false) ? (
          <span className="absolute top-3 left-3 bg-[#181a1d] text-[#F4F4F2] text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 z-10">
            SOLD OUT
          </span>
        ) : product.tag ? (
          <span className="absolute top-3 left-3 bg-[#495464] text-[#F4F4F2] text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 z-10">
            {product.tag}
          </span>
        ) : null}

        {/* Quick Add Slide-up Overlay (Only available when in stock) */}
        {product.stockCount > 0 && product.inStock !== false && (
          <div
            className={`absolute inset-x-0 bottom-0 p-3 bg-[#F4F4F2]/95 backdrop-blur-sm border-t border-[#BBBFCA]/30 transition-transform duration-300 z-20 ${
              showQuickAdd ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-[#495464]/80 text-center mb-2 font-medium">
              Select Size
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => handleQuickAdd(e, size)}
                  className="px-2.5 py-1 text-xs border border-[#495464]/40 hover:bg-[#495464] hover:text-[#F4F4F2] text-[#495464] transition-colors"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Add Toggle Button (visible on hover when in stock) */}
        {product.stockCount > 0 && product.inStock !== false && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickAdd(!showQuickAdd);
            }}
            className={`absolute bottom-3 right-3 w-8 h-8 bg-white/90 text-[#495464] flex items-center justify-center shadow-md transition-all duration-300 z-10 hover:bg-[#495464] hover:text-white ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            aria-label="Quick add size"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product Information */}
      <div className="pt-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[#495464]/60 mb-1">
            <span>{product.categoryLabel}</span>
            {/* Color Swatch Dots */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                {product.colors.map((c) => (
                  <span
                    key={c.name}
                    title={c.name}
                    className="w-2.5 h-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          <Link href={`/product/${product.id}`} prefetch={false} className="block group-hover:underline">
            <h3 className="font-serif text-base font-medium text-[#495464] leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#495464] tracking-wider">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#495464]/50 line-through tracking-wider">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {(product as any).rating !== undefined && (product as any).rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-medium text-[#495464]">
                {(product as any).rating.toFixed(1)}★
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
