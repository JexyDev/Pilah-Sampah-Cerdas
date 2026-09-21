# 📱 PANDUAN TEKNIS IMPLEMENTASI, RUMUS PENILAIAN, & PERBAIKAN INTEGRASI MOBILE DEVELOPER (FLUTTER)
**Tanggal Rilis:** 17 September 2026  
**Penyusun:** Fullstack Developer (Backend & Web Lead)  
**Target Pembaca:** Tim Pengembang Mobile (Flutter Developer)  
**Status Backend:** ✅ **LIVE DI VPS PRODUKSI (`157.10.252.252`) & TERSTANDARISASI DI REPO `main`**

---

## 📌 DAFTAR ISI
1. [Ringkasan Eksekutif & Pembaruan Task Hari Ini](#1-ringkasan-eksekutif--pembaruan-task-hari-ini)
2. [Spesifikasi Lengkap Rumus Penilaian untuk Tampilan Mobile](#2-spesifikasi-lengkap-rumus-penilaian-untuk-tampilan-mobile)
   - 2.1. Formula Poin Mahasiswa KKN (Harian & Batas Maksimal)
   - 2.2. Formula Poin Program Kerja (Shared Kelompok)
   - 2.3. Formula Skor Terbobot Kelompok KKN (Bobot 60% : 40%)
   - 2.4. Formula Poin Warga (Setor Sampah & AI Vision)
   - 2.5. Formula Poin Petugas Residu (Timbangan & Rute)
   - 2.6. Formula Penilaian Akademik KKN (Mitra 50% + DPL 50%)
3. [Koreksi Bug Backend: Poin Proker Dashboard KKN (`prokerPoints`)](#3-koreksi-bug-backend-poin-proker-dashboard-kkn-prokerpoints)
4. [Panduan Perbaikan 4 Anomali Kritis pada Kode Flutter](#4-panduan-perbaikan-4-anomali-kritis-pada-kode-flutter)
   - 4.1. Anomali 1: Pemotongan Desimal Skor Kelompok (`.toInt()`)
   - 4.2. Anomali 2: Label UI Menyesatkan & Pemisahan Dua Metrik Poin
   - 4.3. Anomali 3: Parameter Kelurahan Salah Kirim (Alamat Posko)
   - 4.4. Anomali 4: Unbounded Fallback Mengunduh Warga Se-Kota
5. [Kontrak Payload API Resmi Backend untuk Konsumsi Mobile](#5-kontrak-payload-api-resmi-backend-untuk-konsumsi-mobile)
   - 5.1. `GET /api/v1/kkn/dashboard`
   - 5.2. `GET /api/v1/kkn/kelompok-saya`
   - 5.3. `POST /api/v1/auth/switch-role`
   - 5.4. `GET /api/v1/gamification/leaderboard` (Kategori Petugas)
6. [Checklist Mandiri Mobile Developer Sebelum Serah Terima QC](#6-checklist-mandiri-mobile-developer-sebelum-serah-terima-qc)

---

## 1. Ringkasan Eksekutif & Pembaruan Task Hari Ini

Hari ini (17 September 2026), Tim Backend telah menuntaskan seluruh agenda rapat notulensi dan sinkronisasi data yang langsung berdampak pada aplikasi mobile:
1. **Poin Proker Dashboard Mahasiswa:** Nilai `prokerPoints` pada dashboard KKN kini resmi menjadi **Shared Group Points** yang bersumber langsung dari progres program kerja kelompok, tidak lagi terisolasi di riwayat perorangan (tidak lagi mentok di 6 PTS).
2. **Multi-Role Switcher:** Tersedia endpoint `POST /api/v1/auth/switch-role` yang memungkinkan akun dosen/pembimbing beralih peran instan tanpa logout.
3. **Penamaan Petugas Residu:** Data leaderboard petugas mobile kini menyajikan `namaDisplay` (nama representatif daerah) dan nama kelurahan binaan.
4. **Audit Forensik Mobile:** Ditemukan 4 anomali di codebase Flutter yang memerlukan perbaikan segera sebelum pengujian tim QC.

---

## 2. Spesifikasi Lengkap Rumus Penilaian untuk Tampilan Mobile

Mobile Developer wajib memahami logika matematis berikut agar label, tooltip, dan kalkulasi di UI Flutter tidak menyesatkan pengguna:

### 2.1. Formula Poin Mahasiswa KKN (Presensi Harian)
Mahasiswa mendapatkan poin keaktifan harian individu dengan batas maksimal (*anti-overawarding*) **10 Poin per hari**:

$$\text{Poin Harian Mahasiswa} = \text{Poin Datang (4)} + \text{Poin Jam Kerja (3)} + \text{Poin Logbook (3)}$$

* **Poin Datang (+4 PTS):** Melakukan presensi masuk tepat waktu di radius GPS $\le 100\text{ meter}$ dari titik posko resmi.
* **Poin Jam Kerja (+3 PTS):** Melakukan checkout dan menuntaskan durasi minimal aktivitas lapangan ($\ge 4\text{ jam}$).
* **Poin Logbook (+3 PTS):** Mengunggah laporan logbook harian sebelum batas pergantian hari.

---

### 2.2. Formula Poin Program Kerja (Shared Kelompok)
Setiap 1 Program Kerja memiliki siklus hidup 3 tahapan (*3-step lifecycle*). **Setiap penambahan poin otomatis berlaku serentak untuk seluruh mahasiswa di kelompok tersebut**:

| Tahapan Proker | Status Sistem | Tambahan Poin | Total Akumulasi |
| :--- | :--- | :---: | :---: |
| **Tahap 1: Usulan Disetujui** | Disetujui oleh DPL di sistem | **+2 PTS** | 2 PTS |
| **Tahap 2: Sedang Berjalan** | Mahasiswa memulai pengerjaan proker | **+2 PTS** | 4 PTS |
| **Tahap 3: Tuntas Selesai** | Mahasiswa menuntaskan dan upload bukti | **+2 PTS** | 6 PTS |

> [!IMPORTANT]
> Jika satu kelompok memiliki 3 proker yang tuntas selesai, total poin proker kelompok adalah $3 \times 6 = 18\text{ PTS}$. Seluruh anggota kelompok akan melihat angka **18 PTS** pada kartu poin proker masing-masing.

---

### 2.3. Formula Skor Terbobot Kelompok KKN (Bobot 60% : 40%)
Skor kelompok **BUKAN penjumlahan poin individu anggota**, melainkan **Skor Evaluasi Terbobot**:

$$\text{Poin Kelompok} = (\text{Poin Proker Kelompok} \times 0.6) + (\text{Rata-rata Poin Anggota} \times 0.4)$$

* **Poin Proker Kelompok:** Akumulasi nilai dari seluruh proker aktif dan selesai.
* **Rata-rata Poin Anggota:** $\frac{\sum \text{Poin Individu Seluruh Anggota}}{\text{Jumlah Anggota Kelompok}}$
* **Output Nilai:** Menghasilkan bilangan desimal pecahan (contoh: `11.6`, `14.8`).

---

### 2.4. Formula Poin Warga (Setor Sampah & AI Vision)
Poin warga diperoleh saat menyetor sampah di Tempat Sampah Cerdas terdaftar:

$$\text{Poin Warga} = \text{Volume (Liter)} \times 100 \times \text{Pengali Waktu} \times \text{Akurasi AI}$$

* **Pengali Waktu:**
  - Jam Misi (06.00–08.00 WIB & 16.00–18.00 WIB) $\rightarrow$ Pengali = **1.0** (100% Poin)
  - Di Luar Jam Misi $\rightarrow$ Pengali = **0.3** (Diskon keterlambatan 70%)
* **Akurasi AI:** Desimal kepercayaan model computer vision (`0.0` sampai `1.0`).
* **Nilai Tukar Uang:** $\text{Rupiah} = \text{Poin} \times \text{Rp } 100$ *(Contoh: 190 PTS = Rp 19.000)*.

---

### 2.5. Formula Poin Petugas Residu (Timbangan & Rute)
Petugas dinilai berdasarkan verifikasi fisik di lapangan:

$$\text{Poin Input Timbangan} = (\text{Berat Sampah Kg} \times 2) + \text{Bonus Foto Valid (10 PTS)}$$
$$\text{Total Poin Harian} = \sum \text{Poin Input} + \text{Bonus Tuntas Rute (50 PTS)}$$

---

### 2.6. Formula Penilaian Akademik KKN (Mitra 50% + DPL 50%)
Penilaian akhir kelulusan mahasiswa KKN merupakan gabungan dua evaluator:

$$\text{Nilai Akhir} = (\text{Subtotal Mitra Lapangan} \times 0.5) + (\text{Subtotal DPL} \times 0.5)$$

* **8 Aspek Mitra Lapangan (MPL / RW):** Kehadiran (15%), Warga Binaan (15%), Proker (15%), Komunikasi (10%), Disiplin (10%), Bukti (10%), Dampak Lingkungan (15%), Inisiatif (10%).
* **6 Aspek Dosen (DPL):** Perencanaan (20%), Kontribusi Individu (10%), Logbook Harian (20% - target 24 logbook), Analisis Masalah (20%), Luaran Program (20%), Laporan Akhir (10%).

---

## 3. Koreksi Bug Backend: Poin Proker Dashboard KKN (`prokerPoints`)

### 🔍 Masalah yang Terjadi Sebelumnya:
Pada endpoint `GET /api/kkn/dashboard`, nilai `prokerPoints` sebelumnya ditarik dari tabel `PointHistory` individu mahasiswa. Dampaknya:
1. Anggota kelompok yang tidak menekan tombol submit proker mendapatkan nilai `0 PTS`.
2. Mahasiswa yang submit hanya tercatat maksimal 1 proker (`6 PTS`).
3. Payload kontradiktif: `stats.prokerPoints: 6`, tetapi `stats.poinProker: 12`.

### ✅ Solusi Backend yang Telah Live di VPS:
Backend kini mengkalkulasi poin proker secara kolektif (*shared*) langsung dari tabel `ProgramKerjaKkn`. Nilai `prokerPoints` dan `poinProker` kini dijamin sinkron dan identik.

**Bukti Uji Live di VPS Produksi (`157.10.252.252`):**
```json
{
  "nim": "52023002",
  "kelompok": "Kelompok 2 Lebak Siliwangi",
  "prokerPoints": 12,
  "stats": {
    "prokerPoints": 12,
    "poinProker": 12,
    "totalGroupPoints": 11.6
  }
}
```

---

## 4. Panduan Perbaikan 4 Anomali Kritis pada Kode Flutter

Tim Mobile Developer wajib menerapkan 4 penyesuaian kode berikut:

---

### 4.1. Anomali 1: Pemotongan Desimal Skor Kelompok (`.toInt()`)

* **Lokasi File:** [`lib/app/data/models/mahasiswa_kkn_models.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/data/models/mahasiswa_kkn_models.dart) (Baris 936, 1073)
* **Penyebab:** Casting `.toInt()` membuang angka desimal hasil perhitungan komposit 60% : 40% (nilai `11.8` terpotong menjadi `11`).

```dart
// ❌ KODE LAMA (BERMASALAH):
final int totalGroupPoints;
...
totalGroupPoints: (json['totalGroupPoints'] as num?)?.toInt() ?? 0,

// ✅ KODE BARU (PERBAIKAN RESMI):
final double totalGroupPoints;
...
totalGroupPoints: (json['totalGroupPoints'] as num?)?.toDouble() ??
                  (json['poinKelompok'] as num?)?.toDouble() ??
                  0.0,
```

---

### 4.2. Anomali 2: Label UI Menyesatkan & Pemisahan Dua Metrik Poin

* **Lokasi File:**
  - [`lib/app/data/models/mahasiswa_kkn_models.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/data/models/mahasiswa_kkn_models.dart)
  - [`lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart)
* **Penyebab:** UI menuliskan *"Penjumlahan poin individu 12 anggota kelompok"*, tetapi menampilkan angka **11.8 Poin** (yang merupakan Skor Terbobot Kelompok, bukan penjumlahan poin).
* **Solusi Perbaikan:**
  1. Tambahkan getter total akumulasi anggota di `KelompokKknData`:
     ```dart
     int get cumulativeMemberPoints {
       return members.fold(0, (sum, m) => sum + m.individualPoints);
     }
     ```
  2. Di tampilan UI, pisahkan menjadi **2 Kartu Metrik Berdampingan**:

```dart
// KARTU 1: SKOR TERBOBOT KELOMPOK
_buildMetricCard(
  title: 'Skor Kinerja Kelompok',
  value: '${kelompokData.totalGroupPoints.toStringAsFixed(1)} Poin',
  subtitle: 'Formula: 60% Proker + 40% Rerata Anggota',
  icon: Icons.analytics_outlined,
);

// KARTU 2: TOTAL AKUMULASI POIN TIM
_buildMetricCard(
  title: 'Total Akumulasi Tim',
  value: '${kelompokData.cumulativeMemberPoints} PTS',
  subtitle: 'Total gabungan seluruh poin individu anggota',
  icon: Icons.groups_outlined,
);
```

---

### 4.3. Anomali 3: Parameter Kelurahan Salah Kirim (Alamat Posko)

* **Lokasi File:** [`lib/app/modules/mahasiswa/views/monitoring_warga_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/views/monitoring_warga_view.dart)
* **Penyebab:** Nilai `poskoLocation` (yang berisi string panjang *"Posko KKN RW 21, Sadang Serang"*) dikirim ke param `kelurahan`. Backend mencari kelurahan dengan nama tersebut dan menghasilkan 0 warga dampingan.

```dart
// ❌ KODE LAMA (BERMASALAH):
if (kelurahan.isEmpty && kelompok != null) {
  final loc = kelompok.poskoLocation;
  if (loc.isNotEmpty && loc != '-') {
    kelurahan = loc; // Salah! Berisi alamat lengkap posko
  }
}

// ✅ KODE BARU (PERBAIKAN RESMI):
// Pastikan KelompokKknData memiliki field: final String? kelurahan;
if (kelurahan.isEmpty && kelompok != null) {
  final kel = kelompok.kelurahan;
  if (kel != null && kel.isNotEmpty && kel != '-') {
    kelurahan = kel; // Benar! Berisi "Sadang Serang"
  }
}
```

---

### 4.4. Anomali 4: Unbounded Fallback Mengunduh Warga Se-Kota

* **Lokasi File:** [`lib/app/modules/mahasiswa/controllers/aktivasi_warga_controller.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/controllers/aktivasi_warga_controller.dart)
* **Penyebab:** Saat kueri wilayah menghasilkan data kosong, controller melakukan fallback memanggil `getWargaForAktivasi()` tanpa parameter wilayah. Ribuan data warga se-kota terunduh ke RAM smartphone, memicu lonjakan kuota dan crash memori.

```dart
// ❌ KODE LAMA (BERBAHAYA):
if (data.isEmpty && (kelurahan.isNotEmpty || rw.isNotEmpty)) {
  // Mengunduh seluruh warga se-Bandung tanpa filter wilayah!
  final allRaw = await repo.getWargaForAktivasi(search: search.isEmpty ? null : search);
}

// ✅ KODE BARU (PERBAIKAN RESMI):
// HAPUS blok fallback di atas. Tampilkan Empty State resmi jika data kosong:
if (data.isEmpty) {
  return EmptyStateWidget(
    title: 'Belum Ada Warga Terdaftar',
    message: 'Tidak ditemukan warga dampingan di wilayah binaan kelompok Anda.',
  );
}
```

---

## 5. Kontrak Payload API Resmi Backend untuk Konsumsi Mobile

### 5.1. Dashboard Mahasiswa KKN
* **Endpoint:** `GET /api/v1/kkn/dashboard` (dan alias `/api/kkn/dashboard`)
* **Header:** `Authorization: Bearer <JWT_MAHASISWA>`

```json
{
  "success": true,
  "data": {
    "personalPoints": 122,
    "prokerPoints": 12,
    "contributionPoints": 122,
    "totalGroupPoints": 11.6,
    "poinKelompok": 11.6,
    "poinProker": 12,
    "rataRataPoinAnggota": 11,
    "totalRegisteredBins": 15,
    "remainingQuota": 85,
    "progressPct": 15.0,
    "stats": {
      "personalPoints": 122,
      "prokerPoints": 12,
      "poinProker": 12,
      "totalGroupPoints": 11.6,
      "poinKelompok": 11.6,
      "rataRataPoinAnggota": 11,
      "totalCumulativeMemberPoints": 132
    },
    "studentKkn": {
      "nim": "52023002",
      "jurusan": "Teknik Informatika",
      "fakultas": "FTIK",
      "assignedArea": "RW 02 Lebak Siliwangi"
    }
  }
}
```

---

### 5.2. Detail Kelompok KKN Saya
* **Endpoint:** `GET /api/v1/kkn/kelompok-saya`
* **Header:** `Authorization: Bearer <JWT_MAHASISWA>`

```json
{
  "status": "success",
  "data": {
    "groupId": "clx_kelompok_02",
    "name": "Kelompok 2 Lebak Siliwangi",
    "kelurahan": "Lebak Siliwangi",
    "cakupanRw": ["01", "02", "03"],
    "latitude": -6.8872,
    "longitude": 107.6105,
    "radiusMeter": 100,
    "totalGroupPoints": 11.6,
    "members": [
      {
        "id": "usr_01",
        "name": "Daffa Mahasiswa",
        "nim": "52023002",
        "individualPoints": 122,
        "role": "KETUA"
      }
    ]
  }
}
```

---

### 5.3. Beralih Peran (Active Role Switcher)
* **Endpoint:** `POST /api/v1/auth/switch-role`
* **Header:** `Authorization: Bearer <ACCESS_TOKEN>`
* **Request Body:**
  ```json
  {
    "role": "MPL"
  }
  ```
* **Response:**
  ```json
  {
    "success": true,
    "message": "Berhasil beralih ke peran MPL",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "currentRole": "MPL",
      "user": {
        "id": "usr_123",
        "name": "Dr. Pembimbing",
        "role": "MPL"
      }
    }
  }
  ```

---

### 5.4. Leaderboard Petugas Residu
* **Endpoint:** `GET /api/v1/gamification/leaderboard?type=petugas`
* **Catatan Mobile:** Gunakan field `name` atau `namaDisplay` untuk teks utama dan `kelurahan` untuk subtitle daerah.

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "namaDisplay": "Petugas Kelurahan Dago 01",
      "name": "Petugas Kelurahan Dago 01",
      "kelurahan": "Dago",
      "points": 450,
      "totalKg": 180.5
    }
  ]
}
```

---

## 6. Checklist Mandiri Mobile Developer Sebelum Serah Terima QC

Pastikan checklist berikut telah diverifikasi sebelum merilis build ke tim QC:

- [ ] Model `KelompokKknData` menggunakan `double` untuk `totalGroupPoints` (`toDouble()`).
- [ ] Tampilan halaman kelompok memisahkan antara kartu **Skor Kinerja Kelompok (Desimal)** dan kartu **Total Akumulasi Tim (Integer)**.
- [ ] Nilai `prokerPoints` pada dashboard mahasiswa menampilkan angka akumulasi seluruh proker kelompok (bukan angka 6 PTS).
- [ ] Monitoring warga menggunakan parameter `kelompok.kelurahan`, bukan string alamat posko.
- [ ] Pengambilan data aktivasi warga tidak lagi mengunduh data se-kota saat wilayah kosong (menampilkan empty-state yang sesuai).
- [ ] Token baru hasil `switch-role` langsung disimpan ke local storage / secure storage HP dan state manajemen (GetX / Riverpod / Bloc) diperbarui tanpa restart aplikasi.
