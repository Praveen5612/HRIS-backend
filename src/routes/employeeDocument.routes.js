import express from "express";
import multer from "multer";
import path from "path";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  uploadEmployeeDocument,
  getEmployeeDocuments
} from "../controllers/employeeDocument.controller.js";

const router = express.Router();

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/employees");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post(
  "/:id",
  verifyToken,
  upload.single("file"),
  uploadEmployeeDocument
);

router.get(
  "/:id",
  verifyToken,
  getEmployeeDocuments
);

export default router;
