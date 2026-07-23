# 🛠️ Portal RW Tracker

Dokumen ini melacak kemajuan implementasi fitur-fitur pada Portal RW sesuai spesifikasi.

## Checklist Implementasi

### 1. DASHBOARD WILAYAH RW
- [ ] Analitik dan peta GIS ter-scope hanya untuk wilayah RW bersangkutan.
- [ ] Akses interaktif (bukan sekadar read-only seperti Camat/Lurah).

### 2. APPROVAL AKTIVASI QR BIN WARGA
- [ ] Halaman daftar bin berstatus `PENDING_APPROVAL` di wilayahnya.
- [ ] Menampilkan detail: data warga, foto tong, hasil cek Master QR DB, GPS lokasi, mahasiswa pendamping.
- [ ] Tombol Setujui -> Ubah status menjadi `ACTIVE_BOUND`.
- [ ] Trigger otomatis penambahan +10 poin untuk Warga dan +10 poin untuk Mahasiswa KKN.
- [ ] Tombol Tolak -> Form alasan penolakan dan notifikasi balik ke warga/mahasiswa.

### 3. VERIFIKASI AKUN PETUGAS RESIDU
- [ ] Halaman daftar Petugas Residu berstatus PENDING di wilayahnya.
- [ ] Fitur Setujui / Tolak akun Petugas Residu.

### 4. NOTIFIKASI TONG PENUH & RADAR PETA
- [ ] Menerima push notifikasi real-time saat warga menandai tong penuh beserta foto bukti.
- [ ] Peta wilayah menampilkan radar merah pada lokasi tong yang penuh.
- [ ] Memantau status penanganan tong penuh (sudah diambil/belum) beserta foto dokumentasi.

### 5. STATUS BIN TIDAK AKTIF (READ-ONLY)
- [ ] Halaman daftar bin dengan status `INACTIVE` (30 hari tanpa aktivitas).
- [ ] Hanya akses Read-Only, tanpa tombol aktivasi (karena merupakan wewenang Super Admin / Warga mengajukan aktivasi ulang).
- [ ] Fitur menambahkan catatan/komentar opsional untuk diteruskan ke Super Admin.

### 6. UBAH STATUS BIN RUSAK
- [ ] Fitur untuk menandai bin sebagai `BROKEN` (rusak/hilang fisik).
- [ ] Perubahan status ini membuat QR menjadi inaktif secara permanen dan tercatat dalam Audit Trail.

### 7. APPROVAL IDE DAUR ULANG & FASILITAS
- [ ] Halaman daftar pengajuan Ide Daur Ulang (judul, foto, material).
- [ ] Tombol Setujui (+50 poin ke warga, tampil di Social Feed) atau Tolak.
- [ ] Halaman approval pendaftaran fasilitas lingkungan (Rumah Maggot, Bank Sampah, dll).

### 8. INPUT/MONITORING DATA FASILITAS
- [ ] Form input manual data produksi mingguan fasilitas (material masuk, output panen).
- [ ] Rekapitulasi monitoring seluruh fasilitas di wilayah RW tersebut.

---
**Catatan Penting**: Data-scoping ketat diterapkan. RW tidak dapat mengakses atau memvalidasi data di luar wilayahnya.
