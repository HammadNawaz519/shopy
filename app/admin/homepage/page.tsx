"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Layers,
  Save,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Type,
  Image as ImageIcon,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/context/ToastContext";

interface HomepageConfig {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtaText: string;
  heroCtaLink: string;
  featuredTitle: string;
  featuredSubtitle: string;
  editorialTag: string;
  editorialTitle: string;
  editorialQuote: string;
  editorialImage1: string;
  editorialImage2: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
}

export default function AdminHomepagePage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<HomepageConfig>({
    id: "home_default",
    heroTitle: "ARCHITECTURAL ELEGANCE",
    heroSubtitle: "EDITION 01 • AUTUMN / WINTER 2026",
    heroImage: "/hero-beige-male.jpg",
    heroCtaText: "Explore Collection",
    heroCtaLink: "/products",
    featuredTitle: "Featured Essentials",
    featuredSubtitle: "SELECTION OF THE SEASON",
    editorialTag: "EDITORIAL CAMPAIGN",
    editorialTitle: "Permanence in Form & Texture",
    editorialQuote: "We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence, heavyweight organic knits, and architectural draping.",
    editorialImage1: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1000",
    editorialImage2: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
    newsletterTitle: "Join The Maison Gazette",
    newsletterSubtitle: "Receive private vernissage previews, seasonal lookbooks, and invitation-only atelier dispatches.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localHeroPreview, setLocalHeroPreview] = useState("");

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/homepage");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setLocalHeroPreview(data.config.heroImage || "");
        }
      }
    } catch {
      showToast("Failed to load homepage configuration.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local demo preview
    const localDemoUrl = URL.createObjectURL(file);
    setLocalHeroPreview(localDemoUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload?fit=banner", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setConfig((prev) => ({ ...prev, heroImage: data.url }));
        setLocalHeroPreview(data.url);
        showToast("Hero image compressed & saved to DB bucket.", "success");
      } else {
        showToast(data.error || "Image upload failed.", "error");
      }
    } catch {
      showToast("Network error uploading image.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploading) {
      showToast("Please wait for hero image optimization to complete.", "error");
      return;
    }

    if (config.heroImage.startsWith("blob:")) {
      showToast("Image is still optimizing, please wait a moment.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        showToast("Homepage editorial & hero content published live.", "success");
      } else {
        showToast(data.error || "Failed to update homepage.", "error");
      }
    } catch {
      showToast("Network error saving homepage configuration.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F4F2]">
      <AdminHeader
        title="Homepage & Campaign Management"
        subtitle="Control Hero Visuals, Taglines, Editorial Storytelling & Newsletters"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#BBBFCA]/40 pb-6">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#495464]">Customer Storefront Control</h2>
            <p className="text-xs text-[#495464]/60">
              Live configuration synchronized directly with PostgreSQL
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Publishing..." : "Save & Publish Live"}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#495464]" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* 1. Hero Campaign Section */}
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#BBBFCA]/30">
                <Sliders className="w-4 h-4 text-[#495464]" />
                <h3 className="font-serif text-lg font-medium text-[#495464]">1. Hero Section (Header Campaign)</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Hero Image Preview & Upload */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="block text-[10px] uppercase font-semibold text-[#495464]">
                    Campaign Hero Visual
                  </label>
                  <div className="relative aspect-[3/4] w-full bg-[#E8E8E8] border border-[#BBBFCA]/40 overflow-hidden shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={localHeroPreview || config.heroImage}
                      alt="Hero Preview Demo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-[10px] tracking-widest uppercase block opacity-80">
                        {config.heroSubtitle}
                      </span>
                      <h4 className="font-serif text-xl font-light tracking-wide leading-tight">
                        {config.heroTitle}
                      </h4>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/75 text-white text-[9px] uppercase px-2 py-0.5 tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{uploading ? "Sharpening..." : "Live Hero Demo"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleHeroFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#495464] text-[#F4F4F2] py-2 px-3 text-[11px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploading ? "Sharpening..." : "Upload from Computer"}</span>
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.heroImage}
                      onChange={(e) => setConfig({ ...config, heroImage: e.target.value })}
                      placeholder="Or enter direct image URL..."
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Hero Copy Fields */}
                <div className="lg:col-span-7 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                    Hero Season Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.heroSubtitle}
                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                    placeholder="EDITION 01 • AUTUMN / WINTER 2026"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    value={config.heroTitle}
                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                    placeholder="ARCHITECTURAL ELEGANCE"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs font-serif text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={config.heroCtaText}
                      onChange={(e) => setConfig({ ...config, heroCtaText: e.target.value })}
                      placeholder="Explore Collection"
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                      CTA Destination URL
                    </label>
                    <input
                      type="text"
                      value={config.heroCtaLink}
                      onChange={(e) => setConfig({ ...config, heroCtaLink: e.target.value })}
                      placeholder="/products"
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FEATURED PRODUCTS HEADLINE */}
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#BBBFCA]/30">
              <Type className="w-4 h-4 text-[#495464]" />
              <h3 className="font-serif text-base font-medium text-[#495464]">
                2. Featured Essentials Section Headline
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                  Section Subtitle / Tag
                </label>
                <input
                  type="text"
                  value={config.featuredSubtitle}
                  onChange={(e) => setConfig({ ...config, featuredSubtitle: e.target.value })}
                  placeholder="SELECTION OF THE SEASON"
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                  Main Section Title
                </label>
                <input
                  type="text"
                  value={config.featuredTitle}
                  onChange={(e) => setConfig({ ...config, featuredTitle: e.target.value })}
                  placeholder="Featured Essentials"
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs font-serif"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: EDITORIAL STORYTELLING */}
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#BBBFCA]/30">
              <ImageIcon className="w-4 h-4 text-[#495464]" />
              <h3 className="font-serif text-base font-medium text-[#495464]">
                3. Editorial Storytelling Section
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                    Editorial Tag
                  </label>
                  <input
                    type="text"
                    value={config.editorialTag}
                    onChange={(e) => setConfig({ ...config, editorialTag: e.target.value })}
                    placeholder="EDITORIAL CAMPAIGN"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                    Editorial Headline
                  </label>
                  <input
                    type="text"
                    value={config.editorialTitle}
                    onChange={(e) => setConfig({ ...config, editorialTitle: e.target.value })}
                    placeholder="Permanence in Form & Texture"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                  Editorial Manifesto / Quote
                </label>
                <textarea
                  rows={3}
                  value={config.editorialQuote}
                  onChange={(e) => setConfig({ ...config, editorialQuote: e.target.value })}
                  placeholder="We reject the cycle of seasonal excess..."
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                    Editorial Image 1 URL
                  </label>
                  <input
                    type="text"
                    value={config.editorialImage1}
                    onChange={(e) => setConfig({ ...config, editorialImage1: e.target.value })}
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                    Editorial Image 2 URL
                  </label>
                  <input
                    type="text"
                    value={config.editorialImage2}
                    onChange={(e) => setConfig({ ...config, editorialImage2: e.target.value })}
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-8 py-3 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Publishing Changes..." : "Save & Publish to Storefront"}</span>
            </button>
          </div>
        </form>
      )}
    </main>
  </div>
);
}
