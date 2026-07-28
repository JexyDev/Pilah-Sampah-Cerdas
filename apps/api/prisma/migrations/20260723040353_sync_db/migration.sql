-- AlterEnum
ALTER TYPE "DispatchStatus" ADD VALUE 'ESCALATED';

-- AlterTable
ALTER TABLE "buku_kas_bank_sampah" RENAME CONSTRAINT "bank_sampah_ledger_pkey" TO "buku_kas_bank_sampah_pkey";

-- AlterTable
ALTER TABLE "catatan_distribusi_maggot" RENAME CONSTRAINT "maggot_distribution_logs_pkey" TO "catatan_distribusi_maggot_pkey";

-- AlterTable
ALTER TABLE "catatan_notifikasi" RENAME CONSTRAINT "notification_logs_pkey" TO "catatan_notifikasi_pkey";

-- AlterTable
ALTER TABLE "catatan_permintaan_ai" RENAME CONSTRAINT "ai_request_logs_pkey" TO "catatan_permintaan_ai_pkey";

-- AlterTable
ALTER TABLE "catatan_produksi_fasilitas" RENAME CONSTRAINT "facility_production_logs_pkey" TO "catatan_produksi_fasilitas_pkey";

-- AlterTable
ALTER TABLE "catatan_setoran" RENAME CONSTRAINT "waste_logs_pkey" TO "catatan_setoran_pkey";

-- AlterTable
ALTER TABLE "fasilitas" RENAME CONSTRAINT "facilities_pkey" TO "fasilitas_pkey";

-- AlterTable
ALTER TABLE "gelombang_qr" RENAME CONSTRAINT "qr_batches_pkey" TO "gelombang_qr_pkey";

-- AlterTable
ALTER TABLE "jadwal" RENAME CONSTRAINT "schedules_pkey" TO "jadwal_pkey";

-- AlterTable
ALTER TABLE "jejak_audit" RENAME CONSTRAINT "audit_trail_pkey" TO "jejak_audit_pkey";

-- AlterTable
ALTER TABLE "kabar_sosial" RENAME CONSTRAINT "social_feed_pkey" TO "kabar_sosial_pkey";

-- AlterTable
ALTER TABLE "kategori_sampah" RENAME CONSTRAINT "waste_categories_pkey" TO "kategori_sampah_pkey";

-- AlterTable
ALTER TABLE "kepemilikan_tong" RENAME CONSTRAINT "bin_ownerships_pkey" TO "kepemilikan_tong_pkey";

-- AlterTable
ALTER TABLE "konfigurasi_sistem" RENAME CONSTRAINT "system_configs_pkey" TO "konfigurasi_sistem_pkey";

-- AlterTable
ALTER TABLE "mahasiswa_kkn" RENAME CONSTRAINT "students_kkn_pkey" TO "mahasiswa_kkn_pkey";

-- AlterTable
ALTER TABLE "notifikasi" RENAME CONSTRAINT "notifications_pkey" TO "notifikasi_pkey";

-- AlterTable
ALTER TABLE "pelanggaran" RENAME CONSTRAINT "violations_pkey" TO "pelanggaran_pkey";

-- AlterTable
ALTER TABLE "pengajuan_aktivasi_tong" RENAME CONSTRAINT "bin_reset_requests_pkey" TO "pengajuan_aktivasi_tong_pkey";

-- AlterTable
ALTER TABLE "pengguna" RENAME CONSTRAINT "users_pkey" TO "pengguna_pkey";

-- AlterTable
ALTER TABLE "peran" RENAME CONSTRAINT "roles_pkey" TO "peran_pkey";

-- AlterTable
ALTER TABLE "riwayat_poin" RENAME CONSTRAINT "point_history_pkey" TO "riwayat_poin_pkey";

-- AlterTable
ALTER TABLE "riwayat_serah_terima_kkn" RENAME CONSTRAINT "kkn_handover_history_pkey" TO "riwayat_serah_terima_kkn_pkey";

-- AlterTable
ALTER TABLE "rumah_tangga" RENAME CONSTRAINT "households_pkey" TO "rumah_tangga_pkey";

-- AlterTable
ALTER TABLE "token_penyegar" RENAME CONSTRAINT "refresh_tokens_pkey" TO "token_penyegar_pkey";

-- AlterTable
ALTER TABLE "tong_sampah" RENAME CONSTRAINT "bins_pkey" TO "tong_sampah_pkey";

-- AlterTable
ALTER TABLE "tugas_penjemputan" RENAME CONSTRAINT "dispatch_tasks_pkey" TO "tugas_penjemputan_pkey";

-- AlterTable
ALTER TABLE "wilayah_rt_rw" RENAME CONSTRAINT "rt_rw_areas_pkey" TO "wilayah_rt_rw_pkey";

