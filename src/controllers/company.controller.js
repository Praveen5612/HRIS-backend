import { db } from "../models/db.js";

/* ============================
   CREATE COMPANY (SUPER ADMIN)
============================ */
export const createCompany = (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Company name and email required" });
  }

  const countSql = `SELECT COUNT(*) AS count FROM companies`;

  db.query(countSql, (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const companyCode = `CMP${String(result[0].count + 1).padStart(3, "0")}`;

    const insertSql = `
      INSERT INTO companies (company_code, name, email, created_by)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [companyCode, name, email, req.user.id],
      (err2, result2) => {
        if (err2) return res.status(500).json({ message: "Create failed" });

        res.status(201).json({
          company: {
            id: result2.insertId,
            company_code: companyCode,
            name,
            email
          }
        });
      }
    );
  });
};

/* ============================
   SUPER ADMIN – ALL COMPANIES
============================ */
export const getCompanies = (req, res) => {
  const sql = `
    SELECT id, company_code, name, email, is_active, created_at
    FROM companies
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};

/* ============================
   PUBLIC – ADMIN LOGIN DROPDOWN
============================ */
export const getCompaniesForLogin = (req, res) => {
  const sql = `
    SELECT id, name
    FROM companies
    WHERE is_active = 1
    ORDER BY name
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};
