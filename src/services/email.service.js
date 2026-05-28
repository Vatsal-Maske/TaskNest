import nodemailer from "nodemailer";

// ─── Create Gmail OAuth2 Transporter ─────────────────────────────────────────
// OAuth2 is more secure than an App Password — it uses rotating tokens.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

// Verify transporter connection in development mode only
// This logs a success/failure message on server startup so you know immediately
// if your OAuth2 credentials are correct.
if (process.env.NODE_ENV === "development") {
  transporter.verify((error) => {
    if (error) {
      console.error("❌ Email transporter error:", error.message);
    } else {
      console.log("✅ Email transporter ready (Gmail OAuth2)");
    }
  });
}

/**
 * Sends an email using the Gmail OAuth2 transporter.
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} text    - Plain text fallback body
 * @param {string} html    - HTML body (shown in modern email clients)
 */
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM || "StudyOS"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to} — Message ID: ${info.messageId}`);
  return info;
};

export default sendEmail;
