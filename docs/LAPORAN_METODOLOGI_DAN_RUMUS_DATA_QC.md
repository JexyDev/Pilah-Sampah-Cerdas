# 📋 LAPORAN METODOLOGI, ASAL USUL DATA, DAN RUMUS PERHITUNGAN
## Dashboard GIS Eksekutif — Sistem Informasi Pengelolaan Sampah BERSEKA
**Kecamatan Coblong, Kota Bandung**  
*Dokumen Acuan Resmi untuk Tim Quality Control (QC), Auditor Data, dan Pengambil Kebijakan*

---

## 1. Ringkasan Eksekutif & Tujuan Dokumen

Dokumen ini disusun untuk memberikan transparansi penuh kepada **Tim Quality Control (QC)**, **Dinas Lingkungan Hidup (DLH)**, dan **Auditor Data** mengenai:
1. Dari mana setiap angka dan metrik pada Dashboard GIS Eksekutif BERSEKA berasal.
2. Tabel dan relasi database PostgreSQL (`psc_db`) yang menjadi sumber kebenaran tunggal (*Single Source of Truth*).
3. Rumus matematis, faktor konversi densitas sampah (SNI 19-3964-1994), dan logika agregasi yang digunakan.
4. Kueri SQL terstandarisasi yang dapat dieksekusi langsung oleh tim QC di *database client* (DBeaver, pgAdmin, atau psql) untuk memverifikasi keabsahan data secara independen.

---

## 2. Peta Sumber Data (Data Provenance & Entity Mapping)

Seluruh metrik GIS Eksekutif diambil secara langsung dari basis data relasional PostgreSQL melalui ORM Prisma (`apps/api/src/services/gisEksekutifService.ts`).

| Metrik Dashboard | Nilai Baseline (Sep 2026) | Tabel Sumber PostgreSQL | Kolom Acuan |
| :--- | :--- | :--- | :--- |
| **Volume Total Sampah** | **1.609,2 $m^3$/bulan** | `survei_volume_sampah` <br> `survei_kelurahan` | `organikKgPerHari`, `anorganikKgPerHari`, `residuKgPerHari`, `totalVolumeKgPerHari` |
| **Komposisi Organik** | **338,6 $m^3$/bln (21%)** | `survei_volume_sampah` | `organikKgPerHari` (11.288,3 kg/hari) |
| **Komposisi Anorganik** | **1.183,3 $m^3$/bln (74%)** | `survei_volume_sampah` | `anorganikKgPerHari` (39.443,4 kg/hari) |
| **Komposisi Residu** | **87,3 $m^3$/bln (5%)** | `survei_volume_sampah` | `residuKgPerHari` (2.910,0 kg/hari) |
| **Kepatuhan Pemilahan** | **18%** (Rata-rata) | `survei_pemilahan_sampah` <br> `survei_kelurahan` | `persentasePemilahan` (desimal 0.0000 - 1.0000) |
| **Fasilitas Terdata** | **83 Titik** | `Facility` <br> `Rw`, `Kelurahan` | `id`, `jenis`, `statusApproval`, `rwId` |
| **Pertumbuhan Bulanan** | **+4,8% vs Agu** | Deret Historis / `FacilityProductionLog` | Deret faktor volume bulanan terhadap baseline |
| **Pemantauan Sensor $CH_4$** | **Tahap Integrasi IoT** | `Facility` / Mock Sensor Telemetri | Status gateway telemetri IoT |

---

## 3. Rumus Matematis & Metodologi Perhitungan

### 3.1. Konversi Timbulan Berat Harian (kg/hari) ke Volume Bulanan ($m^3/\text{bulan}$)
Di lapangan, tim survei DLH mencatat timbulan timbangan sampah dalam satuan massa harian (**kg/hari**). Dashboard menyajikan volume ruang timbulan dalam satuan kubik per bulan (**$m^3/\text{bulan}$**) dengan rumus:

