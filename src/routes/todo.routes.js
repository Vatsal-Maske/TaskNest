import express from "express";
import {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
} from "../controllers/todo.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createTodo).get(getTodos);

router.route("/:id").get(getTodoById).patch(updateTodo).delete(deleteTodo);

export default router;
