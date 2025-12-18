import { db } from "../models/db.js";

/* ============================
   CREATE DESIGNATION
   ADMIN + HR
============================ */
export const createDesignation = (req, res) => {
  const { department_id, designation_name } = req.body;
  const { companyId, role, id: userId } = req.user;

  if (!department_id || !designation_name) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    INSERT INTO designations
    (company_id, department_id, designation_name, created_by_role, created_by_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [companyId, department_id, designation_name, role, userId],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Designation already exists" });
        }
        return res.status(500).json({ message: "DB error" });
      }

      res.status(201).json({ message: "Designation created" });
    }
  );
};

/* ============================
   LIST DESIGNATIONS
   ADMIN + HR
============================ */
export const listDesignations = (req, res) => {
  const { departmentId } = req.query;
  const { companyId } = req.user;

  if (!departmentId) {
    return res.status(400).json({ message: "Department ID required" });
  }

  const sql = `
    SELECT 
      id,
      designation_name,
      0 AS employeeCount
    FROM designations
    WHERE company_id = ?
      AND department_id = ?
      AND is_active = 1
    ORDER BY designation_name
  `;

  db.query(sql, [companyId, departmentId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};

/* ============================
   UPDATE DESIGNATION
   ADMIN ONLY
============================ */
export const updateDesignation = (req, res) => {
  const { id } = req.params;
  const { designation_name } = req.body;
  const { companyId, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!designation_name) {
    return res.status(400).json({ message: "Designation name required" });
  }

  const sql = `
    UPDATE designations
    SET designation_name = ?
    WHERE id = ?
      AND company_id = ?
      AND is_active = 1
  `;

  db.query(sql, [designation_name, id, companyId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.json({ message: "Designation updated" });
  });
};

/* ============================
   DELETE DESIGNATION
   ADMIN ONLY (SOFT)
============================ */
export const deleteDesignation = (req, res) => {
  const { id } = req.params;
  const { companyId, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  const sql = `
    DELETE FROM designations
    WHERE id = ? AND company_id = ?
  `;

  db.query(sql, [id, companyId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.json({ message: "Designation deleted" });
  });
};

