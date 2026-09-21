# 📑 LAPORAN RESMI EVALUASI & TINDAK LANJUT LOGIKA POIN KKN
**Kepada:** Tim Mobile Developer BERSEKA  
**Dari:** Backend Master / Fullstack Engineering  
**Tanggal:** 17 September 2026  
**Status Rilis:** ✅ **MERGED TO `main`** (`origin/main`) & **LIVE DEPLOYED DI VPS** (`157.10.252.252`)  

---

## 🎯 Ringkasan Eksekutif

Menindaklanjuti laporan evaluasi pengujian dari Tim Mobile terkait ketidaksesuaian angka kalkulasi poin pada UI aplikasi, Tim Backend telah melakukan audit menyeluruh, penyesuaian query agregasi, pengujian unit test, serta verifikasi live langsung pada server produksi VPS.

Berikut adalah rekapitulasi status untuk ketiga isu yang dilaporkan:

| No | Isu Temuan Mobile | Nilai Sebelumnya | Nilai Valid / Ekspektasi | Status Backend | Tindak Lanjut & Keterangan |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | Poin Personal di Card Dasbor | 30 Pts | 79 Pts (Total Saldo) | **CONFIRMED (BY DESIGN)** | `personalPoints` memang dirancang murni untuk kinerja harian. Disediakan field `contributionPoints` jika ingin saldo total. |
| **2** | Total Akumulasi Tim di Halaman Kelompok | 57 Pts | 57 Pts (Murni Anggota) | **RESOLVED & APPROVED** | Sesuai formula anti-rekursif Master Blueprint V2. Label UI mobile sudah disesuaikan. |
| **3** | 🚨 Kebocoran Poin Proker ke Saldo Anggota | 93 Pts | **79 Pts** | **FIXED & LIVE DI VPS** | Filter `kategori: { notIn: ["KKN_PROKER"] }` telah aktif di `main` dan live di VPS. Saldo Habik kini tepat 79 Pts. |

---

## 🔍 Pembahasan Detail & Tanggapan Teknis

### 1. Isu "Poin Personal" di Card Dashboard (Tampil 30 Pts vs 79 Pts)

* **Status:** **BENAR & DISENGAJAI (BY DESIGN)**
* **Penjelasan Logika Bisnis:**
  Field `personalPoints` pada respons `GET /api/v1/kkn/dashboard` sengaja dikhususkan untuk mengukur **Poin Kinerja Lapangan Harian Murni** mahasiswa:
  $$\text{personalPoints} = (\text{Presensi Hadir} + \text{Pemenuhan Jam Kerja} + \text{Logbook Harian}) - \text{Denda Penalti}$$
  Tujuannya adalah agar mahasiswa dan Dosen Pembimbing Lapangan (DPL) dapat memantau kedisiplinan dan aktivitas harian secara objektif tanpa terdistorsi oleh bonus satu kali (*one-time login bonus*) maupun bonus normalisasi kelompok.
* **Panduan Penggunaan Field untuk Tim Mobile:**
  Backend telah menyediakan payload terpisah baik di root maupun di dalam objek `stats`:
  - Gunakan `personalPoints`: Jika Card ditujukan untuk menampilkan **Kinerja/Aktivitas Harian Mahasiswa**.
  - Gunakan `contributionPoints` (atau alias `points` / `totalPoints`): Jika Card ditujukan untuk menampilkan **Saldo Akhir Kumulatif / Dompet Poin Akun** (sudah mencakup Bonus Login +20 dan Normalisasi Tim +49).
* **Kesimpulan:** Langkah Tim Mobile untuk mengedukasi mahasiswa bahwa Card "Poin Personal" mencerminkan poin murni aktivitas lapangan adalah keputusan yang tepat dan selaras dengan arsitektur gamifikasi Berseka.

---

### 2. Isu "Total Akumulasi Tim" di Halaman Kelompok (Tampil 57 Pts)

* **Status:** **RESOLVED & SESUAI BLUEPRINT MASTER V2**
* **Penjelasan Logika Bisnis:**
  Analisis Tim Mobile **100% tepat**. Nilai 57 Pts dihasilkan oleh fungsi `calculateGroupPoints` yang mengakumulasikan seluruh poin anggota murni dari kategori `KKN_PRESENSI_HADIR`, `KKN_DURASI_MEMENUHI`, dan `KKN_LOGBOOK_HARIAN`.
* **Proteksi Anti-Rekursi:**
  Bonus normalisasi kelompok (`POIN_KKN_FINAL`) dan bonus login **dilarang keras** dimasukkan ke dalam variabel akumulasi tim ini. Jika diikutsertakan, sistem akan mengalami *infinite point explosion* (poin normalisasi bertambah $\rightarrow$ rerata tim naik $\rightarrow$ normalisasi dihitung ulang semakin besar $\rightarrow$ skor meledak tak terbatas).
* **Payload Tambahan (Non-Rekursif):**
  Untuk fleksibilitas antarmuka, Backend juga telah melampirkan field tambahan yang aman:
  - `totalCumulativeMemberPoints`: 57 Pts (Akumulasi murni aktivitas harian anggota tim).
  - `totalNormalizationBonus`: Total bonus normalisasi seluruh anggota tim.
  - `totalCumulativeMemberPointsWithNormalization`: Total kumulatif gabungan aktivitas + normalisasi.

---

### 3. 🚨 BUGS KRITIS: Kebocoran Poin Proker ke Saldo Individu Anggota Kelompok

