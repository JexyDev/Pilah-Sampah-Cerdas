-- AlterTable
ALTER TABLE "pengajuan_aktivasi_tempat_sampah" ADD COLUMN     "id_petugas_tujuan" TEXT,
ADD COLUMN     "jenis_sampah" TEXT;

-- AlterTable
ALTER TABLE "pengguna" ADD COLUMN     "id_petugas_tetap" TEXT;

-- AddForeignKey
ALTER TABLE "pengajuan_aktivasi_tempat_sampah" ADD CONSTRAINT "pengajuan_aktivasi_tempat_sampah_id_petugas_tujuan_fkey" FOREIGN KEY ("id_petugas_tujuan") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

