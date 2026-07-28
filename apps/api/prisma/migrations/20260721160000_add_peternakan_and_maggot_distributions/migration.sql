-- CreateTable
CREATE TABLE "peternakan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "pemilik" TEXT NOT NULL,
    "no_wa" TEXT NOT NULL,
    "populasi" INTEGER NOT NULL DEFAULT 0,
    "hasil_panen_kg" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peternakan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maggot_distribution_logs" (
    "id" TEXT NOT NULL,
    "peternakan_id" TEXT NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maggot_distribution_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "maggot_distribution_logs" ADD CONSTRAINT "maggot_distribution_logs_peternakan_id_fkey" FOREIGN KEY ("peternakan_id") REFERENCES "peternakan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
