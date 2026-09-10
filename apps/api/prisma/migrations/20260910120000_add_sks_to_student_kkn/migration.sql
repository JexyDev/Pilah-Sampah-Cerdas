-- AlterTable
ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "konversi_sks" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mahasiswa_kkn_konversi_sks_idx" ON "mahasiswa_kkn"("konversi_sks");
