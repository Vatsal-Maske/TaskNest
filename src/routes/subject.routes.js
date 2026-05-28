import express from "express";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All subject routes are protected
router.use(protect);

router.route("/").post(createSubject).get(getSubjects);

router.route("/:id").get(getSubjectById).patch(updateSubject).delete(deleteSubject);

export default router;
