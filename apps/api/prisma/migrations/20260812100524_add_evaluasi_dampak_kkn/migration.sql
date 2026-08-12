-- AlterTable
ALTER TABLE "survei_kelurahan" ADD COLUMN     "catatan_validasi" TEXT,
ADD COLUMN     "id_validasi_dpl" TEXT,
ADD COLUMN     "status_validasi" TEXT NOT NULL DEFAULT 'BELUM_VALIDASI';

-- CreateTable
CREATE TABLE "endline_survei_kelurahan" (
    "id_kelurahan_endline" INTEGER NOT NULL,
    "nama_kelurahan" VARCHAR(100) NOT NULL,
    "kecamatan" VARCHAR(100),
    "tanggal_survei" DATE,
    "enumerator" VARCHAR(100),
    "catatan_data" TEXT,
    "id_validasi_dpl" TEXT,
    "status_validasi" TEXT NOT NULL DEFAULT 'BELUM_VALIDASI',
    "catatan_validasi" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endline_survei_kelurahan_pkey" PRIMARY KEY ("id_kelurahan_endline")
);

-- CreateTable
CREATE TABLE "endline_pemilahan_sampah" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_endline" INTEGER NOT NULL,
    "jumlah_rumah_memilah" INTEGER,
    "total_jumlah_rumah_di_rw" INTEGER,
    "persentase_pemilahan" DECIMAL(5,4),
    "tingkat_pemilahan" VARCHAR(50),
    "catatan" TEXT,

    CONSTRAINT "endline_pemilahan_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endline_volume_sampah" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_endline" INTEGER NOT NULL,
    "organik_kg_per_hari" DECIMAL(10,2),
    "anorganik_kg_per_hari" DECIMAL(10,2),
    "residu_kg_per_hari" DECIMAL(10,2),
    "total_volume_kg_per_hari" DECIMAL(10,2),
    "catatan" TEXT,

    CONSTRAINT "endline_volume_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endline_bank_sampah_pengolahan" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_endline" INTEGER NOT NULL,
    "bank_sampah_aktif" INTEGER,
    "bank_sampah_tidak_aktif" INTEGER,
    "jumlah_unit_komposter" VARCHAR(50),
    "jumlah_titik_maggot_bsf" VARCHAR(100),
    "biopori_loseda" BOOLEAN,
    "ecobrick_kerajinan_daur_ulang" BOOLEAN,
    "buruan_sae" BOOLEAN,
    "pengepul_mitra_daur_ulang" BOOLEAN,
    "digitalisasi_data" BOOLEAN,
    "aktivitas_lainnya_keterangan" TEXT,

    CONSTRAINT "endline_bank_sampah_pengolahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endline_catatan_kesimpulan" (
    "id" SERIAL NOT NULL,
    "id_kelurahan_endline" INTEGER NOT NULL,
    "prioritas_intervensi" TEXT,
    "catatan_tambahan_risiko_sosial" TEXT,

    CONSTRAINT "endline_catatan_kesimpulan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "endline_pemilahan_sampah_id_kelurahan_endline_key" ON "endline_pemilahan_sampah"("id_kelurahan_endline");

-- CreateIndex
CREATE UNIQUE INDEX "endline_volume_sampah_id_kelurahan_endline_key" ON "endline_volume_sampah"("id_kelurahan_endline");

-- CreateIndex
CREATE UNIQUE INDEX "endline_bank_sampah_pengolahan_id_kelurahan_endline_key" ON "endline_bank_sampah_pengolahan"("id_kelurahan_endline");

-- CreateIndex
CREATE UNIQUE INDEX "endline_catatan_kesimpulan_id_kelurahan_endline_key" ON "endline_catatan_kesimpulan"("id_kelurahan_endline");

-- AddForeignKey
ALTER TABLE "survei_kelurahan" ADD CONSTRAINT "survei_kelurahan_id_validasi_dpl_fkey" FOREIGN KEY ("id_validasi_dpl") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endline_survei_kelurahan" ADD CONSTRAINT "endline_survei_kelurahan_id_validasi_dpl_fkey" FOREIGN KEY ("id_validasi_dpl") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endline_pemilahan_sampah" ADD CONSTRAINT "endline_pemilahan_sampah_id_kelurahan_endline_fkey" FOREIGN KEY ("id_kelurahan_endline") REFERENCES "endline_survei_kelurahan"("id_kelurahan_endline") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endline_volume_sampah" ADD CONSTRAINT "endline_volume_sampah_id_kelurahan_endline_fkey" FOREIGN KEY ("id_kelurahan_endline") REFERENCES "endline_survei_kelurahan"("id_kelurahan_endline") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endline_bank_sampah_pengolahan" ADD CONSTRAINT "endline_bank_sampah_pengolahan_id_kelurahan_endline_fkey" FOREIGN KEY ("id_kelurahan_endline") REFERENCES "endline_survei_kelurahan"("id_kelurahan_endline") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endline_catatan_kesimpulan" ADD CONSTRAINT "endline_catatan_kesimpulan_id_kelurahan_endline_fkey" FOREIGN KEY ("id_kelurahan_endline") REFERENCES "endline_survei_kelurahan"("id_kelurahan_endline") ON DELETE CASCADE ON UPDATE CASCADE;
