import cron from "node-cron";
import Exam from "../models/exam.model.js";
import sendEmail from "./email.service.js";

/**
 * Starts a daily cron job that checks for upcoming exams (within 24 hours)
 * and sends a reminder email to the student.
 *
 * Cron pattern "0 8 * * *" = runs every day at 8:00 AM server time.
 */
const startExamReminderCron = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Running exam reminder cron job...");

    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find exams that:
      // 1. Are still "upcoming" (not completed)
      // 2. Haven't had a reminder sent yet
      // 3. Have an examDate within the next 24 hours
      const upcomingExams = await Exam.find({
        status: "upcoming",
        reminderSent: false,
        examDate: { $gte: now, $lte: next24Hours },
      })
        .populate("userId", "name email")    // Get user's name and email
        .populate("subjectId", "name");       // Get subject name

      if (upcomingExams.length === 0) {
        console.log("📭 No upcoming exams in next 24 hours.");
        return;
      }

      console.log(`📬 Found ${upcomingExams.length} exam(s) to remind.`);

      for (const exam of upcomingExams) {
        // Skip if user data is missing (safety guard)
        if (!exam.userId?.email) continue;

        const examDateFormatted = new Date(exam.examDate).toLocaleString("en-IN", {
          dateStyle: "full",
          timeStyle: "short",
        });

        const subjectName = exam.subjectId?.name || "Unknown Subject";
        const userName = exam.userId.name;
        const userEmail = exam.userId.email;

        // Plain text fallback
        const text = `Hi ${userName},\n\nThis is a reminder that your exam "${exam.title}" for ${subjectName} is scheduled on ${examDateFormatted}.\n\nSyllabus: ${exam.syllabus || "N/A"}\n\nGood luck!\n\n— StudyOS Team`;

        // HTML email template
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #6366f1;">📚 StudyOS — Exam Reminder</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your exam is coming up in <strong>less than 24 hours!</strong></p>

            <div style="background: #fff; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="margin:0;"><strong>📝 Exam:</strong> ${exam.title}</p>
              <p style="margin:4px 0;"><strong>📖 Subject:</strong> ${subjectName}</p>
              <p style="margin:4px 0;"><strong>📅 Date:</strong> ${examDateFormatted}</p>
              <p style="margin:4px 0;"><strong>📋 Syllabus:</strong> ${exam.syllabus || "N/A"}</p>
            </div>

            <p>Make sure you're well-prepared. You've got this! 💪</p>
            <p style="color: #888; font-size: 12px;">— The StudyOS Team</p>
          </div>
        `;

        try {
          await sendEmail(
            userEmail,
            `⏰ Exam Reminder: ${exam.title} is tomorrow!`,
            text,
            html
          );

          // Mark reminder as sent so we don't email them again
          exam.reminderSent = true;
          await exam.save();

          console.log(`✅ Reminder sent to ${userEmail} for exam "${exam.title}"`);
        } catch (emailErr) {
          // Log per-email errors but don't stop the loop for other exams
          console.error(`❌ Failed to send reminder to ${userEmail}:`, emailErr.message);
        }
      }
    } catch (err) {
      console.error("❌ Exam reminder cron error:", err.message);
    }
  });

  console.log("📅 Exam reminder cron scheduled (runs daily at 8:00 AM)");
};

export default startExamReminderCron;
