# 📋 Dokumentasi Alur Kerja (Flow) Program Kerja KKN — Mobile Developer

Dokumen ini adalah **Single Source of Truth (SSOT)** alur Program Kerja (Proker) KKN pada aplikasi Mobile BERSEKA, menghubungkan interaksi **Mahasiswa KKN**, **Dosen Pembimbing Lapangan (DPL)**, dan **Mitra Pendamping Lapangan (MPL)**.

---

## 1. Konsep Dasar Proker dalam "3 Pilar KKN"

Sistem KKN di BERSEKA dibangun atas konsep **3 Pilar Bertahap**:

`mermaid
graph LR
    Pilar1["<b>Pilar 1: Perencanaan</b><br/>(Program Kerja / Proker)<br/>Mahasiswa menyusun usulan rencana kegiatan"] -->|Disetujui DPL| Pilar2["<b>Pilar 2: Aksi & Pelaksanaan</b><br/>(Logbook Pemanfaatan / Harian)<br/>Pelaksanaan aksi terhubung ke Proker"]
    Pilar2 -->|Kegiatan Selesai| Pilar3["<b>Pilar 3: Panen & Evaluasi</b><br/>(Catat Panen & Penilaian DPL)<br/>Output nyata & Skor Akademik DPL"]
`

1. **Pilar 1 (Perencanaan - Program Kerja)**:
   - Mahasiswa (seluruh anggota kelompok) menyusun dan mengajukan program kerja kelompok (Pemilahan, Pengangkutan, Pengolahan, Pemanfaatan, Edukasi/Sosialisasi, dll).
   - Menunggu persetujuan DPL.
2. **Pilar 2 (Aksi Lapangan - Logbook Pemanfaatan / KKN)**:
   - Hanya proker yang sudah berstatus **DISETUJUI** yang dapat dipilih oleh mahasiswa saat mengisi Logbook Aksi Pemanfaatan Sampah atau Logbook KKN Harian.
3. **Pilar 3 (Panen & Evaluasi - Hasil & Penilaian)**:
   - Mahasiswa mencatat hasil panen/output (misal: pupuk organik, maggot, atau berat sampah tereduksi).
   - DPL memberikan catatan evaluasi dan penilaian akhir program kerja (skorPenilaian 0–100).

---

## 2. State Machine & Siklus Status Proker

Program Kerja memiliki 3 dimensi status: **Status Usulan (statusUsulan)**, **Status Pelaksanaan (statusPelaksanaan)**, dan **Status Penilaian (statusPenilaian)**.

`mermaid
stateDiagram-v2
    [*] --> BELUM_DISETUJUI: Mahasiswa Mengajukan Proker

    state "Menunggu Review DPL" as BELUM_DISETUJUI
    state "Perlu Revisi" as PERLU_REVISI_DPL
    state "Ditolak" as DITOLAK
    state "Disetujui" as DISETUJUI

    BELUM_DISETUJUI --> DISETUJUI: DPL Menyetujui (Acc)
    BELUM_DISETUJUI --> PERLU_REVISI_DPL: DPL Minta Revisi + Catatan
    BELUM_DISETUJUI --> DITOLAK: DPL Menolak + Alasan

    PERLU_REVISI_DPL --> BELUM_DISETUJUI: Mahasiswa Edit & Submit Ulang
    DITOLAK --> BELUM_DISETUJUI: Mahasiswa Ajukan Ulang

    state DISETUJUI {
        [*] --> BELUM_MULAI
        BELUM_MULAI --> SEDANG_BERJALAN: Diisi Logbook / Dimulai
        SEDANG_BERJALAN --> SELESAI: Panen Tercatat / Selesai
    }

    SELESAI --> DINILAI: DPL Mengisi Nilai & Evaluasi
`

### Matriks Aturan Status Proker

| Status Usulan | Hak Edit Mahasiswa | Muncul di Dropdown Logbook? | Keterangan |
| :--- | :---: | :---: | :--- |
| BELUM_DISETUJUI | ✅ **Bisa Edit / Hapus** | ❌ Tidak | Menunggu ditinjau oleh DPL. |
| PERLU_REVISI_DPL | ✅ **Wajib Revisi** | ❌ Tidak | DPL memberikan catatan revisi pada catatanDpl. |
| DITOLAK | ✅ **Bisa Ajukan Ulang** | ❌ Tidak | DPL menolak usulan dengan alasan di catatanDpl. |
| DISETUJUI | 🔒 **Terkunci** | ✅ **Ya, Aktif** | Siap dieksekusi mahasiswa dalam form logbook/pemanfaatan. |

