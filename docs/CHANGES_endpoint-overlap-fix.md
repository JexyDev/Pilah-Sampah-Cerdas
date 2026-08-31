# Fix: Tumpang Tindih Endpoint Backend API

**Branch:** `fix/mobile-backend-endpoint-overlap`  
**Tanggal:** 2026-08-31  
**Dikerjakan oleh:** Kiro AI + Tim Mobile  
**Kategori:** `fix(api)` — Route deduplication & collision prevention

---

## Latar Belakang Masalah

Audit menyeluruh terhadap 40 file route backend menemukan bahwa beberapa router di-mount ke **lebih dari satu prefix** di `index.ts`, dan beberapa endpoint didefinisikan di **dua router berbeda** dengan handler yang berbeda. Kondisi ini menyebabkan:

1. **Route collision** — request bisa ditangani oleh handler yang salah tergantung urutan mount di Express
2. **Dokumentasi tidak konsisten** — Swagger hanya mendokumentasikan salah satu path
3. **Mobile client hit handler lama** — `POST /api/v1/kkn/location-ping` mengarah ke `updateLocation()` (handler lama) bukan `pingLocation()` (handler baru dengan sync durasi & out-of-zone detection)
4. **Maintenance overhead** — perubahan satu endpoint harus dilakukan di banyak tempat

---

## File yang Diubah

### 1. `apps/api/src/index.ts`

#### Masalah
`kknAttendanceRouter` di-mount ke **root `/api/v1` dan `/api`** sehingga semua route di dalamnya (seperti `/location-ping`, `/kegiatan-aktif`, `/warga-dampingan`) tersedia di path root dan bertabrakan dengan router lain.

```typescript
// SEBELUM — BERMASALAH
app.use("/api/v1/kkn-attendance", kknAttendanceRouter);
app.use("/api/v1", kknAttendanceRouter);   // ← collision masif
app.use("/api/kkn-attendance", kknAttendanceRouter);
app.use("/api", kknAttendanceRouter);       // ← collision masif
```

#### Fix
```typescript
// SESUDAH — AMAN
app.use("/api/v1/kkn-attendance", kknAttendanceRouter);
app.use("/api/kkn-attendance", kknAttendanceRouter);
// Mount ke root /api/v1 dan /api DIHAPUS
```

#### Alias duplikat yang dihapus

| Alias Dihapus | Canonical URL yang Digunakan |
|---|---|
| `app.use("/api/v1/petugas-pemilahan", residuRouter)` | `/api/v1/petugas-residu` |
| `app.use("/api/v1/pemilahan", residuRouter)` | `/api/v1/petugas-residu` |
| `app.use("/api/v1/wilayah", areaRouter)` | `/api/v1/areas` |
| `app.use("/api/v1/rt", rwRouter)` | `/api/v1/rw` |
| `app.use("/api/petugas-pemilahan", residuRouter)` | `/api/petugas-residu` |
| `app.use("/api/pemilahan", residuRouter)` | `/api/petugas-residu` |
| `app.use("/api/wilayah", areaRouter)` | `/api/areas` |
| `app.use("/api/rt", rwRouter)` | `/api/rw` |

---

### 2. `apps/api/src/routes/kknRoutes.ts`

#### Masalah
Route-route berikut didefinisikan di `kknRoutes.ts` dengan handler **lama/berbeda** padahal versi canonical yang lebih lengkap sudah ada di `kknAttendanceRoutes.ts`.

| Route yang Dihapus | Alasan |
|---|---|
| `POST /location-ping` | Handler `updateLocation()` lama, canonical di `kknAttendanceRoutes.ts` pakai `pingLocation()` yang lebih lengkap (sync durasi, smart zone) |
| `GET /kegiatan-aktif` | Duplikat — canonical di `kknAttendanceRoutes.ts` |
| `POST /kegiatan/:id/mulai` | Duplikat — canonical di `kknAttendanceRoutes.ts` |
| `POST /kegiatan/:id/jeda` | Duplikat — canonical di `kknAttendanceRoutes.ts` |
| `POST /kegiatan/:id/selesai` | Duplikat — canonical di `kknAttendanceRoutes.ts` |
| `POST /out-of-zone-violation` | Duplikat — canonical di `kknAttendanceRoutes.ts` |
| `GET /kegiatan/:id/lokasi` (dari array path) | Canonical di `kknAttendanceRoutes.ts`, `/target-lokasi` dipertahankan sebagai alias |

#### Yang Dipertahankan
- `POST /absen` dan `POST /kegiatan/:id/absen` — alias absen tetap di `kknRoutes.ts`
- `POST /attendance/check-in` dan `POST /attendance/check-out` — alias untuk mobile spec
- `GET /target-lokasi` — alias backward-compat untuk client lama
- Semua route non-presensi (warga, posko, kelompok, pemanfaatan, dll) tidak berubah

---

### 3. `apps/api/src/routes/kknAttendanceRoutes.ts`

