-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "StatusPenilaianKkn" AS ENUM ('DRAFT', 'TERSIMPAN', 'FINAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "penilaian_kkn_mahasiswa" (
    "id" TEXT NOT NULL,
    "id_mahasiswa" TEXT NOT NULL,
    "id_kelompok" TEXT,
    "id_dpl" TEXT,
    "id_mitra" TEXT,
    "nama_mitra_penilai" TEXT,
    "skor_mitra_kehadiran" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_warga_binaan" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_proker" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_komunikasi" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_tanggung_jawab" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_bukti_kegiatan" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_dampak" INTEGER NOT NULL DEFAULT 0,
    "skor_mitra_inisiatif" INTEGER NOT NULL DEFAULT 0,
    "subtotal_mitra" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "skor_dpl_perencanaan" INTEGER NOT NULL DEFAULT 0,
    "skor_dpl_kontribusi" INTEGER NOT NULL DEFAULT 0,
    "skor_dpl_logbook" INTEGER NOT NULL DEFAULT 0,
    "skor_dpl_analisis" INTEGER NOT NULL DEFAULT 0,
    "skor_dpl_output" INTEGER NOT NULL DEFAULT 0,
    "skor_dpl_laporan_akhir" INTEGER NOT NULL DEFAULT 0,
    "subtotal_dpl" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "nilai_akhir" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "kategori_nilai" TEXT,
    "catatan_dpl" TEXT,
    "catatan_mitra" TEXT,
    "status" "StatusPenilaianKkn" NOT NULL DEFAULT 'DRAFT',
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "difinalisasi_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_kkn_mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "penilaian_kkn_mahasiswa_id_mahasiswa_key" ON "penilaian_kkn_mahasiswa"("id_mahasiswa");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'penilaian_kkn_mahasiswa_id_mahasiswa_fkey'
    ) THEN
        ALTER TABLE "penilaian_kkn_mahasiswa" ADD CONSTRAINT "penilaian_kkn_mahasiswa_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'penilaian_kkn_mahasiswa_id_dpl_fkey'
    ) THEN
        ALTER TABLE "penilaian_kkn_mahasiswa" ADD CONSTRAINT "penilaian_kkn_mahasiswa_id_dpl_fkey" FOREIGN KEY ("id_dpl") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'penilaian_kkn_mahasiswa_id_kelompok_fkey'
    ) THEN
        ALTER TABLE "penilaian_kkn_mahasiswa" ADD CONSTRAINT "penilaian_kkn_mahasiswa_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
