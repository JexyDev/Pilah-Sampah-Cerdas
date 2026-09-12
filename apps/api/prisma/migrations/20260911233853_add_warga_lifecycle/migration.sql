-- CreateEnum
CREATE TYPE "WargaLifecycle" AS ENUM ('REGISTERED', 'COMMUNITY_ACTIVE_NO_BIN', 'FULLY_ACTIVE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lifecycleState" "WargaLifecycle" NOT NULL DEFAULT 'REGISTERED';
