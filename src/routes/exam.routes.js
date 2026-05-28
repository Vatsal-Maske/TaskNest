import express from "express";
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
} from "../controllers/exam.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createExam).get(getExams);

router.route("/:id").get(getExamById).patch(updateExam).delete(deleteExam);

export default router;
