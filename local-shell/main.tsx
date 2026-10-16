/**
 * SHOPY instant-launch shell — entry point for the Capacitor WebView.
 *
 * Render tree is the exact landing composition of the real app
 * (app/page.tsx inside app/layout.tsx) with the server-only providers
 * swapped for slim shell providers. The remote application is never
 * replaced — it remains the source of truth, and every navigation,
 * handoff and interaction that needs the backend goes there.
 *
 * First frame: APK-bundled assets only (fonts, images, CSS, this
 * bundle, build-time data snapshot). Everything that touches the
 * network happens after paint and is allowed to fail.
 */
import React from "react";
import { createRoot } from "react-dom/client";

// Install the /api/* retargeting before anything else in this module graph
// fetches; it is a pure local wrapper and is a no-op when already patched.
import { installApiFetchPatch } from "./live";
installApiFetchPatch();

import { dumpTimeline, mark, markFirstFrame } from "./timeline";
mark("js-start");

import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import EditorialSection from "@/components/home/EditorialSection";
import Newsletter from "@/components/home/Newsletter";
import Navbar from "@/components/layout/Navbar";
import StatusBarTint from "@/components/layout/StatusBarTint";
import Footer from "@/components/layout/Footer";
import { ToastProvider } from "@/context/ToastContext";
import { ShellAuthProvider, ShellCartProvider } from "./providers";
import { useLandingData } from "./use-landing-data";

import "../app/globals.css";
import "./shell.css";

function ShellPage() {
  const data = useLandingData();

  const homepage = data?.homepage ?? null;
  const categories = data?.categories ?? [];
  const products = data?.products ?? [];
  const navigation = data?.navigation ?? [];
  const quote = data?.quote ?? null;

  return (
    <>
      <Navbar initialNavItems={navigation} />
      <StatusBarTint />
      <main className="flex-1">
        <Hero initialConfig={homepage} />
        <CollectionGrid initialCategories={categories} />
        <FeaturedProducts initialProducts={products} initialConfig={homepage} />
        <EditorialSection initialQuote={quote} initialConfig={homepage} />
        <Newsletter />
      </main>
      <Footer initialNavItems={navigation} />
    </>
  );
}

export default function mount() {
  const container =
    document.getElementById("root") ??
    (document.body.appendChild(document.createElement("div")) as HTMLElement);

  mark("render-start");
  createRoot(container).render(
    <ShellAuthProvider>
      <ShellCartProvider>
        <ToastProvider>
          <ShellPage />
        </ToastProvider>
      </ShellCartProvider>
    </ShellAuthProvider>
  );
  // The first painted frame of the landing UI + interactive state.
  markFirstFrame(() => {
    mark("interactive");
    // Give React a beat to settle hydration-less state, then report.
    window.setTimeout(() => dumpTimeline(), 400);
  });
}

mount();
