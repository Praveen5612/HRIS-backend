import express from "express";
import cors from "cors";

/* ROUTES */
import superAdminRoutes from "./routes/superAdmin.routes.js";
import companyRoutes from "./routes/company.routes.js";
import companyAdminRoutes from "./routes/companyAdmin.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import designationRoutes from "./routes/designation.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import employeeDocumentRoutes from "./routes/employeeDocument.routes.js";
import employeeAuthRoutes from "./routes/employeeAuth.routes.js";

const app = express();

app.set("trust proxy", 1);

/* ============================
   MIDDLEWARES
============================ */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hris-admin.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ ADD PATCH
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.options("*", cors());
app.use(express.json());

/* ============================
   STATIC FILES
============================ */
app.use("/uploads", express.static("uploads"));

/* ============================
   ROUTES
============================ */

/* SUPER ADMIN */
app.use("/api/super-admin", superAdminRoutes);

/* CORE ENTITIES */
app.use("/api/companies", companyRoutes);
app.use("/api/company-admins", companyAdminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);

/* EMPLOYEE MODULE */
app.use("/api/employees", employeeRoutes);
app.use("/api/employee-documents", employeeDocumentRoutes);
app.use("/api/employee-auth", employeeAuthRoutes);

export default app;
