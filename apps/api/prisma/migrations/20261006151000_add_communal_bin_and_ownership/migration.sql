-- AlterTable tempat_sampah: add is_communal with default false
ALTER TABLE "tempat_sampah" ADD COLUMN IF NOT EXISTS "is_communal" BOOLEAN NOT NULL DEFAULT false;

-- AlterEnum OwnershipType: add KOMUNAL if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'OwnershipType' AND e.enumlabel = 'KOMUNAL'
    ) THEN
        ALTER TYPE "OwnershipType" ADD VALUE 'KOMUNAL';
    END IF;
END $$;
