import express from "express";
import cors from "cors";

import superAdminRoutes from "./routes/superAdmin.routes.js";
import companyRoutes from "./routes/company.routes.js";
import companyAdminRoutes from "./routes/companyAdmin.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import designationRoutes from "./routes/designation.routes.js";

/* ✅ ADD THESE IMPORTS */
import employeeRoutes from "./routes/employee.routes.js";
import employeeDocumentRoutes from "./routes/employeeDocument.routes.js";
import employeeAuthRoutes from "./routes/employeeAuth.routes.js";

const app = express();

app.set("trust proxy", 1);

/* ============================
   MIDDLEWARES
============================ */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://hris-admin.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());
app.use(express.json());

/* ✅ SERVE UPLOADED FILES */
app.use("/uploads", express.static("uploads"));

/* ============================
   ROUTES
============================ */
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/company-admins", companyAdminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);

/* ✅ EMPLOYEE MODULE */
app.use("/api/employees", employeeRoutes);
app.use("/api/employee-documents", employeeDocumentRoutes);
app.use("/api/employee-auth", employeeAuthRoutes);

export default app;
