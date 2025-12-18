import crypto from "crypto";
import { db } from "../models/db.js";
import { generateToken } from "../middlewares/auth.middleware.js";

/* ============================
   CREATE COMPANY ADMIN
============================ */
export const createCompanyAdmin = (req, res) => {
  const { companyId, email, password } = req.body;

  if (!companyId || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const checkSql = `
    SELECT id FROM company_admins
    WHERE company_id = ?
    LIMIT 1
  `;

  db.query(checkSql, [companyId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (rows.length) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const insertSql = `
      INSERT INTO company_admins (company_id, email, password)
      VALUES (?, ?, ?)
    `;

    db.query(insertSql, [companyId, email, password], (err2, result) => {
      if (err2) return res.status(500).json({ message: "Create failed" });

      res.status(201).json({
        admin: {
          id: result.insertId,
          company_id: companyId,
          email
        }
      });
    });
  });
};

/* ============================
   ADMIN PRE-LOGIN
============================ */
export const companyAdminPreLogin = (req, res) => {
  const { companyId, email, password } = req.body;

  if (!companyId || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    SELECT id
    FROM company_admins
    WHERE email = ?
      AND password = ?
      AND company_id = ?
      AND is_active = 1
    LIMIT 1
  `;

  db.query(sql, [email, password, companyId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tempLoginId = crypto.randomUUID();

    global.adminOtpSessions = global.adminOtpSessions || {};
    global.adminOtpSessions[tempLoginId] = {
      adminId: rows[0].id,
      companyId,
      createdAt: Date.now()
    };

    res.json({ tempLoginId });
  });
};

/* ============================
   ADMIN OTP VERIFY
============================ */
export const companyAdminVerifyOtp = (req, res) => {
  const { tempLoginId, otp } = req.body;

  if (otp !== "999999") {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const session = global.adminOtpSessions?.[tempLoginId];
  if (!session) {
    return res.status(401).json({ message: "Session expired" });
  }

  delete global.adminOtpSessions[tempLoginId];

  const token = generateToken({
    id: session.adminId,
    role: "COMPANY_ADMIN",
    companyId: session.companyId
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 2 * 60 * 60 * 1000
  });

  res.json({ role: "COMPANY_ADMIN" });
};
