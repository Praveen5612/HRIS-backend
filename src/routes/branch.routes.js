import express from "express";
import {
  createBranch,
  listBranches,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
} from "../controllers/branch.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* PROTECTED ROUTES */
router.use(verifyToken);

router.post("/", createBranch);
router.get("/", listBranches);
router.put("/:id", updateBranch);
router.patch("/:id/status", toggleBranchStatus);
router.delete("/:id", deleteBranch);

export default router;
