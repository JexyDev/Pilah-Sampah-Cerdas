import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("[EnsureSchema] Running direct schema migration queries...");
  const queries = [
    `CREATE TABLE IF NOT EXISTS "universitas_mitra" (
      "id" TEXT NOT NULL,
      "nama" TEXT NOT NULL,
      "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "universitas_mitra_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "universitas_mitra_nama_key" ON "universitas_mitra"("nama");`,
    `ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_universitas" TEXT;`,
    `ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "is_test_account" BOOLEAN NOT NULL DEFAULT false;`,
    `CREATE INDEX IF NOT EXISTS "pengguna_is_test_account_idx" ON "pengguna"("is_test_account");`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_id_universitas_fkey'
      ) THEN
        ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_universitas_fkey" FOREIGN KEY ("id_universitas") REFERENCES "universitas_mitra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;`,
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log("[EnsureSchema] Executed: " + q.replace(/\s+/g, " ").slice(0, 60) + "...");
    } catch (e: any) {
      console.warn("[EnsureSchema] Warning: " + e?.message || e);
    }
  }

  console.log("[EnsureSchema] Schema synchronization completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[EnsureSchema] Fatal error:", err);
  process.exit(0);
});
