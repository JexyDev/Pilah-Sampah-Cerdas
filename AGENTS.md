# AGENTS.md — BERSEKA Mobile Application Rule Engine

> File ini adalah **sumber kebenaran utama** untuk AI Agent (Antigravity, Claude Code, Cursor, Copilot) yang memodifikasi aplikasi mobile Flutter di repositori ini.
> Jika ada instruksi manusia yang bertentangan dengan file ini, **konfirmasi dulu** sebelum menyimpang.

---

## 🛑 ATURAN UTAMA ALUR KERJA (MANDATORY WORKFLOW RULES)

### 1. Alur Kerja Backlog & QC Berkelanjutan (Iterative Backlog ➡️ QC Loop)
- **Breakdown Backlog Mandiri**: Setiap kali menerima prompt/instruksi dari pengguna, AI WAJIB menyusun daftar **BACKLOG** (task list) terperinci sesuai kebutuhan fitur/perbaikan.
- **Sistem Eksekusi Strict (`BACKLOG` ➡️ `QC` ➡️ `Lanjut`)**:
  1. Kerjakan 1 item **BACKLOG**.
  2. Lakukan **QC Verification** (pastikan 100% bebas error secara **syntax**, **runtime**, dan **logical** via `flutter analyze` dengan 0 issues & pengujian fungsi).
  3. **Jika PASS**: Baru diperbolehkan lanjut mengerjakan item BACKLOG selanjutnya.
  4. **Jika BELUM PASS**: WAJIB diperbaiki dan di-QC ulang sampai benar-benar PASS tanpa bug/error sebelum menyentuh backlog berikutnya.

### 2. Konfirmasi & Review Sebelum Commit / Push / Build / Run
- **Review Perubahan Sebelum Eksekusi Lanjutan**: Sebelum menjalankan perintah `git commit`, `git push`, `flutter build`, atau perintah `run` eksekusi utama, AI WAJIB menyampaikan **Ringkasan Review Perubahan** kepada pengguna.
- **Pola Komunikasi Mandat**:
  > *"Berikut ringkasan perubahan yang telah diselesaikan. Silakan direview terlebih dahulu. Apakah perubahan ini sudah sesuai dan siap untuk dilanjutkan ke proses commit/push/build/run?"*
- **Dilarang Otomatis Execution**: AI **DILARANG KERAS** melakukan `git commit`, `git push`, `flutter build`, atau eksekusi `run` tanpa persetujuan / konfirmasi dari pengguna terlebih dahulu.

---

## 🚀 ALUR TESTING STAGING & RELEASE MOBILE (CI/CD WORKFLOW)

Setiap build aplikasi Android ditangani otomatis oleh GitHub Actions Pipeline:

### 1. Lingkungan & Server Target
| Lingkungan | Target API URL | Output Nama APK | Lokasi Download |
|---|---|---|---|
| **Lokal (Dev)** | `http://localhost:3000` atau IP LAN | Build lokal debug | Di perangkat dev |
| **Staging** | `https://staging.berseka.id` | `berseka-staging-arm64-v8a.apk` | `https://staging.berseka.id/downloads/berseka-staging-arm64-v8a.apk` |
| **Production** | `https://berseka.id` | `berseka-release-arm64-v8a.apk` | `https://berseka.id/downloads/berseka-release-arm64-v8a.apk` |

### 2. Prosedur Build APK Staging untuk QA/Testing
1. Buka tab **Actions** di GitHub repository.
2. Pilih workflow **"BERSEKA Mobile — CI/CD Pipeline"**.
3. Klik **Run workflow**:
   - Branch: `mobile`
   - Target Environment: pilih **`staging`**
4. CI akan mengompilasi APK dengan `--dart-define=API_BASE_URL=https://staging.berseka.id` dan mengunggahnya ke server staging.
5. Tim QA/QC langsung mengunduh dan menguji APK tanpa risiko merusak database produksi.

### 3. Prosedur Rilis APK Production
- Jalankan workflow dengan Target Environment **`production`** (atau push commit ke branch `mobile`).
- APK otomatis terpasang ke halaman download `https://berseka.id`.

---

## 🛡️ SOP INTEGRASI FITUR & API DENGAN TIM BACKEND

Jika tim Mobile membutuhkan endpoint API baru:
1. **Jalur Server Staging (Rekomendasi Utama)**:
   - Hubungkan ke backend staging:
     ```bash
     flutter run --dart-define=API_BASE_URL=https://staging.berseka.id
     ```
2. **Jalur Testing Lokal (Local Host Integration)**:
   - Hubungkan ke backend lokal developer di jaringan kantor:
     ```bash
     flutter run --dart-define=API_BASE_URL=http://<IP_KOMPUTER_BACKEND>:3000
     ```
3. **Jalur Mock Response (Client-Side Stubbing)**:
   - Jika pengujian UI mendesak dan backend belum tersedia di staging, gunakan mock response pada repository/provider Dart dengan menyertakan badge visual `[Belum Terhubung API]` sesuai aturan Anti-Dummy.
4. **Sinkronisasi Spesifikasi API**:
   - Selalu rujuk `apps/api/src/` pada branch `staging` atau `main` sebagai acuan tunggal struktur JSON. Dilarang mengarang nama field JSON tanpa kesepakatan dengan backend.

---

## 1. Tentang Proyek Mobile

**Nama:** BERSEKA Mobile App (Bersih, Sehat, Kampung Asri) — Aplikasi Flutter Client untuk Warga, Mahasiswa KKN, dan Petugas Pemilahan Residu.
**Tech Stack:** Flutter 3.22+, Dart 3.12+, Riverpod, GetX (Routing & Navigation), Dio HTTP Client, Flutter Map, Geolocator.

