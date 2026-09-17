# 📋 Laporan Anomali & Panduan Teknis Perbaikan untuk Mobile Developer
**Proyek:** BERSEKA (Aplikasi Pilah Sampah Cerdas - Modul KKN & Warga)  
**Target Pembaca:** Mobile Flutter Developer  
**Tanggal Rilis:** 17 September 2026  
**Status Backend:** SUDAH DIPERBAIKI & TERSTANDARISASI DI REPO `main`

---

## 📌 Ringkasan Eksekutif untuk Mobile Developer

Berdasarkan audit forensik terhadap integrasi antara Backend API dan Aplikasi Mobile Flutter, ditemukan **4 anomali kritis** di sisi mobile yang menyebabkan:
1. Skor kelompok terpotong angka desimalnya (misal `11.8` tampil sebagai `11`).
2. Label UI membingungkan pengguna (menampilkan skor terbobot KKN tapi berlabel *"Penjumlahan poin individu 12 anggota"*).
3. Parameter kelurahan salah kirim sehingga kueri warga dampingan selalu menghasilkan 0 data.
4. Aplikasi mobile mengunduh ribuan data warga se-kota Bandung ke memori HP saat kueri wilayah kosong.

Dokumen ini adalah **panduan implementasi resmi** bagi Mobile Developer untuk memperbaiki keempat titik tersebut.

---

## 🔍 Detail Anomali & Panduan Perbaikan Kode Flutter

---

### Anomali 1: Pemotongan Desimal Skor Kelompok (`.toInt()`)

* **File:** [`lib/app/data/models/mahasiswa_kkn_models.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/data/models/mahasiswa_kkn_models.dart) (Baris 936, 1073)
* **Masalah:**
  Field `totalGroupPoints` di dalam model `KelompokKknData` dideklarasikan bertipe `int` dan diparsing menggunakan `.toInt()`:
  ```dart
  // KODE LAMA BERMASALAH:
  final int totalGroupPoints;
  ...
  totalGroupPoints:
      (json['totalGroupPoints'] as num?)?.toInt() ??
      (json['totalPoints'] as num?)?.toInt() ??
      0,
  ```
  Backend mengembalikan skor terbobot KKN sebagai bilangan pecahan desimal (contoh: `11.8` atau `8.3`). Pemanggilan `.toInt()` secara paksa membuang angka di belakang koma sehingga `11.8` dipotong menjadi `11`.
* **Solusi Perbaikan:**
  Ubah tipe `totalGroupPoints` menjadi `double`:
  ```dart
  // REKOMENDASI PERBAIKAN:
  final double totalGroupPoints;
  ...
  totalGroupPoints:
      (json['totalGroupPoints'] as num?)?.toDouble() ??
      (json['totalPoints'] as num?)?.toDouble() ??
      0.0,
  ```

---

### Anomali 2: Label UI Menyesatkan & Penggabungan Dua Metrik Berbeda

* **File:**
  - [`lib/app/data/models/mahasiswa_kkn_models.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/data/models/mahasiswa_kkn_models.dart) (Baris 944-947)
  - [`lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart) (Baris 388-414)
* **Masalah:**
  Getter di model:
  ```dart
  int get calculatedTotalPoints {
    if (totalGroupPoints > 0) return totalGroupPoints;
    return members.fold(0, (sum, m) => sum + m.individualPoints);
  }
  ```
  Di UI:
  ```dart
  Text('${kelompokData.calculatedTotalPoints} Poin')
  Text('Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok')
  ```
  Label di UI menuliskan **"Penjumlahan poin individu 12 anggota kelompok"**, tetapi angka yang keluar adalah **11 Poin** (yang merupakan Skor Terbobot KKN, bukan penjumlahan poin individu). Hal ini memicu kepanikan mahasiswa karena mengira ribuan poin tim mereka hilang.
* **Solusi Perbaikan:**
  1. Tambahkan getter akumulasi riil seluruh anggota di `KelompokKknData`:
     ```dart
     int get cumulativeMemberPoints {
       return members.fold(0, (sum, m) => sum + m.individualPoints);
     }
     ```
  2. Pisahkan tampilan di `kelompok_kkn_view.dart` menjadi **2 kartu metrik terpisah**:
     - **Kartu A: Skor Terbobot Kelompok**  
       Angka: `${kelompokData.totalGroupPoints.toStringAsFixed(1)} Poin`  
       Keterangan: *Formula 60% Proker + 40% Rerata Anggota*
     - **Kartu B: Total Akumulasi Poin Tim**  
       Angka: `${kelompokData.cumulativeMemberPoints} PTS`  
       Keterangan: *Total akumulasi dari 12 anggota*

---

### Anomali 3: Salah Kirim Alamat Posko sebagai Nama Kelurahan

* **File:** [`lib/app/modules/mahasiswa/views/monitoring_warga_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/views/monitoring_warga_view.dart) (Baris 58-63)
* **Masalah:**
  ```dart
  // KODE LAMA BERMASALAH:
  final kelompok = ref.read(kelompokKknProvider).kelompok;
  if (kelurahan.isEmpty && kelompok != null) {
    final loc = kelompok.poskoLocation;
    if (loc.isNotEmpty && loc != '-') {
      kelurahan = loc; // <-- loc berisi "Posko KKN RW 21, Sadang Serang"
    }
  }
  ```
  Nilai `poskoLocation` berisi nama/alamat posko lengkap. Ketika dioper sebagai parameter `kelurahan`, backend menjalankan filter pencarian kelurahan dengan nama string tersebut, yang berakibat **0 warga ditemukan**.
