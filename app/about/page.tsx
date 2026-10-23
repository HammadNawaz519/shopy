import React from "react";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center py-16 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            ABOUT SHOPY
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            About SHOPY
          </h1>
        </div>

        <div className="space-y-8 text-sm sm:text-base text-[#495464] leading-relaxed">
          <p>
            SHOPY is an e-commerce brand. We design, source and deliver quality products,
            from everyday essentials to signature pieces.
          </p>

          <div>
            <h2 className="font-serif text-xl font-medium text-[#495464] mb-2">
              Payments We Accept
            </h2>
            <p>
              Cash on Delivery (COD) across Pakistan, bank transfer, Raast, and card payments
              (Visa / Mastercard).
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl font-medium text-[#495464] mb-2">
              How Delivery Works
            </h2>
            <p>
              Your order is packed and dispatched through PostEx and reaches you within
              2 to 3 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
