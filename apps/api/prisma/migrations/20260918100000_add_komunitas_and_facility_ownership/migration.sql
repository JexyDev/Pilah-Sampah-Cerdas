-- CreateEnum
CREATE TYPE "FacilityOwnership" AS ENUM ('MILIK_RW', 'PRIBADI');

-- AlterTable
ALTER TABLE "fasilitas" ADD COLUMN "kepemilikan" "FacilityOwnership" NOT NULL DEFAULT 'PRIBADI';

-- AlterTable
ALTER TABLE "pengguna" ADD COLUMN "id_komunitas" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_id_komunitas_key" ON "pengguna"("id_komunitas");

-- CreateIndex
CREATE INDEX "tempat_sampah_id_kelompok_idx" ON "tempat_sampah"("id_kelompok");

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
