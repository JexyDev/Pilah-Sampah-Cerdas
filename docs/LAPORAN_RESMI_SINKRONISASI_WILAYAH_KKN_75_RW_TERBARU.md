# 🌿 BERSEKA - SISTEM TATA KELOLA TERPADU
## LAPORAN RESMI AUDIT, ANALISIS, DAN PENYELARASAN CAKUPAN WILAYAH RW KKN TEMATIK BERSEKA
### (SINKRONISASI 75 RW BINAAN KKN, HIDE 10 RW NON-KKN, DAN RESOLUSI DATA BASIS DATA 85 RW)

* **Nomor Dokumen**: `BERSEKA/AUDIT-VPS/2026-10/015`  
* **Tanggal Pelaksanaan**: Kamis, 8 Oktober 2026  
* **Target Infrastruktur**: Basis Data Live VPS PostgreSQL (`157.10.252.252` / `psc_db`) & Web Portal Eksekutif KKN  
* **Penerbit Dokumen**: **Tim Pengembang & Data Governance Berseka**  
* **Fungsi Dokumen**: Berita Acara Rekonsiliasi Wilayah & Penetapan Baseline 75 RW Binaan  

---

### 1. Ringkasan Eksekutif (Executive Summary)

Menindaklanjuti audit perbandingan angka cakupan wilayah pada:
1. **Tampilan Dashboard Eksekutif KKN**: Sebelumnya tercantum **84 RW**.
2. **Dokumen Resmi Rekapitulasi PDF**: Tercantum **75 RW Binaan KKN**.
3. **Tabel Basis Data (`rw`) Live PostgreSQL VPS**: Tercatat **85 RW Administratif Fisik**.

Tim Berseka telah melakukan investigasi mendalam terhadap akar penyebab inkonsistensi tersebut, mengeksekusi penyesuaian kode pada backend API dan antarmuka web, serta menyembunyikan (*hide*) 10 RW non-binaan secara permanen dari lingkup operasional KKN.

#### Hasil Audit & Eksekusi Perbaikan:
* ✅ **Akar Perbedaan 84 vs 75 vs 85**:
  - **85 RW (Database Geografis)**: Seluruh record fisik tabel `rw` di 6 kelurahan Kecamatan Coblong.
  - **84 RW (Dashboard Lama)**: Kueri lama memfilter nama `dummy/test/99` dari 85 RW ($85 - 1 = 84$), sehingga menampilkan total wilayah administratif kecamatan dan bukan wilayah binaan mahasiswa KKN.
  - **75 RW (Wilayah Binaan Riil KKN)**: Wilayah binaan pemukiman aktif yang dinaungi oleh **32 Kelompok Mahasiswa KKN** dan **75 Akun Petugas Pemilah Residu Resmi** (`+6281390000001` s/d `+6281390000075`).
* ✅ **10 RW Non-KKN Berhasil Disembunyikan (*Hidden*)**:
  10 RW yang tidak digunakan program KKN (kawasan hutan kota, kampus, pertokoan komersial, dan unit test) telah disembunyikan dari metrik kartu dan dropdown filter:
  - **Lebak Siliwangi (4 RW)**: RW 01, RW 02, RW 03, RW 04 *(Hutan Kota Babakan Siliwangi, Sarana Olahraga Sabuga, dan ITB)*.
  - **Lebak Gede (2 RW)**: RW 05 dan RW 06 *(Kampus Unpad Dipatiukur & kawasan komersial)*.
  - **Cipaganti (4 RW)**: RW 09, RW 10, RW 11 *(Kawasan komersial Jl. Cihampelas)* dan RW 99 *(Unit uji coba/testing)*.
* ✅ **Penyelarasan Kartu Ringkasan Wilayah**:
  Kartu *Cakupan Wilayah KKN* di Dashboard Eksekutif kini resmi sinkron menampilkan **6 Kelurahan • 75 RW Binaan** (sama persis dengan PDF dan penugasan lapangan).
