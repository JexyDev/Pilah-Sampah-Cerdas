# Spesifikasi Integrasi & Sinkronisasi Mobile - Web BERSEKA (KKN & DPL)

Dokumen ini berisi arsitektur sinkronisasi, kontrak endpoint API, payload request/response, alur kerja (workflow), serta **Prompt Lengkap Siap Pakai untuk Mobile Developer**.

---

## 1. Ringkasan Sinkronisasi Fitur

| Fitur | Aksi di Mobile (Mahasiswa) | Aksi di Web (DPL) | Status Sinkronisasi |
| :--- | :--- | :--- | :--- |
| **1. Posko KKN** | Mahasiswa/Ketua mendaftarkan lokasi posko (GPS, Alamat, Foto) via `RegisterPoskoView` | DPL melihat Posko Tunggal kelompoknya di `PoskoKknPage` dengan Peta GIS, Foto, & Tombol WA PIC | **SINKRON** ✅ |
| **2. Laporan Akhir** | Mahasiswa mengunggah file PDF Laporan Akhir via `InputLaporanAkhirView` | DPL memvalidasi file PDF, memberi nilai rubrik (Sistematika, Analisis, Dampak, Refleksi) & Catatan | **SINKRON** ✅ *(Nilai terkunci jika file belum diunggah)* |
| **3. Kelompok & DPL** | Mahasiswa melihat profil DPL (Nama, NIP, Kontak WhatsApp) di `KelompokKknView` | DPL melihat seluruh mahasiswa bimbingannya di `ManajemenMahasiswaPage` & `DashboardDplPage` | **SINKRON** ✅ |
| **4. Logbook & Presensi** | Mahasiswa mengisi logbook harian & presensi GPS harian | DPL memeriksa & menyetujui logbook serta kehadiran mahasiswa bimbingan | **SINKRON** ✅ |

---

## 2. Kontrak Endpoint API

### 2.1. Pendaftaran, Pembaruan & Detail Posko KKN

#### A. `POST /api/v1/kkn/posko/register` (Murni Create / Pendaftaran Pertama Kali)
- **Role Akses**: `MAHASISWA_KKN` (Khusus Ketua Kelompok)
- **Header**: `Authorization: Bearer <TOKEN>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```http
  POST /api/v1/kkn/posko/register HTTP/1.1
  Content-Type: multipart/form-data

  nama: Posko KKN Kelompok 01 Sadang Serang
  alamat: Jl. Sadang Serang No. 12, RW 03, Coblong, Bandung
  latitude: -6.88721
  longitude: 107.61845
  foto: <FILE_IMAGE_JPG_OR_PNG>
  ```
- **Response Success (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Pendaftaran Posko KKN berhasil dikirim dan menunggu verifikasi RW.",
    "data": {
      "id": "cm7...posko123",
      "nama": "Posko KKN Kelompok 01 Sadang Serang",
      "alamat": "Jl. Sadang Serang No. 12, RW 03, Coblong, Bandung",
      "latitude": -6.88721,
      "longitude": 107.61845,
      "foto": "/uploads/kkn/posko-1740600000.jpg",
      "kelompokId": "cm7...kelompok123",
      "statusApproval": "APPROVED"
    }
  }
  ```
- **Response Error (409 Conflict)**:
  Jika posko sudah pernah didaftarkan untuk kelompok tersebut:
  ```json
  {
    "success": false,
    "message": "Posko KKN untuk kelompok ini sudah terdaftar. Silakan gunakan fitur edit/pembaruan posko."
  }
  ```

#### B. `PUT /api/v1/kkn/posko/me` (Pembaruan / Edit Posko KKN)
- **Role Akses**: `MAHASISWA_KKN` (Khusus Ketua Kelompok)
- **Header**: `Authorization: Bearer <TOKEN>`
- **Content-Type**: `multipart/form-data`
- **Request Body** (Semua field bersifat opsional):
  ```http
  PUT /api/v1/kkn/posko/me HTTP/1.1
  Content-Type: multipart/form-data

  nama: Posko KKN Kelompok 01 Sadang Serang (Updated)
  alamat: Jl. Sadang Serang No. 14, RW 03, Coblong
  latitude: -6.88730
  longitude: 107.61850
  foto: <FILE_IMAGE_BARU_OPSIONAL>
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data Posko KKN berhasil diperbarui.",
    "data": {
      "id": "cm7...posko123",
      "nama": "Posko KKN Kelompok 01 Sadang Serang (Updated)",
      "alamat": "Jl. Sadang Serang No. 14, RW 03, Coblong",
      "latitude": -6.88730,
      "longitude": 107.61850,
      "foto": "/uploads/kkn/posko-1740600000.jpg",
      "statusApproval": "APPROVED"
    }
  }
  ```
