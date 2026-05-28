import express from "express";
import {
  createStudySession,
  getStudySessions,
  getStudyStats,
  deleteStudySession,
} from "../controllers/studySession.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createStudySession).get(getStudySessions);

// Stats route must come BEFORE /:id to avoid being caught as an ID param
router.get("/stats", getStudyStats);

router.delete("/:id", deleteStudySession);

export default router;
