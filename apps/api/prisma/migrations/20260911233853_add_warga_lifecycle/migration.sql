-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WargaLifecycle" AS ENUM ('REGISTERED', 'COMMUNITY_ACTIVE_NO_BIN', 'FULLY_ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
-- Tabel User dipetakan ke "pengguna" via @@map di schema.prisma.
-- Versi sebelumnya menarget "User" sehingga gagal: relation "User" does not exist.
ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "lifecycleState" "WargaLifecycle" NOT NULL DEFAULT 'REGISTERED';
