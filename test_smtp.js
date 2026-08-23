const nodemailer = require("nodemailer");

async function testSmtp() {
  console.log("Testing Gmail SMTP Connection for shopy.otp@gmail.com...");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "shopy.otp@gmail.com",
      pass: "ulpmrzisbyeyifpf", // spaces removed
    },
  });

  try {
    await transporter.verify();
    console.log("✓ SMTP Transporter Verified Successfully! Credentials and SSL handshake OK.");

    // Send a test verification code email
    const info = await transporter.sendMail({
      from: '"SHOPY Atelier" <shopy.otp@gmail.com>',
      to: "hammadnawaz276@gmail.com",
      subject: "SHOPY Atelier — Security Verification Code [749210]",
      text: "Your SHOPY verification code is: 749210. It expires in 10 minutes.",
      html: `
        <div style="font-family: serif; padding: 20px; background: #F4F4F2; color: #495464; border: 1px solid #BBBFCA; max-width: 500px;">
          <h2 style="letter-spacing: 0.2em;">SHOPY ATELIER</h2>
          <p>Your Security Verification Code is:</p>
          <h1 style="letter-spacing: 0.3em; background: #E8E8E8; padding: 10px; display: inline-block;">749210</h1>
          <p style="font-size: 11px; opacity: 0.7;">Expires in 10 minutes. Sent via shopy.otp@gmail.com</p>
        </div>
      `,
    });

    console.log("✓ Test Verification Code Email Sent Successfully!");
    console.log(" - Message ID:", info.messageId);
    console.log(" - Accepted:", info.accepted);
  } catch (err) {
    console.error("✗ SMTP Connection Failed:", err);
  }
}

testSmtp();
