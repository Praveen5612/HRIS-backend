import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  upsertEmployeeBiodata,
  getEmployeeBiodata,
  getLastEmployeeCode,
} from "../controllers/employee.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* CREATE */
router.post("/", verifyToken, createEmployee);

/* LIST */
router.get("/", verifyToken, getEmployees);

/* LAST EMP CODE (STATIC ROUTE FIRST) */
router.get("/last-code", verifyToken, getLastEmployeeCode);

/* VIEW */
router.get("/:id", verifyToken, getEmployeeById);

/* UPDATE */
router.put("/:id", verifyToken, updateEmployee);

/* ACTIVATE / DEACTIVATE */
router.patch("/:id/status", verifyToken, toggleEmployeeStatus);

/* BIODATA */
router.post("/:id/biodata", verifyToken, upsertEmployeeBiodata);
router.get("/:id/biodata", verifyToken, getEmployeeBiodata);

export default router;
