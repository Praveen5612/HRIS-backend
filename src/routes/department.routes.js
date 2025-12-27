import express from "express";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
  listDepartmentsPublic,
} from "../controllers/department.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* PUBLIC */
router.get("/public", listDepartmentsPublic);

/* PROTECTED */
router.use(verifyToken);

router.post("/", createDepartment);
router.get("/", listDepartments);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;
