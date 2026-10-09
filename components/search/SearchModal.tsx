"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { Product } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const popularSearches = ["Boxy Tee", "Pleated Trousers", "Loafers", "Amber Extrait", "Tote", "Tracksuit"];

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#F4F4F2]/98 backdrop-blur-md animate-fadeIn text-[#495464]">
      {/* Top Bar */}
      <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 pt-[calc(env(safe-area-inset-top)+2rem)] pb-6 flex items-center justify-between border-b border-[#BBBFCA]/30">
        <span className="font-serif tracking-widest text-2xl font-medium">SHOPY SEARCH</span>
        <button
          onClick={onClose}
          className="p-2 text-[#495464] hover:opacity-70 transition-opacity"
          aria-label="Close search"
        >
          <X className="w-6 h-6 stroke-[1.5]" />
        </button>
      </div>

      {/* Search Input Box */}
      <div className="max-w-4xl w-full mx-auto px-6 pt-12 pb-6">
        <div className="relative border-b-2 border-[#495464] pb-4 flex items-center gap-4">
          <Search className="w-6 h-6 text-[#495464]/60 stroke-[1.5]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by silhouette, material, category..."
            className="w-full bg-transparent font-serif text-2xl lg:text-3xl text-[#495464] placeholder:text-[#BBBFCA] focus:outline-none tracking-wide"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin text-[#495464]/60" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="text-[#495464]/50 hover:text-[#495464]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 mr-2">
            Trending:
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="text-xs tracking-wider uppercase bg-[#E8E8E8] hover:bg-[#BBBFCA]/40 px-3 py-1.5 transition-colors text-[#495464]"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto max-w-6xl w-full mx-auto px-6 pt-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        {results.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-widest text-[#495464]/70 mb-6">
              Found {results.length} results for &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  prefetch={false}
                  onClick={onClose}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] bg-[#E8E8E8] overflow-hidden mb-3">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <p className="text-[11px] uppercase tracking-widest text-[#495464]/60 mb-1">
                    {product.categoryLabel}
                  </p>
                  <h4 className="font-serif text-sm font-medium text-[#495464] group-hover:underline line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs font-medium text-[#495464] mt-1">
                    {formatPrice(product.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : query && !loading ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-[#495464]/70 mb-2">No matching pieces found</p>
            <p className="text-xs text-[#495464]/50 tracking-wider">
              Try searching with another keyword or explore our full collection.
            </p>
            <Link
              href="/products"
              onClick={onClose}
              className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-widest border-b border-[#495464] pb-1 text-[#495464] hover:opacity-70 transition-opacity"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
