import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import noteRoutes from "./routes/note.routes.js";
import examRoutes from "./routes/exam.routes.js";
import studySessionRoutes from "./routes/studySession.routes.js";
import resourceRoutes from "./routes/resource.routes.js";

// Middleware imports
import errorHandler from "./middleware/error.middleware.js";

// Email test (development only)
import sendEmail from "./services/email.service.js";

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────

// Enable CORS with credentials so cookies are sent cross-origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (e.g. form submissions)
app.use(express.urlencoded({ extended: true }));

// Parse cookies from request headers
app.use(cookieParser());

// ─── API Routes ─────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/study-sessions", studySessionRoutes);
app.use("/api/resources", resourceRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ success: true, message: "StudyOS API is running 🚀" });
});

// ─── Test Email Route (Development Only) ─────────────────────────────────────
// Sends a test email to EMAIL_USER to verify OAuth2 config is working.
// Remove this route before deploying to production.

app.get("/api/test/send-email", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ success: false, message: "Test routes disabled in production" });
  }

  const recipient = process.env.EMAIL_USER;
  if (!recipient) {
    return res.status(500).json({ success: false, message: "EMAIL_USER is not set in .env" });
  }

  const now = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long" });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9f9f9;border-radius:8px;">
      <h2 style="color:#6366f1;">📚 StudyOS — Email Test</h2>
      <p>This is a test email to confirm your <strong>Gmail OAuth2</strong> configuration is working correctly.</p>
      <div style="background:#fff;border-left:4px solid #6366f1;padding:16px;border-radius:4px;margin:16px 0;">
        <p style="margin:0;"><strong>📅 Sent at:</strong> ${now}</p>
        <p style="margin:4px 0;"><strong>🌐 Environment:</strong> ${process.env.NODE_ENV}</p>
        <p style="margin:4px 0;"><strong>📬 Recipient:</strong> ${recipient}</p>
      </div>
      <p style="color:#22c55e;">✅ If you received this, your email system is fully operational!</p>
      <p style="color:#888;font-size:12px;">— StudyOS Backend</p>
    </div>
  `;

  try {
    const info = await sendEmail(
      recipient,
      "StudyOS Email Test — OAuth2 Verification",
      `StudyOS Email Test — sent at ${now}`,
      html
    );
    res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      messageId: info.messageId,
      sentAt: now,
    });
  } catch (err) {
    // Return error details without exposing secrets
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: err.message,
      hint: "Check EMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env",
    });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
// Catches any requests that don't match the defined routes

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// Must be LAST middleware - Express identifies it by the 4 parameters

app.use(errorHandler);

export default app;
