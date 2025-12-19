import dotenv from "dotenv";
dotenv.config(); // MUST be first line

import app from "./app.js";
import  db  from "./models/db.js";

const PORT = process.env.PORT || 5000;

// DB connection test (temporary)
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
  } else {
    console.log("✅ Aiven MySQL connected successfully");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
