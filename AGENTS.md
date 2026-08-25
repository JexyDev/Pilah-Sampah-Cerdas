# AGENTS.md — BERSEKA Main Workspace Rules & Agent Instructions

> File ini adalah **sumber kebenaran utama** untuk AI Agent yang memodifikasi workspace `main` (Backend API `apps/api` & Web Dashboard `apps/web`).

---

## 🛑 ATURAN UTAMA ALUR KERJA (MANDATORY WORKFLOW RULES)

### 1. Alur Kerja Backlog & QC Berkelanjutan (Iterative Backlog ➡️ QC Loop)
- **Breakdown Backlog Mandiri**: Setiap kali menerima prompt/instruksi dari pengguna, AI WAJIB menyusun daftar **BACKLOG** (task list) terperinci sesuai kebutuhan fitur/perbaikan.
- **Sistem Eksekusi Strict (`BACKLOG` ➡️ `QC` ➡️ `Lanjut`)**:
  1. Kerjakan 1 item **BACKLOG**.
  2. Lakukan **QC Verification** (pastikan 100% bebas error secara **syntax**, **runtime**, dan **logical** via `npx tsc --noEmit`, test suite, atau linter).
  3. **Jika PASS**: Baru diperbolehkan lanjut mengerjakan item BACKLOG selanjutnya.
  4. **Jika BELUM PASS**: WAJIB diperbaiki dan di-QC ulang sampai benar-benar PASS tanpa bug/error sebelum menyentuh backlog berikutnya.

### 2. Konfirmasi & Review Sebelum Commit / Push / Build / Run
- **Review Perubahan Sebelum Eksekusi Lanjutan**: Sebelum menjalankan perintah `git commit`, `git push`, `npm run build`, atau perintah `run` eksekusi utama, AI WAJIB menyampaikan **Ringkasan Review Perubahan** kepada pengguna.
- **Pola Komunikasi Mandat**:
  > *"Berikut ringkasan perubahan yang telah diselesaikan. Silakan direview terlebih dahulu. Apakah perubahan ini sudah sesuai dan siap untuk dilanjutkan ke proses commit/push/build/run?"*
- **Dilarang Otomatis Execution**: AI **DILARANG KERAS** melakukan `git commit`, `git push`, `npm run build`, atau eksekusi `run` tanpa persetujuan / konfirmasi dari pengguna terlebih dahulu.

---

## 🛡️ KEBIJAKAN PENCEGAHAN BUG PRODUKSI & INTEGRASI MOBILE DEV

### 1. Kebijakan Anti-Bug Server Produksi (Safeguarding Production)
- **Wajib Uji Coba Localhost / LAN**: Seluruh pengembangan, penambahan fitur, dan perbaikan bug wajib disimulasikan terlebih dahulu pada lingkungan lokal/LAN (`192.168.1.43`) menggunakan `docker-compose` (Postgres & Redis lokal) dan dijalankan via `npm run dev:all`.
- **Dilarang Test-in-Production**: Dilarang keras melakukan pushing ke branch `main` (yang memicu auto-deploy produksi) hanya untuk melakukan uji coba instan/trial-error kode baru.
- **Validasi Migrasi Database**: Setiap kali memodifikasi Prisma Schema (`schema.prisma`), migrasi wajib dieksekusi di database lokal terlebih dahulu (`npx prisma migrate dev`). Pastikan tidak ada data yang hilang/corrupt sebelum di-push ke server produksi.

### 2. SOP Kolaborasi Pembuatan API Baru dengan Tim Mobile Dev (Kantor LAN Office Setup)
Jika tim Mobile membutuhkan endpoint API baru yang belum selesai diimplementasikan oleh Backend:
- **Dilarang push kode setengah matang** ke branch produksi `main` hanya demi memfasilitasi testing tim mobile.
- **Solusi Uji Coba Integrasi Jaringan Kantor (Paling Direkomendasikan)**: 
  1. Developer backend menjalankan API secara lokal di komputer kantor (`npm run dev:api`).
  2. Developer mobile menghubungkan aplikasi mobile-nya ke IP LAN kantor (`192.168.1.43`) menggunakan opsi:
     `flutter run --dart-define=API_BASE_URL=http://192.168.1.43:3000`
  3. Setiap pengujian & perbaikan bug API dilakukan secara real-time di jaringan LAN kantor tanpa mengganggu server produksi VPS.
- **Kesepakatan Spec Dokumen**: Pembuatan endpoint baru wajib didokumentasikan strukturnya terlebih dahulu di `docs/API_MOBILE_DOCUMENTATION.md` untuk menyamakan skema JSON (request & response) sebelum kode ditulis.

---

## Core Principles

1. **Agent-First** — Delegate to specialized agents for domain tasks
2. **Test-Driven** — Write tests before implementation, 80%+ coverage required
3. **Security-First** — Never compromise on security; validate all inputs
4. **Immutability** — Always create new objects, never mutate existing ones
5. **Plan Before Execute** — Plan complex features before writing code

---

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design and scalability | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code quality and maintainability | After writing/modifying code |
| security-reviewer | Vulnerability detection | Before commits, sensitive code |
| build-error-resolver | Fix build/type errors | When build fails |
| database-reviewer | PostgreSQL/Prisma specialist | Schema design, query optimization |
| typescript-reviewer | TypeScript/JavaScript code review | TypeScript/JavaScript projects |

---

## Security Guidelines

**Before ANY commit:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries/Prisma)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data

---

## Coding Style & Quality

- **Immutability (CRITICAL)**: Always create new objects, never mutate. Return new copies with changes applied.
- **File organization**: Many small files over few large ones. 200-400 lines typical, 800 max. Organize by feature/domain.
- **Error handling**: Handle errors at every level. Provide user-friendly messages in UI code. Log detailed context server-side.
- **Input validation**: Validate all user input at system boundaries using schema-based validation (Zod/Prisma).

---

## Testing Requirements

**Minimum coverage: 80%**
1. **Unit tests** — Individual functions, utilities, components
2. **Integration tests** — API endpoints, database operations
3. **E2E tests** — Critical user flows

**TDD workflow (mandatory):**
1. Write test first (RED) — test should FAIL
2. Write minimal implementation (GREEN) — test should PASS
3. Refactor (IMPROVE) — verify coverage 80%+

---

## Git & PR Workflow (Branching Policy)

- **Development Branch First**: Seluruh perbaikan, penambahan fitur, dan perbaikan UI wajib di-commit dan di-push ke branch **`development`** terlebih dahulu. Dilarang push langsung ke `main`.
- **Production Merge via Main**: Penggabungan dari `development` ke `main` (yang memicu CI/CD auto-deploy VPS) HANYA dilakukan setelah kode lolos 100% QC dan memperoleh konfirmasi pengguna.
- **Commit format**: `<type>(<scope>): <description>` — Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- **Pre-Commit Review**: Dilarang push/commit otomatis sebelum menyampaikan Ringkasan Review Perubahan kepada pengguna.
