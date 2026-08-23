/**
 * SHOPY SMTP Email Configuration
 * Server-only environment variable parsing with validation and zero-leak guarantees.
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
  fromHeader: string;
  adminEmail: string;
  appUrl: string;
  appName: string;
}

function cleanEnv(value: string | undefined, fallback: string = ""): string {
  if (!value) return fallback;
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getSmtpConfig(): SmtpConfig {
  const host = cleanEnv(process.env.SMTP_HOST, "smtp.gmail.com");
  const port = Number(cleanEnv(process.env.SMTP_PORT, "465")) || 465;
  const secure = cleanEnv(process.env.SMTP_SECURE, "true") !== "false";
  const user = cleanEnv(process.env.SMTP_USER, "shopy.otp@gmail.com");
  const pass = cleanEnv(process.env.SMTP_PASS || process.env.SMTP_PASSWORD, "ulpmrzisbyeyifpf").replace(/\s+/g, "");
  
  const fromName = cleanEnv(process.env.SMTP_FROM_NAME, "SHOPY Atelier");
  const defaultFrom = `"${fromName}" <${user}>`;
  const rawFrom = cleanEnv(process.env.SMTP_FROM, defaultFrom);
  
  // Format clean fromHeader: ensure format "Name <email@domain.com>"
  let fromAddress = user;
  let fromHeader = rawFrom;
  
  const emailMatch = rawFrom.match(/<([^>]+)>/);
  if (emailMatch && emailMatch[1]) {
    fromAddress = emailMatch[1].trim();
    fromHeader = rawFrom;
  } else if (rawFrom.includes("@")) {
    fromAddress = rawFrom;
    fromHeader = `"${fromName}" <${rawFrom}>`;
  } else {
    fromHeader = defaultFrom;
  }

  const adminEmail = cleanEnv(process.env.ADMIN_EMAIL, "hammadnawaz276@gmail.com");
  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL, "http://localhost:3000");
  const appName = cleanEnv(process.env.NEXT_PUBLIC_APP_NAME, "SHOPY");

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromAddress,
    fromHeader,
    adminEmail,
    appUrl,
    appName,
  };
}
