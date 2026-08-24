"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/lib/data/products";
import { Search, Loader2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function performSearch(q: string) {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    performSearch(query);
  }, [query]);

  return (
    <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
      {/* Header */}
      <div className="text-center py-12 border-b border-[#BBBFCA]/30 mb-12">
        <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
          INDEXED SEARCH
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
          Search Catalogue
        </h1>

        <div className="max-w-xl mx-auto mt-8">
          <div className="relative border border-[#495464] bg-[#E8E8E8]/50 flex items-center px-4 py-3">
            <Search className="w-4 h-4 text-[#495464]/60 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search silhouettes, materials, tags..."
              className="w-full bg-transparent text-sm text-[#495464] focus:outline-none tracking-wide"
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-[#495464]/60 ml-2" />}
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        {query && (
          <p className="text-xs uppercase tracking-widest text-[#495464]/70 mb-8">
            Found {results.length} results for &quot;{query}&quot;
          </p>
        )}

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : query && !loading ? (
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-[#495464]/80 mb-2">No matching pieces</p>
            <p className="text-xs text-[#495464]/60 tracking-wider">
              Try searching for &quot;Tee&quot;, &quot;Trousers&quot;, &quot;Loafers&quot;, or &quot;Extrait&quot;.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#495464] mx-auto" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}
