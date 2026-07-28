-- CreateEnum
CREATE TYPE "BinStatus" AS ENUM ('PRINTED', 'ASSIGNED_TO_PIC', 'ACTIVE_BOUND', 'BROKEN', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('loseda', 'bata_terawang', 'rumah_maggot', 'bank_sampah', 'tps');

-- AlterTable
ALTER TABLE "bins" ADD COLUMN     "kepemilikan_tambahan_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kepemilikan_utama_user_id" TEXT,
ADD COLUMN     "qr_batch_id" TEXT,
ADD COLUMN     "status" "BinStatus" NOT NULL DEFAULT 'PRINTED',
ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "foto_profil" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rt_rw_id" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Aktif',
ADD COLUMN     "warga_subtype" TEXT;

-- AlterTable
ALTER TABLE "waste_logs" ADD COLUMN     "actual_weight_petugas" DECIMAL(5,2),
ADD COLUMN     "ai_classification" TEXT,
ADD COLUMN     "ai_confidence" DECIMAL(5,2),
ADD COLUMN     "discrepancy_status" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "geolocation" TEXT;

-- CreateTable
CREATE TABLE "qr_batches" (
    "id" TEXT NOT NULL,
    "batch_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assigned_pic_user_id" TEXT,
    "total_qr" INTEGER NOT NULL,
    "printed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students_kkn" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "jurusan" TEXT NOT NULL,
    "fakultas" TEXT NOT NULL,
    "no_wa" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "assigned_polygon_id" INTEGER,
    "whitelist_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_kkn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petugas_residu" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "no_wa" TEXT NOT NULL,
    "kpi_score" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    "assigned_zone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petugas_residu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "jenis" "FacilityType" NOT NULL,
    "nama" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "foto" TEXT,
    "kontak" TEXT,
    "kapasitas" DECIMAL(10,2),
    "latitude" DECIMAL(11,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_production_logs" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "material_masuk_kg" DECIMAL(10,2) NOT NULL,
    "output_kg" DECIMAL(10,2) NOT NULL,
    "jenis_output" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facility_production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_sampah_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "saldo_rupiah" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "riwayat_transaksi" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_sampah_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ide_daur_ulang" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "foto" TEXT,
    "material" TEXT NOT NULL,
    "status_approval" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ide_daur_ulang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "deskripsi" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_trail" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_value" JSONB,
    "new_value" JSONB,

    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_feed" (
    "id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "tujuan" TEXT NOT NULL,
    "status_kirim" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_batches_batch_code_key" ON "qr_batches"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "students_kkn_user_id_key" ON "students_kkn"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_kkn_nim_key" ON "students_kkn"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "petugas_residu_user_id_key" ON "petugas_residu"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_sampah_ledger_user_id_key" ON "bank_sampah_ledger"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_nik_key" ON "users"("nik");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_rt_rw_id_fkey" FOREIGN KEY ("rt_rw_id") REFERENCES "rt_rw_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_batches" ADD CONSTRAINT "qr_batches_assigned_pic_user_id_fkey" FOREIGN KEY ("assigned_pic_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bins" ADD CONSTRAINT "bins_kepemilikan_utama_user_id_fkey" FOREIGN KEY ("kepemilikan_utama_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bins" ADD CONSTRAINT "bins_qr_batch_id_fkey" FOREIGN KEY ("qr_batch_id") REFERENCES "qr_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bins" ADD CONSTRAINT "bins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_kkn" ADD CONSTRAINT "students_kkn_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_kkn" ADD CONSTRAINT "students_kkn_assigned_polygon_id_fkey" FOREIGN KEY ("assigned_polygon_id") REFERENCES "rt_rw_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petugas_residu" ADD CONSTRAINT "petugas_residu_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_production_logs" ADD CONSTRAINT "facility_production_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_sampah_ledger" ADD CONSTRAINT "bank_sampah_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ide_daur_ulang" ADD CONSTRAINT "ide_daur_ulang_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