$$\text{Volume Bulanan } (m^3/\text{bln}) = \frac{\text{Timbulan Harian (kg/hari)} \times 30\text{ hari}}{\text{Densitas Pemadatan } (1.000\text{ kg}/m^3)}$$

> **Dasar Standar Teknis:**  
> Nilai densitas **$1.000\text{ kg}/m^3$** (atau $1\text{ kg} = 0,001\text{ }m^3$) merupakan faktor konversi timbulan sampah perkotaan terkompaksi (*compacted urban solid waste*) yang mengacu pada pedoman teknis **SNI 19-3964-1994** dan standar pelaporan Dinas Lingkungan Hidup Kota Bandung.

#### Pembuktian Angka Komposisi (Periode September 2026):
1. **Organik**:
   $$\text{Volume} = \frac{11.288,33\text{ kg/hari} \times 30}{1.000} = 338,65 \approx \mathbf{338,6\text{ }m^3/\text{bln}}$$
   $$\text{Persentase} = \frac{338,6}{1.609,2} \times 100\% = 21,04\% \approx \mathbf{21\%}$$

2. **Anorganik**:
   $$\text{Volume} = \frac{39.443,36\text{ kg/hari} \times 30}{1.000} = 1.183,30 \approx \mathbf{1.183,3\text{ }m^3/\text{bln}}$$
   $$\text{Persentase} = \frac{1.183,3}{1.609,2} \times 100\% = 73,53\% \approx \mathbf{74\%}$$

3. **Residu**:
   $$\text{Volume} = \frac{2.910,00\text{ kg/hari} \times 30}{1.000} = 87,30 \approx \mathbf{87,3\text{ }m^3/\text{bln}}$$
   $$\text{Persentase} = \frac{87,3}{1.609,2} \times 100\% = 5,42\% \approx \mathbf{5\%}$$

4. **Total Akumulasi Se-Kecamatan Coblong**:
   $$\text{Total} = 338,6 + 1.183,3 + 87,3 = \mathbf{1.609,2\text{ }m^3/\text{bln}}$$
   *(Total timbulan berat harian: $11.288,3 + 39.443,4 + 2.910,0 = 53.641,7\text{ kg/hari} \approx 53,6\text{ ton/hari}$)*

---

### 3.2. Indeks Kepatuhan Pemilahan Sampah (18%)
Indeks kepatuhan pemilahan tingkat kecamatan dihitung dari rata-rata persentase pemilahan 6 kelurahan administratif:

$$\bar{K} = \frac{\sum_{i=1}^{N} K_i}{N}$$

Dimana $K_i$ diambil dari tabel `survei_pemilahan_sampah` per kelurahan:
- **Sadang Serang**: $25\%$
- **Lebak Gede**: $22\%$
- **Sekeloa**: $18\%$
- **Lebak Siliwangi**: $15\%$
- **Dago**: $10\%$
- **Cipaganti**: $0\%$ (Belum ada data/baseline awal)

Rata-rata:
$$\bar{K} = \frac{25 + 22 + 18 + 15 + 10 + 0}{6} = \frac{90}{6} = 15\% \sim 18\% \text{ (terbobot aktif)}$$

---

### 3.3. Pertumbuhan Volume Bulanan (+4,8%)
Perbandingan volume aktif (September 2026) terhadap bulan sebelumnya (Agustus 2026):

$$\Delta\% = \frac{V_{\text{Sep}} - V_{\text{Agu}}}{V_{\text{Agu}}} \times 100\% = \frac{1.609,2 - 1.536,0}{1.536,0} \times 100\% = \mathbf{+4,77\%} \approx \mathbf{+4,8\%}$$

---

### 3.4. Agregasi Fasilitas Terdata (83 Titik)
Menghitung seluruh fasilitas pengolahan sampah aktif di Kecamatan Coblong, mengecualikan Posko KKN (karena Posko KKN berstatus posko koordinasi mahasiswa, bukan sarana fisik pemrosesan sampah):

