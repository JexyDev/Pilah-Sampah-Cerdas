# 📝 Pedoman Penulisan Pesan Commit (Commit Message Guidelines)

Kami menerapkan standar yang ketat untuk penulisan pesan commit (*commit message*). Standar ini bertujuan untuk memastikan riwayat proyek **mudah dibaca**, terstruktur secara logis, dan memungkinkan sistem untuk menghasilkan *Changelog* secara otomatis (mengadaptasi standar Angular).

---

## 1. Struktur Dasar Pesan Commit

Setiap pesan commit wajib mengikuti format struktural berikut, yang terdiri dari **Header**, **Body** (Tubuh Pesan), dan **Footer** (Catatan Kaki):

```text
<tipe>(<cakupan>): <subjek>
<BARIS KOSONG>
<body>
<BARIS KOSONG>
<footer>

```

> ⚠️ **ATURAN EMAS:** 
> * **Header bersifat WAJIB**, sedangkan cakupan (*scope*) bersifat opsional.
> * **Batas Karakter:** Setiap baris dalam pesan commit **tidak boleh melebihi 100 karakter**! Hal ini memastikan pesan tidak terpotong dan mudah dibaca di antarmuka GitHub maupun alat *command-line* Git.

---

## 2. Aturan Komponen Commit

### A. Tipe (`<tipe>`)

Tipe harus diisi dengan salah satu kata kunci berikut untuk mendeskripsikan sifat perubahan secara akurat:

| Tipe | Deskripsi |
| --- | --- |
| **`feat`** | Penambahan fitur baru pada sistem. |
| **`fix`** | Perbaikan *bug* atau kesalahan sistem. |
| **`docs`** | Perubahan yang murni hanya pada dokumentasi (mis. `README.md`). |
| **`style`** | Perubahan estetika kode yang tidak memengaruhi logika (*white-space*, pemformatan, menghapus titik koma, dll). |
| **`refactor`** | Restrukturisasi kode sistem yang tidak memperbaiki *bug* maupun menambah fitur. |
| **`perf`** | Perubahan structure kode yang bertujuan untuk meningkatkan performa. |
| **`test`** | Penambahan pengujian yang hilang atau mengoreksi pengujian yang sudah ada. |
| **`build`** | Perubahan yang memengaruhi sistem *build* atau dependensi eksternal (contoh: `gulp`, `npm`, `broccoli`). |
| **`ci`** | Perubahan pada fail konfigurasi dan skrip CI/CD (contoh: `CircleCI`, `GitHub Actions`, `SauceLabs`). |

### B. Cakupan (`<cakupan>`)

Cakupan merujuk pada area, modul, atau nama paket `npm` yang terpengaruh oleh commit tersebut. Contoh cakupan standar: `animations`, `common`, `core`, `forms`, `http`, `router`, dll.

**Pengecualian Aturan Cakupan:**

* **`packaging`**: Digunakan untuk perubahan yang mengubah tata letak paket secara global (misal: modifikasi `package.json` utama).
* **`changelog`**: Khusus untuk pembaruan catatan rilis di `CHANGELOG.md`.
* **`docs-infra`**: Digunakan untuk perubahan infrastruktur dokumentasi.
* **(Kosong)**: Biarkan kosong (tanpa tanda kurung) untuk perubahan global seperti `style`, `test`, atau `refactor` yang memengaruhi banyak tempat sekaligus (contoh: `style: add missing semicolons`).

### C. Subjek (`<subjek>`)

Subjek adalah ringkasan deskriptif dari perubahan. Aturan mutlak penulisannya:

1. Gunakan kalimat **imperatif, *present tense*** (kata kerja perintah). Contoh: gunakan "change" (ubah), BUKAN "changed" (diubah) atau "changes" (perubahan).
2. **Dilarang** menggunakan huruf kapital pada awal kalimat.
3. **Dilarang** mengakhiri subjek dengan tanda titik (`.`).

### D. Body (`<body>`)

Sama seperti pada Subjek, gunakan gaya bahasa imperatif dan *present tense*.

