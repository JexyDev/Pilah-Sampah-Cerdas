import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from apps/api/.env with root .env fallback
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

import { prisma } from "./lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
// Release sync: AI ONNX adapter, Student NIM password reset, printed QR codes restoration, and UI rules alignment

import express from "express";
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
import poskoKknRouter from "./routes/poskoKknRoutes.js";
import areaRouter from "./routes/areaRoutes.js";
import adminMahasiswaRouter from "./routes/adminMahasiswaRoutes.js";
import kknAttendanceRouter from "./routes/kknAttendanceRoutes.js";
import pemanfaatanRouter from "./routes/pemanfaatanRoutes.js";
import pengangkutanRouter from "./routes/pengangkutanRoutes.js";
import kelompokRouter from "./routes/kelompokRoutes.js";
import dplRouter from "./routes/dplRoutes.js";
import permissionRouter from "./routes/permissionRoutes.js";
import surveiKknRouter from "./routes/surveiKknRoutes.js";
import evaluasiDampakRouter from "./routes/evaluasiDampakRoutes.js";
import datasetKlasifikasiRouter from "./routes/datasetKlasifikasiRoutes.js";
import panduanRouter from "./routes/panduanRoutes.js";
import masterKegiatanRouter from "./routes/masterKegiatanRoutes.js";
import penilaianKknRouter from "./routes/penilaianKknRoutes.js";
import timelineKknRouter from "./routes/timelineKknRoutes.js";
import logbookRouter from "./routes/logbookRoutes.js";
import beritaRouter from "./routes/beritaRoutes.js";
import presensiMandiriRouter from "./routes/presensiMandiriRoutes.js";
import { systemController } from "./controllers/systemController.js";
import { kknAttendanceController } from "./controllers/kknAttendanceController.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { roleMiddleware } from "./middlewares/roleMiddleware.js";
import { safeUploadSingleImage } from "./middlewares/uploadMiddleware.js";

import { setupSwagger } from "./swagger.js";
import { readOnlyGuard } from "./middlewares/readOnlyGuard.js";
import { auditMiddleware } from "./middlewares/audit.middleware.js";
import "./workers/audit.worker.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS with Dynamic Preflight Reflection & Tunnel Header Support
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");

  // Dynamically reflect requested headers from preflight OPTIONS request
  const requestedHeaders = req.headers["access-control-request-headers"];
  if (requestedHeaders) {
    res.setHeader("Access-Control-Allow-Headers", requestedHeaders);
  } else {
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, bypass-tunnel-reminder, *"
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(readOnlyGuard);
app.use(auditMiddleware("Global"));

// Disable HTTP Caching on all API routes to prevent mobile client stale data issues
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Create uploads folder if not exists
fs.mkdirSync("uploads", { recursive: true });
// Statically serve uploads and downloads folders with multi-directory fallback
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/uploads", express.static(path.resolve(process.cwd(), "apps/api/uploads")));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads")));
app.use("/uploads", express.static(path.resolve(process.cwd(), "../uploads")));
app.use("/uploads", express.static(path.resolve(process.cwd(), "apps/web/public/uploads")));

app.use("/downloads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/downloads", express.static(path.resolve(process.cwd(), "apps/api/uploads")));
app.use("/downloads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/downloads", express.static(path.resolve(__dirname, "../../uploads")));

