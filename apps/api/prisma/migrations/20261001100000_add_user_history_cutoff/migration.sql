-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HistoryScope') THEN
        CREATE TYPE "HistoryScope" AS ENUM ('POINTS', 'WASTE_DEPOSITS', 'KKN_ACTIVITIES', 'PETUGAS_TASKS');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "pengguna_riwayat_cutoff" (
    "id" SERIAL NOT NULL,
    "id_pengguna" TEXT NOT NULL,
    "cakupan" "HistoryScope" NOT NULL,
    "dibersihkan_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_riwayat_cutoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pengguna_riwayat_cutoff_id_pengguna_cakupan_key" ON "pengguna_riwayat_cutoff"("id_pengguna", "cakupan");
CREATE INDEX IF NOT EXISTS "pengguna_riwayat_cutoff_id_pengguna_idx" ON "pengguna_riwayat_cutoff"("id_pengguna");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_riwayat_cutoff_id_pengguna_fkey'
    ) THEN
        ALTER TABLE "pengguna_riwayat_cutoff" ADD CONSTRAINT "pengguna_riwayat_cutoff_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
