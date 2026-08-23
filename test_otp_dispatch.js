const nodemailer = require("nodemailer");

async function main() {
  console.log("Testing Gmail SMTP dispatch directly...");
  
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "shopy.otp@gmail.com",
      pass: "ulpmrzisbyeyifpf", // without spaces
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const verifyRes = await transporter.verify();
    console.log("✓ Transporter verified successfully:", verifyRes);

    const info = await transporter.sendMail({
      from: '"SHOPY Atelier" <shopy.otp@gmail.com>',
      to: "hammadnawaz276@gmail.com",
      subject: "SHOPY — Verification Code [839201]",
      text: "Your SHOPY verification code is: 839201",
      html: "<p>Your code is: <strong>839201</strong></p>"
    });

    console.log("✓ Email dispatched successfully! ID:", info.messageId);
  } catch (err) {
    console.error("✗ SMTP Error Details:", err);
  }
}

main();
