-- CreateTable
CREATE TABLE "violations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bin_id" TEXT,
    "petugas_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "evidence_photo_url" TEXT NOT NULL,
    "notes" TEXT,
    "points_deducted" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_petugas_user_id_fkey" FOREIGN KEY ("petugas_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
