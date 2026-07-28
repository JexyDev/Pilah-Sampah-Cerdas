# Alur Kerja Fitur Mahasiswa KKN (Revisi)

Dokumen ini mencatat alur kerja (flow) terbaru untuk fitur Mahasiswa KKN pada aplikasi Mobile, setelah revisi arsitektur dari CEO. Segala referensi lama tentang status `ASSIGNED_TO_PIC` atau `PENDING_APPROVAL` untuk QR Code **DIHAPUS**.

## 1. Fitur Absensi Otomatis Berbasis Geofence (Radius)
Mahasiswa **TIDAK PERLU** melakukan presensi (tap absen) secara manual.
- **Trigger:** Mahasiswa membuka/login ke aplikasi mobile.
- **Proses:** Aplikasi secara berkala mengirimkan lokasi GPS mahasiswa.
- **Validasi:** Backend mengecek apakah koordinat mahasiswa masuk ke dalam **zona kegiatan (radius)** yang ditugaskan.
- **Kalkulasi:** Backend menghitung **durasi (berapa jam)** mahasiswa berada di dalam zona tersebut.
- **Hasil:** Jika durasi memenuhi syarat jam kerja (misal: minimal 2 jam), absen dinyatakan valid/diterima.

## 2. Fitur Edukasi & Aktivasi QR Code Warga
Mahasiswa **TIDAK PERLU** melakukan scan QR code untuk di-assign ke diri mereka (status tong sampah tidak lagi ada `DIPEGANG_MAHASISWA`).
- **Pendaftaran Warga:** Warga melakukan registrasi akun secara mandiri (atau dibantu).
- **Kunjungan Edukasi:** Mahasiswa datang ke rumah warga untuk mengecek pemahaman warga tentang cara aktivasi QR Code.
- **Bantuan Aktivasi:** Jika warga belum paham, mahasiswa membantu warga melakukan proses aktivasi QR Code di HP warga (atau melalui sistem).
- **Binding (Relasi):** Saat proses aktivasi bantuan ini, sistem akan mencatat ID Mahasiswa yang membantu (relasi: "Warga A dibantu oleh Mahasiswa X").

## 3. Fitur Monitoring & Follow-up Warga Dampingan
- **Dashboard Monitoring:** Di aplikasi mobile mahasiswa, terdapat dashboard untuk memonitor **grafik pembuangan sampah** dari warga-warga yang pernah ia bantu aktivasinya.
- **Edukasi Lanjutan (Follow-up):** Jika dari grafik terlihat warga "nakal" (membuang sampah sembarangan atau salah pilah), mahasiswa wajib mendatangi kembali rumah warga tersebut untuk memberikan edukasi lanjutan.

---
> **Catatan untuk Developer Mobile & Backend:**
> - Hapus fitur scan QR Code awal oleh mahasiswa (pengubahan status ke `ASSIGNED_TO_PIC`).
> - Hapus status `PENDING_APPROVAL` pada aktivasi tong.
> - Pastikan endpoint absensi berbasis pengiriman stream koordinat (location tracking background/foreground) yang dikalkulasi durasinya oleh backend.