* **Status:** **TERSELESAIKAN (FIXED), SUDAH MERGE KE `main`, & LIVE DI VPS**
* **Akar Masalah:**
  Pada endpoint `GET /api/v1/kkn/kelompok/me` (fungsi `kknService.getMyGroup`), query agregasi poin anggota kelompok sebelumnya belum memfilter riwayat aksi proker (`KKN_PROKER`). Akibatnya, poin aksi proker (+2 Pts tiap tahap: Pengajuan, Mulai, Selesai) yang seharusnya hanya menjadi bobot penilaian kelompok (60%) bocor dan ikut terjumlah ke dalam saldo individu anggota.
* **Perbaikan Kode Backend:**
  Query agregasi pada [`kknService.getMyGroup()`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/main/apps/api/src/services/kknService.ts#L3058-L3065) telah diperbarui dengan filter eksklusi ganda:
  ```typescript
  const pointsAgg = await prisma.pointHistory.groupBy({
    by: ["userId"],
    where: {
      userId: { in: memberUserIds },
      kategori: { notIn: ["KKN_PROKER"] },
    },
    _sum: { points: true },
  });
  ```
* **Audit Database VPS (Kasus Mahasiswa Habik):**
  Rincian saldo riil Habik di VPS sebelum dan sesudah perbaikan:
  - Bonus Login Pertama (`BONUS_LOGIN_PERTAMA`): **+20 PTS**
  - Check-in Kehadiran (`KKN_PRESENSI_HADIR`): **+4 PTS**
  - Pemenuhan Durasi (`KKN_DURASI_MEMENUHI`): **+3 PTS**
  - Logbook Harian (`KKN_LOGBOOK_HARIAN`): **+3 PTS**
  - Normalisasi Kelompok (`POIN_KKN_FINAL`): **+49 PTS**
  - Histori Aksi Proker (`KKN_PROKER`): **+14 PTS** $\rightarrow$ *(Dipotong / Di-exclude)*
  - **Total Poin Valid:** $20 + 4 + 3 + 3 + 49 = \mathbf{79\text{ PTS}}$

---

## 🧪 Bukti Verifikasi Live HTTP Langsung ke VPS (`157.10.252.252`)

Pengujian live dilakukan menggunakan request HTTP otentikasi mahasiswa KKN langsung ke port API server VPS:

```http
GET /api/v1/kkn/kelompok/me HTTP/1.1
Host: 157.10.252.252
Authorization: Bearer <Token_Mahasiswa_KKN>
```

**Payload Hasil Respons Aktual di VPS:**
```json
[
  {
    "userId": "7aa81a2e-73c3-4dec-81b8-6309b6e6c821",
    "nim": "87654321",
    "name": "Test Mahasiswa",
    "jurusan": "Teknik Informatika",
    "fakultas": "UNIKOM",
    "individualPoints": 86,
    "isLeader": true
  },
  {
    "userId": "0b5ef47c-df6e-4d7f-922a-7985af82fd7b",
    "nim": "10112009",
    "name": "Akun Testing Mahasiswi",
    "jurusan": "Teknik Informatika",
    "fakultas": "UNIKOM",
    "individualPoints": 69,
    "isLeader": false
  },
  {
    "userId": "18b491ab-741a-4d44-a4ca-b391cb587c2b",
    "nim": "23145678",
    "name": "Habik",
    "jurusan": "Teknik Informatika",
    "fakultas": "UNIKOM",
    "individualPoints": 79,
    "isLeader": false
  },
  {
    "userId": "46155a83-2058-495d-8621-bfef56fc287c",
    "nim": "12345678",
    "name": "Acef Testing",
    "jurusan": "Teknik Informatika",
    "fakultas": "UNIKOM",
    "individualPoints": 99,
    "isLeader": false
  }
]
```

> **Verifikasi Berhasil:** Saldo individu Habik pada Daftar Anggota Kelompok telah kembali tepat di **79 Pts** (turun dari 93 Pts setelah 14 Poin proker berhasil dibersihkan). Seluruh anggota tim lainnya juga terkoreksi proporsional.

---

## 🚀 Status Rilis & Tata Kelola Git

Seluruh perubahan kode telah diproses mengikuti standar **3-Tier Git-Flow Berseka**:
1. **Fitur / Bugfix**: Branch `fix/filter-poin-proker-anggota-kelompok` & `feat/safe-kkn-normalization-dto-fields`.
2. **Review & UAT**: Merge Pull Request ke branch `development` $\rightarrow$ `staging`.
3. **Produksi (`main`)**: Telah di-merge ke branch `main` dan dipush ke remote `origin/main` (Commit Hash: `7b2e0adb70afc16d5cce788b7f6a9fbea6242149`).
4. **Server Live VPS**: Cluster PM2 (`psc-backend`) telah di-reload dengan build `dist` terbaru dan berjalan stabil.

---

## 📋 Tindak Lanjut untuk Tim Mobile

1. **Pengujian Aplikasi**: Tim Mobile cukup melakukan *pull-to-refresh* atau *re-login* pada aplikasi Mobile untuk memverifikasi nilai 79 Pts pada akun Habik di Halaman Kelompok.
2. **Tanpa Perubahan Kode Tambahan di Mobile**: Logika penyajian data di Mobile tetap dipertahankan karena struktur DTO dan nama field tidak mengalami perubahan *breaking change*.
