import { db } from "../models/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/auth.middleware.js";

/* ============================
   CREATE HR (COMPANY ADMIN)
============================ */
export const createHR = async (req, res) => {
  const { empId, password, department, designation } = req.body;
  const companyId = req.user.companyId;

  if (!empId || !password || !department || !designation) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  if (designation !== "HR") {
    return res.status(400).json({ message: "Invalid designation" });
  }

  try {
    const checkSql = `
      SELECT id FROM hr_users
      WHERE emp_id = ?
      LIMIT 1
    `;

    db.query(checkSql, [empId], async (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (rows.length) {
        return res.status(409).json({ message: "HR already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO hr_users
        (company_id, emp_id, password, department, designation)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [companyId, empId, hashedPassword, department, designation],
        (err2, result) => {
          if (err2) {
            return res.status(500).json({ message: "Create HR failed" });
          }

          res.status(201).json({
            hr: {
              id: result.insertId,
              empId,
              department,
              designation,
            },
          });
        }
      );
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   HR PRE-LOGIN (PUBLIC)
============================ */
export const hrPreLogin = (req, res) => {
  const { empId, password } = req.body;

  if (!empId || !password) {
    return res.status(400).json({ message: "Emp ID and password required" });
  }

  const sql = `
    SELECT id, emp_id, password, company_id, department
    FROM hr_users
    WHERE emp_id = ?
    LIMIT 1
  `;

  db.query(sql, [empId], async (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const hr = rows[0];
    const match = await bcrypt.compare(password, hr.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔐 TEMP LOGIN (OTP SIMPLIFIED)
    res.json({
      tempLoginId: hr.id, // reuse id for now
      empId: hr.emp_id,
      department: hr.department,
      companyId: hr.company_id,
    });
  });
};

/* ============================
   HR VERIFY OTP (PUBLIC)
============================ */
export const hrVerifyOtp = (req, res) => {
  const { tempLoginId, otp } = req.body;

  // ⚠️ TEMP OTP (same as others)
  if (otp !== "123456") {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const sql = `
    SELECT id, emp_id, company_id, department
    FROM hr_users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [tempLoginId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length)
      return res.status(401).json({ message: "Session expired" });

    const hr = rows[0];

    const token = generateToken({
      id: hr.id,
      role: "HR",
      companyId: hr.company_id,
    });

    res.json({
      token,
      empId: hr.emp_id,
      department: hr.department,
      companyId: hr.company_id,
    });
  });
};
