import { sendEmailSafe } from "./transporter";
import { getSmtpConfig } from "./config";
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
} from "./templates/orderTemplates";
import type { OrderRecord } from "@/lib/db/store";

/**
 * Dispatches a 6-digit verification code email to a user.
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
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches a single-use login code email to a user.
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
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches a password recovery email containing an OTP code and/or direct reset link.
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
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an onboarding welcome email upon account registration.
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  const { subject, text, html } = renderWelcomeEmail({
    email: to,
    name,
  });

  return sendEmailSafe({
    to,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an order confirmation email to the purchasing customer.
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
    to: destinationEmail,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an order status change update (e.g. PROCESSING, SHIPPED, DELIVERED) to the customer.
 */
export async function sendOrderStatusUpdateEmail(
  order: OrderRecord,
  newStatus: string,
  previousStatus?: string,
  notes?: string
) {
  const destinationEmail = order.shippingAddress.email;
  if (!destinationEmail) return { success: false, error: "No destination email available." };

  const { subject, text, html } = renderOrderStatusUpdateEmail({
    order,
    customerEmail: destinationEmail,
    newStatus,
    previousStatus,
    notes,
  });

  return sendEmailSafe({
    to: destinationEmail,
    subject,
    text,
    html,
  });
}

/**
 * Dispatches an administrative notification when a new order is received.
 * Sent only to the server-configured ADMIN_EMAIL address.
 */
export async function sendAdminNewOrderNotification(order: OrderRecord) {
  const config = getSmtpConfig();
  const adminEmail = config.adminEmail;

  if (!adminEmail) {
    return { success: false, error: "Admin email not configured." };
  }

  const { subject, text, html } = renderAdminNewOrderNotification({
    order,
    adminEmail,
  });

  return sendEmailSafe({
    to: adminEmail,
    subject,
    text,
    html,
  });
}
