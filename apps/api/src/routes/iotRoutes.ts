import { Router } from "express";
import { iotController } from "../controllers/iotController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Ingest telemetri dari hardware / emulator (Otentikasi via API Key)
router.post("/readings/ingest", (req, res) => iotController.ingestReading(req, res));

// Dropdown petugas lapangan untuk penugasan PIC
router.get("/officers", authMiddleware, (req, res) => iotController.getOfficers(req, res));

// Ringkasan dashboard pemantauan IoT
router.get("/summary", authMiddleware, (req, res) => iotController.getDashboardSummary(req, res));

// Pembersihan berkala data riwayat lama (retensi data)
router.delete(
  "/readings/cleanup",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "PIMPINAN", "ADMIN_DLH"]),
  (req, res) => iotController.cleanupOldReadings(req, res)
);

// CRUD Perangkat IoT
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
  "/devices/:id/regenerate-key",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "PIMPINAN", "ADMIN_DLH"]),
  (req, res) => iotController.regenerateApiKey(req, res)
);
router.get("/devices/:id/readings", authMiddleware, (req, res) =>
  iotController.getDeviceReadings(req, res)
);

export default router;
