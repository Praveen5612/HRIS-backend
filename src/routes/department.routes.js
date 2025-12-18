import express from "express";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 🔐 All department routes require auth */
router.use(verifyToken);

/* CRUD */
router.post("/", createDepartment);       // ADMIN
router.get("/", listDepartments);          // ADMIN + HR
router.put("/:id", updateDepartment);      // ADMIN
router.delete("/:id", deleteDepartment);   // ADMIN (soft)

export default router;
