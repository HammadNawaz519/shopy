import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "shopy.otp@gmail.com";
const smtpPass = (process.env.SMTP_PASS || "ulpm rzis byey ifpf").replace(/\s+/g, "");
const smtpFrom = process.env.SMTP_FROM || `SHOPY Verification <${smtpUser}>`;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false", // true for 465, false for 587
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends a 6-digit OTP verification email styled with SHOPY luxury editorial aesthetics.
 */
export async function sendVerificationOtp(to: string, otpCode: string, name?: string) {
  const recipientName = name || "Valued Client";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SHOPY Atelier — Verification Code</title>
  <style>
    body {
      background-color: #F4F4F2;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      color: #495464;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #BBBFCA;
      padding: 40px 32px;
      text-align: center;
    }
    .brand {
      background-color: #495464;
      color: #F4F4F2;
      display: inline-block;
      padding: 8px 24px;
      font-size: 16px;
      letter-spacing: 0.35em;
      font-family: "Georgia", serif;
      font-weight: 300;
      margin-bottom: 28px;
    }
    .title {
      font-family: "Georgia", serif;
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 0.05em;
      color: #495464;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #495464;
      opacity: 0.7;
      margin-bottom: 28px;
    }
    .otp-card {
      background-color: #F4F4F2;
      border: 1px solid #E8E8E8;
      padding: 24px;
      margin: 24px 0;
    }
    .otp-code {
      font-family: "Georgia", serif;
      font-size: 34px;
      font-weight: 600;
      letter-spacing: 0.3em;
      color: #495464;
      margin: 8px 0;
    }
    .notice {
      font-size: 11px;
      line-height: 1.6;
      color: #495464;
      opacity: 0.8;
      margin-top: 24px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #E8E8E8;
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #495464;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">SHOPY</div>
    <div class="title">Security Verification</div>
    <div class="subtitle">Account Authentication Request</div>
    
    <p style="font-size: 13px; line-height: 1.5; color: #495464; margin: 0 0 16px;">
      Hello ${recipientName},<br>
      Please use the single-use verification code below to authorize your account action:
    </p>

    <div class="otp-card">
      <div style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; opacity: 0.6;">Your 6-Digit Code</div>
      <div class="otp-code">${otpCode}</div>
      <div style="font-size: 10px; color: #495464; opacity: 0.7;">Expires in 10 minutes</div>
    </div>

    <p class="notice">
      If you did not request this verification code, please disregard this communication. For your protection, never share this code with anyone.
    </p>

    <div class="footer">
      SHOPY Atelier • Architectural Silhouettes & Modern Essentials<br>
      Lahore • Islamabad • Karachi
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `SHOPY Atelier — Security Verification Code [${otpCode}]`,
    text: `Your SHOPY verification code is: ${otpCode}. It expires in 10 minutes. If you did not request this code, please ignore this email.`,
    html,
  });
}

/**
 * Sends a password recovery email.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string, name?: string) {
  const recipientName = name || "Valued Client";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SHOPY — Password Recovery</title>
  <style>
    body {
      background-color: #F4F4F2;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      color: #495464;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #BBBFCA;
      padding: 40px 32px;
      text-align: center;
    }
    .brand {
      background-color: #495464;
      color: #F4F4F2;
      display: inline-block;
      padding: 8px 24px;
      font-size: 16px;
      letter-spacing: 0.35em;
      font-family: "Georgia", serif;
      font-weight: 300;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      background-color: #495464;
      color: #F4F4F2 !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 11px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      font-weight: 600;
      margin: 24px 0;
    }
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #E8E8E8;
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #495464;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">SHOPY</div>
    <h2 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 400; color: #495464; margin-bottom: 12px;">Reset Your Password</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #495464;">
      Hello ${recipientName},<br>
      We received a request to reset the password for your SHOPY client account. Click the button below to establish a new password:
    </p>

    <a href="${resetUrl}" class="btn">Reset Password</a>

    <p style="font-size: 11px; color: #495464; opacity: 0.7; word-break: break-all;">
      Or copy and paste this link into your browser:<br>
      ${resetUrl}
    </p>

    <div class="footer">
      SHOPY Atelier • Automated Security System
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "SHOPY — Password Reset Request",
    text: `Reset your SHOPY password using the following link: ${resetUrl}`,
    html,
  });
}
