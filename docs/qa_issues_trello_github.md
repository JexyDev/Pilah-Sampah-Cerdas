# QA Issues & Trello Board Sync Log — Pilah Sampah Cerdas

Dokumen ini mencatat seluruh temuan bug dan ketidaksesuaian spesifikasi yang ditemukan selama proses Quality Control (QC) yang dilakukan oleh QA Lead.

---

## 🔴 [BUG-001] Missing Backend Geofencing Validation
- **Platform:** Backend
- **Severity:** Critical (Blocker)
- **Status:** Open
- **Trello Link:** [Card #001](https://trello.com/c/97Jqheto)
- **Deskripsi:** 
  Backend menerima data setoran tanpa memvalidasi geofencing (jarak). Spesifikasi (SRS FR-02 & SDD §4.2) menyatakan bahwa sistem harus menolak transaksi jika jarak GPS handphone warga dengan lokasi tong sampah melebihi 10 meter menggunakan rumus Haversine. Saat ini backend mengabaikan koordinat GPS warga (`userLat`, `userLng`).
- **Langkah Reproduksi:**
  1. Kirim POST request ke `/api/v1/transactions/setor` dengan koordinat jauh di luar Kecamatan Coblong (misal: Jakarta).
  2. Request sukses diterima dan mendapatkan poin.
- **Expected Result:** API mengembalikan HTTP 400 dengan error `LOCATION_OUT_OF_RANGE`.
- **Actual Result:** API mengembalikan HTTP 200 (Sukses).

---

## 🟡 [BUG-002] AI API Contract Schema Mismatch & Client Local Mock
- **Platform:** Backend & Mobile
- **Severity:** High
- **Status:** Open
- **Trello Link:** [Card #002](https://trello.com/c/e86j1KGC)
- **Deskripsi:**
  Terdapat ketidaksesuaian nama field API antara backend dan SDD §3.1. Backend menggunakan `jenis_sampah` dan `estimasi_volume` di `/api/v1/ai/predict`, sedangkan SDD mendefinisikan `/api/v1/waste/detect-mock` dengan output `detectedType` dan `volumeEstimate`. Selain itu, aplikasi mobile masih memakai mock lokal internal bukan memanggil API live.
- **Expected Result:** Mobile melakukan POST request ke endpoint backend terstandarisasi SDD.
- **Actual Result:** Mobile menggunakan mock lokal `Future.delayed`, backend memakai field Indonesia.

---

## 🟡 [BUG-003] Incorrect Point Reward Calculation Formula
- **Platform:** Backend
- **Severity:** High
- **Status:** Open
- **Trello Link:** [Card #003](https://trello.com/c/KJqdP7cs)
- **Deskripsi:**
  Perhitungan poin di backend tidak sesuai dengan formula matematika di SRS FR-03. Backend memberikan poin statis 100/150. SRS mewajibkan konversi liter ke kilogram terlebih dahulu (`ORGANIC = 0.4 kg/L`, `NON_ORGANIC = 0.2 kg/L`) baru dikalikan 100 poin per kg.
- **Expected Result:** Setoran 10L organik = 4 kg = 400 poin.
- **Actual Result:** Setoran organik apa pun mendapatkan poin statis 100 poin.

---

## 🟡 [BUG-004] Missing "Tong Penuh" Notification Event Trigger
- **Platform:** Backend
- **Severity:** High
- **Status:** Open
- **Trello Link:** [Card #004](https://trello.com/c/dB6o3on6)
- **Deskripsi:**
  Spesifikasi FR-04 menyatakan bahwa sistem harus mengirim notifikasi ke database/FCM jika kapasitas tong melebihi 90% (Kritis). Saat ini backend hanya mengubah status status bin di memory `db.ts` tanpa meng-insert log ke array `notifications` atau memicu FCM push.
- **Expected Result:** Insert data ke array `notifications` dengan tipe `TONG_PENUH` saat kapasitas >90%.
- **Actual Result:** Tidak ada penambahan data ke notifikasi warga maupun admin.

---

## 🟢 [BUG-005] Missing Live Monitoring Geospatial Endpoint
- **Platform:** Backend
- **Severity:** Medium
- **Status:** Open
- **Trello Link:** [Card #005](https://trello.com/c/wjfrx7Qf)
- **Deskripsi:**
  Endpoint `GET /api/v1/monitoring/live` tidak diimplementasikan. Frontend saat ini memanggil `/bins` yang terpaksa dimodifikasi untuk me-return data koordinat mock agar halaman geospatial Leaflet di web tidak crash/kosong.
- **Expected Result:** Endpoint `/monitoring/live` menyajikan data spasial secara dinamis.
- **Actual Result:** Route monitoring/live tidak terdaftar di `index.ts` backend.

---

## 🔴 [BUG-006] Security: Missing Route Authentication and Rate Limiting
- **Platform:** Backend
- **Severity:** Critical
- **Status:** Open
- **Trello Link:** [Card #006](https://trello.com/c/OpBlhO4G)
- **Deskripsi:**
  Seluruh endpoint transaksi backend (`/bins/scan`, `/bins/reset-request`) tidak dilengkapi dengan verifikasi JWT middleware. Siapa pun dapat menembak endpoint tersebut tanpa header token. Selain itu, endpoint `/auth/login` tidak menggunakan rate-limiting middleware (spec: maks 5 gagal / 15 mnt).
- **Expected Result:** Middleware validasi JWT memblokir request tanpa token dengan status 401/403.
- **Actual Result:** Semua request write/transaksi lolos secara bebas.
