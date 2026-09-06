-- Migration: add_skip_details_to_schedule
-- Tanggal: 2026-09-02
-- Deskripsi: Menambahkan kolom status_kegiatan (default 'AKTIF') dan detail_skip (JSON)
--            ke tabel jadwal untuk mendukung fitur "Skip Kegiatan / Tidak Ada Kegiatan".
--            Tidak ada data yang berubah; semua baris yang ada akan mendapat default 'AKTIF'.

ALTER TABLE "jadwal"
  ADD COLUMN IF NOT EXISTS "status_kegiatan" TEXT NOT NULL DEFAULT 'AKTIF',
  ADD COLUMN IF NOT EXISTS "detail_skip" JSONB;