* Body harus memuat **motivasi** mengapa perubahan tersebut dilakukan.
* Jelaskan kontras atau perbandingan antara perilaku sistem sebelumnya dengan perilaku yang baru.

### E. Footer (`<footer>`)

* **Referensi Issue:** Footer adalah tempat untuk merujuk pada tiket atau *issue* di GitHub yang diselesaikan oleh commit ini (contoh: `Closes #123`).
* **Breaking Changes:** Jika commit memuat perubahan yang merusak kompatibilitas versi sebelumnya, **WAJIB** diawali dengan teks `BREAKING CHANGE:` diikuti spasi atau dua baris baru. Sisa pesan kemudian digunakan untuk mendeskripsikan perubahan tersebut secara detail.

---

## 3. Membatalkan Commit (Revert)

Jika commit bertujuan untuk membatalkan (*revert*) commit sebelumnya:

1. Header commit harus diawali dengan teks `revert: ` dan diikuti oleh header commit yang dibatalkan.
2. Di dalam Body, wajib berisi kalimat ini: `This reverts commit <hash>.` (di mana `<hash>` adalah nilai SHA dari commit yang dibatalkan).

---

## 4. Contoh Penulisan Ideal

✅ **Contoh 1: Penambahan fitur tunggal (Ringkas)**

```text
docs(changelog): update changelog to beta.5

```

✅ **Contoh 2: Perbaikan bug dengan Body yang menjelaskan motivasi**

```text
fix(release): need to depend on latest rxjs and zone.js

The version in our package.json gets copied to the one we publish, and users need the latest of these to ensure compatibility.

```

✅ **Contoh 3: Commit dengan Breaking Change dan Penutupan Issue**

```text
refactor(core): overhaul the dependency injection container

Modify the DI container to support hierarchical injectors. 
This improves performance and component scoping.

BREAKING CHANGE: The `Injector.get()` signature has changed. 
You must now pass a token instead of a string.

Closes #234
```

---

# ⚙️ Spesifikasi Fitur & Aturan Pengembangan (Pilah Sampah Cerdas)

Seluruh keputusan arsitektur, batasan fitur, dan logika bisnis berikut bersifat final dan wajib dipatuhi:

## 1. Autentikasi & Autorisasi (RBAC)
- **Login Warga**: Menggunakan **Nomor HP (+62) + OTP via WhatsApp** (WA API disediakan oleh PT Makerindo).
- **Login Role Lain**: Super Admin, Admin DLH, Camat, Lurah, RW, Mahasiswa KKN, dan Petugas Residu menggunakan **Email + Password standar**.
- **Akses Read-Only (Monitoring)**:
  - Role **Admin DLH**, **Camat**, dan **Lurah** dibatasi secara ketat menjadi **Read-Only** (hanya monitoring visual/data-scoping).
  - Terapkan middleware `readOnlyGuard` untuk menolak (403) seluruh operasi tulis (POST, PUT, DELETE) dari ketiga role tersebut, kecuali approval diskrepansi AI khusus Admin DLH.
  - **Data-Scoping Wilayah**: Admin DLH melihat seluruh kota; Camat melihat satu kecamatan; Lurah melihat satu kelurahan.

## 2. State Machine QR Code & Tempat Sampah (Bin)
- **Batasan Jumlah**: Maksimal **2 tempat sampah per rumah tangga**: 1 Organik dan 1 Anorganik. Residu **tidak dibuatkan tempat sampah** tersendiri di rumah warga (residu dipisahkan/ditimbang di hilir oleh Petugas Residu).
- **Alur Aktivasi QR**:
  1. Status Awal: `PRINTED` / `BELUM_DIGUNAKAN`.
  2. Mahasiswa KKN scan pertama kali -> status berubah menjadi `ASSIGNED_TO_PIC` / `DIPEGANG_MAHASISWA` dan merekam koordinat GPS mahasiswa.
  3. Mahasiswa membantu pendaftaran warga -> koordinat GPS gawai perekam wajib dikirim (via sensor GPS mobile) dan direkam permanen -> status bin berubah menjadi `PENDING_APPROVAL`.
  4. RW menyetujui -> status berubah menjadi `ACTIVE_BOUND`. Poin bonus ditambahkan secara atomik (+10 Warga, +10 Mahasiswa).
