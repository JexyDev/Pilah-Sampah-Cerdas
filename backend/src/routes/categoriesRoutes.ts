import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const categories = [
    { id: 1, nama: "Kertas & Kardus", jenis: "Anorganik", iconBg: "bg-blue-100", iconColor: "text-blue-600", poin: "50 / kg", harga: "Rp 1.500", desc: "Kertas hvs, koran, majalah, kardus kemasan." },
    { id: 2, nama: "Plastik PET", jenis: "Anorganik", iconBg: "bg-cyan-100", iconColor: "text-cyan-600", poin: "120 / kg", harga: "Rp 3.000", desc: "Botol air mineral, botol minuman bening." },
    { id: 3, nama: "Plastik HDPE", jenis: "Anorganik", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", poin: "80 / kg", harga: "Rp 2.000", desc: "Botol sampo, jerigen, tutup botol." },
    { id: 4, nama: "Kaca & Beling", jenis: "Anorganik", iconBg: "bg-amber-100", iconColor: "text-amber-600", poin: "30 / kg", harga: "Rp 800", desc: "Botol sirup, toples, pecahan kaca." },
    { id: 5, nama: "Logam & Kaleng", jenis: "Anorganik", iconBg: "bg-gray-200", iconColor: "text-gray-700", poin: "150 / kg", harga: "Rp 4.000", desc: "Kaleng minuman, paku, seng." },
    { id: 6, nama: "Sisa Makanan", jenis: "Organik", iconBg: "bg-green-100", iconColor: "text-green-600", poin: "10 / kg", harga: "-", desc: "Sisa sayur, nasi, buah-buahan (untuk kompos)." }
  ];
  res.status(200).json({ status: "success", data: categories });
});

export default router;
