import db from "../models/db.js";
import bcrypt from "bcryptjs";

/* ---------------------------------------------------
   CREATE EMPLOYEE
--------------------------------------------------- */
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

    const company_id = req.user.companyId;
    const created_by_role = req.user.role;
    const created_by_id = req.user.id;

    if (!["HR", "COMPANY_ADMIN"].includes(created_by_role)) {
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
      return res.status(400).json({
        message: "All required fields are mandatory",
      });
    }

    if (Number(salary) <= 0) {
      return res.status(400).json({
        message: "Salary must be greater than zero",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertSql = `
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
        password,
        created_by_role,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
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
      created_by_role,
      created_by_id,
    ];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error("Create employee error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "Employee code, email, or phone already exists",
          });
        }

        return res.status(500).json({
          message: "Create employee failed",
        });
      }

      res.status(201).json({
        message: "Employee created successfully",
        employee: {
          id: result.insertId,
          employee_code,
          full_name,
        },
      });
    });
  } catch (err) {
    console.error("Create employee fatal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ---------------------------------------------------
   LIST EMPLOYEES (COMPANY SCOPED)
--------------------------------------------------- */
export const getEmployees = (req, res) => {
  const company_id = req.user.companyId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = req.query.search || "";
  const department_id = req.query.department_id;
  const status = req.query.status;

  let where = `WHERE e.company_id = ?`;
  const params = [company_id];

  if (search) {
    where += ` AND (e.employee_code LIKE ? OR e.full_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (department_id) {
    where += ` AND e.department_id = ?`;
    params.push(department_id);
  }

  if (status === "active") where += ` AND e.is_active = 1`;
  if (status === "inactive") where += ` AND e.is_active = 0`;

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
      e.phone,
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
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB error" });
    }

    const total = countRows[0].total;

    db.query(dataSql, [...params, limit, offset], (err2, rows) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: "DB error" });
      }

      res.json({
        page,
        limit,
        total,
        employees: rows,
      });
    });
  });
};

/* ---------------------------------------------------
   VIEW SINGLE EMPLOYEE
--------------------------------------------------- */
export const getEmployeeById = (req, res) => {
  const { id } = req.params;
  const company_id = req.user.companyId;

  const sql = `
    SELECT 
      e.id,
      e.employee_code,
      e.full_name,
      e.email,
      e.country_code,
      e.phone,
      e.joining_date,
      e.salary,
      e.employment_type,
      e.is_active,
      d.department_name,
      g.designation_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN designations g ON e.designation_id = g.id
    WHERE e.id = ? AND e.company_id = ?
  `;

  db.query(sql, [id, company_id], (err, rows) => {
    if (err) {
      console.error("Get employee error:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(rows[0]);
  });
};



/* ---------------------------------------------------
   UPDATE EMPLOYEE
--------------------------------------------------- */
export const updateEmployee = (req, res) => {
  try {
    const { id } = req.params;
    const {
      department_id,
      designation_id,
      full_name,
      email,
      phone,
      salary,
    } = req.body;

    if (!["HR", "COMPANY_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!department_id || !designation_id || !full_name || !salary) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const sql = `
      UPDATE employees
      SET department_id = ?,
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
        req.user.companyId,
      ],
      (err, result) => {
        if (err) {
          console.error("Update employee error:", err);
          return res.status(500).json({
            message: "Update employee failed",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Employee not found",
          });
        }

        res.json({ message: "Employee updated successfully" });
      }
    );
  } catch (err) {
    console.error("Update employee fatal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ---------------------------------------------------
   ACTIVATE / DEACTIVATE EMPLOYEE
--------------------------------------------------- */
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!["HR", "COMPANY_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await db.query(
      `UPDATE employees
       SET is_active = IF(is_active = 1, 0, 1)
       WHERE id = ?`,
      [id]
    );

    res.json({ message: "Employee status updated" });
  } catch (err) {
    console.error("Toggle employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------------------------------
   BIODATA
--------------------------------------------------- */
export const upsertEmployeeBiodata = (req, res) => {
  const employee_id = req.params.id;

  if (!employee_id) {
    return res.status(400).json({ message: "Employee ID required" });
  }

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

  const checkSql = `
    SELECT employee_id
    FROM employee_biodata
    WHERE employee_id = ?
    LIMIT 1
  `;

  db.query(checkSql, [employee_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const sql = rows.length
      ? `
        UPDATE employee_biodata SET
          gender=?, dob=?, blood_group=?, marital_status=?,
          qualification=?, address=?, pan=?, aadhaar=?
        WHERE employee_id=?
      `
      : `
        INSERT INTO employee_biodata
        (employee_id, gender, dob, blood_group, marital_status,
         qualification, address, pan, aadhaar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    const values = rows.length
      ? [
          gender,
          dob,
          blood_group,
          marital_status,
          qualification,
          address,
          pan,
          aadhaar,
          employee_id,
        ]
      : [
          employee_id,
          gender,
          dob,
          blood_group,
          marital_status,
          qualification,
          address,
          pan,
          aadhaar,
        ];

    db.query(sql, values, (err2) => {
      if (err2) return res.status(500).json({ message: "Save failed" });
      res.json({ message: "Biodata saved successfully" });
    });
  });
};

export const getEmployeeBiodata = (req, res) => {
  try {
    const employeeId = req.params.id;

    const sql = `
      SELECT 
        e.employee_code,
        e.full_name,
        b.gender,
        b.dob,
        b.blood_group,
        b.marital_status,
        b.qualification,
        b.address,
        b.pan,
        b.aadhaar
      FROM employees e
      LEFT JOIN employee_biodata b ON e.id = b.employee_id
      WHERE e.id = ?
    `;

    db.query(sql, [employeeId], (err, rows) => {
      if (err) {
        console.error("Get biodata error:", err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(rows[0]);
    });
  } catch (err) {
    console.error("Get biodata fatal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};




export const getLastEmployeeCode = (req, res) => {
  const company_id = req.user.companyId;

  const sql = `
    SELECT employee_code
    FROM employees
    WHERE company_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;

  db.query(sql, [company_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "DB error" });
    }

    // 🔴 IMPORTANT: prevent 304 caching
    res.set("Cache-Control", "no-store");

    res.json({
      last_employee_code: rows.length
        ? rows[0].employee_code
        : null,
    });
  });
};


