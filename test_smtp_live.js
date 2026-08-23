const nodemailer = require("nodemailer");

async function testSmtpLive() {
  console.log("Testing SMTP Gmail connection directly...");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "shopy.otp@gmail.com",
      pass: "ulpm rzis byey ifpf",
    },
  });

  const info = await transporter.sendMail({
    from: '"SHOPY" <shopy.otp@gmail.com>',
    to: "hammadnawaz276@gmail.com",
    subject: "749210 is your SHOPY verification code",
    text: "Your SHOPY verification code is 749210.",
    html: "<h1>SHOPY</h1><p>Your verification code is: <strong>749210</strong></p>",
  });

  console.log("✓ Email successfully sent! Message ID:", info.messageId);
}

testSmtpLive().catch((err) => console.error("✗ SMTP Error:", err));
