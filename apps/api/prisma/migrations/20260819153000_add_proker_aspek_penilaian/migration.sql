-- AlterTable
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "aspek_penilaian" JSONB;
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "predikat" TEXT;
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_penilaian" TEXT DEFAULT 'BELUM_DINILAI';
