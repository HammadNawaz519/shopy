const nodemailer = require("nodemailer");

async function sendDiagnosticEmail() {
  console.log("----------------------------------------------------------------");
  console.log("Sending Diagnostic Email to hammadnawaz276@gmail.com...");
  console.log("----------------------------------------------------------------");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "shopy.otp@gmail.com",
      pass: "ulpmrzisbyeyifpf",
    },
    debug: true,
    logger: true,
  });

  try {
    const info = await transporter.sendMail({
      from: '"SHOPY Official" <shopy.otp@gmail.com>',
      to: "hammadnawaz276@gmail.com",
      subject: "SHOPY — Direct Test Delivery [Verified]",
      text: "Hello Hammad,\n\nThis is a direct test verification email from SHOPY.\nYour verification code is: 482910\n\nBest regards,\nSHOPY Atelier",
      html: `
        <div style="background-color: #F4F4F2; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #495464; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border: 1px solid #BBBFCA; border-radius: 4px;">
            <h1 style="letter-spacing: 0.3em; margin-bottom: 20px;">SHOPY</h1>
            <p style="font-size: 14px; margin-bottom: 24px;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 0.25em; background: #F4F4F2; padding: 15px; border: 1px solid #E8E8E8; display: inline-block;">
              482910
            </div>
            <p style="font-size: 12px; color: #BBBFCA; margin-top: 24px;">© 2026 SHOPY Atelier. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("\n✓ [SUCCESS] Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Envelope:", info.envelope);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
  } catch (err) {
    console.error("\n✗ [ERROR] Failed to send email:", err);
  }
}

sendDiagnosticEmail();
