import db from "../models/db.js";

export const getDashboard = async (req, res) => {
  const { role, company_id } = req.user;

  try {
    /* ================= EMPLOYEES KPI ================= */
    const [emp] = await db.query(
      `
      SELECT
        COUNT(*) as total,
        SUM(is_active = 0) as inactive
      FROM employees
      WHERE company_id = ?
      `,
      [company_id]
    );

    res.json({
      role,
      scope: "ALL", // HR also sees full dashboard
      kpis: {
        employees: emp[0],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard failed" });
  }
};
