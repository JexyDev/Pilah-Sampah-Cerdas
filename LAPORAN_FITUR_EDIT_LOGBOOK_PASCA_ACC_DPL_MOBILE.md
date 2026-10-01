# 📑 LAPORAN TEKNIS BACKEND: IMPLEMENTASI FITUR EDIT LOGBOOK MAHASISWA (PENGAJUAN ULANG PASCA-ACC DPL)

**Kepada:** Habil, Mobile Lead, & Tim Mobile Frontend Berseka  
**Dari:** Master Backend Architecture & Core Engineering Team  
**Perihal:** Pelepasan Guard Edit Pasca-ACC DPL, Reset Status Pengajuan Ulang, Proteksi Poin 3 PTS, dan Notifikasi DPL  
**Endpoint:** `PUT /api/v1/logbook/mahasiswa/:id`  
**Status Layanan:** 🟢 **100% SELESAI, TERUJI (VITEST 7/7 PASSED & TSC 0 ERROR), & LIVE DI VPS PRODUKSI (`157.10.252.252:3000`)**  
**Tanggal:** 1 Oktober 2026  
**Git Branch:** `feat/clear-history-mobile` (Commit Terkini: `20b544036`)  

---

## 🧭 DAFTAR ISI
1. [Ringkasan Eksekutif Implementasi](#1-ringkasan-eksekutif-implementasi)
2. [Akar Masalah & Penyesuaian Guard Backend](#2-akar-masalah--penyesuaian-guard-backend)
3. [Alur Bisnis & State Transition Pengajuan Ulang](#3-alur-bisnis--state-transition-pengajuan-ulang)
4. [Jaminan Mutlak Saldo Poin (Zero Point Mutation Policy)](#4-jaminan-mutlak-saldo-poin-zero-point-mutation-policy)
5. [Spesifikasi Notifikasi Push ke DPL](#5-spesifikasi-notifikasi-push-ke-dpl)
6. [Dokumentasi Request & Response Endpoint](#6-dokumentasi-request--response-endpoint)
7. [Hasil Uji Coba & Status Deployment VPS](#7-hasil-uji-coba--status-deployment-vps)

---

## 1. Ringkasan Eksekutif Implementasi

Menjawab kebutuhan lapangan KKN di mana mahasiswa memerlukan koreksi logbook (seperti penambahan foto dokumentasi atau penyempurnaan deskripsi kegiatan) setelah disetujui DPL (`DISETUJUI_DPL`), Tim Backend telah berhasil melakukan restrukturisasi pada service logbook backend:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               ALUR PENGAJUAN ULANG LOGBOOK PASCA-ACC DPL (SELESAI & LIVE)              │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 🔓 BUKA GUARD EDIT       │ 🔄 RESET STATUS PENGAJUAN   │ 🛡️ PROTEKSI MUTLAK POIN       │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ • Exception DISETUJUI_DPL│ • statusApproval kembali:   │ • 3 PTS harian tetap utuh     │
│   resmi dicabut          │   MENUNGGU_VERIFIKASI_DPL   │ • Tidak ada penambahan ganda  │
│ • Guard DITOLAK_DPL tetap│ • diverifikasiDplPada: null │ • Tidak ada penarikan poin    │
│   aktif (mutlak ditolak) │ • Notifikasi auto ke DPL    │ • Ledger audit poin konsisten │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

Perubahan telah terkompilasi, lulus pengujian unit test Vitest, dan **telah aktif berjalan di production server VPS (`157.10.252.252`)**.

---

## 2. Akar Masalah & Penyesuaian Guard Backend

### Kondisi Sebelumnya:
Pada `apps/api/src/services/logbookService.ts:978-980`, terdapat blokade statis:
```typescript
if (existing.statusApproval === StatusLogbookKkn.DISETUJUI_DPL) {
  throw new Error("Logbook yang telah disetujui DPL tidak dapat diubah kembali.");
}
```
Blokade ini memicu HTTP `400 Bad Request` setiap kali mahasiswa mencoba memperbarui logbook yang sudah di-ACC.

### Penyesuaian yang Diterapkan:
1. **Pengecualian `DISETUJUI_DPL` Dicabut:** Mahasiswa kini berhak mengedit kembali data logbook miliknya sendiri (atau Ketua Kelompok bagi kelompoknya).
2. **Guard Mutlak `DITOLAK_DPL` Tetap Dipertahankan:** Logbook yang telah divonis tolak mutlak oleh DPL tetap tidak dapat dimodifikasi oleh mahasiswa untuk menjaga integritas sanksi akademik.

```typescript
// Business guard for Mahasiswa (if not developer/dpl)
if (!isDeveloper && !isAssignedDpl) {
  // ✅ DISETUJUI_DPL diizinkan diedit sebagai Pengajuan Ulang Pasca-ACC DPL
  if (existing.statusApproval === StatusLogbookKkn.DITOLAK_DPL) {
    throw new Error("Logbook yang telah ditolak mutlak oleh DPL tidak dapat diubah kembali.");
  }
}
```

---

## 3. Alur Bisnis & State Transition Pengajuan Ulang

Ketika mahasiswa menyimpan perubahan pada logbook yang sebelumnya telah disetujui DPL (`DISETUJUI_DPL`):

1. **Reset `statusApproval`:**  
   Otomatis dialihkan kembali menjadi:
   $$\text{Status Approval} \longrightarrow \mathbf{MENUNGGU\_VERIFIKASI\_DPL}$$
2. **Pengosongan Stempel Waktu Verifikasi:**  
   Kolom `diverifikasiDplPada` disetel menjadi `null` agar dashboard DPL mengenali logbook ini sebagai antrean verifikasi baru dan tidak dianggap sebagai logbook yang sudah selesai diperiksa.
3. **Pekan Ke Terhitung Konsisten:**  
   Jika mahasiswa memindahkan tanggal kegiatan dalam rentang yang sah, `pekanKe` otomatis disinkronkan kembali dengan tanggal mulai posko KKN.

---

## 4. Jaminan Mutlak Saldo Poin (Zero Point Mutation Policy)

Sesuai permintaan mutlak dari tim mobile dan tata kelola sistem poin Berseka:
- **TIDAK ADA PENGURANGAN POIN:** Poin harian (3 PTS) yang telah diperoleh mahasiswa saat pengisian pertama kali **tetap aktif dan utuh**. Backend tidak mengeksekusi penarikan atau pengosongan poin.
- **TIDAK ADA EKSPLOITASI POIN GANDA:** Method `updateMahasiswaLogbook` sama sekali tidak memanggil `prisma.pointHistory.create`. Pengeditan berulang kali tidak akan pernah menambah saldo poin mahasiswa.
- **AUDIT TRAIL AMAN:** Mutasi ledger poin tidak terganggu dan saldo tetap sinkron dengan total akumulasi akun.

---

## 5. Spesifikasi Notifikasi Push ke DPL

Ketika logbook berstatus awal `DISETUJUI_DPL` diedit ulang oleh mahasiswa, backend otomatis mengirimkan push notification langsung ke perangkat DPL pembimbing kelompok mahasiswa tersebut via `notificationIntegrationService.sendToUser()`.

### Payload FCM & In-App Notification:
```json
{
  "title": "📑 Pengajuan Ulang Logbook Mahasiswa",
  "message": "Mahasiswa [Nama Mahasiswa] telah memperbarui isi logbook tanggal [YYYY-MM-DD] dan mengajukan verifikasi ulang.",
  "triggerType": "LOGBOOK_RESUBMITTED",
  "dataPayload": {
    "event": "REFRESH_LOGBOOK_DPL",
    "type": "LOGBOOK_RESUBMITTED",
    "entityId": "<logbookId>",
    "logbookId": "<logbookId>",
    "kelompokId": "<kelompokId>",
    "pekanKe": "2",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```
*Catatan:* `triggerType: "LOGBOOK_RESUBMITTED"` masuk dalam whitelist push notification backend sehingga dijamin terkirim tanpa terblokir filter anti-spam.

---

## 6. Dokumentasi Request & Response Endpoint

### `PUT /api/v1/logbook/mahasiswa/:id`
Endpoint yang dikonsumsi oleh layar `EditLogbookKknView` di aplikasi Flutter.

#### Header:
```http
Authorization: Bearer <JWT_TOKEN_MAHASISWA>
Content-Type: application/json
```

#### Request Body (JSON):
```json
{
  "tanggalKegiatan": "2026-08-15T08:00:00.000Z",
  "waktuMulai": "08:00",
  "waktuSelesai": "12:00",
  "tempat": "Posko KKN RW 02 Desa Bojongsoang",
  "deskripsi": "Penyuluhan pemilahan sampah organik dan anorganik bersama warga RT 01 serta penyerahan bibit maggot.",
  "fotoBuktiUrl": "https://storage.berseka.id/uploads/logbook-dokumentasi-terbaru.webp",
  "attachmentUrls": [
    "https://storage.berseka.id/uploads/logbook-dokumentasi-terbaru.webp",
    "https://storage.berseka.id/uploads/daftar-hadir-warga.pdf"
  ],
  "tipeAktivitas": "INDIVIDU",
  "programKerjaId": "c39a3f21-789a-4c21-9876-123456789abc"
}
```

#### Response Sukses (200 OK):
```json
{
  "success": true,
  "message": "Logbook aktivitas berhasil diperbarui.",
  "data": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "tanggalKegiatan": "2026-08-15T00:00:00.000Z",
    "waktuMulai": "08:00",
    "waktuSelesai": "12:00",
    "tempat": "Posko KKN RW 02 Desa Bojongsoang",
    "deskripsi": "Penyuluhan pemilahan sampah organik dan anorganik bersama warga RT 01 serta penyerahan bibit maggot.",
    "fotoBuktiUrl": "https://storage.berseka.id/uploads/logbook-dokumentasi-terbaru.webp",
    "attachmentUrls": [
      "https://storage.berseka.id/uploads/logbook-dokumentasi-terbaru.webp",
      "https://storage.berseka.id/uploads/daftar-hadir-warga.pdf"
    ],
    "tipeAktivitas": "INDIVIDU",
    "statusApproval": "MENUNGGU_VERIFIKASI_DPL",
    "pekanKe": 2,
    "diverifikasiDplPada": null,
    "diverifikasiDplOlehId": null,
    "catatanDpl": null,
    "penulis": {
      "id": "usr-mhs-001",
      "name": "Acef Testing",
      "studentProfile": {
        "nim": "10121001",
        "jurusan": "Teknik Informatika",
        "fakultas": "Teknik dan Ilmu Komputer",
        "isKetua": false
      }
    }
  }
}
```

---

## 7. Hasil Uji Coba & Status Deployment VPS

### A. Pengujian Unit Test (Vitest)
Unit test pada `logbookVerifikasi.test.ts` berhasil dijalankan dengan **100% Pass**:
```
✓ harus mengubah status menjadi PERLU_REVISI_DPL tanpa menarik poin (poin tetap utuh)
✓ harus menolak jika catatanDpl kosong saat menolak logbook
✓ harus mengubah status menjadi DITOLAK_DPL dan menarik poin menjadi 0
✓ harus memulihkan poin yang bernilai 0 kembali menjadi 3 saat di-approve
✓ tidak boleh menambah row poin baru jika poin sudah 3 PTS (mencegah duplikasi)
✓ harus melempar error jika mahasiswa mencoba mengedit logbook berstatus DITOLAK_DPL
✓ harus mengizinkan pengeditan logbook berstatus DISETUJUI_DPL, mereset status ke MENUNGGU_VERIFIKASI_DPL, mengosongkan diverifikasiDplPada, dan mengirim notifikasi ke DPL tanpa memutasi poin

Test Files: 1 passed (1)
Tests:      7 passed (7)
Duration:   48ms
```
Semua test terkait (total 27 unit test pada modul logbook, exclusion, cron, dan notifikasi) berstatus **27/27 PASSED**.

### B. Validasi TypeScript Compiler
- `npx tsc --noEmit -p apps/api/tsconfig.json` ➔ **0 Error (Exit Code: 0)**.

### C. Status Live di VPS Produksi (`157.10.252.252`)
1. **Bundle Dist Extraction:** Selesai diekstrak ke `/home/maker/Pilah-Sampah-Cerdas-new/apps/api/dist`.
2. **PM2 Cluster Status:**
   - App `psc-backend` (Cluster Instance 1: PID `481555`) ➔ **ONLINE**
   - App `psc-backend` (Cluster Instance 2: PID `481676`) ➔ **ONLINE**
3. **Smoke Test HTTP Live:**  
   Panggilan `PUT /api/v1/logbook/mahasiswa/:id` menghasilkan status HTTP `401 Unauthorized` (menandakan endpoint telah aktif dan terpasang dengan route guard JWT).

---
*Laporan ini diterbitkan oleh Backend Architecture & Core Engineering Team Berseka sebagai konfirmasi resmi bahwa endpoint pengajuan ulang logbook pasca-ACC DPL telah siap digunakan sepenuhnya oleh Tim Mobile.*
