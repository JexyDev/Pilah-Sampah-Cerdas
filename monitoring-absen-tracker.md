# Tracker: Monitoring Absen Radius KKN

Dokumen pelacakan progress implementasi fitur "Monitoring Absen Radius" di Manajemen Kegiatan TrashCare.

## Status Umum
- **Total Progress**: 100% (SELESAI)
- **Target Release**: Absensi radius real-time mahasiswa KKN berfungsi penuh, efisien baterai, visualisasi peta Leaflet web, integrasi poin ledger.

---

## Rincian Checklist Fitur

### 1. BACKEND — TRACKING GPS & VALIDASI RADIUS
- [x] 1.1 Database Migration: Tambah kolom koordinat & radius di `jadwal` (Schedule), buat tabel `lokasi_mahasiswa` (StudentLocation) & `kehadiran_kegiatan` (ActivityAttendance)
- [x] 1.2 Endpoint `POST /api/v1/mahasiswa/lokasi` — Simpan koordinat real-time mahasiswa & auto-cleanup data > 24 jam
- [x] 1.3 Rate Limiting `POST /api/v1/mahasiswa/lokasi` — Batasi maks 1 request per 15 detik per mahasiswa (in-memory rate limiter)
- [x] 1.4 Endpoint `GET /api/v1/kegiatan/:id/lokasi` — Ambil koordinat & radius kegiatan (dengan fallback ke system_configs jika kosong)
- [x] 1.5 Uji Haversine Helper — Menghitung jarak presisi antara mahasiswa dan koordinat kegiatan
- [x] 1.6 Endpoint `POST /api/v1/kegiatan/:id/absen` — Logika pencatatan absensi otomatis & manual dengan validasi radius di backend
- [x] 1.7 Integrasi Ledger Poin — Tambah +10 poin KKN secara atomik dengan ledger terpisah setelah absensi disetujui/berhasil

### 2. MOBILE — KIRIM GPS REAL-TIME (Mahasiswa)
- [x] 2.1 Prompt Izin Lokasi & Edukasi Etika Data — Dialog penjelasan sebelum meminta izin lokasi
- [x] 2.2 Background/Foreground GPS Tracker Service — Kirim GPS setiap 25 detik menggunakan geolocator (berhenti saat background/ditutup)
- [x] 2.3 UI Detail Kegiatan & Peta Radius — Tampilkan peta mini lokasi kegiatan, posisi mahasiswa, dan status radius
- [x] 2.4 Tombol Absen Manual & Validasi State — Tombol aktif hanya saat dalam radius, disabled beserta keterangan jika di luar radius
- [x] 2.5 Konfirmasi Absensi & Simpan Local Cache — Tampilan sukses absensi & pencatatan offline backup status

### 3. WEB — PETA MONITORING (LEAFLET)
- [x] 3.1 Halaman Baru `MonitoringAbsen.tsx` — Peta monitoring Leaflet dengan rute router `/monitoring-absen`
- [x] 3.2 Overlay Lingkaran Kegiatan — Tampilkan pin koordinat kegiatan + lingkaran radius toleransi
- [x] 3.3 Pelacakan Real-Time Mahasiswa di Peta — Marker warna hijau (dalam radius) vs merah (di luar radius) ter-update via polling 15s
- [x] 3.4 Panel Riwayat Kehadiran — Tabel daftar nama, waktu, metode, koordinat audit, dan status keberadaan terbaru
- [x] 3.5 Filter Peta — Filter berdasarkan pilihan Kegiatan, Tanggal, atau Nama Mahasiswa

### 4. TAMBAH LOKASI KEGIATAN (ADMIN/RW)
- [x] 4.1 Modifikasi Form Jadwal Baru — Input manual koordinat (latitude, longitude) & radius toleransi
- [x] 4.2 Integrasi Map Pin-Drop di Form — Drop pin di Leaflet map saat membuat/edit jadwal untuk mendapatkan koordinat otomatis
- [x] 4.3 Validasi Bounding Box Coblong — Batasi koordinat input hanya berada dalam wilayah Kecamatan Coblong saja

---

## Log Pengujian & Uji Nyata
- **Test Jarak Presisi Haversine**: BERHASIL (Poin jarak ~33m dideteksi dalam radius 100m; Poin jarak ~500m dideteksi di luar radius 100m).
- **Test Absen Manual Di Luar Radius**: BERHASIL (Ditolak oleh backend dengan status code 400 & error `OUT_OF_RADIUS`).
- **Test Poin Ledger KKN**: BERHASIL (Menambahkan +10 poin di tabel `riwayat_poin` untuk pengguna mahasiswa secara atomik dalam transaksi database).
- **Test GPS Mati / Izin Ditolak**: BERHASIL (Tampilan mobile menampilkan banner error informatif dan mematikan tombol absensi secara aman).
