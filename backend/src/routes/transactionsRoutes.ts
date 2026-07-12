import { Router } from "express";

const router = Router();

// Setoran
router.get("/deposits", (req, res) => {
  const deposits = [
    { id: "TRX-00124", tanggal: "12 Okt 2023, 08:30", warga: "Budi Antoro", kategori: "Kertas & Kardus", berat: "5.2 kg", poin: "+260" },
    { id: "TRX-00123", tanggal: "12 Okt 2023, 08:15", warga: "Siti Rahmawati", kategori: "Plastik PET", berat: "2.1 kg", poin: "+252" },
    { id: "TRX-00122", tanggal: "11 Okt 2023, 16:45", warga: "Ahmad Wijaya", kategori: "Logam & Kaleng", berat: "1.5 kg", poin: "+225" },
    { id: "TRX-00121", tanggal: "11 Okt 2023, 14:20", warga: "Budi Antoro", kategori: "Plastik HDPE", berat: "3.0 kg", poin: "+240" },
    { id: "TRX-00120", tanggal: "10 Okt 2023, 09:10", warga: "Dewi Lestari", kategori: "Kaca & Beling", berat: "4.5 kg", poin: "+135" }
  ];
  res.status(200).json({ status: "success", data: deposits });
});

// Leaderboard Warga
router.get("/leaderboard", (req, res) => {
  const leaderboard = [
    { rank: 1, nama: "Budi Santoso", rtRw: "RT 01 / RW 04", poin: "12.450", bg: "bg-yellow-100", color: "text-yellow-600" },
    { rank: 2, nama: "Siti Rahmawati", rtRw: "RT 03 / RW 02", poin: "9.800", bg: "bg-gray-100", color: "text-gray-500" },
    { rank: 3, nama: "Ahmad Wijaya", rtRw: "RT 02 / RW 04", poin: "8.200", bg: "bg-orange-100", color: "text-orange-700" },
    { rank: 4, nama: "Dewi Lestari", rtRw: "RT 05 / RW 01", poin: "7.650", bg: "bg-surface-container", color: "text-on-surface-variant" },
    { rank: 5, nama: "Hendra Saputra", rtRw: "RT 04 / RW 03", poin: "6.900", bg: "bg-surface-container", color: "text-on-surface-variant" },
    { rank: 6, nama: "Nurul Hidayah", rtRw: "RT 01 / RW 02", poin: "5.450", bg: "bg-surface-container", color: "text-on-surface-variant" },
    { rank: 7, nama: "Rizky Pratama", rtRw: "RT 02 / RW 01", poin: "4.800", bg: "bg-surface-container", color: "text-on-surface-variant" }
  ];
  res.status(200).json({ status: "success", data: leaderboard });
});

export default router;