// In-App Version Checking Endpoints (Direct Root & /v1 for Mobile Updater)
app.get("/api/v1/app-version", (req, res) => systemController.getAppVersion(req, res));
app.get("/api/app-version", (req, res) => systemController.getAppVersion(req, res));

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
// NOTE: /api/v1/petugas-pemilahan dan /api/v1/pemilahan dihapus — alias duplikat, gunakan /api/v1/petugas-residu
app.use("/api/v1/super-user", superUserRouter);
app.use("/api/v1/rw", rwRouter);
// NOTE: /api/v1/rt dihapus — rwRouter sudah menangani RT, gunakan /api/v1/rw
app.use("/api/v1/ide-daur-ulang", ideDaurUlangRouter);
app.use("/api/v1/posko-kkn", poskoKknRouter);
app.use("/api/v1/areas", areaRouter);
// NOTE: /api/v1/wilayah dihapus — alias duplikat areaRouter, gunakan /api/v1/areas
app.use("/api/v1/admin/mahasiswa", adminMahasiswaRouter);
app.use("/api/v1/kkn-attendance", kknAttendanceRouter);
// REMOVED: app.use("/api/v1", kknAttendanceRouter) — menyebabkan collision masif dengan semua router lain
app.use("/api/v1/pemanfaatan", pemanfaatanRouter);
app.use("/api/v1/pengangkutan", pengangkutanRouter);
app.use("/api/v1/kelompok", kelompokRouter);
app.use("/api/v1/dpl", dplRouter);
app.use("/api/v1/permissions", permissionRouter);
app.use("/api/v1/survei-kkn", surveiKknRouter);
app.use("/api/v1/evaluasi-dampak", evaluasiDampakRouter);
app.use("/api/v1", datasetKlasifikasiRouter);
app.use("/api/v1/panduan", panduanRouter);
app.use("/api/v1/master-kegiatan", masterKegiatanRouter);
app.use("/api/v1/penilaian-kkn", penilaianKknRouter);
app.use("/api/v1/timeline-kkn", timelineKknRouter);
app.use("/api/v1/logbook", logbookRouter);
app.use("/api/v1/berita", beritaRouter);
app.use("/api/v1/presensi", presensiMandiriRouter);

// Master API Spec Alias Mounts (Compatibility for mobile client without /v1 prefix)
// NOTE: Alias ini dipertahankan hanya untuk backward-compat client lama.
// Jangan tambah alias baru — gunakan /api/v1/* sebagai canonical URL.
app.use("/api/v1/user", userRouter);
app.use("/api/kkn", kknRouter);
app.use("/api/logbook", logbookRouter);
app.use("/api/berita", beritaRouter);
app.use("/api/kkn-attendance", kknAttendanceRouter);
// REMOVED: app.use("/api", kknAttendanceRouter) — menyebabkan collision dengan seluruh /api/* route
app.use("/api/residu", residuRouter);
app.use("/api/petugas-residu", residuRouter);
// REMOVED: /api/petugas-pemilahan dan /api/pemilahan — alias duplikat, gunakan /api/petugas-residu
app.use("/api/notifications", notificationRouter);
app.use("/api/auth", authRouter);
app.use("/api/rw", rwRouter);
// REMOVED: /api/rt — alias duplikat rwRouter
app.use("/api/areas", areaRouter);
// REMOVED: /api/wilayah — alias duplikat areaRouter
app.use("/api/penilaian-kkn", penilaianKknRouter);

// Dedicated Direct Endpoints for Web Dashboard Monitoring & Mobile Background Worker
// (Explicitly mapped without root wildcards to eliminate router collision while guaranteeing 100% compatibility)
app.post(
  ["/api/v1/location-ping", "/api/location-ping"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknAttendanceController.pingLocation
);
app.get(
  ["/api/v1/mahasiswa/lokasi-aktif", "/api/mahasiswa/lokasi-aktif"],
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN"]),
  kknAttendanceController.getActiveStudentsLocations
);
app.get(
  ["/api/v1/timesheet/summary", "/api/timesheet/summary"],
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "MAHASISWA_KKN", "DEVELOPER"]),
  kknAttendanceController.getTimesheetSummary
);
app.get(
  ["/api/v1/kegiatan/:id/absen", "/api/kegiatan/:id/absen"],
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN"]),
  kknAttendanceController.getAttendanceList
);
app.get(
  ["/api/v1/kegiatan/:id/lokasi", "/api/kegiatan/:id/lokasi"],
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "MAHASISWA_KKN"]),
  kknAttendanceController.getActivityLocation
);
app.post(
  ["/api/v1/kegiatan/:id/absen", "/api/kegiatan/:id/absen"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.recordAttendance
);
app.post(
  [
    "/api/v1/kegiatan/:id/check-out",
    "/api/v1/kegiatan/:id/checkout",
    "/api/kegiatan/:id/check-out",
    "/api/kegiatan/:id/checkout",
  ],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.checkOutAttendance
);

// Global Error Handler Middleware
app.use((err: any, req: any, res: any, _next: any) => {
  console.error("Unhandled Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: "Sistem sedang mengalami gangguan sementara, silakan coba beberapa saat lagi.",
  });
});

