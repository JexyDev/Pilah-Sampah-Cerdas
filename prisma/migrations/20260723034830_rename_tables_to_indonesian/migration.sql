DO $$ 
DECLARE 
    r RECORD;
    t RECORD;
BEGIN 
    -- Rename Tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN ALTER TABLE "roles" RENAME TO "peran"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN ALTER TABLE "users" RENAME TO "pengguna"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refresh_tokens') THEN ALTER TABLE "refresh_tokens" RENAME TO "token_penyegar"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'otp_codes') THEN ALTER TABLE "otp_codes" RENAME TO "kode_otp"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rt_rw_areas') THEN ALTER TABLE "rt_rw_areas" RENAME TO "wilayah_rt_rw"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'households') THEN ALTER TABLE "households" RENAME TO "rumah_tangga"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waste_categories') THEN ALTER TABLE "waste_categories" RENAME TO "kategori_sampah"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'qr_batches') THEN ALTER TABLE "qr_batches" RENAME TO "gelombang_qr"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bins') THEN ALTER TABLE "bins" RENAME TO "tong_sampah"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waste_logs') THEN ALTER TABLE "waste_logs" RENAME TO "catatan_setoran"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students_kkn') THEN ALTER TABLE "students_kkn" RENAME TO "mahasiswa_kkn"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facilities') THEN ALTER TABLE "facilities" RENAME TO "fasilitas"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facility_production_logs') THEN ALTER TABLE "facility_production_logs" RENAME TO "catatan_produksi_fasilitas"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bank_sampah_ledger') THEN ALTER TABLE "bank_sampah_ledger" RENAME TO "buku_kas_bank_sampah"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'flash_drop_events') THEN ALTER TABLE "flash_drop_events" RENAME TO "aksi_drop_sampah"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_configs') THEN ALTER TABLE "system_configs" RENAME TO "konfigurasi_sistem"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_trail') THEN ALTER TABLE "audit_trail" RENAME TO "jejak_audit"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_feed') THEN ALTER TABLE "social_feed" RENAME TO "kabar_sosial"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_logs') THEN ALTER TABLE "notification_logs" RENAME TO "catatan_notifikasi"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_request_logs') THEN ALTER TABLE "ai_request_logs" RENAME TO "catatan_permintaan_ai"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'point_history') THEN ALTER TABLE "point_history" RENAME TO "riwayat_poin"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN ALTER TABLE "notifications" RENAME TO "notifikasi"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bin_reset_requests') THEN ALTER TABLE "bin_reset_requests" RENAME TO "pengajuan_aktivasi_tong"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') THEN ALTER TABLE "schedules" RENAME TO "jadwal"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bin_ownerships') THEN ALTER TABLE "bin_ownerships" RENAME TO "kepemilikan_tong"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispatch_tasks') THEN ALTER TABLE "dispatch_tasks" RENAME TO "tugas_penjemputan"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'maggot_distribution_logs') THEN ALTER TABLE "maggot_distribution_logs" RENAME TO "catatan_distribusi_maggot"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'violations') THEN ALTER TABLE "violations" RENAME TO "pelanggaran"; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kkn_handover_history') THEN ALTER TABLE "kkn_handover_history" RENAME TO "riwayat_serah_terima_kkn"; END IF;

    -- Rename Columns dynamically
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename NOT LIKE '\_%'
    LOOP
        -- Apply column mappings
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'created_at') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "created_at" TO "dibuat_pada"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'updated_at') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "updated_at" TO "diperbarui_pada"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'role_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "role_id" TO "id_peran"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'user_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "user_id" TO "id_pengguna"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'expires_at') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "expires_at" TO "kedaluwarsa_pada"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'fcm_token') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "fcm_token" TO "token_fcm"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'rt_rw_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "rt_rw_id" TO "id_rt_rw"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'foto_profil') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'kelurahan_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "kelurahan_id" TO "id_kelurahan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'category_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "category_id" TO "id_kategori"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'points_per_kg') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "points_per_kg" TO "poin_per_kg"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'batch_code') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "batch_code" TO "kode_gelombang"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'assigned_pic_user_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "assigned_pic_user_id" TO "id_pengguna_pic_ditugaskan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'total_qr') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'printed_at') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "printed_at" TO "dicetak_pada"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'qr_code') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "qr_code" TO "kode_qr"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'max_capacity_liter') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "max_capacity_liter" TO "maks_kapasitas_liter"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'current_volume_liter') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "current_volume_liter" TO "volume_sekarang_liter"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'qr_batch_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "qr_batch_id" TO "id_gelombang_qr"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'household_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "household_id" TO "id_rumah_tangga"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'bin_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "bin_id" TO "id_tong"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'weight_kg') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "weight_kg" TO "berat_kg"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'volume_liter') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'request_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "request_id" TO "id_permintaan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'ai_confidence') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "ai_confidence" TO "kepercayaan_ai"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'ai_classification') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "ai_classification" TO "klasifikasi_ai"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'actual_weight_petugas') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "actual_weight_petugas" TO "berat_aktual_petugas"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'discrepancy_status') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "discrepancy_status" TO "status_diskrepansi"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'verified_by_petugas_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "verified_by_petugas_id" TO "id_petugas_verifikator"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'verified_at') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "verified_at" TO "diverifikasi_pada"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'petugas_classification') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "petugas_classification" TO "klasifikasi_petugas"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'no_wa') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'start_date') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "start_date" TO "tanggal_mulai"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'end_date') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "end_date" TO "tanggal_selesai"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'assigned_polygon_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "assigned_polygon_id" TO "id_poligon_ditugaskan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'whitelist_status') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "whitelist_status" TO "status_whitelist"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'kpi_score') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "kpi_score" TO "skor_kpi"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'assigned_zone') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "assigned_zone" TO "zona_ditugaskan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'status_approval') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "status_approval" TO "status_persetujuan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'facility_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "facility_id" TO "id_fasilitas"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'material_masuk_kg') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'output_kg') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'jenis_output') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'saldo_rupiah') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'riwayat_transaksi') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'approved_by') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "approved_by" TO "disetujui_oleh"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'start_time') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "start_time" TO "waktu_mulai"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'end_time') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "end_time" TO "waktu_selesai"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'updated_by') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "updated_by" TO "diperbarui_oleh"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'old_value') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "old_value" TO "nilai_lama"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'new_value') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "new_value" TO "nilai_baru"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'entity_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "entity_id" TO "id_entitas"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'status_kirim') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'trigger_type') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "trigger_type" TO "tipe_pemicu"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'image_url') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "image_url" TO "url_gambar"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'result_status') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "result_status" TO "status_hasil"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'is_read') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "is_read" TO "sudah_dibaca"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'evidence_photo_url') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "evidence_photo_url" TO "url_foto_bukti"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'reviewed_by_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "reviewed_by_id" TO "id_pereview"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'tipe_kepemilikan') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'claimed_by_user_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "claimed_by_user_id" TO "id_pengguna_mengklaim"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'hasil_panen_kg') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'peternakan_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "peternakan_id" TO "id_peternakan"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'quantity_kg') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "quantity_kg" TO "kuantitas_kg"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'tanggal') THEN
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'petugas_user_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "petugas_user_id" TO "id_pengguna_petugas"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'points_deducted') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "points_deducted" TO "poin_dikurangi"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'from_user_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "from_user_id" TO "id_pengguna_dari"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'to_user_id') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "to_user_id" TO "id_pengguna_ke"';
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'handover_date') THEN
            EXECUTE 'ALTER TABLE "' || t.tablename || '" RENAME COLUMN "handover_date" TO "tanggal_serah_terima"';
        END IF;
        
        -- Also email, password, phone for users table
        IF t.tablename = 'pengguna' THEN
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pengguna' AND column_name = 'email') THEN
                ALTER TABLE "pengguna" RENAME COLUMN "email" TO "surel";
            END IF;
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pengguna' AND column_name = 'password') THEN
                ALTER TABLE "pengguna" RENAME COLUMN "password" TO "kata_sandi";
            END IF;
        END IF;

    END LOOP;
END $$;

ALTER TABLE "peran" RENAME COLUMN "name" TO "nama";
ALTER TABLE "pengguna" RENAME COLUMN "name" TO "nama";
ALTER TABLE "kelurahan" RENAME COLUMN "name" TO "nama";
ALTER TABLE "wilayah_rt_rw" RENAME COLUMN "name" TO "nama";
ALTER TABLE "kategori_sampah" RENAME COLUMN "name" TO "nama";
