import React from "react";

export const metadata = {
  title: "FAQ",
};

export default function FAQPage() {
  const faqs = [
    {
      q: "Where are SHOPY garments and products manufactured?",
      a: "Our knitwear, trousers, and tailoring are crafted in small-batch runs in Lahore, Pakistan using imported organic cottons, French terry, and Australian merino wool. Our fragrances are compounded with Swiss and French fragrance oils.",
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept Cash on Delivery (COD) across Pakistan, as well as Visa, Mastercard, and PayPak card payments via our secure TLS 256-bit encrypted gateway.",
    },
    {
      q: "How does complimentary shipping work?",
      a: "All orders with a subtotal exceeding Rs. 15,000 automatically qualify for free standard insured courier delivery anywhere in Pakistan. For orders below this threshold, a flat fee of Rs. 500 is applied.",
    },
    {
      q: "What is the policy for returns and size exchanges?",
      a: "We accept unworn, unwashed garments with original tags intact within 14 days of delivery for exchange or store credit.",
    },
    {
      q: "Are the fragrances unisex?",
      a: "Yes. All SHOPY fragrances are developed as non-gendered olfactory compositions focusing on wood resins, amber, vetiver, and smoky botanicals.",
    },
  ];

  return (
    <div className="pt-16 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            CLIENT ASSISTANCE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="space-y-8">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-3"
            >
              <h3 className="font-serif text-lg sm:text-xl font-medium text-[#495464]">
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-[#495464]/80 leading-relaxed tracking-wider uppercase">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
