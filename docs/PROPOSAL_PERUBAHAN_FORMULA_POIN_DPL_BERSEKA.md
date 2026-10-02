# 📑 MEMORANDUM & PROPOSAL EKSEKUTIF
## Usulan Penyesuaian Formula Poin DPL Berbasis Aktivitas Lapangan
**Nomor Dokumen:** MEMO-DPL-04/X/2026  
**Tanggal:** 2 Oktober 2026  
**Ditujukan Kepada:** Pimpinan / Kepala LPPM / Koordinator KKN Berseka 2026  
**Diajukan Oleh:** Tim Pengembang Berseka (Fullstack Engineering Team)  
**Status:** Siap Ditinjau & Disahkan  

---

### 1. Ringkasan Eksekutif (Untuk Pimpinan & Atasan)

Dokumen ini memuat usulan penyempurnaan sistem perhitungan Poin DPL (Dosen Pembimbing Lapangan) pada Platform KKN Tematik Berseka 2026. 

Penyempurnaan ini bertujuan memberikan **apresiasi berbobot dan adil** bagi dosen yang aktif turun langsung ke lapangan mendampingi kelompok mahasiswa di kelurahan/RW, sekaligus membedakannya dari kegiatan koordinasi/pembimbingan di lingkungan kampus.

#### Pilar Utama Usulan:
* **Prinsip Proporsi 50% : 50% Tetap Dipertahankan:**
  * **50%** Poin Aktivitas Supervisi DPL
  * **50%** Poin Kinerja Kelompok Mahasiswa
* **Kegiatan Turun Langsung ke Lapangan:** Diberi bobot **5 Poin / Kegiatan** (contoh: kunjungan posko, monitoring pilah sampah RW, evaluasi bersama kelurahan/tokoh warga).
* **Kegiatan Pembimbingan / Koordinasi Kampus:** Diberi bobot **2 Poin / Kegiatan** (contoh: bimbingan di ruang dosen, konsultasi daring via Zoom, evaluasi laporan di kampus).

---

### 2. Latar Belakang & Perbandingan Sistem

| Karakteristik | Kondisi Sistem Saat Ini (Baseline) | Kondisi yang Diusulkan (Solusi Baru) |
| :--- | :--- | :--- |
| **Perhitungan Logbook DPL** | Bersifat **biner / flat 6 poin** jika DPL mengisi minimal 1 lembar logbook, tidak membedakan intensitas kunjungan. | **Akumulatif Berbobot**: Dihitung per kehadiran nyata (**5 poin** Lapangan & **2 poin** Kampus). |
| **Diferensiasi Keterlibatan** | DPL yang datang ke lapangan 8 kali mendapatkan nilai sama (6 poin) dengan DPL yang hanya datang 1 kali. | DPL yang sering terjun langsung mendapatkan apresiasi poin yang jauh lebih tinggi dan transparan. |
| **Kinerja Kelompok** | 50% dari Poin Kelompok (bobot 60% Proker + 40% Rata-rata Mahasiswa). | **Tetap 50%** dari Poin Kelompok (formula kelompok stabil dan nol risiko). |
| **Kesiapan Antarmuka** | Dropdown kategori logbook sudah tersedia di web. | Langsung dipetakan di backend secara otomatis tanpa mengubah antarmuka DPL. |

---

### 3. Formula Perhitungan & Aturan Klasifikasi Kategori

#### A. Rumus Matematis:
$$\text{Poin Aktivitas DPL} = \sum (\text{Jumlah Giat Lapangan} \times 5) + \sum (\text{Jumlah Giat Kampus} \times 2)$$
$$\text{Total Poin DPL} = (\text{Poin Aktivitas DPL} \times 50\%) + (\text{Poin Kelompok} \times 50\%)$$

#### B. Pemetaan Kategori Logbook:
| Kategori di Sistem Web | Klasifikasi | Poin Default | Contoh Lokasi & Keterangan |
| :--- | :---: | :---: | :--- |
| `Kunjungan Lapangan` | 🏕️ **Lapangan** | **5 Pts** | Posko KKN, Balai Kelurahan, TPS3R, RW dampingan |
| `Monitoring Lapangan` | 🏕️ **Lapangan** | **5 Pts** | Edukasi warga door-to-door, inspeksi pemilahan sampah |
| `Evaluasi Lapangan` | 🏕️ **Lapangan** | **5 Pts** | Rapat koordinasi dengan pengurus RW / lurah setempat |
| `Koordinasi` | 🏛️ **Kampus / Daring** | **2 Pts** | Pertemuan di kampus UNIKOM, koordinasi via Zoom |
| `Pembimbingan` | 🏛️ **Kampus / Daring** | **2 Pts** | Koreksi laporan akhir, review program kerja di kampus |

