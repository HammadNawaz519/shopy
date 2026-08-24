import { renderEmailLayout } from "./layout";
import { escapeEmailHtml } from "../security";

export interface ContactFormAdminEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryId?: number | string;
}

export function renderContactFormAdminEmail({
  name,
  email,
  subject,
  message,
  inquiryId,
}: ContactFormAdminEmailProps): { subject: string; text: string; html: string } {
  const safeName = escapeEmailHtml(name);
  const safeEmail = escapeEmailHtml(email);
  const safeSubject = escapeEmailHtml(subject);
  const safeMessage = escapeEmailHtml(message).replace(/\n/g, "<br />");
  const refText = inquiryId ? `[INQ-${inquiryId}]` : "";

  const emailSubject = `[SHOPY Concierge] ${refText} New Inquiry: ${subject}`;
  const preheader = `New customer message from ${name} (${email})`;

  const bodyContent = `
    <!-- HEADER -->
    <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 26px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: #495464; margin: 0 0 12px 0;">
      New Concierge Inquiry
    </h1>
    <p style="font-size: 13px; line-height: 1.6; color: #495464; margin: 0 0 24px 0;">
      A customer has submitted a message via the SHOPY Atelier contact form.
    </p>

    <!-- INQUIRY CARD -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; text-align: left; margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 20px 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; line-height: 1.8; color: #495464;">
            <tr>
              <td style="padding: 4px 0; width: 100px; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; color: #495464;">From:</td>
              <td style="padding: 4px 0; font-weight: 500;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; color: #495464;">Email:</td>
              <td style="padding: 4px 0;"><a href="mailto:${safeEmail}" style="color: #495464; text-decoration: underline;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; color: #495464;">Subject:</td>
              <td style="padding: 4px 0; font-weight: 500;">${safeSubject}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 24px 20px 24px;">
          <div style="border-top: 1px solid #BBBFCA; padding-top: 16px;">
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #495464; display: block; margin-bottom: 8px;">Message:</span>
            <div style="font-size: 13px; line-height: 1.7; color: #181A1D; font-style: normal;">
              ${safeMessage}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- ACTION BUTTON -->
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
      <tr>
        <td align="center" style="background-color: #495464; border-radius: 2px;">
          <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}" style="font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: #F4F4F2; text-decoration: none; padding: 12px 28px; display: inline-block;">
            Reply to ${safeName}
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = `
SHOPY Atelier - Concierge Inquiry

From: ${name} (${email})
Subject: ${subject}
Message:
${message}

Reply to: ${email}
  `.trim();

  const html = renderEmailLayout({
    title: emailSubject,
    preheader,
    bodyContent,
  });

  return { subject: emailSubject, text, html };
}

export interface ContactFormAcknowledgmentProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function renderContactFormAcknowledgmentEmail({
  name,
  subject,
}: ContactFormAcknowledgmentProps): { subject: string; text: string; html: string } {
  const safeName = escapeEmailHtml(name);
  const safeSubject = escapeEmailHtml(subject);

  const emailSubject = `We have received your message | SHOPY Concierge`;
  const preheader = `Thank you for contacting SHOPY. Our concierge team will assist you shortly.`;

  const bodyContent = `
    <!-- HEADER -->
    <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 26px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: #495464; margin: 0 0 12px 0;">
      Message Received
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #495464; margin: 0 0 20px 0;">
      Dear ${safeName || "Client"},
    </p>
    <p style="font-size: 13px; line-height: 1.7; color: #495464; margin: 0 0 24px 0;">
      Thank you for contacting the SHOPY Atelier Concierge regarding <strong>&ldquo;${safeSubject}&rdquo;</strong>. We have received your dispatch and a concierge specialist will review your inquiry and respond within 24 hours.
    </p>

    <!-- ASSISTANCE CARD -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; text-align: center; margin: 0 0 24px 0; padding: 20px;">
      <tr>
        <td>
          <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #495464; margin: 0 0 6px 0; font-weight: 600;">
            Atelier Concierge Hours
          </p>
          <p style="font-size: 12px; line-height: 1.6; color: #495464; margin: 0;">
            Monday &ndash; Saturday &bull; 09:00 &ndash; 20:00 PKT<br />
            Private Atelier Dispatches &bull; <a href="mailto:shopy.support@gmail.com" style="color: #495464; text-decoration: underline;">shopy.support@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; line-height: 1.6; color: #BBBFCA; margin: 0;">
      If your inquiry is regarding an existing order, please have your order number ready for prompt service.
    </p>
  `;

  const text = `
SHOPY Atelier - Message Received

Dear ${name || "Client"},

Thank you for contacting SHOPY regarding "${subject}". We have received your message and our concierge team will respond within 24 hours.

SHOPY Concierge
shopy.support@gmail.com
  `.trim();

  const html = renderEmailLayout({
    title: emailSubject,
    preheader,
    bodyContent,
  });

  return { subject: emailSubject, text, html };
}
