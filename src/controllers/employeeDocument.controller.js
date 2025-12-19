import  db  from "../models/db.js";
import path from "path";

/* -----------------------------------------
   UPLOAD DOCUMENT
----------------------------------------- */
export const uploadEmployeeDocument = (req, res) => {
  const employeeId = req.params.id;

  if (!["HR", "COMPANY_ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "File required" });
  }

  const {
    document_group,
    document_title,
    document_type,
    frequency,
    period_month,
    period_year,
    language
  } = req.body;

  const empSql = `
    SELECT id, company_id
    FROM employees
    WHERE id = ?
  `;

  db.query(empSql, [employeeId], (err, rows) => {
    if (err) {
      console.error("Employee lookup error:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = rows[0];

    const insertSql = `
      INSERT INTO employee_documents
      (employee_id, company_id, document_group, document_title,
       document_type, language, frequency, period_month, period_year,
       file_path, uploaded_by_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [
        employeeId,
        employee.company_id,
        document_group,
        document_title,
        document_type,
        language || "NA",
        frequency || "ONE_TIME",
        period_month || null,
        period_year || null,
        req.file.path,
        req.user.role
      ],
      (err2) => {
        if (err2) {
          console.error("Insert document error:", err2);
          return res.status(500).json({ message: "Upload failed" });
        }

        res.status(201).json({
          message: "Document uploaded successfully"
        });
      }
    );
  });
};


/* -----------------------------------------
   LIST DOCUMENTS (EMPLOYEE / HR / ADMIN)
----------------------------------------- */
export const getEmployeeDocuments = (req, res) => {
  const employeeId = req.params.id;

  const sql = `
    SELECT
      id,
      document_group,
      document_title,
      document_type,
      language,
      frequency,
      period_month,
      period_year,
      approval_status,
      file_path,
      created_at
    FROM employee_documents
    WHERE employee_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [employeeId], (err, rows) => {
    if (err) {
      console.error("Get documents error:", err);
      return res.status(500).json({ message: "DB error" });
    }

    res.json({
      employee_id: employeeId,
      total: rows.length,
      documents: rows
    });
  });
};