---

## 3. Alur Layar (Screen Flow) pada Aplikasi Mobile

### 3.1 Diagram Navigasi Layar

`mermaid
graph TD
    Home["🏠 Dashboard Mahasiswa<br/>(MahasiswaView)"] -->|Tap 'Program Kerja'| DataProker["📋 Daftar Proker Saya<br/>(DataProkerView)"]
    
    DataProker -->|Tap '+ Ajukan Proker'| FormProker["📝 Form Pengajuan Proker<br/>(PengajuanProgramKerjaView)"]
    DataProker -->|Tap 'Edit / Revisi'| FormProkerEdit["✏️ Form Edit Proker<br/>(PengajuanProgramKerjaView - Edit Mode)"]
    DataProker -->|Tap Kartu Proker| DetailProker["🔍 Detail Proker & Logbook Terkait"]

    Home -->|Tap 'Pilar 2: Aksi Pemanfaatan'| FormLogbook["♻️ Form Logbook Pemanfaatan<br/>(PemanfaatanSampahView)"]
    FormLogbook -->|Dropdown Proker| FilterProker["⚡ Filter: Hanya Proker Status 'DISETUJUI'"]
`

### 3.2 Rincian Fitur per Layar

#### 1. Layar Daftar Proker (DataProkerView)
- **Fungsi**: Menampilkan daftar seluruh proker kelompok mahasiswa yang sedang login.
- **Elemen UI**:
  - Badge Kategori (Pemilahan, Pengangkutan, Pengolahan, Pemanfaatan, Edukasi & Sosialisasi, Lainnya).
  - Badge Status Usulan:
    * Disetujui DPL (Hijau)
    * Menunggu (Kuning)
    * Perlu Revisi (Oranye)
    * Ditolak (Merah)
  - Box Catatan DPL (muncul jika ada revisi/penolakan atau feedback DPL).
  - Tombol Aksi:
    * Tombol **"Revisi Sekarang" / "Edit Proker"** (Hanya tampil jika status belum disetujui / revisi / ditolak).
  - FAB **"+ Ajukan Proker"**.

#### 2. Layar Form Pengajuan / Edit Proker (PengajuanProgramKerjaView)
- **Field yang diinput**:
  1. **Judul Program Kerja** *(Wajib)*: Contoh: "Pembuatan Kompos Takakura RT 02"
  2. **Kategori Proker** *(Wajib)*: Pilihan Radio/Card:
     - Pemilahan
     - Pengangkutan
     - Pengolahan
     - Pemanfaatan
     - Edukasi & Sosialisasi
     - Lainnya
  3. **Rencana Anggaran (Rp)** *(Opsional)*: Input nominal biaya (format ribuan otomatis).
  4. **Target Waktu Pelaksanaan** *(Wajib)*: Tanggal Mulai s/d Tanggal Selesai (Date Picker).
  5. **Deskripsi & Rencana Kegiatan** *(Wajib)*: Rincian latar belakang, tahapan pelaksanaan, target sasaran.
  6. **Link Google Drive** *(Opsional)*: Link folder dokumen pendukung.
  7. **Lampiran Berkas (PDF / Foto)** *(Opsional)*: File picker untuk upload berkas proposal/skema.

#### 3. Keterkaitan dengan Form Logbook Aksi (PemanfaatanSampahView / LogbookKknView)
- Saat mahasiswa membuka form pencatatan aksi:
  - Terdapat dropdown **"Pilih Program Kerja Terkait"**.
  - **LOGIKA WAJIB**: Hanya load dan tampilkan proker yang memiliki statusUsulan == 'DISETUJUI' (atau status legacy APPROVED/DITERIMA).
  - Ketika dipilih, programKerjaId dikirim dalam payload pembuatan logbook.

---

## 4. Spesifikasi Kontrak API Backend (Cheat Sheet Mobile)

