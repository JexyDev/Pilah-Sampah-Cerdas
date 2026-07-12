import { Router } from "express";

const router = Router();

// Tempat Sampah
router.get("/", (req, res) => {
  const bins = [
    { id: 1, kode: "BIN-001", lokasi: "Balai Warga RW 04", rtRw: "RT 01 / RW 04", kapasitas: 85, status: "Penuh", lastUpdate: "10 menit yang lalu" },
    { id: 2, kode: "BIN-002", lokasi: "Taman Posyandu", rtRw: "RT 03 / RW 02", kapasitas: 42, status: "Normal", lastUpdate: "1 jam yang lalu" },
    { id: 3, kode: "BIN-003", lokasi: "Fasum Lapangan", rtRw: "RT 02 / RW 04", kapasitas: 15, status: "Kosong", lastUpdate: "3 jam yang lalu" },
    { id: 4, kode: "BIN-004", lokasi: "Depan Masjid", rtRw: "RT 05 / RW 01", kapasitas: 92, status: "Penuh", lastUpdate: "Baru saja" },
    { id: 5, kode: "BIN-005", lokasi: "Pos Satpam Utama", rtRw: "RT 01 / RW 01", kapasitas: 0, status: "Perbaikan", lastUpdate: "1 hari yang lalu" }
  ];
  res.status(200).json({ status: "success", data: bins });
});

// Lokasi
router.get("/locations", (req, res) => {
  const locations = [
    { id: 1, nama: "RW 04", alamat: "Jl. Dipatiukur No. 12", pic: "Bpk. Suryana", binsCount: 12, wargaCount: 245, status: "Aktif" },
    { id: 2, nama: "RW 02", alamat: "Jl. Hasanudin No. 8", pic: "Ibu Nengsih", binsCount: 8, wargaCount: 156, status: "Aktif" },
    { id: 3, nama: "RW 01", alamat: "Jl. Sekeloa No. 45", pic: "Bpk. Ujang", binsCount: 15, wargaCount: 312, status: "Aktif" },
    { id: 4, nama: "Bank Sampah Induk", alamat: "Jl. Dago No. 102", pic: "Bpk. Ridwan", binsCount: 5, wargaCount: 0, status: "Pusat" }
  ];
  res.status(200).json({ status: "success", data: locations });
});

export default router;
