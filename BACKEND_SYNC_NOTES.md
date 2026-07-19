# Panduan Sinkronisasi Backend Utama (BACKEND_SYNC_NOTES)

Dokumen ini berisi panduan dan checklist untuk menghubungkan aplikasi mobile dengan Backend Utama yang akan datang. Saat ini, aplikasi menggunakan endpoint lokal (di path `/api/v1/*`).

## Checklist Repositori

Periksa file-file di dalam `lib/data/repositories/` dan perhatikan komentar `// TODO-SYNC`:

### 1. `ApiAuthRepository`
- Pastikan endpoint login yang baru di backend sesuai (saat ini `/auth/login`).
- Pastikan response payload dari login mengembalikan `accessToken`, `refreshToken`, dan struktur profil `user` yang sama.
- Endpoint `households/me` saat ini digunakan untuk mengambil ID rumah tangga; periksa apakah cara autentikasi kelurahan/RT/RW berubah di backend utama.

### 2. `ApiBinRepository`
- **FR-01 (AI Deteksi)**: Endpoint `/waste/detect` harus bisa menerima multipart form data (foto sampah).
- **FR-02 (Scan QR)**: Endpoint `/bins/scan` menangani transaksi dengan payload koordinat GPS (lat, lng) serta Household ID.

### 3. `ApiWasteLogRepository`
- Endpoint untuk riwayat (`/transactions/my-deposits`) dan histori poin (`/points/me`).
- Perhatikan parsing format tanggal (`createdAt`). Aplikasi saat ini memiliki fallback untuk parsing tanggal berformat ID (`12 Jan 2025`). Sesuaikan jika backend utama menggunakan ISO 8601 baku.

## Langkah Sinkronisasi Nanti
1. Buka file `lib/config/app_config.dart`.
2. Ubah `apiBaseUrl` yang saat ini menunjuk ke localhost/ngrok menjadi URL produksi backend utama.
3. Lakukan tes login, deteksi AI, scan QR, dan tarik data poin untuk memastikan payload request/response tidak mengalami *breaking changes*.
