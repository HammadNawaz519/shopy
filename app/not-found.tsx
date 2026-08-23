import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] pt-32 pb-32 flex items-center justify-center bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
        {/* Centered Brand Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <img
              src="/logo.svg"
              alt="SHOPY"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <span className="text-xs uppercase tracking-widest text-[#495464]/60 block font-medium">
          404 • SILHOUETTE NOT FOUND
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#495464]">
          Page Does Not Exist
        </h1>

        <p className="text-xs text-[#495464]/70 tracking-wider uppercase max-w-sm mx-auto leading-relaxed">
          The editorial page or piece you are searching for has been relocated or archived.
        </p>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-[#495464] text-[#F4F4F2] px-8 py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
          >
            <span>Return to Homepage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
