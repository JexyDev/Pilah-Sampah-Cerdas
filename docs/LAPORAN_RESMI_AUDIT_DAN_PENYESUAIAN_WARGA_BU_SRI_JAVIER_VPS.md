# 🌿 BERSEKA - SISTEM TATA KELOLA KKN TEMATIK TERPADU
## LAPORAN RESMI AUDIT & PENYESUAIAN DATA MAHASISWA PENDAMPING SERTA WILAYAH RW WARGA BINAAN PADA SERVER VPS LIVE

* **Nomor Dokumen**: `REP-AUDIT/KKN-WARGA/2026-10/022`
* **Tanggal Pelaksanaan**: Kamis, 08 Oktober 2026
* **Target Infrastruktur**: Server Live Production VPS PostgreSQL 16 (`157.10.252.252` / `psc_db`)
* **Subjek Warga Binaan**: **BU SRI** (`+62817569058`, ID: `6b1af5ef-0098-4c37-b4c8-26463da3b2c2`)
* **Lokasi Domisili Riil**: **KP Cibenying 1, RW 14**, Kelurahan Sadang Serang, Kecamatan Coblong, Kota Bandung
* **Kelompok Penempatan**: **Kelompok 10 Sadang Serang** (Cakupan Wilayah Resmi: **RW 14 & RW 17**)
* **Dosen Pembimbing Lapangan (DPL)**: **Arif Try Cahyadi, S.Ds., M.Ds.**
* **Mahasiswa Pendamping Semula**: **Ernest Tristan Rafael Siringoringo** (NIM: `10124469`, Penugasan: RW 17)
* **Mahasiswa Pendamping Sah**: **Javiersa Naufal Algani** (NIM: `10524127`, Penugasan: KP Cibenying 1 / RW 14)
* **Golden Backup Snapshot**: `/home/maker/golden_backup_pre_bu_sri_javier_08okt.sql` (Ukuran: 542 MB)
* **Status Eksekusi**: 🟢 **BERHASIL 100% & TERVERIFIKASI LIVE API (EXIT CODE 0)**

---

## 1. Ringkasan Eksekutif & Latar Belakang Masalah

Pada aplikasi mobile *Berseka Mahasiswa KKN*, halaman **Detail Warga** untuk **BU SRI** menampilkan anomali data:
1. **RW Tertahan di RW 15**: Tampil sebagai *"KP Cibenying 1 (RW 15, Kel. Sadang Serang)"*.
2. **Mahasiswa Pendamping Tertahan pada Ernest Tristan Rafael Siringoringo**: Tercantum *"Diaktivasi oleh: Ernest Tristan Rafael Siringoringo"* dan *"Pendamping: Ernest Tristan Rafael Siringoringo"*.
3. **Tombol Pengalihan Dikunci (Disabled)**: Terdapat tombol *"Alihkan Mahasiswa Pendamping (Khusus Ketua)"* dengan keterangan *"Hanya Ketua Kelompok yang dapat mengalihkan pendamping warga"*, sehingga anggota mahasiswa biasa tidak dapat melakukan mutasi mandiri dari aplikasi.

Tim Data Governance & Backend Engineering melakukan audit mendalam ke server live VPS (`157.10.252.252`) dan menemukan akar penyebab teknis (*root causes*):

### Akar Masalah Teknis (Root Cause Analysis):
1. **Misklasifikasi Wilayah Awal (RW 15)**:
   - Saat registrasi akun dan aktivasi bin pertama kali (29 September 2026), sistem menetapkan `id_rw = 76` (RW 15) dengan alamat default *Jl. Pasir Kaliki Barat No.12, RT.01/RW.15*.
   - Padahal secara faktual, rumah tangga Bu Sri berada di **KP Cibenying 1** yang merupakan bagian dari **RW 14 Kelurahan Sadang Serang** (`id_rw = 75`).
   - Secara SK Kelompok KKN, **Kelompok 10 Sadang Serang** hanya memiliki cakupan penugasan di **RW 14 dan RW 17** (`cakupan_rw: ["14", "17"]`). RW 15 berada di luar cakupan resmi Kelompok 10.
