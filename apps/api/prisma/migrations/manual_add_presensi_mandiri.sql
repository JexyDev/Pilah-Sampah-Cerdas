-- ============================================================
-- Migration: add_presensi_mandiri
-- Generated: 2026-08-27
-- Deskripsi: Tambah fitur presensi mandiri mahasiswa KKN
--            + field deskripsi_kegiatan di kehadiran_kegiatan
-- ============================================================

-- 1. Tambah kolom deskripsi_kegiatan dan foto_url ke tabel kehadiran_kegiatan (nullable)
ALTER TABLE kehadiran_kegiatan 
  ADD COLUMN IF NOT EXISTS deskripsi_kegiatan TEXT,
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Buat tabel presensi_mandiri
CREATE TABLE IF NOT EXISTS presensi_mandiri (
  id                    UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_mahasiswa          UUID          NOT NULL,
  id_kelompok           UUID,
  latitude              DECIMAL(11,8) NOT NULL,
  longitude             DECIMAL(11,8) NOT NULL,
  deskripsi_kegiatan    VARCHAR(500)  NOT NULL,
  foto_url              TEXT          NOT NULL,
  status                VARCHAR(20)   NOT NULL DEFAULT 'AKTIF',
  waktu_checkin         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  waktu_checkout        TIMESTAMPTZ,
  durasi_menit          INTEGER,
  dibuat_pada           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  diperbarui_pada       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT presensi_mandiri_pkey PRIMARY KEY (id),
  CONSTRAINT fk_presensi_mandiri_mahasiswa
    FOREIGN KEY (id_mahasiswa) REFERENCES pengguna(id) ON DELETE CASCADE,
  CONSTRAINT fk_presensi_mandiri_kelompok
    FOREIGN KEY (id_kelompok) REFERENCES kelompok_kkn(id) ON DELETE SET NULL
);

-- 3. Index untuk query performa
CREATE INDEX IF NOT EXISTS idx_presensi_mandiri_student_checkin
  ON presensi_mandiri (id_mahasiswa, waktu_checkin DESC);

CREATE INDEX IF NOT EXISTS idx_presensi_mandiri_kelompok
  ON presensi_mandiri (id_kelompok);

CREATE INDEX IF NOT EXISTS idx_presensi_mandiri_status
  ON presensi_mandiri (status);

-- 4. Trigger update diperbarui_pada otomatis
CREATE OR REPLACE FUNCTION update_presensi_mandiri_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.diperbarui_pada = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_presensi_mandiri_updated_at ON presensi_mandiri;
CREATE TRIGGER trg_presensi_mandiri_updated_at
  BEFORE UPDATE ON presensi_mandiri
  FOR EACH ROW
  EXECUTE PROCEDURE update_presensi_mandiri_updated_at();
