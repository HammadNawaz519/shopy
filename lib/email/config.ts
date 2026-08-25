/**
 * SHOPY Multi-Account SMTP Email Configuration
 * Server-only environment variable parsing with zero-leak guarantees.
 *
 * Responsibilities:
 * - OTP / Security -> SMTP_OTP_*
 * - Order Lifecycle -> SMTP_ORDER_*
 * - Support & Concierge -> SMTP_SUPPORT_*
 */

import { EmailAccountType } from "./types";

export interface SmtpAccountConfig {
  accountType: EmailAccountType;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
  fromHeader: string;
}

export interface EmailSystemConfig {
  otp: SmtpAccountConfig;
  order: SmtpAccountConfig;
  support: SmtpAccountConfig;
  adminEmail: string;
  appUrl: string;
  appName: string;
}

function cleanEnv(value: string | undefined, fallback: string = ""): string {
  if (!value) return fallback;
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function buildAccountConfig(
  accountType: EmailAccountType,
  envPrefix: string,
  defaultEmail: string,
  defaultFromName: string
): SmtpAccountConfig {
  const host = cleanEnv(
    process.env[`SHOPY_${accountType}_HOST`] ||
      process.env[`${envPrefix}_HOST`] ||
      process.env.SMTP_HOST,
    "smtp.gmail.com"
  );
  const port = Number(
    cleanEnv(
      process.env[`SHOPY_${accountType}_PORT`] ||
        process.env[`${envPrefix}_PORT`] ||
        process.env.SMTP_PORT,
      "465"
    )
  ) || 465;
  const secure =
    cleanEnv(
      process.env[`SHOPY_${accountType}_SECURE`] ||
        process.env[`${envPrefix}_SECURE`] ||
        process.env.SMTP_SECURE,
      "true"
    ) !== "false";

  // Account specific credentials with backward-compatible fallbacks
  const user = cleanEnv(
    process.env[`SHOPY_${accountType}_EMAIL`] ||
      process.env[`SHOPY_${accountType}_USER`] ||
      process.env[`${envPrefix}_USER`] ||
      process.env[`${envPrefix}_EMAIL`] ||
      (accountType === "OTP" ? process.env.SMTP_USER : undefined),
    defaultEmail
  );

  const pass = cleanEnv(
    process.env[`SHOPY_${accountType}_EMAIL_PASSWORD`] ||
      process.env[`SHOPY_${accountType}_PASSWORD`] ||
      process.env[`SHOPY_${accountType}_PASS`] ||
      process.env[`${envPrefix}_PASSWORD`] ||
      process.env[`${envPrefix}_PASS`] ||
      (accountType === "OTP"
        ? process.env.SMTP_PASSWORD || process.env.SMTP_PASS
        : undefined),
    ""
  ).replace(/\s+/g, "");

  const fromName = cleanEnv(
    process.env[`SHOPY_${accountType}_FROM_NAME`] ||
      process.env[`${envPrefix}_FROM_NAME`] ||
      process.env.SMTP_FROM_NAME,
    defaultFromName
  );

  const defaultFrom = `"${fromName}" <${user}>`;
  const rawFrom = cleanEnv(
    process.env[`SHOPY_${accountType}_FROM`] ||
      process.env[`${envPrefix}_FROM`],
    defaultFrom
  );

  let fromAddress = user;
  let fromHeader = defaultFrom;

  const emailMatch = rawFrom.match(/<([^>]+)>/);
  if (emailMatch && emailMatch[1]) {
    fromAddress = emailMatch[1].trim();
    fromHeader = rawFrom;
  } else if (rawFrom.includes("@")) {
    fromAddress = rawFrom;
    fromHeader = `"${fromName}" <${rawFrom}>`;
  }

  return {
    accountType,
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromAddress,
    fromHeader,
  };
}

export function getEmailSystemConfig(): EmailSystemConfig {
  const otp = buildAccountConfig(
    "OTP",
    "SMTP_OTP",
    "shopy.otp@gmail.com",
    "SHOPY Security"
  );

  const order = buildAccountConfig(
    "ORDER",
    "SMTP_ORDER",
    "shopy.orderupdate@gmail.com",
    "SHOPY Orders"
  );

  const support = buildAccountConfig(
    "SUPPORT",
    "SMTP_SUPPORT",
    "shopy.support@gmail.com",
    "SHOPY Support"
  );

  const adminEmail = cleanEnv(process.env.ADMIN_EMAIL, "hammadnawaz276@gmail.com");
  const appUrl = cleanEnv(
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL,
    "http://localhost:3000"
  );
  const appName = cleanEnv(process.env.NEXT_PUBLIC_APP_NAME, "SHOPY");

  return {
    otp,
    order,
    support,
    adminEmail,
    appUrl,
    appName,
  };
}

export function getAccountConfig(accountType: EmailAccountType): SmtpAccountConfig {
  const config = getEmailSystemConfig();
  switch (accountType) {
    case "OTP":
      return config.otp;
    case "ORDER":
      return config.order;
    case "SUPPORT":
      return config.support;
    default:
      return config.otp;
  }
}
