# Catatan Perubahan (Changelog) — Pilah Sampah Cerdas

Semua perubahan penting pada proyek **Pilah Sampah Cerdas** akan dicatat di dalam file ini berdasarkan standar Angular commit convention.

---

## [0.1.0-alpha] — 2026-07-10
### Added
*   Inisialisasi Monorepo untuk 3 branch utama: `backend` (default), `frontend`, dan `mobile`.
*   Dokumen spesifikasi dasar yang lengkap di folder `docs/` (6 file markdown terpusat):
    *   `prd.md` (Product Requirement Document)
    *   `srs.md` (Software Requirement Specification)
    *   `sdd.md` (Software Design Document, 12 Tabel PostgreSQL & Prisma ORM)
    *   `ui_ux_flow.md` (Panduan visual Poppins & Light Mode)
    *   `task_breakdown.md` (Milestones Sprint 1 & pembagian tugas)
    *   `commit_message_id.md` (Standar pesan commit tim IT)
*   Aset visual UI Mobile dari ekspor Stitch AI di `/mobile/assets/stitch_ui` sebagai acuan developer Flutter.
*   File `docker-compose.yml` di folder `/backend` untuk otomatisasi PostgreSQL (GIS) & Redis secara lokal.
*   File panduan awal `README.md` pada masing-masing folder `/backend`, `/frontend`, dan `/mobile`.
*   Workflow otomatisasi GitHub Actions CI (`backend-ci.yml`, `frontend-ci.yml`, `mobile-ci.yml`) untuk verifikasi syntax kode.
*   File `.github/pull_request_template.md` untuk standardisasi pengajuan perubahan kode tim.
*   Konfigurasi `.gitattributes` untuk manajemen line endings pada sistem operasi Windows.