#### Masalah
Banyak route menggunakan array path yang berisi path bergantung pada root mount. Setelah root mount dihapus dari `index.ts`, path-path ini menjadi redundant atau tidak berguna.

#### Fix: Simplifikasi Array Path

| Sebelum | Sesudah |
|---|---|
| `["/kkn/kegiatan-aktif", "/kegiatan-aktif"]` | `"/kkn/kegiatan-aktif"` |
| `["/kkn/kegiatan/:id/mulai", "/kegiatan/:id/mulai"]` | `"/kkn/kegiatan/:id/mulai"` |
| `["/kkn/kegiatan/:id/selesai", "/kegiatan/:id/selesai"]` | `"/kkn/kegiatan/:id/selesai"` |
| `["/kkn/out-of-zone-violation", "/out-of-zone-violation"]` | `"/kkn/out-of-zone-violation"` |
| `["/kkn/kegiatan/:id/presensi-history", "/kegiatan/:id/presensi-history"]` | `"/kkn/kegiatan/:id/presensi-history"` |
| `["/location-ping", "/kkn/location-ping", "/mahasiswa/location-ping", "/mahasiswa/ping"]` | `["/location-ping", "/kkn/location-ping"]` |
| `["/location-ping/debug", "/kkn/location-ping/debug"]` | `"/kkn/location-ping/debug"` |

#### Tambahan Baru
Route `POST /kkn/kegiatan/:id/jeda` **ditambahkan** ke `kknAttendanceRoutes.ts` karena sebelumnya hanya ada di `kknRoutes.ts` dan ikut dihapus saat deduplication.

---

## Canonical URL Setelah Fix

Semua endpoint presensi KKN kini menggunakan prefix `/api/v1/kkn-attendance/`:

| Fungsi | Method | URL Canonical |
|---|---|---|
| Daftar kegiatan aktif | `GET` | `/api/v1/kkn-attendance/kkn/kegiatan-aktif` |
| Mulai kegiatan | `POST` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/mulai` |
| Jeda kegiatan | `POST` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/jeda` |
| Selesai kegiatan | `POST` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/selesai` |
| Location ping | `POST` | `/api/v1/kkn-attendance/location-ping` |
| Out-of-zone violation | `POST` | `/api/v1/kkn-attendance/kkn/out-of-zone-violation` |
| Riwayat presensi | `GET` | `/api/v1/kkn-attendance/kkn/kegiatan/:id/presensi-history` |
| Debug GPS | `GET` | `/api/v1/kkn-attendance/kkn/location-ping/debug` |

---

## Dampak ke Mobile Client (Flutter)

Mobile client (`ApiEndpoints` di `lib/app/core/values/api_constants.dart`) **tidak perlu diubah** karena semua endpoint yang dipanggil mobile sudah menggunakan path canonical yang benar:

```dart
// api_constants.dart — tidak ada perubahan diperlukan
static const String kknLocationPing = '/kkn/location-ping';
static const String kknKegiatanAktif = '/kkn/kegiatan-aktif';
static const String kknMulaiKegiatan(String id) => '/kkn/kegiatan/$id/mulai';
// dst...
```

Mobile menggunakan base URL `/api/v1/kkn` untuk sebagian besar endpoint KKN (via `kknRouter`) dan `/api/v1/kkn-attendance` untuk endpoint presensi — keduanya masih aktif dan routing-nya sudah tidak conflict.

---

## Testing Checklist

- [ ] `POST /api/v1/auth/login` — login berhasil
- [ ] `GET /api/v1/kkn-attendance/kkn/kegiatan-aktif` — tidak 404, return list kegiatan
- [ ] `POST /api/v1/kkn-attendance/location-ping` — handler `pingLocation()` berjalan (bukan `updateLocation()`)
- [ ] `POST /api/v1/kkn-attendance/kkn/kegiatan/:id/mulai` — mulai kegiatan berhasil
- [ ] `POST /api/v1/kkn-attendance/kkn/kegiatan/:id/jeda` — **endpoint baru**, tidak 404
- [ ] `POST /api/v1/kkn-attendance/kkn/kegiatan/:id/selesai` — selesai kegiatan berhasil
- [ ] `GET /api/v1/petugas-residu/dashboard` — alias tidak kena hapus, masih jalan
- [ ] `GET /api/v1/areas/kecamatan` — alias `/wilayah` dihapus, `/areas` masih jalan
- [ ] `GET /api/v1/rw` — alias `/rt` dihapus, `/rw` masih jalan
- [ ] Mobile app Flutter — tidak ada perubahan endpoint yang diperlukan

---

## Referensi

- Audit endpoint: lihat sesi analisis tumpang tindih di chat Kiro
- File route terdampak: `index.ts`, `kknRoutes.ts`, `kknAttendanceRoutes.ts`
- File mobile tidak berubah: `lib/app/core/values/api_constants.dart`
