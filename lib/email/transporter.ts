import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";
import crypto from "crypto";
import { getAccountConfig, getEmailSystemConfig } from "./config";
import { EmailAccountType, SendEmailOptions, SendEmailResult, EMAIL_TYPE_ROUTING } from "./types";

// Cached Transporters per account type (Singleton in Node runtime, safe in Serverless)
const cachedTransporters: Record<EmailAccountType, Transporter | null> = {
  OTP: null,
  ORDER: null,
  SUPPORT: null,
};

/**
 * Extracts a clean Fully Qualified Domain Name (FQDN) for SMTP HELO/EHLO handshakes
 * and RFC 5322 Message-ID construction. Prevents spam flags triggered by localhost/non-FQDN IDs.
 */
function resolveSenderDomain(fromAddress: string, appUrl: string): string {
  if (fromAddress && fromAddress.includes("@")) {
    const domain = fromAddress.split("@")[1]?.trim();
    if (domain && domain.includes(".")) {
      return domain;
    }
  }
  try {
    const parsed = new URL(appUrl);
    if (parsed.hostname && parsed.hostname !== "localhost" && parsed.hostname.includes(".")) {
      return parsed.hostname;
    }
  } catch {}
  return "shopy.pk";
}

/**
 * Generates an RFC 5322 compliant unique Message-ID.
 * Guarantees that recipient mail transfer agents (Gmail, Outlook, Yahoo) recognize
 * a valid, resolvable FQDN rather than falling back to local machine hostnames.
 */
function generateMessageId(fromAddress: string, appUrl: string): string {
  const domain = resolveSenderDomain(fromAddress, appUrl);
  const randomHex = crypto.randomBytes(12).toString("hex");
  const timestamp = Date.now();
  return `<shopy-${timestamp}-${randomHex}@${domain}>`;
}

/**
 * Returns a cached singleton Nodemailer transporter for the designated SMTP account.
 * Configures optimal TLS, connection timeouts, and proper HELO/EHLO handshake names.
 */
export function getEmailTransporter(accountType: EmailAccountType): Transporter {
  if (cachedTransporters[accountType]) {
    return cachedTransporters[accountType]!;
  }

  const accountConfig = getAccountConfig(accountType);
  const systemConfig = getEmailSystemConfig();
  const heloDomain = resolveSenderDomain(accountConfig.fromAddress, systemConfig.appUrl);

  const isPort465 = Number(accountConfig.port) === 465;
  const isPort587 = Number(accountConfig.port) === 587;
  const isSecure = accountConfig.secure !== false && isPort465;

  const transporter = nodemailer.createTransport({
    host: accountConfig.host,
    port: accountConfig.port,
    secure: isSecure,
    // Specify FQDN for SMTP HELO/EHLO handshake to avoid HELO_LOCALHOST / HELO_DYNAMIC_IP spam points
    name: heloDomain,
    auth: {
      user: accountConfig.user,
      pass: accountConfig.pass,
    },
    // Resilient timeout configurations for serverless / edge runtime
    connectionTimeout: 15000, // 15s
    greetingTimeout: 15000,   // 15s
    socketTimeout: 20000,     // 20s
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: false,
    },
    ...(isPort587 ? { requireTLS: true } : {}),
  });

  cachedTransporters[accountType] = transporter;
  return transporter;
}

/**
 * Centralized, secure email dispatch function.
 * Automatically resolves the correct SMTP account based on emailType or explicit accountType.
 * Injects anti-spam deliverability headers, RFC Message-ID, and envelope sender alignment.
 */
