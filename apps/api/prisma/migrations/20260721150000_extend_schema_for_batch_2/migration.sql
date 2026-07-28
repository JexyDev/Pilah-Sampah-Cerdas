-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'CLAIMED', 'COMPLETED');

-- AlterTable
ALTER TABLE "petugas_residu" ADD COLUMN "latitude" DECIMAL(11,8), ADD COLUMN "longitude" DECIMAL(11,8);

-- AlterTable
ALTER TABLE "waste_logs" ADD COLUMN "verified_by_petugas_id" TEXT, ADD COLUMN "verified_at" TIMESTAMP(3), ADD COLUMN "petugas_classification" TEXT;

-- AlterTable
ALTER TABLE "point_history" ADD COLUMN "kategori" TEXT NOT NULL DEFAULT 'REDUKSI_TONASE';

-- CreateTable
CREATE TABLE "dispatch_tasks" (
    "id" TEXT NOT NULL,
    "bin_id" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "claimed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "waste_logs" ADD CONSTRAINT "waste_logs_verified_by_petugas_id_fkey" FOREIGN KEY ("verified_by_petugas_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_tasks" ADD CONSTRAINT "dispatch_tasks_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_tasks" ADD CONSTRAINT "dispatch_tasks_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
