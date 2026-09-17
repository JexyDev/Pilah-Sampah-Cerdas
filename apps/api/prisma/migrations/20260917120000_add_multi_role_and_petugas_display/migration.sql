-- AlterTable: Add display name and kelurahan to petugas_residu
ALTER TABLE "petugas_residu" ADD COLUMN IF NOT EXISTS "nama_display" TEXT;
ALTER TABLE "petugas_residu" ADD COLUMN IF NOT EXISTS "kelurahan" TEXT;

-- CreateTable: Add junction table for multi-role support (Option A)
CREATE TABLE IF NOT EXISTS "pengguna_peran" (
    "id" SERIAL PRIMARY KEY,
    "id_pengguna" TEXT NOT NULL,
    "id_peran" INTEGER NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pengguna_peran_id_pengguna_fkey" FOREIGN KEY ("id_pengguna") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengguna_peran_id_peran_fkey" FOREIGN KEY ("id_peran") REFERENCES "peran"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pengguna_peran_id_pengguna_id_peran_key" ON "pengguna_peran"("id_pengguna", "id_peran");
