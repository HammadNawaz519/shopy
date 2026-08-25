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
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrderInvoicePrint from "@/components/admin/OrderInvoicePrint";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

function OrdersContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const initialStatus = searchParams.get("status") || "ALL";

  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [printingOrder, setPrintingOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  // Directly trigger native system print dialog without intermediate modals
  useEffect(() => {
    if (printingOrder) {
      const timer = setTimeout(() => {
        window.print();
      }, 50);

      const handleAfterPrint = () => {
        setPrintingOrder(null);
      };

      window.addEventListener("afterprint", handleAfterPrint);
      return () => {
        clearTimeout(timer);
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
        showToast(`Order status updated to ${newStatus}`, "success");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
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
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
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

  const statusTabs = [
    { label: "All Orders", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Processing", value: "PROCESSING" },
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
                    <th className="p-4 font-semibold">Order ID</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Items</th>
                    <th className="p-4 font-semibold">Total</th>
                    <th className="p-4 font-semibold">Order Status</th>
                    <th className="p-4 font-semibold">Payment</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                      <td className="p-4 font-serif font-semibold text-[#495464]">
                        {ord.orderNumber}
                      </td>
                      <td className="p-4 text-[#495464]/70">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="font-medium block text-[#495464]">
                          {ord.shippingAddress.firstName} {ord.shippingAddress.lastName}
                        </span>
                        <span className="text-[10px] text-[#495464]/60">{ord.shippingAddress.city}</span>
                      </td>
                      <td className="p-4 text-[#495464]/80">
                        {ord.items.length} {ord.items.length === 1 ? "piece" : "pieces"}
                      </td>
                      <td className="p-4 font-serif font-semibold text-[#495464]">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="p-4">
                        <select
                          value={ord.status}
                          disabled={updating}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          className="bg-[#E8E8E8] border border-[#BBBFCA] px-2 py-1 text-[10px] uppercase font-semibold text-[#495464] focus:outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider ${
                            ord.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.paymentStatus === "REFUNDED"
                              ? "bg-purple-100 text-purple-800"
                              : ord.paymentStatus === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.paymentStatus || "PENDING"} ({ord.paymentMethod?.toUpperCase()})
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="inline-flex items-center gap-1 bg-[#495464] text-[#F4F4F2] px-3 py-1 text-xs uppercase tracking-wider hover:bg-[#363E4B] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setPrintingOrder(ord)}
                            className="inline-flex items-center gap-1 bg-[#495464] text-[#F4F4F2] px-3 py-1 text-xs uppercase tracking-wider hover:bg-[#363E4B] transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
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
                    className="inline-flex items-center gap-1 bg-[#495464] text-[#F4F4F2] px-3 py-1 text-xs uppercase tracking-wider hover:bg-[#363E4B] transition-colors"
                  >
                    <Printer className="w-3 h-3" />
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
              <div className="grid grid-cols-2 gap-4 bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1">
                    Fulfillment Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    disabled={updating}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] font-medium"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1">
                    Payment Status
                  </label>
                  <select
                    value={selectedOrder.paymentStatus || "PENDING"}
                    disabled={updating}
                    onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] font-medium"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-[#495464]">
                  Ordered Pieces ({selectedOrder.items.length})
                </h4>
                <div className="divide-y divide-[#BBBFCA]/20 border-y border-[#BBBFCA]/30">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-serif text-sm font-medium text-[#495464]">{item.name}</p>
                          <p className="text-[10px] text-[#495464]/60">
                            Qty: {item.quantity} • Size: {item.size} • Color: {item.color}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#495464]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 p-4 space-y-2 text-xs tracking-wider">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Shipping</span>
                  <span>{selectedOrder.shipping === 0 ? "Free" : formatPrice(selectedOrder.shipping)}</span>
                </div>
                <div className="flex justify-between font-serif text-base font-semibold text-[#495464] pt-2 border-t border-[#BBBFCA]/30">
                  <span>Total Amount</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
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
                    {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#495464]/60" />
                  <span>{selectedOrder.shippingAddress.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#495464]/60" />
                  <span>{selectedOrder.shippingAddress.phone}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#495464]/60 mt-0.5" />
                  <span>
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.postalCode}
                  </span>
                </p>
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
