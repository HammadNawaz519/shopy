const nodemailer = require("nodemailer");

async function testRedesignedEmail() {
  console.log("Sending live redesigned verification email to hammadnawaz276@gmail.com...");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "shopy.otp@gmail.com",
      pass: "ulpmrzisbyeyifpf",
    },
  });

  const otpCode = "482916";
  const formattedOtp = otpCode.split("").join(" ");

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SHOPY — Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F2; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container (max-width 560px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #F4F4F2; text-align: center;">
          
          <!-- BRAND LOGO LABEL -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #495464; padding: 10px 28px; border-radius: 2px;">
                    <span style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 18px; font-weight: 300; letter-spacing: 0.35em; color: #F4F4F2; display: block; margin-left: 0.35em; text-transform: uppercase;">SHOPY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TOP DIVIDER -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #E8E8E8; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HEADING & MESSAGE -->
          <tr>
            <td align="center" style="padding: 0 16px 24px 16px;">
              <h1 style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 22px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: #495464; margin: 0 0 12px 0;">
                YOUR VERIFICATION CODE
              </h1>
              <p style="font-size: 13px; line-height: 1.6; letter-spacing: 0.04em; color: #495464; margin: 0; opacity: 0.85;">
                Use the verification code below to continue.
              </p>
            </td>
          </tr>

          <!-- OTP CODE CONTAINER -->
          <tr>
            <td align="center" style="padding: 12px 16px 28px 16px;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 360px;">
                <tr>
                  <td align="center" style="background-color: #E8E8E8; border: 1px solid #BBBFCA; padding: 24px 16px; border-radius: 2px;">
                    <div style="font-family: 'Courier New', Courier, 'Georgia', monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #495464; line-height: 1; margin-left: 0.25em;">
                      ${formattedOtp}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EXPIRATION & SECURITY NOTICES -->
          <tr>
            <td align="center" style="padding: 0 24px 32px 24px;">
              <p style="font-size: 12px; line-height: 1.6; letter-spacing: 0.05em; color: #495464; margin: 0 0 8px 0; font-weight: 500;">
                This code expires in 10 minutes.
              </p>
              <p style="font-size: 11px; line-height: 1.6; letter-spacing: 0.03em; color: #495464; opacity: 0.65; margin: 0;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- BOTTOM DIVIDER -->
          <tr>
            <td style="padding: 0 0 32px 0;">
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
              <p style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #BBBFCA; opacity: 0.75; margin: 0;">
                &copy; 2026 SHOPY
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
SHOPY
----------------------------------------

YOUR VERIFICATION CODE

Use the verification code below to continue.

      ${formattedOtp}

This code expires in 10 minutes.

If you didn't request this code, you can safely ignore this email.

----------------------------------------

SHOPY
Modern essentials.
Refined presence.

© 2026 SHOPY
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: '"SHOPY" <shopy.otp@gmail.com>',
      to: "hammadnawaz276@gmail.com",
      subject: `SHOPY — Verification Code [${otpCode}]`,
      text,
      html,
    });
    console.log("✓ Live Email Dispatched Successfully!");
    console.log(" - Message ID:", info.messageId);
    console.log(" - Recipient:", info.accepted);
  } catch (err) {
    console.error("✗ Failed to dispatch email:", err);
  }
}

testRedesignedEmail();
