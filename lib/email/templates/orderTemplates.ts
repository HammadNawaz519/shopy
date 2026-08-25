import { renderEmailLayout } from "./layout";
import { escapeEmailHtml } from "../security";
import type { OrderRecord } from "@/lib/db/store";

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://shopy.vercel.app"
  ).replace(/\/+$/, "");
}

export interface OrderConfirmationProps {
  order: OrderRecord;
  customerName?: string;
  customerEmail?: string;
}

export function renderOrderConfirmationEmail({
  order,
  customerName,
}: OrderConfirmationProps): { subject: string; text: string; html: string } {
  const safeOrderNumber = escapeEmailHtml(order.orderNumber);
  const fullName = customerName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const safeName = escapeEmailHtml(fullName || "Client");
  const appUrl = getAppUrl();
  const orderUrl = `${appUrl}/order-confirmation/${order.orderNumber || order.id}`;

  const isBankTransfer = order.paymentMethod === "bank_transfer" || order.paymentMethod === "online";
  const isPaid = order.paymentStatus === "PAID";

  // Dynamic Subject, Headings, and Messages per Payment Method
  let subject = `SHOPY — Order Confirmed · #${safeOrderNumber}`;
  let heading = "ORDER CONFIRMED";
  let message = "Thank you for shopping with SHOPY. Your order has been confirmed and placed in our atelier preparation queue.";
  let paymentMethodLabel = "Cash on Delivery";
  let paymentStatusLabel = "Unpaid";
  let orderStatusLabel = "Confirmed";

  if (isBankTransfer) {
    paymentMethodLabel = "Bank Transfer / Raast";
    if (isPaid) {
      paymentStatusLabel = "✓ Paid";
      orderStatusLabel = "Confirmed";
      message = "Thank you for shopping with SHOPY. Your bank transfer payment has been confirmed and your order is being prepared in our atelier.";
    } else {
      paymentStatusLabel = "Pending Verification";
      orderStatusLabel = "Verifying Payment";
      subject = `SHOPY — Payment Verification Pending · #${safeOrderNumber}`;
      heading = "PAYMENT VERIFICATION PENDING";
      message = "We've received your order and are currently verifying your payment. Your order will be prepared once your payment has been confirmed.";
    }
  } else {
    // COD
    paymentMethodLabel = "Cash on Delivery";
    if (isPaid) {
      paymentStatusLabel = "✓ Paid";
      orderStatusLabel = "Confirmed";
    } else {
      paymentStatusLabel = "Unpaid";
      orderStatusLabel = "Confirmed";
      message = "Thank you for shopping with SHOPY. Your order has been confirmed. Payment will be collected when your order is delivered.";
    }
  }

  // Format Order Date
  const orderDateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  // Product cards with image fallback
  const itemsHtml = order.items
    .map((item) => {
      const safeItemName = escapeEmailHtml(item.name);
      const safeSize = item.size ? escapeEmailHtml(item.size) : "";
      const safeColor = item.color ? escapeEmailHtml(item.color) : "";
      const variantMeta = [safeSize ? `Size: ${safeSize}` : "", safeColor ? `Color: ${safeColor}` : ""].filter(Boolean).join(" &bull; ");
      const itemImage = item.image && item.image.startsWith("http") ? item.image : "";

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #E8E8E8; text-align: left; vertical-align: top;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                ${
                  itemImage
                    ? `
                  <td width="56" style="padding-right: 14px; vertical-align: top;">
                    <img src="${escapeEmailHtml(itemImage)}" alt="${safeItemName}" width="52" height="64" style="display: block; width: 52px; height: 64px; object-fit: cover; border: 1px solid #BBBFCA; background-color: #E8E8E8;" />
                  </td>
                `
                    : ""
                }
                <td style="vertical-align: top; text-align: left;">
                  <div style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 15px; font-weight: 600; color: #495464; line-height: 1.3;">
                    ${safeItemName}
                  </div>
                  ${variantMeta ? `<div style="font-size: 11px; color: #717D8F; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px;">${variantMeta}</div>` : ""}
                  <div style="font-size: 11px; color: #495464; margin-top: 3px; font-weight: 500;">
                    Qty: ${item.quantity} &times; ${formatCurrency(item.price)}
                  </div>
                </td>
                <td style="vertical-align: top; text-align: right; font-size: 13px; font-weight: 600; color: #495464; white-space: nowrap; padding-left: 10px;">
                  ${formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const address = order.shippingAddress;
  const safeAddressLine = escapeEmailHtml(address.address);
  const safeCity = escapeEmailHtml(address.city);
  const safeProvince = address.province ? escapeEmailHtml(address.province) : "";
  const safePhone = escapeEmailHtml(address.phone);

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <!-- HEADER -->
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px; text-align: center;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            ${heading}
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; margin: 0; opacity: 0.9;">
            Hi ${safeName}, ${message}
          </p>
        </td>
      </tr>

      <!-- ORDER META & BADGES -->
      <tr>
        <td style="padding: 6px 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 14px 16px; border-radius: 2px;">
            <tr>
              <td style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #495464;">
                Order: <strong style="font-family: monospace; font-size: 12px;">#${safeOrderNumber}</strong>
                <div style="font-size: 10px; color: #717D8F; text-transform: none; margin-top: 2px;">${orderDateFormatted}</div>
              </td>
              <td style="text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #495464; font-weight: 600;">
                <span style="display: inline-block; background-color: #F4F4F2; border: 1px solid #BBBFCA; padding: 4px 8px;">
                  Status: ${orderStatusLabel}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- PRODUCTS ORDERED -->
      <tr>
        <td style="padding: 0 0 16px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #717D8F; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #BBBFCA;">
            Products Ordered (${order.items.length})
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- TOTALS BREAKDOWN -->
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #495464; line-height: 1.8;">
            <tr>
              <td style="text-align: left; opacity: 0.85;">Subtotal</td>
              <td style="text-align: right; font-weight: 500;">${formatCurrency(order.subtotal)}</td>
            </tr>
            ${
              order.discount > 0
                ? `
            <tr>
              <td style="text-align: left; color: #065F46;">Discount Applied</td>
              <td style="text-align: right; font-weight: 500; color: #065F46;">-${formatCurrency(order.discount)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="text-align: left; opacity: 0.85;">Insured Shipping</td>
              <td style="text-align: right; font-weight: 500;">${order.shipping === 0 ? "Complimentary" : formatCurrency(order.shipping)}</td>
            </tr>
            <tr>
              <td style="text-align: left; font-size: 14px; font-weight: 600; padding-top: 8px; border-top: 1px solid #BBBFCA; color: #495464;">Grand Total</td>
              <td style="text-align: right; font-size: 15px; font-weight: 700; color: #495464; padding-top: 8px; border-top: 1px solid #BBBFCA;">${formatCurrency(order.total)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- PAYMENT INFORMATION CARD -->
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 14px 16px; border-radius: 2px;">
            <tr>
              <td style="text-align: left;">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #717D8F; font-weight: 600; margin-bottom: 4px;">
                  Payment
                </div>
                <div style="font-size: 12px; color: #495464; font-weight: 600;">
                  Method: ${paymentMethodLabel}
                </div>
                <div style="font-size: 11px; color: #495464; opacity: 0.85; margin-top: 2px;">
                  Status: <strong>${paymentStatusLabel}</strong>
                </div>
              </td>
            </tr>
          </table>
        </td>
         <!-- DESTINATION ADDRESS -->
      <tr>
        <td style="padding: 0 0 8px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E8E8E8; padding: 16px 18px; border-radius: 2px;">
            <tr>
              <td>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #717D8F; margin-bottom: 6px; font-weight: 600;">
                  Delivery Destination
                </div>
                <div style="font-size: 13px; color: #495464; font-weight: 600;">
                  ${safeName}
                </div>
                <div style="font-size: 12px; color: #495464; opacity: 0.85; margin-top: 2px;">
                  ${safeAddressLine}<br />
                  ${safeCity}${safeProvince ? `, ${safeProvince}` : ""}, Pakistan
                </div>
                <div style="font-size: 11px; color: #495464; opacity: 0.75; margin-top: 4px;">
                  Phone: ${safePhone}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `${message} Total: ${formatCurrency(order.total)}.`,
    bodyContent,
  });

  const textItems = order.items
    .map((item) => `- ${item.name} x${item.quantity} (${item.size || ""}) — ${formatCurrency(item.price * item.quantity)}`)
    .join("\n");

  const text = `
SHOPY — ${heading}
----------------------------------------
Order Reference: #${order.orderNumber}
Date: ${orderDateFormatted}
Status: ${orderStatusLabel}
Payment Method: ${paymentMethodLabel}
Payment Status: ${paymentStatusLabel}
Total: ${formatCurrency(order.total)}

${message}

PRODUCTS:
${textItems}

ORDER SUMMARY:
Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatCurrency(order.discount)}\n` : ""}Shipping: ${order.shipping === 0 ? "Complimentary" : formatCurrency(order.shipping)}
Total: ${formatCurrency(order.total)}

DELIVERY DESTINATION:
${fullName}
${address.address}
${address.city}, Pakistan
Phone: ${address.phone}

----------------------------------------
Need help?
shopy.support@gmail.com
© 2026 SHOPY Atelier
  `.trim();

  return { subject, text, html };
}

export interface OrderStatusProps {
  order: OrderRecord;
  customerName?: string;
  customerEmail?: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
}

export function renderOrderStatusUpdateEmail({
  order,
  customerName,
  newStatus,
  previousStatus,
  notes,
}: OrderStatusProps): { subject: string; text: string; html: string } {
  const safeOrderNumber = escapeEmailHtml(order.orderNumber);
  const fullName = customerName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const safeName = escapeEmailHtml(fullName || "Client");
  const safeNotes = notes ? escapeEmailHtml(notes) : "";
  const appUrl = getAppUrl();
  const orderUrl = `${appUrl}/order-confirmation/${order.id}`;

  const normStatus = newStatus.toUpperCase().replace(/\s+/g, "_");
  const isBank = order.paymentMethod === "bank_transfer" || order.paymentMethod === "online";
  const isPaid = order.paymentStatus === "PAID";

  // Tailored Subjects and Headings per Status
  let subject = `SHOPY — Order #${safeOrderNumber} Update`;
  let heading = "ORDER STATUS UPDATE";
  let statusMessage = "Your order status has been updated.";
  let badgeLabel = normStatus.replace(/_/g, " ");

  switch (normStatus) {
    case "PREPARING":
    case "PROCESSING":
      if (isBank && (previousStatus === "VERIFYING_PAYMENT" || isPaid)) {
        subject = `SHOPY — Payment Confirmed · #${safeOrderNumber}`;
        heading = "PAYMENT CONFIRMED & PREPARING";
        statusMessage = "Your payment has been verified and your order is now being carefully prepared in our atelier.";
      } else {
        subject = `SHOPY — Your Order Is Being Prepared · #${safeOrderNumber}`;
        heading = "ORDER BEING PREPARED";
        statusMessage = "Your order is now being carefully prepared and tailored in our atelier.";
      }
      badgeLabel = "PREPARING";
      break;

    case "SHIPPED":
      subject = `SHOPY — Your Order Has Shipped · #${safeOrderNumber}`;
      heading = "ORDER DISPATCHED";
      statusMessage = "Your SHOPY order has departed our atelier and is on its way with our premium logistics partner.";
      badgeLabel = "SHIPPED";
      break;

    case "OUT_FOR_DELIVERY":
      subject = `SHOPY — Your Order Is Out for Delivery · #${safeOrderNumber}`;
      heading = "OUT FOR DELIVERY";
      statusMessage = "Your order is on its way to you and is expected to arrive today.";
      badgeLabel = "OUT FOR DELIVERY";
      break;

    case "DELIVERED":
      subject = `SHOPY — Your Order Has Been Delivered · #${safeOrderNumber}`;
      heading = "ORDER DELIVERED";
      statusMessage = "Your order has been delivered successfully. We hope you cherish your new pieces.";
      badgeLabel = "DELIVERED";
      break;

    case "CANCELLED":
      subject = `SHOPY — Order Cancelled · #${safeOrderNumber}`;
      heading = "ORDER CANCELLED";
      statusMessage = "Your order has been cancelled. If you have any inquiries, please contact our concierge.";
      badgeLabel = "CANCELLED";
      break;

    case "REFUNDED":
      subject = `SHOPY — Refund Processed · #${safeOrderNumber}`;
      heading = "REFUND PROCESSED";
      statusMessage = `A refund of ${formatCurrency(order.total)} has been processed for your order.`;
      badgeLabel = "REFUNDED";
      break;

    case "VERIFYING_PAYMENT":
      subject = `SHOPY — Payment Verification Pending · #${safeOrderNumber}`;
      heading = "VERIFYING PAYMENT";
      statusMessage = "We are currently verifying your payment details. You will receive an update once verified.";
      badgeLabel = "VERIFYING PAYMENT";
      break;

    case "CONFIRMED":
      subject = `SHOPY — Order Confirmed · #${safeOrderNumber}`;
      heading = "ORDER CONFIRMED";
      statusMessage = "Your order has been confirmed and placed in the fulfillment queue.";
      badgeLabel = "CONFIRMED";
      break;
  }

  const paymentBadgeText = order.paymentStatus === "PAID"
    ? "✓ PAID"
    : order.paymentStatus === "REFUNDED"
    ? "REFUNDED"
    : isBank
    ? "BANK TRANSFER · PENDING"
    : "CASH ON DELIVERY · UNPAID";

  // Product cards
  const itemsHtml = order.items
    .map((item) => {
      const safeItemName = escapeEmailHtml(item.name);
      const safeSize = item.size ? escapeEmailHtml(item.size) : "";
      const safeColor = item.color ? escapeEmailHtml(item.color) : "";
      const variantMeta = [safeSize ? `Size: ${safeSize}` : "", safeColor ? `Color: ${safeColor}` : ""].filter(Boolean).join(" &bull; ");
      const itemImage = item.image && item.image.startsWith("http") ? item.image : "";

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E8E8E8; text-align: left; vertical-align: top;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                ${
                  itemImage
                    ? `
                  <td width="48" style="padding-right: 12px; vertical-align: top;">
                    <img src="${escapeEmailHtml(itemImage)}" alt="${safeItemName}" width="44" height="54" style="display: block; width: 44px; height: 54px; object-fit: cover; border: 1px solid #BBBFCA; background-color: #E8E8E8;" />
                  </td>
                `
                    : ""
                }
                <td style="vertical-align: top; text-align: left;">
                  <div style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 14px; font-weight: 600; color: #495464;">
                    ${safeItemName}
                  </div>
                  ${variantMeta ? `<div style="font-size: 11px; color: #717D8F; text-transform: uppercase; margin-top: 2px;">${variantMeta}</div>` : ""}
                  <div style="font-size: 11px; color: #495464; margin-top: 2px;">
                    Qty: ${item.quantity}
                  </div>
                </td>
                <td style="vertical-align: top; text-align: right; font-size: 13px; font-weight: 600; color: #495464; white-space: nowrap;">
                  ${formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <!-- HEADING -->
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px; text-align: center;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            ${heading}
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; margin: 0; opacity: 0.9;">
            Hello ${safeName}, ${statusMessage}
          </p>
        </td>
      </tr>

      <!-- STATUS BADGE BLOCK -->
      <tr>
        <td align="center" style="padding: 6px 0 20px 0; text-align: center;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="background-color: #495464; color: #F4F4F2; padding: 10px 28px; font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; border-radius: 2px;">
                ${badgeLabel}
              </td>
            </tr>
          </table>
          ${safeNotes ? `<p style="font-size: 12px; color: #495464; opacity: 0.85; font-style: italic; margin: 12px 0 0 0;">&ldquo;${safeNotes}&rdquo;</p>` : ""}
        </td>
      </tr>

      <!-- ORDER META CARD -->
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 14px 16px; border-radius: 2px;">
            <tr>
              <td style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #495464;">
                Order Reference: <strong style="font-family: monospace;">#${safeOrderNumber}</strong>
              </td>
              <td style="text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #495464; font-weight: 600;">
                <span style="display: inline-block; background-color: #F4F4F2; border: 1px solid #BBBFCA; padding: 4px 8px;">
                  ${paymentBadgeText}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- PRODUCTS SUMMARY -->
      <tr>
        <td style="padding: 0 0 16px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #717D8F; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #BBBFCA;">
            Items in Order (${order.items.length})
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- FINANCIAL TOTAL -->
      <tr>
        <td style="padding: 0 0 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #495464; line-height: 1.8; border-top: 1px solid #BBBFCA; padding-top: 8px;">
            <tr>
              <td style="text-align: left; font-size: 13px; font-weight: 600; color: #495464;">Total Amount</td>
              <td style="text-align: right; font-size: 14px; font-weight: 700; color: #495464;">${formatCurrency(order.total)}</td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Order #${order.orderNumber}: ${statusMessage}`,
    bodyContent,
  });

  const text = `
SHOPY — ${heading}
----------------------------------------
Order Reference: #${order.orderNumber}
Status: ${badgeLabel}
Payment: ${paymentBadgeText}
Total: ${formatCurrency(order.total)}

${statusMessage}
${notes ? `Note: ${notes}\n` : ""}
----------------------------------------
SHOPY Concierge Support: shopy.support@gmail.com
© 2026 SHOPY Atelier
  `.trim();

  return { subject, text, html };
}

export interface PaymentReceivedProps {
  order: OrderRecord;
  customerName?: string;
  customerEmail?: string;
}

export function renderPaymentReceivedEmail({
  order,
  customerName,
}: PaymentReceivedProps): { subject: string; text: string; html: string } {
  const safeOrderNumber = escapeEmailHtml(order.orderNumber);
  const fullName = customerName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const safeName = escapeEmailHtml(fullName || "Client");
  const appUrl = getAppUrl();
  const orderUrl = `${appUrl}/order-confirmation/${order.id}`;
  const subject = `SHOPY — Payment Confirmed · #${safeOrderNumber}`;

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px; text-align: center;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            PAYMENT CONFIRMED
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; margin: 0; opacity: 0.9;">
            Hello ${safeName}, your payment of <strong>${formatCurrency(order.total)}</strong> for order #${safeOrderNumber} has been verified and confirmed.
          </p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 6px 0 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="background-color: #065F46; color: #FFFFFF; padding: 10px 28px; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; border-radius: 2px;">
                ✓ PAYMENT RECEIVED
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 0 0 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E8E8E8; padding: 16px 20px; text-align: left; border-radius: 2px;">
            <tr>
              <td>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #717D8F; margin-bottom: 4px; font-weight: 600;">
                  Order Summary
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #495464;">
                  Order #${safeOrderNumber} &bull; Total Paid: ${formatCurrency(order.total)}
                </div>
                <div style="font-size: 12px; color: #495464; opacity: 0.8; margin-top: 4px;">
                  Payment Method: ${order.paymentMethod === "bank_transfer" || order.paymentMethod === "online" ? "Bank Transfer / Raast" : "Cash on Delivery"}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Payment of ${formatCurrency(order.total)} confirmed for order #${order.orderNumber}.`,
    bodyContent,
  });

  const text = `
SHOPY — PAYMENT CONFIRMED
----------------------------------------
Order #${order.orderNumber}
Payment Status: PAID
Total Paid: ${formatCurrency(order.total)}

Your payment has been verified. Your order is proceeding with atelier preparation.

----------------------------------------
SHOPY Concierge Support: shopy.support@gmail.com
© 2026 SHOPY Atelier
  `.trim();

  return { subject, text, html };
}

export interface AdminNewOrderProps {
  order: OrderRecord;
  adminEmail: string;
}

export function renderAdminNewOrderNotification({
  order,
  adminEmail,
}: AdminNewOrderProps): { subject: string; text: string; html: string } {
  const safeOrderNumber = escapeEmailHtml(order.orderNumber);
  const address = order.shippingAddress;
  const safeCustomerName = escapeEmailHtml(`${address.firstName} ${address.lastName}`.trim());
  const safeCustomerEmail = escapeEmailHtml(address.email);
  const safeCustomerPhone = escapeEmailHtml(address.phone);
  const safeCity = escapeEmailHtml(address.city);
  const subject = `[SHOPY ADMIN] New Order Received #${safeOrderNumber} (${formatCurrency(order.total)})`;

  const itemsListHtml = order.items
    .map((item) => `<li><strong>${escapeEmailHtml(item.name)}</strong> (Qty: ${item.quantity}${item.size ? `, Size: ${escapeEmailHtml(item.size)}` : ""}) &mdash; ${formatCurrency(item.price * item.quantity)}</li>`)
    .join("");

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: left;">
      <tr>
        <td style="padding: 0 16px 20px 16px; text-align: center;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            NEW ORDER RECEIVED
          </h1>
          <p style="font-size: 13px; color: #495464; opacity: 0.85;">
            A new client order has been registered on SHOPY.
          </p>
        </td>
      </tr>

      <tr>
        <td style="background-color: #FFFFFF; border: 1px solid #BBBFCA; padding: 20px; border-radius: 2px;">
          <div style="font-size: 14px; font-weight: bold; color: #495464; margin-bottom: 12px;">
            Order #${safeOrderNumber} &mdash; ${formatCurrency(order.total)}
          </div>
          <div style="font-size: 12px; color: #495464; line-height: 1.7;">
            <strong>Client:</strong> ${safeCustomerName} (${safeCustomerEmail})<br />
            <strong>Phone:</strong> ${safeCustomerPhone}<br />
            <strong>City:</strong> ${safeCity}<br />
            <strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}<br />
            <strong>Items:</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              ${itemsListHtml}
            </ul>
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `New order #${order.orderNumber} received. Value: ${formatCurrency(order.total)}.`,
    bodyContent,
  });

  const text = `
SHOPY ADMIN — NEW ORDER RECEIVED
----------------------------------------
Order #${order.orderNumber}
Total: ${formatCurrency(order.total)}
Client: ${address.firstName} ${address.lastName} (${address.email})
Phone: ${address.phone}
City: ${address.city}
Payment: ${order.paymentMethod.toUpperCase()}

Items:
${order.items.map((i) => `- ${i.name} x${i.quantity} (${formatCurrency(i.price * i.quantity)})`).join("\n")}

----------------------------------------
SHOPY Atelier
  `.trim();

  return { subject, text, html };
}
