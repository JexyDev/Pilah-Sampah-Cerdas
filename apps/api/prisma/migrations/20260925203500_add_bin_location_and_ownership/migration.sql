-- AlterTable tempat_sampah
ALTER TABLE "tempat_sampah" ADD COLUMN IF NOT EXISTS "deskripsi_lokasi" TEXT;
ALTER TABLE "tempat_sampah" ADD COLUMN IF NOT EXISTS "tipe_kepemilikan" VARCHAR(50) DEFAULT 'RUMAH_TANGGA';
