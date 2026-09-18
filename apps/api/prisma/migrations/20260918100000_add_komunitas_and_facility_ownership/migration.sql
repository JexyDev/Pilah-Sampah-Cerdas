-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "FacilityOwnership" AS ENUM ('MILIK_RW', 'PRIBADI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "fasilitas" ADD COLUMN IF NOT EXISTS "kepemilikan" "FacilityOwnership" NOT NULL DEFAULT 'PRIBADI';

-- AlterTable
ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_komunitas" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pengguna_id_komunitas_key" ON "pengguna"("id_komunitas");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tempat_sampah_id_kelompok_idx" ON "tempat_sampah"("id_kelompok");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

