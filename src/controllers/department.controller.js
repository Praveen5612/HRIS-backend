import { db } from "../models/db.js";

/* ============================
   CREATE DEPARTMENT (ADMIN)
============================ */
export const createDepartment = (req, res) => {
  const { department_name } = req.body;
  const { companyId, role, id: adminId } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!department_name?.trim()) {
    return res.status(400).json({ message: "Department name required" });
  }

  const sql = `
    INSERT INTO departments
      (company_id, department_name, created_by_admin_id)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [companyId, department_name.trim(), adminId],
    (err) => {
      if (err) {
        console.error("CREATE DEPARTMENT ERROR:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ message: "Department already exists" });
        }

        return res.status(500).json({ message: "DB error" });
      }

      res.status(201).json({ message: "Department created" });
    }
  );
};

/* ============================
   LIST DEPARTMENTS (ADMIN + HR)
============================ */
export const listDepartments = (req, res) => {
  const { companyId } = req.user;

  const sql = `
    SELECT id, department_name
    FROM departments
    WHERE company_id = ?
      AND is_active = 1
    ORDER BY department_name
  `;

  db.query(sql, [companyId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};

/* ============================
   UPDATE DEPARTMENT (ADMIN)
============================ */
export const updateDepartment = (req, res) => {
  const { id } = req.params;
  const { department_name } = req.body;
  const { companyId, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!department_name?.trim()) {
    return res.status(400).json({ message: "Department name required" });
  }

  const sql = `
    UPDATE departments
    SET department_name = ?
    WHERE id = ?
      AND company_id = ?
      AND is_active = 1
  `;

  db.query(
    sql,
    [department_name.trim(), id, companyId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (!result.affectedRows) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.json({ message: "Department updated" });
    }
  );
};

/* ============================
   DELETE DEPARTMENT (ADMIN)
   → HARD DELETE (as you want)
============================ */
export const deleteDepartment = (req, res) => {
  const { id } = req.params;
  const { companyId, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  const sql = `
    DELETE FROM departments
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(sql, [id, companyId], (err, result) => {
    if (err) {
      console.error("DELETE DEPARTMENT ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted" });
  });
};