- **Response Error (404 Not Found)**:
  Jika kelompok belum memiliki entri posko:
  ```json
  {
    "success": false,
    "message": "Posko KKN belum didaftarkan untuk kelompok ini. Silakan daftarkan posko terlebih dahulu."
  }
  ```

#### C. `GET /api/v1/kkn/posko/me`
- **Role Akses**: `MAHASISWA_KKN`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cm7...posko123",
      "nama": "Posko KKN Kelompok 01 Sadang Serang",
      "alamat": "Jl. Sadang Serang No. 12, RW 03, Coblong, Bandung",
      "latitude": -6.88721,
      "longitude": 107.61845,
      "foto": "/uploads/kkn/posko-1740600000.jpg",
      "kelompokName": "Kelompok 01 Sadang Serang",
      "kelurahan": "SADANG_SERANG",
      "rwName": "03",
      "dplName": "Dr. Ir. Budi Santoso, M.T.",
      "pic": "Ahmad Fauzi",
      "kontak": "081234567890"
    }
  }
  ```

---

### 2.2. Pengunggahan & Riwayat Laporan Akhir

#### `POST /api/v1/kkn/program-kerja` (Kategori: `LAPORAN_AKHIR`)
- **Role Akses**: `MAHASISWA_KKN`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```http
  POST /api/v1/kkn/program-kerja HTTP/1.1
  Content-Type: multipart/form-data

  judul: Laporan Akhir KKN Tematik Pengelolaan Sampah RW 03 Sadang Serang
  deskripsi: Laporan lengkap pelaksanaan KKN Tematik 2026
  kategori: LAPORAN_AKHIR
  rencanaAnggaran: 0
  filePdf: <FILE_PDF_DOCUMENT>
  ```
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "message": "Laporan Akhir KKN berhasil diunggah",
    "data": {
      "id": "cm7...proker999",
      "judul": "Laporan Akhir KKN Tematik Pengelolaan Sampah RW 03 Sadang Serang",
      "kategori": "LAPORAN_AKHIR",
      "fileUrl": "/uploads/kkn/laporan-akhir-1740600000.pdf",
      "statusUsulan": "DISETUJUI",
      "statusPelaksanaan": "SELESAI",
      "createdAt": "2026-08-27T02:30:00.000Z"
    }
  }
  ```

#### `GET /api/v1/kkn/laporan-akhir/me` (atau dari `GET /api/v1/kkn/program-kerja?kategori=LAPORAN_AKHIR`)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cm7...proker999",
      "judul": "Laporan Akhir KKN Tematik Pengelolaan Sampah RW 03 Sadang Serang",
      "fileUrl": "/uploads/kkn/laporan-akhir-1740600000.pdf",
      "statusTelaah": "DISETUJUI",
      "nilaiAkhir": 88,
      "predikat": "A (Sangat Baik)",
      "rubrikScores": {
        "sistematika": 90,
        "analisis": 85,
        "output": 88,
        "refleksi": 90
      },
      "catatanDpl": "Laporan sangat komprehensif, analisis data timbulan sampah RW 03 tersaji rapi dan solutif."
    }
  }
  ```

---

### 2.3. Informasi Kelompok & Profil DPL

#### `GET /api/v1/kkn/kelompok/me`
- **Role Akses**: `MAHASISWA_KKN`
- **Header**: `Authorization: Bearer <TOKEN>`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "groupId": "cm7...kelompok123",
      "groupName": "Kelompok 01 Sadang Serang",
      "dosenPembimbing": "Dr. Ir. Budi Santoso, M.T.",
      "dplName": "Dr. Ir. Budi Santoso, M.T.",
      "dplNip": "197805122005011002",
      "dplPhone": "081234567890",
      "dpl": {
        "id": "cm7...userDpl123",
        "name": "Dr. Ir. Budi Santoso, M.T.",
        "nip": "197805122005011002",
        "phone": "081234567890",
        "nomorWa": "081234567890",
        "fotoProfil": "/uploads/users/dpl-foto.jpg"
      },
      "poskoLocation": "Posko KKN RW 03 Sadang Serang",
      "poskoAlamat": "Jl. Sadang Serang No. 12",
      "poskoFoto": "/uploads/kkn/posko.jpg",
      "poskoStatus": "APPROVED",
      "isUserLeader": true,
      "totalGroupPoints": 150,
      "members": [
        {
          "userId": "cm7...user1",
          "nim": "1301210001",
          "name": "Ahmad Fauzi",
          "jurusan": "Teknik Informatika",
          "fakultas": "Informatika",
          "individualPoints": 35,
          "isLeader": true
        }
      ]
    }
  }
  ```

