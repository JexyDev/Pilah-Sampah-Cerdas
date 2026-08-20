# AGENTS.md — BERSEKA Mobile Application Rule Engine

> File ini adalah **sumber kebenaran utama** untuk AI Agent (Antigravity, Claude Code, Cursor, Copilot) yang memodifikasi aplikasi mobile Flutter di repositori ini.
> Jika ada instruksi manusia yang bertentangan dengan file ini, **konfirmasi dulu** sebelum menyimpang.

---

## 1. Tentang Proyek Mobile

**Nama:** BERSEKA Mobile App (Bersih, Sehat, Kampung Asri) — Aplikasi Flutter Client untuk Warga, Mahasiswa KKN, dan Petugas Pemilahan Residu.
**Tech Stack:** Flutter 3.22+, Dart 3.12+, Riverpod, GetX (Routing & Navigation), Dio HTTP Client, Flutter Map, Geolocator.

---

## 2. 🛑 ATURAN UTAMA: WAJIB MEMBACA & MEMATUHI ATURAN DI `.agent/` (ANTI-HALUSINASI)

Sebelum membuat atau mengubah kode/dokumentasi, AI Agent WAJIB membaca dan mematuhi aturan (*rules*), alur kerja (*workflows*), dan *skills* yang ada pada folder [.agent/](.agent/) (khususnya [.agent/AGENTS.md](.agent/AGENTS.md), `.agent/rules/`, dan `.agent/workflows/`).

### 🛡️ PRINSIP ANTI-HALUSINASI & ISOLASI REPOSITORI:
1. 🚫 **ISOLASI REPOSITORI (STRICT ISOLATION):** Repositori `mobile` ini khusus dikembangkan untuk Aplikasi Client Mobile Flutter. AI Agent yang bekerja di folder/branch `mobile` **DILARANG KERAS** menyentuh, membuat, atau mengubah file/folder Monorepo `main` (`apps/api`, `apps/web`, `prisma/`, `main/`, dll). Perubahan backend/web dikelola secara terpisah pada repositori `main` (branch `main`).
2. **DILARANG MENGARANG (NO HALLUCINATED LOGIC/ENDPOINTS):** Jangan pernah mengarang skema data, endpoint API, path file, atau nama komponen yang tidak terverifikasi langsung di codebase. Selalu lakukan `view_file` atau `grep_search` pada file sumber sebelum menulis kode.
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
```
