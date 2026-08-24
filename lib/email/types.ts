/**
 * SHOPY Centralized Email Types & Account Routing Definitions
 *
 * Enforces strict architectural separation of concerns:
 * 1. OTP / Security -> shopy.otp@gmail.com
 * 2. Order Lifecycle -> shopy.orderupdate@gmail.com
 * 3. Support & Inquiries -> shopy.support@gmail.com
 */

export type EmailAccountType = "OTP" | "ORDER" | "SUPPORT";

export type EmailType =
  // 1. OTP / Security Account Types
  | "OTP"
  | "LOGIN_OTP"
  | "PASSWORD_RESET"
  | "ACCOUNT_VERIFICATION"
  | "WELCOME"
  // 2. Order Lifecycle Account Types
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_PROCESSING"
  | "ORDER_SHIPPED"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "ORDER_REFUNDED"
  | "ADMIN_NEW_ORDER"
  // 3. Customer Support Account Types
  | "CONTACT_FORM"
  | "CUSTOMER_SUPPORT"
  | "GENERAL_INQUIRY"
  | "RETURN_SUPPORT"
  | "SUPPORT_ACKNOWLEDGMENT";

/**
 * Strict Immutable Routing Map
 * Determines the exact SMTP sender account for every email purpose in the application.
 */
export const EMAIL_TYPE_ROUTING: Record<EmailType, EmailAccountType> = {
  // OTP / Security
  OTP: "OTP",
  LOGIN_OTP: "OTP",
  PASSWORD_RESET: "OTP",
  ACCOUNT_VERIFICATION: "OTP",
  WELCOME: "OTP",

  // Order Lifecycle
  ORDER_PLACED: "ORDER",
  ORDER_CONFIRMED: "ORDER",
  ORDER_PROCESSING: "ORDER",
  ORDER_SHIPPED: "ORDER",
  ORDER_OUT_FOR_DELIVERY: "ORDER",
  ORDER_DELIVERED: "ORDER",
  ORDER_CANCELLED: "ORDER",
  ORDER_REFUNDED: "ORDER",
  ADMIN_NEW_ORDER: "ORDER",

  // Support & Concierge
  CONTACT_FORM: "SUPPORT",
  CUSTOMER_SUPPORT: "SUPPORT",
  GENERAL_INQUIRY: "SUPPORT",
  RETURN_SUPPORT: "SUPPORT",
  SUPPORT_ACKNOWLEDGMENT: "SUPPORT",
};

export interface SendEmailOptions {
  emailType?: EmailType;
  accountType?: EmailAccountType;
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  accountUsed: EmailAccountType;
  error?: string;
}
