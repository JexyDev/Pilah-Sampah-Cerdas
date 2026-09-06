# Panduan Penggunaan Sistem Terpadu BERSEKA
**Universitas Komputer Indonesia (UNIKOM) & Pemkot Bandung**  
*Versi: 2.0 (Hasil Evaluasi Lapangan)*

---

## 1. Ikhtisar 6 Peran Resmi Sistem

Sistem BERSEKA memiliki 6 peran (*roles*) resmi dengan batasan wewenang dan cakupan akses yang terisolasi:

| No | Nama Peran | Kode Sistem | Cakupan Akses & Tanggung Jawab |
|:---|:---|:---|:---|
| 1 | **Dosen Pembimbing Lapangan** | `DPL` | Membimbing mahasiswa KKN pada kelompok yang diampu, memantau absensi/geofence harian, memvalidasi logbook, dan memberikan penilaian akademik (Proker, Disiplin, Sikap, Pelaksanaan, Laporan Akhir). |
| 2 | **Mahasiswa KKN** | `MAHASISWA_KKN` | Melakukan presensi geofence GPS berbasis jadwal, mencatat logbook harian (multi-foto & PDF), mendata fasilitas pemilahan warga, dan mengajukan Program Kerja (Ketua Kelompok). |
| 3 | **Warga Masyarakat** | `WARGA` | Mendaftarkan tempat sampah berstiker QR, mencatat riwayat pemilahan sampah, menukarkan poin daur ulang, dan mengakses edukasi lingkungan. |
| 4 | **Mitra Pendamping Lapangan** | `MPL` | Mitra lapangan (Aparatur Kewilayahan / Dinas Lingkungan Hidup) yang mendampingi kelompok KKN di wilayah penugasan dengan hak monitoring dan penilaian setara DPL. |
| 5 | **Pemimpin / Pimpinan** | `PEMIMPIN` (`PIMPINAN`) | **Mode View-Only**. Mengakses dasbor eksekutif, rekapitulasi nilai mahasiswa lintas wilayah, monitoring absensi, dan analitik agregat tanpa izin mengubah/memanipulasi data nilai. |
| 6 | **Satgas / Task Force** | `TASK_FORCE` | Tim teknis operasional lapangan untuk validasi data darurat, peninjauan anomali geofence, survei awal fasilitas, dan supervisi lapangan. |

---

## 2. Prosedur Presensi & Timesheet KKN

### 2.1 Presensi Geofencing GPS (Mobile App)
1. **Buka Aplikasi Mobile BERSEKA** dan pastikan GPS/Lokasi perangkat telah aktif.
2. Pada beranda Mahasiswa KKN, sistem akan mendeteksi jadwal aktif hari ini.
3. Klik tombol **"Mulai Kegiatan"** saat memasuki radius zona kegiatan (toleransi 100–150m).
4. Timer durasi akan berjalan secara persisten dan tersinkronisasi otomatis dengan server.
5. Jika keluar dari zona melebihi toleransi, sistem akan memberikan peringatan akumulasi waktu di luar zona (*out-of-zone*).
6. Tekan **"Selesai Kegiatan"** saat sesi berakhir untuk mencatat kehadiran lengkap dan menghentikan layanan GPS.

### 2.2 Filter Rentang Tanggal Timesheet (Web & Dashboard)
- DPL, MPL, dan Pimpinan dapat memfilter monitoring absensi dan logbook menggunakan pemilih **Tanggal Mulai (*Start Date*)** dan **Tanggal Selesai (*End Date*)**.
- Data yang ditampilkan mencakup rincian jam masuk, jam pulang, akumulasi menit dalam zona, dan persentase kepatuhan.

---

## 3. SOP Pengajuan & Penilaian Program Kerja (Proker)

### 3.1 Pengajuan oleh Mahasiswa (Khusus Ketua Kelompok)
1. Pengajuan Program Kerja Kelompok (Pilar 1: Perencanaan) **hanya dapat dilakukan oleh Ketua Kelompok**. Anggota kelompok berstatus peninjau.
2. Form pengajuan wajib melampirkan berkas bukti / proposal (PDF atau foto) atau tautan Google Drive dokumen pendukung.
3. Setelah diajukan, status proker akan berstatus `DIAJUKAN`.

### 3.2 Penilaian Awal & Aturan Penguncian Penilaian (DPL & MPL)
1. **Syarat Penilaian Dibuka**: Penilaian proker baru dapat dilakukan jika kelompok **sudah mengunggah berkas lampiran bukti** (`hasAttachment == true`).
2. **Kunci Penilaian Otomatis**: Jika kelompok belum mengunggah berkas bukti, kolom input nilai akan **dikunci (disabled)** dan sistem memunculkan peringatan *"File lampiran bukti program kerja belum diunggah oleh ketua kelompok"*.
3. **Penilaian Awal (Early Scoring)**: DPL dan MPL diizinkan memberikan penilaian lebih awal segera setelah bukti proker terunggah, tanpa harus menunggu seluruh jadwal KKN selesai.

---

## 4. SOP Penempelan & Pengelolaan Stiker QR Tempat Sampah Warga

### 4.1 Registrasi Stiker QR
1. Mahasiswa KKN atau Kader Lingkungan membagikan stiker QR resmi BERSEKA kepada warga.
2. Tempelkan stiker QR pada permukaan tempat sampah yang bersih, kering, dan mudah dijangkau saat proses pemindaian.
3. Buka menu **"Scan QR / Tambah Tempat Sampah"** di aplikasi Mobile.
4. Pindai kode QR stiker untuk menautkannya ke identitas rumah warga (Nomor KK / Nama Kepala Keluarga).

### 4.2 Prosedur Pencatatan Manual / Offline
1. Jika barcode QR mengalami kerusakan fisik atau kamera ponsel bermasalah, gunakan opsi **"Input Manual Kode Tempat Sampah"**.
2. Masukkan nomor seri unik yang tertera di bawah kode batang (contoh: `BSK-BDG-00123`).
3. Jika koneksi internet tidak stabil di lokasi, data pemilahan akan tersimpan di *local cache* aplikasi dan otomatis tersinkronisasi saat perangkat terhubung kembali ke jaringan internet.

---

## 5. Tautan Evaluasi & Kuesioner Masukan Pengguna

Untuk meningkatkan kualitas sistem dan evaluasi berkala pelaksanaan program:
- **Tautan Kuesioner Evaluasi Lapangan**: [https://forms.gle/berseka-evaluasi-sistem](https://forms.gle/berseka-evaluasi-sistem)
- Kuesioner ini dapat diakses langsung dari menu **Profil & Pengaturan** di Aplikasi Mobile BERSEKA ("Kuesioner Evaluasi & Feedback") dan Portal Web DPL/Pimpinan.
