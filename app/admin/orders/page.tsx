"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  RotateCcw,
  Loader2,
  X,
  ShieldCheck,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderInvoicePrint from "@/components/admin/OrderInvoicePrint";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAdminOrderNotification } from "@/context/AdminOrderNotificationContext";

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

  // Directly trigger native system print dialog with orderNumber document.title
  useEffect(() => {
    if (printingOrder) {
      const originalTitle = document.title;
      // Set document.title so browser's "Save as PDF" suggests the clean Order ID filename
      document.title = printingOrder.orderNumber || `Order-${printingOrder.id}`;

      const timer = setTimeout(() => {
        window.print();
      }, 50);

      const handleAfterPrint = () => {
        document.title = originalTitle;
        setPrintingOrder(null);
      };

      window.addEventListener("afterprint", handleAfterPrint);
      return () => {
        clearTimeout(timer);
        document.title = originalTitle;
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [printingOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        markAllAsSeen();

        if (highlightId) {
          const matched = (data.orders || []).find((o: any) => o.id === highlightId);
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
          prev.map((o) => (o.id === orderId ? data.order || { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order || { ...selectedOrder, status: newStatus });
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
          prev.map((o) => (o.id === orderId ? data.order || { ...o, paymentStatus: newPaymentStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order || { ...selectedOrder, paymentStatus: newPaymentStatus });
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

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
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
              <table className="w-full text-left text-xs tracking-wider">
                <thead className="bg-[#E8E8E8]/70 border-b border-[#BBBFCA]/40 text-[#495464] uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Order ID</th>
                    <th className="px-2.5 py-3 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-2.5 py-3 font-semibold whitespace-nowrap max-w-[160px]">Customer</th>
                    <th className="px-2 py-3 font-semibold whitespace-nowrap text-left">Items</th>
                    <th className="px-2.5 py-3 font-semibold whitespace-nowrap">Total</th>
                    <th className="px-2 py-3 font-semibold whitespace-nowrap text-center">Payment</th>
                    <th className="px-2 py-3 font-semibold whitespace-nowrap text-center">Order Status</th>
                    <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {orders.map((ord) => {
                    const isBank = ord.paymentMethod === "bank_transfer" || ord.paymentMethod === "online";
                    return (
                      <tr key={ord.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                        <td className="px-3 py-3 font-serif font-semibold text-[#495464] whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="px-2.5 py-3 text-[#495464]/70 whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-2.5 py-3 max-w-[160px]">
                          <span className="font-medium block text-[#495464] truncate">
                            {ord.shippingAddress?.firstName || "Client"} {ord.shippingAddress?.lastName || ""}
                          </span>
                          <span className="text-[10px] text-[#495464]/60 block truncate">{ord.shippingAddress?.city || "Pakistan"}</span>
                        </td>
                        <td className="px-2 py-3 text-[#495464]/80 whitespace-nowrap text-left">
                          {(ord.items || []).length} {(ord.items || []).length === 1 ? "pc" : "pcs"}
                        </td>
                        <td className="px-2.5 py-3 font-serif font-semibold text-[#495464] whitespace-nowrap">
                          {formatPrice(ord.total)}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {getPaymentBadge(ord)}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <select
                            value={ord.status}
                            disabled={updating}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            className="bg-[#E8E8E8] border border-[#BBBFCA] px-2 py-1 text-[10px] uppercase font-semibold text-[#495464] focus:outline-none cursor-pointer w-[105px] h-[28px] text-center"
                          >
                            {/* For Bank: VERIFYING is allowed. For COD: only if currently in that state */}
                            {(isBank || ord.status === "VERIFYING_PAYMENT") && (
                              <option value="VERIFYING_PAYMENT">VERIFYING</option>
                            )}
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PREPARING">PREPARING</option>
                            {ord.status === "SHIPPED" && <option value="SHIPPED">SHIPPED</option>}
                            {ord.status === "OUT_FOR_DELIVERY" && <option value="OUT_FOR_DELIVERY">DELIVERY</option>}
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            {ord.status === "RETURN_REQUESTED" && <option value="RETURN_REQUESTED">RETURN REQ</option>}
                            <option value="RETURNED">RETURNED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2 sm:px-2.5 py-1 text-[11px] uppercase tracking-normal font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap h-[28px]"
                          >
                            <Eye className="w-3 h-3 flex-shrink-0" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setPrintingOrder(ord)}
                            className="inline-flex items-center justify-center gap-1 bg-[#495464] text-[#F4F4F2] px-2 sm:px-2.5 py-1 text-[11px] uppercase tracking-normal font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap h-[28px]"
                          >
                            <Printer className="w-3 h-3 flex-shrink-0" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

              {/* Payment Details Card */}
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/80">
                    Payment Overview
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#495464] uppercase text-[11px]">
                      {selectedOrder.paymentMethod === "bank_transfer" || selectedOrder.paymentMethod === "online"
                        ? "Bank Transfer / Raast"
                        : "Cash on Delivery (COD)"}
                    </span>
                    {getPaymentBadge(selectedOrder)}
                  </div>
                </div>

                {(selectedOrder.paymentMethod === "bank_transfer" || selectedOrder.paymentMethod === "online") &&
                  selectedOrder.paymentDetails && (
                    <div className="space-y-2 bg-[#F4F4F2] border border-[#BBBFCA]/50 p-3 text-[11px] text-[#495464]">
                      <div className="flex justify-between">
                        <span className="font-medium text-[#495464]/70">Bank Name:</span>
                        <span className="font-semibold">{selectedOrder.paymentDetails.bankName || "Meezan Bank Limited"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[#495464]/70">Account Holder:</span>
                        <span className="font-semibold">{selectedOrder.paymentDetails.accountHolderName}</span>
                      </div>
                      {selectedOrder.paymentDetails.accountTitle && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[#495464]/70">Account Title:</span>
                          <span className="font-semibold">{selectedOrder.paymentDetails.accountTitle}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium text-[#495464]/70">Account Number:</span>
                        <span className="font-mono font-bold">{selectedOrder.paymentDetails.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[#495464]/70">IBAN:</span>
                        <span className="font-mono font-bold">{selectedOrder.paymentDetails.iban}</span>
                      </div>
                      {selectedOrder.paymentDetails.raastId && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[#495464]/70">Raast ID:</span>
                          <span className="font-mono font-semibold">{selectedOrder.paymentDetails.raastId}</span>
                        </div>
                      )}
                      {selectedOrder.paymentDetails.paymentContact && (
                        <div className="flex justify-between">
                          <span className="font-medium text-[#495464]/70">Verification Support:</span>
                          <span className="font-mono font-semibold">{selectedOrder.paymentDetails.paymentContact}</span>
                        </div>
                      )}
                      {selectedOrder.paymentDetails.transactionRef && (
                        <div className="flex justify-between border-t border-[#BBBFCA]/30 pt-1.5 mt-1.5">
                          <span className="font-medium text-emerald-800">Customer Submitted Ref:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {selectedOrder.paymentDetails.transactionRef}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Order & Payment History Timelines */}
              {((selectedOrder.orderHistory && selectedOrder.orderHistory.length > 0) ||
                (selectedOrder.paymentHistory && selectedOrder.paymentHistory.length > 0)) && (
                <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 space-y-4 text-xs">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/80 block">
                    Audit Logs &amp; Status Timelines
                  </span>

                  {/* Order History */}
                  {selectedOrder.orderHistory && selectedOrder.orderHistory.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#495464]/60 block">
                        Order Lifecycle Progression
                      </span>
                      <div className="space-y-1.5 pl-2 border-l-2 border-[#495464]/30">
                        {selectedOrder.orderHistory.map((h: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-[#495464]">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{formatStatusLabel(h.status)}</span>
                              <span className="text-[10px] text-[#495464]/60">
                                {new Date(h.changedAt).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {h.note && <p className="text-[10px] text-[#495464]/70">{h.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  {selectedOrder.paymentHistory && selectedOrder.paymentHistory.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#BBBFCA]/20">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#495464]/60 block">
                        Payment Status Log
                      </span>
                      <div className="space-y-1.5 pl-2 border-l-2 border-emerald-600/40">
                        {selectedOrder.paymentHistory.map((h: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-[#495464]">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-900">{h.status}</span>
                              <span className="text-[10px] text-[#495464]/60">
                                {new Date(h.changedAt).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {h.note && <p className="text-[10px] text-[#495464]/70">{h.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  <span>{selectedOrder.shippingAddress?.phone || "No phone"}</span>
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

              {/* Email Activity Audit Log */}
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-2">
                  <h4 className="text-[11px] uppercase tracking-widest font-semibold text-[#495464] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#495464]/70" />
                    <span>Email Activity</span>
                  </h4>
                  <span className="text-[10px] text-[#495464]/60">
                    shopy.orderupdate@gmail.com
                  </span>
                </div>
                {selectedOrder.emailLogs && selectedOrder.emailLogs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.emailLogs.map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#F4F4F2] border border-[#BBBFCA]/30 p-2.5 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[#495464] text-[11px] uppercase tracking-wide">
                            {log.eventType?.replace(/_/g, " ") || "Order Update"}
                          </div>
                          <div className="text-[10px] text-[#495464]/70">
                            To: {log.recipient}
                          </div>
                          <div className="text-[9px] text-[#495464]/50">
                            {new Date(log.sentAt).toLocaleDateString()} &bull;{" "}
                            {new Date(log.sentAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {log.status === "SENT" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5">
                              <span>✕ Failed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#495464]/60 italic">
                    No automated order update emails logged yet for this order.
                  </p>
                )}
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
                        <span>✕ Sync Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>✓ Synchronized</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Print-Only Order Document (Hidden on screen, pure A4 invoice during print) */}
        <div id="printable-order-document" className="print-only">
          {printingOrder && <OrderInvoicePrint order={printingOrder} />}
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
