import db from "../models/db.js";

/* ============================
   CREATE DESIGNATION
============================ */
export const createDesignation = (req, res) => {
  const { department_id, branch_id, designation_name, designation_code } =
    req.body;

  const { company_id, role, id: created_by_id } = req.user;

  if (!designation_name?.trim() || !department_id || !branch_id) {
    return res.status(400).json({
      message: "department_id, branch_id and designation_name are required",
    });
  }

  const validateSql = `
    SELECT 1
    FROM departments d
    JOIN branches b ON b.id = ?
    WHERE d.id = ?
      AND d.company_id = ?
      AND b.company_id = ?
  `;

  db.query(
    validateSql,
    [branch_id, department_id, company_id, company_id],
    (err, rows) => {
      if (err) {
        console.error("VALIDATE DESIGNATION ERROR:", err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!rows.length) {
        return res.status(400).json({
          message: "Invalid department or branch for this company",
        });
      }

      const insertSql = `
        INSERT INTO designations (
          company_id,
          branch_id,
          department_id,
          designation_name,
          designation_code,
          created_by_role,
          created_by_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          company_id,
          branch_id,
          department_id,
          designation_name.trim(),
          designation_code || null,
          role,
          created_by_id,
        ],
        (err2) => {
          if (err2) {
            console.error("CREATE DESIGNATION ERROR:", err2);

            if (err2.code === "ER_DUP_ENTRY") {
              return res
                .status(409)
                .json({ message: "Designation already exists" });
            }

            return res.status(500).json({ message: "DB error" });
          }

          res.status(201).json({ message: "Designation created successfully" });
        }
      );
    }
  );
};

/* ============================
   LIST DESIGNATIONS
============================ */
export const listDesignations = (req, res) => {
  const { company_id } = req.user;
  const { department_id, branch_id } = req.query;

  if (!department_id || !branch_id) {
    return res.status(400).json({
      message: "department_id and branch_id are required",
    });
  }

  const sql = `
    SELECT
      d.id,
      d.designation_name,
      d.designation_code,
      d.is_active,
      dep.department_name,
      b.branch_name
    FROM designations d
    JOIN departments dep
      ON dep.id = d.department_id
     AND dep.company_id = d.company_id
    JOIN branches b
      ON b.id = d.branch_id
     AND b.company_id = d.company_id
    WHERE d.company_id = ?
      AND d.department_id = ?
      AND d.branch_id = ?
      AND d.is_active = 1
    ORDER BY d.designation_name
  `;

  db.query(sql, [company_id, department_id, branch_id], (err, rows) => {
    if (err) {
      console.error("LIST DESIGNATION ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    res.json(rows);
  });
};

/* ============================
   UPDATE DESIGNATION (SAFE)
============================ */
export const updateDesignation = (req, res) => {
  const { id } = req.params;
  const { designation_name, designation_code } = req.body;
  const { company_id } = req.user;

  if (!designation_name?.trim()) {
    return res.status(400).json({
      message: "Designation name is required",
    });
  }

  const sql = `
    UPDATE designations
    SET
      designation_name = ?,
      designation_code = ?
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(
    sql,
    [designation_name.trim(), designation_code || null, id, company_id],
    (err, result) => {
      if (err) {
        console.error("UPDATE DESIGNATION ERROR:", err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ message: "Designation not found" });
      }

      res.json({ message: "Designation updated successfully" });
    }
  );
};

/* ============================
   TOGGLE STATUS
============================ */
export const toggleDesignationStatus = (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  const sql = `
    UPDATE designations
    SET is_active = IF(is_active = 1, 0, 1)
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(sql, [id, company_id], (err, result) => {
    if (err) {
      console.error("TOGGLE DESIGNATION ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.json({ message: "Designation status updated" });
  });
};

/* ============================
   DELETE DESIGNATION
============================ */
export const deleteDesignation = (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  const sql = `
    DELETE FROM designations
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(sql, [id, company_id], (err, result) => {
    if (err) {
      console.error("DELETE DESIGNATION ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.json({ message: "Designation deleted successfully" });
  });
};
