import   db  from "../models/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../middlewares/auth.middleware.js";

/* -----------------------------------------
   EMPLOYEE LOGIN
----------------------------------------- */
export const employeeLogin = async (req, res) => {
  try {
    const { employee_code, password } = req.body;

    const [rows] = await db.query(
      `SELECT id, company_id, password, is_active
       FROM employees
       WHERE employee_code = ?`,
      [employee_code]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: rows[0].id,
      role: "EMPLOYEE",
      company_id: rows[0].company_id
    });

    res.json({
      message: "Login successful",
      token
    });
  } catch (err) {
    console.error("Employee login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   CHANGE PASSWORD
----------------------------------------- */
export const changeEmployeePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    const [rows] = await db.query(
      "SELECT password FROM employees WHERE id = ?",
      [req.user.id]
    );

    const match = await bcrypt.compare(old_password, rows[0].password);
    if (!match) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(new_password, 10);

    await db.query(
      "UPDATE employees SET password = ? WHERE id = ?",
      [hashed, req.user.id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
