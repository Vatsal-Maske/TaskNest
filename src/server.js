import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import startExamReminderCron from "./services/examReminder.service.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start the server and background jobs
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 StudyOS server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  });

  // Start the daily exam reminder cron job after DB is ready
  startExamReminderCron();
});
