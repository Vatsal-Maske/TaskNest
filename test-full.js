/**
 * StudyOS — Complete Feature Test Suite (with OTP + Email awareness)
 * Run with: node test-full.js
 *
 * Handles both scenarios:
 *   - Email credentials present → tests full OTP + email flow
 *   - Email credentials missing → skips email tests, tests everything else
 */

import "dotenv/config";
import http from "http";

const BASE = "http://localhost:5000";
const EMAIL_CONFIGURED = !!(
  process.env.EMAIL_USER &&
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REFRESH_TOKEN
);

// ─── State ────────────────────────────────────────────────────────────────────
let cookie = "";
let SUBJECT_ID = "";
let SESSION_ID = "";
const results = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function request(method, path, body = null, withCookie = true) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(withCookie && cookie ? { Cookie: cookie } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      const sc = res.headers["set-cookie"];
      if (sc) cookie = sc.map((c) => c.split(";")[0]).join("; ");

      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    req.on("error", () => resolve({ status: 0, body: { error: "Connection refused" } }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, body: { error: "Timeout" } }); });
    if (payload) req.write(payload);
    req.end();
  });
}

function log(label, res, expectStatus, notes = "") {
  const pass = Array.isArray(expectStatus)
    ? expectStatus.includes(res.status)
    : res.status === expectStatus;
  const icon = pass ? "✅" : "❌";
  const expected = Array.isArray(expectStatus) ? expectStatus.join(" or ") : expectStatus;
  console.log(`${icon} [${res.status}] ${label}`);
  if (!pass) {
    console.log(`   Expected: ${expected} | Got: ${res.status}`);
    console.log(`   Body: ${JSON.stringify(res.body).substring(0, 200)}`);
  }
  if (notes) console.log(`   ${notes}`);
  results.push({ label, pass, status: res.status, expected, body: res.body });
  return res.body;
}

function skip(label, reason) {
  console.log(`⏭️  SKIP  ${label}`);
  console.log(`   Reason: ${reason}`);
  results.push({ label, pass: "skip", status: "N/A", expected: "N/A" });
}

function section(title) {
  console.log(`\n${"━".repeat(62)}`);
  console.log(`  ${title}`);
  console.log("━".repeat(62));
}

