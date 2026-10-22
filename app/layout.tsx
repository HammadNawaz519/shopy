import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { getCachedNavigationItems, type NavigationItem } from "@/lib/db/store";
import "./globals.css";
import { EnhancedAuthProvider } from "@/context/EnhancedAuthContext";
import { EnhancedCartProvider } from "@/context/EnhancedCartContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/layout/Navbar";
import StatusBarTint from "@/components/layout/StatusBarTint";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import ClientCacheRevalidator from "@/components/common/ClientCacheRevalidator";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import IdlePrefetcher from "@/components/pwa/IdlePrefetcher";
import OfflineCacheWarmer from "@/components/pwa/OfflineCacheWarmer";
import OfflineRecovery from "@/components/pwa/OfflineRecovery";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Inline boot indicator (injected into the HTML head of every page, no JS
 * bundle required). The app shell is beige (native launch screen and the
 * document background match), so a slow first load would otherwise be a
 * long blank screen. This shows a small brand spinner ONLY when the first
 * paint has not happened within ~450 ms — cold app launches and slow
 * networks. Fast launches and service-worker-cached launches reach
 * DOMContentLoaded well before that and never see it. It self-removes;
 * styles live in app/globals.css (#shopy-boot).
 */
const SHOPY_BOOT_SCRIPT = `(function(){
  var timer = setTimeout(function(){
    var d = document.createElement("div");
    d.id = "shopy-boot";
    d.innerHTML =
      '<div class="sb-box">' +
      '<div class="sb-ring"></div>' +
      '<div class="sb-word">SHOPY</div>' +
      "</div>";
    (document.body || document.documentElement).appendChild(d);
  }, 450);
  function hide(){
    clearTimeout(timer);
    var el = document.getElementById("shopy-boot");
    if (!el) return;
    el.classList.add("shopy-boot-hide");
    setTimeout(function(){ el.remove(); }, 400);
  }
  function onReady(){
    // One frame after the full document is parsed, so the real interface
    // (server-rendered markup) is already painted underneath.
    requestAnimationFrame(function(){ setTimeout(hide, 60); });
  }
  if (document.readyState !== "loading") { onReady(); }
  else { document.addEventListener("DOMContentLoaded", onReady, { once: true }); }
})();`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F2" },
    { media: "(prefers-color-scheme: dark)", color: "#F4F4F2" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "SHOPY",
    template: "%s | SHOPY",
  },
  description: "SHOPY Atelier",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SHOPY",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=7", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=7", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=7", sizes: "any" },
    ],
    shortcut: "/favicon-32x32.png?v=7",
    apple: [
      { url: "/apple-touch-icon.png?v=7", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SHOPY",
    description: "SHOPY Atelier",
    url: "https://shopy.fashion",
    siteName: "SHOPY",
    locale: "en_PK",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-render the navigation items (Redis-cached, 30 min TTL, invalidated
  // instantly on admin edits) so the Navbar and Footer paint their links on
  // the very first frame — no client-side /api/navigation fetch on launch.
  // Fail-safe: any lookup error falls back to the components' own defaults.
  let navItems: NavigationItem[] = [];
  try {
    navItems = (await getCachedNavigationItems(true)) ?? [];
  } catch {
    navItems = [];
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <Script id="shopy-boot" strategy="beforeInteractive">
        {SHOPY_BOOT_SCRIPT}
      </Script>

      <body className="font-sans antialiased min-h-screen flex flex-col bg-[#F4F4F2] text-[#495464]">
        <ServiceWorkerRegister />
        <OfflineCacheWarmer />
        <OfflineRecovery />
        <EnhancedAuthProvider>
          <EnhancedCartProvider>
            <ToastProvider>
              <ClientCacheRevalidator />
              <IdlePrefetcher />
              <Navbar initialNavItems={navItems} />
              <StatusBarTint />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer initialNavItems={navItems} />
            </ToastProvider>
          </EnhancedCartProvider>
        </EnhancedAuthProvider>
      </body>
    </html>
  );
}
