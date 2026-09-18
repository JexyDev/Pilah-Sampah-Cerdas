-- 1. Pastikan kolom kode ada
ALTER TABLE "provinsi" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);
ALTER TABLE "kabupaten" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);
ALTER TABLE "kecamatan" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(10);
ALTER TABLE "kelurahan" ADD COLUMN IF NOT EXISTS "kode" VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS "provinsi_kode_key" ON "provinsi"("kode");
CREATE INDEX IF NOT EXISTS "kabupaten_kode_idx" ON "kabupaten"("kode");
CREATE INDEX IF NOT EXISTS "kecamatan_kode_idx" ON "kecamatan"("kode");
CREATE INDEX IF NOT EXISTS "kelurahan_kode_idx" ON "kelurahan"("kode");

-- 2. Update Kode Provinsi
UPDATE "provinsi" SET "kode" = '32' WHERE "nama" ILIKE '%Jawa Barat%';
UPDATE "provinsi" SET "kode" = '31' WHERE "nama" ILIKE '%DKI Jakarta%';
UPDATE "provinsi" SET "kode" = '33' WHERE "nama" ILIKE '%Jawa Tengah%';
UPDATE "provinsi" SET "kode" = '35' WHERE "nama" ILIKE '%Jawa Timur%';
UPDATE "provinsi" SET "kode" = '36' WHERE "nama" ILIKE '%Banten%';

-- 3. Update Kode Kabupaten / Kota
UPDATE "kabupaten" SET "kode" = '73' WHERE "nama" ILIKE '%Kota Bandung%';
UPDATE "kabupaten" SET "kode" = '04' WHERE "nama" ILIKE '%Kabupaten Bandung%' AND "nama" NOT ILIKE '%Barat%';
UPDATE "kabupaten" SET "kode" = '17' WHERE "nama" ILIKE '%Bandung Barat%';
UPDATE "kabupaten" SET "kode" = '77' WHERE "nama" ILIKE '%Cimahi%';
UPDATE "kabupaten" SET "kode" = '71' WHERE "nama" ILIKE '%Kota Bogor%';
UPDATE "kabupaten" SET "kode" = '01' WHERE "nama" ILIKE '%Kabupaten Bogor%';
UPDATE "kabupaten" SET "kode" = '75' WHERE "nama" ILIKE '%Kota Bekasi%';
UPDATE "kabupaten" SET "kode" = '16' WHERE "nama" ILIKE '%Kabupaten Bekasi%';
UPDATE "kabupaten" SET "kode" = '76' WHERE "nama" ILIKE '%Depok%';
UPDATE "kabupaten" SET "kode" = '05' WHERE "nama" ILIKE '%Garut%';

-- 4. Update Kode Kecamatan Coblong & Sekitarnya
UPDATE "kecamatan" SET "kode" = '02' WHERE "nama" ILIKE '%Coblong%';
UPDATE "kecamatan" SET "kode" = '01' WHERE "nama" ILIKE '%Sukasari%';
UPDATE "kecamatan" SET "kode" = '03' WHERE "nama" ILIKE '%Cidadap%';

-- 5. Update Kode Kelurahan di Coblong
UPDATE "kelurahan" SET "kode" = '1001' WHERE "nama" ILIKE '%Dago%';
UPDATE "kelurahan" SET "kode" = '1002' WHERE "nama" ILIKE '%Lebak Gede%';
UPDATE "kelurahan" SET "kode" = '1003' WHERE "nama" ILIKE '%Lebak Siliwangi%';
UPDATE "kelurahan" SET "kode" = '1004' WHERE "nama" ILIKE '%Sadang Serang%';
UPDATE "kelurahan" SET "kode" = '1005' WHERE "nama" ILIKE '%Sekeloa%';
UPDATE "kelurahan" SET "kode" = '1006' WHERE "nama" ILIKE '%Cipaganti%';

-- 6. Migrasi ID Komunitas Pengguna Eksisting (jika ada format lama KOM-)
UPDATE "pengguna" SET "id_komunitas" = 'WB-32730236900001' WHERE "nama" ILIKE 'acef kiki maulana%' AND "id_komunitas" LIKE 'KOM-%';
UPDATE "pengguna" SET "id_komunitas" = 'WB-32730212300002' WHERE "nama" ILIKE 'istri acef kiki maulana%' AND "id_komunitas" LIKE 'KOM-%';
UPDATE "pengguna" SET "id_komunitas" = 'WB-32730232100003' WHERE "nama" ILIKE 'anak acef kiki maulana%' AND "id_komunitas" LIKE 'KOM-%';
