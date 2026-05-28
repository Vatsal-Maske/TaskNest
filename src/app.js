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
