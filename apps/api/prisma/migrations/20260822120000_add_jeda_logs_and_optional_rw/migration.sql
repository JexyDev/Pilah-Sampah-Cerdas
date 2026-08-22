-- DropForeignKey
ALTER TABLE "rumah_tangga" DROP CONSTRAINT "rumah_tangga_id_rw_fkey";

-- AlterTable
ALTER TABLE "rumah_tangga" ALTER COLUMN "id_rw" DROP NOT NULL;

-- AlterTable
ALTER TABLE "riwayat_serah_terima_kkn" ALTER COLUMN "id_rw" DROP NOT NULL;

-- AlterTable
ALTER TABLE "kehadiran_kegiatan" ADD COLUMN     "log_jeda" JSONB;

-- AlterTable
ALTER TABLE "pemanfaatan_sampah" ALTER COLUMN "id_rw" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "rumah_tangga" ADD CONSTRAINT "rumah_tangga_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;

