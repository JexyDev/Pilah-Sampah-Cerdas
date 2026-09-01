# 🚦 Rancangan Fitur: Skip Kegiatan KKN ("Tidak Ada Kegiatan")

> **Versi Dokumen**: 1.0  
> **Tanggal**: 30 Agustus 2026  
> **Dibuat oleh**: Tim Mobile  
> **Ditujukan kepada**: Tim Backend & Tim Mobile

---

## 📌 Latar Belakang

Mahasiswa KKN tidak selalu melakukan kegiatan penuh setiap hari dalam seminggu. Saat ini, jika mahasiswa tidak memulai kegiatan pada hari itu, sistem akan mencatat status **`ALPA` / `TANPA_KETERANGAN`** secara otomatis — yang merugikan mahasiswa yang memang tidak memiliki jadwal kegiatan pada hari tersebut.

Untuk menyelesaikan masalah ini, dibutuhkan fitur **"Skip Kegiatan"** yang memungkinkan pengelola (DPL atau Ketua Kelompok, TBD) untuk menandai satu kegiatan/jadwal dengan status **`TIDAK_ADA_KEGIATAN`**, sehingga mahasiswa yang termasuk dalam jadwal tersebut otomatis terbebas dari kewajiban presensi dan tidak dihitung sebagai Alpa.

---

## 🎯 Tujuan Fitur

- Mencegah mahasiswa mendapat status `ALPA` karena hari tersebut memang tidak ada jadwal kegiatan.
- Memberikan transparansi bagi DPL dan mahasiswa bahwa kegiatan pada hari/jadwal tersebut memang dikosongkan secara resmi.
- Meminimalkan dispute data presensi akibat kondisi lapangan yang tidak dapat diprediksi.

---

## 📐 Rancangan Status Baru

### Status yang Ditambahkan

| Status | Aktor yang Menetapkan | Keterangan |
|---|---|---|
| `TIDAK_ADA_KEGIATAN` | DPL atau Ketua Kelompok | Kegiatan resmi dikosongkan. Mahasiswa tidak perlu hadir. Tidak dihitung Alpa. |

### Aturan Bisnis

1. Status `TIDAK_ADA_KEGIATAN` hanya dapat ditetapkan **sebelum** jadwal dimulai atau **setelah** waktu mulai (dengan grace period yang ditentukan backend).
2. Jika status sudah `TIDAK_ADA_KEGIATAN`, tombol **"Mulai Kegiatan"** di app mahasiswa **tidak tampil / disabled**.
3. Status ini **tidak bisa dibatalkan** oleh mahasiswa biasa — hanya oleh DPL atau Ketua Kelompok melalui flow yang sama.
4. Status ini **tidak mempengaruhi akumulasi skor/poin** mahasiswa (bukan penalti, bukan bonus).
5. Seluruh anggota kelompok dalam jadwal tersebut mendapatkan status `TIDAK_ADA_KEGIATAN` sekaligus.

---

## 🖥️ Kebutuhan Mobile (Flutter)

### Perubahan UI pada `KegiatanKknCard`

**Status display baru:**

| `statusKehadiran` | Tampilan Label | Ikon | Warna |
|---|---|---|---|
| `TIDAK_ADA_KEGIATAN` | "Tidak Ada Kegiatan" | `Icons.event_busy_rounded` | Abu-abu / Neutral |

**Logika tombol:**
- Jika `statusKehadiran == 'TIDAK_ADA_KEGIATAN'` → tombol **disabled** dengan label _"Tidak Ada Kegiatan"_.
- Card menampilkan **chip/badge** berwarna abu-abu gelap bertuliskan **"Tidak Ada Kegiatan"** di header, serupa dengan badge "Alpa" yang sudah ada.

### Halaman Daftar Kegiatan

- Tambahkan handler baru: tombol **"Skip / Tidak Ada Kegiatan"** muncul di card **hanya untuk Ketua Kelompok atau DPL**, saat status masih `null` atau `AKTIF` (kegiatan belum dimulai).
- Tombol tersebut berwarna **abu-abu**, dengan label **"Tandai: Tidak Ada Kegiatan"** dan ikon `event_busy`.
- Setelah ditekan, tampilkan **dialog konfirmasi**:

```
⚠️ Tandai "Tidak Ada Kegiatan"?

Seluruh anggota kelompok pada jadwal ini akan
mendapatkan status "Tidak Ada Kegiatan" dan
tidak diwajibkan hadir. Tindakan ini tidak
dapat dibatalkan oleh mahasiswa.

[Batal]  [Ya, Tandai]
```

### Perubahan di `kkn_location_controller.dart`