---

### 4. Simulasi Kasus Riil (Dr. Agus Mulyana - Kelompok 1 Sadang Serang)

Berdasarkan data historis riil pada database VPS, Dr. Agus Mulyana memiliki 8 catatan supervisi dan Poin Kelompok **90.43 pts**:

| No | Tanggal | Kategori | Lokasi / Uraian | Poin Baru |
| :---: | :---: | :--- | :--- | :---: |
| 1 | 12 Agu 2026 | Koordinasi | UNIKOM: Sosialisasi sistem aplikasi | 2 pts (Kampus) |
| 2 | 14 Agu 2026 | Kunjungan Lapangan | Balai Kelurahan Sadang Serang & PKBS | 5 pts (Lapangan) |
| 3 | 15 Agu 2026 | Koordinasi | Kafe Jl. Supratman: Evaluasi kunjungan | 2 pts (Kampus) |
| 4 | 31 Agu 2026 | Koordinasi | UNIKOM: Persiapan penerapan mobile | 2 pts (Kampus) |
| 5 | 01 Sep 2026 | Pembimbingan | Kampus UNIKOM: Menjawab kendala teknis | 2 pts (Kampus) |
| 6 | 03 Sep 2026 | Kunjungan Lapangan | RW 21 Sadang Serang: Evaluasi posko | 5 pts (Lapangan) |
| 7 | 09 Sep 2026 | Koordinasi | Aula Miracle UNIKOM: BIMTEK Ke-2 | 2 pts (Kampus) |
| 8 | 11 Sep 2026 | Monitoring Lapangan | RW Dampingan: Edukasi pilah sampah | 5 pts (Lapangan) |
| **Total**| **8 Logbook** | **3 Lapangan (15 pts) + 5 Kampus (10 pts)** | **25.00 Poin** |

#### Komparasi Skor Akhir Poin DPL:
1. **Sistem Saat Ini (Flat 6)**: $(6 \times 0.5) + (90.43 \times 0.5) = 3.00 + 45.22 = \mathbf{48.22\text{ pts}}$
2. **Hitungan Manual Tim QC**: $(8 \times 0.5) + (90.43 \times 0.5) = 4.00 + 45.22 = \mathbf{49.22\text{ pts}}$
3. **USULAN BARU (5 Pts Lapangan & 2 Pts Kampus)**:
   $$(25 \times 0.5) + (90.43 \times 0.5) = 12.50 + 45.215 = \mathbf{57.72\text{ pts}}$$

> **Nilai Tambah:** Terlihat kenaikan yang wajar dari 48.22 menjadi 57.72 pts yang mencerminkan dedikasi 3 kali kunjungan lapangan dan 5 kali pembimbingan intensif.

---

### 5. Jaminan Keamanan Sistem & Mitigasi Risiko

1. **Integritas Basis Data VPS Terjaga Penuh (Zero DB Risk):**
   * Penyesuaian murni berada pada kalkulasi fungsi backend `calculateDplPoints` di `dplService.ts`.
   * Tidak ada kolom baru yang wajib ditambahkan ke database produksi dan tidak ada risiko data hilang.
2. **Nol Regresi Fitur Akademik (100% Green Unit Test):**
   * Seluruh 30 unit test DPL (hak mutasi, scoping kelompok bimbingan, formula batas lulus 65) tetap lulus tanpa gangguan.
3. **Pemberlakuan Batas Wajar (*Weekly Capping*):**
   * Disarankan plafon maksimum 7 poin per pekan (setara 1 kunjungan lapangan + 1 koordinasi) agar mencegah manipulasi pengisian logbook berlebihan.

---

### 6. Lembar Pengesahan

| Diajukan Oleh: | Disetujui Oleh: |
| :--- | :--- |
| **Tim Pengembang Berseka**<br/>PT Makerindo Prima Solusindo<br/><br/>Tanggal: 2 Oktober 2026 | **Pimpinan Proyek / Kepala LPPM**<br/>KKN Tematik Berseka 2026<br/><br/>Keputusan: [ &nbsp; ] **DISETUJUI** &nbsp;&nbsp;&nbsp; [ &nbsp; ] **REVISI** |
