-- CreateTable
CREATE TABLE IF NOT EXISTS "universitas_mitra" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universitas_mitra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "universitas_mitra_nama_key" ON "universitas_mitra"("nama");

-- AlterTable
ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_universitas" TEXT;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_id_universitas_fkey'
    ) THEN
        ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_universitas_fkey" FOREIGN KEY ("id_universitas") REFERENCES "universitas_mitra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