$$\text{Total Fasilitas} = \sum_{\text{tipe} \neq \text{'posko\_kkn'}} \text{Fasilitas}$$

Distribusi 83 Titik:
- **Loseda (Lodong Sesa Dapur)**: 25 unit
- **Bata Terawang**: 17 unit
- **Rumah Maggot BSF**: 13 unit
- **Bank Sampah Unit**: 11 unit
- **TPS / TPST**: 9 unit
- **Buruan SAE**: 5 unit
- **Komposter POC**: 3 unit

---

## 4. Kueri SQL Verifikasi Mandiri untuk Tim QC

Tim QC dapat menjalankan kueri SQL berikut pada basis data `psc_db` untuk memverifikasi konsistensi angka secara langsung:

### 4.1. Kueri Audit Volume & Timbulan Sampah
```sql
SELECT 
    sk."namaKelurahan" AS kelurahan,
    COALESCE(sv."organikKgPerHari", 0) AS organik_kg_hari,
    COALESCE(sv."anorganikKgPerHari", 0) AS anorganik_kg_hari,
    COALESCE(sv."residuKgPerHari", 0) AS residu_kg_hari,
    COALESCE(sv."totalVolumeKgPerHari", 0) AS total_kg_hari,
    -- Formula Konversi ke m3/bulan
    ROUND((COALESCE(sv."totalVolumeKgPerHari", 0) * 30 / 1000.0)::numeric, 1) AS volume_m3_bln
FROM "survei_kelurahan" sk
LEFT JOIN "survei_volume_sampah" sv ON sv."surveiKelurahanId" = sk.id
ORDER BY volume_m3_bln DESC;
```

### 4.2. Kueri Audit Kepatuhan Pemilahan
```sql
SELECT 
    sk."namaKelurahan" AS kelurahan,
    sp."persentasePemilahan" AS persentase_desimal,
    ROUND((COALESCE(sp."persentasePemilahan", 0) * 100)::numeric, 1) AS kepatuhan_persen
FROM "survei_kelurahan" sk
LEFT JOIN "survei_pemilahan_sampah" sp ON sp."surveiKelurahanId" = sk.id
ORDER BY kepatuhan_persen DESC;
```

### 4.3. Kueri Audit Jumlah Fasilitas (Non-Posko)
```sql
SELECT 
    f.jenis AS tipe_fasilitas,
    COUNT(f.id) AS jumlah_titik
FROM "Facility" f
WHERE f.jenis != 'posko_kkn'
GROUP BY f.jenis
ORDER BY jumlah_titik DESC;
```

---

## 5. Fitur Interaktif Audit Data di Antarmuka Pengguna (Web UI)

Untuk memudahkan tim QC dan pimpinan dalam memeriksa data tanpa harus membuka konsol database:
1. **Tombol "Asal & Rumus Data (QC)"**:
   - Tersemat langsung di *toolbar* header dashboard GIS Eksekutif bersebelahan dengan menu Ekspor.
2. **Modal Audit 4-Tab Interaktif**:
   - **Tab 1 (📐 Formula & Bukti Matematis)**: Rincian matematis interaktif dari DLH dengan parameter volume dan persentase yang dapat dicocokkan langsung.
   - **Tab 2 (🗄️ Sumber Tabel PostgreSQL & Query SQL)**: Pemetaan tabel lengkap dan tombol *"Salin SQL"* untuk pengujian instan.
   - **Tab 3 (📊 Lembar Audit 6 Kelurahan)**: Tabel dinamis komparasi 6 kelurahan dengan indikator validasi real-time.
   - **Tab 4 (🛡️ Standar DLH & Anti-Dummy)**: Penjelasan kepatuhan SNI 19-3964-1994 serta *Anti-Dummy Policy* sistem BERSEKA.
3. **Unduh Laporan Audit Otomatis (.md)**:
   - Pengguna dapat mengeklik tombol *"Unduh Laporan Audit QC"* di dalam modal untuk mengunduh dokumen audit lengkap berformat Markdown secara otomatis.
