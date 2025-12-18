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
