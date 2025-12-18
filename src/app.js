import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import superAdminRoutes from "./routes/superAdmin.routes.js";
import companyRoutes from "./routes/company.routes.js";
import companyAdminRoutes from "./routes/companyAdmin.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import designationRoutes from "./routes/designation.routes.js";

const app = express();

/* ============================
   MIDDLEWARES
============================ */
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

/* ============================
   ROUTES
============================ */
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/company-admins", companyAdminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);

export default app;
