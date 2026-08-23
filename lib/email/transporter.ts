import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";
import { getSmtpConfig } from "./config";

let cachedTransporter: Transporter | null = null;

/**
 * Returns a cached singleton Nodemailer transporter.
 * Configured with resilient timeouts, connection pooling, and secure authentication.
 */
export function getEmailTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getSmtpConfig();

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Resilient timeout configurations for production
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert aborts in local/proxied environments
    },
  });

  return cachedTransporter;
}

export interface SendEmailPayload {
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
  error?: string;
}

/**
 * Sends an email safely.
 * Handles timeouts, logs sanitized diagnostic information server-side,
 * and ensures sensitive credentials are never returned or leaked to callers.
 */
export async function sendEmailSafe(payload: SendEmailPayload): Promise<SendEmailResult> {
  const config = getSmtpConfig();
  const transporter = getEmailTransporter();

  const mailOptions: SendMailOptions = {
    from: payload.from || config.fromHeader,
    to: payload.to,
    replyTo: payload.replyTo || config.fromAddress,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  };

  try {
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH SUCCESS] Subject: "${payload.subject}" | To: ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to} | MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    // Zero-leak logging: log sanitized technical error message server-side only
    console.error("[EMAIL DISPATCH ERROR] Failed to send email via SMTP:", {
      code: err?.code,
      command: err?.command,
      responseCode: err?.responseCode,
      message: err?.message ? err.message.replace(/pass=([^&\s]+)/gi, "pass=***") : "Unknown SMTP error",
    });

    return {
      success: false,
      error: "Failed to dispatch email. Please verify SMTP configuration.",
    };
  }
}

/**
 * Verifies the SMTP connection and authentication.
 * Useful for development diagnostics and health checks.
 */
export async function verifySmtpConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    return { ok: true, message: "SMTP server connection verified successfully." };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Failed to connect to SMTP server.",
    };
  }
}