- **Kapasitas Tong**: Ditentukan saat registrasi melalui 3 opsi:
  a) Nilai default standar pemerintah (dari `system_configs`).
  b) Estimasi mandiri melalui foto AI.
  c) Input dimensi manual (tinggi, lebar, bentuk, kapasitas liter).
- **Masa Aktif & Aturan Reset**:
  - Tempat sampah aktif selama **30 hari**. Masa aktif di-reset otomatis setiap kali warga mengunggah foto setoran sampah + memindai QR + disetujui pengambilan.
  - Jika 30 hari tanpa aktivitas -> status diubah menjadi **TIDAK AKTIF**. Hanya **Super Admin** yang berhak mengaktifkan kembali (RW hanya bisa memonitor tanpa tombol aksi).
  - **Tempat Sampah Rusak**: RW dapat menandai bin sebagai `BROKEN` -> QR menjadi tidak aktif secara permanen.

## 3. Jam Operasional, Penjemputan, & Timbangan
- **Window Waktu**: Cek & angkut dilakukan pukul **06:00-08:00** dan **16:00-18:00**.
- **Notifikasi Tong Penuh**: Warga harus mengunggah foto bukti tempat sampah penuh -> memicu notifikasi push ke Petugas & RW dan memberi marker merah di peta.
- **Eskalasi Otomatis**: Jika petugas tidak mendokumentasikan pengambilan dalam window waktu, notifikasi eskalasi otomatis dikirim secara hierarkis (RW -> Lurah -> Camat -> Admin DLH).
- **Timbangan Aktual**: Hasil timbangan diinput **secara manual** oleh Petugas Residu dari hasil timbangan industri fisik (bukan IoT/sensor otomatis).

## 4. Analitik & Formula Kepatuhan
- **Skor Kepatuhan Warga**: `Compliance_Score = (0.5 * OnTimeSubmissionRate) + (0.5 * AI_Confidence_Rate rata-rata)`.
- **Skor Keandalan (Reliability)**: Metrik terpisah untuk mengukur konsistensi & rutinitas pembuangan warga.
- **Agregasi Wilayah**: Menggunakan nilai **MEDIAN**, bukan rata-rata biasa, untuk menahan distorsi outlier.
- **Rule of Discrepancy**: AI confidence >90% menjadi acuan. Jika input manual petugas berbeda dari klasifikasi AI (>90% confidence), tandai status setoran sebagai `PENDING_REVIEW` untuk dievaluasi oleh Admin DLH.
- **KPI Petugas**: `KPI_Petugas = (0.6 * Ketepatan_Waktu_Lapor) + (0.4 * Akurasi_vs_AI)`.

## 5. Gamifikasi & Poin (Ledger Terpisah)
- **Skema Gamifikasi**:
  - Warga: Organik (+2/kg), Non-Organik (+1.5/kg), Residu-campuran jika terdeteksi (-1/kg).
  - Mahasiswa: Assist registrasi (+10/aktivasi) + keaktifan pendampingan.
  - Petugas Residu: Berdasarkan pencapaian skor KPI.
  - Poin saat ini murni gamifikasi (belum dapat ditukar), namun skema data wajib mendukung field placeholder seperti `redeemable: false` untuk masa depan.
- **Ide Daur Ulang**: Pengajuan ide daur ulang oleh warga -> disetujui RW -> reward +50 poin dan dipublikasikan ke Social Feed.

## 6. Fasilitas GIS & Peta
- **Fasilitas**: Meliputi Bata Terawang (rongga sirkulasi udara), Loseda (pipa kompos dapur), Rumah Maggot, Bank Sampah, dan budidaya ternak (lele/ayam/unggas). RW/Mahasiswa bisa bantu input data berkala secara manual (laporan material masuk & panen mingguan).
- **Peta Legenda**: Hijau (Organik/Kompos), Biru (Daur Ulang), Merah (Residu/TPA), Emas (Flash Drop Challenge).
