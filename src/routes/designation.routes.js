import express from "express";
import {
  createDesignation,
  listDesignations,
  updateDesignation,
  deleteDesignation,
  toggleDesignationStatus,
} from "../controllers/designation.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* PROTECTED */
router.use(verifyToken);

router.post("/", createDesignation);
router.get("/", listDesignations);
router.put("/:id", updateDesignation);
router.patch("/:id/status", toggleDesignationStatus);
router.delete("/:id", deleteDesignation);

export default router;
