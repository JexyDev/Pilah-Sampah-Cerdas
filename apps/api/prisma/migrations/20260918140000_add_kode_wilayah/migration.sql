-- AlterTable
ALTER TABLE "provinsi" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);

-- AlterTable
ALTER TABLE "kabupaten" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);

-- AlterTable
ALTER TABLE "kecamatan" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);

-- AlterTable
ALTER TABLE "kelurahan" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "provinsi_kode_key" ON "provinsi"("kode");
CREATE INDEX IF NOT EXISTS "kabupaten_kode_idx" ON "kabupaten"("kode");
CREATE INDEX IF NOT EXISTS "kecamatan_kode_idx" ON "kecamatan"("kode");
CREATE INDEX IF NOT EXISTS "kelurahan_kode_idx" ON "kelurahan"("kode");
