import express from "express";
import { createHR } from "../controllers/hr.controller.js";
import {
  verifyToken,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/* COMPANY ADMIN → CREATE HR */
router.post(
  "/",
  verifyToken,
  requireRole("COMPANY_ADMIN"),
  createHR
);

export default router;
