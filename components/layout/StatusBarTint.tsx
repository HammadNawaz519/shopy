"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Native status-bar tint for the landing page.
 *
 * Inside the Capacitor shell the app is drawn edge-to-edge, so the strip behind
 * the phone's clock / battery / signal icons is simply the page's top
 * `env(safe-area-inset-top)` region. On the landing page that region would
 * otherwise show the page background seen through the navbar's translucent
 * glass — a flat grey band sitting above the hero.
 *
 * This samples the average colour of the exact slice of the hero photo under
 * the strip (after the hero's brightness / contrast / gradient grading and
 * the navbar's glass) and paints a matching solid strip, so it reads as a
 * seamless continuation of the landing page — for whatever image is
 * configured.
 * Once the hero scrolls past the top the strip switches to the navbar's
 * off-white, mirroring the bar's white-on-scroll state.
 *
 * It renders only on "/" and only has a height where a safe-area inset exists
 * (i.e. the native app), so it is inert in a normal browser.
 */
export default function StatusBarTint() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [tint, setTint] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Sample the hero's top colour.
  useEffect(() => {
    if (!isHome) {
      setTint(null);
      return;
    }
    let cancelled = false;

    const run = () => {
      sampleHeroTopColour()
        .then((colour) => {
          if (!cancelled && colour) setTint(colour);
        })
        .catch(() => {});
    };

    run();
    // The hero may still be decoding on first paint, and the layout reflows on
    // rotation — retry once and re-sample on both.
    const retry = window.setTimeout(run, 900);
    window.addEventListener("resize", run);
    window.addEventListener("orientationchange", run);
    window.addEventListener("load", run);

    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      window.removeEventListener("resize", run);
      window.removeEventListener("orientationchange", run);
      window.removeEventListener("load", run);
    };
  }, [isHome]);

  // White-on-scroll, mirroring the navbar's own 30px threshold.
  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (!isHome) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
      style={{
        height: "env(safe-area-inset-top, 0px)",
        backgroundColor: scrolled ? "#F4F4F2" : tint || "transparent",
        transition: "background-color 300ms ease",
      }}
    />
  );
}

/** Average colour of the top slice of the hero, graded exactly like the hero. */
async function sampleHeroTopColour(): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const heroSection = document.querySelector("main section");
  if (!heroSection) return null;

  const images = Array.from(heroSection.querySelectorAll("img"));
  const heroImg =
    (images.find((el) => el.getClientRects().length > 0) as HTMLImageElement | undefined) ||
    (images[0] as HTMLImageElement | undefined);
  if (!heroImg) return null;

  // currentSrc is Next's same-origin /_next/image URL, so the canvas stays
  // untainted and getImageData works.
  const src = heroImg.currentSrc || heroImg.src;
  if (!src) return null;

  const stripHeight = measureSafeAreaTop();
  if (stripHeight <= 0) return null; // not the native shell — nothing to paint

  await waitForImage(heroImg);
  const bitmap = await loadImage(src);
  const naturalWidth = bitmap.naturalWidth;
  const naturalHeight = bitmap.naturalHeight;
  if (!naturalWidth || !naturalHeight) return null;

  // The hero fills the viewport (h-screen w-full) with object-cover / center,
  // so reproduce that crop to find the source pixels sitting under the strip.
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scale = Math.max(viewportWidth / naturalWidth, viewportHeight / naturalHeight);
  const visibleWidth = viewportWidth / scale;
  const visibleHeight = viewportHeight / scale;
  const sourceX = (naturalWidth - visibleWidth) / 2;
  const sourceY = (naturalHeight - visibleHeight) / 2;
  const sliceHeight = Math.min(visibleHeight, stripHeight / scale);
  if (visibleWidth <= 0 || sliceHeight <= 0) return null;

  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(
      bitmap,
      sourceX,
      sourceY,
      visibleWidth,
      sliceHeight,
      0,
      0,
      SIZE,
      SIZE
    );
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
    let r = 0;
    let g = 0;
    let b = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    return gradeHeroColour(r / count, g / count, b / count);
  } catch {
    // Tainted canvas (unexpected cross-origin image) — fall back to the
    // navbar's own glass rather than risk a mismatch.
    return null;
  }
}

/**
 * The grading the strip must reproduce so it blends seamlessly:
 *  - the hero's own `brightness-[0.92] contrast-[1.03]` + top of its
 *    `to-black/25` gradient overlay (what the photo looks like as rendered),
 *  - plus the navbar's `bg-black/20` glass over that row, which the strip
 *    sits directly above — without it a hard seam would form between the
 *    strip and the SHOPY row below.
 */
function gradeHeroColour(r: number, g: number, b: number): string {
  const channel = (value: number) => {
    let v = value / 255;
    v *= 0.92; // brightness-[0.92]
    v = (v - 0.5) * 1.03 + 0.5; // contrast-[1.03]
    v *= 0.75; // bg-gradient ... to-black/25 at the top edge
    v *= 0.8; // navbar glass bg-black/20
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  return `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`;
}

/** Height of `env(safe-area-inset-top)` in CSS px (0 in a regular browser). */
function measureSafeAreaTop(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("hero image failed to load"));
    image.src = src;
  });
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(done, 3000);
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  });
}
