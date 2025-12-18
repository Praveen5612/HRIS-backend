import { db } from "../models/db.js";
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
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: admin.id,
      role: "SUPER_ADMIN",
    });

    res.json({
      token,                 // 🔥 IMPORTANT
      role: "SUPER_ADMIN",
      email: admin.email,
    });


    res.json({
      role: "SUPER_ADMIN",
      email: admin.email,
    });
  });
};

/* ============================
   SUPER ADMIN LOGOUT
============================ */
export const superAdminLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ message: "Logged out successfully" });
};
