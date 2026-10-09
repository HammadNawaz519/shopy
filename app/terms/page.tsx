import React from "react";

export const metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <div className="pt-16 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            LEGAL FRAMEWORK
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Terms &amp; Conditions
          </h1>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#495464]/80 leading-relaxed uppercase tracking-wider">
          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">
              Terms of Service
            </h2>
            <p>
              By accessing and placing orders through SHOPY, you agree to our terms governing authenticity, pricing, intellectual property, and atelier ordering. All designs, photography, and sensory trademarks remain the sole property of SHOPY.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
