"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] pt-32 pb-32 flex items-center justify-center bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-[#495464]/60 block font-medium">
          500 • ATELIER INTERRUPTED
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#495464]">
          Something went wrong
        </h1>

        <p className="text-xs text-[#495464]/70 tracking-wider uppercase max-w-sm mx-auto leading-relaxed">
          An unexpected error occurred while loading this experience.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
