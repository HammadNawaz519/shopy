import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";

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

export const metadata: Metadata = {
  title: "SHOPY — Editorial Fashion & Modern Essentials",
  description:
    "SHOPY is an architectural fashion and lifestyle maison. Explore tailored silhouettes, heavyweight knitwear, handcrafted footwear, and artisanal fragrances.",
  keywords: [
    "SHOPY",
    "Fashion",
    "Editorial",
    "Luxury Clothing",
    "Modern Essentials",
    "Extrait de Parfum",
    "Tracksuits",
    "Tailored Trousers",
  ],
  authors: [{ name: "SHOPY Atelier" }],
  openGraph: {
    title: "SHOPY — Editorial Fashion & Modern Essentials",
    description:
      "Architectural silhouettes, tactile fabrics, and artisanal fragrances crafted for permanence.",
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
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