-- CreateTable
CREATE TABLE "kode_otp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kedaluwarsa_pada" TIMESTAMP(3) NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "kode_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aksi_drop_sampah" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "latitude" DECIMAL(11,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 100,
    "points" INTEGER NOT NULL DEFAULT 50,
    "waktu_mulai" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3) NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aksi_drop_sampah_pkey" PRIMARY KEY ("id")
);

-- RenameForeignKey
ALTER TABLE "buku_kas_bank_sampah" RENAME CONSTRAINT "bank_sampah_ledger_user_id_fkey" TO "buku_kas_bank_sampah_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_distribusi_maggot" RENAME CONSTRAINT "maggot_distribution_logs_peternakan_id_fkey" TO "catatan_distribusi_maggot_id_peternakan_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_permintaan_ai" RENAME CONSTRAINT "ai_request_logs_user_id_fkey" TO "catatan_permintaan_ai_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_produksi_fasilitas" RENAME CONSTRAINT "facility_production_logs_facility_id_fkey" TO "catatan_produksi_fasilitas_id_fasilitas_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_setoran" RENAME CONSTRAINT "waste_logs_bin_id_fkey" TO "catatan_setoran_id_tong_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_setoran" RENAME CONSTRAINT "waste_logs_category_id_fkey" TO "catatan_setoran_id_kategori_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_setoran" RENAME CONSTRAINT "waste_logs_household_id_fkey" TO "catatan_setoran_id_rumah_tangga_fkey";

-- RenameForeignKey
ALTER TABLE "catatan_setoran" RENAME CONSTRAINT "waste_logs_verified_by_petugas_id_fkey" TO "catatan_setoran_id_petugas_verifikator_fkey";

-- RenameForeignKey
ALTER TABLE "fasilitas" RENAME CONSTRAINT "facilities_rt_rw_id_fkey" TO "fasilitas_id_rt_rw_fkey";

-- RenameForeignKey
ALTER TABLE "gelombang_qr" RENAME CONSTRAINT "qr_batches_assigned_pic_user_id_fkey" TO "gelombang_qr_id_pengguna_pic_ditugaskan_fkey";

-- RenameForeignKey
ALTER TABLE "ide_daur_ulang" RENAME CONSTRAINT "ide_daur_ulang_user_id_fkey" TO "ide_daur_ulang_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "jejak_audit" RENAME CONSTRAINT "audit_trail_user_id_fkey" TO "jejak_audit_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "kepemilikan_tong" RENAME CONSTRAINT "bin_ownerships_bin_id_fkey" TO "kepemilikan_tong_id_tong_fkey";

-- RenameForeignKey
ALTER TABLE "kepemilikan_tong" RENAME CONSTRAINT "bin_ownerships_user_id_fkey" TO "kepemilikan_tong_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "mahasiswa_kkn" RENAME CONSTRAINT "students_kkn_assigned_polygon_id_fkey" TO "mahasiswa_kkn_id_poligon_ditugaskan_fkey";

-- RenameForeignKey
ALTER TABLE "mahasiswa_kkn" RENAME CONSTRAINT "students_kkn_user_id_fkey" TO "mahasiswa_kkn_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "notifikasi" RENAME CONSTRAINT "notifications_user_id_fkey" TO "notifikasi_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "pelanggaran" RENAME CONSTRAINT "violations_bin_id_fkey" TO "pelanggaran_id_tong_fkey";

-- RenameForeignKey
ALTER TABLE "pelanggaran" RENAME CONSTRAINT "violations_petugas_user_id_fkey" TO "pelanggaran_id_pengguna_petugas_fkey";

-- RenameForeignKey
ALTER TABLE "pelanggaran" RENAME CONSTRAINT "violations_user_id_fkey" TO "pelanggaran_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "pengajuan_aktivasi_tong" RENAME CONSTRAINT "bin_reset_requests_bin_id_fkey" TO "pengajuan_aktivasi_tong_id_tong_fkey";

-- RenameForeignKey
ALTER TABLE "pengajuan_aktivasi_tong" RENAME CONSTRAINT "bin_reset_requests_reviewed_by_id_fkey" TO "pengajuan_aktivasi_tong_id_pereview_fkey";

-- RenameForeignKey
ALTER TABLE "pengajuan_aktivasi_tong" RENAME CONSTRAINT "bin_reset_requests_user_id_fkey" TO "pengajuan_aktivasi_tong_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "pengguna" RENAME CONSTRAINT "users_role_id_fkey" TO "pengguna_id_peran_fkey";

-- RenameForeignKey
ALTER TABLE "pengguna" RENAME CONSTRAINT "users_rt_rw_id_fkey" TO "pengguna_id_rt_rw_fkey";

