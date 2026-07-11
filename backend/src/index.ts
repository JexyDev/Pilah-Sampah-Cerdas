import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import wasteRouter from "./routes/wasteRoutes.js";
import authRouter from "./routes/authRoutes.js";
import householdRouter from "./routes/householdRoutes.js";
import { setupSwagger } from "./swagger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-request-id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// Main APIs
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/households", householdRouter);
app.use("/api/v1", wasteRouter);

// Initialize Swagger Docs
setupSwagger(app);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`pilahsampah.id Backend running on port ${PORT}`);
  console.log(`===============================================`);
});

