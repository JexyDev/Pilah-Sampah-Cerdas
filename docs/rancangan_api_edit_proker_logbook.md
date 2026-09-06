# Rancangan Kebutuhan API Backend (Edit Proker & Logbook)

Dokumen ini berisi spesifikasi API yang perlu dibuat oleh tim Backend agar fitur Edit (Program Kerja & Logbook) dapat berjalan di aplikasi Mobile.

## 1. Edit Program Kerja KKN

**Endpoint:** `PUT /api/v1/kkn/program-kerja/:id`
**Deskripsi:** Memperbarui data Program Kerja KKN milik mahasiswa.
**Kondisi (Business Logic):** Hanya bisa diedit jika status usulan masih `BELUM_DISETUJUI`. Jika sudah `DISETUJUI`, usulan tidak dapat diubah (atau sesuaikan dengan kebijakan KKN).

**Request Form-Data / JSON:**
```json
{
  "judul": "Program Kerja A (Update)", // Di-mapping ke field 'deskripsi'
  "nomor": 1,
  "kategori": "FISIK", // FISIK, NON_FISIK, LAINNYA
  "sumber": "MAHASISWA", // MAHASISWA, WARGA, DPL
  "waktuPelaksanaan": "Minggu Ke-1",
  "linkGoogleDrive": "https://drive.google.com/...",
  "kebutuhanBiaya": 150000,
  "filePdf": "<Optional: File Upload Baru jika diubah>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Program kerja berhasil diperbarui",
  "data": {
    "id": "abc-123",
    "status": "BELUM_DISETUJUI"
  }
}
```

---

## 2. Edit Logbook Pemanfaatan Sampah

**Endpoint:** `PUT /api/v1/kkn/pemanfaatan-sampah/:id`
**Deskripsi:** Memperbarui logbook harian untuk modul Pemanfaatan Sampah (Loseda / Maggot / Kompos).

**Request Form-Data:**
```json
{
  "programKerjaId": "uuid-proker",
  "jenisPemanfaatan": "KOMPOS",
  "kategoriSampah": "ORGANIK",
  "wilayahDampingan": "RT 01 RW 02",
  "waktuPelaksanaan": "2026-08-30T10:00:00Z",
  "linkGoogleDrive": "https://drive.google.com/...",
  "volumeBahanBaku": "10 Kg",
  "volumePanen": "5 Kg", // Opsional
  "catatan": "Catatan kegiatan...",
  "foto": "<Optional: File Gambar jika ada perubahan foto dokumentasi>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logbook pemanfaatan sampah berhasil diperbarui",
  "data": {
    "id": "xyz-456"
  }
}
```

---

## 3. Edit Logbook KKN Harian (Bebas)

**Endpoint:** `PUT /api/v1/kkn/logbook/:id`
**Deskripsi:** Memperbarui data Logbook harian (yang bukan Pemanfaatan Sampah).

**Request Form-Data:**
```json
{
  "tanggalKegiatan": "2026-08-30",
  "waktuMulai": "08:00",
  "waktuSelesai": "12:00",
  "tempat": "Balai Desa",
  "deskripsi": "Gotong royong membersihkan gorong-gorong.",
  "tipeAktivitas": "KELOMPOK", // INDIVIDU atau KELOMPOK
  "programKerjaId": "uuid-proker-opsional", // Jika logbook ditautkan ke proker
  "fotoDokumentasi": "<Optional: Array File Gambar / Single File (jika pengguna mengunggah foto baru)>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logbook berhasil diperbarui",
  "data": {
    "id": "def-789"
  }
}
```

---

> [!IMPORTANT]
> **Catatan untuk Backend Developer:**
> - Jika ada pengunggahan foto/file baru (`filePdf` / `foto` / `fotoDokumentasi`), mohon pastikan API menghapus (unlink) file lama dari Storage (jika di-hosting lokal) atau menimpa URL yang lama.
> - Jika properti upload file bernilai kosong/tidak dilampirkan dari Mobile, maka sistem backend harus **mempertahankan** file/foto yang sudah ada sebelumnya di *database*.
> - Jangan lupa terapkan middleware validasi agar hanya *creator* (mahasiswa pembuat) atau ketua kelompok yang bisa melakukan proses `PUT`.
