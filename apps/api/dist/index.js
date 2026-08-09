/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
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
import systemRouter from "./routes/systemRoutes.js";
import configRouter from "./routes/configRoutes.js";
import gamificationRouter from "./routes/gamificationRoutes.js";
import facilityRouter from "./routes/facilityRoutes.js";
import bankSampahRouter from "./routes/bankSampahRoutes.js";
import notificationIntegrationRouter from "./routes/notificationIntegrationRoutes.js";
import kknRouter from "./routes/kknRoutes.js";
import residuRouter from "./routes/residuRoutes.js";
import superUserRouter from "./routes/superUserRoutes.js";
import rwRouter from "./routes/rwRoutes.js";
import ideDaurUlangRouter from "./routes/ideDaurUlangRoutes.js";
import areaRouter from "./routes/areaRoutes.js";
import adminMahasiswaRouter from "./routes/adminMahasiswaRoutes.js";
import kknAttendanceRouter from "./routes/kknAttendanceRoutes.js";
import pemanfaatanRouter from "./routes/pemanfaatanRoutes.js";
import pengangkutanRouter from "./routes/pengangkutanRoutes.js";
import kelompokRouter from "./routes/kelompokRoutes.js";
import dplRouter from "./routes/dplRoutes.js";
import permissionRouter from "./routes/permissionRoutes.js";
import { setupSwagger } from "./swagger.js";
import { readOnlyGuard } from "./middlewares/readOnlyGuard.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// Enable CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.json());
app.use(cookieParser());
app.use(readOnlyGuard);
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
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/schedules", scheduleRouter);
app.use("/api/v1/system", systemRouter);
app.use("/api/v1/configs", configRouter);
app.use("/api/v1/gamification", gamificationRouter);
app.use("/api/v1/facilities", facilityRouter);
app.use("/api/v1/bank-sampah", bankSampahRouter);
app.use("/api/v1/notifications/integration", notificationIntegrationRouter);
app.use("/api/v1/kkn", kknRouter);
app.use("/api/v1/residu", residuRouter);
app.use("/api/v1/petugas-residu", residuRouter);
app.use("/api/v1/super-user", superUserRouter);
app.use("/api/v1/rw", rwRouter);
app.use("/api/v1/rt", rwRouter);
app.use("/api/v1/ide-daur-ulang", ideDaurUlangRouter);
app.use("/api/v1/areas", areaRouter);
app.use("/api/v1/admin/mahasiswa", adminMahasiswaRouter);
app.use("/api/v1", kknAttendanceRouter);
app.use("/api/v1/pemanfaatan", pemanfaatanRouter);
app.use("/api/v1/pengangkutan", pengangkutanRouter);
app.use("/api/v1/kelompok", kelompokRouter);
app.use("/api/v1/dpl", dplRouter);
app.use("/api/v1/permissions", permissionRouter);
// Master API Spec Alias Mounts (Compatibility for mobile client without /v1 prefix)
app.use("/api/v1/user", userRouter);
app.use("/api/kkn", kknRouter);
app.use("/api", kknAttendanceRouter);
app.use("/api/residu", residuRouter);
app.use("/api/petugas-residu", residuRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/auth", authRouter);
app.use("/api/rw", rwRouter);
app.use("/api/rt", rwRouter);
// Global Error Handler Middleware
app.use((err, req, res, _next) => {
    console.error("Unhandled Global Error:", err);
    res.status(err.status || 500).json({
        success: false,
        code: err.code || "INTERNAL_SERVER_ERROR",
        message: "Sistem sedang mengalami gangguan sementara, silakan coba beberapa saat lagi.",
    });
});
// Initialize Swagger Docs
setupSwagger(app);
// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});
const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`pilahsampah.id Backend running on port ${PORT}`);
    console.log(`===============================================`);
});
// Initialize WebSocket Server
import { websocketService } from "./services/websocketService.js";
websocketService.init(server);
// Initialize Cron Scheduler Service
import { cronService } from "./services/cronService.js";
cronService.start();
// Auto-sanitize RT/RW names to human names if dummy names exist in DB
(async () => {
    try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        const dummyUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: { contains: "Ketua RT" } },
                    { name: { contains: "Ketua RW" } },
                    { name: { contains: "Lurah " } },
                    { name: { contains: "Camat " } },
                    { name: { startsWith: "Asep RW" } },
                    { name: { startsWith: "Bambang RT" } },
                ],
            },
        });
        if (dummyUser) {
            console.log("[AutoSanitize] Found dummy RT/RW/Lurah/Camat names in DB. Sanitizing to human names...");
            const { exec } = await import("child_process");
            exec("npx tsx scripts/fix-rt-rw-human-names.ts");
            exec("npx tsx scripts/fix-executive-human-names.ts");
        }
    }
    catch (e) {
        // Non-blocking catch
    }
})();
