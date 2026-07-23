-- AlterEnum
ALTER TYPE "BinStatus" ADD VALUE 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "facilities" ADD COLUMN     "rt_rw_id" INTEGER,
ADD COLUMN     "status_approval" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "petugas_residu" ADD COLUMN     "whitelist_status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "kkn_handover_history" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "rt_rw_id" INTEGER NOT NULL,
    "notes" TEXT,
    "handover_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kkn_handover_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_rt_rw_id_fkey" FOREIGN KEY ("rt_rw_id") REFERENCES "rt_rw_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kkn_handover_history" ADD CONSTRAINT "kkn_handover_history_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kkn_handover_history" ADD CONSTRAINT "kkn_handover_history_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kkn_handover_history" ADD CONSTRAINT "kkn_handover_history_rt_rw_id_fkey" FOREIGN KEY ("rt_rw_id") REFERENCES "rt_rw_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
