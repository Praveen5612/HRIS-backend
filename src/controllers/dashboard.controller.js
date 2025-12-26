import db from "../models/db.js";

export const getDashboard = async (req, res) => {
  const { role, company_id } = req.user;

  try {
    const [empRows] = await db.promise().query(
      `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(is_active = 0), 0) AS inactive
      FROM employees
      WHERE company_id = ?

      `,
      [company_id]
    );

    const employees = empRows[0] || { total: 0, inactive: 0 };

    const attendance = {
      present: 0,
      absent: 0,
      late: 0,
      ot: 0,
      status: "NOT_AVAILABLE",
    };

    const approvals = { leave: 0, attendance: 0, fnf: 0 };

    const salary = { status: "NOT_STARTED", month: null };

    const compliance = {
      esi: "OK",
      pf: "OK",
      bonus: "UPCOMING",
      gratuity: "OK",
    };

    const cost = { payroll: 0, overtime: 0, esiPf: 0 };

    return res.json({
      role,
      company_id,
      scope: role === "COMPANY_ADMIN" ? "COMPANY" : "DEPARTMENT",
      kpis: {
        employees,
        attendance,
        approvals,
        salary,
        compliance,
        cost,
      },
      meta: {
        generatedAt: new Date(),
        dataStatus: "PARTIAL",
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ message: "Dashboard failed" });
  }
};