// Initialize Swagger Docs
setupSwagger(app);

// Health check (supports /health, /api/health, /api/v1/health)
app.get(["/health", "/api/health", "/api/v1/health"], (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`pilahsampah.id Backend running on port ${PORT}`);
  console.log(`===============================================`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Server Warning] Port ${PORT} is already in use. Please check running Node processes.`
    );
  } else {
    console.error("[Server Error]", err);
  }
});

// Initialize WebSocket Server
import { websocketService } from "./services/websocketService.js";
websocketService.init(server);

// Initialize Cron Scheduler Service (Only on primary instance in PM2 Cluster Mode)
import { cronService } from "./services/cronService.js";
import { archiveAuditLogsCron } from "./cron/archive.cron.js";

const isPrimaryWorker = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === "0";
if (isPrimaryWorker) {
  console.log(`[CronService] Initializing cron scheduler on primary worker instance (${process.env.NODE_APP_INSTANCE || "single-process"})...`);
  cronService.start();
  archiveAuditLogsCron.start();
} else {
  console.log(`[CronService] Skipping cron initialization on secondary worker instance (${process.env.NODE_APP_INSTANCE}) to avoid duplicated tasks.`);
}

// Auto-migrate missing database columns on startup
(async () => {
  try {
    const alterStatements = [
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_rw" INTEGER;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_rt" INTEGER;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "harus_ganti_password" BOOLEAN DEFAULT false;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "subtipe_warga" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "nip" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "institusi" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "jabatan" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "program_studi" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "jenjang_pendidikan" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "provinsi" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "kabupaten" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "jumlah_anggota_keluarga" INTEGER;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "skor_penilaian_dpl" DECIMAL(5,2) DEFAULT 0.0;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "is_ketua" BOOLEAN DEFAULT false;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "jenjang_pendidikan" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "id_kelompok" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "catatan_penilaian_dpl" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "sudah_dinilai" BOOLEAN DEFAULT false;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "id_dpl" TEXT;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "kelurahan" TEXT;',
      'ALTER TABLE "jadwal" ADD COLUMN IF NOT EXISTS "is_aktif" BOOLEAN NOT NULL DEFAULT true;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "durasi_aktual_dalam_zona_menit" INTEGER;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "log_jeda" JSONB;',
      'ALTER TABLE "jejak_audit" ADD COLUMN IF NOT EXISTS "hash" TEXT;',
      'ALTER TABLE "jejak_audit" ADD COLUMN IF NOT EXISTS "previous_hash" TEXT;',
      'ALTER TABLE "fasilitas" ADD COLUMN IF NOT EXISTS "id_pendaftar" TEXT;',
      'ALTER TABLE "pemanfaatan_sampah" ADD COLUMN IF NOT EXISTS "id_program_kerja" TEXT;',
      'ALTER TABLE "pemanfaatan_sampah" ALTER COLUMN "id_rw" DROP NOT NULL;',
      'ALTER TABLE "kritik_saran_pemanfaatan" ADD COLUMN IF NOT EXISTS "id_program_kerja" TEXT;',
      'UPDATE "fasilitas" SET "status_persetujuan" = \'APPROVED\' WHERE "status_persetujuan" = \'PENDING\';',
      `DO $$ BEGIN
        CREATE TYPE "StatusProker" AS ENUM ('BELUM_DISETUJUI', 'DITERIMA', 'DITOLAK', 'SEDANG_BERJALAN', 'SELESAI');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "StatusPenilaianKkn" AS ENUM ('DRAFT', 'TERSIMPAN', 'FINAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        ALTER TYPE "FacilityType" ADD VALUE IF NOT EXISTS 'posko_kkn';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        ALTER TYPE "StatusProker" ADD VALUE IF NOT EXISTS 'SEDANG_BERJALAN';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        ALTER TYPE "StatusProker" ADD VALUE IF NOT EXISTS 'SELESAI';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `CREATE TABLE IF NOT EXISTS "program_kerja_kkn" (
        "id" TEXT PRIMARY KEY,
        "id_kelompok" TEXT NOT NULL,
        "nomor" INTEGER,
        "deskripsi" TEXT NOT NULL,
        "kategori" TEXT DEFAULT 'LAINNYA',
        "sumber" TEXT DEFAULT 'MAHASISWA',
        "waktu_pelaksanaan" TEXT,
        "link_google_drive" TEXT,
        "kebutuhan_biaya" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        "status" "StatusProker" NOT NULL DEFAULT 'BELUM_DISETUJUI',
        "catatan_dpl" TEXT,
        "id_pereview" TEXT,
        "direview_pada" TIMESTAMP(3),
        "skor_penilaian" DECIMAL(5,2),
        "evaluasi_dpl" TEXT,
        "aspek_penilaian" JSONB,
        "predikat" TEXT,
        "status_penilaian" TEXT DEFAULT 'BELUM_DINILAI',
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `DO $$ BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='kegiatan_harian_kkn') THEN 
          ALTER TABLE "kegiatan_harian_kkn" ALTER COLUMN "foto_bukti_url" DROP NOT NULL; 
        END IF; 
      END $$;`,
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "judul" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "nomor" INTEGER;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "id_mahasiswa" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "kategori" TEXT DEFAULT \'LAINNYA\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "sumber" TEXT DEFAULT \'MAHASISWA\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "waktu_pelaksanaan" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "link_google_drive" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "kebutuhan_biaya" DECIMAL(12,2) DEFAULT 0.00;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "catatan_dpl" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "id_pereview" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "direview_pada" TIMESTAMP(3);',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "skor_penilaian" DECIMAL(5,2);',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "evaluasi_dpl" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "aspek_penilaian" JSONB;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "predikat" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_penilaian" TEXT DEFAULT \'BELUM_DINILAI\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_usulan" TEXT DEFAULT \'BELUM_DISETUJUI\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_pelaksanaan" TEXT DEFAULT \'BELUM_MULAI\';',
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DISETUJUI', "status_pelaksanaan" = 'SELESAI' WHERE "status"::text = 'SELESAI' AND ("status_pelaksanaan" IS NULL OR "status_pelaksanaan" = 'BELUM_MULAI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DISETUJUI', "status_pelaksanaan" = 'SEDANG_BERJALAN' WHERE "status"::text = 'SEDANG_BERJALAN' AND ("status_pelaksanaan" IS NULL OR "status_pelaksanaan" = 'BELUM_MULAI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DISETUJUI' WHERE "status"::text IN ('DITERIMA', 'DISETUJUI') AND ("status_usulan" IS NULL OR "status_usulan" = 'BELUM_DISETUJUI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DITOLAK' WHERE "status"::text IN ('DITOLAK', 'TIDAK_DISETUJUI') AND ("status_usulan" IS NULL OR "status_usulan" = 'BELUM_DISETUJUI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'BELUM_DISETUJUI' WHERE "status_usulan" IS NULL;`,
      `UPDATE "program_kerja_kkn" SET "status_pelaksanaan" = 'BELUM_MULAI' WHERE "status_pelaksanaan" IS NULL;`,
      `CREATE TABLE IF NOT EXISTS "buku_panduan" (
        "id" TEXT PRIMARY KEY,
        "judul" TEXT NOT NULL,
        "kategori_peran" TEXT NOT NULL,
        "deskripsi" TEXT,
        "file_url" TEXT,
        "link_url" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "master_kegiatan_sampah" (
        "id" TEXT PRIMARY KEY,
        "nama" TEXT NOT NULL UNIQUE,
        "kategori" TEXT NOT NULL,
        "deskripsi" TEXT,
        "status_aktif" BOOLEAN NOT NULL DEFAULT true,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "penilaian_kkn_mahasiswa" (
        "id" TEXT PRIMARY KEY,
        "id_mahasiswa" TEXT NOT NULL UNIQUE,
        "id_kelompok" TEXT,
        "id_dpl" TEXT,
        "id_mitra" TEXT,
        "nama_mitra_penilai" TEXT,
        "skor_mitra_kehadiran" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_warga_binaan" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_proker" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_komunikasi" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_tanggung_jawab" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_bukti_kegiatan" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_dampak" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_inisiatif" INTEGER NOT NULL DEFAULT 0,
        "subtotal_mitra" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "skor_dpl_perencanaan" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_kontribusi" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_logbook" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_analisis" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_output" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_laporan_akhir" INTEGER NOT NULL DEFAULT 0,
        "subtotal_dpl" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "nilai_akhir" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "kategori_nilai" TEXT,
        "catatan_dpl" TEXT,
        "catatan_mitra" TEXT,
        "status" "StatusPenilaianKkn" NOT NULL DEFAULT 'DRAFT',
        "is_finalized" BOOLEAN NOT NULL DEFAULT false,
        "difinalisasi_pada" TIMESTAMP(3),
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "kritik_saran_pemanfaatan" (
        "id" TEXT PRIMARY KEY,
        "id_pengguna" TEXT NOT NULL,
        "warga_nama" TEXT NOT NULL,
        "id_program_kerja" TEXT,
        "kategori" TEXT DEFAULT 'Pemanfaatan Sampah',
        "judul" TEXT NOT NULL,
        "isi_kritik_saran" TEXT NOT NULL,
        "rating" INTEGER DEFAULT 5,
        "status" TEXT DEFAULT 'MENUNGGU',
        "tanggapan" TEXT,
        "ditanggapi_oleh" TEXT,
        "ditanggapi_pada" TIMESTAMP(3),
        "foto_bukti_url" TEXT,
        "id_rw" INTEGER,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "pemanfaatan_sampah" (
        "id" TEXT PRIMARY KEY,
        "id_rw" INTEGER,
        "id_program_kerja" TEXT,
        "nomor_cara_pemanfaatan" TEXT NOT NULL,
        "program" TEXT NOT NULL,
        "teknologi" TEXT NOT NULL,
        "bahan_baku" TEXT NOT NULL,
        "volume_bahan_baku" DECIMAL(10,2) NOT NULL,
        "unit_bahan_baku" TEXT NOT NULL,
        "hasil" DECIMAL(10,2) NOT NULL,
        "unit_hasil" TEXT NOT NULL,
        "foto_dokumentasi_url" TEXT NOT NULL,
        "tanggal_pencatatan" TIMESTAMP(3) NOT NULL,
        "jenis_komoditas" TEXT,
        "luas_lahan_m2" DECIMAL(8,2),
        "volume_pupuk_dipakai_kg" DECIMAL(8,2),
        "bibit_telur_gram" DECIMAL(8,2),
        "hasil_kasgot_kg" DECIMAL(8,2),
        "volume_bioaktivator_liter" DECIMAL(8,2),
        "masa_fermentasi_hari" INTEGER,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "timeline_kkn" (
        "id" TEXT PRIMARY KEY,
        "tahap_minggu" TEXT NOT NULL,
        "tanggal" TEXT NOT NULL,
        "tanggal_mulai" TIMESTAMP(3),
        "tanggal_selesai" TIMESTAMP(3),
        "fase" TEXT NOT NULL,
        "kegiatan_utama" TEXT NOT NULL,
        "output_target" TEXT NOT NULL,
        "pic_keterangan" TEXT NOT NULL,
        "status_pelaksanaan" TEXT NOT NULL DEFAULT 'BELUM_DIMULAI',
        "id_kelompok" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'ALTER TABLE "timeline_kkn" ADD COLUMN IF NOT EXISTS "tanggal_mulai" TIMESTAMP(3);',
      'ALTER TABLE "timeline_kkn" ADD COLUMN IF NOT EXISTS "tanggal_selesai" TIMESTAMP(3);',
      'CREATE INDEX IF NOT EXISTS "timeline_kkn_id_kelompok_idx" ON "timeline_kkn"("id_kelompok");',
      'CREATE INDEX IF NOT EXISTS "timeline_kkn_fase_idx" ON "timeline_kkn"("fase");',
      'CREATE INDEX IF NOT EXISTS "timeline_kkn_status_pelaksanaan_idx" ON "timeline_kkn"("status_pelaksanaan");',
      `DO $$ BEGIN
        CREATE TYPE "TipeAktivitasKkn" AS ENUM ('KELOMPOK', 'INDIVIDU');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "StatusLogbookKkn" AS ENUM ('MENUNGGU_PERSETUJUAN_KETUA', 'DITOLAK_KETUA', 'MENUNGGU_VERIFIKASI_DPL', 'DISETUJUI_DPL', 'PERLU_REVISI_DPL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `CREATE TABLE IF NOT EXISTS "logbook_kkn" (
        "id" TEXT PRIMARY KEY,
        "nomor" INTEGER,
        "id_kelompok" TEXT NOT NULL,
        "id_penulis" TEXT NOT NULL,
        "tanggal_kegiatan" DATE NOT NULL,
        "waktu_mulai" TEXT,
        "waktu_selesai" TEXT,
        "tempat" TEXT NOT NULL,
        "deskripsi" TEXT NOT NULL,
        "foto_bukti_url" TEXT NOT NULL,
        "tipe_aktivitas" "TipeAktivitasKkn" NOT NULL DEFAULT 'KELOMPOK',
        "id_program_kerja" TEXT,
        "id_fasilitas" TEXT,
        "status_persetujuan" "StatusLogbookKkn" NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN_KETUA',
        "id_ketua_penyetuju" TEXT,
        "disetujui_ketua_pada" TIMESTAMP(3),
        "catatan_ketua" TEXT,
        "id_dpl_verifikator" TEXT,
        "diverifikasi_dpl_pada" TIMESTAMP(3),
        "catatan_dpl" TEXT,
        "pekan_ke" INTEGER NOT NULL DEFAULT 1,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "logbook_dpl" (
        "id" TEXT PRIMARY KEY,
        "id_dpl" TEXT NOT NULL,
        "id_kelompok" TEXT NOT NULL,
        "tanggal" DATE NOT NULL,
        "pekan_ke" INTEGER NOT NULL,
        "tempat" TEXT NOT NULL,
        "deskripsi" TEXT NOT NULL,
        "arahan_evaluasi" TEXT,
        "foto_bukti_url" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "waktu_mulai" TEXT;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "waktu_selesai" TEXT;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "kategori" TEXT DEFAULT \'Kunjungan Lapangan\';',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "id_program_kerja" TEXT;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT \'TERKIRIM\';',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "durasi_menit" INTEGER DEFAULT 120;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "simpan_lokasi" BOOLEAN DEFAULT true;',
      'CREATE INDEX IF NOT EXISTS "logbook_kkn_id_kelompok_tanggal_idx" ON "logbook_kkn"("id_kelompok", "tanggal_kegiatan" DESC);',
      'CREATE INDEX IF NOT EXISTS "logbook_kkn_id_penulis_idx" ON "logbook_kkn"("id_penulis");',
      'CREATE INDEX IF NOT EXISTS "logbook_kkn_status_persetujuan_idx" ON "logbook_kkn"("status_persetujuan");',
      `CREATE TABLE IF NOT EXISTS "sinkronisasi_notifikasi_user" (
        "id" TEXT PRIMARY KEY,
        "id_pengguna" TEXT NOT NULL UNIQUE,
        "terakhir_sinkron" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT DEFAULT 'SYNCED',
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'CREATE INDEX IF NOT EXISTS "logbook_dpl_id_dpl_pekan_idx" ON "logbook_dpl"("id_dpl", "pekan_ke");',
    ];

    await Promise.allSettled(alterStatements.map((stmt) => prisma.$executeRawUnsafe(stmt)));
    console.log("[AutoMigration] Database columns checked and synced successfully.");

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
      console.log(
        "[AutoSanitize] Found dummy RT/RW/Lurah/Camat names in DB. Please run naming sanitization scripts manually."
      );
    }
  } catch (e: any) {
    console.error("[AutoMigration Log]", e?.message || e);
  }
})();
