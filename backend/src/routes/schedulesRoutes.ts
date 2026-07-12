import { Router, Request, Response } from 'express';

const router = Router();

// Dummy Data Jadwal Kegiatan
const schedules = [
  {
    id: 'SCH-001',
    tanggal: '15 Nov 2026',
    waktu: '08:00 - 12:00',
    nama: 'Sosialisasi Pemilahan Sampah Organik',
    lokasi: 'Balai Warga RW 04',
    peserta: '45 Orang Terdaftar',
    status: 'Akan Datang',
    jenis: 'Sosialisasi',
    icon: 'campaign',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'SCH-002',
    tanggal: '18 Nov 2026',
    waktu: '09:00 - 15:00',
    nama: 'Kerja Bakti & Pengumpulan Masal',
    lokasi: 'Lapangan Utama Kecamatan',
    peserta: 'Umum (Target: 100+)',
    status: 'Akan Datang',
    jenis: 'Kegiatan Masal',
    icon: 'group',
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'SCH-003',
    tanggal: '10 Nov 2026',
    waktu: '13:00 - 15:00',
    nama: 'Pelatihan Daur Ulang Plastik',
    lokasi: 'Aula Kelurahan Dago',
    peserta: '20 Orang Hadir',
    status: 'Selesai',
    jenis: 'Pelatihan',
    icon: 'recycling',
    color: 'bg-surface-container text-on-surface-variant'
  }
];

// Get all schedules
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: schedules
  });
});

export default router;
