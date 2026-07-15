## Checklist Fitur Simulasi -> Fitur Aktif

### Frontend (React Web)
- [x] `frontend/src/pages/Dashboard/Dashboard.tsx` — Dashboard ditarik dari API `/dashboard/summary` (Warga) dan `/dashboard/kpi` + fetch tables (Admin/Petugas).
- [x] `frontend/src/pages/LaporanAnalitik/LaporanAnalitik.tsx` — Data metrik, uptime, AI accuracy, chart cache diambil dari backend via `dashboard/analytics`.
- [x] `frontend/src/pages/JadwalKegiatan/JadwalKegiatan.tsx` — Kalender dibuat dinamis dengan JS Date dan merender jadwal dari API backend.
- [x] `frontend/src/store/useMasterDataStore.ts` — Store menggunakan API sebenarnya.
- [x] `frontend/src/store/useLeaderboardStore.ts` — Telah disambung ke API `/points/leaderboard`.

### Mobile (Flutter)
- [ ] `mobile/lib/config/app_config.dart` — Terdapat konfigurasi fallback dummy (`mockHouseholdId`, `mockUserId`) yang harus disambungkan ke auth state real.
- [ ] `mobile/lib/data/mock/mock_data.dart` — Sumber utama data simulasi untuk aplikasi mobile, harus digantikan endpoint HTTP.
- [ ] `mobile/lib/data/repositories/mock_auth_repository.dart` — Implementasi login dan sesi masih menggunakan credentials dummy. Perlu diganti implementasi HTTP nyata (`api_auth_repository`).
- [ ] `mobile/lib/data/repositories/mock_bin_repository.dart` — Semua data bin, fetch bin, pengajuan, dan deteksi AI disimulasikan lokal. Perlu diganti implementasi HTTP nyata (`api_bin_repository`).
- [ ] `mobile/lib/data/repositories/mock_waste_log_repository.dart` — Riwayat transaksi setor sampah (waste logs) berjalan lokal tanpa fetch API server. Perlu diganti implementasi HTTP nyata.
- [ ] Konfigurasi Mobile API — Provider/Dependencies di mobile (Riverpod/Provider) harus di-switch agar menggunakan implementasi Repository HTTP (API), bukan lagi Mock Repository.
