import { MetadataRoute } from "next";

// Single source of truth for the PWA web app manifest.
// Icon files referenced below all exist in /public. Colors come from the
// existing SHOPY design (page background #F4F4F2, ink #495464).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SHOPY Atelier",
    short_name: "SHOPY",
    description: "SHOPY Atelier — Architectural Elegance & High-Fashion Ready-To-Wear",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F4F2",
    theme_color: "#F4F4F2",
    categories: ["shopping", "lifestyle", "fashion"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "View Cart",
        url: "/cart",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Account",
        url: "/account",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
