-- AlterEnum FacilityType
DO $$ BEGIN
    ALTER TYPE "FacilityType" ADD VALUE IF NOT EXISTS 'posko_kkn';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum StatusProker
DO $$ BEGIN
    ALTER TYPE "StatusProker" ADD VALUE IF NOT EXISTS 'SEDANG_BERJALAN';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "StatusProker" ADD VALUE IF NOT EXISTS 'SELESAI';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable buku_panduan
CREATE TABLE IF NOT EXISTS "buku_panduan" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kategori_peran" TEXT NOT NULL,
    "deskripsi" TEXT,
    "file_url" TEXT,
    "link_url" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buku_panduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable master_kegiatan_sampah
CREATE TABLE IF NOT EXISTS "master_kegiatan_sampah" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_kegiatan_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "master_kegiatan_sampah_nama_key" ON "master_kegiatan_sampah"("nama");
