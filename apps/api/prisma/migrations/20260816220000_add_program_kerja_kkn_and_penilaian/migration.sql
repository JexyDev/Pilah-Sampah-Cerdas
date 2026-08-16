-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusProker" AS ENUM ('BELUM_DISETUJUI', 'DITERIMA', 'DITOLAK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "catatan_penilaian_dpl" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "program_kerja_kkn" (
    "id" TEXT NOT NULL,
    "id_kelompok" TEXT NOT NULL,
    "nomor" INTEGER,
    "deskripsi" TEXT NOT NULL,
    "kebutuhan_biaya" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" "StatusProker" NOT NULL DEFAULT 'BELUM_DISETUJUI',
    "catatan_dpl" TEXT,
    "id_pereview" TEXT,
    "direview_pada" TIMESTAMP(3),
    "skor_penilaian" DECIMAL(5,2),
    "evaluasi_dpl" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_kerja_kkn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "program_kerja_kkn" ADD CONSTRAINT "program_kerja_kkn_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "program_kerja_kkn" ADD CONSTRAINT "program_kerja_kkn_id_pereview_fkey" FOREIGN KEY ("id_pereview") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
