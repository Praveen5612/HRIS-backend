import express from "express";
import {
  createCompanyAdmin,
  companyAdminPreLogin,
  companyAdminVerifyOtp
} from "../controllers/companyAdmin.controller.js";

import {
  verifyToken,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/* SUPER ADMIN */
router.post(
  "/",
  verifyToken,
  requireRole("SUPER_ADMIN"),
  createCompanyAdmin
);

/* ADMIN LOGIN */
router.post("/pre-login", companyAdminPreLogin);
router.post("/verify-otp", companyAdminVerifyOtp);

export default router;
