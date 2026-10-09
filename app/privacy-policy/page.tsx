import React from "react";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-16 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            CLIENT DATA GOVERNANCE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Privacy Policy
          </h1>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#495464]/80 leading-relaxed uppercase tracking-wider">
          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">
              Data Protection &amp; Confidentiality
            </h2>
            <p>
              SHOPY is dedicated to safeguarding your personal information. Client data collected during ordering, registration, or newsletter subscription is strictly used for fulfilling orders, providing concierge support, and dispatching releases.
            </p>
            <p>
              We never sell, rent, or trade client records to third-party marketing entities. All session communications are encrypted using high-grade TLS protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
