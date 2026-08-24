import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";
import { getAccountConfig, getEmailSystemConfig } from "./config";
import { EmailAccountType, SendEmailOptions, SendEmailResult, EMAIL_TYPE_ROUTING } from "./types";

// Cached Transporters per account type (Singleton in Node runtime, safe in Serverless)
const cachedTransporters: Record<EmailAccountType, Transporter | null> = {
  OTP: null,
  ORDER: null,
  SUPPORT: null,
};

/**
 * Returns a cached singleton Nodemailer transporter for the designated SMTP account.
 */
export function getEmailTransporter(accountType: EmailAccountType): Transporter {
  if (cachedTransporters[accountType]) {
    return cachedTransporters[accountType]!;
  }

  const accountConfig = getAccountConfig(accountType);

  const transporter = nodemailer.createTransport({
    host: accountConfig.host,
    port: accountConfig.port,
    secure: accountConfig.secure,
    auth: {
      user: accountConfig.user,
      pass: accountConfig.pass,
    },
    // Resilient timeout configurations for serverless / edge runtime
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,   // 10s
    socketTimeout: 15000,     // 15s
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      rejectUnauthorized: false,
    },
  });

  cachedTransporters[accountType] = transporter;
  return transporter;
}

/**
 * Centralized, secure email dispatch function.
 * Automatically resolves the correct SMTP account based on emailType or explicit accountType.
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
  const transporter = getEmailTransporter(targetAccount);

  const mailOptions: SendMailOptions = {
    from: options.from || accountConfig.fromHeader,
    to: options.to,
    replyTo: options.replyTo || accountConfig.fromAddress,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    const toPreview = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    console.log(
      `[EMAIL DISPATCH SUCCESS] Account: [${targetAccount}] (${accountConfig.user}) | Subject: "${options.subject}" | To: ${toPreview} | MessageId: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
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
