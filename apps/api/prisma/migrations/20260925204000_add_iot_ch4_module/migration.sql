-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CH4StatusLevel') THEN
        CREATE TYPE "CH4StatusLevel" AS ENUM ('AMAN', 'WASPADA', 'BAHAYA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IoTDeviceStatus') THEN
        CREATE TYPE "IoTDeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
    END IF;
END $$;

-- CreateTable perangkat_iot
CREATE TABLE IF NOT EXISTS "perangkat_iot" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode_node" TEXT NOT NULL,
    "nama_lokasi" TEXT NOT NULL,
    "latitude" DECIMAL(11,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "IoTDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "api_key" TEXT NOT NULL,
    "kelurahan" TEXT,
    "id_kelurahan" TEXT,
    "id_rw" INTEGER,
    "id_petugas_pic" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perangkat_iot_pkey" PRIMARY KEY ("id")
);

-- CreateTable pembacaan_sensor_ch4
CREATE TABLE IF NOT EXISTS "pembacaan_sensor_ch4" (
    "id" TEXT NOT NULL,
    "id_perangkat" TEXT NOT NULL,
    "nilai_ppm" DECIMAL(8,2) NOT NULL,
    "suhu_celsius" DECIMAL(5,2),
    "kelembaban_persen" DECIMAL(5,2),
    "level_baterai" DECIMAL(5,2),
    "tingkat_status" "CH4StatusLevel" NOT NULL DEFAULT 'AMAN',
    "waktu_rekam" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pembacaan_sensor_ch4_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "perangkat_iot_kode_node_key" ON "perangkat_iot"("kode_node");
CREATE UNIQUE INDEX IF NOT EXISTS "perangkat_iot_api_key_key" ON "perangkat_iot"("api_key");
CREATE INDEX IF NOT EXISTS "perangkat_iot_id_kelurahan_idx" ON "perangkat_iot"("id_kelurahan");
CREATE INDEX IF NOT EXISTS "perangkat_iot_id_rw_idx" ON "perangkat_iot"("id_rw");
CREATE INDEX IF NOT EXISTS "perangkat_iot_id_petugas_pic_idx" ON "perangkat_iot"("id_petugas_pic");
CREATE INDEX IF NOT EXISTS "pembacaan_sensor_ch4_id_perangkat_waktu_rekam_idx" ON "pembacaan_sensor_ch4"("id_perangkat", "waktu_rekam");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'perangkat_iot_id_kelurahan_fkey'
    ) THEN
        ALTER TABLE "perangkat_iot" ADD CONSTRAINT "perangkat_iot_id_kelurahan_fkey" FOREIGN KEY ("id_kelurahan") REFERENCES "kelurahan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'perangkat_iot_id_rw_fkey'
    ) THEN
        ALTER TABLE "perangkat_iot" ADD CONSTRAINT "perangkat_iot_id_rw_fkey" FOREIGN KEY ("id_rw") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'perangkat_iot_id_petugas_pic_fkey'
    ) THEN
        ALTER TABLE "perangkat_iot" ADD CONSTRAINT "perangkat_iot_id_petugas_pic_fkey" FOREIGN KEY ("id_petugas_pic") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pembacaan_sensor_ch4_id_perangkat_fkey'
    ) THEN
        ALTER TABLE "pembacaan_sensor_ch4" ADD CONSTRAINT "pembacaan_sensor_ch4_id_perangkat_fkey" FOREIGN KEY ("id_perangkat") REFERENCES "perangkat_iot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
