import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

table_map = {
  'roles': 'peran',
  'users': 'pengguna',
  'refresh_tokens': 'token_penyegar',
  'otp_codes': 'kode_otp',
  'kelurahan': 'kelurahan',
  'rt_rw_areas': 'wilayah_rt_rw',
  'households': 'rumah_tangga',
  'waste_categories': 'kategori_sampah',
  'qr_batches': 'gelombang_qr',
  'bins': 'tong_sampah',
  'waste_logs': 'catatan_setoran',
  'students_kkn': 'mahasiswa_kkn',
  'petugas_residu': 'petugas_residu',
  'facilities': 'fasilitas',
  'facility_production_logs': 'catatan_produksi_fasilitas',
  'bank_sampah_ledger': 'buku_kas_bank_sampah',
  'ide_daur_ulang': 'ide_daur_ulang',
  'flash_drop_events': 'aksi_drop_sampah',
  'system_configs': 'konfigurasi_sistem',
  'audit_trail': 'jejak_audit',
  'social_feed': 'kabar_sosial',
  'notification_logs': 'catatan_notifikasi',
  'ai_request_logs': 'catatan_permintaan_ai',
  'point_history': 'riwayat_poin',
  'notifications': 'notifikasi',
  'bin_reset_requests': 'pengajuan_aktivasi_tong',
  'schedules': 'jadwal',
  'bin_ownerships': 'kepemilikan_tong',
  'dispatch_tasks': 'tugas_penjemputan',
  'peternakan': 'peternakan',
  'maggot_distribution_logs': 'catatan_distribusi_maggot',
  'violations': 'pelanggaran',
  'kkn_handover_history': 'riwayat_serah_terima_kkn'
}

column_map = {
  'created_at': 'dibuat_pada',
  'updated_at': 'diperbarui_pada',
  'role_id': 'id_peran',
  'user_id': 'id_pengguna',
  'expires_at': 'kedaluwarsa_pada',
  'fcm_token': 'token_fcm',
  'rt_rw_id': 'id_rt_rw',
  'foto_profil': 'foto_profil',
  'kelurahan_id': 'id_kelurahan',
  'category_id': 'id_kategori',
  'points_per_kg': 'poin_per_kg',
  'batch_code': 'kode_gelombang',
  'assigned_pic_user_id': 'id_pengguna_pic_ditugaskan',
  'total_qr': 'total_qr',
  'printed_at': 'dicetak_pada',
  'qr_code': 'kode_qr',
  'max_capacity_liter': 'maks_kapasitas_liter',
  'current_volume_liter': 'volume_sekarang_liter',
  'qr_batch_id': 'id_gelombang_qr',
  'household_id': 'id_rumah_tangga',
  'bin_id': 'id_tong',
  'weight_kg': 'berat_kg',
  'volume_liter': 'volume_liter',
  'request_id': 'id_permintaan',
  'ai_confidence': 'kepercayaan_ai',
  'ai_classification': 'klasifikasi_ai',
  'actual_weight_petugas': 'berat_aktual_petugas',
  'discrepancy_status': 'status_diskrepansi',
  'verified_by_petugas_id': 'id_petugas_verifikator',
  'verified_at': 'diverifikasi_pada',
  'petugas_classification': 'klasifikasi_petugas',
  'no_wa': 'no_wa',
  'start_date': 'tanggal_mulai',
  'end_date': 'tanggal_selesai',
  'assigned_polygon_id': 'id_poligon_ditugaskan',
  'whitelist_status': 'status_whitelist',
  'kpi_score': 'skor_kpi',
  'assigned_zone': 'zona_ditugaskan',
  'status_approval': 'status_persetujuan',
  'facility_id': 'id_fasilitas',
  'material_masuk_kg': 'material_masuk_kg',
  'output_kg': 'output_kg',
  'jenis_output': 'jenis_output',
  'saldo_rupiah': 'saldo_rupiah',
  'riwayat_transaksi': 'riwayat_transaksi',
  'approved_by': 'disetujui_oleh',
  'start_time': 'waktu_mulai',
  'end_time': 'waktu_selesai',
  'updated_by': 'diperbarui_oleh',
  'old_value': 'nilai_lama',
  'new_value': 'nilai_baru',
  'entity_id': 'id_entitas',
  'status_kirim': 'status_kirim',
  'trigger_type': 'tipe_pemicu',
  'image_url': 'url_gambar',
  'result_status': 'status_hasil',
  'is_read': 'sudah_dibaca',
  'evidence_photo_url': 'url_foto_bukti',
  'reviewed_by_id': 'id_pereview',
  'tipe_kepemilikan': 'tipe_kepemilikan',
  'claimed_by_user_id': 'id_pengguna_mengklaim',
  'hasil_panen_kg': 'hasil_panen_kg',
  'peternakan_id': 'id_peternakan',
  'quantity_kg': 'kuantitas_kg',
  'tanggal': 'tanggal',
  'petugas_user_id': 'id_pengguna_petugas',
  'points_deducted': 'poin_dikurangi',
  'from_user_id': 'id_pengguna_dari',
  'to_user_id': 'id_pengguna_ke',
  'handover_date': 'tanggal_serah_terima'
}

for old, new in table_map.items():
    if old != new:
        content = content.replace(f'@@map("{old}")', f'@@map("{new}")')

for old, new in column_map.items():
    if old != new:
        content = content.replace(f'@map("{old}")', f'@map("{new}")')

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("Schema updated successfully")