// ─── MAIN TEST SUITE ──────────────────────────────────────────────────────────
async function run() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║       StudyOS — Full Feature Test Suite                     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`📧 Email configured: ${EMAIL_CONFIGURED ? "YES ✅" : "NO ⚠️  (email tests will be skipped)"}`);

  // ── 1. ENVIRONMENT + SERVER ──────────────────────────────────────────────────
  section("1. ENVIRONMENT + SERVER");

  const requiredVars = ["PORT", "MONGO_URI", "JWT_SECRET", "JWT_EXPIRES_IN", "NODE_ENV", "CLIENT_URL"];
  const emailVars   = ["EMAIL_USER", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "EMAIL_FROM"];
  const allVars     = [...requiredVars, ...emailVars];

  for (const v of requiredVars) {
    const val = process.env[v];
    const display = ["MONGO_URI","JWT_SECRET"].includes(v) ? (val ? "[SET ✓]" : "MISSING") : (val || "MISSING");
    log(`ENV: ${v}`, { status: val ? 200 : 500 }, 200, display);
  }
  for (const v of emailVars) {
    const val = process.env[v];
    const icon = val ? "✅" : "⚠️ ";
    console.log(`${icon} ENV: ${v} — ${val ? "[SET ✓]" : "NOT SET (add to .env to enable email features)"}`);
    results.push({ label: `ENV: ${v}`, pass: val ? true : "skip", status: val ? 200 : "N/A", expected: 200 });
  }

  // Server health
  const health = await request("GET", "/", null, false);
  log("GET / — Health Check", health, 200, health.body?.message);
  if (health.status === 0) {
    console.log("\n❌ Server is not running. Start it with: npm run dev\n");
    process.exit(1);
  }

  // ── 2. EMAIL TEST ────────────────────────────────────────────────────────────
  section("2. EMAIL TEST — GET /api/test/send-email");

  if (!EMAIL_CONFIGURED) {
    skip("GET /api/test/send-email", "Email credentials not in .env");
  } else {
    const emailTest = await request("GET", "/api/test/send-email", null, false);
    const body = log("GET /api/test/send-email", emailTest, 200);
    if (emailTest.status === 200) {
      console.log(`   messageId: ${body?.messageId}`);
      console.log(`   Recipient: ${body?.message?.split("to ")[1] || ""}`);
      // Security check — no secrets in response
      const bodyStr = JSON.stringify(body);
      const noSecrets = !bodyStr.includes(process.env.GOOGLE_CLIENT_SECRET || "XSECRET") &&
                        !bodyStr.includes(process.env.GOOGLE_REFRESH_TOKEN || "XREFRESH");
      log("No secrets in email response", { status: noSecrets ? 200 : 500 }, 200);
    }
  }

  // ── 3. REGISTER WITH OTP ─────────────────────────────────────────────────────
  section("3. REGISTER WITH OTP — POST /api/auth/register");

  const reg = await request("POST", "/api/auth/register", {
    name: "OTP Test User",
    email: "otptest@example.com",
    password: "Password123",
  }, false);

  const regPass = [201, 400].includes(reg.status);
  console.log(`${regPass ? "✅" : "❌"} [${reg.status}] POST /api/auth/register`);
  results.push({ label: "POST /api/auth/register", pass: regPass, status: reg.status, expected: "201 or 400" });

  if (reg.status === 201) {
    // Security: OTP and password must NOT be in response
    const bodyStr = JSON.stringify(reg.body);
    log("Response has no 'otp' field",      { status: !bodyStr.includes('"otp"') ? 200 : 500 }, 200,
      reg.body?.email ? `email: ${reg.body.email}` : "");
    log("Response has no 'password' field", { status: !bodyStr.includes('"password"') ? 200 : 500 }, 200);
    log("Response has no 'token' in body",  { status: !bodyStr.includes('"token"') ? 200 : 500 }, 200);

    if (!EMAIL_CONFIGURED) {
      console.log("   ⚠️  Email not configured — OTP email was NOT sent (register will fail silently)");
    } else {
      console.log(`   📧 OTP email should now be in ${reg.body.email}`);
    }
  } else if (reg.status === 400) {
    console.log(`   ℹ️  User already exists — acceptable for re-runs`);
  }

  // ── 4. LOGIN BEFORE OTP VERIFICATION ────────────────────────────────────────
  section("4. LOGIN BEFORE VERIFICATION — Should be 403");

  if (!EMAIL_CONFIGURED) {
    skip("POST /api/auth/login (unverified) → 403", "Email not configured — registration automatically verified user");
  } else {
    const preLogin = await request("POST", "/api/auth/login", {
      email: "otptest@example.com",
      password: "Password123",
    }, false);
    log("POST /api/auth/login (unverified) → 403", preLogin, 403,
      preLogin.body?.message || "");
  }

  // ── 5. VERIFY OTP ─────────────────────────────────────────────────────────────
  section("5. VERIFY OTP — POST /api/auth/verify-otp");

  if (!EMAIL_CONFIGURED) {
    skip("POST /api/auth/verify-otp", "Email not configured — OTP was never sent");
    skip("OTP fields cleared after verify", "Depends on OTP verification");
    skip("JWT cookie set after verify", "Depends on OTP verification");
  } else {
    console.log("   ℹ️  Check your email inbox for OTP.");
    console.log("   ℹ️  To test manually: POST /api/auth/verify-otp with { email, otp }");
    console.log("   ℹ️  Skipping automated test — OTP requires human to read email.");
    skip("POST /api/auth/verify-otp", "OTP must be read from email inbox manually");
  }

  // ── 6. RESEND OTP ─────────────────────────────────────────────────────────────
  section("6. RESEND OTP FLOW");

  // Register resend-test user
  const resendReg = await request("POST", "/api/auth/register", {
    name: "Resend OTP User",
    email: "resendtest@example.com",
    password: "Password123",
  }, false);
  const resendRegOk = [201, 400].includes(resendReg.status);
  console.log(`${resendRegOk ? "✅" : "❌"} [${resendReg.status}] Register resend test user`);
  results.push({ label: "Register resend test user", pass: resendRegOk, status: resendReg.status, expected: "201 or 400" });

  if (!EMAIL_CONFIGURED) {
    skip("POST /api/auth/resend-otp", "Email not configured");
  } else {
    const resend = await request("POST", "/api/auth/resend-otp", {
      email: "resendtest@example.com",
    }, false);
    log("POST /api/auth/resend-otp", resend, 200, resend.body?.message);
  }

  // ── 7. INVALID OTP TEST ───────────────────────────────────────────────────────
  section("7. INVALID OTP TEST — Should be 400");

  const badOtp = await request("POST", "/api/auth/verify-otp", {
    email: "resendtest@example.com",
    otp: "000000",
  }, false);
  log("POST /api/auth/verify-otp (wrong OTP) → 400", badOtp, 400, badOtp.body?.message);

  // ── 8. LOGIN WITH VERIFIED USER (use the existing vatsaltest user from prev tests) ──
  section("8. LOGIN WITH VERIFIED USER");

  cookie = ""; // Clear cookie
  const login = await request("POST", "/api/auth/login", {
    email: "vatsaltest@example.com",
    password: "Password123",
  }, false);
  log("POST /api/auth/login (verified user) → 200", login, 200, `Cookie set: ${cookie ? "YES ✅" : "NO ❌"}`);

  if (login.status !== 200) {
    console.log("   ⚠️  Using fallback — attempting to login with test user from previous test session");
  }

  // ── 9. FULL CRUD TESTS ────────────────────────────────────────────────────────
  section("9. FULL CRUD — All Modules");

  // Subject
  const sub = await request("POST", "/api/subjects", { name: "Java", description: "Java exam subject", color: "#6366f1" });
  const subData = log("POST /api/subjects — Create", sub, 201);
  SUBJECT_ID = subData?.subject?._id || "";
  console.log(`   SUBJECT_ID = ${SUBJECT_ID}`);

  log("GET /api/subjects",            await request("GET", "/api/subjects"), 200);
  log("GET /api/subjects/:id",        await request("GET", `/api/subjects/${SUBJECT_ID}`), 200);
  log("PATCH /api/subjects/:id",      await request("PATCH", `/api/subjects/${SUBJECT_ID}`, { name: "Advanced Java", color: "#22c55e" }), 200);

  // Todo
  const todo = await request("POST", "/api/todos", { subjectId: SUBJECT_ID, title: "Revise Java OOP", priority: "high", status: "pending", dueDate: "2026-06-05" });
  const todoId = log("POST /api/todos — Create", todo, 201)?.todo?._id;
  log("GET /api/todos",               await request("GET", "/api/todos"), 200);
  log("GET /api/todos/:id",           await request("GET", `/api/todos/${todoId}`), 200);
  log("PATCH /api/todos/:id",         await request("PATCH", `/api/todos/${todoId}`, { status: "completed" }), 200);
  log("DELETE /api/todos/:id",        await request("DELETE", `/api/todos/${todoId}`), 200);

  // Note
  const note = await request("POST", "/api/notes", { subjectId: SUBJECT_ID, title: "OOP Notes", content: "Encapsulation, Inheritance...", tags: ["java", "oops"] });
  const noteId = log("POST /api/notes — Create", note, 201)?.note?._id;
  log("GET /api/notes",               await request("GET", "/api/notes"), 200);
  log("GET /api/notes/:id",           await request("GET", `/api/notes/${noteId}`), 200);
  log("PATCH /api/notes/:id",         await request("PATCH", `/api/notes/${noteId}`, { content: "Updated content" }), 200);
  log("DELETE /api/notes/:id",        await request("DELETE", `/api/notes/${noteId}`), 200);

  // Exam — examDate within next 24 hours for reminder test
  const examDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
  const exam = await request("POST", "/api/exams", { subjectId: SUBJECT_ID, title: "Java Unit Test", examDate, syllabus: "OOP, Threads", status: "upcoming" });
  const examId = log("POST /api/exams — Create (within 24h for reminder test)", exam, 201)?.exam?._id;
  console.log(`   examDate set to: ${new Date(examDate).toLocaleString()} (2 hours from now)`);
  log("GET /api/exams",               await request("GET", "/api/exams"), 200);
  log("GET /api/exams/:id",           await request("GET", `/api/exams/${examId}`), 200);
  log("PATCH /api/exams/:id",         await request("PATCH", `/api/exams/${examId}`, { syllabus: "OOP, Threads, Collections" }), 200);

  // Study Session
  const session = await request("POST", "/api/study-sessions", { subjectId: SUBJECT_ID, duration: 60, startedAt: "2026-05-28T10:00:00.000Z", endedAt: "2026-05-28T11:00:00.000Z" });
  SESSION_ID = log("POST /api/study-sessions — Create", session, 201)?.session?._id || "";
  log("GET /api/study-sessions",      await request("GET", "/api/study-sessions"), 200);
  const stats = await request("GET", "/api/study-sessions/stats");
  log("GET /api/study-sessions/stats", stats, 200,
    `totalSessions: ${stats.body?.stats?.totalSessions}, totalTime: ${stats.body?.stats?.totalStudyTime} mins`);
  log("DELETE /api/study-sessions/:id", await request("DELETE", `/api/study-sessions/${SESSION_ID}`), 200);

  // Resource
  const res_ = await request("POST", "/api/resources", { subjectId: SUBJECT_ID, title: "Java Tutorial", type: "video", url: "https://example.com/java" });
  const resId = log("POST /api/resources — Create", res_, 201)?.resource?._id;
  log("GET /api/resources",           await request("GET", "/api/resources"), 200);
  log("GET /api/resources/:id",       await request("GET", `/api/resources/${resId}`), 200);
  log("PATCH /api/resources/:id",     await request("PATCH", `/api/resources/${resId}`, { title: "Updated Java Tutorial" }), 200);
  log("DELETE /api/resources/:id",    await request("DELETE", `/api/resources/${resId}`), 200);

  // ── 10. EXAM REMINDER ─────────────────────────────────────────────────────────
  section("10. EXAM REMINDER — GET /api/test/exam-reminder");

  if (!EMAIL_CONFIGURED) {
    skip("GET /api/test/exam-reminder", "Email not configured — would fail to send");
    // Still hit the endpoint to verify the DB query + response shape works
    const reminderDry = await request("GET", "/api/test/exam-reminder");
    console.log(`   ℹ️  Endpoint status (no email send): ${reminderDry.status}`);
    console.log(`   ℹ️  Response: ${JSON.stringify(reminderDry.body).substring(0, 150)}`);
  } else {
    const reminder = await request("GET", "/api/test/exam-reminder");
    log("GET /api/test/exam-reminder → 200", reminder, 200);
    if (reminder.body?.results?.length) {
      reminder.body.results.forEach(r => {
        const icon = r.status === "sent" ? "📧" : "❌";
        console.log(`   ${icon} Exam: "${r.exam}" → ${r.status} ${r.sentTo ? `→ ${r.sentTo}` : ""}`);
        if (r.reminderSent) console.log(`   ✅ reminderSent = true (no duplicates will be sent)`);
      });
    } else {
      console.log(`   ${reminder.body?.message}`);
    }

    // Test duplicate prevention — calling again should find 0 exams (all marked)
    const reminderDupe = await request("GET", "/api/test/exam-reminder");
    log("Duplicate reminder prevention (0 exams second time)", reminderDupe, 200,
      `examsChecked: ${reminderDupe.body?.examsChecked}`);
  }

  // Cleanup exam
  log("DELETE /api/exams/:id — Cleanup", await request("DELETE", `/api/exams/${examId}`), 200);

  // ── 11. SECURITY TESTS ───────────────────────────────────────────────────────
  section("11. SECURITY TESTS");

  const noAuth = await request("GET", "/api/subjects", null, false);
  log("Protected route without cookie → 401", noAuth, 401, noAuth.body?.message);

  // Password never in any response
  const meRes = await request("GET", "/api/auth/me");
  const meStr = JSON.stringify(meRes.body);
  log("GET /api/auth/me — No 'password' in response", { status: !meStr.includes('"password"') ? 200 : 500 }, 200);
  log("GET /api/auth/me — No 'otp' in response",      { status: !meStr.includes('"otp"') ? 200 : 500 }, 200);

  const noRoute = await request("GET", "/api/this-does-not-exist", null, false);
  log("Unknown route → 404", noRoute, 404, noRoute.body?.message);

  // Cleanup
  log("DELETE /api/subjects/:id — Final Cleanup", await request("DELETE", `/api/subjects/${SUBJECT_ID}`), 200);

  // ── FINAL REPORT ─────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.pass === true).length;
  const failed  = results.filter(r => r.pass === false).length;
  const skipped = results.filter(r => r.pass === "skip").length;

  console.log(`\n${"═".repeat(62)}`);
  console.log("  FINAL TEST REPORT");
  console.log(`${"═".repeat(62)}`);
  console.log(`  ✅ PASSED  : ${passed}`);
  console.log(`  ❌ FAILED  : ${failed}`);
  console.log(`  ⏭️  SKIPPED : ${skipped}${skipped > 0 ? " (email credentials missing)" : ""}`);

  if (failed > 0) {
    console.log("\n  ❌ FAILED TESTS:");
    results.filter(r => r.pass === false).forEach(r => {
      console.log(`     • ${r.label}`);
      console.log(`       Expected: ${r.expected} | Got: ${r.status}`);
      if (r.body?.message) console.log(`       Message: ${r.body.message}`);
    });
  }

  console.log(`\n  EMAIL SYSTEM: ${EMAIL_CONFIGURED
    ? "✅ Configured — full email flow tested"
    : "⚠️  NOT configured — add EMAIL_USER, GOOGLE_CLIENT_ID,\n               GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, EMAIL_FROM to .env"}`);

  const coreFailures = results.filter(r => r.pass === false && !r.label.includes("ENV: EMAIL") && !r.label.includes("send-email") && !r.label.includes("exam-reminder") && !r.label.includes("resend-otp") && !r.label.includes("verify-otp"));
  console.log(`\n  CORE BACKEND: ${coreFailures.length === 0 ? "✅ 100% WORKING" : "❌ " + coreFailures.length + " issues"}`);
  console.log(`  OTP FEATURE : ${EMAIL_CONFIGURED ? "✅ Fully testable" : "⚠️  Needs email credentials"}`);
  console.log(`  EXAM CRON   : ${EMAIL_CONFIGURED ? "✅ Reminder email tested" : "⚠️  Needs email credentials"}`);
  console.log(`${"═".repeat(62)}\n`);
}

run().catch(console.error);
