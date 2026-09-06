# Progress Tracker — Trashcare Sesi 2

| ID | Modul / Fitur | Scope | Status | Catatan / Tanggal |
|---|---|---|---|---|
| A.1 | Landing Page UI | FE Web | ⏸️ SKIPPED | Landing page ditunda sesuai arahan user |
| B.1 | Halaman Awal | FE Web | ✅ DONE | Rute awal tetap ke Login / Dashboard |
| C.1 | Label Satuan Grafik | FE Web | ✅ DONE | Sumbu murni angka, label sumbu X (`Waktu`) & Y (`Berat (kg)`) jelas |
| C.2 | Filter Lokasi & Waktu | FE Web | ✅ DONE | Diringkas di tengah |
| C.3 | Layout Dashboard | FE Web | ✅ DONE | Filter di tengah, Indeks Kepatuhan di pojok |
| C.4 | Top Ten Real Calculation | BE & FE | ✅ DONE | Dihitung real dari agregasi database |
| C.8 | Format No. WA / HP | FE Web | ✅ DONE | Field label & placeholder `0812xxxxxxxx` |
| C.10| Widget Poin Warga | FE Web | ✅ DONE | Widget disesuaikan |
| D.1 | Buku Panduan | FE Web | ✅ DONE | Dipindah ke rute/Menu Panduan (`/panduan`) |
| D.2 | Tombol Ekspor Data | FE Web | ✅ DONE | Hanya aktif jika terdapat tabel data aktif |
| E.3 | Rename Dashboard DPL -> Kegiatan KKN | FE Web | ✅ DONE | Renamed "Dashboard Kegiatan KKN" |
| E.1 | Filter Wilayah KKN | FE Web | ✅ DONE | Filter wilayah di KKN Dashboard |
| E.2 | Akses & Scoping Multi-Role | FE & BE | ✅ DONE | Direct RBAC support `PEMIMPIN` & `PANITIA_TASKFORCE` |
| E.4 | Card Group 1 (Ringkasan Wilayah) | FE Web | ✅ DONE | Total Kecamatan, Kelurahan, Mahasiswa, Kelompok, DPL |
| E.5 | Card Group 2 (Kehadiran Aggregate) | FE Web | ✅ DONE | Metrik Kehadiran & Tempat Sampah Terpasang |
| E.6 | Feed Aktivitas Kegiatan KKN | FE Web | ✅ DONE | Feed log aktivitas KKN |
| F.1 | Pemisahan Kolom Berat (kg) & Poin | FE Web | ✅ DONE | Dipisah 2 kolom terpisah di tabel monitoring |
| G.1 | Halaman DPL Title "Ringkasan" | FE Web | ✅ DONE | Hapus kata "bimbingannya" |
| G.2 | Penilaian Numerik Hapus | FE Web | ✅ DONE | Skor numerik dihapus |
| G.3 | Audit Teks "Tong" -> "Tempat Sampah" | FE & BE | ✅ DONE | Replaced seluruh string user-facing "tong" |
| G.5 | Portofolio Mahasiswa | FE Web | ✅ DONE | Mahasiswa-owned activity log |
| H.1 | Peta DPL Hapus/Hidden | FE Web | ✅ DONE | Peta di DPL dibatalkan/tidak ditampilkan |
| I.1 | Rekapitulasi Pemanfaatan Ketua Kelompok | FE & BE | ✅ DONE | Restriksi submit hanya untuk Ketua Kelompok |
| J.1 | Role Baru PEMIMPIN & PANITIA_TASKFORCE | BE & FE | ✅ DONE | Enum role & RBAC middleware |
| L.1 | Rule Engine Point Config | BE & FE | ✅ DONE | Modul konfigurasi poin Super Admin (`ManageConfigs`) |
