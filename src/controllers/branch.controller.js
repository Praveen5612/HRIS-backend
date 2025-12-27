import db from "../models/db.js";

/* ============================
   CREATE BRANCH (COMPANY ADMIN)
============================ */
export const createBranch = (req, res) => {
  const {
    branch_code,
    branch_name,
    location,
    address,
    phone,
    email,
  } = req.body;

  const { company_id, id: adminId, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!branch_name?.trim()) {
    return res.status(400).json({ message: "Branch name is required" });
  }

  const sql = `
    INSERT INTO branches (
      company_id,
      branch_code,
      branch_name,
      location,
      address,
      phone,
      email,
      created_by_admin_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      company_id,
      branch_code || null,
      branch_name.trim(),
      location || null,
      address || null,
      phone || null,
      email || null,
      adminId,
    ],
    (err) => {
      if (err) {
        console.error("CREATE BRANCH ERROR:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Branch already exists" });
        }

        return res.status(500).json({ message: "DB error" });
      }

      res.status(201).json({ message: "Branch created successfully" });
    }
  );
};

/* ============================
   LIST BRANCHES (ADMIN / HR)
============================ */
export const listBranches = (req, res) => {
  const { company_id } = req.user;

  const sql = `
    SELECT
      id,
      branch_code,
      branch_name,
      location,
      address,
      phone,
      email,
      is_active
    FROM branches
    WHERE company_id = ?
    ORDER BY branch_name
  `;

  db.query(sql, [company_id], (err, rows) => {
    if (err) {
      console.error("LIST BRANCH ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    res.json(rows);
  });
};

/* ============================
   UPDATE BRANCH (COMPANY ADMIN)
============================ */
export const updateBranch = (req, res) => {
  const { id } = req.params;
  const {
    branch_code,
    branch_name,
    location,
    address,
    phone,
    email,
  } = req.body;

  const { company_id, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!branch_name?.trim()) {
    return res.status(400).json({ message: "Branch name is required" });
  }

  const sql = `
    UPDATE branches
    SET
      branch_code = ?,
      branch_name = ?,
      location = ?,
      address = ?,
      phone = ?,
      email = ?
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(
    sql,
    [
      branch_code || null,
      branch_name.trim(),
      location || null,
      address || null,
      phone || null,
      email || null,
      id,
      company_id,
    ],
    (err, result) => {
      if (err) {
        console.error("UPDATE BRANCH ERROR:", err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!result.affectedRows) {
        return res.status(404).json({ message: "Branch not found" });
      }

      res.json({ message: "Branch updated successfully" });
    }
  );
};

/* ============================
   TOGGLE BRANCH STATUS
============================ */
export const toggleBranchStatus = (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  const sql = `
    UPDATE branches
    SET is_active = IF(is_active = 1, 0, 1)
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(sql, [id, company_id], (err, result) => {
    if (err) {
      console.error("TOGGLE BRANCH STATUS ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch status updated" });
  });
};

/* ============================
   DELETE BRANCH (HARD DELETE)
============================ */
export const deleteBranch = (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;

  if (role !== "COMPANY_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  const sql = `
    DELETE FROM branches
    WHERE id = ?
      AND company_id = ?
  `;

  db.query(sql, [id, company_id], (err, result) => {
    if (err) {
      console.error("DELETE BRANCH ERROR:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  });
};
