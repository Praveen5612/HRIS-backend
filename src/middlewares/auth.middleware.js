import jwt from "jsonwebtoken";

/* ============================
   VERIFY TOKEN (COOKIE)
============================ */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("AUTH HEADER:", authHeader);
  console.log("JWT SECRET:", process.env.JWT_SECRET);

  if (!authHeader) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = authHeader.split(" ")[1];
  

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    
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


