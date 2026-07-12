import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const notifications = [
    { id: 1, icon: "warning", iconBg: "bg-red-100", iconColor: "text-red-600", title: "Kapasitas Penuh", desc: "Tempat sampah BIN-004 di Depan Masjid telah mencapai kapasitas 92%. Segera jadwalkan pengangkutan.", time: "10 menit yang lalu", isRead: false },
    { id: 2, icon: "group_add", iconBg: "bg-blue-100", iconColor: "text-blue-600", title: "Pendaftaran Pengguna Baru", desc: "Terdapat 12 pengguna baru mendaftar dari RW 04 hari ini.", time: "2 jam yang lalu", isRead: false },
    { id: 3, icon: "check_circle", iconBg: "bg-green-100", iconColor: "text-green-600", title: "Pengangkutan Selesai", desc: "Petugas 'Ahmad' telah menyelesaikan rute pengangkutan di RW 02.", time: "5 jam yang lalu", isRead: true },
    { id: 4, icon: "star", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", title: "Pencapaian Poin", desc: "Warga 'Siti Rahmawati' berhasil menembus peringkat 2 di leaderboard bulan ini.", time: "1 hari yang lalu", isRead: true },
    { id: 5, icon: "build", iconBg: "bg-gray-200", iconColor: "text-gray-600", title: "Laporan Kerusakan", desc: "Tempat sampah BIN-005 dilaporkan mengalami kerusakan pada sensor ultrasonik.", time: "1 hari yang lalu", isRead: true }
  ];
  res.status(200).json({ status: "success", data: notifications });
});

export default router;
