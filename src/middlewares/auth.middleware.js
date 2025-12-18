import jwt from "jsonwebtoken";

/* ============================
   VERIFY TOKEN (COOKIE)
============================ */
export const verifyToken = (req, res, next) => {
  console.log("🔍 Cookies object:", req.cookies);
  console.log("🔍 Raw cookie header:", req.headers.cookie);

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ============================
   ROLE CHECK
============================ */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

/* ============================
   TOKEN GENERATOR
============================ */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
};