2. **Asosiasi Mahasiswa Pendaftar Bin**:
   - Bin Organik (`BSK-OGN-060926-0472`) dan Bin Anorganik (`BSK-AGN-060926-0482`) milik Bu Sri tercatat dengan `id_mahasiswa_pendaftar` milik Ernest Tristan Rafael Siringoringo (`b0aa275a-6e0c-4033-9336-90d0b49850e9`).
   - Endpoint backend `/api/v1/kkn/warga/:wargaId` (`kknService.getWargaDetail`) memetakan atribut `pendampingName`, `registeredByStudent`, dan `pendampingKkn` langsung dari field `tempat_sampah.id_mahasiswa_pendaftar`.
3. **Penyebab Belum Berganti**:
   - Fitur pengalihan di aplikasi mobile diproteksi *Role-Based Access Control (RBAC)* ketat (`ONLY_KETUA_CAN_REASSIGN`), hanya dapat dieksekusi oleh Ketua Kelompok (`Rivan Kurniawan`).
   - Belum ada serah terima resmi yang diajukan atau dieksekusi di database (`riwayat_serah_terima_kkn` masih kosong).
   - Fitur reassign di aplikasi mobile hanya memperbarui `id_mahasiswa_pendaftar` pada tempat sampah, dan secara desain tidak mengubah wilayah RW warga (`pengguna.id_rw`), sehingga perbaikan wilayah RW wajib diintervensi pada level database engine.

---

## 2. Tindakan Eksekusi & Pembaruan Data pada Database VPS

Sesuai Protokol Tata Kelola Data Berseka:
1. Telah dibuat **Golden Backup Penuh** di server VPS (`/home/maker/golden_backup_pre_bu_sri_javier_08okt.sql`, 542 MB).
2. Dijalankan script migrasi dan perbaikan relasi data atomik pada database `psc_db`:

### A. Pembaruan Tabel `pengguna` (Warga Bu Sri)
* **ID Record**: `6b1af5ef-0098-4c37-b4c8-26463da3b2c2`
* **RW Semula**: `76` (RW 15)
* **RW Baru**: **`75` (RW 14)**
* **Alamat Diperbarui**: `KP Cibenying 1, RW.14, Sadang Serang, Kecamatan Coblong, Kota Bandung, Jawa Barat 40133`
* **Status Eksekusi**: `UPDATE 1`

### B. Pembaruan Tabel `rumah_tangga`
* **ID Record**: `0e0db759-8560-4f69-8787-90ad418df67e`
* **Alamat**: `KP Cibenying 1`
* **RW Semula**: `76` (RW 15)
* **RW Baru**: **`75` (RW 14)**
* **Status Eksekusi**: `UPDATE 1`

### C. Pembaruan Tabel `tempat_sampah` (Wadah Pemilahan Bu Sri)
* **Bin Organik**: `BSK-OGN-060926-0472` (`b09c0bf2-f2c1-45d6-8650-2bae1277c6a7`)
  - `id_mahasiswa_pendaftar`: Diubah dari Ernest ke **Javiersa Naufal Algani** (`00d32445-b82a-45b6-a49e-2112a69095fd`)
  - `id_rw`: Diubah dari `76` (RW 15) ke **`75` (RW 14)**
* **Bin Anorganik**: `BSK-AGN-060926-0482` (`be9cbe1d-dee5-41d9-b09f-a816420b6515`)
  - `id_mahasiswa_pendaftar`: Diubah dari Ernest ke **Javiersa Naufal Algani** (`00d32445-b82a-45b6-a49e-2112a69095fd`)
  - `id_rw`: Diubah dari `76` (RW 15) ke **`75` (RW 14)**
* **Status Eksekusi**: `UPDATE 2`

