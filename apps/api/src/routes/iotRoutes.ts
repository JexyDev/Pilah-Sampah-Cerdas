import { Router } from "express";
import { iotController } from "../controllers/iotController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Ingest telemetri dari hardware / emulator (Otentikasi via API Key)
router.post("/readings/ingest", (req, res) => iotController.ingestReading(req, res));

// Dropdown petugas lapangan untuk penugasan PIC
router.get("/officers", authMiddleware, (req, res) => iotController.getOfficers(req, res));

// Ringkasan dashboard pemantauan IoT (Monitoring View)
router.get("/summary", authMiddleware, (req, res) => iotController.getDashboardSummary(req, res));

// Rekomendasi analisis sistem (Google Gemini / Standar ISO)
router.get("/recommendations", authMiddleware, (req, res) =>
  iotController.getAiRecommendation(req, res)
);

// Data sensor telemetri (Paginasi dan Filter untuk Data Sensor View)
router.get("/readings", authMiddleware, (req, res) => iotController.getReadings(req, res));

// Ekspor data sensor ke berkas CSV standar ISO
router.get("/readings/export", authMiddleware, (req, res) =>
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
router.get("/config", authMiddleware, (req, res) => iotController.getSystemConfig(req, res));
router.put(
  "/config",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  (req, res) => iotController.updateSystemConfig(req, res)
);

// CRUD & Manajemen Perangkat IoT
router.get("/devices", authMiddleware, (req, res) => iotController.getAllDevices(req, res));
router.get("/devices/:id", authMiddleware, (req, res) => iotController.getDeviceById(req, res));
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
router.get("/devices/:id/readings", authMiddleware, (req, res) =>
  iotController.getDeviceReadings(req, res)
);

// Validasi API Key Gemini & Pengambilan Model Resmi
router.post("/ai/validate-key", authMiddleware, (req, res) =>
  iotController.validateGeminiApiKey(req, res)
);

// Simulator Background Service (Server-side persistent continuous stream)
router.get("/simulator/status", authMiddleware, (req, res) =>
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
