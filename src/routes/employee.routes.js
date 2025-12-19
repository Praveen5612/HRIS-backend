import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  upsertEmployeeBiodata,
  getEmployeeBiodata
} from "../controllers/employee.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* CREATE */
router.post("/", verifyToken, createEmployee);

/* LIST */
router.get("/", verifyToken, getEmployees);

/* VIEW */
router.get("/:id", verifyToken, getEmployeeById);

/* UPDATE */
router.put("/:id", verifyToken, updateEmployee);

/* ACTIVATE / DEACTIVATE */
router.patch("/:id/status", verifyToken, toggleEmployeeStatus);


router.post("/:id/biodata", verifyToken, upsertEmployeeBiodata);
router.get("/:id/biodata", verifyToken, getEmployeeBiodata);


export default router;
