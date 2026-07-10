# UI/UX Flow Document
## pilahsampah.id | Mobile App (Flutter)
**Versi:** 1.0.0 | **Author:** Habil | **Tanggal:** 8 Juli 2026
**Acuan Desain:** Stitch AI design pilahsampah.id (mobile version) + design.md

---

## Konvensi Dokumen
- `→` = navigasi ke screen berikutnya
- `[Widget]` = nama Flutter Widget/Screen
- `API:` = endpoint backend yang dipanggil (via Ngrok URL)
- Semua teks UI dalam **Bahasa Indonesia**
- Tombol utama: height minimal 56px, lebar penuh (`double.infinity`)

---

## SCREEN 0: SPLASH SCREEN

```
+----------------------------------+
|                                  |
|    [Logo SVG pilahsampah.id]     |
|                                  |
|    pilahsampah.id                |
|    Kecamatan Coblong             |
|                                  |
+----------------------------------+
```

**Logic:**
```
1. Tampilkan splash selama 2 detik
2. Baca token dari flutter_secure_storage
3. Ada token → API: GET /api/v1/auth/me
   - 200 → Navigate ke HomeScreen (replace)
   - 401 → Hapus token → Navigate ke LoginScreen (replace)
4. Tidak ada token → Navigate ke LoginScreen (replace)
```

---

## SCREEN 1: LOGIN

```
+----------------------------------+
|  🌿 pilahsampah.id               |
|  Kecamatan Coblong, Bandung      |
|                                  |
|  Selamat Datang Kembali 👋       |
|  Masuk untuk mencatat sampah Anda|
|                                  |
|  [Email]                         |
|  ┌──────────────────────────┐   |
|  │ email@contoh.com         │   |
|  └──────────────────────────┘   |
|                                  |
|  [Kata Sandi]                    |
|  ┌──────────────────────────┐   |
|  │ ••••••••          [👁️]   │   |
|  └──────────────────────────┘   |
|                                  |
|  [MASUK KE DASHBOARD →]         |
|  (tombol hijau, full-width, 56px)|
|                                  |
|  Belum punya akun? Daftar       |
+----------------------------------+
```

**Alur Submit:**
```
1. Validasi: email format, password tidak kosong
2. Tampilkan LoadingOverlay
3. API: POST /api/v1/auth/login { email, password, clientType: "mobile" }
4. Response 200:
   → Simpan accessToken ke flutter_secure_storage (key: "access_token")
   → Navigate ke HomeScreen (replace, hapus history)
5. Response 401:
   → Hilangkan loading
   → Tampilkan Snackbar merah: "Email atau kata sandi salah."
   → Clear field password
6. Network error:
   → Snackbar: "Tidak ada koneksi internet. Coba lagi."
```

---

## SCREEN 2: REGISTER

```
+----------------------------------+
|  ← Kembali ke Login             |
|                                  |
|  Daftar Akun Baru                |
|  Lengkapi data rumah tangga Anda |
|                                  |
|  NIK (16 Digit)    [?]           |
|  ┌──────────────────────────┐   |
|  │ 3273XXXXXXXXXXXX         │   |
|  └──────────────────────────┘   |
|                                  |
|  Nama Kepala Keluarga            |
|  ┌──────────────────────────┐   |
|  │                          │   |
|  └──────────────────────────┘   |
|                                  |
|  No. Telepon (+62)               |
|  ┌──────────────────────────┐   |
|  │ 8XXXXXXXXXX              │   |
|  └──────────────────────────┘   |
|                                  |
|  Kelurahan                       |
|  ┌──────────────────────────┐   |
|  │ Pilih Kelurahan ▼        │   |
|  └──────────────────────────┘   |
|                                  |
|  RT        RW                    |
|  [01 ▼]    [05 ▼]               |
|                                  |
|  Alamat Lengkap                  |
|  ┌──────────────────────────┐   |
|  │                          │   |
|  │ (textarea)               │   |
|  └──────────────────────────┘   |
|                                  |
|  📍 Ambil Lokasi GPS Saat Ini    |
|  [chip: -6.8834°, 107.6198°]    |
|                                  |
|  [DAFTAR & TUNGGU VERIFIKASI →]  |
|  (tombol biru, full-width, 56px) |
+----------------------------------+
```

**Alur Submit:**
```
1. Validasi NIK: harus tepat 16 digit angka
2. Semua field wajib diisi
3. GPS: navigator.geolocation sukses → tampilkan chip koordinat hijau
4. API: POST /api/v1/auth/register
5. Response 201:
   → Tampilkan SuccessDialog hijau:
     "✅ Pendaftaran Berhasil!"
     "Akun Anda sedang menunggu verifikasi dari Ketua RT setempat."
     [Tutup → Navigate ke Login]
6. Response 422:
   → Tampilkan field-level error di bawah masing-masing input
```

---

