"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Save,
  Upload,
  Loader2,
  Sliders,
  Type,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Palette,
  Check,
  Sparkles,
  ArrowRight,
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
  heroTextColor?: string;
  heroImageFit?: "cover" | "contain" | "fill";
  heroImagePosition?: string;
  heroMobileImage?: string;
}

const COLOR_PRESETS = [
  { name: "Pure White", value: "#FFFFFF" },
  { name: "Atelier Cream", value: "#F4F4F2" },
  { name: "Fog Grey", value: "#BBBFCA" },
  { name: "Midnight Black", value: "#181A1D" },
  { name: "Atelier Slate", value: "#495464" },
  { name: "Luxury Gold", value: "#D4AF37" },
  { name: "Warm Amber", value: "#E0A96D" },
];

export default function AdminHomepagePage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const editorialImageInputRef = useRef<HTMLInputElement>(null);

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
    heroTextColor: "#FFFFFF",
    heroImageFit: "cover",
    heroImagePosition: "center",
    heroMobileImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; positionX: number; positionY: number } | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/homepage");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({
            ...data.config,
            heroTextColor: data.config.heroTextColor || "#FFFFFF",
            heroImageFit: data.config.heroImageFit || "cover",
            heroImagePosition: data.config.heroImagePosition || "center",
            heroMobileImage: data.config.heroMobileImage || "",
          });
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "desktop" | "mobile" | "editorial"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "desktop") setUploadingDesktop(true);
    else if (target === "mobile") setUploadingMobile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadUrl =
        target === "desktop"
          ? "/api/admin/upload?fit=hero"
          : target === "mobile"
            ? "/api/admin/upload?fit=hero-mobile"
            : "/api/admin/upload";
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        if (target === "desktop") {
          setConfig((prev) => ({
            ...prev,
            heroImage: data.variants?.desktop || data.url,
            heroMobileImage: data.variants?.mobile || prev.heroMobileImage,
          }));
          showToast("Hero image optimized with an adjustable desktop frame and mobile crop.", "success");
        } else if (target === "mobile") {
          setConfig((prev) => ({ ...prev, heroMobileImage: data.url }));
          showToast("Mobile hero image uploaded and sharpened.", "success");
        } else {
          setConfig((prev) => ({ ...prev, editorialImage1: data.url }));
          showToast("Editorial section image uploaded and sharpened.", "success");
        }
      } else {
        showToast(data.error || "Image upload failed.", "error");
      }
    } catch {
      showToast("Network error uploading image.", "error");
    } finally {
      if (target === "desktop") setUploadingDesktop(false);
      else if (target === "mobile") setUploadingMobile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingDesktop || uploadingMobile) {
      showToast("Please wait for image upload & optimization to complete.", "error");
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
        showToast("Homepage editorial & hero configuration published live.", "success");
      } else {
        showToast(data.error || "Failed to update homepage.", "error");
      }
    } catch {
      showToast("Network error saving homepage configuration.", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeHeroImage =
    previewDevice === "mobile" && config.heroMobileImage
      ? config.heroMobileImage
      : config.heroImage;

  const parsePosition = (position: string | undefined) => {
    if (!position || position === "center") return { x: 50, y: 50 };
    if (position === "top") return { x: 50, y: 0 };
    if (position === "bottom") return { x: 50, y: 100 };
    const match = position.match(/^(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%$/);
    return match
      ? { x: Number(match[1]), y: Number(match[2]) }
      : { x: 50, y: 50 };
  };

  const handlePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (previewDevice !== "desktop" || (config.heroImageFit || "cover") !== "cover") return;
    const position = parsePosition(config.heroImagePosition);
    dragRef.current = { x: event.clientX, y: event.clientY, positionX: position.x, positionY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !previewRef.current) return;
    const bounds = previewRef.current.getBoundingClientRect();
    const deltaX = ((event.clientX - dragRef.current.x) / bounds.width) * 100;
    const deltaY = ((event.clientY - dragRef.current.y) / bounds.height) * 100;
    const positionX = Math.max(0, Math.min(100, dragRef.current.positionX + deltaX));
    const positionY = Math.max(0, Math.min(100, dragRef.current.positionY + deltaY));
    setConfig((prev) => ({ ...prev, heroImagePosition: `${positionX.toFixed(1)}% ${positionY.toFixed(1)}%` }));
  };

  const stopPreviewDrag = () => {
    dragRef.current = null;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F4F2]">
      <AdminHeader
        title="Homepage & Campaign Management"
        subtitle="Control Hero Visuals, Framing, Colors, Storytelling & Newsletters"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#BBBFCA]/40 pb-6">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#495464]">Customer Storefront Control</h2>
            <p className="text-xs text-[#495464]/60">
              Live configuration synchronized directly with PostgreSQL & Storefront Hero
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#BBBFCA]/30 gap-3">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-[#495464]" />
                  <h3 className="font-serif text-lg font-medium text-[#495464]">
                    1. Hero Section (Header Campaign & Visual Framing)
                  </h3>
                </div>

                {/* Device Preview Toggle */}
                <div className="flex items-center bg-[#E8E8E8] border border-[#BBBFCA]/50 p-0.5 rounded-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium tracking-wider uppercase transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-[#495464] text-white shadow-xs"
                        : "text-[#495464]/70 hover:text-[#495464]"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Laptop / Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium tracking-wider uppercase transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-[#495464] text-white shadow-xs"
                        : "text-[#495464]/70 hover:text-[#495464]"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile Phone</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Hero Preview + Image Fit Controls */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] uppercase font-semibold text-[#495464]">
                      Hero Live Simulation ({previewDevice === "desktop" ? "Laptop 16:9" : "Mobile 9:16"})
                    </label>
                    <span className="text-[10px] text-[#495464]/60 font-mono">
                      Fit: {config.heroImageFit} • Pos: {config.heroImagePosition}
                    </span>
                  </div>

                  {/* Responsive Preview Box */}
                  <div
                    ref={previewRef}
                    onPointerDown={handlePreviewPointerDown}
                    onPointerMove={handlePreviewPointerMove}
                    onPointerUp={stopPreviewDrag}
                    onPointerCancel={stopPreviewDrag}
                    className={`relative w-full bg-[#181a1d] border border-[#BBBFCA]/60 overflow-hidden shadow-sm mx-auto transition-all duration-300 ${
                      previewDevice === "desktop"
                        ? "aspect-video"
                        : "aspect-[9/16] max-w-[280px]"
                    } ${previewDevice === "desktop" && (config.heroImageFit || "cover") === "cover" ? "cursor-grab active:cursor-grabbing" : ""}`}
                    style={{ touchAction: "none", userSelect: "none" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeHeroImage}
                      alt="Hero Preview"
                      style={{
                        objectFit: config.heroImageFit || "cover",
                        objectPosition: config.heroImagePosition || "center",
                        transform:
                          previewDevice === "desktop" && (config.heroImageFit || "cover") === "cover"
                            ? "scale(1.2)"
                            : undefined,
                        transformOrigin: "center",
                        pointerEvents: "none",
                      }}
                      className="w-full h-full filter brightness-[0.94] contrast-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/30 pointer-events-none" />

                    {/* Text Overlay on Preview */}
                    <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span
                        className="text-[9px] font-light tracking-[0.25em] uppercase mb-1 block drop-shadow-sm transition-colors duration-200"
                        style={{ color: config.heroTextColor || "#FFFFFF", opacity: 0.9 }}
                      >
                        {config.heroSubtitle || "EDITION 01"}
                      </span>
                      <h4
                        className="font-serif font-light tracking-wide leading-tight drop-shadow-md transition-colors duration-200"
                        style={{
                          color: config.heroTextColor || "#FFFFFF",
                          fontSize: previewDevice === "desktop" ? "1.4rem" : "1.1rem",
                        }}
                      >
                        {config.heroTitle || "ARCHITECTURAL ELEGANCE"}
                      </h4>
                      <div className="mt-2">
                        <span
                          className="inline-block px-3 py-1 text-[8px] uppercase tracking-wider font-light backdrop-blur-xs border transition-colors duration-200"
                          style={{
                            color: config.heroTextColor || "#FFFFFF",
                            borderColor: `${config.heroTextColor || "#FFFFFF"}99`,
                          }}
                        >
                          {config.heroCtaText || "Explore"}
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 bg-black/80 text-white text-[9px] uppercase px-2 py-0.5 tracking-wider flex items-center gap-1.5 z-10 pointer-events-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{previewDevice} view</span>
                    </div>
                  </div>

                  {/* Image Fit & Position Selector */}
                  <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-3 space-y-3">
                    <div className="text-[10px] font-semibold uppercase text-[#495464] flex items-center justify-between">
                      <span>Image Fit & Aspect Ratio Control</span>
                      <span className="text-[9px] font-normal text-[#495464]/70">Fixes laptop stretch</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[9px] uppercase text-[#495464]/80 mb-1">
                          Fit Mode
                        </label>
                        <select
                          value={config.heroImageFit || "cover"}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              heroImageFit: e.target.value as "cover" | "contain" | "fill",
                            })
                          }
                          className="w-full bg-[#F4F4F2] border border-[#BBBFCA] p-1.5 text-xs text-[#495464] rounded-none font-medium cursor-pointer"
                        >
                          <option value="cover">Cover (Fill screen bleed)</option>
                          <option value="contain">Contain (Crisp, uncropped)</option>
                          <option value="fill">Fill (Stretch exact)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-[#495464]/80 mb-1">
                          Focal Alignment
                        </label>
                        <select
                          value={config.heroImagePosition || "center"}
                          onChange={(e) => setConfig({ ...config, heroImagePosition: e.target.value })}
                          className="w-full bg-[#F4F4F2] border border-[#BBBFCA] p-1.5 text-xs text-[#495464] rounded-none font-medium cursor-pointer"
                        >
                          <option value="center">Center (Middle)</option>
                          <option value="top">Top (Subject / Face Focus)</option>
                          <option value="bottom">Bottom (Floor / Shoes Focus)</option>
                        </select>
                        {previewDevice === "desktop" && config.heroImageFit === "cover" && (
                          <p className="mt-1 text-[9px] text-[#495464]/70">
                            Drag the laptop preview to move the image crop.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Controls for Desktop & Mobile */}
                  <div className="space-y-3">
                    {/* Desktop Upload */}
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                        Primary / Desktop Image (16:9 Landscape Recommended)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileUpload(e, "desktop")}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingDesktop}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#495464] text-[#F4F4F2] py-2 px-3 text-[11px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploadingDesktop ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{uploadingDesktop ? "Sharpening Ultra-Res..." : "Upload Desktop Hero"}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={config.heroImage}
                        onChange={(e) => setConfig({ ...config, heroImage: e.target.value })}
                        placeholder="Or paste image URL..."
                        className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono mt-1"
                      />
                    </div>

                    {/* Mobile Portrait Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-semibold text-[#495464]">
                          Mobile Portrait Image (Optional 9:16)
                        </label>
                        <span className="text-[9px] text-[#495464]/60">Fits mobile screens 1:1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={mobileFileInputRef}
                          onChange={(e) => handleFileUpload(e, "mobile")}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => mobileFileInputRef.current?.click()}
                          disabled={uploadingMobile}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#BBBFCA]/50 text-[#495464] border border-[#BBBFCA] py-1.5 px-3 text-[11px] uppercase tracking-wider font-medium hover:bg-[#BBBFCA]/70 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploadingMobile ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5" />
                          )}
                          <span>{uploadingMobile ? "Processing Mobile..." : "Upload Dedicated Mobile Hero"}</span>
                        </button>
                        {config.heroMobileImage && (
                          <button
                            type="button"
                            onClick={() => setConfig({ ...config, heroMobileImage: "" })}
                            className="text-[10px] uppercase text-red-600 hover:underline px-2"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={config.heroMobileImage || ""}
                        onChange={(e) => setConfig({ ...config, heroMobileImage: e.target.value })}
                        placeholder="Optional mobile image URL (leaves empty to share desktop image)"
                        className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Text Copy Fields + COLOR SELECTION TOOL RIGHT NEXT TO TEXT */}
                <div className="lg:col-span-7 space-y-6 text-xs">
                  {/* COLOR SELECTION TOOL - RIGHT NEXT TO TEXT FORM */}
                  <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/50 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#BBBFCA]/30">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#495464]" />
                        <span className="text-[11px] uppercase font-bold text-[#495464] tracking-wider">
                          Hero Text Color Selector
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#495464] uppercase font-semibold">
                          {config.heroTextColor || "#FFFFFF"}
                        </span>
                        <div
                          className="w-5 h-5 rounded-full border border-black/20 shadow-xs"
                          style={{ backgroundColor: config.heroTextColor || "#FFFFFF" }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-[#495464]/70">
                      Instantly change the headline, edition subtitle, and CTA button text color to contrast with your photo:
                    </p>

                    {/* Color Input + Preset Swatches */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Native HTML Color Picker */}
                      <label className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F4F2] border border-[#BBBFCA] cursor-pointer hover:border-[#495464] transition-colors">
                        <input
                          type="color"
                          value={config.heroTextColor || "#FFFFFF"}
                          onChange={(e) =>
                            setConfig({ ...config, heroTextColor: e.target.value.toUpperCase() })
                          }
                          className="w-4 h-4 rounded-none cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono font-medium text-[#495464]">
                          Custom Color
                        </span>
                      </label>

                      {/* Swatches */}
                      {COLOR_PRESETS.map((preset) => {
                        const isSelected =
                          (config.heroTextColor || "#FFFFFF").toUpperCase() === preset.value.toUpperCase();
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() =>
                              setConfig({ ...config, heroTextColor: preset.value })
                            }
                            title={preset.name}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] font-medium transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#495464] bg-[#495464] text-white shadow-xs"
                                : "border-[#BBBFCA] bg-[#F4F4F2] text-[#495464] hover:border-[#495464]"
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/20"
                              style={{ backgroundColor: preset.value }}
                            />
                            <span>{preset.name}</span>
                            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Inputs */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-semibold text-[#495464]">
                          Hero Season Tagline / Subtitle
                        </label>
                        <span
                          className="text-[10px] font-mono font-medium"
                          style={{ color: config.heroTextColor || "#FFFFFF" }}
                        >
                          ● Live Color
                        </span>
                      </div>
                      <input
                        type="text"
                        value={config.heroSubtitle}
                        onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                        placeholder="EDITION 01 • AUTUMN / WINTER 2026"
                        className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-semibold text-[#495464]">
                          Main Hero Headline
                        </label>
                        <span
                          className="text-[10px] font-mono font-medium"
                          style={{ color: config.heroTextColor || "#FFFFFF" }}
                        >
                          ● Live Color
                        </span>
                      </div>
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

                <div className="space-y-4">
                  {/* Quote section image editor — the image rendered in the
                      Editorial (quote) section on the storefront */}
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1 text-[#495464]">
                      Quote Section Image
                    </label>
                    <input
                      type="file"
                      ref={editorialImageInputRef}
                      onChange={(e) => handleFileUpload(e, "editorial")}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editorialImageInputRef.current?.click()}
                      className="w-full mb-1 inline-flex items-center justify-center gap-2 bg-[#495464] text-[#F4F4F2] py-2 px-3 text-[10px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Editorial Image
                    </button>
                    <input
                      type="text"
                      value={config.editorialImage1}
                      onChange={(e) => setConfig({ ...config, editorialImage1: e.target.value })}
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                    />
                    <p className="mt-1 text-[9px] text-[#495464]/70">
                      Edits the image shown in the quote section below.
                    </p>
                  </div>

                  {/* Live demo — full mockup of the quote (Editorial) section,
                      mirroring the storefront layout of components/home/EditorialSection.tsx */}
                  <div className="relative bg-[#E8E8E8] border border-[#BBBFCA]/60 overflow-hidden shadow-sm">
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-[9px] uppercase px-2 py-0.5 tracking-wider flex items-center gap-1.5 z-10 pointer-events-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Quote section demo</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                      {/* Text column (mirrors the storefront's left column) */}
                      <div className="flex flex-col justify-center space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-[#181a1d]" />
                          <span className="text-[8px] uppercase tracking-[0.2em] text-[#495464]/80 font-semibold font-mono">
                            {config.editorialTag || "EDITORIAL CAMPAIGN"}
                          </span>
                        </div>
                        <h4 className="font-serif text-[#181a1d] leading-tight text-base">
                          {config.editorialTitle || "Permanence in Form & Texture"}
                        </h4>
                        <p className="text-[10px] leading-relaxed text-[#495464]">
                          {config.editorialQuote ||
                            "We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence."}
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#495464] text-[#F4F4F2] text-[8px] tracking-widest uppercase font-medium w-fit">
                          Claim Your Signature Silhouette
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                      {/* Image column (mirrors the storefront's right column) */}
                      <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full bg-[#BBBFCA]/20 overflow-hidden border border-[#BBBFCA]/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.editorialImage1 || "/atelier-still-life.jpg"}
                          alt="Quote section image demo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-8 py-3 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
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
