import express from "express";
import {
  employeeLogin,
  changeEmployeePassword
} from "../controllers/employeeAuth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", employeeLogin);
router.post("/change-password", verifyToken, changeEmployeePassword);

export default router;
