import { db } from "../models/db.js";
import bcrypt from "bcryptjs";

/* ============================
   CREATE HR (COMPANY ADMIN)
============================ */
export const createHR = async (req, res) => {
  const { empId, password, department, designation } = req.body;
  const companyId = req.user.companyId; // from JWT

  if (!empId || !password || !department || !designation) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  // Restrict designation
  if (designation !== "HR") {
    return res.status(400).json({ message: "Invalid designation" });
  }

  try {
    /* ============================
       CHECK EXISTING HR
    ============================ */
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

      /* ============================
         HASH PASSWORD (bcrypt)
      ============================ */
      const hashedPassword = await bcrypt.hash(password, 10);

      /* ============================
         INSERT HR
      ============================ */
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
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
