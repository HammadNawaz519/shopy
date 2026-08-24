import React from "react";

export const metadata = {
  title: "Shipping",
};

export default function ShippingPage() {
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
              Nationwide Delivery (Pakistan)
            </h2>
            <p>
              Orders are packaged in signature SHOPY recycled presentation boxes and dispatched from our Lahore atelier via premium insured courier services (TCS / Leopard Express / BlueEx).
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Lahore Deliveries: 1-2 Business Days</li>
              <li>Karachi, Islamabad, Rawalpindi, Faisalabad: 2-3 Business Days</li>
              <li>Other Cities &amp; Regional Centers: 3-4 Business Days</li>
            </ul>
          </div>

          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">
              Shipping Charges
            </h2>
            <p>
              Complimentary Standard Delivery is provided on all orders over <span className="font-semibold text-[#495464]">Rs. 15,000</span>. For orders below Rs. 15,000, a flat dispatch fee of <span className="font-semibold text-[#495464]">Rs. 500</span> is charged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
