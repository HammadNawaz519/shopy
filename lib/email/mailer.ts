/**
 * SHOPY Centralized Mailer Entrypoint
 * Provides backward compatibility and unified access to the email service.
 */

import { getEmailTransporter } from "./transporter";
import {
  sendVerificationOtpEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminNewOrderNotification,
} from "./service";
import { generateSecureOtp, generateSecureToken } from "./security";

// Re-export core transporter singleton
export const getTransporter = getEmailTransporter;
export const transporter = getEmailTransporter();

// Backward compatibility aliases
export const sendVerificationOtp = sendVerificationOtpEmail;
export {
  sendVerificationOtpEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminNewOrderNotification,
  generateSecureOtp,
  generateSecureToken,
};
