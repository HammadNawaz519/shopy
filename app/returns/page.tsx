import React from "react";

export const metadata = {
  title: "Returns",
};

export default function ReturnsPage() {
  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center py-16 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            EXCHANGES &amp; REFUNDS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Returns &amp; Exchanges
          </h1>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#495464]/80 leading-relaxed uppercase tracking-wider">
          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">
              7-Day Exchange Window
            </h2>
            <p>
              If a product does not fit as desired, we offer complimentary size exchanges within 7 days of receipt. The item must be in unwashed, unworn condition with all original tags and packaging intact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
