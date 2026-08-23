import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pt-28 pb-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Centered Brand Signature */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <img
              src="/logo.svg"
              alt="SHOPY"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center py-12 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            ATELIER PROVENANCE
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-[#495464] max-w-3xl mx-auto">
            The Philosophy of SHOPY
          </h1>
          <p className="text-xs sm:text-sm text-[#495464]/80 tracking-wider uppercase mt-4 max-w-lg mx-auto leading-relaxed">
            Form, drape, tactile permanence, and olfactory memories.
          </p>
        </div>

        {/* Narrative & Image Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-24">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#495464]">
              Architectural Silhouettes Designed for Life.
            </h2>
            <p className="text-xs sm:text-sm text-[#495464]/80 leading-relaxed tracking-wider uppercase">
              Founded on the belief that everyday clothing should feel intentional and serene, SHOPY creates garments that stand apart from transient fast-fashion cycles.
            </p>
            <p className="text-xs sm:text-sm text-[#495464]/80 leading-relaxed tracking-wider uppercase">
              We source custom-milled organic French terry cotton, long-staple Normandy linen, tropical wools, and full-grain Italian calfskin to achieve silhouettes that hold their form without rigidity.
            </p>
          </div>

          <div className="lg:col-span-6 relative aspect-[4/3] bg-[#E8E8E8] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200"
              alt="Atelier craft"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Principles 3-column */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-y border-[#BBBFCA]/30">
          <div className="space-y-3">
            <span className="font-serif text-2xl text-[#495464]/40">01</span>
            <h3 className="font-serif text-xl font-medium text-[#495464]">Tactile Longevity</h3>
            <p className="text-xs text-[#495464]/70 leading-relaxed tracking-wider uppercase">
              Fabrics developed with high grammage and natural fibres that soften and age gracefully with continuous wear.
            </p>
          </div>
          <div className="space-y-3">
            <span className="font-serif text-2xl text-[#495464]/40">02</span>
            <h3 className="font-serif text-xl font-medium text-[#495464]">Monochromatic Harmony</h3>
            <p className="text-xs text-[#495464]/70 leading-relaxed tracking-wider uppercase">
              A curated neutral palette of ecru, slate, bone, and charcoal engineered for seamless capsule wardrobes.
            </p>
          </div>
          <div className="space-y-3">
            <span className="font-serif text-2xl text-[#495464]/40">03</span>
            <h3 className="font-serif text-xl font-medium text-[#495464]">Sensory Compositions</h3>
            <p className="text-xs text-[#495464]/70 leading-relaxed tracking-wider uppercase">
              Hand-blended extrait de parfum formulations using high oil concentrations and rare botanical resins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
