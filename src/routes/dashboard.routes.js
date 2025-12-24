import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = express.Router();

/*
  ADMIN  → allowed
  HR     → allowed
  EMP    → blocked
*/
router.get(
  "/dashboard",
  verifyToken,
  allowRoles("COMPANY_ADMIN", "HR"),
  getDashboard
);


export default router;