### D. Pencatatan Legal Audit pada `riwayat_serah_terima_kkn`
* **ID Record**: `05fe1258-37d5-42ab-9201-aee418a2dab2`
* **Dari Mahasiswa**: Ernest Tristan Rafael Siringoringo (`b0aa275a-6e0c-4033-9336-90d0b49850e9`)
* **Ke Mahasiswa**: Javiersa Naufal Algani (`00d32445-b82a-45b6-a49e-2112a69095fd`)
* **Wilayah Tugas**: RW 14 Sadang Serang (`id_rw: 75`)
* **Catatan**: *Pengalihan mahasiswa pendamping warga Bu Sri dari Ernest ke Javier & penyesuaian wilayah ke RW 14 KP Cibenying 1*
* **Waktu Transaksi**: `2026-10-08 05:10:22.540 UTC` (12:10:22 WIB)
* **Status Eksekusi**: `INSERT 0 1`

---

## 3. Hasil Verifikasi Live API Backend VPS

Pengujian langsung via runtime Node.js VPS terhadap endpoint `kknService.getWargaDetail` dengan konteks pemanggil mahasiswa **Javiersa Naufal Algani**:

| Parameter / Field | Status Sebelum Perbaikan | Status Sesudah Perbaikan (Live VPS) | Keterangan Verifikasi |
|---|---|---|---|
| **Nama Warga** | BU SRI | **BU SRI** | Sesuai Identitas Asli |
| **No. Telepon** | +62817569058 | **+62817569058** | Valid |
| **Wilayah RW** | RW 15 (id: 76) ❌ | **RW 14 (id: 75)** ✅ | Sinkron KP Cibenying 1 |
| **Kelurahan** | Sadang Serang | **Sadang Serang** | Valid |
| **Alamat Lengkap** | Pasir Kaliki RT 01 RW 15 ❌ | **KP Cibenying 1, RW.14, Sadang Serang** ✅ | Sinkron |
| **Mahasiswa Pendamping** | Ernest Tristan Rafael Siringoringo ❌ | **Javiersa Naufal Algani** ✅ | Berhasil Dialihkan |
| **Diaktivasi Oleh** | Ernest Tristan Rafael Siringoringo ❌ | **Javiersa Naufal Algani** ✅ | Berhasil Dialihkan |
| **ID Mahasiswa Pendamping** | `b0aa275a...` | `00d32445-b82a-45b6-a49e-2112a69095fd` | Terikat Akun Javier |
| **Bin Organik** | `BSK-OGN-060926-0472` | `BSK-OGN-060926-0472` (RW 14) | Aktif & Valid |
| **Bin Anorganik** | `BSK-AGN-060926-0482` | `BSK-AGN-060926-0482` (RW 14) | Aktif & Valid |
| **Total Aktivitas** | 6 Setoran | **6 Setoran** | Utuh & Terjaga |
| **Total Berat** | 4.9 kg | **4.9 kg** | Utuh & Terjaga |
| **Rasio Pemilahan** | 6 (100%) Benar, 0 Salah | **6 (100%) Benar, 0 Salah** | Utuh & Terjaga |

---

## 4. Kesimpulan & Rekomendasi Pengguna

1. **Sinkronisasi Selesai Penuh**: Data warga **BU SRI** saat ini telah 100% dialihkan ke **Javiersa Naufal Algani** dan ditempatkan pada **RW 14 Sadang Serang**.
2. **Integritas Data Utuh**: Riwayat pemilahan (6 setoran sampah dengan total 4.9 kg dan akurasi 100%) tetap utuh tanpa degradasi.
3. **Instruksi Pengguna Mobile**: Pengguna/mahasiswa cukup melakukan **Pull-to-Refresh** atau membuka ulang halaman *Detail Warga* pada aplikasi mobile Berseka untuk memuat data terbaru dari server live VPS.

---
*Dokumen ini diterbitkan secara sah oleh Tim Backend Engineering & Data Governance Berseka sebagai bukti resmi penyesuaian data operasional KKN di server live VPS.*
