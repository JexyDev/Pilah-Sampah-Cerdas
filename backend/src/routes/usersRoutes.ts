import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const users = [
    { id: 1, avatar: "BA", avatarBg: "bg-blue-100", avatarColor: "text-blue-700", nama: "Budi Antoro", nik: "3273112233445566", peran: "Warga", wilayah: "RT 01 / RW 04", setoran: "45.2", status: "Aktif" },
    { id: 2, avatar: "SR", avatarBg: "bg-purple-100", avatarColor: "text-purple-700", nama: "Siti Rahmawati", nik: "3273112233445577", peran: "Warga", wilayah: "RT 03 / RW 02", setoran: "32.8", status: "Aktif" },
    { id: 3, avatar: "AW", avatarBg: "bg-orange-100", avatarColor: "text-orange-700", nama: "Ahmad Wijaya", nik: "3273112233445588", peran: "Warga", wilayah: "RT 02 / RW 04", setoran: "28.5", status: "Aktif" },
    { id: 4, avatar: "DL", avatarBg: "bg-green-100", avatarColor: "text-green-700", nama: "Dewi Lestari", nik: "3273112233445599", peran: "Petugas", wilayah: "Kec. Coblong", setoran: "-", status: "Aktif" },
    { id: 5, avatar: "HS", avatarBg: "bg-red-100", avatarColor: "text-red-700", nama: "Hendra Saputra", nik: "3273112233445500", peran: "Warga", wilayah: "RT 05 / RW 01", setoran: "0", status: "Nonaktif" },
    { id: 6, avatar: "RS", avatarBg: "bg-blue-100", avatarColor: "text-blue-700", nama: "Rudi Santoso", nik: "3273112233445511", peran: "Admin", wilayah: "Kec. Coblong", setoran: "-", status: "Aktif" },
    { id: 7, avatar: "SN", avatarBg: "bg-pink-100", avatarColor: "text-pink-700", nama: "Siti Nurhaliza", nik: "3273112233445522", peran: "Petugas", wilayah: "Kel. Lebakgede", setoran: "-", status: "Aktif" },
    { id: 8, avatar: "AM", avatarBg: "bg-teal-100", avatarColor: "text-teal-700", nama: "Asep Maulana", nik: "3273112233445533", peran: "Warga", wilayah: "RT 06 / RW 06", setoran: "12.4", status: "Aktif" },
    { id: 9, avatar: "RH", avatarBg: "bg-orange-100", avatarColor: "text-orange-700", nama: "Reza Herdian", nik: "3273112233445544", peran: "Admin", wilayah: "Lebak Siliwangi", setoran: "-", status: "Aktif" },
    { id: 10, avatar: "DF", avatarBg: "bg-yellow-100", avatarColor: "text-yellow-700", nama: "Dian Fitriani", nik: "3273112233445555", peran: "Warga", wilayah: "RT 02 / RW 01", setoran: "18.9", status: "Aktif" }
  ];

  res.status(200).json({
    status: "success",
    data: users
  });
});

export default router;