-- RenameForeignKey
ALTER TABLE "petugas_residu" RENAME CONSTRAINT "petugas_residu_user_id_fkey" TO "petugas_residu_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "riwayat_poin" RENAME CONSTRAINT "point_history_user_id_fkey" TO "riwayat_poin_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "riwayat_serah_terima_kkn" RENAME CONSTRAINT "kkn_handover_history_from_user_id_fkey" TO "riwayat_serah_terima_kkn_id_pengguna_dari_fkey";

-- RenameForeignKey
ALTER TABLE "riwayat_serah_terima_kkn" RENAME CONSTRAINT "kkn_handover_history_rt_rw_id_fkey" TO "riwayat_serah_terima_kkn_id_rt_rw_fkey";

-- RenameForeignKey
ALTER TABLE "riwayat_serah_terima_kkn" RENAME CONSTRAINT "kkn_handover_history_to_user_id_fkey" TO "riwayat_serah_terima_kkn_id_pengguna_ke_fkey";

-- RenameForeignKey
ALTER TABLE "rumah_tangga" RENAME CONSTRAINT "households_rt_rw_id_fkey" TO "rumah_tangga_id_rt_rw_fkey";

-- RenameForeignKey
ALTER TABLE "rumah_tangga" RENAME CONSTRAINT "households_user_id_fkey" TO "rumah_tangga_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "token_penyegar" RENAME CONSTRAINT "refresh_tokens_user_id_fkey" TO "token_penyegar_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "tong_sampah" RENAME CONSTRAINT "bins_category_id_fkey" TO "tong_sampah_id_kategori_fkey";

-- RenameForeignKey
ALTER TABLE "tong_sampah" RENAME CONSTRAINT "bins_kelurahan_id_fkey" TO "tong_sampah_id_kelurahan_fkey";

-- RenameForeignKey
ALTER TABLE "tong_sampah" RENAME CONSTRAINT "bins_qr_batch_id_fkey" TO "tong_sampah_id_gelombang_qr_fkey";

-- RenameForeignKey
ALTER TABLE "tong_sampah" RENAME CONSTRAINT "bins_rt_rw_id_fkey" TO "tong_sampah_id_rt_rw_fkey";

-- RenameForeignKey
ALTER TABLE "tong_sampah" RENAME CONSTRAINT "bins_user_id_fkey" TO "tong_sampah_id_pengguna_fkey";

-- RenameForeignKey
ALTER TABLE "tugas_penjemputan" RENAME CONSTRAINT "dispatch_tasks_bin_id_fkey" TO "tugas_penjemputan_id_tong_fkey";

-- RenameForeignKey
ALTER TABLE "tugas_penjemputan" RENAME CONSTRAINT "dispatch_tasks_claimed_by_user_id_fkey" TO "tugas_penjemputan_id_pengguna_mengklaim_fkey";

-- RenameForeignKey
ALTER TABLE "wilayah_rt_rw" RENAME CONSTRAINT "rt_rw_areas_kelurahan_id_fkey" TO "wilayah_rt_rw_id_kelurahan_fkey";

-- RenameIndex
ALTER INDEX "bank_sampah_ledger_user_id_key" RENAME TO "buku_kas_bank_sampah_id_pengguna_key";

-- RenameIndex
ALTER INDEX "ai_request_logs_request_id_key" RENAME TO "catatan_permintaan_ai_id_permintaan_key";

-- RenameIndex
ALTER INDEX "qr_batches_batch_code_key" RENAME TO "gelombang_qr_kode_gelombang_key";

-- RenameIndex
ALTER INDEX "waste_categories_name_key" RENAME TO "kategori_sampah_nama_key";

-- RenameIndex
ALTER INDEX "kelurahan_name_key" RENAME TO "kelurahan_nama_key";

-- RenameIndex
ALTER INDEX "bin_ownerships_bin_id_user_id_key" RENAME TO "kepemilikan_tong_id_tong_id_pengguna_key";

-- RenameIndex
ALTER INDEX "students_kkn_nim_key" RENAME TO "mahasiswa_kkn_nim_key";

-- RenameIndex
ALTER INDEX "students_kkn_user_id_key" RENAME TO "mahasiswa_kkn_id_pengguna_key";

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "pengguna_surel_key";

-- RenameIndex
ALTER INDEX "users_nik_key" RENAME TO "pengguna_nik_key";

-- RenameIndex
ALTER INDEX "roles_name_key" RENAME TO "peran_nama_key";

-- RenameIndex
ALTER INDEX "petugas_residu_user_id_key" RENAME TO "petugas_residu_id_pengguna_key";

-- RenameIndex
ALTER INDEX "refresh_tokens_token_key" RENAME TO "token_penyegar_token_key";

-- RenameIndex
ALTER INDEX "bins_qr_code_key" RENAME TO "tong_sampah_kode_qr_key";

-- RenameIndex
ALTER INDEX "rt_rw_areas_kelurahan_id_name_key" RENAME TO "wilayah_rt_rw_id_kelurahan_nama_key";
