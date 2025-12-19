import { db } from "../models/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken } from "../middlewares/auth.middleware.js";

/* ============================
   CREATE COMPANY ADMIN
   (SUPER ADMIN)
============================ */
export const createCompanyAdmin = async (req, res) => {
  const { companyId, email, password } = req.body;

  if (!companyId || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // Check if admin already exists
    const checkSql = `
      SELECT id FROM company_admins
      WHERE company_id = ?
      LIMIT 1
    `;

    db.query(checkSql, [companyId], async (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (rows.length) {
        return res.status(409).json({ message: "Admin already exists" });
      }

      // 🔐 HASH PASSWORD (CRITICAL FIX)
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO company_admins (company_id, email, password, is_active)
        VALUES (?, ?, ?, 1)
      `;

      db.query(
        insertSql,
        [companyId, email, hashedPassword],
        (err2, result) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: "Create failed" });
          }

          res.status(201).json({
            admin: {
              id: result.insertId,
              company_id: companyId,
              email,
            },
          });
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   ADMIN PRE-LOGIN
   (PASSWORD CHECK)
============================ */
export const companyAdminPreLogin = (req, res) => {
  const { companyId, email, password } = req.body;

  if (!companyId || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    SELECT id, password
    FROM company_admins
    WHERE email = ?
      AND company_id = ?
      AND is_active = 1
    LIMIT 1
  `;

  db.query(sql, [email, companyId], async (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = rows[0];

    // 🔐 bcrypt compare
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // TEMP OTP SESSION
    const tempLoginId = crypto.randomUUID();
    global.adminOtpSessions = global.adminOtpSessions || {};
    global.adminOtpSessions[tempLoginId] = {
      adminId: admin.id,
      companyId,
      createdAt: Date.now(),
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

  // 🔐 GENERATE JWT (THIS WAS MISSING)
  const token = generateToken({
    id: session.adminId,
    role: "COMPANY_ADMIN",
    companyId: session.companyId,
  });

  // ✅ RETURN TOKEN IN RESPONSE BODY
  res.json({
    token,
    role: "COMPANY_ADMIN",
    companyId: session.companyId,
  });
};
