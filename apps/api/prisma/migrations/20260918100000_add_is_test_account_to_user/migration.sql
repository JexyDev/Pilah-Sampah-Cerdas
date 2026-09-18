-- AlterTable: Add is_test_account to pengguna
ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "is_test_account" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pengguna_is_test_account_idx" ON "pengguna"("is_test_account");

-- Tag known existing test accounts
UPDATE "pengguna"
SET "is_test_account" = true
WHERE "no_telepon" IN (
    '+628111111111', '+628111111112', '+628111111113', '+628111111114',
    '+628111111115', '+628111111116', '+628111111117', '+628111111118',
    '+62812001001'
)
OR "nama" ILIKE '%QC Test%'
OR "nama" ILIKE '%Super User Test%'
OR "nama" ILIKE '%Jeremy Test Tf%'
OR "nama" ILIKE '%Task Force QC TEST%'
OR "nama" ILIKE '%Testing%'
OR "email" ILIKE '%@test.%'
OR "email" ILIKE '%@berseka.test%';
