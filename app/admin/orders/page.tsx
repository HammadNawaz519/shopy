"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  Printer,
  Loader2,
  X,
  MapPin,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
  ChevronDown,
  FileText,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderInvoicePrint, { PAPER_SIZES, getPaperSize, MM_TO_PX, PaperSizeId } from "@/components/admin/OrderInvoicePrint";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAdminOrderNotification, getAdminLastSeenOrderAt } from "@/context/AdminOrderNotificationContext";

const PRINT_PAPER_STORAGE_KEY = "shopy_print_paper_size";

/** Thick-stroke grey square: the order has NOT been checked yet (new). */
function OpenSquare() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0" aria-label="Not checked yet">
      <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="#8A919C" strokeWidth="2.2" />
    </svg>
  );
}

/** Thick-stroke green square: the order HAS been checked (seen). */
function CheckedSquare() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0" aria-label="Checked">
      <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="#16A34A" strokeWidth="2.2" />
      <path d="M4.6 8.4 L7 10.8 L11.4 5.6" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const initialStatus = searchParams.get("status") || "ALL";

  const { showToast } = useToast();
  const { markAllAsSeen } = useAdminOrderNotification();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [printingOrder, setPrintingOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  // ---- Messages-style "new vs checked" tracking ---------------------------
  // Anchor = the moment the admin last opened this section. Orders created
  // after it are "new" (dark cards on top); everything older is "checked"
  // and grouped under date headers, like a chat list.
  const anchorRef = useRef<string | null | undefined>(undefined);
  if (anchorRef.current === undefined) {
    anchorRef.current = getAdminLastSeenOrderAt();
  }
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  // ---- Print preview & paper size ------------------------------------------
  const [paperSize, setPaperSize] = useState<PaperSizeId>(() => {
    try {
      const saved = localStorage.getItem(PRINT_PAPER_STORAGE_KEY) as PaperSizeId | null;
      if (saved && PAPER_SIZES.some((p) => p.id === saved)) return saved;
    } catch {}
    return "a4";
  });
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewFit, setPreviewFit] = useState(1);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handlePaperSizeChange = (id: PaperSizeId) => {
    setPaperSize(id);
    try {
      localStorage.setItem(PRINT_PAPER_STORAGE_KEY, id);
    } catch {}
  };

  // Fit the selected paper into the preview area (updates immediately on size change)
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => {
      const paper = getPaperSize(paperSize);
      const w = paper.wMm * MM_TO_PX;
      const h = paper.hMm * MM_TO_PX;
      setPreviewFit(Math.min((el.clientWidth - 24) / w, (el.clientHeight - 24) / h, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paperSize, printingOrder]);

  // Trigger the native print dialog (document.title = order number so
  // "Save as PDF" suggests a clean filename). Closes after printing.
  const handlePrintClick = () => {
    if (!printingOrder) return;
    const originalTitle = document.title;
    document.title = printingOrder.orderNumber || `Order-${printingOrder.id}`;
    const afterPrint = () => {
      document.title = originalTitle;
      setPrintingOrder(null);
      window.removeEventListener("afterprint", afterPrint);
    };
    window.addEventListener("afterprint", afterPrint);
    setTimeout(() => window.print(), 50);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.orders || [];
        setOrders(list);

        // First load only: capture which orders arrived since the admin last
        // checked this section — they render as dark "NEW" cards on top.
        if (firstLoadRef.current) {
          firstLoadRef.current = false;
          const anchor = anchorRef.current;
          if (anchor) {
            const anchorMs = new Date(anchor).getTime();
            setNewOrderIds(
              new Set(
                list
                  .filter((o: any) => new Date(o.createdAt).getTime() > anchorMs)
                  .map((o: any) => o.id)
              )
            );
          }
        }

        markAllAsSeen();

        if (highlightId) {
          const matched = list.find((o: any) => o.id === highlightId);
          if (matched) setSelectedOrder(matched);
        }
      }
    } catch {
      showToast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Local filter mirror so the "NEW" attention section follows the same
  // status/search view as the table below it.
  const query = search.trim().toLowerCase();
  const matchesLocalFilter = (o: any) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (!query) return true;
    const haystack = [
      o.orderNumber,
      o.shippingAddress?.firstName,
      o.shippingAddress?.lastName,
      o.shippingAddress?.email,
      o.shippingAddress?.phone,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  };

  const newOrders = orders.filter((o) => newOrderIds.has(o.id) && matchesLocalFilter(o));
  const checkedOrders = orders.filter((o) => !newOrderIds.has(o.id) && matchesLocalFilter(o));

  // Checked orders grouped by arrival day (newest first) — chat-style date headers
  const checkedGroups: { key: string; label: string; items: any[] }[] = [];
  {
    const byDay: Record<string, { key: string; label: string; items: any[] }> = {};
    const todayKey = new Date().toDateString();
    const yesterdayKey = new Date(Date.now() - 86400000).toDateString();
    for (const o of checkedOrders) {
      const d = new Date(o.createdAt);
      const key = d.toDateString();
      if (!byDay[key]) {
        const fullDate = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        const label =
          key === todayKey
            ? `Today • ${fullDate}`
            : key === yesterdayKey
            ? `Yesterday • ${fullDate}`
            : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        byDay[key] = { key, label, items: [] };
      }
      byDay[key].items.push(o);
    }
    checkedGroups.push(...Object.values(byDay)); // server returns orders newest-first
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Order status updated to ${formatStatusLabel(newStatus)}`, "success");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (data.order ? { ...o, ...data.order } : { ...o, status: newStatus }) : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => (data.order ? { ...prev, ...data.order } : { ...prev, status: newStatus }));
        }
      } else {
        showToast(data.error || "Failed to update order status.", "error");
      }
    } catch {
      showToast("Network error updating status.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Payment status updated to ${newPaymentStatus}`, "success");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (data.order ? { ...o, ...data.order } : { ...o, paymentStatus: newPaymentStatus }) : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => (data.order ? { ...prev, ...data.order } : { ...prev, paymentStatus: newPaymentStatus }));
        }
      } else {
        showToast(data.error || "Failed to update payment status.", "error");
      }
    } catch {
      showToast("Network error updating payment status.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const formatStatusLabel = (st: string) => {
    switch (String(st).toUpperCase()) {
      case "VERIFYING_PAYMENT":
      case "AWAITING_PAYMENT_VERIFICATION":
        return "Verifying Payment";
      case "CONFIRMED":
        return "Confirmed";
      case "PREPARING":
      case "PROCESSING":
        return "Preparing";
      case "SHIPPED":
        return "Shipped";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "DELIVERED":
        return "Delivered";
      case "CANCELLED":
        return "Cancelled";
      case "RETURN_REQUESTED":
        return "Return Requested";
      case "RETURNED":
        return "Returned";
      case "REFUNDED":
        return "Refunded";
      default:
        return st;
    }
  };

  const getPaymentBadge = (ord: any) => {
    const isBank = ord.paymentMethod === "bank_transfer" || ord.paymentMethod === "online";
    const methodText = isBank ? "BANK" : "COD";
    const isPaid = ord.paymentStatus === "PAID";
    const isRefunded = ord.paymentStatus === "REFUNDED";
    const statusText = isPaid ? "PAID" : isRefunded ? "REFUNDED" : "UNPAID";

    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider bg-[#E8E8E8] text-[#495464] border border-[#BBBFCA] whitespace-nowrap">
        {methodText} · {statusText}
      </span>
    );
  };

  const statusTabs = [
    { label: "All Orders", value: "ALL" },
    { label: "Verifying Payment", value: "VERIFYING_PAYMENT" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Preparing", value: "PREPARING" },
    { label: "Shipped", value: "SHIPPED" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Order Fulfillment"
        subtitle="Manage & Dispatch Customer Orders"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto space-y-6">
        {/* Filter Tabs & Search Bar */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#BBBFCA]/20">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.value
                    ? "bg-[#495464] text-[#F4F4F2]"
                    : "bg-[#E8E8E8] text-[#495464] hover:bg-[#BBBFCA]/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#495464]/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order #, Name, Email, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#E8E8E8] border border-[#BBBFCA] pl-9 pr-3 py-2 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#495464] text-[#F4F4F2] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#363E4B] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Orders Table */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#495464]/60 uppercase tracking-widest">
              No orders found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full table-fixed text-left text-xs tracking-wider">
                <thead className="bg-[#E8E8E8]/70 border-b border-[#BBBFCA]/40 text-[#495464] uppercase text-[10px]">
                  <tr>
                    <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Order ID</th>
                    <th className="w-[12%] px-2 py-3 font-semibold whitespace-nowrap">Time</th>
                    <th className="w-[14%] px-2.5 py-3 font-semibold whitespace-nowrap">Customer</th>
                    <th className="w-[6%] px-2 py-3 font-semibold whitespace-nowrap text-left">Items</th>
                    <th className="w-[10%] px-2 py-3 font-semibold whitespace-nowrap">Total</th>
                    <th className="w-[12%] px-2 py-3 font-semibold whitespace-nowrap text-center">Payment</th>
                    <th className="w-[13%] px-2 py-3 font-semibold whitespace-nowrap text-center">Order Status</th>
                    <th className="w-[22%] px-2.5 py-3 font-semibold text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {/* NEW orders first: same rows as the viewed orders below,
                      with a subtly darker row and a grey (open) square —
                      they become green squares under their date header
                      once the admin has seen them. */}
                  {newOrders.map((ord: any) => (
                    <tr key={ord.id} className="bg-[#E8E8E8]/70 hover:bg-[#E8E8E8] transition-colors">
                      <td className="px-3 py-3 font-serif font-semibold text-[#495464] truncate">
                        {ord.orderNumber}
                      </td>
                      <td className="px-2 py-3 text-[#495464]/70 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {formatTime(ord.createdAt)}
                          <OpenSquare />
                        </div>
                      </td>
                      <td className="px-2.5 py-3 min-w-0">
                        <span className="font-medium block text-[#495464] truncate">
                          {ord.shippingAddress?.firstName || "Client"} {ord.shippingAddress?.lastName || ""}
                        </span>
                        <span className="text-[10px] text-[#495464]/60 block truncate">{ord.shippingAddress?.city || "Pakistan"}</span>
                      </td>
                      <td className="px-2 py-3 text-[#495464]/80 whitespace-nowrap text-left">
                        {(ord.items || []).length} {(ord.items || []).length === 1 ? "pc" : "pcs"}
                      </td>
                      <td className="px-2 py-3 font-serif font-semibold text-[#495464] whitespace-nowrap">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        {getPaymentBadge(ord)}
                      </td>
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        <select
                          value={ord.status}
                          disabled={updating}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          className="bg-[#F4F4F2] border border-[#BBBFCA] px-1 py-1 text-[10px] uppercase font-semibold text-[#495464] focus:outline-none cursor-pointer w-full max-w-[100px] h-[28px] text-center"
                        >
                          <option value="VERIFYING_PAYMENT">VERIFYING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PREPARING">PREPARING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="OUT_FOR_DELIVERY">DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="RETURN_REQUESTED">RETURN REQ</option>
                          <option value="RETURNED">RETURNED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </td>
                      <td className="px-2.5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1 flex-nowrap">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2 py-1 text-[10.5px] uppercase font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap h-[28px]"
                          >
                            <Eye className="w-3 h-3 flex-shrink-0" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setPrintingOrder(ord)}
                            className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2 py-1 text-[10.5px] uppercase font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap h-[28px]"
                          >
                            <Printer className="w-3 h-3 flex-shrink-0" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Checked (seen) orders, grouped under date headers */}
                  {checkedGroups.map((group) => (
                    <React.Fragment key={group.key}>
                      <tr>
                        <td
                          colSpan={8}
                          className="bg-[#E8E8E8]/80 border-b border-[#BBBFCA]/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#495464]"
                        >
                          {group.label}
                        </td>
                      </tr>
                      {group.items.map((ord: any) => {
                        return (
                      <tr key={ord.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                        <td className="px-3 py-3 font-serif font-semibold text-[#495464] truncate">
                          {ord.orderNumber}
                        </td>
                        <td className="px-2 py-3 text-[#495464]/70 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {formatTime(ord.createdAt)}
                            <CheckedSquare />
                          </div>
                        </td>
                        <td className="px-2.5 py-3 min-w-0">
                          <span className="font-medium block text-[#495464] truncate">
                            {ord.shippingAddress?.firstName || "Client"} {ord.shippingAddress?.lastName || ""}
                          </span>
                          <span className="text-[10px] text-[#495464]/60 block truncate">{ord.shippingAddress?.city || "Pakistan"}</span>
                        </td>
                        <td className="px-2 py-3 text-[#495464]/80 whitespace-nowrap text-left">
                          {(ord.items || []).length} {(ord.items || []).length === 1 ? "pc" : "pcs"}
                        </td>
                        <td className="px-2 py-3 font-serif font-semibold text-[#495464] whitespace-nowrap">
                          {formatPrice(ord.total)}
                        </td>
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          {getPaymentBadge(ord)}
                        </td>
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          <select
                            value={ord.status}
                            disabled={updating}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            className="bg-[#E8E8E8] border border-[#BBBFCA] px-1 py-1 text-[10px] uppercase font-semibold text-[#495464] focus:outline-none cursor-pointer w-full max-w-[100px] h-[28px] text-center"
                          >
                            <option value="VERIFYING_PAYMENT">VERIFYING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PREPARING">PREPARING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="OUT_FOR_DELIVERY">DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="RETURN_REQUESTED">RETURN REQ</option>
                            <option value="RETURNED">RETURNED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </td>
                        <td className="px-2.5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1 flex-nowrap">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2 py-1 text-[10.5px] uppercase font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap h-[28px]"
                          >
                            <Eye className="w-3 h-3 flex-shrink-0" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setPrintingOrder(ord)}
                            className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2 py-1 text-[10.5px] uppercase font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap h-[28px]"
                          >
                            <Printer className="w-3 h-3 flex-shrink-0" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                      </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Drawer / Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative w-full max-w-xl bg-[#F4F4F2] text-[#495464] h-full z-10 shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 animate-slideLeft">
              <div className="flex items-center justify-between border-b border-[#BBBFCA]/40 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#495464]/60 block font-semibold">
                    Order Details
                  </span>
                  <h3 className="font-serif text-2xl font-medium text-[#495464]">
                    {selectedOrder.orderNumber}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintingOrder(selectedOrder)}
                    className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap"
                  >
                    <Printer className="w-3 h-3 flex-shrink-0" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 text-[#495464] hover:opacity-70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1">
                    Order Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    disabled={updating}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] font-medium"
                  >
                    <option value="VERIFYING_PAYMENT">Verifying Payment</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURN_REQUESTED">Return Requested</option>
                    <option value="RETURNED">Returned</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1">
                    Payment Status
                  </label>
                  <select
                    value={selectedOrder.paymentStatus}
                    disabled={updating}
                    onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] font-medium"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>
              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-[#495464]">
                  Ordered Pieces ({(selectedOrder.items || []).length})
                </h4>
                <div className="divide-y divide-[#BBBFCA]/20 border-y border-[#BBBFCA]/30">
                  {(selectedOrder.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name || "Product"}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-[#495464]/60">
                              SHOPY
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-serif text-sm font-medium text-[#495464]">{item.name || "Product Item"}</p>
                          <p className="text-[10px] text-[#495464]/60">
                            Qty: {item.quantity || 1} • Size: {item.size || "Standard"} • Color: {item.color || "Default"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#495464]">
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 p-4 space-y-2 text-xs tracking-wider">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                </div>
                {(selectedOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedOrder.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Shipping</span>
                  <span>{(selectedOrder.shipping || 0) === 0 ? "Free" : formatPrice(selectedOrder.shipping || 0)}</span>
                </div>
                <div className="flex justify-between font-serif text-base font-semibold text-[#495464] pt-2 border-t border-[#BBBFCA]/30">
                  <span>Total Amount</span>
                  <span>{formatPrice(selectedOrder.total || 0)}</span>
                </div>
              </div>

              {/* Shipping & Recipient Info */}
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 p-4 space-y-2 text-xs">
                <h4 className="text-[11px] uppercase tracking-widest font-semibold text-[#495464] border-b border-[#BBBFCA]/30 pb-2">
                  Client &amp; Destination Details
                </h4>
                <p className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#495464]/60" />
                  <span>
                    {selectedOrder.shippingAddress?.firstName || "Client"} {selectedOrder.shippingAddress?.lastName || ""}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#495464]/60" />
                  <span>{selectedOrder.shippingAddress?.email || "No email"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#495464]/60" />
                  <span>
                    <span className="text-[#495464]/70">Phone (Payment / WhatsApp): </span>
                    <span className="font-mono font-semibold">{selectedOrder.shippingAddress?.phone || "No phone"}</span>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#495464]/60 mt-0.5" />
                  <span>
                    {selectedOrder.shippingAddress?.address || "Address unspecified"}, {selectedOrder.shippingAddress?.city || "Pakistan"}
                    {selectedOrder.shippingAddress?.province ? `, ${selectedOrder.shippingAddress.province}` : ""}
                    {selectedOrder.shippingAddress?.postalCode ? ` ${selectedOrder.shippingAddress.postalCode}` : ""}
                  </span>
                </p>
              </div>

              {/* Google Sheets Live Synchronization Status */}
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-2">
                  <h4 className="text-[11px] uppercase tracking-widest font-semibold text-[#495464] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#495464]/70" />
                    <span>Google Sheets Sync</span>
                  </h4>
                  <span className="text-[10px] text-[#495464]/60">
                    Live Operations Mirror
                  </span>
                </div>
                <div className="bg-[#F4F4F2] border border-[#BBBFCA]/30 p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[#495464] text-[11px] block">
                      Spreadsheet Status
                    </span>
                    <span className="text-[10px] text-[#495464]/70">
                      {selectedOrder.sheetsSync?.syncedAt
                        ? `Last synced: ${new Date(selectedOrder.sheetsSync.syncedAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Ready to synchronize on status events"}
                    </span>
                  </div>
                  <div>
                    {selectedOrder.sheetsSync?.status === "FAILED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5">
                        <span>Sync Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-[10px] uppercase font-medium tracking-wider bg-[#495464] text-[#F4F4F2] border border-[#495464] whitespace-nowrap">
                        Synchronized
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Preview — paper size selector + live preview. Switching the
            paper resizes/rescales the slip immediately; Print honors the
            selected sheet dimensions via the injected @page rule. */}
        {printingOrder && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs no-print flex">
            <div className="w-full h-full sm:m-4 bg-[#F4F4F2] sm:border sm:border-[#BBBFCA]/40 sm:shadow-2xl flex flex-col animate-fadeIn">
              {/* Modal Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#BBBFCA]/40 px-4 sm:px-6 py-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/60 block">
                    Print Preview
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-[#495464] truncate">
                    {printingOrder.orderNumber}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Paper size dropdown — label + dimensions per option */}
                  <div className="relative">
                    <button
                      onClick={() => setSizeMenuOpen((v) => !v)}
                      className="bg-[#495464] text-[#F4F4F2] px-3 py-2 text-[11px] uppercase tracking-wider font-medium flex items-center gap-2 hover:bg-[#363E4B] transition-colors"
                      aria-haspopup="listbox"
                      aria-expanded={sizeMenuOpen}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{getPaperSize(paperSize).label}</span>
                      <span className="text-[#BBBFCA] font-mono normal-case tracking-tight hidden sm:inline">
                        {getPaperSize(paperSize).dims}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${sizeMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {sizeMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setSizeMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 w-56 sm:w-64 bg-[#F4F4F2] border border-[#BBBFCA] shadow-xl z-50 py-1 animate-fadeIn">
                          {PAPER_SIZES.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                handlePaperSizeChange(p.id);
                                setSizeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                                paperSize === p.id
                                  ? "bg-[#495464] text-[#F4F4F2]"
                                  : "text-[#495464] hover:bg-[#E8E8E8]"
                              }`}
                            >
                              <span className="text-[11px] uppercase tracking-wider font-medium">{p.label}</span>
                              <span
                                className={`text-[10px] font-mono ${
                                  paperSize === p.id ? "text-[#F4F4F2]/75" : "text-[#495464]/60"
                                }`}
                              >
                                {p.dims}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handlePrintClick}
                    className="inline-flex items-center gap-1.5 bg-[#495464] text-[#F4F4F2] px-4 py-2 text-[11px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => {
                      setPrintingOrder(null);
                      setSizeMenuOpen(false);
                    }}
                    className="p-2 text-[#495464] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Close print preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Paper Preview */}
              <div ref={previewRef} className="flex-1 min-h-0 overflow-hidden flex items-start justify-center py-3">
                <div style={{ transform: `scale(${previewFit})`, transformOrigin: "top center" }}>
                  <div
                    className="bg-white shadow-2xl border border-[#BBBFCA]/50 overflow-hidden"
                    style={{
                      width: getPaperSize(paperSize).wMm * MM_TO_PX,
                      minHeight: getPaperSize(paperSize).hMm * MM_TO_PX,
                    }}
                  >
                    <OrderInvoicePrint order={printingOrder} paperSize={paperSize} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Print-Only Order Document (hidden on screen, printed in
            the selected paper size via the @page rule injected by the slip) */}
        <div id="printable-order-document" className="print-only">
          {printingOrder && <OrderInvoicePrint order={printingOrder} paperSize={paperSize} />}
        </div>
      </main>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#495464] mx-auto" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
