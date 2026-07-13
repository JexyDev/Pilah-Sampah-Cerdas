export const users = [
  { id: 1, userId: "USR-123", avatar: "BA", avatarBg: "bg-blue-100", avatarColor: "text-blue-700", nama: "Budi Antoro", nik: "3273012345678901", password: "password123", peran: "Warga", wilayah: "RT 01 / RW 04", setoran: "45.2", status: "Aktif", point: 250 },
  { id: 2, userId: "USR-234", avatar: "SR", avatarBg: "bg-purple-100", avatarColor: "text-purple-700", nama: "Siti Rahmawati", nik: "3273112233445577", password: "password123", peran: "Warga", wilayah: "RT 03 / RW 02", setoran: "32.8", status: "Aktif", point: 120 },
  { id: 3, userId: "ADM-001", avatar: "RS", avatarBg: "bg-blue-100", avatarColor: "text-blue-700", nama: "Rudi Santoso", nik: "1111111111111111", password: "password123", peran: "Admin", wilayah: "Kec. Coblong", setoran: "-", status: "Aktif", point: 0 },
];

export const bins = [
  { id: 1, qrSerial: "BIN-123", householdId: "USR-123", type: "Organik", capacityKg: 20.0, currentVolumeL: 5.5, currentWeightKg: 2.1, status: "Normal", lastEmptied: "2024-05-18T10:00:00Z" },
  { id: 2, qrSerial: "BIN-124", householdId: "USR-123", type: "Anorganik", capacityKg: 20.0, currentVolumeL: 18.5, currentWeightKg: 8.4, status: "Kritis", lastEmptied: "2024-05-15T08:00:00Z" },
];

export const transactions = [
  { id: 1, txId: "TRX-001", userId: "USR-123", binId: "BIN-123", type: "Setor Sampah", wasteType: "Organik", volume: 1.2, weightKg: 0.5, pointReward: 15, date: "2024-05-19T14:30:00Z" },
  { id: 2, txId: "TRX-002", userId: "USR-123", binId: "BIN-124", type: "Setor Sampah", wasteType: "Anorganik", volume: 2.0, weightKg: 1.1, pointReward: 25, date: "2024-05-18T11:20:00Z" },
];

export const notifications = [
  { id: 1, type: "TONG_PENUH", title: "Kapasitas Tong Kritis", desc: "Tong Anorganik Anda hampir penuh (92%).", isRead: false, time: "2 jam lalu", icon: "warning", iconBg: "bg-red-100", iconColor: "text-red-500", role: "WARGA" },
  { id: 2, type: "POIN_BERTAMBAH", title: "Poin Bertambah", desc: "Anda mendapatkan +15 poin dari setoran organik.", isRead: true, time: "1 hari lalu", icon: "star", iconBg: "bg-yellow-100", iconColor: "text-yellow-500", role: "WARGA" },
  { id: 3, type: "INFO", title: "Jadwal Pengangkutan", desc: "Pengangkutan wilayah Anda dijadwalkan besok pagi.", isRead: true, time: "2 hari lalu", icon: "local_shipping", iconBg: "bg-blue-100", iconColor: "text-blue-500", role: "WARGA" },
  { id: 4, type: "PENGAJUAN_PENGOSONGAN", title: "Pengajuan Pengosongan Baru", desc: "Budi Antoro mengajukan pengosongan tong Anorganik (BIN-124)", isRead: false, time: "10 mnt lalu", icon: "delete_sweep", iconBg: "bg-orange-100", iconColor: "text-orange-500", role: "ADMIN" }
];
