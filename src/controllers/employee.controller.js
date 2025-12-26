import db from "../models/db.js";
import bcrypt from "bcryptjs";

/* =====================================================
   CREATE EMPLOYEE
===================================================== */
export const createEmployee = async (req, res) => {
  try {
    const {
      employee_code,
      full_name,
      email,
      country_code,
      phone,
      department_id,
      designation_id,
      joining_date,
      salary,
      employment_type,
      password,
    } = req.body;

    const { company_id, role, id: created_by_id } = req.user;

    if (!["HR", "COMPANY_ADMIN"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (
      !employee_code ||
      !full_name ||
      !department_id ||
      !designation_id ||
      !joining_date ||
      !salary ||
      !password
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO employees (
        company_id,
        employee_code,
        full_name,
        email,
        country_code,
        phone,
        department_id,
        designation_id,
        joining_date,
        salary,
        employment_type,
        password_hash,
        created_by_role,
        created_by_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        company_id,
        employee_code,
        full_name,
        email || null,
        country_code || "+91",
        phone || null,
        department_id,
        designation_id,
        joining_date,
        Number(salary),
        employment_type || "PERMANENT",
        password_hash,
        role,
        created_by_id,
      ],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "Employee code / email / phone already exists",
            });
          }
          console.error(err);
          return res.status(500).json({ message: "Create employee failed" });
        }

        res.status(201).json({
          message: "Employee created successfully",
          employee_id: result.insertId,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   LIST EMPLOYEES (COMPANY SCOPED)
===================================================== */
export const getEmployees = (req, res) => {
  const { company_id } = req.user;
  console.log("JWT USER IN EMP LIST:", req.user);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = req.query.search || "";
  const department_id = req.query.department_id;
  const status = req.query.status;

  let where = "WHERE e.company_id = ?";
  const params = [company_id];

  if (search) {
    where += " AND (e.employee_code LIKE ? OR e.full_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (department_id) {
    where += " AND e.department_id = ?";
    params.push(department_id);
  }

  if (status === "active") where += " AND e.is_active = 1";
  if (status === "inactive") where += " AND e.is_active = 0";

  const countSql = `
    SELECT COUNT(*) AS total
    FROM employees e
    ${where}
  `;

  const dataSql = `
    SELECT
      e.id,
      e.employee_code,
      e.full_name,
      e.email,
      CONCAT(e.country_code, ' ', e.phone) AS phone,
      e.joining_date,
      e.salary,
      e.is_active,
      d.department_name AS department,
      g.designation_name AS designation
    FROM employees e
    JOIN departments d ON d.id = e.department_id
    JOIN designations g ON g.id = e.designation_id
    ${where}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?

  `;

  db.query(countSql, params, (err, countRows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    db.query(
      dataSql,
      [...params, limit, offset],
      (err2, rows) => {
        if (err2) return res.status(500).json({ message: "DB error" });

        res.json({
          page,
          limit,
          total: countRows[0].total,
          employees: rows,
        });
      }
    );
  });
};

/* =====================================================
   VIEW SINGLE EMPLOYEE
===================================================== */
export const getEmployeeById = (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  const sql = `
    SELECT
      e.*,
      d.department_name,
      g.designation_name
    FROM employees e
    JOIN departments d ON d.id = e.department_id
    JOIN designations g ON g.id = e.designation_id
    WHERE e.id = ? AND e.company_id = ?
  `;

  db.query(sql, [id, company_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(rows[0]);
  });
};

/* =====================================================
   UPDATE EMPLOYEE
===================================================== */
export const updateEmployee = (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;

  if (!["HR", "COMPANY_ADMIN"].includes(role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const {
    department_id,
    designation_id,
    full_name,
    email,
    phone,
    salary,
  } = req.body;

  const sql = `
    UPDATE employees
    SET
      department_id = ?,
      designation_id = ?,
      full_name = ?,
      email = ?,
      phone = ?,
      salary = ?
    WHERE id = ? AND company_id = ?
  `;

  db.query(
    sql,
    [
      department_id,
      designation_id,
      full_name,
      email || null,
      phone || null,
      Number(salary),
      id,
      company_id,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json({ message: "Employee updated successfully" });
    }
  );
};

/* =====================================================
   ACTIVATE / DEACTIVATE
===================================================== */
export const toggleEmployeeStatus = (req, res) => {
  const { id } = req.params;
  const { company_id, role } = req.user;

  if (!["HR", "COMPANY_ADMIN"].includes(role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const sql = `
    UPDATE employees
    SET is_active = IF(is_active = 1, 0, 1)
    WHERE id = ? AND company_id = ?
  `;

  db.query(sql, [id, company_id], (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });
    res.json({ message: "Employee status updated" });
  });
};

/* =====================================================
   BIODATA (UPSERT)
===================================================== */
export const upsertEmployeeBiodata = (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  db.query(
    "SELECT id FROM employees WHERE id = ? AND company_id = ?",
    [id, company_id],
    (err, rows) => {
      if (!rows.length) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sql = `
        INSERT INTO employee_biodata
        (employee_id, gender, dob, blood_group, marital_status,
         qualification, address, pan, aadhaar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          gender=VALUES(gender),
          dob=VALUES(dob),
          blood_group=VALUES(blood_group),
          marital_status=VALUES(marital_status),
          qualification=VALUES(qualification),
          address=VALUES(address),
          pan=VALUES(pan),
          aadhaar=VALUES(aadhaar)
      `;

      const {
        gender,
        dob,
        blood_group,
        marital_status,
        qualification,
        address,
        pan,
        aadhaar,
      } = req.body;

      db.query(
        sql,
        [id, gender, dob, blood_group, marital_status,
         qualification, address, pan, aadhaar],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Save failed" });
          res.json({ message: "Biodata saved successfully" });
        }
      );
    }
  );
};

/* =====================================================
   GET BIODATA
===================================================== */
export const getEmployeeBiodata = (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  const sql = `
    SELECT b.*
    FROM employee_biodata b
    JOIN employees e ON e.id = b.employee_id
    WHERE e.id = ? AND e.company_id = ?
  `;

  db.query(sql, [id, company_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length) return res.status(404).json({ message: "No biodata" });
    res.json(rows[0]);
  });
};

/* =====================================================
   LAST EMPLOYEE CODE
===================================================== */
export const getLastEmployeeCode = (req, res) => {
  const { company_id } = req.user;
  

  const sql = `
    SELECT employee_code
    FROM employees
    WHERE company_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(sql, [company_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.set("Cache-Control", "no-store");
    res.json({
      last_employee_code: rows.length ? rows[0].employee_code : null,
    });
  });
};


