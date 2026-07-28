-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('UTAMA', 'TAMBAHAN');

-- CreateTable
CREATE TABLE "bin_ownerships" (
    "id" TEXT NOT NULL,
    "bin_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipe_kepemilikan" "OwnershipType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bin_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bin_ownerships_bin_id_user_id_key" ON "bin_ownerships"("bin_id", "user_id");

-- AddForeignKey
ALTER TABLE "bin_ownerships" ADD CONSTRAINT "bin_ownerships_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_ownerships" ADD CONSTRAINT "bin_ownerships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate Existing Data
INSERT INTO bin_ownerships (id, bin_id, user_id, tipe_kepemilikan, created_at)
SELECT md5(id || '-' || kepemilikan_utama_user_id || '-utama'), id, kepemilikan_utama_user_id, 'UTAMA', now()
FROM bins
WHERE kepemilikan_utama_user_id IS NOT NULL
ON CONFLICT (bin_id, user_id) DO NOTHING;

INSERT INTO bin_ownerships (id, bin_id, user_id, tipe_kepemilikan, created_at)
SELECT md5(id || '-' || tambahan_user_id || '-tambahan'), id, tambahan_user_id, 'TAMBAHAN', now()
FROM (
  SELECT id, unnest(kepemilikan_tambahan_user_ids) AS tambahan_user_id
  FROM bins
) sub
WHERE tambahan_user_id IS NOT NULL
ON CONFLICT (bin_id, user_id) DO NOTHING;

-- Drop Columns and Constraints
ALTER TABLE "bins" DROP CONSTRAINT IF EXISTS "bins_kepemilikan_utama_user_id_fkey";
ALTER TABLE "bins" DROP COLUMN IF EXISTS "kepemilikan_utama_user_id";
ALTER TABLE "bins" DROP COLUMN IF EXISTS "kepemilikan_tambahan_user_ids";

-- Seed System Configs
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('ai_confidence_threshold', '90', 'number', 'Threshold AI confidence score (0-100)', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('bin_fullness_trigger_wa', '80', 'number', 'Threshold persentase kapasitas tong penuh untuk trigger notifikasi', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('organic_point_multiplier', '2.0', 'number', 'Multiplier poin untuk sampah organik', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('nonorganic_point_multiplier', '1.5', 'number', 'Multiplier poin untuk sampah non-organik', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('residu_penalty_multiplier', '-1.0', 'number', 'Penalty multiplier untuk residu campur', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('reporting_window_morning_start', '06:00', 'string', 'Mulai window pelaporan pagi petugas', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('reporting_window_morning_end', '08:00', 'string', 'Selesai window pelaporan pagi petugas', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('reporting_window_evening_start', '16:00', 'string', 'Mulai window pelaporan sore petugas', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('reporting_window_evening_end', '18:00', 'string', 'Selesai window pelaporan sore petugas', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('late_report_kpi_penalty_percent', '15', 'number', 'Persentase potongan skor KPI jika telat melapor', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('kkn_max_assignment_per_student', '20', 'number', 'Batas maksimal rumah tangga per mahasiswa KKN', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('dispatch_radius_km', '2', 'number', 'Radius penugasan on-demand petugas residu (KM)', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('streak_bonus_days', '5', 'number', 'Jumlah hari berturut-turut untuk bonus streak', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('streak_bonus_points', '10', 'number', 'Bonus poin streak warga tambahan', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('idea_approval_points', '50', 'number', 'Poin untuk ide daur ulang yang disetujui', now()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "system_configs" ("key", "value", "tipe", "deskripsi", "updated_at") VALUES
('emission_factor_metana', '0.05', 'number', 'Faktor emisi metana yang dihindari (kgCO2e per kg)', now()) ON CONFLICT (key) DO NOTHING;