## SCREEN 3: HOME (Beranda)

```
+----------------------------------+
|  🌿 pilahsampah.id               |
|                                  |
|  Halo, Budi Santoso! 👋          |
|  Mari pilah sampah dengan mudah! |
|                                  |
|  ┌──────────────────────────┐   |
|  │ 🎉 Kesadaran Anda Hari Ini│   |
|  │       72% — Bagus!        │   |
|  │ [progress bar hijau 72%]  │   |
|  └──────────────────────────┘   |
|                                  |
|  ┌──────────────────────────┐   |
|  │  📸  FOTO SAMPAH          │   |
|  │      ORGANIK              │   |  ← Hijau tua, tinggi 80px
|  └──────────────────────────┘   |
|                                  |
|  ┌──────────────────────────┐   |
|  │  📷  FOTO SAMPAH          │   |
|  │      ANORGANIK            │   |  ← Biru tua, tinggi 80px
|  └──────────────────────────┘   |
|                                  |
|  Setoran Terakhir:               |
|  🟢 Organik    1.20 Liter       |
|  🔵 Anorganik  2.30 Liter       |
|                                  |
+----------------------------------+
|  [🏠 Beranda] [📋 Riwayat] [👤 Profil] |
+----------------------------------+
```

**Logic:**
```
API: GET /api/v1/auth/me (sudah di-cache dari splash)
Tombol "Foto Sampah Organik" → state: wasteType = ORGANIC → Navigate ke CameraScreen
Tombol "Foto Sampah Anorganik" → state: wasteType = NON_ORGANIC → Navigate ke CameraScreen
"Setoran Terakhir" dari GET /api/v1/waste/logs?limit=2
```

---

## SCREEN 4: CAMERA SCREEN

```
+----------------------------------+
|  ← Batal                        |
|                                  |
|  ┌──────────────────────────┐   |
|  │                          │   |
|  │   [LIVE CAMERA PREVIEW]  │   |  ← image_picker / camera
|  │                          │   |
|  └──────────────────────────┘   |
|                                  |
|  💡 Tips: Arahkan kamera ke     |
|     sampah dengan pencahayaan   |
|     yang cukup agar terdeteksi  |
|     dengan baik.                |
|                                  |
|  [📸 AMBIL FOTO SEKARANG]       |
|  (hijau, full-width, 56px)      |
+----------------------------------+
```

**Setelah foto diambil:**
```
→ Tampilkan preview foto yang sudah diambil
→ "Gunakan Foto Ini" (hijau) | "Ambil Ulang" (outlined)
→ Klik "Gunakan Foto Ini":
   1. Kompres foto (flutter_image_compress, max 1MB)
   2. Tampilkan LoadingOverlay: "Mendeteksi jenis sampah..."
   3. API: POST /api/v1/waste/detect-mock (multipart/form-data)
   4. → Navigate ke AiResultScreen atau ErrorDialog
```

---

## SCREEN 5: AI RESULT SCREEN

```
+----------------------------------+
|  ← Batal                        |
|  Hasil Deteksi AI                |
|                                  |
|  ┌──────────────────────────┐   |
|  │  [Preview Gambar Kecil]  │   |
|  └──────────────────────────┘   |
|                                  |
|  Jenis Sampah Terdeteksi:        |
|  🟢 ORGANIK                     |
|                                  |
|  Estimasi Volume: 1.50 Liter    |
|  Kepercayaan: 92%               |
|                                  |
|  ─── Konversi ───               |
|  Berat Sampah: ±0.60 Kg         |
|  (Organik × 0.4 kg/L)          |
|                                  |
|  Poin yang Akan Diperoleh:      |
|  +60 Poin 🏆                    |
|                                  |
|  [KONFIRMASI & PINDAI QR →]     |
|  (hijau, full-width, 56px)      |
|                                  |
|  [Hasil Tidak Sesuai? Ulangi]   |
|  (text button, gray)            |
+----------------------------------+
```

**Error States yang mungkin muncul (dialog):**
```
AI_TIMEOUT: Dialog merah
  Judul: "Koneksi Lambat ⚠️"
  Isi: "Server AI memakan waktu terlalu lama. Estimasi default digunakan (1.0 Liter)."
  [Lanjutkan dengan Estimasi Default] | [Coba Lagi]

IMAGE_UNREADABLE: Dialog kuning
  Judul: "Foto Kurang Jelas 📷"
  Isi: "Gambar tidak terbaca dengan baik. Pastikan ada pencahayaan cukup."
  [Ambil Foto Ulang] → kembali ke CameraScreen

QUOTA_EXCEEDED: Dialog abu-abu
  Judul: "Kuota Harian Habis"
  Isi: "Anda sudah mencapai batas 50 deteksi hari ini. Coba lagi besok."
  [Tutup] → kembali ke HomeScreen
```

---

