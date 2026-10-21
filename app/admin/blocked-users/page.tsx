"use client";

import React, { useEffect, useState } from "react";
import { Loader2, UserX, Trash2, ShieldBan } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/context/ToastContext";

/**
 * Admin "Blocked" panel (side menu -> Blocked).
 *
 * Email input on top: type an email, hit "Block From COD" (or Enter) and it
 * is blocked from Cash on Delivery immediately. The blocked list forms
 * underneath (orders-style rows) with one-tap unblock.
 */
export default function AdminBlockedUsersPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [newBlockedEmail, setNewBlockedEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/blocked-users");
        if (res.ok) {
          const data = await res.json();
          setBlockedList(data.emails || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Replace the whole blocklist server-side; returns true on success.
  const saveBlockedList = async (list: string[]) => {
    try {
      const res = await fetch("/api/admin/blocked-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlockedList(data.emails || list);
        return true;
      }
      showToast(data.error || "Failed to update blocked users.", "error");
      return false;
    } catch {
      showToast("Network error saving blocked users.", "error");
      return false;
    }
  };

  const handleAddBlocked = async () => {
    const email = newBlockedEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Enter a valid email address to block.", "error");
      return;
    }
    if (blockedList.includes(email)) {
      showToast("That email is already blocked.", "info");
      setNewBlockedEmail("");
      return;
    }
    setBusy(true);
    const ok = await saveBlockedList([...blockedList, email]);
    setBusy(false);
    if (ok) {
      setNewBlockedEmail("");
      showToast(`${email} is now blocked from Cash on Delivery.`, "success");
    }
  };

  const handleRemoveBlocked = async (email: string) => {
    setBusy(true);
    const ok = await saveBlockedList(blockedList.filter((e) => e !== email));
    setBusy(false);
    if (ok) showToast(`${email} can use Cash on Delivery again.`, "success");
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Blocked Users"
        subtitle="Cash on Delivery Blocklist"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[800px] w-full mx-auto space-y-6">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#495464]" />
          </div>
        ) : (
          <>
            {/* 1. Add email - input on top */}
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <UserX className="w-4 h-4 text-[#8B2C2C]" />
                <h2 className="font-serif text-lg font-medium text-[#495464]">
                  Block From Cash on Delivery
                </h2>
              </div>
              <p className="text-[11px] text-[#495464]/60 tracking-wider uppercase mb-4">
                Type an email below - it is blocked from COD orders instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  placeholder="customer@gmail.com"
                  value={newBlockedEmail}
                  onChange={(e) => setNewBlockedEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBlocked();
                    }
                  }}
                  className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-mono text-[11px] text-[#495464] placeholder:text-[#495464]/35"
                />
                <button
                  type="button"
                  onClick={handleAddBlocked}
                  disabled={busy || !newBlockedEmail.trim()}
                  className="inline-flex items-center justify-center gap-2 bg-[#8B2C2C] text-[#F4F4F2] px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold hover:bg-[#7A2525] transition-colors disabled:opacity-40"
                >
                  <UserX className="w-3.5 h-3.5" />
                  {busy ? "Saving..." : "Block From COD"}
                </button>
              </div>
            </div>

            {/* 2. Blocked list - orders-style rows underneath */}
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldBan className="w-4 h-4 text-[#495464]/70" />
                  <h2 className="font-serif text-lg font-medium text-[#495464]">
                    Blocked List
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#495464]/60">
                  {blockedList.length} Blocked
                </span>
              </div>

              {blockedList.length === 0 ? (
                <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 px-4 py-8 text-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#495464]/50 font-mono">
                    No blocked users yet
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedList.map((email, index) => (
                    <div
                      key={email}
                      className="flex items-center justify-between gap-3 bg-[#E8E8E8]/60 border border-[#BBBFCA]/40 px-3.5 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[10px] text-[#495464]/40 w-6 text-right flex-shrink-0">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[12px] font-semibold text-[#495464] truncate">
                            {email}
                          </p>
                          <span className="inline-block mt-1 text-[9px] uppercase tracking-widest font-semibold text-[#8B2C2C] bg-[#8B2C2C]/10 border border-[#8B2C2C]/30 px-1.5 py-0.5">
                            Blocked From COD
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlocked(email)}
                        disabled={busy}
                        title="Unblock this email"
                        className="shrink-0 p-2 text-[#8B2C2C] hover:bg-[#8B2C2C] hover:text-[#F4F4F2] transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-[#495464]/60 leading-relaxed mt-4">
                Blocked customers are still able to place orders with Bank
                Transfer / Raast - only Cash on Delivery is rejected for them,
                on every order attempt.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
