"use client";

import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ContactPage() {
  const { showToast } = useToast();
  const CONTACT_STORAGE_KEY = "shopy_contact_form_v1";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Restore saved form data on mount
  useEffect(() => {
    document.title = "Contact | SHOPY";
    try {
      const saved = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        // Clear saved draft on success
        try { localStorage.removeItem(CONTACT_STORAGE_KEY); } catch {}
        showToast(data.message || "Message delivered to atelier concierge.", "success");
      } else {
        showToast(data.error || "Failed to deliver message.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            CLIENT CONCIERGE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#495464]">
            Contact Us
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-3">
            Our atelier client care is available Monday through Saturday, 10:00 AM – 7:00 PM PKT.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#495464] mb-3">
                Atelier Headquarters
              </h2>
              <p className="text-xs text-[#495464]/80 uppercase tracking-wider leading-relaxed">
                SHOPY Flagship &amp; Design Studio<br />
                M.M. Alam Road, Gulberg III<br />
                Lahore, Pakistan
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-[#BBBFCA]/30 text-xs tracking-wider text-[#495464]/80">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#495464]" />
                <span>concierge@shopy.fashion</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#495464]" />
                <span>+92 (42) 3578-9000 / WhatsApp Client Line</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#495464]" />
                <span>Direct Nationwide Courier Dispatches</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-12 text-center space-y-4 animate-fadeIn">
                <CheckCircle2 className="w-10 h-10 text-[#495464] mx-auto stroke-[1.5]" />
                <h3 className="font-serif text-2xl font-medium text-[#495464]">
                  Message Transmitted
                </h3>
                <p className="text-xs text-[#495464]/80 tracking-wider uppercase max-w-sm mx-auto">
                  A client advisor has received your inquiry and will respond within 24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const updated = { ...formData, name: e.target.value };
                        setFormData(updated);
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                      }}
                      className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        const updated = { ...formData, email: e.target.value };
                        setFormData(updated);
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                      }}
                      className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sizing inquiry, order tracking, bespoke styling..."
                    value={formData.subject}
                      onChange={(e) => {
                        const updated = { ...formData, subject: e.target.value };
                        setFormData(updated);
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                      }}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="How may our concierge assist you?"
                    value={formData.message}
                      onChange={(e) => {
                        const updated = { ...formData, message: e.target.value };
                        setFormData(updated);
                        try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                      }}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-[#495464] text-[#F4F4F2] py-4 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Transmit Message</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
