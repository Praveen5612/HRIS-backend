import express from "express";
import {
  createHR,
  hrPreLogin,
  hrVerifyOtp
} from "../controllers/hr.controller.js";

import {
  verifyToken,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ============================
   PUBLIC – HR LOGIN
============================ */

// Step 1: HR enters empId + password
router.post("/pre-login", hrPreLogin);

// Step 2: HR verifies OTP (kept for future, simple for now)
router.post("/verify-otp", hrVerifyOtp);

/* ============================
   PROTECTED – CREATE HR
   (Only Company Admin)
============================ */
router.post(
  "/",
  verifyToken,
  requireRole("COMPANY_ADMIN"),
  createHR
);

export default router;
