-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_kkn" (
    "id" TEXT NOT NULL,
    "tahap_minggu" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3),
    "tanggal_selesai" TIMESTAMP(3),
    "fase" TEXT NOT NULL,
    "kegiatan_utama" TEXT NOT NULL,
    "output_target" TEXT NOT NULL,
    "pic_keterangan" TEXT NOT NULL,
    "status_pelaksanaan" TEXT NOT NULL DEFAULT 'BELUM_DIMULAI',
    "id_kelompok" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_kkn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_kkn_id_kelompok_idx" ON "timeline_kkn"("id_kelompok");
CREATE INDEX IF NOT EXISTS "timeline_kkn_fase_idx" ON "timeline_kkn"("fase");
CREATE INDEX IF NOT EXISTS "timeline_kkn_status_pelaksanaan_idx" ON "timeline_kkn"("status_pelaksanaan");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'timeline_kkn_id_kelompok_fkey'
    ) THEN
        ALTER TABLE "timeline_kkn" ADD CONSTRAINT "timeline_kkn_id_kelompok_fkey" FOREIGN KEY ("id_kelompok") REFERENCES "kelompok_kkn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
