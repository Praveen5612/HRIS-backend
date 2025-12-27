import db from "../models/db.js";

/* ============================
   CREATE DEPARTMENT
============================ */
export const createDepartment = (req, res) => {
  const { department_name } = req.body;
  const { company_id, id: adminId } = req.user;

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
    [company_id, department_name.trim(), adminId],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Department already exists" });
        }
        return res.status(500).json({ message: "DB error" });
      }

      res.status(201).json({ message: "Department created successfully" });
    }
  );
};

/* ============================
   LIST DEPARTMENTS
============================ */
export const listDepartments = (req, res) => {
  const companyId = req.user.company_id;
  const { branch_id } = req.query;

  if (!branch_id) {
    return res.status(400).json({ message: "branch_id is required" });
  }

  const sql = `
    SELECT id, department_name
    FROM departments
    WHERE company_id = ?
      AND branch_id = ?
      AND is_active = 1
    ORDER BY department_name
  `;

  db.query(sql, [companyId, branch_id], (err, rows) => {
    if (err) {
      console.error("LIST DEPARTMENTS ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    res.json(rows);
  });
};



/* ============================
   UPDATE DEPARTMENT
============================ */
export const updateDepartment = (req, res) => {
  const { id } = req.params;
  const { department_name } = req.body;
  const { company_id } = req.user;

  if (!department_name?.trim()) {
    return res.status(400).json({ message: "Department name required" });
  }

  const sql = `
    UPDATE departments
    SET department_name = ?
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(
    sql,
    [department_name.trim(), id, company_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (!result.affectedRows) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.json({ message: "Department updated successfully" });
    }
  );
};

/* ============================
   DELETE DEPARTMENT (HARD)
============================ */
export const deleteDepartment = (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  const sql = `
    DELETE FROM departments
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(sql, [id, company_id], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  });
};

/* ============================
   PUBLIC LIST (LOGIN / HR)
============================ */
export const listDepartmentsPublic = (req, res) => {
  const { company_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ message: "company_id required" });
  }

  const sql = `
    SELECT id, department_name
    FROM departments
    WHERE company_id = ?
      AND is_active = 1
    ORDER BY department_name
  `;

  db.query(sql, [company_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
};
