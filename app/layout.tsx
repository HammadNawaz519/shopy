import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import ClientCacheRevalidator from "@/components/common/ClientCacheRevalidator";
import SplashScreen from "@/components/common/SplashScreen";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";

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
  themeColor: "#F4F4F2",
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
        <SplashScreen />
        <ServiceWorkerRegister />
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <ClientCacheRevalidator />
              <Navbar />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer />
              <InstallAppPrompt />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
