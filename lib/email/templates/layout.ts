/**
 * SHOPY Luxury Editorial Email Layout
 * Strict adherence to the brand design system:
 * Background: #F4F4F2 | Primary Text & Accents: #495464 | Subtle: #E8E8E8 | Border/Muted: #BBBFCA
 */

export interface EmailLayoutProps {
  title: string;
  preheader?: string;
  bodyContent: string;
}

export function renderEmailLayout({ title, preheader, bodyContent }: EmailLayoutProps): string {
  const cleanPreheader = preheader
    ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #F4F4F2; opacity: 0;">
        ${preheader}
      </div>`
    : "";

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F4F4F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-padding { padding: 24px 16px !important; }
      .otp-text { font-size: 24px !important; letter-spacing: 4px !important; white-space: nowrap !important; word-break: keep-all !important; display: inline-block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none;">
  ${cleanPreheader}
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F2; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container (max-width 560px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 560px; background-color: #F4F4F2; text-align: center;">
          
          <!-- BRAND LOGO BADGE -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #495464; padding: 10px 32px; border-radius: 2px;">
                    <span style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 18px; font-weight: 300; letter-spacing: 0.35em; color: #F4F4F2; display: block; margin-left: 0.35em; text-transform: uppercase;">SHOPY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TOP DIVIDER -->
          <tr>
            <td style="padding: 0 0 28px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #E8E8E8; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DYNAMIC CONTENT BODY -->
          <tr>
            <td align="center">
              ${bodyContent}
            </td>
          </tr>

          <!-- BOTTOM DIVIDER -->
          <tr>
            <td style="padding: 28px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #E8E8E8; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EDITORIAL MINIMAL FOOTER -->
          <tr>
            <td align="center" style="padding: 0 16px;">
              <p style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 14px; font-weight: 400; letter-spacing: 0.3em; text-transform: uppercase; color: #495464; margin: 0 0 8px 0;">
                SHOPY
              </p>
              <p style="font-size: 11px; line-height: 1.6; letter-spacing: 0.12em; text-transform: uppercase; color: #BBBFCA; margin: 0 0 16px 0;">
                Modern essentials.<br />Refined presence.
              </p>
              <p style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #BBBFCA; opacity: 0.8; margin: 0;">
                &copy; 2026 SHOPY Atelier. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
