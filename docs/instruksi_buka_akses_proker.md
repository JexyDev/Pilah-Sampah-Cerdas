# Instruksi Perubahan Backend: Izin Pengajuan Proker untuk Semua Anggota

Saat ini, fitur pengajuan Program Kerja Kelompok di-batasi **hanya untuk Ketua Kelompok** di sisi backend. Karena batasan ini murni berada di backend (aplikasi mobile sudah menampilkan tombolnya untuk semua anggota), tim backend perlu menghapus validasi tersebut.

Tolong sampaikan instruksi ini ke tim backend agar mereka menerapkan perubahannya di dalam file `main/apps/api/src/services/kknService.ts`.

---

## 🛠️ Langkah Perbaikan pada `kknService.ts`

Cari fungsi `createProgramKerja` (berada di sekitar baris 3107).
Di dalam fungsi tersebut, temukan blok kode evaluasi pengecekan `isKetua` berikut:

**Sebelumnya (Hapus baris kode ini):**
```typescript
    // Evaluasi 26-08-2026: Lapor/Pengajuan Program Kerja Kelompok hanya oleh Ketua Kelompok
    if (!student.isKetua && finalKategori !== "LAPORAN_AKHIR") {
      throw new Error("Akses ditolak: Pengajuan Program Kerja Kelompok hanya dapat dilakukan oleh Ketua Kelompok.");
    }
```

**Ubah menjadi (Hapus atau jadikan komentar):**
```typescript
    // (Dihapus) Semua anggota kelompok sekarang diizinkan untuk mengajukan Program Kerja
    // if (!student.isKetua && finalKategori !== "LAPORAN_AKHIR") {
    //   throw new Error("Akses ditolak: Pengajuan Program Kerja Kelompok hanya dapat dilakukan oleh Ketua Kelompok.");
    // }
```

Setelah kode di atas dihapus atau dijadikan komentar, semua mahasiswa (termasuk anggota biasa) akan langsung bisa mengajukan proker melalui aplikasi mobile tanpa terkena pesan *Error Akses Ditolak*. Tidak ada perubahan yang diperlukan di sisi aplikasi mobile karena tombol pengajuannya memang sudah terbuka untuk semua.
