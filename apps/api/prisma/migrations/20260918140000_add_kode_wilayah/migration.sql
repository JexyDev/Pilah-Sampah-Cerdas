-- AlterTable
ALTER TABLE "provinsi" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);

-- AlterTable
ALTER TABLE "kabupaten" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);

-- AlterTable
ALTER TABLE "kecamatan" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);

-- AlterTable
ALTER TABLE "kelurahan" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "provinsi_kode_key" ON "provinsi"("kode");
CREATE INDEX IF NOT EXISTS "kabupaten_kode_idx" ON "kabupaten"("kode");
CREATE INDEX IF NOT EXISTS "kecamatan_kode_idx" ON "kecamatan"("kode");
CREATE INDEX IF NOT EXISTS "kelurahan_kode_idx" ON "kelurahan"("kode");

-- Update Kode Wilayah Kemendagri Aktual
UPDATE "provinsi" SET "kode" = '32' WHERE "nama" ILIKE '%Jawa Barat%' AND "kode" IS NULL;
UPDATE "provinsi" SET "kode" = '31' WHERE "nama" ILIKE '%DKI Jakarta%' AND "kode" IS NULL;
UPDATE "provinsi" SET "kode" = '33' WHERE "nama" ILIKE '%Jawa Tengah%' AND "kode" IS NULL;
UPDATE "provinsi" SET "kode" = '35' WHERE "nama" ILIKE '%Jawa Timur%' AND "kode" IS NULL;
UPDATE "provinsi" SET "kode" = '36' WHERE "nama" ILIKE '%Banten%' AND "kode" IS NULL;

UPDATE "kabupaten" SET "kode" = '73' WHERE "nama" ILIKE '%Kota Bandung%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '04' WHERE "nama" ILIKE '%Kabupaten Bandung%' AND "nama" NOT ILIKE '%Barat%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '17' WHERE "nama" ILIKE '%Bandung Barat%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '77' WHERE "nama" ILIKE '%Cimahi%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '71' WHERE "nama" ILIKE '%Kota Bogor%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '01' WHERE "nama" ILIKE '%Kabupaten Bogor%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '75' WHERE "nama" ILIKE '%Kota Bekasi%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '16' WHERE "nama" ILIKE '%Kabupaten Bekasi%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '76' WHERE "nama" ILIKE '%Depok%' AND "kode" IS NULL;
UPDATE "kabupaten" SET "kode" = '05' WHERE "nama" ILIKE '%Garut%' AND "kode" IS NULL;

UPDATE "kecamatan" SET "kode" = '02' WHERE "nama" ILIKE '%Coblong%' AND "kode" IS NULL;
UPDATE "kecamatan" SET "kode" = '01' WHERE "nama" ILIKE '%Sukasari%' AND "kode" IS NULL;
UPDATE "kecamatan" SET "kode" = '03' WHERE "nama" ILIKE '%Cidadap%' AND "kode" IS NULL;

UPDATE "kelurahan" SET "kode" = '1001' WHERE "nama" ILIKE '%Dago%' AND "kode" IS NULL;
UPDATE "kelurahan" SET "kode" = '1002' WHERE "nama" ILIKE '%Lebak Gede%' AND "kode" IS NULL;
UPDATE "kelurahan" SET "kode" = '1003' WHERE "nama" ILIKE '%Lebak Siliwangi%' AND "kode" IS NULL;
UPDATE "kelurahan" SET "kode" = '1004' WHERE "nama" ILIKE '%Sadang Serang%' AND "kode" IS NULL;
UPDATE "kelurahan" SET "kode" = '1005' WHERE "nama" ILIKE '%Sekeloa%' AND "kode" IS NULL;
UPDATE "kelurahan" SET "kode" = '1006' WHERE "nama" ILIKE '%Cipaganti%' AND "kode" IS NULL;

UPDATE "pengguna" SET "id_komunitas" = 'WB-32730236900001' WHERE "nama" ILIKE 'acef kiki maulana%' AND "id_komunitas" LIKE 'KOM-%';
UPDATE "pengguna" SET "id_komunitas" = 'WB-32730212300002' WHERE "nama" ILIKE 'istri acef kiki maulana%' AND "id_komunitas" LIKE 'KOM-%';
UPDATE "pengguna" SET "id_komunitas" = 'WB-32730232100003' WHERE "nama" ILIKE 'anak acef kiki maulana%' AND "id_komunitas" LIKE 'KOM-%';

