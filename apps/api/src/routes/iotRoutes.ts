import { Router } from "express";
import { iotController } from "../controllers/iotController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { iotService } from "../services/iotService.js";

const router = Router();

// Helper middleware otorisasi dinamis berbasis konfigurasi RBAC IoT
const iotRbacMiddleware = (subPageKey: "iot_monitoring" | "iot_data_sensor" | "iot_perangkat" | "iot_konfigurasi") => {
  return async (req: any, res: any, next: any) => {
    try {
      const userRole = String(req.user?.role || "").toUpperCase();
      if (userRole === "DEVELOPER" || userRole === "SUPER_USER") {
        return next();
      }
      const config = await iotService.getOrCreateSystemConfig();
      const rbac = config.rbacPermissions || {};
      const allowed = rbac[subPageKey] || [];
      const isAllowed =
        Array.isArray(allowed) &&
        (allowed.includes(userRole) ||
          (userRole === "PIMPINAN" && (allowed.includes("PEMIMPIN") || allowed.includes("PIMPINAN"))) ||
          (userRole === "PEMIMPIN" && (allowed.includes("PIMPINAN") || allowed.includes("PEMIMPIN"))) ||
          ((userRole === "TASK_FORCE" || userRole === "PANITIA_TASKFORCE" || userRole === "TASKFORCE") &&
            (allowed.includes("TASK_FORCE") || allowed.includes("PANITIA_TASKFORCE") || allowed.includes("TASKFORCE"))));

      if (!isAllowed) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: `Peran ${userRole} tidak memiliki izin akses untuk modul IoT (${subPageKey}).`,
        });
      }
      next();
    } catch (e: any) {
      next();
    }
  };
};

// Ingest telemetri dari hardware / emulator (Otentikasi via API Key)
router.post("/readings/ingest", (req, res) => iotController.ingestReading(req, res));

// Dropdown petugas lapangan untuk penugasan PIC
router.get("/officers", authMiddleware, (req, res) => iotController.getOfficers(req, res));

// Ringkasan dashboard pemantauan IoT (Monitoring View)
router.get("/summary", authMiddleware, iotRbacMiddleware("iot_monitoring"), (req, res) =>
  iotController.getDashboardSummary(req, res)
);

// Rekomendasi analisis sistem (Google Gemini / Standar ISO)
router.get("/recommendations", authMiddleware, iotRbacMiddleware("iot_monitoring"), (req, res) =>
  iotController.getAiRecommendation(req, res)
);

// Data sensor telemetri (Paginasi dan Filter untuk Data Sensor View)
router.get("/readings", authMiddleware, iotRbacMiddleware("iot_data_sensor"), (req, res) =>
  iotController.getReadings(req, res)
);

// Ekspor data sensor ke berkas CSV standar ISO
router.get("/readings/export", authMiddleware, iotRbacMiddleware("iot_data_sensor"), (req, res) =>
  iotController.exportReadingsCsv(req, res)
);

// Pembersihan berkala data riwayat lama (retensi data)
router.delete(
  "/readings/cleanup",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "PIMPINAN", "ADMIN_DLH"]),
  (req, res) => iotController.cleanupOldReadings(req, res)
);

// Konfigurasi sistem IoT & MQTT & Gemini & RBAC Grup IoT
// GET /config diizinkan bagi pengguna dengan hak iot_konfigurasi atau iot_monitoring (misal Pimpinan) untuk membaca threshold batas normal/bahaya
router.get("/config", authMiddleware, async (req: any, res: any) => {
  try {
    const userRole = String(req.user?.role || "").toUpperCase();
    if (userRole === "DEVELOPER" || userRole === "SUPER_USER" || userRole === "ADMIN_DLH" || userRole === "DLH") {
      return iotController.getSystemConfig(req, res);
    }
    const config = await iotService.getOrCreateSystemConfig();
    const rbac = config.rbacPermissions || {};
    const allowedKonfig = rbac.iot_konfigurasi || [];
    const allowedMonitoring = rbac.iot_monitoring || [];
    const isAllowed =
      (Array.isArray(allowedKonfig) && allowedKonfig.includes(userRole)) ||
      (Array.isArray(allowedMonitoring) && allowedMonitoring.includes(userRole)) ||
      (userRole === "PIMPINAN" && (allowedMonitoring.includes("PEMIMPIN") || allowedMonitoring.includes("PIMPINAN"))) ||
      (userRole === "PEMIMPIN" && (allowedMonitoring.includes("PIMPINAN") || allowedMonitoring.includes("PEMIMPIN")));

    if (!isAllowed) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: `Peran ${userRole} tidak memiliki izin akses untuk membaca konfigurasi IoT.`,
      });
    }
    return iotController.getSystemConfig(req, res);
  } catch (err: any) {
    return iotController.getSystemConfig(req, res);
  }
});
router.put(
  "/config",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  (req, res) => iotController.updateSystemConfig(req, res)
);

// CRUD & Manajemen Perangkat IoT
router.get("/devices", authMiddleware, iotRbacMiddleware("iot_perangkat"), (req, res) =>
  iotController.getAllDevices(req, res)
);
router.get("/devices/:id", authMiddleware, iotRbacMiddleware("iot_perangkat"), (req, res) =>
  iotController.getDeviceById(req, res)
);
router.post(
  "/devices",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "PIMPINAN", "ADMIN_DLH"]),
  (req, res) => iotController.createDevice(req, res)
);
router.put(
  "/devices/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "PIMPINAN", "ADMIN_DLH"]),
  (req, res) => iotController.updateDevice(req, res)
);
router.delete(
  "/devices/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  (req, res) => iotController.deleteDevice(req, res)
);
router.post(
  "/devices/:id/ota",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  (req, res) => iotController.updateFirmwareOta(req, res)
);
router.post(
  "/devices/:id/regenerate-key",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "PIMPINAN", "ADMIN_DLH"]),
  (req, res) => iotController.regenerateApiKey(req, res)
);
router.get("/devices/:id/readings", authMiddleware, iotRbacMiddleware("iot_perangkat"), (req, res) =>
  iotController.getDeviceReadings(req, res)
);

// Validasi API Key Gemini & Pengambilan Model Resmi
router.post("/ai/validate-key", authMiddleware, iotRbacMiddleware("iot_konfigurasi"), (req, res) =>
  iotController.validateGeminiApiKey(req, res)
);

// Simulator Background Service (Server-side persistent continuous stream)
router.get("/simulator/status", authMiddleware, iotRbacMiddleware("iot_konfigurasi"), (req, res) =>
  iotController.getSimulatorStatus(req, res)
);
router.post(
  "/simulator/start",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  (req, res) => iotController.startSimulator(req, res)
);
router.post(
  "/simulator/stop",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  (req, res) => iotController.stopSimulator(req, res)
);

export default router;
