import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caPath = path.join(__dirname, "../../ca.pem");
const ca = fs.readFileSync(caPath, "utf8");

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca,
    rejectUnauthorized: false
  },

  waitForConnections: true,
  connectionLimit: 10
});
