import db from "../models/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/auth.middleware.js";

/* ============================
   SUPER ADMIN LOGIN
============================ */
export const superAdminLogin = (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (otp !== "010101") {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const sql = `
    SELECT id, email, password
    FROM super_admin
    WHERE email = ?
      AND is_active = 1
    LIMIT 1
  `;

  db.query(sql, [email], async (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: admin.id, role: "SUPER_ADMIN" });

    return res.json({ token, role: "SUPER_ADMIN", email: admin.email });
  });
};

/* ============================
   SUPER ADMIN LOGOUT
============================ */
export const superAdminLogout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

/* ============================
   COMPANY SUMMARY (SUPER ADMIN)
============================ */
export const getCompanySummary = (req, res) => {
  const companyId = req.params.id;

  const companySql = `
    SELECT id, name, email, is_active
    FROM companies
    WHERE id = ?
    LIMIT 1
  `;

  db.query(companySql, [companyId], (err, companyRows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!companyRows.length) return res.status(404).json({ message: "Company not found" });

    const company = companyRows[0];

    const adminSql = `SELECT COUNT(*) AS count FROM company_admins WHERE company_id = ?`;
    const deptSql = `SELECT COUNT(*) AS count FROM departments WHERE company_id = ?`;
    const empSql = `SELECT COUNT(*) AS count FROM employees WHERE company_id = ?`;

    db.query(adminSql, [companyId], (err, a) => {
      if (err) return res.status(500).json({ message: "DB error" });

      db.query(deptSql, [companyId], (err, d) => {
        if (err) return res.status(500).json({ message: "DB error" });

        db.query(empSql, [companyId], (err, e) => {
          if (err) return res.status(500).json({ message: "DB error" });

          res.json({
            company,
            adminCount: a[0].count,
            departmentCount: d[0].count,
            employeeCount: e[0].count,
          });
        });
      });
    });
  });
};
export const updateCompanyStatus = (req, res) => {
  const companyId = req.params.id;
  const { is_active } = req.body;

  if (![0, 1].includes(is_active)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const sql = `
    UPDATE companies
    SET is_active = ?
    WHERE id = ?
  `;

  db.query(sql, [is_active, companyId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({
      message: is_active
        ? "Company activated"
        : "Company deactivated",
    });
  });
};
// controllers/company.controller.js
export const updateCompanyName = (req, res) => {
  const companyId = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Company name required" });
  }

  const sql = `
    UPDATE companies
    SET name = ?
    WHERE id = ?
  `;

  db.query(sql, [name, companyId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company name updated successfully" });
  });
};




/* ============================
   GET ADMINS BY COMPANY (SUPER ADMIN)
============================ */
export const getCompanyAdmins = (req, res) => {
  const companyId = req.params.id;

  const sql = `
    SELECT id, email, is_active, created_at
    FROM company_admins
    WHERE company_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [companyId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB error" });
    }

    res.json(rows);
  });
};


export const updateCompanyAdminEmail = (req, res) => {
  const adminId = req.params.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const sql = `
    UPDATE company_admins
    SET email = ?
    WHERE id = ?
  `;

  db.query(sql, [email, adminId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin email updated" });
  });
};

/* ============================
   ACTIVATE / DEACTIVATE COMPANY ADMIN
============================ */
export const updateCompanyAdminStatus = (req, res) => {
  const adminId = req.params.id;
  const { is_active } = req.body;

  if (![0, 1].includes(is_active)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const sql = `
    UPDATE company_admins
    SET is_active = ?
    WHERE id = ?
  `;

  db.query(sql, [is_active, adminId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: is_active
        ? "Admin activated"
        : "Admin deactivated",
    });
  });
};
export const getCompaniesWithoutAdmin = (req, res) => {
  const sql = `
    SELECT c.id, c.name
    FROM companies c
    LEFT JOIN company_admins ca ON ca.company_id = c.id
    WHERE ca.id IS NULL
      AND c.is_active = 1
    ORDER BY c.name
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};

