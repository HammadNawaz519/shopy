/**
 * SHOPY Centralized Server-Side Email Service
 *
 * Enforces strict 3-way SMTP Sender Account Routing:
 * 1. OTP / Security Account (shopy.otp@gmail.com)
 * 2. Order Lifecycle Account (shopy.orderupdate@gmail.com)
 * 3. Support & Concierge Account (shopy.support@gmail.com)
 */

import { sendEmailSafe } from "./transporter";
import { getEmailSystemConfig, getAccountConfig } from "./config";
import { EmailType } from "./types";
import {
  renderVerificationOtpEmail,
  renderLoginOtpEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from "./templates/authTemplates";
import {
  renderOrderConfirmationEmail,
  renderOrderStatusUpdateEmail,
  renderAdminNewOrderNotification,
  renderPaymentReceivedEmail,
} from "./templates/orderTemplates";
import {
  renderContactFormAdminEmail,
  renderContactFormAcknowledgmentEmail,
} from "./templates/supportTemplates";
import type { OrderRecord } from "@/lib/db/store";

// ============================================================================
// 1. AUTHENTICATION & OTP EMAILS (SENDER: shopy.otp@gmail.com)
// ============================================================================

/**
 * Dispatches a 6-digit verification code email for registration or account verification.
 * SENDER: shopy.otp@gmail.com
 */
export async function sendVerificationOtpEmail(
  to: string,
  otpCode: string,
  name?: string,
  expiresInMinutes: number = 10
) {
  const { subject, text, html } = renderVerificationOtpEmail({
    email: to,
    name,
    otpCode,
    expiresInMinutes,
  });

  return sendEmailSafe({
    emailType: "OTP",
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches a single-use login code email to a user.
 * SENDER: shopy.otp@gmail.com
 */
export async function sendLoginOtpEmail(
  to: string,
  otpCode: string,
  name?: string,
  expiresInMinutes: number = 10
) {
  const { subject, text, html } = renderLoginOtpEmail({
    email: to,
    name,
    otpCode,
    expiresInMinutes,
  });

  return sendEmailSafe({
    emailType: "LOGIN_OTP",
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches a password recovery email containing an OTP code and/or direct reset link.
 * SENDER: shopy.otp@gmail.com
 */
export async function sendPasswordResetEmail(
  to: string,
  options: {
    resetUrl?: string;
    otpCode?: string;
    name?: string;
    expiresInMinutes?: number;
  }
) {
  const { subject, text, html } = renderPasswordResetEmail({
    email: to,
    name: options.name,
    resetUrl: options.resetUrl,
    otpCode: options.otpCode,
    expiresInMinutes: options.expiresInMinutes || 10,
  });

  return sendEmailSafe({
    emailType: "PASSWORD_RESET",
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an onboarding welcome email upon account registration.
 * SENDER: shopy.otp@gmail.com
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  const { subject, text, html } = renderWelcomeEmail({
    email: to,
    name,
  });

  return sendEmailSafe({
    emailType: "WELCOME",
    to,
    subject,
    text,
    html,
  });
}

// ============================================================================
// 2. ORDER LIFECYCLE EMAILS (SENDER: shopy.orderupdate@gmail.com)
// ============================================================================

/**
 * Dispatches an order confirmation email to the purchasing customer upon checkout.
 * SENDER: shopy.orderupdate@gmail.com
 */
export async function sendOrderConfirmationEmail(
  order: OrderRecord,
  customerEmail?: string,
  customerName?: string
) {
  const destinationEmail = customerEmail || order.shippingAddress.email;
  if (!destinationEmail) return { success: false, error: "No destination email available." };

  const { subject, text, html } = renderOrderConfirmationEmail({
    order,
    customerEmail: destinationEmail,
    customerName,
  });

  return sendEmailSafe({
    emailType: "ORDER_CONFIRMED",
    to: destinationEmail,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an order status change update (PROCESSING, SHIPPED, DELIVERED, CANCELLED, etc.) to the customer.
 * SENDER: shopy.orderupdate@gmail.com
 */
export async function sendOrderStatusUpdateEmail(
  order: OrderRecord,
  newStatus: string,
  previousStatus?: string,
  notes?: string
) {
  const destinationEmail = order.shippingAddress.email;
  if (!destinationEmail) return { success: false, error: "No destination email available." };

  const normStatus = newStatus.toUpperCase().replace(/\s+/g, "_");
  let emailType: EmailType = "ORDER_CONFIRMED";

  if (normStatus === "PROCESSING") emailType = "ORDER_PROCESSING";
  else if (normStatus === "SHIPPED") emailType = "ORDER_SHIPPED";
  else if (normStatus === "OUT_FOR_DELIVERY") emailType = "ORDER_OUT_FOR_DELIVERY";
  else if (normStatus === "DELIVERED") emailType = "ORDER_DELIVERED";
  else if (normStatus === "CANCELLED") emailType = "ORDER_CANCELLED";
  else if (normStatus === "RETURNED") emailType = "ORDER_RETURNED";
  else if (normStatus === "REFUNDED") emailType = "ORDER_REFUNDED";

  const { subject, text, html } = renderOrderStatusUpdateEmail({
    order,
    customerEmail: destinationEmail,
    newStatus,
    previousStatus,
    notes,
  });

  return sendEmailSafe({
    emailType,
    to: destinationEmail,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches a payment confirmation email when an order payment is verified.
 * SENDER: shopy.orderupdate@gmail.com
 */
export async function sendPaymentReceivedEmail(order: OrderRecord, customerName?: string) {
  const destinationEmail = order.shippingAddress.email;
  if (!destinationEmail) return { success: false, error: "No destination email available." };

  const { subject, text, html } = renderPaymentReceivedEmail({
    order,
    customerEmail: destinationEmail,
    customerName,
  });

  return sendEmailSafe({
    emailType: "PAYMENT_RECEIVED",
    to: destinationEmail,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an administrative notification when a new order is received.
 * SENDER: shopy.orderupdate@gmail.com
 * Sent to the server-configured ADMIN_EMAIL address.
 */
export async function sendAdminNewOrderNotification(order: OrderRecord) {
  const systemConfig = getEmailSystemConfig();
  const adminEmail = systemConfig.adminEmail;

  if (!adminEmail) {
    return { success: false, error: "Admin email not configured." };
  }

  const { subject, text, html } = renderAdminNewOrderNotification({
    order,
    adminEmail,
  });

  return sendEmailSafe({
    emailType: "ADMIN_NEW_ORDER",
    to: adminEmail,
    subject,
    text,
    html,
  });
}

// ============================================================================
// 3. SUPPORT & CONCIERGE EMAILS (SENDER: shopy.support@gmail.com)
// ============================================================================

export interface ContactFormSubmissionParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryId?: number | string;
}

/**
 * Dispatches contact form messages:
 * 1. Sends the inquiry to the SHOPY Support inbox (shopy.support@gmail.com) with Reply-To set to the customer's email.
 * 2. Sends an automated acknowledgment email to the customer from shopy.support@gmail.com.
 * SENDER: shopy.support@gmail.com
 */
export async function sendContactFormEmails(params: ContactFormSubmissionParams) {
  const supportConfig = getAccountConfig("SUPPORT");
  const supportInbox = supportConfig.user || "shopy.support@gmail.com";

  // 1. Render Admin Notification
  const adminEmail = renderContactFormAdminEmail(params);

  // Send to support inbox with Reply-To: customer email
  const supportNotificationResult = await sendEmailSafe({
    emailType: "CONTACT_FORM",
    to: supportInbox,
    replyTo: params.email,
    subject: adminEmail.subject,
    text: adminEmail.text,
    html: adminEmail.html,
  });

  // 2. Render and send customer acknowledgment email
  let customerAckResult = { success: false };
  try {
    const customerAck = renderContactFormAcknowledgmentEmail(params);
    customerAckResult = await sendEmailSafe({
      emailType: "SUPPORT_ACKNOWLEDGMENT",
      to: params.email,
      replyTo: supportConfig.fromAddress,
      subject: customerAck.subject,
      text: customerAck.text,
      html: customerAck.html,
    });
  } catch (ackError) {
    console.error("[SUPPORT EMAIL] Customer acknowledgment delivery error:", ackError);
  }

  return {
    success: supportNotificationResult.success,
    supportNotification: supportNotificationResult,
    customerAcknowledgment: customerAckResult,
  };
}