### 4.1 Get List Program Kerja
- **Endpoint**: GET /api/v1/kkn/program-kerja
- **Header**: Authorization: Bearer <TOKEN>
- **Response Success (200 OK)**:
`json
{
  "success": true,
  "data": [
    {
      "id": "c7a8e912-3b4c-4e89-8b01-123456789abc",
      "nomor": 1,
      "judul": "Sosialisasi Pemilahan Sampah Organik RT 01",
      "deskripsi": "Kegiatan edukasi pemilahan sampah dapur dari sumbernya...",
      "kategori": "EDUKASI_SOSIALISASI",
      "sumber": "MAHASISWA",
      "waktuPelaksanaan": "2026-09-10 s/d 2026-09-15",
      "kebutuhanBiaya": 150000,
      "linkGoogleDrive": "https://drive.google.com/...",
      "attachmentFile": "/uploads/kkn/proposal-123.pdf",
      "hasAttachment": true,
      "status": "APPROVED",
      "statusUsulan": "DISETUJUI",
      "statusPelaksanaan": "SEDANG_BERJALAN",
      "catatanDpl": "Bagus, koordinasikan dengan Ketua RW setempat.",
      "skorPenilaian": 88,
      "predikat": "Sangat Baik",
      "statusPenilaian": "DINILAI",
      "totalLogbookTerkait": 3,
      "penginput": {
        "nama": "Ahmad Fauzi",
        "nim": "10121001",
        "isKetua": false
      },
      "createdAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
`

---

### 4.2 Pengajuan Program Kerja Baru
- **Endpoint**: POST /api/v1/kkn/program-kerja
- **Header**: Authorization: Bearer <TOKEN>
- **Content-Type**: multipart/form-data atau pplication/json
- **Request Body**:
`json
{
  "judul": "Pembangunan Lubang Resapan Biopori",
  "kategori": "PEMANFAATAN",
  "rencanaAnggaran": 250000,
  "targetTanggal": "2026-09-15 s/d 2026-09-20",
  "deskripsi": "Pembuatan 10 titik biopori di area taman RW 03 untuk resapan sampah organik.",
  "linkGoogleDrive": "https://drive.google.com/drive/folders/...",
  "filePdf": "<Optional: File Upload PDF / Gambar>"
}
`
- **Response Success (201 Created / 200 OK)**:
`json
{
  "success": true,
  "message": "Program kerja berhasil diajukan",
  "data": {
    "id": "c7a8e912-3b4c-4e89-8b01-123456789abc",
    "statusUsulan": "BELUM_DISETUJUI",
    "statusPelaksanaan": "BELUM_MULAI"
  }
}
`

---

### 4.3 Edit / Revisi Program Kerja
- **Endpoint**: PUT /api/v1/kkn/program-kerja/:id
- **Header**: Authorization: Bearer <TOKEN>
- **Content-Type**: multipart/form-data atau pplication/json
- **Kondisi**: Hanya bisa dilakukan jika status masih BELUM_DISETUJUI, PERLU_REVISI_DPL, atau DITOLAK.
- **Request Body**:
`json
{
  "judul": "Pembangunan Lubang Resapan Biopori (Revisi Titik)",
  "kategori": "PEMANFAATAN",
  "rencanaAnggaran": 200000,
  "targetTanggal": "2026-09-18 s/d 2026-09-22",
  "deskripsi": "Revisi titik penempatan menjadi 8 titik sesuai arahan DPL.",
  "linkGoogleDrive": "https://drive.google.com/...",
  "statusUsulan": "BELUM_DISETUJUI"
}
`

---

### 4.4 Hapus Program Kerja
- **Endpoint**: DELETE /api/v1/kkn/program-kerja/:id
- **Header**: Authorization: Bearer <TOKEN>
- **Response Success (200 OK)**:
`json
{
  "success": true,
  "message": "Program kerja berhasil dihapus"
}
`

---

## 5. Ringkasan Checklist untuk Mobile Developer

1. ✅ **Akses Pengajuan**: Semua anggota kelompok (bukan hanya Ketua) dapat mengajukan proker.
2. ✅ **Badge Status**: Tampilkan badge status usulan (Menunggu, Disetujui, Perlu Revisi, Ditolak) pada kartu proker.
3. ✅ **Catatan DPL**: Selalu tampilkan box catatanDpl jika ada catatan revisi/feedback dari dosen pembimbing.
4. ✅ **Tombol Edit / Revisi**:
   - Tampilkan jika statusUsulan != 'DISETUJUI'.
   - Sembunyikan jika statusUsulan == 'DISETUJUI'.
5. ✅ **Dropdown Form Logbook**: Filter daftar proker agar hanya proker yang sudah berstatus DISETUJUI yang dapat dipilih sebagai induk logbook.
6. ✅ **Handling Upload File**: Mendukung upload file PDF/Foto atau input tautan Google Drive sebagai alternatif berkas lampiran proposal.