1. Tambahkan konstanta string baru:
   ```dart
   static const String kStatusTidakAdaKegiatan = 'TIDAK_ADA_KEGIATAN';
   ```
2. Tambahkan method baru `skipKegiatan(String kegiatanId, String alasan)`:
   - Hit endpoint `POST /kkn/kegiatan/{id}/skip`
   - Update state lokal `activeActivity` dengan `statusKehadiran = 'TIDAK_ADA_KEGIATAN'`
3. Tambahkan kondisi pada `isSuccessAttendance` / `canStart`:
   ```dart
   final isTidakAdaKegiatan = statusKehadiran == 'TIDAK_ADA_KEGIATAN';
   // canStart harus false jika isTidakAdaKegiatan == true
   ```

### Perubahan di `api_kkn_repository.dart`

Tambahkan method baru:
```dart
Future<void> skipKegiatan(String kegiatanId, {String? alasan}) async {
  await apiClient.dio.post(
    '/kkn/kegiatan/$kegiatanId/skip',
    data: {'alasan': alasan ?? 'Tidak ada kegiatan pada hari ini'},
  );
}
```

---

## ⚙️ Kebutuhan Backend

> Lihat **Surat Perintah Tim Backend** di bawah ini untuk spesifikasi lengkap.

### Ringkasan Perubahan Backend

| No | Komponen | Perubahan |
|---|---|---|
| 1 | Database | Tambah nilai enum baru `TIDAK_ADA_KEGIATAN` pada field status presensi/kehadiran |
| 2 | Endpoint Baru | `POST /api/v1/kkn/kegiatan/:id/skip` |
| 3 | Logic Otomatis | Saat kegiatan dikosongkan, set seluruh presensi anggota kelompok menjadi `TIDAK_ADA_KEGIATAN` |
| 4 | RBAC | Hanya `DPL` atau `KETUA_KELOMPOK` yang bisa melakukan skip |
| 5 | Presensi Otomatis | Jika hari sudah lewat dan ada jadwal tanpa sesi presensi, sistem cron **tidak** menandai `ALPA` untuk jadwal yang ber-status `TIDAK_ADA_KEGIATAN` |

---

## 📨 SURAT PERINTAH TIM BACKEND

---

