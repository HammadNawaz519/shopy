import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
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
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import OfflineCacheWarmer from "@/components/pwa/OfflineCacheWarmer";
import OfflineRecovery from "@/components/pwa/OfflineRecovery";
import NativeGoogleAuthResume from "@/components/auth/NativeGoogleAuthResume";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>

      <body className="font-sans antialiased min-h-screen flex flex-col bg-[#F4F4F2] text-[#495464]">
        <ServiceWorkerRegister />
        <OfflineCacheWarmer />
        <OfflineRecovery />
        <EnhancedAuthProvider>
          <EnhancedCartProvider>
            <ToastProvider>
              <ClientCacheRevalidator />
              <IdlePrefetcher />
              <Navbar />
              <StatusBarTint />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer />
              <InstallAppPrompt />
              <NativeGoogleAuthResume />
            </ToastProvider>
          </EnhancedCartProvider>
        </EnhancedAuthProvider>
      </body>
    </html>
  );
}
