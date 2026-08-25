/**
 * SHOPY Centralized Mailer Entrypoint
 * Provides backward compatibility and unified access to the 3-tier email system.
 */

import { getEmailTransporter, sendEmailSafe, verifyAllSmtpConnections } from "./transporter";
import {
  sendVerificationOtpEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderCreatedEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentReceivedEmail,
  sendAdminNewOrderNotification,
  sendContactFormEmails,
} from "./service";
import { generateSecureOtp, generateSecureToken } from "./security";
import { EmailAccountType, EmailType } from "./types";

export const getTransporter = getEmailTransporter;

// Backward compatibility alias
export const sendVerificationOtp = sendVerificationOtpEmail;

export {
  // Transporter & core dispatch
  getEmailTransporter,
  sendEmailSafe,
  verifyAllSmtpConnections,

  // Authentication & OTP (shopy.otp@gmail.com)
  sendVerificationOtpEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,

  // Orders (shopy.orderupdate@gmail.com)
  sendOrderConfirmationEmail,
  sendOrderCreatedEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentReceivedEmail,
  sendAdminNewOrderNotification,

  // Support & Concierge (shopy.support@gmail.com)
  sendContactFormEmails,

  // Security Helpers
  generateSecureOtp,
  generateSecureToken,
};

export type { EmailAccountType, EmailType };
