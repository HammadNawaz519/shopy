import { renderEmailLayout } from "./layout";
import { escapeEmailHtml } from "../security";
import type { OrderRecord } from "@/lib/db/store";

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
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
  const subject = `SHOPY — Order Confirmation #${safeOrderNumber}`;

  // Render line items
  const itemsHtml = order.items
    .map((item) => {
      const safeItemName = escapeEmailHtml(item.name);
      const safeSize = item.size ? escapeEmailHtml(item.size) : "";
      const safeColor = item.color ? escapeEmailHtml(item.color) : "";
      const variantMeta = [safeSize, safeColor].filter(Boolean).join(" / ");

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E8E8E8; text-align: left;">
            <div style="font-size: 13px; font-weight: 500; color: #495464; letter-spacing: 0.02em;">
              ${safeItemName}
            </div>
            ${variantMeta ? `<div style="font-size: 11px; color: #BBBFCA; text-transform: uppercase; margin-top: 2px;">${variantMeta}</div>` : ""}
            <div style="font-size: 11px; color: #495464; opacity: 0.8; margin-top: 2px;">Qty: ${item.quantity}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E8E8E8; text-align: right; font-size: 13px; font-weight: 600; color: #495464; vertical-align: top;">
            ${formatCurrency(item.price * item.quantity)}
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
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            ORDER CONFIRMED
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
            Thank you for your acquisition, ${safeName}. Your order is being prepared with utmost care.
          </p>
        </td>
      </tr>

      <!-- ORDER META CARD -->
      <tr>
        <td style="padding: 8px 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 14px 16px; border-radius: 2px;">
            <tr>
              <td style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #495464;">
                Order: <strong style="font-mono">${safeOrderNumber}</strong>
              </td>
              <td style="text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #495464;">
                Payment: <strong>${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ITEMS BREAKDOWN -->
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <thead>
              <tr>
                <th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #BBBFCA; padding-bottom: 8px; border-bottom: 1px solid #BBBFCA;">Item</th>
                <th style="text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #BBBFCA; padding-bottom: 8px; border-bottom: 1px solid #BBBFCA;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- TOTALS -->
      <tr>
        <td style="padding: 0 0 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #495464; line-height: 1.8;">
            <tr>
              <td style="text-align: left; opacity: 0.8;">Subtotal</td>
              <td style="text-align: right; font-weight: 500;">${formatCurrency(order.subtotal)}</td>
            </tr>
            ${order.discount > 0 ? `
            <tr>
              <td style="text-align: left; color: #495464;">Discount applied</td>
              <td style="text-align: right; font-weight: 500;">-${formatCurrency(order.discount)}</td>
            </tr>` : ""}
            <tr>
              <td style="text-align: left; opacity: 0.8;">Shipping</td>
              <td style="text-align: right; font-weight: 500;">${order.shipping === 0 ? "Complimentary" : formatCurrency(order.shipping)}</td>
            </tr>
            <tr>
              <td style="text-align: left; font-size: 14px; font-weight: 600; padding-top: 8px; border-top: 1px solid #BBBFCA;">Total</td>
              <td style="text-align: right; font-size: 15px; font-weight: 700; color: #495464; padding-top: 8px; border-top: 1px solid #BBBFCA;">${formatCurrency(order.total)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- SHIPPING ADDRESS -->
      <tr>
        <td style="text-align: left; background-color: #FFFFFF; border: 1px solid #E8E8E8; padding: 18px 20px; border-radius: 2px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #BBBFCA; margin-bottom: 6px; font-weight: 600;">
            Destination Address
          </div>
          <div style="font-size: 13px; color: #495464; font-weight: 500;">
            ${safeName}
          </div>
          <div style="font-size: 12px; color: #495464; opacity: 0.85; margin-top: 2px;">
            ${safeAddressLine}<br />
            ${safeCity}${safeProvince ? `, ${safeProvince}` : ""}
          </div>
          <div style="font-size: 11px; color: #495464; opacity: 0.7; margin-top: 4px;">
            Phone: ${safePhone}
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Thank you for your order #${order.orderNumber}. Total: ${formatCurrency(order.total)}.`,
    bodyContent,
  });

  const textItems = order.items
    .map((item) => `- ${item.name} x${item.quantity} (${item.size || ""}) — ${formatCurrency(item.price * item.quantity)}`)
    .join("\n");

  const text = `
SHOPY — ORDER CONFIRMATION
----------------------------------------
Order Number: #${order.orderNumber}
Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
Total: ${formatCurrency(order.total)}

ITEMS:
${textItems}

Subtotal: ${formatCurrency(order.subtotal)}
Discount: ${order.discount > 0 ? `-${formatCurrency(order.discount)}` : "None"}
Shipping: ${order.shipping === 0 ? "Complimentary" : formatCurrency(order.shipping)}
Total: ${formatCurrency(order.total)}

SHIPPING DESTINATION:
${fullName}
${address.address}
${address.city}
Phone: ${address.phone}

----------------------------------------
SHOPY
Modern essentials.
Refined presence.
© 2026 SHOPY
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
  notes,
}: OrderStatusProps): { subject: string; text: string; html: string } {
  const safeOrderNumber = escapeEmailHtml(order.orderNumber);
  const fullName = customerName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const safeName = escapeEmailHtml(fullName || "Client");
  const safeStatus = escapeEmailHtml(newStatus.toUpperCase());
  const safeNotes = notes ? escapeEmailHtml(notes) : "";

  const subject = `SHOPY — Order #${safeOrderNumber} Status: ${safeStatus}`;

  const statusDescriptions: Record<string, string> = {
    PENDING: "Your order is pending confirmation.",
    CONFIRMED: "Your order has been verified and confirmed.",
    PROCESSING: "Your order is currently being tailored and carefully packaged.",
    SHIPPED: "Your order has departed our atelier and is in transit with our logistics partner.",
    OUT_FOR_DELIVERY: "Your order is out for delivery today and will arrive shortly.",
    DELIVERED: "Your order has been successfully delivered. Enjoy your pieces.",
    CANCELLED: "Your order has been cancelled.",
    RETURNED: "Your order return has been received and processed by our atelier.",
    REFUNDED: "Your order payment has been successfully refunded.",
    PAID: "Your payment has been successfully received and verified.",
  };

  const statusMessage = statusDescriptions[newStatus.toUpperCase()] || `Your order status has been updated to ${safeStatus}.`;

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            ORDER STATUS UPDATE
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
            Hello ${safeName}, here is the latest status on your order #${safeOrderNumber}.
          </p>
        </td>
      </tr>

      <!-- STATUS BADGE -->
      <tr>
        <td align="center" style="padding: 10px 0 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="background-color: #495464; color: #F4F4F2; padding: 12px 32px; font-size: 12px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; border-radius: 2px;">
                ${safeStatus}
              </td>
            </tr>
          </table>
          <p style="font-size: 13px; color: #495464; line-height: 1.6; margin: 16px 0 0 0;">
            ${statusMessage}
          </p>
          ${safeNotes ? `<p style="font-size: 12px; color: #495464; opacity: 0.8; font-style: italic; margin: 8px 0 0 0;">"${safeNotes}"</p>` : ""}
        </td>
      </tr>

      <!-- RECAP CARD -->
      <tr>
        <td style="background-color: #FFFFFF; border: 1px solid #E8E8E8; padding: 16px 20px; text-align: left; border-radius: 2px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #BBBFCA; margin-bottom: 4px;">
            Order Reference
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #495464;">
            Order #${safeOrderNumber} &bull; Total: ${formatCurrency(order.total)}
          </div>
          <div style="font-size: 12px; color: #495464; opacity: 0.8; margin-top: 4px;">
            Items: ${order.items.length} item(s) &bull; ${order.shippingAddress.city}
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Order #${order.orderNumber} status updated to ${safeStatus}.`,
    bodyContent,
  });

  const text = `
SHOPY — ORDER STATUS UPDATE
----------------------------------------
Order #${order.orderNumber}
New Status: ${safeStatus}

${statusMessage}
${notes ? `Notes: ${notes}\n` : ""}
Total: ${formatCurrency(order.total)}

----------------------------------------
SHOPY
Modern essentials.
Refined presence.
© 2026 SHOPY
  `.trim();

  return { subject, text, html };
}