* **Solusi Perbaikan:**
  1. Tambahkan field resmi `final String? kelurahan;` pada model `KelompokKknData` yang memetakan `json['kelurahan']`.
  2. Di `monitoring_warga_view.dart`, ambil langsung nama kelurahannya:
     ```dart
     if (kelurahan.isEmpty && kelompok != null) {
       final kel = kelompok.kelurahan;
       if (kel != null && kel.isNotEmpty && kel != '-') {
         kelurahan = kel;
       }
     }
     ```

---

### Anomali 4: Unbounded Fallback Mengunduh Seluruh Warga Se-Kota ke HP

* **File:** [`lib/app/modules/mahasiswa/controllers/aktivasi_warga_controller.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/mahasiswa/controllers/aktivasi_warga_controller.dart) (Baris 118-121)
* **Masalah:**
  ```dart
  if (data.isEmpty && (kelurahan.isNotEmpty || rw.isNotEmpty)) {
    final allRaw = await repo.getWargaForAktivasi(
      search: search.isEmpty ? null : search,
    );
    // filter in-memory di HP...
  }
  ```
  Ketika query wilayah kosong (karena Anomali 3), mobile memanggil endpoint `getWargaForAktivasi()` **tanpa parameter kecamatan, kelurahan, maupun RW**. Akibatnya seluruh ribuan data warga se-kota diunduh via jaringan seluler mahasiswa lalu diparsing di RAM HP. Ini menyebabkan lag parah, boros kuota, dan crash memory.
* **Solusi Perbaikan:**
  Hapus blok pemanggilan tanpa parameter tersebut. Jika data warga di wilayah binaan kelompok memang belum ada, tampilkan empty state yang bersih (*"Belum ada warga terdaftar di wilayah dampingan kelompok Anda"*).

---

## 📡 Dokumentasi Payload Resmi Endpoint Backend

### `GET /api/v1/kkn/kelompok-saya`
Endpoint ini telah diperbarui di Backend:
- Membaca langsung dari tabel resmi `posko_kkn`.
- Mengembalikan koordinat dan `radiusMeter` dinamis dari database (bukan hardcoded 500m).
- Menyediakan field eksplisit `kelurahan` dan `cakupanRw`.
- Nilai `totalGroupPoints` dikembalikan bertipe `number` (float).

```json
{
  "status": "success",
  "data": {
    "groupId": "clx1234567890",
    "groupName": "Kelompok KKN 01 Sadang Serang",
    "kelurahan": "Sadang Serang",
    "cakupanRw": ["01", "02", "03"],
    "dosenPembimbing": "Dr. Agus Mulyana, S.Kom., M.T.",
    "dplName": "Dr. Agus Mulyana, S.Kom., M.T.",
    "dplNip": "4127.70.025",
    "dplPhone": "08123456789",
    "poskoLocation": "Posko KKN Sadang Serang",
    "poskoAlamat": "Jl. Sadang Serang No. 12",
    "poskoFoto": "https://berseka.id/uploads/posko-foto.jpg",
    "poskoStatus": "REGISTERED",
    "isUserLeader": false,
    "latitude": -6.887123,
    "longitude": 107.621456,
    "poskoLatitude": -6.887123,
    "poskoLongitude": 107.621456,
    "radiusMeter": 150,
    "totalGroupPoints": 11.8,
    "members": [
      {
        "userId": "usr-001",
        "nim": "10123001",
        "name": "Budi Santoso",
        "jurusan": "Teknik Informatika",
        "fakultas": "Teknik dan Ilmu Komputer",
        "individualPoints": 210,
        "isLeader": true
      }
    ],
    "linkGoogleDrive": "https://drive.google.com/drive/folders/xxxx"
  }
}
```

---

## 🤝 Kontak & Koordinasi
Jika ada penyesuaian payload atau tipe data tambahan yang dibutuhkan oleh tim Mobile, silakan koordinasikan melalui branch `development` atau buka Issue pada repositori tim.
