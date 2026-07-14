import { Router } from "express";
import { bins, users } from "../data/db";

const router = Router();

// Tempat Sampah (All Bins for Web Dashboard)
router.get("/", (req, res) => {
  const mappedBins = bins.map(b => {
    const capacityL = b.capacityKg * 10;
    const capacityPercent = Math.min(100, Math.round((b.currentVolumeL / capacityL) * 100));
    
    let statusText = "Normal";
    if (b.status === "Kritis" || capacityPercent >= 90) {
      statusText = "Penuh";
    } else if (b.status === "Perbaikan") {
      statusText = "Perbaikan";
    }

    return {
      id: b.id.toString(),
      // Fields for Smart Bin Management page
      kode: b.qrSerial,
      lokasi: b.qrSerial === "BIN-123" ? "Balai Warga RW 04" : "Taman Posyandu",
      rtRw: b.qrSerial === "BIN-123" ? "RT 01 / RW 04" : "RT 03 / RW 02",
      kapasitas: capacityPercent,
      status: statusText,
      lastUpdate: "5 menit yang lalu",
      
      // Fields for Live Monitoring (geospatial) page
      qrCode: b.qrSerial,
      latitude: b.qrSerial === "BIN-123" ? -6.8915 : -6.8903,
      longitude: b.qrSerial === "BIN-123" ? 107.6107 : 107.6110,
      maxCapacityLiter: capacityL.toString(),
      currentVolumeLiter: b.currentVolumeL.toString(),
      category: {
        name: b.type
      }
    };
  });
  res.status(200).json({ status: "success", data: mappedBins });
});

// Household Bins (For Mobile App)
router.get("/household/:id", (req, res) => {
  const householdId = req.params.id;
  const householdBins = bins.filter(b => b.householdId === householdId);
  res.status(200).json({ status: "success", data: householdBins });
});

// Get Bin by QR Serial
router.get("/qr/:serial", (req, res) => {
  const serial = req.params.serial;
  const bin = bins.find(b => b.qrSerial === serial);
  
  if (!bin) {
    return res.status(404).json({ status: "error", message: "Tong sampah tidak ditemukan" });
  }
  
  res.status(200).json({ status: "success", data: bin });
});

// Activate Bin
router.post("/activate", (req, res) => {
  const { qrSerial, userId, householdId } = req.body;
  
  if (!qrSerial || !userId || !householdId) {
    return res.status(400).json({ status: "error", message: "qrSerial, userId, dan householdId wajib diisi" });
  }

  const existingBin = bins.find(b => b.qrSerial === qrSerial);
  if (existingBin) {
    return res.status(400).json({ status: "error", message: "Tong sampah dengan QR ini sudah terdaftar" });
  }

  const newBin = {
    id: bins.length + 1,
    qrSerial,
    householdId,
    type: "Campuran", // Default, can be updated later
    capacityKg: 20.0,
    currentVolumeL: 0,
    currentWeightKg: 0,
    status: "Normal",
    lastEmptied: new Date().toISOString()
  };

  bins.push(newBin);

  res.status(201).json({ status: "success", data: newBin });
});

// Reset Request (Empty Bin)
router.post("/reset-request", (req, res) => {
  const { binId, userId, evidencePhotoPath } = req.body;

  if (!binId || !userId || !evidencePhotoPath) {
    return res.status(400).json({ status: "error", message: "binId, userId, dan evidencePhotoPath wajib diisi" });
  }

  // Simulate storing reset request
  // We can just return success for now
  res.status(200).json({
    status: "success",
    data: {
      id: "REQ-" + Math.floor(Math.random() * 10000),
      binId,
      userId,
      requestDate: new Date().toISOString(),
      status: "PENDING",
      evidencePhotoPath
    }
  });
});

export default router;
