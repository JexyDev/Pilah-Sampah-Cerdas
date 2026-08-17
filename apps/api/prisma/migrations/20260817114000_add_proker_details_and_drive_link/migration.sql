-- AlterTable
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "kategori" TEXT DEFAULT 'LAINNYA';
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "sumber" TEXT DEFAULT 'MAHASISWA';
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "waktu_pelaksanaan" TEXT;
ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "link_google_drive" TEXT;