export async function sendEmailSafe(options: SendEmailOptions): Promise<SendEmailResult> {
  // Resolve account type strictly
  let targetAccount: EmailAccountType = "OTP";

  if (options.emailType && EMAIL_TYPE_ROUTING[options.emailType]) {
    targetAccount = EMAIL_TYPE_ROUTING[options.emailType];
  } else if (options.accountType) {
    targetAccount = options.accountType;
  }

  const accountConfig = getAccountConfig(targetAccount);
  const systemConfig = getEmailSystemConfig();
  const transporter = getEmailTransporter(targetAccount);

  const cleanRecipient = Array.isArray(options.to) ? options.to : [options.to];
  const supportEmail = systemConfig.support.fromAddress || systemConfig.support.user || "shopy.support@gmail.com";
  const customMessageId = options.messageId || generateMessageId(accountConfig.fromAddress, systemConfig.appUrl);

  const isOtpOrAuth =
    options.emailType === "OTP" ||
    options.emailType === "LOGIN_OTP" ||
    options.emailType === "PASSWORD_RESET" ||
    targetAccount === "OTP";

  // Build standard anti-spam & transactional delivery headers
  const deliverabilityHeaders: Record<string, string> = {
    // Suppress auto-responder loops (Out-of-office, vacation responders)
    "X-Auto-Response-Suppress": "All, OOF, AutoReply, NDR",
    "Auto-Submitted": "auto-generated",
    // Clean, brand-identified mailer string
    "X-Mailer": "SHOPY-Atelier-Notification-Engine/2.0",
    // Direct abuse reporting channel for spam trust algorithms
    "X-Report-Abuse": `mailto:${supportEmail}`,
    // Yahoo & Google Sender Compliance headers
    "List-Unsubscribe": `<mailto:${supportEmail}?subject=Unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    // Feedback and tracking
    "Feedback-ID": `${targetAccount.toLowerCase()}:transactional:shopy`,
    // Priority header optimization
    "X-Priority": isOtpOrAuth ? "1" : "3",
    "Importance": isOtpOrAuth ? "high" : "normal",
    "MIME-Version": "1.0",
    ...(options.headers || {}),
  };

  const mailOptions: SendMailOptions = {
    from: options.from || accountConfig.fromHeader,
    to: options.to,
    replyTo: options.replyTo || accountConfig.fromAddress,
    subject: options.subject,
    text: options.text,
    html: options.html,
    messageId: customMessageId,
    // Explicit SMTP Envelope alignment for SPF/Return-Path match
    envelope: {
      from: accountConfig.fromAddress || accountConfig.user,
      to: cleanRecipient,
    },
    sender: accountConfig.fromAddress || accountConfig.user,
    headers: deliverabilityHeaders,
  };

  try {
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    const toPreview = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    console.log(
      `[EMAIL DISPATCH SUCCESS] Account: [${targetAccount}] (${accountConfig.user}) | Subject: "${options.subject}" | To: ${toPreview} | MessageId: ${info.messageId || customMessageId}`
    );

    return {
      success: true,
      messageId: info.messageId || customMessageId,
      accountUsed: targetAccount,
    };
  } catch (err: any) {
    // Zero-leak logging: mask any passwords or sensitive substrings
    const rawMsg = err?.message || "Unknown SMTP error";
    const sanitizedMsg = rawMsg
      .replace(/pass=([^&\s]+)/gi, "pass=***")
      .replace(/password=([^&\s]+)/gi, "password=***");

    console.error(`[EMAIL DISPATCH ERROR] Account [${targetAccount}] (${accountConfig.user}):`, {
      code: err?.code,
      command: err?.command,
      responseCode: err?.responseCode,
      message: sanitizedMsg,
    });

    return {
      success: false,
      accountUsed: targetAccount,
      error: "Unable to send email. Please verify system configuration.",
    };
  }
}

/**
 * Verifies SMTP connectivity and authentication for all three accounts.
 */
export async function verifyAllSmtpConnections(): Promise<
  Record<EmailAccountType, { ok: boolean; user: string; message: string }>
> {
  const accounts: EmailAccountType[] = ["OTP", "ORDER", "SUPPORT"];
  const results: Record<EmailAccountType, { ok: boolean; user: string; message: string }> = {
    OTP: { ok: false, user: "", message: "" },
    ORDER: { ok: false, user: "", message: "" },
    SUPPORT: { ok: false, user: "", message: "" },
  };

  for (const acc of accounts) {
    const config = getAccountConfig(acc);
    results[acc].user = config.user;
    try {
      const transporter = getEmailTransporter(acc);
      await transporter.verify();
      results[acc].ok = true;
      results[acc].message = "Connection and authentication verified successfully.";
    } catch (err: any) {
      results[acc].ok = false;
      results[acc].message = err?.message || "Connection verification failed.";
    }
  }

  return results;
}