export interface AdminNewOrderProps {
  order: OrderRecord;
  adminEmail: string;
}

export function renderAdminNewOrderNotification({
  order,
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

export function renderPaymentReceivedEmail({
  order,
  customerName,
}: OrderConfirmationProps): { subject: string; text: string; html: string } {
  const safeOrderNumber = escapeEmailHtml(order.orderNumber);
  const fullName = customerName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const safeName = escapeEmailHtml(fullName || "Client");
  const subject = `SHOPY — Payment Received for Order #${safeOrderNumber}`;

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            PAYMENT CONFIRMED
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
            Thank you, ${safeName}. Your payment of <strong>${formatCurrency(order.total)}</strong> for order #${safeOrderNumber} has been verified.
          </p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 10px 0 24px 0;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td align="center" style="background-color: #495464; color: #F4F4F2; padding: 10px 28px; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; border-radius: 2px;">
                PAID IN FULL
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="background-color: #FFFFFF; border: 1px solid #E8E8E8; padding: 16px 20px; text-align: left; border-radius: 2px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #BBBFCA; margin-bottom: 4px;">
            Payment Summary
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #495464;">
            Order #${safeOrderNumber} &bull; Total Paid: ${formatCurrency(order.total)}
          </div>
          <div style="font-size: 12px; color: #495464; opacity: 0.8; margin-top: 4px;">
            Payment Method: ${order.paymentMethod === "online" ? "Online / Bank Transfer" : "Cash on Delivery"}
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Payment received for order #${order.orderNumber}. Amount: ${formatCurrency(order.total)}.`,
    bodyContent,
  });

  const text = `
SHOPY — PAYMENT RECEIVED
----------------------------------------
Order #${order.orderNumber}
Payment Status: PAID
Total: ${formatCurrency(order.total)}
Payment Method: ${order.paymentMethod === "online" ? "Online / Bank Transfer" : "Cash on Delivery"}

Your payment has been successfully confirmed. Your order is proceeding with fulfillment.

----------------------------------------
SHOPY Atelier
  `.trim();

  return { subject, text, html };
}
