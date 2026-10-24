"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import ProductCard from "@/components/product/ProductCard";
import StarRating from "@/components/ui/StarRating";
import ProductReviewsSection from "@/components/product/ProductReviewsSection";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";

interface ProductDetailClientViewProps {
  product: any;
  relatedProducts: any[];
  initialRatingSummary?: { averageRating: number; reviewCount: number };
  initialReviews?: any[];
}

export default function ProductDetailClientView({
  product,
  relatedProducts,
  initialRatingSummary,
  initialReviews,
}: ProductDetailClientViewProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]?.name || "Default");
  const [quantity, setQuantity] = useState(1);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; reviewCount: number }>(
    initialRatingSummary || { averageRating: 0, reviewCount: 0 }
  );

  React.useEffect(() => {
    setSelectedImageIdx(0);
    if (product?.sizes?.[0]) setSelectedSize(product.sizes[0]);
    if (product?.colors?.[0]?.name) setSelectedColor(product.colors[0].name);
    if (initialRatingSummary) setRatingSummary(initialRatingSummary);
  }, [product?.id, initialRatingSummary]);

  const { addItem, openCart } = useCart();
  const { showToast } = useToast();

  const imageList: string[] = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : ["/editorial-craft.jpg"];

  const currentImage = imageList[selectedImageIdx] || imageList[0];

  const handleColorSelect = (colorObj: any) => {
    if (!colorObj || !colorObj.name) return;
    setSelectedColor(colorObj.name);

    // Primary: the explicit image this color was assigned to in the admin
    if (colorObj.imageUrl) {
      const urlIdx = imageList.findIndex((img) => img === colorObj.imageUrl);
      if (urlIdx !== -1) {
        setSelectedImageIdx(urlIdx);
        return;
      }
    }

    // Fallback: use the color's array index to map 1-to-1 with the images array
    const colorIdx = product.colors?.findIndex((c: any) => c.name === colorObj.name);
    if (colorIdx !== undefined && colorIdx !== -1 && colorIdx < imageList.length) {
      setSelectedImageIdx(colorIdx);
    }
  };

  const handleThumbnailSelect = (idx: number) => {
    setSelectedImageIdx(idx);
    const clickedUrl = imageList[idx];
    if (clickedUrl && Array.isArray(product.colors)) {
      // Prefer explicit imageUrl match, then fall back to index match
      const matchedColor =
        product.colors.find((c: any) => c && c.imageUrl === clickedUrl) ||
        product.colors[idx];
      if (matchedColor) setSelectedColor(matchedColor.name);
    }
  };

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor, quantity, currentImage);
    showToast(`Added ${product.name} (${selectedSize} - ${selectedColor}) to bag`, "success");
  };

  const handleBuyNow = () => {
    addItem(product, selectedSize, selectedColor, quantity, currentImage);
    openCart();
  };

  return (
    <div className="pt-24 sm:pt-28 lg:pt-32 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-[#495464]/60">
          <Link href="/products" className="hover:text-[#495464] flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Catalogue</span>
          </Link>
          <span>/</span>
          <Link href={`/collections/${product.category}`} className="hover:text-[#495464]">
            {product.categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-[#495464] font-medium truncate max-w-[180px] sm:max-w-xs">
            {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 lg:gap-4">
            {imageList.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 lg:w-24 flex-shrink-0">
                {imageList.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailSelect(idx)}
                    className={`relative w-16 sm:w-full aspect-[3/4] bg-[#E8E8E8] overflow-hidden border transition-all ${
                      selectedImageIdx === idx
                        ? "border-[#495464] opacity-100 shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      sizes="96px"
                      loading={idx === 0 ? "eager" : "lazy"}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 aspect-[3/4] max-h-[460px] sm:max-h-[500px] lg:max-h-[540px] bg-[#E8E8E8] overflow-hidden border border-[#BBBFCA]/30">
              <Image
                key={currentImage}
                src={currentImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-contain p-3 sm:p-5 lg:p-6 transition-opacity duration-300"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNFOEU4RTgiLz48L3N2Zz4="
              />
              {product.tag && (
                <span className="absolute top-3 left-3 bg-[#495464] text-[#F4F4F2] text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 z-10">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
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

                {ratingSummary.reviewCount > 0 && (
                  <a
                    href="#ratings-and-reviews"
                    className="inline-flex items-center gap-2 pt-1 hover:opacity-80 transition-opacity"
                  >
                    <StarRating rating={ratingSummary.averageRating} size="xs" />
                    <span className="font-mono text-xs text-[#495464] font-medium">
                      {ratingSummary.averageRating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-[#495464]/70 underline">
                      ({ratingSummary.reviewCount} {ratingSummary.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </a>
                )}
              </div>

              <p className="text-xs text-[#495464]/80 leading-relaxed tracking-normal font-normal">
                {product.description}
              </p>

              {product.colors && product.colors.length > 0 && (
                <div className="pt-1">
                  <div className="flex justify-between text-[11px] uppercase tracking-wider text-[#495464] mb-1.5 font-medium">
                    <span>Colour: {selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {product.colors.map((c: any) => (
                      <button
                        key={c.name}
                        onClick={() => handleColorSelect(c)}
                        className={`group relative flex items-center justify-center p-0.5 rounded-full border transition-all ${
                          selectedColor === c.name
                            ? "border-[#495464]"
                            : "border-transparent hover:border-[#BBBFCA]"
                        }`}
                        aria-label={c.name}
                        title={c.name}
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

              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
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
                    {product.sizes.map((sz: string) => (
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
              )}

              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center border border-[#BBBFCA] bg-[#E8E8E8] ${(!product.inStock || product.stockCount <= 0) ? "opacity-50 pointer-events-none" : ""}`}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={!product.inStock || product.stockCount <= 0}
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
                      disabled={!product.inStock || product.stockCount <= 0}
                      className="px-2.5 py-2.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || product.stockCount <= 0}
                    className="flex-1 bg-[#495464] text-[#F4F4F2] py-3 px-3 sm:px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-center truncate flex items-center justify-center min-w-0"
                  >
                    <span className="truncate">
                      {(!product.inStock || product.stockCount <= 0) ? "Sold Out" : `Add to Bag • ${formatPrice(product.price * quantity)}`}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={!product.inStock || product.stockCount <= 0}
                  className="w-full border border-[#495464] text-[#495464] py-3 px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-center truncate flex items-center justify-center min-w-0"
                >
                  <span className="truncate">
                    {(!product.inStock || product.stockCount <= 0) ? "Archive Only" : "Instant Bag Review"}
                  </span>
                </button>
              </div>

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
                    7-Day Exchanges
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#495464]/80" />
                  <span className="text-[9px] uppercase tracking-wider text-[#495464]/70">
                    Atelier Authenticity
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          productImage={currentImage}
          initialReviews={initialReviews}
          initialSummary={ratingSummary}
        />

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
