import React from "react";
import { getCachedStoreSettings } from "@/lib/db/store";

export const metadata = {
  title: "Shipping",
};

/**
 * Shipping Policy — the fees shown here are read LIVE from the admin
 * Settings (store_settings), so whatever the admin enters in
 * Admin → Settings appears on this page automatically.
 */
export default async function ShippingPage() {
  let settings: { freeShippingThreshold: number; flatShippingRate: number; currencySymbol: string };
  try {
    settings = await getCachedStoreSettings();
  } catch {
    settings = { freeShippingThreshold: 15000, flatShippingRate: 500, currencySymbol: "Rs." };
  }

  const sym = settings.currencySymbol || "Rs.";
  const threshold = `${sym} ${Number(settings.freeShippingThreshold).toLocaleString()}`;
  const flatRate = `${sym} ${Number(settings.flatShippingRate).toLocaleString()}`;

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center py-16 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            LOGISTICS &amp; DISPATCH
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Shipping Policy
          </h1>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#495464]/80 leading-relaxed uppercase tracking-wider">
          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">
              Pakistan Delivery via PostEx
            </h2>
            <p>
              Orders are securely packaged and dispatched through PostEx, Pakistan's express delivery service.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Delivery within 2 to 3 Business Days</li>
            </ul>
          </div>

          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">
              Shipping Charges
            </h2>
            <p>
              Complimentary delivery on all orders over{" "}
              <span className="font-bold text-[#495464]">{threshold}</span>. For orders below this
              threshold, a flat delivery fee of{" "}
              <span className="font-bold text-[#495464]">{flatRate}</span> applies.
            </p>
            <p>
              Out of City delivery: <span className="font-bold text-[#495464]">Rs. 100</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
