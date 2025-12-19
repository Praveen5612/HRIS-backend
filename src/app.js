import express from "express";
import cors from "cors";


import superAdminRoutes from "./routes/superAdmin.routes.js";
import companyRoutes from "./routes/company.routes.js";
import companyAdminRoutes from "./routes/companyAdmin.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import designationRoutes from "./routes/designation.routes.js";

const app = express();

app.set("trust proxy", 1);

/* ============================
   MIDDLEWARES
============================ */
app.use(cors({
  origin: [
    "http://localhost:5173",   // Vite
    "http://localhost:3000",   // CRA (just in case)
    "https://hris-admin.vercel.app" // keep prod
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());


app.use(express.json());

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