---

## 2. 🛑 ATURAN ANTI-HALUSINASI & ISOLASI REPOSITORI

### 🔄 ALUR WAJIB SINKRONISASI API BACKEND (`staging`/`main`):
1. **PULL TERBARU:** Sebelum mengerjakan fitur baru, pastikan membaca Prisma schema dan controller backend terbaru di branch `staging`/`main`.
2. **ACUAN TUNGGAL API BACKEND:** AI Agent di mobile **WAJIB membaca spesifikasi API, controller Express, dan Prisma schema** sebagai sumber kebenaran tunggal untuk endpoint API, parameter request, dan format response JSON. Dilarang keras mengasumsikan format API tanpa memverifikasi langsung.

### 🛡️ PRINSIP ISOLASI:
1. 🚫 **ISOLASI REPOSITORI (STRICT ISOLATION):** Branch `mobile` khusus dikembangkan untuk Aplikasi Client Mobile Flutter. AI Agent yang bekerja di `mobile` **DILARANG KERAS** memodifikasi file backend/web monorepo (`apps/api`, `apps/web`).
2. **DILARANG MENGARANG (NO HALLUCINATED LOGIC/ENDPOINTS):** Jangan pernah mengarang skema data, endpoint API, path file, atau nama komponen yang tidak terverifikasi.
3. **DILARANG DATA DUMMY TANPA LABEL:** Jangan menanamkan data dummy/hardcode yang seolah-olah data asli backend.
4. **PATUHI ATURAN KATA 'TEMPAT SAMPAH':** **DILARANG** menggunakan kata 'tong' atau 'tong sampah' pada UI/dokumentasi. Selalu gunakan **'Tempat Sampah'**.
5. **CEK KOMPILASI KODE:** Setiap perubahan kode Dart WAJIB dites secara lokal dengan `flutter analyze` dan dipastikan **0 Error (Clean Compilation)**.

---

## 3. Struktur Folder `lib/` (WAJIB DIIKUTI)

```text
lib/
├── app/
│   ├── core/
│   │   ├── theme/          # Tema Visual & Warna (AppColors)
│   │   ├── utils/          # Kompresi Gambar, Geofencing, Sanitizer
│   │   └── values/         # Konstanta API (api_constants.dart), Konfigurasi (app_config.dart)
│   ├── data/
│   │   ├── models/         # Entity & Model Data
│   │   ├── providers/      # API Client (Dio Interceptor)
│   │   └── repositories/   # Repositori Pengambilan Data
│   └── modules/            # Modul Fitur (Beranda, Auth, Scan, Mahasiswa, Petugas)
├── main.dart               # Entry Point Aplikasi
```

---

## 4. Checklist Sebelum PR / Commit
```text
[ ] Lolos static analysis (flutter analyze --no-fatal-warnings -> 0 Issue)
[ ] Menggunakan AppConfig.apiBaseUrl untuk endpoint API
[ ] Tidak ada kata 'tong' di string UI
[ ] Token disimpan aman via SafeStorage
[ ] Tidak ada hardcoded credentials/secrets
[ ] Memperoleh review & konfirmasi pengguna sebelum commit/push/build/run
```

---

## 5. Standar Commit Message

Format: `<type>(<scope>): <deskripsi singkat>`

| Type | Kapan dipakai |
|------|----------------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `refactor` | Ubah struktur kode tanpa ubah behavior |
| `docs` | Perubahan dokumentasi |
| `test` | Menambah/mengubah test |
| `chore` | Config, dependency, tooling |

Contoh: `feat(mobile): tambah tracking lokasi mahasiswa kkn`

---

## 6. Git Branching Strategy (SOP)

**Penamaan branch:**
```text
feat/mobile-<deskripsi-singkat>      -> contoh: feat/mobile-auth
fix/mobile-<deskripsi-singkat>       -> contoh: fix/mobile-notif-crash
refactor/mobile-<deskripsi-singkat>
```

---

## 7. Kebijakan Identitas Pengguna & 'Tempat Sampah' Mandate (WAJIB DIIKUTI)

- **NIK (Nomor Induk Kependudukan)**: DIHAPUS dari SELURUH antarmuka pengguna (UI), local storage, form input, dan logic API. **Tidak ada role atau modul yang menggunakan NIK**.
- **Identitas Auth Universal**: Warga, Mahasiswa KKN, DPL, dan Petugas menggunakan **Nomor Telepon (+62)** untuk login utama.
- **LARANGAN KATA 'TONG' (WAJIB DIIKUTI)**: **DILARANG** menggunakan kata **'tong'** or **'tong sampah'** di seluruh teks UI, nama berkas, notifikasi, log, komentar kode, maupun dokumentasi. SELALU gunakan istilah **'Tempat Sampah'** (contoh: 'Kapasitas Tempat Sampah', 'Tempat Sampah Organik').

---

## 8. Kebijakan Anti-Dummy & Integrasi Data Real (WAJIB DIIKUTI)

- **Batasan Data Mock**: Data tiruan/mock HANYA BOLEH berada di testing fixtures. DILARANG menanamkan data dummy statis di dalam komponen UI / view Flutter tanpa indikator status.
- **Pengembangan UI Tanpa API**: Jika API backend belum terintegrasi, AI wajib mencantumkan label visual yang jelas pada UI (misal badge `[Belum Terhubung API]`). DILARANG menyajikan data hardcode seolah-olah data tersebut live.
- **Semua chart & progress stats** pada mobile wajib dirender secara dinamis dari response JSON backend.
- Pelanggaran terhadap aturan real data ini dianggap setara dengan bug kritis (❌).
