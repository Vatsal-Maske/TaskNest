import express from "express";
import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
} from "../controllers/resource.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createResource).get(getResources);

router.route("/:id").get(getResourceById).patch(updateResource).delete(deleteResource);

export default router;
