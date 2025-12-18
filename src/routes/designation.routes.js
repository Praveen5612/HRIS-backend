import express from "express";
import {
  createDesignation,
  listDesignations,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designation.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 🔐 All designation routes require auth */
router.use(verifyToken);

/* CRUD */
router.post("/", createDesignation);        // ADMIN + HR
router.get("/", listDesignations);          // ADMIN + HR
router.put("/:id", updateDesignation);      // ADMIN
router.delete("/:id", deleteDesignation);   // ADMIN (soft)

export default router;