> [!NOTE]
> **Atribut Nomor Telepon DPL:**
> Frontend/Mobile dapat membaca nomor WhatsApp DPL dari salah satu properti berikut secara berurutan (*fallback*):
> 1. `json['dpl']?['phone']` atau `json['dpl']?['nomorWa']`
> 2. `json['dplPhone']`
> 3. `json['dplObj']?['phone']`
> 
> Format nomor telepon: `08...` atau `628...`. Di Mobile, sanitasi ke format WhatsApp: `phone.replaceAll(RegExp(r'[^0-9]'), '').replaceFirst(RegExp(r'^0'), '62')` sehingga URL menjadi `https://wa.me/6281234567890`.

---

## 3. Copy-Paste Prompt untuk Mobile Developer

Gunakan prompt di bawah ini untuk menginstruksikan mobile developer agar mengimplementasikan atau menyempurnakan fitur KKN di aplikasi Flutter:

```markdown
Halo Mobile Developer! 🚀

Tolong lakukan sinkronisasi dan penyempurnaan fitur KKN di aplikasi Mobile Flutter BERSEKA agar terintegrasi 100% dengan backend API dan Web DPL:

### 1. Modul Posko KKN (`lib/app/modules/mahasiswa/views/register_posko_view.dart` & `posko_kkn_controller.dart`)
- **Endpoint Register**: `POST /api/v1/kkn/posko/register` (multipart: `nama`, `alamat`, `latitude`, `longitude`, `foto`).
- **Endpoint Get Posko**: `GET /api/v1/kkn/posko/me`
- **Fitur yang Diperlukan**:
  1. Pastikan picker koordinat GPS mengambil lokasi akurat perangkat (`geolocator`).
  2. Tambahkan input alamat fisik lengkap dan upload foto posko tampak depan.
  3. Pada halaman status posko (`PoskoKknView`), tampilkan:
     - Badge "Terverifikasi Resmi"
     - Nama Posko & Kelompok
     - Alamat Lengkap & Koordinat GPS (dengan tombol "Buka di Google Maps" dan "Salin Koordinat")
     - Nama Dosen Pembimbing Lapangan (DPL) beserta tombol WhatsApp DPL.

### 2. Modul Input Laporan Akhir (`lib/app/modules/mahasiswa/views/input_laporan_akhir_view.dart`)
- **Endpoint Upload**: `POST /api/v1/kkn/program-kerja` (multipart: `judul`, `deskripsi`, `kategori: "LAPORAN_AKHIR"`, `filePdf`).
- **Fitur yang Diperlukan**:
  1. Validasi file picker: hanya memperbolehkan ekstensi `.pdf` dengan ukuran maksimal 15 MB.
  2. Pada Bottom Sheet Riwayat Laporan Akhir (`_RiwayatLaporanAkhirSheet`):
     - Tampilkan status telaah: `Belum Diunggah`, `Menunggu Telaah DPL`, `Perlu Revisi`, atau `Disetujui`.
     - Jika sudah dinilai oleh DPL, tampilkan:
       * Nilai Akhir (contoh: **88**) dan Predikat (**A - Sangat Baik**).
       * Rincian Nilai Rubrik (Sistematika: 90, Analisis: 85, Capaian/Output: 88, Refleksi: 90).
       * Catatan / Feedback tertulis dari DPL.
     - Tambahkan tombol "Lihat / Unduh Dokumen PDF".

### 3. Modul Kelompok KKN (`lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart`)
- **Endpoint**: `GET /api/v1/kkn/kelompok/me`
- **Fitur yang Diperlukan**:
  1. Card Profil DPL: Menampilkan Nama DPL, NIP, dan Tombol WhatsApp Direct (`https://wa.me/<PHONE>`).
  2. Daftar Anggota Kelompok: NIM, Nama, Jurusan, Status Penugasan RW.

Pastikan semua handling network menggunakan `try-catch`, menampilkan SnackBar feedback yang ramah, dan Riverpod state ter-update secara reaktif!
```
