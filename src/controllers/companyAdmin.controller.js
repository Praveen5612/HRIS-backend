import db from "../models/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generateToken } from "../middlewares/auth.middleware.js";

/* =====================================================
   CREATE COMPANY ADMIN (SUPER ADMIN ONLY)
===================================================== */
export const createCompanyAdmin = (req, res) => {
  const { company_id, email, password } = req.body;

  if (!company_id || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const checkSql = `
    SELECT id
    FROM company_admins
    WHERE company_id = ?
    LIMIT 1
  `;

  db.query(checkSql, [company_id], async (err, rows) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      if (rows.length) {
        return res.status(409).json({ message: "Admin already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO company_admins (company_id, email, password, is_active)
        VALUES (?, ?, ?, 1)
      `;

      db.query(
        insertSql,
        [company_id, email, hashedPassword],
        (err2, result) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: "Create failed" });
          }

          return res.status(201).json({
            admin: {
              id: result.insertId,
              company_id,
              email,
            },
          });
        }
      );
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Server error" });
    }
  });
};


/* =====================================================
   COMPANY ADMIN PRE-LOGIN (EMAIL + PASSWORD)
===================================================== */
export const companyAdminPreLogin = (req, res) => {
  console.log("PRE-LOGIN BODY:", req.body);


  const { company_id, email, password } = req.body;

  if (!company_id || !email || !password) {
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

  db.query(sql, [email, company_id], async (err, rows) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!rows.length) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, rows[0].password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const tempLoginId = crypto.randomUUID();

      global.adminOtpSessions = global.adminOtpSessions || {};
      global.adminOtpSessions[tempLoginId] = {
        adminId: rows[0].id,
        company_id,
        createdAt: Date.now(),
      };

      return res.json({ tempLoginId });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Server error" });
    }
  });
};

/* =====================================================
   COMPANY ADMIN OTP VERIFY
   (TEMP OTP = 999999)
===================================================== */
export const companyAdminVerifyOtp = (req, res) => {
  const { tempLoginId, otp } = req.body;

  // ⚠️ TEMP OTP — replace with real OTP service later
  if (otp !== "999999") {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const session = global.adminOtpSessions?.[tempLoginId];
  if (!session) {
    return res.status(401).json({ message: "Session expired" });
  }

  // Optional expiry check (5 mins)
  if (Date.now() - session.createdAt > 5 * 60 * 1000) {
    delete global.adminOtpSessions[tempLoginId];
    return res.status(401).json({ message: "OTP expired" });
  }

  delete global.adminOtpSessions[tempLoginId];

  const token = generateToken({
    id: session.adminId,
    role: "COMPANY_ADMIN",
    company_id: session.company_id, // 🔥 CRITICAL
  });

  return res.json({
    token,
    role: "COMPANY_ADMIN",
    company_id: session.company_id,
  });
};