## SCREEN 6: QR SCANNER SCREEN

```
+----------------------------------+
|  ← Batal                        |
|  Pindai QR Tong Sampah           |
|                                  |
|  ┌──────────────────────────┐   |
|  │                          │   |
|  │  [QR SCANNER VIEWPORT]   │   |  ← mobile_scanner
|  │      ┌──────────┐        │   |
|  │      │          │        │   |
|  │      └──────────┘        │   |
|  │                          │   |
|  └──────────────────────────┘   |
|                                  |
|  Arahkan kamera ke QR Code      |
|  yang ada di tong sampah         |
|  🟢 ORGANIK                     |  ← sesuai wasteType yang dipilih
|                                  |
+----------------------------------+
```

**Setelah QR terbaca:**
```
1. Hentikan scanner
2. Tampilkan LoadingOverlay: "Mencatat transaksi..."
3. API: POST /api/v1/bins/scan
   {
     "qrCode": "<qr-yang-terbaca>",
     "wasteType": "ORGANIC",
     "aiRequestId": "<dari AI result>",
     "estimatedVolumeLiter": 1.5
   }

Response 201 → Navigate ke SuccessScreen

Response 400 INVALID_BIN_TYPE: Dialog
  "Jenis Tong Tidak Sesuai! ⛔"
  "Anda memilih sampah Organik, tetapi memindai tong Anorganik."
  [Scan Tong Lain] | [Batal]

Response 400 BIN_OVERFLOW: Dialog
  "Tong Sampah Penuh! 🪣"
  "Tong ini sudah penuh (melebihi 25 Liter). Gunakan tong lain atau hubungi Petugas RT Anda."
  [Scan Tong Lain] | [Laporkan ke Petugas]

Response 404 NOT_FOUND: Dialog
  "QR Code Tidak Dikenali"
  "Pastikan Anda memindai QR Code resmi di tong sampah yang terdaftar."
  [Coba Lagi]
```

---

## SCREEN 7: SUCCESS SCREEN

```
+----------------------------------+
|                                  |
|     [Animasi ✅ Centang Hijau]   |
|       (AnimatedContainer         |
|        scale 0→1, 600ms)        |
|                                  |
|  Sampah Berhasil Dicatat! 🎉    |
|                                  |
|  Anda mendapatkan:              |
|  +60 Poin                        |
|                                  |
|  Total Poin Anda: 2.900 Poin    |
|                                  |
|  Volume Organik: 1.5L           |
|  Berat: ±0.60 Kg                |
|  Status Tong: Aman (58%)        |
|                                  |
|  [SELESAI → Kembali Beranda]    |
|  (hijau, full-width, 56px)      |
|                                  |
|  [Lihat Riwayat Saya]           |
|  (text button, biru)            |
+----------------------------------+
```

**Auto-navigate ke HomeScreen setelah 5 detik jika tidak ada input.**

---

## SCREEN 8: RIWAYAT SETORAN (`/history`)

```
+----------------------------------+
|  Riwayat Setoran Sampah          |
|  [Semua ▼] [Organik] [Anorganik] |
|  ─────────────────────────────  |
|  🟢 Organik — 1.50 Liter       |
|  ±0.60 Kg | +60 Poin | 2j lalu |
|  Status AI: ✓ Berhasil          |
|  ─────────────────────────────  |
|  🔵 Anorganik — 2.30 Liter     |
|  ±0.46 Kg | +46 Poin | Kemarin  |
|  Status AI: ✓ Berhasil          |
|  ─────────────────────────────  |
|  [Muat lebih banyak...]          |
+----------------------------------+
|  [🏠] [📋 Riwayat] [👤]         |
+----------------------------------+
```

---

## SCREEN 9: PROFIL WARGA (`/profile`)

```
+----------------------------------+
|  Profil Saya                     |
|                                  |
|  [Avatar Inisial "BS"]          |
|  Budi Santoso                   |
|  RT 02 / RW 05 — Kel. Dago     |
|                                  |
|  ┌──────────────────────────┐   |
|  │  Total Poin              │   |
|  │  2.900 Poin 🏆           │   |
|  │  #3 di RT 02 bulan ini   │   |
|  └──────────────────────────┘   |
|                                  |
|  NIK: 3273XXXXXXXXXXXX1234      |
|  Alamat: Jl. Contoh No. 12      |
|                                  |
|  ─────────────────────────────  |
|  [Keluar dari Akun]             |
|  (merah outlined)               |
+----------------------------------+
|  [🏠] [📋] [👤 Profil]          |
+----------------------------------+
```

**Logout:**
```
→ Tampilkan ConfirmDialog:
  "Apakah Anda yakin ingin keluar?"
  [Ya, Keluar] | [Batal]
→ Klik "Ya, Keluar":
  → Hapus token dari flutter_secure_storage
  → Navigate ke LoginScreen (replace, clear history)
```
