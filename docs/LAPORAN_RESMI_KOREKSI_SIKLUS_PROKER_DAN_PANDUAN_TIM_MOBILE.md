# 📱 LAPORAN RESMI KOREKSI SIKLUS 3-TAHAP POIN PROKER & PANDUAN INTEGRASI TIM MOBILE
## Tata Kelola Gamifikasi, Formula Penilaian KKN, & Standardisasi Antarmuka Mobile (Flutter)

**Nomor Dokumen:** 005/DEV-LEAD/SPEC-MOBILE/IX/2026  
**Tanggal Rilis:** 16 September 2026  
**Target Pembaca:** Tim Mobile Developer (Flutter - Habil & Tim), QA Engineer, Product Owner  
**Dari:** Lead Fullstack & Backend Architect (`main`)  
**Sifat:** PENTING & WAJIB DIIMPLEMENTASIKAN (HIGH PRIORITY)  
**Status Backend:** ✅ SUDAH AKTIF, TERUJI, & TERVERIFIKASI DI BRANCH DEVELOPMENT  

---

## 📌 DAFTAR ISI
1. [Ringkasan Eksekutif & Latar Belakang Koreksi](#1-ringkasan-eksekutif--latar-belakang-koreksi)
2. [Spesifikasi Resmi: Siklus 3-Tahap Poin Program Kerja (+2 PTS Statis)](#2-spesifikasi-resmi-siklus-3-tahap-poin-program-kerja-2-pts-statis)
3. [Bedah Formula Penilaian Terbobot KKN (60% : 40%)](#3-bedah-formula-penilaian-terbobot-kkn-60--40)
   - [3.1 Formula Poin Kelompok](#31-formula-poin-kelompok)
   - [3.2 Formula Poin DPL](#32-formula-poin-dpl)
4. [Katalog Kontrak Endpoint & Response JSON untuk Mobile](#4-katalog-kontrak-endpoint--response-json-untuk-mobile)
   - [4.1 Update Status Pelaksanaan Proker (Mulai / Selesai)](#41-update-status-pelaksanaan-proker-mulai--selesai)
   - [4.2 Info Kelompok KKN (GET /api/v1/kkn/kelompok/me)](#42-info-kelompok-kkn-get-apiv1kknkelompokme)
   - [4.3 Riwayat Gamifikasi Mahasiswa](#43-riwayat-gamifikasi-mahasiswa)
5. [Daftar Temuan Audit Kode & Tindakan Wajib Tim Mobile (Flutter)](#5-daftar-temuan-audit-kode--tindakan-wajib-tim-mobile-flutter)
   - [Tindakan 1: Pisahkan 2 Kartu Metrik di kelompok_kkn_view.dart](#tindakan-1-pisahkan-2-kartu-metrik-di-kelompok_kkn_viewdart)
   - [Tindakan 2: Perbaiki Getter di mahasiswa_kkn_models.dart](#tindakan-2-perbaiki-getter-di-mahasiswa_kkn_modelsdart)
   - [Tindakan 3: Bersihkan Tag Idempotensi di input_sanitizer.dart](#tindakan-3-bersihkan-tag-idempotensi-di-input_sanitizerdart)
   - [Tindakan 4: Benahi Klasifikasi Kategori Poin Proker di poin_view.dart](#tindakan-4-benahi-klasifikasi-kategori-poin-proker-di-poin_viewdart)
   - [Tindakan 5: Edukasi Gamifikasi pada Dialog Aksi di data_proker_view.dart](#tindakan-5-edukasi-gamifikasi-pada-dialog-aksi-di-data_proker_viewdart)
6. [Panduan Pengujian QA (Testing Checklist)](#6-panduan-pengujian-qa-testing-checklist)

---

## 1. Ringkasan Eksekutif & Latar Belakang Koreksi

Pada implementasi sebelumnya terjadi disonansi persepsi antara tim mobile, mahasiswa di lapangan, dan backend:
1. **Kesalahpahaman Mekanisme Tembakan Poin Proker**:
   Sebelumnya sempat diasumsikan tahapan proker menembakkan nilai 4 atau 6 secara langsung. Hal ini keliru. **Mekanisme yang benar adalah penambahan statis berjenjang +2 poin pada setiap transisi tahapan**, sehingga terakumulasi menjadi total 6 poin saat proker tuntas.
2. **Kepanikan Lapangan Terkait Label Poin Kelompok**:
   Di aplikasi mobile (`kelompok_kkn_view.dart`), angka `totalGroupPoints` (nilai resmi terbobot 60% : 40%, bernilai 16 Poin) ditampilkan dengan keterangan teks yang salah fatal: *"Penjumlahan poin individu 12 anggota kelompok"*. Mahasiswa yang memiliki total poin individu $> 1.000\text{ PTS}$ panik dan mengira sistem memotong poin mereka secara sepihak.
3. **Pencemaran UI oleh Tag Teknis**:
   Tagging idempotensi backend (`[ProkerID:xxx:SELESAI]`) bocor ke antarmuka pengguna karena modul pembersih teks (`InputSanitizer`) di mobile belum mengantisipasi tag tersebut.

**Status Saat Ini:** Seluruh logika backend telah **selaras 100%**. Dokumen ini menjadi rujukan resmi wajib bagi Tim Mobile (Flutter) untuk menyelaraskan antarmuka, model data, dan sanitasi tampilan.

---

## 2. Spesifikasi Resmi: Siklus 3-Tahap Poin Program Kerja (+2 PTS Statis)

Setiap satu Program Kerja (Proker) memiliki siklus hidup 3 tahapan (*3-Step Lifecycle*). Pada setiap transisi tahapan, backend secara otomatis menembakkan **+2 Poin Statis** ke riwayat gamifikasi (`PointHistory`) untuk **setiap anggota kelompok**:

```
[Tahap 1: Pengajuan Instan] ──(+2 PTS)──> [Tahap 2: Berjalan] ──(+2 PTS)──> [Tahap 3: Selesai]
  Akumulasi: 2 Poin (Instan)               Akumulasi: 4 Poin                 Akumulasi: 6 Poin
```

### Matriks Detail Status & Idempotensi:

| Tahapan Siklus | Status Usulan (`statusUsulan`) | Status Pelaksanaan (`statusPelaksanaan`) | Poin Ditambahkan ke Histori | Total Poin Akumulasi | Tagging Idempotensi Backend |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Tahap 1: Pengajuan Ide Instan** | `BELUM_DISETUJUI` / `DISETUJUI` | `BELUM_MULAI` | **+2 PTS** | **2 PTS** | `[ProkerID:<id>:PENGAJUAN]` / `[ProkerID:<id>:DISETUJUI]` |
| **Tahap 2: Mulai Berjalan** | `DISETUJUI` / `BELUM_DISETUJUI` | `SEDANG_BERJALAN` | **+2 PTS** | **4 PTS** | `[ProkerID:<id>:BERJALAN]` |
| **Tahap 3: Tuntas Selesai** | `DISETUJUI` / `BELUM_DISETUJUI` | `SELESAI` | **+2 PTS** | **6 PTS** | `[ProkerID:<id>:SELESAI]` |
| ❌ **Usulan Ditolak (Rollback)** | `DITOLAK` | `BELUM_MULAI` | **Rollback (0 PTS)** | **0 PTS** | Seluruh tag proker terkait dihapus otomatis |

### 🛡️ Jaminan Idempotensi Jaringan Seluler & Rollback Sanksi:
- Backend menyisipkan penanda unik `[ProkerID:<id>:<STEP>]` pada deskripsi transaksi poin.
- **Pencairan Instan**: Begitu mahasiswa submit proker, +2 PTS langsung masuk tanpa menunggu review DPL.
- **Proteksi Duplikasi**: Ketika DPL menyetujui atau saat terjadi retry jaringan di Flutter, backend mengecek tag `PENGAJUAN` / `DISETUJUI`. Anggota kelompok dijamin **tidak akan menerima dobel +2 poin**.
- **Rollback Otomatis**: Jika DPL menolak usulan (`DITOLAK`), seluruh poin proker tersebut langsung dicabut (kembali ke 0 PTS).

---

## 3. Bedah Formula Penilaian Terbobot KKN (60% : 40%)

### 3.1 Formula Poin Kelompok
Poin Kelompok adalah **Skor Terbobot Evaluasi KKN** yang menggabungkan kuantitas & progres program kerja kelompok (60%) dengan rata-rata keaktifan harian individu anggota (40%):

$$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-Rata Poin Anggota} \times 0{,}4)$$

#### Komponen:
1. **Poin Proker (Bobot 60%)**:
   Dihitung berdasarkan status terakhir setiap program kerja yang dimiliki kelompok:
   - Proker Disetujui (belum mulai) = **2 Poin**
   - Proker Sedang Berjalan = **4 Poin**
   - Proker Selesai = **6 Poin**
   - $\text{Poin Proker} = \sum (\text{Poin Status Terakhir Tiap Proker})$.
2. **Rata-Rata Poin Anggota (Bobot 40%)**:
   - Dihitung dari rata-rata capaian harian presensi & logbook seluruh anggota (Presensi Masuk: 4, Jam Kerja: 3, Logbook Harian: 3 = skala 0–10 PTS/hari).
   - Diisolasi murni dari aktivitas harian agar **tidak terjadi duplikasi perhitungan dengan poin proker**.

#### Contoh Perhitungan Resmi:
Kelompok memiliki 6 proker dan rata-rata poin harian anggota adalah 4:
- 2 proker status Disetujui: $2 \times 2 = 4\text{ Poin}$
- 2 proker status Sedang Berjalan: $2 \times 4 = 8\text{ Poin}$
- 2 proker status Selesai: $2 \times 6 = 12\text{ Poin}$
- **Total Poin Proker** = $4 + 8 + 12 = \mathbf{24\text{ Poin}}$
- **Rata-rata Poin Anggota** = $\mathbf{4\text{ Poin}}$
- **Hasil Skor Kelompok Akhir**:
  $$\text{Poin Kelompok} = (24 \times 0{,}6) + (4 \times 0{,}4) = 14{,}4 + 1{,}6 = \mathbf{16\text{ Poin}}$$

---

### 3.2 Formula Poin DPL
Poin DPL (Dosen Pembimbing Lapangan) dihitung dari pemenuhan bimbingan logbook DPL (50%) dan kinerja kelompok dampingan (50%):

$$\mathbf{\text{Poin DPL}} = (\text{Poin Logbook DPL} \times 0{,}5) + (\text{Poin Kelompok} \times 0{,}5)$$

- **Poin Logbook DPL (Biner Ketersediaan)**:
  - Mengisi $\ge 1$ logbook bimbingan = **6 Poin**
  - Belum mengisi ($0$ logbook) = **0 Poin**
- **Contoh (DPL sudah mengisi logbook, Poin Kelompok = 11,8)**:
  $$\text{Poin DPL} = (6 \times 0{,}5) + (11{,}8 \times 0{,}5) = 3{,}0 + 5{,}9 = \mathbf{8{,}9\text{ Poin}}$$

---

## 4. Katalog Kontrak Endpoint & Response JSON untuk Mobile

### 4.1 Update Status Pelaksanaan Proker (Mulai / Selesai)
Dipanggil saat mahasiswa/ketua menekan tombol aksi pada daftar atau detail proker.

* **Method & Path:** `PATCH /api/v1/kkn/program-kerja/:id` *(atau `PUT /api/v1/kkn/program-kerja/:id`)*
* **Headers:**  
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```

#### A. Request Body - Mulai Dikerjakan:
```json
{
  "statusPelaksanaan": "SEDANG_BERJALAN"
}
```
*Dampak Backend:* Menembakkan **+2 PTS** ke seluruh anggota kelompok dan mengirimkan push notifikasi FCM `PROKER_STARTED`.

#### B. Request Body - Selesaikan Proker:
```json
{
  "statusPelaksanaan": "SELESAI"
}
```
*Dampak Backend:* Menembakkan tambahan **+2 PTS** ke seluruh anggota kelompok (total kumulatif menjadi 6 PTS) dan mengirimkan push notifikasi FCM `PROKER_COMPLETED`.

#### Response Body (`200 OK`):
```json
{
  "success": true,
  "message": "Program Kerja berhasil diperbarui.",
  "data": {
    "id": "clx123abc456proker789",
    "judul": "Sosialisasi Komposter Rumah Tangga RW 05",
    "statusUsulan": "DISETUJUI",
    "statusPelaksanaan": "SEDANG_BERJALAN",
    "status": "SEDANG_BERJALAN",
    "kelompokId": "cm-kelompok-kkn-01"
  }
}
```

---

### 4.2 Info Kelompok KKN (GET /api/v1/kkn/kelompok/me)
* **Method & Path:** `GET /api/v1/kkn/kelompok/me`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

#### Response Body (`200 OK`):
```json
{
  "groupId": "cm-kelompok-kkn-01",
  "groupName": "Kelompok KKN 01 Coblong",
  "dplName": "Dr. DPL Pembimbing, M.T.",
  "poskoLocation": "RW 05, Kel. Sadang Serang",
  "isUserLeader": true,
  "totalGroupPoints": 16,
  "members": [
    {
      "userId": "user-mhs-1",
      "nim": "1301210001",
      "name": "Ahmad Ketua Tim",
      "individualPoints": 174,
      "isLeader": true
    },
    {
      "userId": "user-mhs-2",
      "nim": "1301210002",
      "name": "Siti Anggota",
      "individualPoints": 100,
      "isLeader": false
    }
  ]
}
```

> ⚠️ **PERHATIAN KHUSUS TIM MOBILE:**  
> - `totalGroupPoints` bernilai **16** (Hasil formula terbobot: $24 \times 0{,}6 + 4 \times 0{,}4$).  
> - Total akumulasi riil poin anggota tim adalah $174 + 100 = 274\text{ PTS}$.  
> - Dilarang keras menampilkan label *"Penjumlahan poin individu anggota"* di atas angka `totalGroupPoints`!

---

### 4.3 Riwayat Gamifikasi Mahasiswa
* **Method & Path:** `GET /api/v1/points/history` *(atau `GET /api/v1/gamification/history`)*

#### Format Item Histori Proker:
```json
{
  "id": "ph-003",
  "points": 2,
  "kategori": "KKN_PROKER",
  "description": "Program Kerja Selesai: Sosialisasi Komposter RW 05 [ProkerID:clx123abc456proker789:SELESAI]",
  "createdAt": "2026-09-16T08:30:00.000Z"
}
```

---

## 5. Daftar Temuan Audit Kode & Tindakan Wajib Tim Mobile (Flutter)

### Tindakan 1: Pisahkan 2 Kartu Metrik di `kelompok_kkn_view.dart`
**Lokasi:** `mobile/lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart` (Baris 388–414)

```dart
// ❌ KODE LAMA YANG MENYESATKAN (JANGAN DIGUNAKAN):
Text('Poin Akumulasi Kelompok'),
Text('${kelompokData.calculatedTotalPoints} Poin'),
Text('Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok'),

// ✅ REKOMENDASI GANTI DENGAN 2 KARTU INFORMATIF:

// Kartu 1: Skor Terbobot KKN (Nilai Resmi Akademik DPL)
Container(
  width: double.infinity,
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: AppColors.border),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Skor Terbobot Kelompok (KKN)',
        style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
      ),
      const SizedBox(height: 6),
      Text(
        '${kelompokData.totalGroupPoints} Poin',
        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
      ),
      const SizedBox(height: 4),
      const Text(
        'Formula: 60% Proker + 40% Rata-rata Anggota',
        style: TextStyle(fontSize: 11, color: Colors.black45),
      ),
    ],
  ),
),

const SizedBox(height: 12),

// Kartu 2: Total Akumulasi Poin Tim (Gamifikasi Anggota)
Container(
  width: double.infinity,
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: AppColors.border),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Total Akumulasi Tim',
        style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
      ),
      const SizedBox(height: 6),
      Text(
        '${kelompokData.cumulativeMemberPoints} PTS',
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primaryBlueDark),
      ),
      const SizedBox(height: 4),
      Text(
        'Penjumlahan riwayat poin dari ${kelompokData.members.length} anggota kelompok',
        style: const TextStyle(fontSize: 11, color: Colors.black45),
      ),
    ],
  ),
),
```

---

### Tindakan 2: Perbaiki Getter di `mahasiswa_kkn_models.dart`
**Lokasi:** `mobile/lib/app/data/models/mahasiswa_kkn_models.dart` (Baris 943–947)

Hapus getter ambigu `calculatedTotalPoints` yang mengaburkan data API. Pisahkan secara tegas:

```dart
// ❌ HAPUS KODE AMBIGU INI:
// int get calculatedTotalPoints {
//   if (totalGroupPoints > 0) return totalGroupPoints;
//   return members.fold(0, (sum, m) => sum + m.individualPoints);
// }

// ✅ GANTI DENGAN PROPERTI & GETTER EKSPLISIT:
/// Skor Terbobot KKN Resmi dari Backend API (60% Proker + 40% Rata-rata Anggota)
final int totalGroupPoints;

/// Total Penjumlahan Poin Individu Seluruh Anggota Tim
int get cumulativeMemberPoints => members.fold(0, (sum, m) => sum + m.individualPoints);
```

---

### Tindakan 3: Bersihkan Tag Idempotensi di `input_sanitizer.dart`
**Lokasi:** `mobile/lib/app/core/utils/input_sanitizer.dart` (Baris 23–29)

Perbarui regex agar tag `[ProkerID:...]` tidak tampil di antarmuka pengguna:

```dart
// ✅ PERBARUI REGEX PEMBERSIH BRACKET SISTEM:
cleaned = cleaned.replaceAll(
  RegExp(
    r'\s*\[\s*(Report\s*ID|report_?id|ReportID|ProkerID|proker_?id|ID|id)\s*:[^\]]+\]',
    caseSensitive: false,
  ),
  '',
);
```

---

### Tindakan 4: Benahi Klasifikasi Kategori Poin Proker di `poin_view.dart`
**Lokasi:** `mobile/lib/app/modules/poin/poin_view.dart` (Baris 580–630)

Tambahkan pendeteksi kategori `KKN_PROKER`:

```dart
// ✅ TAMBAHKAN PENGECEKAN KATEGORI PROKER:
final bool isProker = item.kategori == 'KKN_PROKER' || 
                      descLower.contains('program kerja') || 
                      descLower.contains('proker');

if (isProker) {
  title = InputSanitizer.cleanSystemMessage(item.description);
  iconData = Icons.assignment_turned_in_rounded;
  color = AppColors.primaryBlue;
} else if (isAktivasi) {
  title = 'Aktivasi Tempat Sampah Berhasil';
  ...
```

---

### Tindakan 5: Edukasi Gamifikasi pada Dialog Aksi di `data_proker_view.dart`
**Lokasi:** `mobile/lib/app/modules/mahasiswa/views/data_proker_view.dart` (Baris 251–256)

Ubah teks dialog konfirmasi agar mahasiswa mengetahui adanya penambahan poin +2 untuk tim:

```dart
content: Text(
  isMulai
      ? 'Tandai program kerja "$judul" sebagai sedang dikerjakan?\n\n'
        '🚀 Seluruh anggota kelompok akan mendapatkan +2 Poin.'
      : 'Tandai program kerja "$judul" sebagai sudah selesai dilaksanakan?\n\n'
        '🎉 Seluruh anggota kelompok akan mendapatkan +2 Poin tambahan (Total +6 Poin).',
  style: const TextStyle(fontSize: 14, height: 1.4),
),
```

---

## 6. Panduan Pengujian QA (Testing Checklist)

| No | Skenario Pengujian | Hasil yang Diharapkan | Status |
| :-: | :--- | :--- | :-: |
| 1 | DPL menyetujui usulan proker baru | Seluruh anggota kelompok menerima **+2 PTS** dengan tag `[ProkerID:<id>:DISETUJUI]`. | ⬜ |
| 2 | Mahasiswa klik "Mulai Dikerjakan" | Seluruh anggota kelompok menerima tambahan **+2 PTS** (Total akumulasi proker menjadi **4 PTS**). | ⬜ |
| 3 | Mahasiswa klik "Selesaikan Proker" | Seluruh anggota kelompok menerima tambahan **+2 PTS** (Total akumulasi proker menjadi **6 PTS**). | ⬜ |
| 4 | Simulasi putus koneksi (retry API ganda) | Backend menolak duplikasi; saldo poin anggota **tidak bertambah dua kali**. | ⬜ |
| 5 | DPL menolak usulan (`DITOLAK`) | Seluruh histori poin proker tersebut otomatis ditarik/direset (**0 PTS**). | ⬜ |
| 6 | Buka layar Kelompok KKN | Tampil 2 kartu terpisah: Kartu Skor Terbobot (misal 16 Poin) dan Kartu Total Akumulasi Tim (misal 274 PTS). | ⬜ |
| 7 | Buka riwayat perolehan poin | Tidak ada string teknis `[ProkerID:...]` yang bocor di judul riwayat. | ⬜ |

---

**Lead Fullstack & Backend Architect**  
*Berseka Development Team*
