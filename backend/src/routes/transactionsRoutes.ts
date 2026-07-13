import { Router } from "express";
import { transactions, bins, users } from "../data/db";

const router = Router();

// Helper to decrypt QR data
const decryptQRData = (encryptedHex: string) => {
  try {
    const decoded = Buffer.from(encryptedHex, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

// All Deposits for Web Dashboard
router.get("/deposits", (req, res) => {
  // Transform transactions to web dashboard format
  const deposits = transactions.map(t => {
    const user = users.find(u => u.userId === t.userId);
    return {
      id: t.txId,
      tanggal: new Date(t.date).toLocaleString('id-ID'),
      warga: user ? user.nama : "Unknown",
      kategori: t.wasteType,
      berat: `${t.weightKg} kg`,
      poin: `+${t.pointReward}`
    };
  });
  res.status(200).json({ status: "success", data: deposits });
});

// History for Mobile App (specific user)
router.get("/history/:userId", (req, res) => {
  const userId = req.params.userId;
  const history = transactions.filter(t => t.userId === userId);
  res.status(200).json({ status: "success", data: history });
});

// Leaderboard
router.get("/leaderboard", (req, res) => {
  const sortedUsers = [...users].sort((a, b) => b.point - a.point).slice(0, 10);
  const leaderboard = sortedUsers.map((u, i) => ({
    rank: i + 1,
    nama: u.nama,
    rtRw: u.wilayah,
    poin: u.point.toLocaleString('id-ID'),
    bg: i === 0 ? "bg-yellow-100" : (i === 1 ? "bg-gray-100" : (i === 2 ? "bg-orange-100" : "bg-surface-container")),
    color: i === 0 ? "text-yellow-600" : (i === 1 ? "text-gray-500" : (i === 2 ? "text-orange-700" : "text-on-surface-variant"))
  }));
  res.status(200).json({ status: "success", data: leaderboard });
});

// Setor Sampah Warga
router.post("/setor", (req, res) => {
  const { user_id, qr_data, jenis_sampah, volume } = req.body;

  if (!qr_data || !jenis_sampah || !volume) {
    return res.status(400).json({ status: "error", message: "Data tidak lengkap" });
  }

  // Find User
  const user = users.find(u => u.userId === user_id);
  if (!user) {
    return res.status(404).json({ status: "error", message: "User tidak ditemukan" });
  }

  // Dekripsi QR Data
  const qrPayload = decryptQRData(qr_data);
  if (!qrPayload || !qrPayload.bin_id) {
    return res.status(400).json({ status: "error", message: "QR Code tidak valid atau rusak" });
  }

  const binId = qrPayload.bin_id;
  const bin = bins.find(b => b.qrSerial === binId);
  
  if (!bin) {
    return res.status(404).json({ status: "error", message: "Tong sampah tidak ditemukan" });
  }

  // Cek kapasitas
  const additionalVolume = parseFloat(volume);
  if (bin.currentVolumeL + additionalVolume > bin.capacityKg * 10) { // rough volume to kg metric for mock
     return res.status(400).json({ 
      status: "error", 
      message: "Tong sampah penuh, mohon gunakan tong sampah lain.",
      code: "BIN_FULL" 
    });
  }

  // Update bin
  bin.currentVolumeL += additionalVolume;
  bin.currentWeightKg += additionalVolume * 0.3; // mock weight
  
  if (bin.currentVolumeL > (bin.capacityKg * 10) * 0.9) {
    bin.status = "Kritis";
  }

  // Berikan poin
  const poin = jenis_sampah.toUpperCase() === "ORGANIC" || jenis_sampah.toUpperCase() === "ORGANIK" ? 100 : 150;
  user.point += poin;

  // Catat transaksi
  const tx = {
    id: transactions.length + 1,
    txId: `TRX-${Math.floor(Math.random() * 100000)}`,
    userId: user.userId,
    binId: bin.qrSerial,
    type: "Setor Sampah",
    wasteType: jenis_sampah,
    volume: additionalVolume,
    weightKg: additionalVolume * 0.3,
    pointReward: poin,
    date: new Date().toISOString()
  };
  transactions.push(tx);

  res.status(200).json({
    status: "success",
    message: "Sampah berhasil disetor",
    data: {
      transaction_id: tx.txId,
      bin_id: bin.qrSerial,
      poin_didapat: poin,
      total_poin_user: user.point
    }
  });
});

export default router;