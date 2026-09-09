# AGENTS.md — Pedoman AI Agent untuk Web & Backend (API) Monorepo BERSEKA

Dokumen ini adalah instruksi operasional wajib untuk semua AI coding assistant (Cursor, Copilot, Antigravity, Claude Code, Windsurf, dll) yang bekerja pada monorepo Web & Backend BERSEKA (`apps/api`, `apps/web`).

---

## 🛑 ATURAN UTAMA ALUR KERJA (MANDATORY WORKFLOW RULES)

### 1. Alur Kerja Backlog & QC Berkelanjutan (Iterative Backlog ➡️ QC Loop)
- **Breakdown Backlog Mandiri**: Setiap kali menerima tugas, AI WAJIB menyusun daftar **BACKLOG** terperinci sebelum menyentuh kode.
- **Sistem Eksekusi Strict (`BACKLOG` ➡️ `QC` ➡️ `Lanjut`)**:
  1. Kerjakan 1 item **BACKLOG**.
  2. Lakukan **QC Verification** lokal:
     - Backend: `cd apps/api && npx tsc --noEmit` (0 error).
     - Frontend Web: `cd apps/web && npx tsc --noEmit` (0 error).
  3. **Jika PASS**: Baru boleh lanjut ke item backlog berikutnya.
  4. **Jika BELUM PASS**: WAJIB perbaiki sampai 0 issue sebelum pindah ke task lain.

### 2. Konfirmasi & Review Sebelum Commit / Push / Build
- **Review Perubahan Sebelum Eksekusi Lanjutan**: Sebelum menjalankan `git commit` atau `git push`, AI WAJIB menyampaikan **Ringkasan Review Perubahan** kepada pengguna.
- **Dilarang Auto-Push ke Branch Utama**: AI **DILARANG KERAS** melakukan `git push origin main` atau `git push origin staging` langsung tanpa konfirmasi pengguna.

---

## 🌳 STRUKTUR CABANG GIT (GIT BRANCHING STRATEGY)

```
[feat/... / fix/...] ──PR──> [development] ──PR──> [staging] ──PR──> [main]
                                                      │                │
                                                Auto-deploy      Auto-deploy
                                                Staging VPS      Prod VPS
```

### Aturan Cabang (Strict Branch Rules)
1. **Fitur / Bugfix Baru**:
   - Selalu buat cabang dari `development`:
     - Fitur: `feat/<nama-fitur>` (contoh: `feat/marketplace`, `feat/export-csv`)
     - Bugfix: `fix/<nama-bug>` (contoh: `fix/kkn-early-checkout`, `fix/login-session`)
   - **Dilarang coding langsung di `staging` atau `main`**.
2. **Integrasi ke Development**:
   - Buat PR dari cabang fitur/bugfix ke `development`.
   - Pastikan TypeScript lolos (`npm run prisma:generate`, type check backend & web).
3. **Rilis ke Staging (Testing / QA Server)**:
   - Buat PR dari `development` ke `staging`.
   - Begitu di-merge ke `staging`, GitHub Actions **otomatis men-deploy** ke:
     - Dashboard Web: `https://staging.berseka.id`
     - API: `https://staging.berseka.id/api/v1`
4. **Rilis ke Production**:
   - Setelah lolos uji QA di staging, buat PR dari `staging` ke `main`.
   - Merge ke `main` otomatis men-deploy ke `https://berseka.id`.

---

## 🌐 ENVIRONMENT & ENDPOINTS

| Lingkungan | Dashboard Web | API Base URL | Catatan |
|---|---|---|---|
| **Lokal (Dev)** | `http://localhost:5173` | `http://localhost:3000/api/v1` | Database lokal Docker PostgreSQL 15 |
| **Staging** | `https://staging.berseka.id` | `https://staging.berseka.id/api/v1` | VPS Staging (`157.10.160.93`), auto-deploy via branch `staging` |
| **Production** | `https://berseka.id` | `https://berseka.id/api/v1` | VPS Production, auto-deploy via branch `main` |

---

## 🛡️ STANDAR KODE & INTEGRASI DATA

### 1. Prisma & Database
- Schema database berada di `apps/api/prisma/schema.prisma`.
- Jika membuat model atau field baru:
  1. Jalankan `npx prisma migrate dev --name <nama_migrasi>` di folder `apps/api`.
  2. Jalankan `npm run prisma:generate` di root monorepo.
  3. Pastikan tidak ada data breaking change pada tabel inti (`pengguna`, `kehadiran_kegiatan`, `kelompok_kkn`).

### 2. Kebijakan Anti-Dummy & Real Data
- DILARANG menanamkan data statis / hardcode yang berpura-pura menjadi data asli backend.
- Komponen frontend web wajib mengonsumsi data dari REST endpoint (`/api/v1/...`).
- Jika endpoint belum siap di server staging/production, gunakan state loading dan error boundary yang jelas, bukan data tiruan tanpa label.

### 3. Bahasa & Terminologi Mandat
- **LARANGAN KATA 'TONG'**: **DILARANG** menggunakan kata `'tong'` atau `'tong sampah'` di seluruh kode, komentar, teks UI web, label form, maupun API response. Selalu gunakan **'Tempat Sampah'**.
- **Larangan NIK**: NIK tidak digunakan sebagai identitas auth. Gunakan nomor telepon (+62) atau email resmi.

---

## 📋 CHECKLIST SEBELUM PUSH / BUAT PR
```text
[ ] Backend TypeScript lolos: cd apps/api && npx tsc --noEmit (0 error)
[ ] Frontend Web TypeScript lolos: cd apps/web && npx tsc --noEmit (0 error)
[ ] Prisma Client up-to-date: npm run prisma:generate
[ ] Tidak ada kata 'tong' di seluruh string UI baru
[ ] Tidak ada hardcoded credentials atau password di dalam kode
[ ] Branch target PR sesuai hirarki: feat/fix -> development -> staging -> main
[ ] Review perubahan disampaikan dan dikonfirmasi oleh pengguna
```

---

## 📦 STANDAR COMMIT MESSAGE
Format: `<type>(<scope>): <deskripsi singkat>`
- `feat(api): tambah endpoint rekap logbook dpl`
- `feat(web): tambah filter status survei kkn`
- `fix(api): perbaiki validasi token jwt staging`
- `fix(web): perbaiki layout responsive tabel presensi`
- `chore(ci): update script deployment staging`
