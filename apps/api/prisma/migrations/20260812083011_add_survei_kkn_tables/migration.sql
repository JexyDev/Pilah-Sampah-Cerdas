/*
  Warnings:

  - You are about to drop the column `id_rt_rw` on the `fasilitas` table. All the data in the column will be lost.
  - You are about to drop the column `id_poligon_ditugaskan` on the `mahasiswa_kkn` table. All the data in the column will be lost.
  - You are about to drop the column `id_tong` on the `pelanggaran` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `pengguna` table. All the data in the column will be lost.
  - You are about to drop the column `nik` on the `pengguna` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `pengguna` table. All the data in the column will be lost.
  - You are about to drop the column `surel` on the `pengguna` table. All the data in the column will be lost.
  - You are about to drop the column `warga_subtype` on the `pengguna` table. All the data in the column will be lost.
  - You are about to drop the column `id_rt_rw` on the `riwayat_serah_terima_kkn` table. All the data in the column will be lost.
  - You are about to drop the column `id_rt_rw` on the `rumah_tangga` table. All the data in the column will be lost.
  - You are about to drop the column `id_tong` on the `tugas_penjemputan` table. All the data in the column will be lost.
  - You are about to drop the `catatan_setoran` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kepemilikan_tong` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pengajuan_aktivasi_tong` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tong_sampah` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wilayah_rt_rw` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[no_telepon]` on the table `pengguna` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `no_telepon` to the `pengguna` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_rw` to the `riwayat_serah_terima_kkn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_rw` to the `rumah_tangga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tempat_sampah` to the `tugas_penjemputan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FacilityType" ADD VALUE 'buruan_sae';
ALTER TYPE "FacilityType" ADD VALUE 'poc';

-- DropForeignKey
ALTER TABLE "catatan_setoran" DROP CONSTRAINT "catatan_setoran_id_kategori_fkey";

-- DropForeignKey
ALTER TABLE "catatan_setoran" DROP CONSTRAINT "catatan_setoran_id_petugas_verifikator_fkey";

-- DropForeignKey
ALTER TABLE "catatan_setoran" DROP CONSTRAINT "catatan_setoran_id_rumah_tangga_fkey";

-- DropForeignKey
ALTER TABLE "catatan_setoran" DROP CONSTRAINT "catatan_setoran_id_tong_fkey";

-- DropForeignKey
ALTER TABLE "fasilitas" DROP CONSTRAINT "fasilitas_id_rt_rw_fkey";

-- DropForeignKey
ALTER TABLE "kepemilikan_tong" DROP CONSTRAINT "kepemilikan_tong_id_pengguna_fkey";

-- DropForeignKey
ALTER TABLE "kepemilikan_tong" DROP CONSTRAINT "kepemilikan_tong_id_tong_fkey";

-- DropForeignKey
ALTER TABLE "mahasiswa_kkn" DROP CONSTRAINT "mahasiswa_kkn_id_poligon_ditugaskan_fkey";

-- DropForeignKey
ALTER TABLE "pelanggaran" DROP CONSTRAINT "pelanggaran_id_tong_fkey";

-- DropForeignKey
ALTER TABLE "pengajuan_aktivasi_tong" DROP CONSTRAINT "pengajuan_aktivasi_tong_id_pengguna_fkey";

-- DropForeignKey
ALTER TABLE "pengajuan_aktivasi_tong" DROP CONSTRAINT "pengajuan_aktivasi_tong_id_pereview_fkey";

-- DropForeignKey
ALTER TABLE "pengajuan_aktivasi_tong" DROP CONSTRAINT "pengajuan_aktivasi_tong_id_tong_fkey";

-- DropForeignKey
ALTER TABLE "pengguna" DROP CONSTRAINT "pengguna_id_rt_rw_fkey";

-- DropForeignKey
ALTER TABLE "riwayat_serah_terima_kkn" DROP CONSTRAINT "riwayat_serah_terima_kkn_id_rt_rw_fkey";

-- DropForeignKey
ALTER TABLE "rumah_tangga" DROP CONSTRAINT "rumah_tangga_id_rt_rw_fkey";

-- DropForeignKey
ALTER TABLE "tong_sampah" DROP CONSTRAINT "tong_sampah_id_gelombang_qr_fkey";

-- DropForeignKey
ALTER TABLE "tong_sampah" DROP CONSTRAINT "tong_sampah_id_kategori_fkey";

-- DropForeignKey
ALTER TABLE "tong_sampah" DROP CONSTRAINT "tong_sampah_id_kelurahan_fkey";

-- DropForeignKey
ALTER TABLE "tong_sampah" DROP CONSTRAINT "tong_sampah_id_pengguna_fkey";

-- DropForeignKey
ALTER TABLE "tong_sampah" DROP CONSTRAINT "tong_sampah_id_rt_rw_fkey";

-- DropForeignKey
ALTER TABLE "tugas_penjemputan" DROP CONSTRAINT "tugas_penjemputan_id_tong_fkey";

-- DropForeignKey
ALTER TABLE "wilayah_rt_rw" DROP CONSTRAINT "wilayah_rt_rw_id_kelurahan_fkey";

-- DropIndex
DROP INDEX "pengguna_nik_key";

-- DropIndex
DROP INDEX "pengguna_surel_key";

-- AlterTable
ALTER TABLE "fasilitas" DROP COLUMN "id_rt_rw",
ADD COLUMN     "id_rw" INTEGER;

-- AlterTable
ALTER TABLE "jadwal" ADD COLUMN     "id_kelompok" TEXT,
ADD COLUMN     "latitude" DECIMAL(11,8),
ADD COLUMN     "longitude" DECIMAL(11,8),
ADD COLUMN     "polygon" JSONB,
ADD COLUMN     "radius" INTEGER DEFAULT 100;

-- AlterTable
ALTER TABLE "kelurahan" ADD COLUMN     "id_kecamatan" INTEGER;

-- AlterTable
ALTER TABLE "mahasiswa_kkn" DROP COLUMN "id_poligon_ditugaskan",
ADD COLUMN     "id_kelompok" TEXT,
ADD COLUMN     "id_rw_ditugaskan" INTEGER,
ADD COLUMN     "is_ketua" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jenjang_pendidikan" TEXT,
ADD COLUMN     "skor_penilaian_dpl" DECIMAL(5,2) DEFAULT 0.0,
ALTER COLUMN "nim" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pelanggaran" DROP COLUMN "id_tong",
ADD COLUMN     "id_tempat_sampah" TEXT;

-- AlterTable
ALTER TABLE "pengguna" DROP COLUMN "address",
DROP COLUMN "nik",
DROP COLUMN "phone",
DROP COLUMN "surel",
DROP COLUMN "warga_subtype",
ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "harus_ganti_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id_rt" INTEGER,
ADD COLUMN     "institusi" TEXT,
ADD COLUMN     "jabatan" TEXT,
ADD COLUMN     "jenjang_pendidikan" TEXT,
ADD COLUMN     "jumlah_anggota_keluarga" INTEGER,
ADD COLUMN     "nip" TEXT,
ADD COLUMN     "no_telepon" TEXT NOT NULL,
ADD COLUMN     "program_studi" TEXT,
ADD COLUMN     "subtipe_warga" TEXT;

-- AlterTable
ALTER TABLE "riwayat_poin" ADD COLUMN     "redeemable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "riwayat_serah_terima_kkn" DROP COLUMN "id_rt_rw",
ADD COLUMN     "id_rw" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "rumah_tangga" DROP COLUMN "id_rt_rw",
ADD COLUMN     "id_rw" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "tugas_penjemputan" DROP COLUMN "id_tong",
ADD COLUMN     "id_tempat_sampah" TEXT NOT NULL;

-- DropTable
DROP TABLE "catatan_setoran";

-- DropTable
DROP TABLE "kepemilikan_tong";

-- DropTable
DROP TABLE "pengajuan_aktivasi_tong";

-- DropTable
DROP TABLE "tong_sampah";

-- DropTable
DROP TABLE "wilayah_rt_rw";

-- CreateTable
CREATE TABLE "hak_akses" (
    "id" SERIAL NOT NULL,
    "id_peran" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "bisa_lihat" BOOLEAN NOT NULL DEFAULT false,
    "bisa_buat" BOOLEAN NOT NULL DEFAULT false,
    "bisa_edit" BOOLEAN NOT NULL DEFAULT false,
    "bisa_hapus" BOOLEAN NOT NULL DEFAULT false,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hak_akses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinsi" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kabupaten" (
    "id" SERIAL NOT NULL,
    "id_provinsi" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kabupaten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kecamatan" (
    "id" SERIAL NOT NULL,
    "id_kabupaten" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kecamatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rw" (
    "id" SERIAL NOT NULL,
    "id_kelurahan" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "latitude" DECIMAL(11,8),
    "longitude" DECIMAL(11,8),
    "id_petugas_residu" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rt" (
    "id" SERIAL NOT NULL,
    "id_rw" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tempat_sampah" (
    "id" TEXT NOT NULL,
    "kode_qr" TEXT NOT NULL,
    "id_kategori" TEXT,
    "maks_kapasitas_liter" DECIMAL(5,2) NOT NULL DEFAULT 25.0,
    "volume_sekarang_liter" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "id_rw" INTEGER,
    "id_kelurahan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "latitude" DECIMAL(11,8),
    "longitude" DECIMAL(11,8),
    "id_gelombang_qr" TEXT,
    "status" "BinStatus" NOT NULL DEFAULT 'PRINTED',
    "id_pengguna" TEXT,
    "bentuk" TEXT,
    "diameter" DECIMAL(5,2),
    "id_mahasiswa_pendaftar" TEXT,
    "lebar" DECIMAL(5,2),
    "panjang" DECIMAL(5,2),
    "tinggi" DECIMAL(5,2),
    "tipe_wadah" TEXT,

    CONSTRAINT "tempat_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelompok_kkn" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelurahan" TEXT,
    "cakupan_rw" JSONB,
    "dpl_nama_mentah" TEXT,
    "id_dpl" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelompok_kkn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kehadiran_kegiatan" (
    "id" TEXT NOT NULL,
    "id_mahasiswa" TEXT NOT NULL,
    "id_jadwal" TEXT NOT NULL,
    "waktu_absen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metode" TEXT NOT NULL,
    "latitude" DECIMAL(11,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "waktu_checkout" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DALAM_RADIUS',

    CONSTRAINT "kehadiran_kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lokasi_mahasiswa" (
    "id" TEXT NOT NULL,
    "id_mahasiswa" TEXT NOT NULL,
    "latitude" DECIMAL(11,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "direkam_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lokasi_mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan_izin_mahasiswa" (
    "id" TEXT NOT NULL,
    "id_mahasiswa" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "url_bukti" TEXT,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "id_pereview" TEXT,
    "direview_pada" TIMESTAMP(3),
    "alasan_penolakan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_izin_mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setoran_otomatis" (
    "id" TEXT NOT NULL,
    "warga_id" TEXT NOT NULL,
    "foto_sampah_url" TEXT NOT NULL,
    "hasil_klasifikasi_ai" TEXT NOT NULL,
    "confidence_ai" DECIMAL(5,2) NOT NULL,
    "berat" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Kg',
    "poin" DECIMAL(10,2) NOT NULL,
    "qr_tempat_sampah_id" TEXT NOT NULL,
    "lokasi_gps" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setoran_otomatis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setoran_manual" (
    "id" TEXT NOT NULL,
    "petugas_residu_id" TEXT NOT NULL,
    "diinput_oleh" TEXT NOT NULL,
    "rw_id" INTEGER NOT NULL,
    "foto_residu_url" TEXT NOT NULL,
    "berat" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Kg',
    "lokasi_gps" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'residu',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setoran_manual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemanfaatan_sampah" (
    "id" TEXT NOT NULL,
    "id_rw" INTEGER NOT NULL,
    "nomor_cara_pemanfaatan" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "teknologi" TEXT NOT NULL,
    "bahan_baku" TEXT NOT NULL,
    "volume_bahan_baku" DECIMAL(10,2) NOT NULL,
    "unit_bahan_baku" TEXT NOT NULL,
    "hasil" DECIMAL(10,2) NOT NULL,
    "unit_hasil" TEXT NOT NULL,
    "foto_dokumentasi_url" TEXT NOT NULL,
    "tanggal_pencatatan" TIMESTAMP(3) NOT NULL,
    "jenis_komoditas" TEXT,
    "luas_lahan_m2" DECIMAL(8,2),
    "volume_pupuk_dipakai_kg" DECIMAL(10,2),
    "bibit_telur_gram" DECIMAL(8,2),
    "hasil_kasgot_kg" DECIMAL(10,2),
    "volume_bioaktivator_liter" DECIMAL(8,2),
    "masa_fermentasi_hari" INTEGER,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemanfaatan_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan_aktivasi_tempat_sampah" (
    "id" TEXT NOT NULL,
    "id_tempat_sampah" TEXT NOT NULL,
    "id_pengguna" TEXT NOT NULL,
    "url_foto_bukti" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "id_pereview" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_aktivasi_tempat_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kepemilikan_tempat_sampah" (
    "id" TEXT NOT NULL,
    "id_tempat_sampah" TEXT NOT NULL,
    "id_pengguna" TEXT NOT NULL,
    "tipe_kepemilikan" "OwnershipType" NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kepemilikan_tempat_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_kelurahan" (
    "id_kelurahan_survei" INTEGER NOT NULL,
    "nama_kelurahan" VARCHAR(100) NOT NULL,
    "kecamatan" VARCHAR(100),
    "jumlah_rw" INTEGER,
    "jumlah_rt" INTEGER,
    "tanggal_survei" DATE,
    "jumlah_kk" INTEGER,
    "jumlah_rumah_total" INTEGER,
    "enumerator" VARCHAR(100),
    "titik_kumpul_mahasiswa" VARCHAR(255),
    "catatan_data" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survei_kelurahan_pkey" PRIMARY KEY ("id_kelurahan_survei")
);

-- CreateTable
CREATE TABLE "survei_karakteristik_wilayah" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_survei" INTEGER NOT NULL,
    "padat_penduduk" BOOLEAN,
    "banyak_kos_kontrakan" BOOLEAN,
    "banyak_umkm_warung_kafe" BOOLEAN,
    "dekat_kampus_sekolah" BOOLEAN,
    "pasar" BOOLEAN,
    "bantaran_sungai" BOOLEAN,
    "karakter_lainnya_flag" BOOLEAN,
    "karakter_lainnya_keterangan" TEXT,
    "perkiraan_jumlah_kos_kontrakan" VARCHAR(50),
    "perkiraan_jumlah_umkm_warung_kafe" VARCHAR(50),

    CONSTRAINT "survei_karakteristik_wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_pemilahan_sampah" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_survei" INTEGER NOT NULL,
    "jumlah_rumah_memilah" INTEGER,
    "total_jumlah_rumah_di_rw" INTEGER,
    "persentase_pemilahan" DECIMAL(5,4),
    "tingkat_pemilahan" VARCHAR(50),
    "catatan" TEXT,

    CONSTRAINT "survei_pemilahan_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_bank_sampah_pengolahan" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_survei" INTEGER NOT NULL,
    "bank_sampah_aktif" INTEGER,
    "bank_sampah_tidak_aktif" INTEGER,
    "jumlah_unit_komposter" VARCHAR(50),
    "jumlah_titik_maggot_bsf" VARCHAR(100),
    "biopori_loseda" BOOLEAN,
    "ecobrick_kerajinan_daur_ulang" BOOLEAN,
    "buruan_sae" BOOLEAN,
    "pengepul_mitra_daur_ulang" BOOLEAN,
    "digitalisasi_data" BOOLEAN,
    "aktivitas_lainnya_keterangan" TEXT,

    CONSTRAINT "survei_bank_sampah_pengolahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_key_player" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_survei" INTEGER NOT NULL,
    "jenis_aktor" VARCHAR(100),
    "nama" VARCHAR(150),
    "kontak" VARCHAR(50),
    "peran" VARCHAR(255),

    CONSTRAINT "survei_key_player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_volume_sampah" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_survei" INTEGER NOT NULL,
    "organik_kg_per_hari" DECIMAL(10,2),
    "anorganik_kg_per_hari" DECIMAL(10,2),
    "residu_kg_per_hari" DECIMAL(10,2),
    "total_volume_kg_per_hari" DECIMAL(10,2),
    "catatan" TEXT,

    CONSTRAINT "survei_volume_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_catatan_kesimpulan" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_survei" INTEGER NOT NULL,
    "prioritas_intervensi" TEXT,
    "catatan_tambahan_risiko_sosial" TEXT,

    CONSTRAINT "survei_catatan_kesimpulan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catatan_impor" (
    "id" TEXT NOT NULL,
    "id_pengguna" TEXT NOT NULL,
    "nama_file" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "ringkasan" JSONB,
    "pesan_error" JSONB,
    "baris_diimpor" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catatan_impor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hak_akses_id_peran_resource_key" ON "hak_akses"("id_peran", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "provinsi_nama_key" ON "provinsi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "kabupaten_id_provinsi_nama_key" ON "kabupaten"("id_provinsi", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "kecamatan_id_kabupaten_nama_key" ON "kecamatan"("id_kabupaten", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "rw_id_petugas_residu_key" ON "rw"("id_petugas_residu");

-- CreateIndex
CREATE UNIQUE INDEX "rw_id_kelurahan_nama_key" ON "rw"("id_kelurahan", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "rt_id_rw_nama_key" ON "rt"("id_rw", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "tempat_sampah_kode_qr_key" ON "tempat_sampah"("kode_qr");

-- CreateIndex
CREATE UNIQUE INDEX "kelompok_kkn_nama_key" ON "kelompok_kkn"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "kehadiran_kegiatan_id_mahasiswa_id_jadwal_key" ON "kehadiran_kegiatan"("id_mahasiswa", "id_jadwal");

-- CreateIndex
CREATE INDEX "lokasi_mahasiswa_direkam_pada_idx" ON "lokasi_mahasiswa"("direkam_pada");

-- CreateIndex
CREATE UNIQUE INDEX "pemanfaatan_sampah_nomor_cara_pemanfaatan_key" ON "pemanfaatan_sampah"("nomor_cara_pemanfaatan");

-- CreateIndex
CREATE UNIQUE INDEX "kepemilikan_tempat_sampah_id_tempat_sampah_id_pengguna_key" ON "kepemilikan_tempat_sampah"("id_tempat_sampah", "id_pengguna");

-- CreateIndex
CREATE UNIQUE INDEX "survei_karakteristik_wilayah_id_kelurahan_survei_key" ON "survei_karakteristik_wilayah"("id_kelurahan_survei");

-- CreateIndex
CREATE UNIQUE INDEX "survei_pemilahan_sampah_id_kelurahan_survei_key" ON "survei_pemilahan_sampah"("id_kelurahan_survei");

-- CreateIndex
CREATE UNIQUE INDEX "survei_bank_sampah_pengolahan_id_kelurahan_survei_key" ON "survei_bank_sampah_pengolahan"("id_kelurahan_survei");

-- CreateIndex
CREATE UNIQUE INDEX "survei_volume_sampah_id_kelurahan_survei_key" ON "survei_volume_sampah"("id_kelurahan_survei");

-- CreateIndex
CREATE UNIQUE INDEX "survei_catatan_kesimpulan_id_kelurahan_survei_key" ON "survei_catatan_kesimpulan"("id_kelurahan_survei");

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_no_telepon_key" ON "pengguna"("no_telepon");

-- AddForeignKey
ALTER TABLE "hak_akses" ADD CONSTRAINT "hak_akses_id_peran_fkey" FOREIGN KEY ("id_peran") REFERENCES "peran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kabupaten" ADD CONSTRAINT "kabupaten_id_provinsi_fkey" FOREIGN KEY ("id_provinsi") REFERENCES "provinsi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kecamatan" ADD CONSTRAINT "kecamatan_id_kabupaten_fkey" FOREIGN KEY ("id_kabupaten") REFERENCES "kabupaten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelurahan" ADD CONSTRAINT "kelurahan_id_kecamatan_fkey" FOREIGN KEY ("id_kecamatan") REFERENCES "kecamatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rw" ADD CONSTRAINT "rw_id_kelurahan_fkey" FOREIGN KEY ("id_kelurahan") REFERENCES "kelurahan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rw" ADD CONSTRAINT "rw_id_petugas_residu_fkey" FOREIGN KEY ("id_petugas_residu") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rt" ADD CONSTRAINT "rt_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_rt_rw_fkey" FOREIGN KEY ("id_rt_rw") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_rt_fkey" FOREIGN KEY ("id_rt") REFERENCES "rt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rumah_tangga" ADD CONSTRAINT "rumah_tangga_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_gelombang_qr_fkey" FOREIGN KEY ("id_gelombang_qr") REFERENCES "gelombang_qr"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_kategori_fkey" FOREIGN KEY ("id_kategori") REFERENCES "kategori_sampah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_kelurahan_fkey" FOREIGN KEY ("id_kelurahan") REFERENCES "kelurahan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_mahasiswa_pendaftar_fkey" FOREIGN KEY ("id_mahasiswa_pendaftar") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_sampah" ADD CONSTRAINT "tempat_sampah_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa_kkn" ADD CONSTRAINT "mahasiswa_kkn_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa_kkn" ADD CONSTRAINT "mahasiswa_kkn_id_rw_ditugaskan_fkey" FOREIGN KEY ("id_rw_ditugaskan") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelompok_kkn" ADD CONSTRAINT "kelompok_kkn_id_dpl_fkey" FOREIGN KEY ("id_dpl") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_serah_terima_kkn" ADD CONSTRAINT "riwayat_serah_terima_kkn_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_kegiatan" ADD CONSTRAINT "kehadiran_kegiatan_id_jadwal_fkey" FOREIGN KEY ("id_jadwal") REFERENCES "jadwal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kehadiran_kegiatan" ADD CONSTRAINT "kehadiran_kegiatan_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lokasi_mahasiswa" ADD CONSTRAINT "lokasi_mahasiswa_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_izin_mahasiswa" ADD CONSTRAINT "pengajuan_izin_mahasiswa_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_izin_mahasiswa" ADD CONSTRAINT "pengajuan_izin_mahasiswa_id_pereview_fkey" FOREIGN KEY ("id_pereview") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fasilitas" ADD CONSTRAINT "fasilitas_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_otomatis" ADD CONSTRAINT "setoran_otomatis_qr_tempat_sampah_id_fkey" FOREIGN KEY ("qr_tempat_sampah_id") REFERENCES "tempat_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_otomatis" ADD CONSTRAINT "setoran_otomatis_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_manual" ADD CONSTRAINT "setoran_manual_petugas_residu_id_fkey" FOREIGN KEY ("petugas_residu_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_manual" ADD CONSTRAINT "setoran_manual_rw_id_fkey" FOREIGN KEY ("rw_id") REFERENCES "rw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemanfaatan_sampah" ADD CONSTRAINT "pemanfaatan_sampah_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_aktivasi_tempat_sampah" ADD CONSTRAINT "pengajuan_aktivasi_tempat_sampah_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_aktivasi_tempat_sampah" ADD CONSTRAINT "pengajuan_aktivasi_tempat_sampah_id_pereview_fkey" FOREIGN KEY ("id_pereview") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_aktivasi_tempat_sampah" ADD CONSTRAINT "pengajuan_aktivasi_tempat_sampah_id_tempat_sampah_fkey" FOREIGN KEY ("id_tempat_sampah") REFERENCES "tempat_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepemilikan_tempat_sampah" ADD CONSTRAINT "kepemilikan_tempat_sampah_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kepemilikan_tempat_sampah" ADD CONSTRAINT "kepemilikan_tempat_sampah_id_tempat_sampah_fkey" FOREIGN KEY ("id_tempat_sampah") REFERENCES "tempat_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_penjemputan" ADD CONSTRAINT "tugas_penjemputan_id_tempat_sampah_fkey" FOREIGN KEY ("id_tempat_sampah") REFERENCES "tempat_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggaran" ADD CONSTRAINT "pelanggaran_id_tempat_sampah_fkey" FOREIGN KEY ("id_tempat_sampah") REFERENCES "tempat_sampah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_karakteristik_wilayah" ADD CONSTRAINT "survei_karakteristik_wilayah_id_kelurahan_survei_fkey" FOREIGN KEY ("id_kelurahan_survei") REFERENCES "survei_kelurahan"("id_kelurahan_survei") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_pemilahan_sampah" ADD CONSTRAINT "survei_pemilahan_sampah_id_kelurahan_survei_fkey" FOREIGN KEY ("id_kelurahan_survei") REFERENCES "survei_kelurahan"("id_kelurahan_survei") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_bank_sampah_pengolahan" ADD CONSTRAINT "survei_bank_sampah_pengolahan_id_kelurahan_survei_fkey" FOREIGN KEY ("id_kelurahan_survei") REFERENCES "survei_kelurahan"("id_kelurahan_survei") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_key_player" ADD CONSTRAINT "survei_key_player_id_kelurahan_survei_fkey" FOREIGN KEY ("id_kelurahan_survei") REFERENCES "survei_kelurahan"("id_kelurahan_survei") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_volume_sampah" ADD CONSTRAINT "survei_volume_sampah_id_kelurahan_survei_fkey" FOREIGN KEY ("id_kelurahan_survei") REFERENCES "survei_kelurahan"("id_kelurahan_survei") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_catatan_kesimpulan" ADD CONSTRAINT "survei_catatan_kesimpulan_id_kelurahan_survei_fkey" FOREIGN KEY ("id_kelurahan_survei") REFERENCES "survei_kelurahan"("id_kelurahan_survei") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_impor" ADD CONSTRAINT "catatan_impor_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;
