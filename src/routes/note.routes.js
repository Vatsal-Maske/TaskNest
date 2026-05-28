import express from "express";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/note.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createNote).get(getNotes);

router.route("/:id").get(getNoteById).patch(updateNote).delete(deleteNote);

export default router;