```
================================================================
SURAT PERINTAH PENGEMBANGAN FITUR
Dari  : Tim Mobile KKN
Kepada: Tim Backend KKN
Topik : Implementasi Endpoint "Skip Kegiatan" (TIDAK_ADA_KEGIATAN)
================================================================

Halo Tim Backend! 👋

Kami dari Tim Mobile memerlukan penambahan fitur baru yaitu
kemampuan untuk "skip" atau menandai sebuah jadwal kegiatan KKN
sebagai "Tidak Ada Kegiatan". Fitur ini krusial untuk mencegah
mahasiswa mendapat status ALPA secara tidak adil di hari-hari
yang memang tidak ada program kegiatan.

Berikut spesifikasi teknis lengkapnya:

---

[1] PENAMBAHAN STATUS BARU

Tambahkan nilai baru pada enum/kolom status presensi mahasiswa:

  Nilai : TIDAK_ADA_KEGIATAN
  Makna : Kegiatan resmi dikosongkan. Mahasiswa tidak perlu
          hadir. Status ini BUKAN ALPA dan TIDAK mempengaruhi
          skor/poin negatif mahasiswa.

---

[2] ENDPOINT BARU

  Method : POST
  URL    : /api/v1/kkn/kegiatan/:id/skip
  Auth   : Wajib (JWT Bearer Token)

  RBAC / Izin:
    - Role 'DPL' → boleh skip semua kegiatan kelompok
      binaannya
    - Role 'MAHASISWA' dengan flag `isKetua = true` → boleh
      skip kegiatan kelompoknya sendiri
    - Role 'MAHASISWA' biasa → TOLAK (403 Forbidden)

  Request Body (JSON):
  {
    "alasan": "string (opsional, default: 'Tidak ada kegiatan')"
  }

  Response sukses (200 OK):
  {
    "success": true,
    "message": "Kegiatan berhasil ditandai sebagai Tidak Ada Kegiatan.",
    "data": {
      "kegiatanId": "<id>",
      "jadwalId": "<jadwalId>",
      "statusKegiatan": "TIDAK_ADA_KEGIATAN",
      "totalMahasiswaTerdampak": 8,
      "alasan": "Tidak ada kegiatan",
      "ditandaiOleh": "<userId>",
      "ditandaiPada": "2026-08-30T14:00:00.000Z"
    }
  }

  Response error - sudah BERLANGSUNG (409 Conflict):
  {
    "success": false,
    "message": "Tidak dapat skip kegiatan yang sudah dimulai."
  }

  Response error - tidak punya izin (403 Forbidden):
  {
    "success": false,
    "message": "Anda tidak memiliki izin untuk melewati kegiatan ini."
  }

---

[3] LOGIKA BACKEND YANG DIHARAPKAN

Saat endpoint /skip dipanggil, backend perlu melakukan:

  a) Validasi: Pastikan status kegiatan BELUM 'BERLANGSUNG'
     atau 'SELESAI'. Jika sudah, kembalikan error 409.

  b) Update Jadwal/Sesi:
     Set status kegiatan/jadwal menjadi 'TIDAK_ADA_KEGIATAN'.

  c) Bulk Update Presensi:
     Untuk SEMUA mahasiswa anggota kelompok yang terdaftar
     pada jadwal tersebut, set statusKehadiran mereka menjadi
     'TIDAK_ADA_KEGIATAN'. Jika record presensi belum ada,
     buat record baru dengan status ini.

  d) Catat Audit Log:
     Simpan siapa yang melakukan skip, kapan, dan alasannya.

---

[4] PERUBAHAN CRON JOB (Auto-ALPA)

Saat ini backend kemungkinan memiliki cron job yang secara
otomatis meng-update status presensi menjadi ALPA /
TANPA_KETERANGAN untuk kegiatan yang sudah lewat waktu
namun tidak ada presensi masuk.

Mohon tambahkan kondisi PENGECUALIAN:
  → JANGAN ubah ke ALPA jika statusKehadiran sudah
    'TIDAK_ADA_KEGIATAN'.

  Pseudocode:
  if (kegiatan.sudahLewatWaktu && presensi.status == null) {
    presensi.status = 'ALPA'; // ✅ tetap berlaku
  }
  // Tambahkan guard:
  if (presensi.status == 'TIDAK_ADA_KEGIATAN') {
    return; // ⛔ jangan ubah, biarkan apa adanya
  }

---

[5] PERUBAHAN RESPONSE ENDPOINT YANG SUDAH ADA

Endpoint: GET /api/v1/kkn/kegiatan-aktif

Pastikan respons untuk item kegiatan yang ber-status
TIDAK_ADA_KEGIATAN menyertakan field ini:

  {
    ...data kegiatan lainnya...,
    "statusKehadiran": "TIDAK_ADA_KEGIATAN",
    "keteranganSkip": "Tidak ada kegiatan",
    "skippedBy": "<userId>",
    "skippedAt": "2026-08-30T14:00:00.000Z"
  }

Hal ini penting agar aplikasi mobile dapat menampilkan
informasi yang akurat kepada mahasiswa.

---

[6] TIDAK PERLU DIUBAH (untuk Backend)

Kami TIDAK meminta perubahan pada endpoint-endpoint berikut:
- POST /kkn/kegiatan/:id/mulai
- POST /kkn/kegiatan/:id/selesai
- POST /kkn/kegiatan/:id/jeda
- POST /kkn/location-ping

Seluruh perubahan terbatas pada penambahan endpoint baru
dan penyesuaian logika cron + respons GET kegiatan-aktif.

---

Jika ada pertanyaan atau perlu klarifikasi, silakan hubungi
Tim Mobile. Terima kasih atas kerjasamanya! 🙏

Tim Mobile KKN
================================================================
```

---

## 📋 Checklist Implementasi

### Backend ✅
- [ ] Tambah nilai `TIDAK_ADA_KEGIATAN` pada enum status presensi
- [ ] Buat endpoint `POST /api/v1/kkn/kegiatan/:id/skip`
- [ ] Implementasi RBAC (DPL + Ketua saja)
- [ ] Bulk-update status anggota kelompok
- [ ] Perbaiki guard di cron auto-ALPA
- [ ] Tambah field `keteranganSkip`, `skippedBy`, `skippedAt` ke respons GET kegiatan-aktif
- [ ] Buat audit log untuk tindakan skip

### Mobile ✅
- [ ] Tambah konstanta `kStatusTidakAdaKegiatan` di controller
- [ ] Tambah method `skipKegiatan()` di `api_kkn_repository.dart`
- [ ] Tampilkan badge "Tidak Ada Kegiatan" pada card kegiatan
- [ ] Tampilkan tombol "Tandai: Tidak Ada Kegiatan" untuk Ketua & DPL
- [ ] Buat dialog konfirmasi sebelum submit skip
- [ ] Disable tombol "Mulai Kegiatan" jika statusKehadiran == TIDAK_ADA_KEGIATAN
- [ ] Update teks & ikon untuk status baru di semua kondisi UI
