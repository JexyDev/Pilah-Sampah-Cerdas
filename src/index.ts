import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import fs from "fs";

import authRouter from "./routes/authRoutes.js";
import householdRouter from "./routes/householdRoutes.js";
import binRouter from "./routes/binRoutes.js";
import pointRouter from "./routes/pointRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import userRouter from "./routes/userRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import scheduleRouter from "./routes/scheduleRoutes.js";
import { setupSwagger } from "./swagger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-request-id, ngrok-skip-browser-warning, Bypass-Tunnel-Reminder"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// Create uploads folder if not exists
fs.mkdirSync("uploads", { recursive: true });
// Statically serve uploads folder
app.use("/uploads", express.static("uploads"));

// Main APIs
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/households", householdRouter);
app.use("/api/v1/bins", binRouter);
app.use("/api/v1/points", pointRouter);
app.use("/api/v1/waste", aiRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/schedules", scheduleRouter);

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
