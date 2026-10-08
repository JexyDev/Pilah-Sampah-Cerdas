# 🌿 BERSEKA - SISTEM TATA KELOLA TERPADU
## LAPORAN RESMI AUDIT, ANALISIS, DAN PENYELARASAN CAKUPAN WILAYAH RW KKN TEMATIK BERSEKA
### (SINKRONISASI 74 RW BINAAN KKN, HIDE 11 RW NON-KELOMPOK, DAN RESOLUSI DATA BASIS DATA 85 RW)

* **Nomor Dokumen**: `BERSEKA/AUDIT-VPS/2026-10/016`  
* **Tanggal Pelaksanaan**: Kamis, 8 Oktober 2026  
* **Target Infrastruktur**: Basis Data Live VPS PostgreSQL (`157.10.252.252` / `psc_db`) & Web Portal Eksekutif KKN  
* **Penerbit Dokumen**: **Tim Pengembang & Data Governance Berseka**  
* **Fungsi Dokumen**: Berita Acara Rekonsiliasi Wilayah & Penetapan Baseline 74 RW Binaan Riil  

---

### 1. Ringkasan Eksekutif (Executive Summary)

Menindaklanjuti audit perbandingan angka cakupan wilayah pada:
1. **Tampilan Dashboard Eksekutif KKN**: Sebelumnya tercantum **84 RW**.
2. **Dokumen Rekapitulasi Lama**: Tercantum **75 RW** (berdasarkan akun serial petugas +6281390000001 s/d 75).
3. **Tabel Basis Data (`rw`) Live PostgreSQL VPS**: Tercatat **85 RW Administratif Fisik**.

Setelah verifikasi faktual penetapan kelompok KKN:
* **RW yang Tidak Ada Kelompok Mahasiswanya (Wajib Hide / Dikecualikan)**:
  1. **Kel. Cipaganti**: RW 08, RW 09, RW 10, RW 11, RW 99 (5 RW)
  2. **Kel. Lebak Gede**: RW 05, RW 06 (2 RW)
  3. **Kel. Lebak Siliwangi**: RW 01, RW 02, RW 03, RW 04 (4 RW)
  **Total = 11 RW Non-Kelompok**.
* **RW Binaan Riil yang Memiliki Kelompok Mahasiswa KKN**:
  $85 - 11 = \mathbf{74\text{ RW}}$.

#### Hasil Audit & Eksekusi Penyelarasan Sistem:
* ✅ **Akar Perbedaan 84 vs 75 vs 85 vs 74**:
  - **85 RW (Database Geografis)**: Total seluruh record fisik tabel `rw` di 6 kelurahan Kecamatan Coblong.
  - **84 RW (Dashboard Lama)**: Kueri lama memfilter nama `dummy/test/99` dari 85 RW ($85 - 1 = 84$), sehingga menampilkan total wilayah administratif kecamatan dan bukan wilayah binaan mahasiswa KKN.
  - **75 RW (Dokumen Lama)**: Menghitung nomor serial petugas pemilah (`+6281390000001` s/d `+6281390000075`), di mana Cipaganti RW 08 terdaftar serial akun petugas namun faktualnya tidak ada penempatan kelompok mahasiswa KKN.
  - **74 RW (Wilayah Binaan Riil KKN Terkini)**: 74 RW binaan aktif yang dinaungi oleh **32 Kelompok Mahasiswa KKN** di lapangan.
* ✅ **11 RW Non-Kelompok Berhasil Disembunyikan (*Hidden*)**:
  11 RW tersebut telah disembunyikan secara sistemik baik di backend API kueri `activeKknRwWhere` maupun di frontend dropdown filter.
* ✅ **Penyelarasan Kartu Ringkasan Wilayah**:
  Kartu *Cakupan Wilayah KKN* di Dashboard Eksekutif kini resmi sinkron menampilkan **6 Kelurahan • 74 RW Binaan** (100% konsisten antara Web, API, Database, dan Dokumen Lapangan).
