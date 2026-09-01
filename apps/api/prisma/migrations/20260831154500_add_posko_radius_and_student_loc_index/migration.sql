-- AlterTable
ALTER TABLE "posko_kkn" ADD COLUMN IF NOT EXISTS "radius" INTEGER NOT NULL DEFAULT 150;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lokasi_mahasiswa_id_mahasiswa_direkam_pada_idx" ON "lokasi_mahasiswa"("id_mahasiswa", "direkam_pada" DESC);

