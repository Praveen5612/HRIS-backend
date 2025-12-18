import express from "express";
import {
  superAdminLogin,
  superAdminLogout
} from "../controllers/superAdmin.controller.js";

const router = express.Router();

router.post("/login", superAdminLogin);
router.post("/logout", superAdminLogout);

export default router;

