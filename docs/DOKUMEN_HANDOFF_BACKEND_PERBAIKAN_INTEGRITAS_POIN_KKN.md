# 📄 DOKUMEN HANDOFF BACKEND: PERBAIKAN INTEGRITAS POIN KKN
**Kepada:** Tim Backend Developer  
**Dari:** Tim Mobile & QC  
**Tanggal:** 18 September 2026  

Terdapat **2 (dua) isu kritikal** terkait integritas data poin di sisi *backend* yang menyebabkan anomali pada aplikasi Mobile. Aplikasi Mobile saat ini bertindak sebagai *dumb client* yang hanya merender data dari API, sehingga perbaikan wajib dilakukan di level *database* dan API.

---

## ISU #1: Korupsi Data Migrasi `PointHistory` (500+ Akun Lama)
**Status: KRITIS (Mempengaruhi Nilai Asli)**

**Masalah:** 
Pada dasarnya, setiap mahasiswa memiliki **jejak riwayat asli yang berbeda-beda** di *database* (tergantung kapan mereka pertama kali turun ke lapangan, misal: ada yang mulai tanggal 20, ada yang tanggal 28, dsb). Namun, *script* migrasi ke sistem poin baru ternyata mengabaikan fakta tersebut. 

*Script* migrasi memukul rata (*hardcode*) rekam jejak 500+ mahasiswa lama sehingga di *PointHistory* semuanya terlihat sama persis: seolah-olah mulai serempak pada **26 Agustus** dengan presensi sempurna.

**Contoh Kasus:** 
M. Dafa (Ketua Kelompok). Berdasarkan hitungan manual Tim QC dari data riil, poin Dafa seharusnya hanya **118 Poin**. Namun di Mobile (yang membaca tabel `PointHistory`), poinnya membengkak jadi **140 Poin**. Ini terjadi karena Dafa mendapat "poin siluman" dari presensi fiktif tanggal 26 Agustus yang dipaksakan oleh *script* migrasi tersebut. 

**Instruksi Eksekusi (Script Backfill):**
Buat dan jalankan *script* perbaikan darurat untuk 500+ akun terdampak dengan alur berikut:
1. **Wipe:** Hapus riwayat `PointHistory` harian mereka yang cacat (Check-in, Check-out, Logbook). *(Kecuali poin Reduksi Tonase).*
2. **Re-seed (Generate Ulang Sesuai Realita):** Lakukan *looping* ke tabel **`KknAttendance`**. Jika mahasiswa A *status = HADIR* di tanggal 28, baru buatkan baris `KKN_PRESENSI_HADIR` di `PointHistory` menggunakan *timestamp* asli dari `waktuMulai` tersebut. (Lakukan hal yang sama untuk Durasi dan `LogbookKkn`).
3. **Recalculate:** Biarkan sistem menghitung ulang poin berdasarkan data historis yang sudah jujur dan sesuai dengan riwayat masing-masing anak.

---

## ISU #2: Kebocoran Riwayat `KKN_PROKER` ke UI Poin Individu
**Status: BUG API**

**Masalah:**
Fungsi `calculateValidIndividualPoints` sudah sangat baik dalam memblokir `KKN_PROKER` agar tidak menambah saldo individu. **TAPI**, fungsi penarik riwayatnya (`getHistoryByUserId`) belum di-filter. Akibatnya, API `/api/v1/points/me` masih mengirimkan baris "+2 PTS Proker" ke UI Poin Individu di Mobile. Ini membuat mahasiswa bingung karena ada riwayat poin masuk tapi total saldo tidak bertambah.

**Instruksi Eksekusi:**
Filter kategori Proker langsung dari repositori agar *payload* API 100% steril dari aktivitas kelompok.
* **File:** `apps/api/src/repositories/pointRepository.ts`
* **Fungsi:** `getHistoryByUserId`
* **Perubahan Kode:**
```typescript
  async getHistoryByUserId(userId: string): Promise<PointHistory[]> {
    return db.pointHistory.findMany({
      where: { 
        userId,
        // TAMBAHKAN BARIS INI: Proteksi anti-bocor Proker ke UI Individu
        kategori: { notIn: ["KKN_PROKER"] } 
      },
      orderBy: { createdAt: "desc" },
    });
  }
```

---

**Kesimpulan:**
Setelah kedua instruksi di atas dieksekusi di *backend*, aplikasi Mobile akan otomatis sembuh (Poin Dafa dan mahasiswa lain akan akurat sesuai tanggal mulai aslinya, serta riwayat Proker akan hilang dari tab Individu) **tanpa perlu ada *update* APK / *coding* tambahan di sisi Mobile**. 
