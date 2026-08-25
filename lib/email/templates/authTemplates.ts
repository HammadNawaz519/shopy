import { renderEmailLayout } from "./layout";
import { escapeEmailHtml } from "../security";

export interface VerificationOtpProps {
  email: string;
  name?: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export function renderVerificationOtpEmail({
  email,
  name,
  otpCode,
  expiresInMinutes = 10,
}: VerificationOtpProps): { subject: string; text: string; html: string } {
  const safeName = name ? escapeEmailHtml(name) : "Client";
  const formattedOtp = otpCode.split("").join(" ");
  const subject = "Verification Code";

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
      <!-- HEADING -->
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            VERIFY YOUR EMAIL
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
            Hello ${safeName}, use the verification code below to complete your authentication.
          </p>
        </td>
      </tr>

      <!-- OTP CODE CONTAINER -->
      <tr>
        <td align="center" style="padding: 10px 16px 24px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 360px;">
            <tr>
              <td align="center" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 22px 16px; border-radius: 2px;">
                <div class="otp-text" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #495464; line-height: 1; margin-left: 0.25em;">
                  ${formattedOtp}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- EXPIRATION NOTE -->
      <tr>
        <td align="center" style="padding: 0 24px 8px 24px;">
          <p style="font-size: 12px; line-height: 1.6; letter-spacing: 0.05em; color: #495464; margin: 0 0 6px 0; font-weight: 500;">
            This single-use code is valid for ${expiresInMinutes} minutes.
          </p>
          <p style="font-size: 11px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; opacity: 0.65; margin: 0;">
            If you did not initiate this request, please disregard this message.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Your verification code is ${otpCode}. Expires in ${expiresInMinutes} minutes.`,
    bodyContent,
  });

  const text = `
SHOPY — VERIFICATION CODE
----------------------------------------
Hello ${safeName},

Use the verification code below to continue:

      ${formattedOtp}

This code expires in ${expiresInMinutes} minutes.
If you did not request this code, you can safely ignore this email.

----------------------------------------
SHOPY
Modern essentials.
Refined presence.
© 2026 SHOPY
  `.trim();

  return { subject, text, html };
}

export function renderLoginOtpEmail({
  email,
  name,
  otpCode,
  expiresInMinutes = 10,
}: VerificationOtpProps): { subject: string; text: string; html: string } {
  const safeName = name ? escapeEmailHtml(name) : "Client";
  const formattedOtp = otpCode.split("").join(" ");
  const subject = "Verification Code";

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            YOUR LOGIN CODE
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
            Hello ${safeName}, use the single-use login code below to sign in.
          </p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 10px 16px 24px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 360px;">
            <tr>
              <td align="center" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 22px 16px; border-radius: 2px;">
                <div class="otp-text" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #495464; line-height: 1; margin-left: 0.25em;">
                  ${formattedOtp}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 0 24px 8px 24px;">
          <p style="font-size: 12px; line-height: 1.6; letter-spacing: 0.05em; color: #495464; margin: 0 0 6px 0; font-weight: 500;">
            This single-use code is valid for ${expiresInMinutes} minutes.
          </p>
          <p style="font-size: 11px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; opacity: 0.65; margin: 0;">
            Never share this security code with anyone.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Your login code is ${otpCode}. Expires in ${expiresInMinutes} minutes.`,
    bodyContent,
  });

  const text = `
SHOPY — LOGIN CODE
----------------------------------------
Hello ${safeName},

Use the login code below to access your account:

      ${formattedOtp}

This code expires in ${expiresInMinutes} minutes.
If you did not request this login code, please secure your credentials.

----------------------------------------
SHOPY
Modern essentials.
Refined presence.
© 2026 SHOPY
  `.trim();

  return { subject, text, html };
}

export interface PasswordResetProps {
  email: string;
  name?: string;
  resetUrl?: string;
  otpCode?: string;
  expiresInMinutes?: number;
}

export function renderPasswordResetEmail({
  email,
  name,
  resetUrl,
  otpCode,
  expiresInMinutes = 10,
}: PasswordResetProps): { subject: string; text: string; html: string } {
  const safeName = name ? escapeEmailHtml(name) : "Client";
  const subject = otpCode ? "Verification Code" : "Password Recovery Request";

  const codeSection = otpCode
    ? `
      <tr>
        <td align="center" style="padding: 10px 16px 24px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 360px;">
            <tr>
              <td align="center" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 22px 16px; border-radius: 2px;">
                <div class="otp-text" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #495464; line-height: 1; margin-left: 0.25em;">
                  ${otpCode.split("").join(" ")}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  const buttonSection = resetUrl
    ? `
      <tr>
        <td align="center" style="padding: 12px 16px 24px 16px;">
          <a href="${resetUrl}" style="background-color: #495464; color: #F4F4F2; text-decoration: none; padding: 14px 34px; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 600; display: inline-block; border-radius: 2px;">
            Reset Password
          </a>
        </td>
      </tr>
    `
    : "";

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 10px 0;">
            PASSWORD RECOVERY
          </h1>
          <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
            Hello ${safeName}, we received a request to reset your SHOPY client account password.
          </p>
        </td>
      </tr>

      ${codeSection}
      ${buttonSection}

      <tr>
        <td align="center" style="padding: 0 24px 8px 24px;">
          <p style="font-size: 12px; line-height: 1.6; letter-spacing: 0.05em; color: #495464; margin: 0 0 6px 0; font-weight: 500;">
            This request is valid for ${expiresInMinutes} minutes.
          </p>
          <p style="font-size: 11px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; opacity: 0.65; margin: 0;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: otpCode ? `Your verification code is ${otpCode}.` : `Reset your SHOPY password.`,
    bodyContent,
  });

  const text = `
SHOPY — PASSWORD RECOVERY
----------------------------------------
Hello ${safeName},

We received a request to reset your account password.
${otpCode ? `\nVerification Code: ${otpCode}\n` : ""}${resetUrl ? `\nReset Link: ${resetUrl}\n` : ""}
This request expires in ${expiresInMinutes} minutes.
If you did not request this, you can safely ignore this email.

----------------------------------------
SHOPY
Modern essentials.
Refined presence.
© 2026 SHOPY
  `.trim();

  return { subject, text, html };
}

export interface WelcomeEmailProps {
  email: string;
  name?: string;
}

export function renderWelcomeEmail({
  email,
  name,
}: WelcomeEmailProps): { subject: string; text: string; html: string } {
  const safeName = name ? escapeEmailHtml(name) : "Client";
  const subject = "Welcome to SHOPY Atelier";

  const bodyContent = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
      <tr>
        <td align="center" style="padding: 0 16px 20px 16px;">
          <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 12px 0;">
            WELCOME TO THE ATELIER
          </h1>
          <p style="font-size: 13px; line-height: 1.7; letter-spacing: 0.04em; color: #495464; margin: 0 0 16px 0; opacity: 0.85;">
            Dear ${safeName}, thank you for creating your account with SHOPY.
          </p>
          <p style="font-size: 12px; line-height: 1.7; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.75;">
            Discover curated contemporary silhouettes, refined textures, and timeless wardrobe essentials designed with precision.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: "Welcome to SHOPY — Modern essentials, refined presence.",
    bodyContent,
  });

  const text = `
WELCOME TO SHOPY ATELIER
----------------------------------------
Dear ${safeName},

Thank you for creating your account with SHOPY.
Discover curated contemporary silhouettes, refined textures, and timeless wardrobe essentials designed with precision.

----------------------------------------
SHOPY
Modern essentials.
Refined presence.
© 2026 SHOPY
  `.trim();

  return { subject, text, html };
}
