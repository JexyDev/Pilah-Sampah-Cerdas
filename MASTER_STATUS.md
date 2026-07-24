# MASTER STATUS: Konsolidasi Semua Tracker

## Dari automation-tracker.md

- [x] Scan seluruh file tracker yang sudah dibuat sebelumnya di root project (progress-tracker.md, bugfix-tracker.md, polish-tracker.md, warga-ux-tracker.md, login-validation-tracker.md, dan tracker lain jika ada).
- [x] Gabungkan SEMUA item dari file-file itu menjadi satu sumber kebenaran terpusat: tasks.json di root project, dengan struktur per item:
- [x] Setiap item WAJIB memiliki attribute id unik dan permanen (jangan berubah tiap script dijalankan ulang) — ini kunci supaya sinkronisasi tidak membuat kartu duplikat.
- [x] Buat board Trello (atau pakai board yang sudah ada) dengan minimal 3 list: "Backlog", "In Progress", "Done" (tambahkan "Blocked" jika perlu).
- [x] Simpan kredensial Trello (API Key, Token, Board ID) sebagai GitHub Secrets (TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID) — JANGAN PERNAH hardcode di kode atau commit ke repo.
- [x] Buat script terpisah scripts/trello-sync.js (Node.js) yang bertugas:
- [x] Buat workflow .github/workflows/trello-sync.yml yang berjalan otomatis setiap ada push ke branch utama.
- [x] Workflow ini menjalankan scripts/trello-sync.js dengan environment variable dari GitHub Secrets.
- [x] Tambahkan langkah untuk mendeteksi task mana yang statusnya berubah dari commit terbaru:
- [x] Setelah update tasks.json, commit otomatis perubahan tasks.json ke branch utama (commit terpisah, pesan jelas: "chore: sync task tracker"), lalu jalankan trello-sync.js untuk push perubahan ke Trello.
- [x] Setiap card WAJIB berisi deskripsi lengkap (bukan cuma judul 3 kata): apa fiturnya, kenapa dikerjakan, halaman/modul terkait, dan status terakhir dalam bahasa yang jelas.
- [x] Card yang statusnya "in_progress" harus ada catatan/comment terbaru: sedang dikerjakan bagian apa, ada blocker atau tidak.
- [x] Card yang "done" harus ada comment ringkas: apa yang berhasil diperbaiki/dibangun, dan link commit sebagai bukti.
- [x] Tidak boleh ada card duplikat untuk task yang sama — validasi via task id sebelum membuat card baru (cek dulu apakah trello_card_id sudah terisi).
- [x] Semua file automation (tasks.json, scripts/trello-sync.js, .github/workflows/trello-sync.yml) berada di lokasi terpisah dari kode aplikasi — TIDAK BOLEH menyentuh/mengubah file di folder backend, /fe, atau mobile.
- [x] Automation ini tidak boleh membuat deploy gagal — jika trello-sync.js error (misal API Trello down), workflow tetap lanjut men-deploy aplikasi seperti biasa (jangan sampai sinkronisasi Trello memblokir CI/CD utama). Pisahkan job Trello sync dari job build/deploy di workflow.
- [x] Simpan dokumentasi singkat cara kerja automation ini di README-automation.md agar bisa dipahami tim lain (termasuk cara menulis commit message dengan format `refs <ID>` yang benar).

## Dari bugfix-tracker.md

- [x] Dropdown pilih RT/wilayah di header tidak berfungsi — hubungkan ke data RT/RW asli dari backend, dan filter seluruh dashboard sesuai pilihan. (Selesai: Region diambil dinamis via /dashboard/regions & dikirim ke endpoint kpi & filtered lokal)
- [x] Dropdown filter di grafik "Tren Setoran Sampah per Minggu" tidak berfungsi — hubungkan ke endpoint tren dengan parameter periode/minggu yang dipilih. (Selesai: Dibuat endpoint /dashboard/trend & select dropdown mingguan)
- [x] Bagian "Kepatuhan RT/RW" dibuat dinamis dari data asli (bukan statis), tampilkan sebagai popup/modal modern saat item diklik (bukan tabel polos). (Selesai: Clickable widget membuka modal detail kepatuhan)
- [x] Bagian "Data Tempat Sampah Terbaru" (master data): ubah dari tampilan kosong/polos jadi tabel lengkap berisi kolom yang relevan + kolom Poin (saat ini belum ada) + kolom Aksi (Edit/Delete, saat ini belum ada tombolnya sama sekali) — untuk data Warga, Staff, dan Tong Sampah. (Selesai: Kolom ID, Lokasi, Kapasitas, Poin/Kg, & Aksi Edit/Delete)
- [x] Icon "Jadwal Kegiatan" di dashboard tidak bisa diklik — hubungkan ke halaman/detail jadwal kegiatan. (Selesai: Diarahkan ke /jadwal-kegiatan)
- [x] Icon "Aktivitas Terbaru" pemilik/warga tidak bisa diklik — hubungkan ke detail aktivitas terkait. (Selesai: Diarahkan ke /rekap-setoran)
- [x] Icon "Notifikasi Sistem" tidak bisa diklik — harus membuka halaman/panel notifikasi yang sebenarnya. (Selesai: Diarahkan ke /notifikasi)
- [x] Tombol "Detail Bin" tidak bisa diklik — hubungkan ke halaman/modal detail bin asli dari backend. (Selesai: Menampilkan log transaksi dynamic dari backend)
- [x] Gambar QR code masih placeholder UI, BUKAN QR code asli hasil generate dari backend — ganti dengan QR code sungguhan per bin (data: id_tempat_sampah/serial_qr). (Selesai: Di-render via qrserver API)
- [x] Di halaman Manajemen Tempat Sampah: QR code harus ditampilkan sebagai gambar QR asli + teks ID/serial di bawahnya (bukan hanya teks atau placeholder). (Selesai: Di-render pada setiap row tabel)
- [x] Fitur Maps masih simulasi — develop jadi peta asli (integrasikan library maps sungguhan, mis. Leaflet/Google Maps) yang menampilkan titik lokasi bin/rumah asli dari database. (Selesai: Leaflet JS diintegrasikan di ManajemenTempatSampah)
- [x] Tombol "Tambah Titik" belum berfungsi — harus bisa menambahkan titik lokasi baru (koordinat) dan tersimpan ke backend. (Selesai: Form submit data latitude, longitude, max capacity, category, dan rt/rw)
- [x] Tombol "Laporan" belum berfungsi — hubungkan ke fitur generate/lihat laporan sungguhan. (Selesai: Ekspor CSV dari data list)
- [x] Kolom data yang belum ada di tabel: NIK, Peran, Wilayah, Setoran, Status — tambahkan sesuai skema data di dokumentasi (Bab ERD: users, roles, wilayah RT/RW, waste_logs untuk setoran). (Selesai: Data dari API /users dipetakan lengkap ke tabel)
- [x] Bagian Setting Password: ubah agar password bisa ditampilkan (toggle show/hide, ikon mata) supaya admin bisa cek kalau ada typo saat input — jangan simpan/tampilkan password mentah dari database (hash tetap di backend), ini hanya untuk input field saat set/reset password. (Selesai: Ikon mata visibility/visibility_off dengan state showPassword)
- [x] Fitur pencarian (search bar) belum berfungsi — hubungkan ke query search asli di backend. (Selesai: Terhubung ke parameter query pencarian backend)
- [x] Filter Peran, Status, RW, RT belum berfungsi — hubungkan sebagai query parameter ke backend dan terapkan filter sungguhan ke tabel. (Selesai: Filter parameter roleName, status, rw, rt dilewatkan ke API)
- [x] Tombol "Tambah Pengguna" belum berfungsi — buat form yang submit ke endpoint create user sungguhan (lengkap validasi). (Selesai: Form terintegrasi penuh untuk menambah/mengedit pengguna dengan NIK, status, wilayah RT/RW)
- [x] Fitur "Export CSV" belum berfungsi — implementasikan export data tabel (sesuai filter yang aktif) ke file CSV asli. (Selesai: CSV dinamis mengekspor data terfilter dengan kolom lengkap)
- [x] Tombol "Tambah Lokasi" — buat form input lokasi baru, submit ke backend, tersimpan dengan koordinat. (Selesai: Dibuat form modal POST ke /bins/areas)
- [x] Peta — ganti dari simulasi ke peta asli yang menampilkan data lokasi sungguhan dari backend. (Selesai: Menampilkan Leaflet map berisi Bins dan Households)
- [x] Search bar lokasi — hubungkan ke query pencarian asli. (Selesai: Pencarian lokal berbasis nama RW/Kelurahan)
- [x] Dropdown filter RT — hubungkan ke data RT asli dan terapkan filter ke daftar/peta. (Selesai: Filter dropdown berdasarkan Kelurahan asli dari DB)
- [x] Ganti semua ikon di halaman ini jadi ikon yang lebih modern dan konsisten (gunakan icon set yang sudah dipakai di project, mis. lucide-react, jangan campur beberapa sumber ikon berbeda). (Selesai: Ikon menggunakan Material Symbols Outlined)
- [x] Backend gagal memuat data jadwal kegiatan ke frontend — investigasi endpoint terkait (cek response backend, format data, dan error di network tab), pastikan data benar-benar sampai ke frontend. (Selesai: Endpoint /schedules dihubungkan dan dimuat)
- [x] Tombol "Buat Jadwal Baru" belum berfungsi — hubungkan ke form create yang submit ke backend. (Selesai: Form submit POST /schedules)
- [x] BUG KRITIS: saat mencoba menambahkan acara baru, muncul error "Terjadi Kesalahan Tidak Terduga — Invalid time value". Ini kemungkinan besar disebabkan oleh parsing/formatting tanggal yang menerima nilai null/undefined/format salah. Perbaiki dengan: (Selesai: Validasi tanggal ditambahkan di frontend & backend, format tanggal aman dengan safeFormatDate & safeFormatTime)
- [ ] Navbar aman, tidak ada perubahan diperlukan di bagian ini untuk saat ini.
- [x] BUG: di tabel rekap setoran, ditemukan data setoran dengan role "admin" padahal yang seharusnya bisa melakukan setoran/pencatatan sampah HANYA role Warga. Perbaiki middleware/validasi role di endpoint pencatatan sampah (waste-logs) agar HANYA user dengan role Warga yang bisa membuat record setoran — role Admin/Petugas harus ditolak (403 Forbidden) jika mencoba melakukan aksi ini, baik dari API langsung maupun dari UI (sembunyikan aksi tersebut dari UI admin juga). (Selesai: Ditambahkan role restriction 'WARGA' di prisma query dan filter)
- [x] Halaman ini masih UI kosong/develop placeholder — buat benar-benar berfungsi: ambil data profil, riwayat poin, dan aktivitas dari backend. (Selesai: Menampilkan leaderboard, profil detail, riwayat transaksi dari backend)
- [x] Search bar di halaman ini belum berfungsi — hubungkan ke query pencarian asli. (Selesai: Filter leaderboard berdasarkan query pencarian nama/wilayah)
- [x] Fitur "Lihat Semua" belum berfungsi — pastikan menampilkan seluruh data terkait (bukan potongan/simulasi). (Selesai: Toggle Lihat Semua untuk membatasi top 10 atau seluruh warga)
- [x] BUG: Admin menerima notifikasi "Warga Budi Antoro mengajukan pengosongan tong", tapi saat Admin klik notifikasi tersebut, UI malah menampilkan fitur UPLOAD FOTO (yang seharusnya hanya untuk Warga saat membuat pengajuan, bukan untuk Admin yang meninjau pengajuan). (Selesai: Cek status peran user, tampilkan panel review jika admin/petugas, form upload jika warga)

## Dari github-trello-automation-tracker.md

- [x] Satu board Trello untuk seluruh project, dengan list: "Backlog", "In Progress", "Review/Testing", "Done"
- [x] Label per bagian: "Backend", "Frontend", "Mobile" — dibuat otomatis via API saat pertama kali sync
- [ ] Aktifkan Trello Butler di board ini untuk 2 aturan dasar:
  - [ ] Rule A: kalau SEMUA item checklist di card sudah dicentang → otomatis pindahkan card ke list "Done" + tambah label hijau "Completed"
  - [ ] Rule B: kalau card dipindah manual ke list "In Progress" → otomatis tambahkan comment timestamp "Started: {date}"
- [x] Simpan kredensial Trello sebagai GitHub Secrets: `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID`
- [x] Buat `scripts/trello-sync.js` (Node.js, commit-driven) yang:
  - [x] a) Membaca `.trello-sync-state.json` untuk mengetahui commit terakhir yang sudah diproses (skip commit lama)
  - [x] b) Parsing commit message dengan pola: `<tipe>(<modul>): <judul> - refs <ID-TASK>`
  - [x] c) Untuk setiap commit yang match pola `refs <ID>`:
    - [x] Jika ID belum ada card-nya → buat card baru di "Backlog" dengan deskripsi lengkap + label modul + checklist default
    - [x] Jika ID sudah ada card-nya → tambahkan comment + pindahkan ke "In Progress" jika masih di Backlog
    - [x] Jika commit message mengandung kata kunci done/selesai/close/resolve/complete → centang semua checklist item (Butler lanjutkan ke "Done")
  - [x] d) Simpan mapping `ID-task → Trello card id` ke `.trello-sync-state.json` untuk anti-duplikat
- [x] Buat `.github/workflows/trello-sync.yml` yang:
  - [x] Berjalan otomatis setiap push ke branch utama (`main`)
  - [x] Mendeteksi label otomatis dari path file yang berubah:
  - [x] Job `trello-sync` TERPISAH dari job build/deploy — Trello API gagal tidak memblokir deployment
  - [x] Step commit otomatis untuk `.trello-sync-state.json` setelah sync berhasil (commit dengan `[skip ci]`)
- [x] Format deskripsi card yang konsisten dan informatif:
- [x] Setiap card WAJIB punya checklist dengan minimal 3 item: "Implementasi", "Testing", "Review"
- [x] Tidak boleh ada card duplikat — validasi via `.trello-sync-state.json` sebelum buat card baru
- [x] Perbarui `README-automation.md` dengan:
  - [x] Format commit message wajib: `<tipe>(<modul>): <judul> - refs <ID>`
  - [x] Contoh commit BENAR dan SALAH
  - [x] Cara cek status sync via `.trello-sync-state.json`
  - [x] Cara menandai task selesai (kata kunci done/selesai/close/resolve)
  - [x] Panduan konfigurasi Trello Butler (manual)
- [ ] Buat 1 commit dummy di repo BE+FE dengan format `refs` yang benar → verifikasi card muncul di Trello dengan label & deskripsi lengkap
- [ ] Buat commit dummy Mobile dengan label "Mobile" → verifikasi label Mobile muncul
- [ ] Buat commit penutup dengan kata kunci `done` → verifikasi checklist tercentang semua
- [ ] Konfirmasi job Trello sync tidak memblokir auto-deploy ke VPS

## Dari kkn-tracker.md

- [ ] Implementasi klaim awal QR: Mahasiswa wajib memindai QR (status awal `PRINTED`) lalu merekam GPS. Status berubah jadi `ASSIGNED_TO_PIC` atas nama mahasiswa tersebut.
- [ ] Implementasi form bantu registrasi warga: Dari QR yang sudah `ASSIGNED_TO_PIC`, data warga dimasukkan. Status berubah menjadi `PENDING_APPROVAL` (menunggu RW).
- [ ] Indikator status dampingan jelas: Di list aplikasi mahasiswa, tampil status "Menunggu Approval RW" vs "Aktif".
- [ ] Input 3 opsi kapasitas tong saat pendaftaran:
- [ ] Saat RW memverifikasi aktivasi bin warga, mahasiswa penerima (PIC) mendapatkan notifikasi in-app: "Registrasi [Nama Warga] berhasil diaktivasi, kamu dapat +10 poin". (Poin sudah di-handle di `rwService.ts`, tinggal implementasi notifikasi push/in-app).
- [ ] Form handover dari PIC mahasiswa lama ke mahasiswa baru.
- [ ] Transfer warga dan wilayah tugas di-record ke dalam tabel histori (`kkn_handover_history`).
- [ ] Form input fasilitas GIS (Bata Terawang, Loseda, Rumah Maggot, Bank Sampah, ternak).
- [ ] Bisa upload dokumentasi pendukung (foto/pdf).

## Dari login-validation-tracker.md

- [x] Saat tombol Login diklik dengan field Email dan/atau Password masih kosong: saat ini masih pakai alert/notif bawaan browser (`alert()` atau validasi HTML default yang tampilannya standar/jelek) — ganti dengan notifikasi custom modern (toast atau inline helper text di bawah tiap field, pilih salah satu yang konsisten dengan komponen lain di project).
- [x] Validasi kosong harus per-field, bukan satu pesan generik: jika Email kosong tampilkan pesan di bawah field Email ("Email wajib diisi"), jika Password kosong tampilkan pesan di bawah field Password ("Password wajib diisi"), jika keduanya kosong tampilkan keduanya sekaligus.
- [x] Saat Email/Password lengkap tapi salah (kredensial ditolak backend): tampilkan notifikasi modern (toast atau modal ringan) dengan pesan jelas dan ramah, contoh: "Email atau password salah. Coba lagi." — tanpa detail teknis dari backend.
- [x] Semua notifikasi (kosong dan salah) WAJIB pakai komponen visual yang sama (satu sistem toast/alert saja untuk seluruh app, jangan campur `alert()` bawaan dengan komponen custom di tempat lain).
- [x] Style: card kecil dengan sudut membulat (rounded), latar putih/surface, border tipis, sedikit shadow halus — bukan warna mencolok penuh (flat, bukan gradient).
- [x] Ikon di kiri sesuai jenis pesan: ikon peringatan/error untuk kredensial salah atau field kosong (gunakan ikon dari icon set yang sudah dipakai di project, konsisten, jangan tambah library ikon baru).
- [x] Posisi: toast muncul di pojok atas (atau posisi yang konsisten dengan notifikasi lain di project jika sudah ada), dengan animasi masuk (slide/fade) dan otomatis hilang setelah beberapa detik, atau bisa ditutup manual dengan tombol close.
- [x] Untuk error kredensial salah, field Password dikosongkan lagi otomatis setelah gagal (Email tetap terisi) agar user tidak perlu ketik ulang email.
- [x] Test di light mode dan dark mode (jika project sudah punya dark mode) — pastikan warna teks dan background tetap kontras jelas di keduanya.

## Dari master-tracker.md

- [x] Database - Tambah/perluas data role di tabel `roles` menjadi 8 role (Selesai: Diperbarui via Prisma seed & migration)
- [x] Database - Buat tabel `qr_batches` untuk melacak pencetakan batch QR (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `bins` tambahkan status (PRINTED, ASSIGNED_TO_PIC, ACTIVE_BOUND, BROKEN, INACTIVE) (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `bins` tambahkan `kepemilikan_utama_user_id` (Foreign Key ke `users`) (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `bins` tambahkan `kepemilikan_tambahan_user_ids` (Array string/JSON untuk sub-pemilik) (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Update tabel `waste_logs` tambahkan `ai_confidence`, `ai_classification`, `actual_weight_petugas`, `discrepancy_status`, `geolocation` (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `students_kkn` untuk menyimpan profil mahasiswa KKN, tanggal aktif, dan wilayah tugas (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `petugas_residu` untuk melacak skor KPI dan zona tugas petugas (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `facilities` untuk mencatat lokasi dan operasional Loseda, Bata Terawang, Rumah Maggot, Bank Sampah, TPS (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `facility_production_logs` untuk mencatat material masuk dan output produksi maggot/pupae (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `bank_sampah_ledger` untuk mencatat transaksi keuangan riil penjualan anorganik warga (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `ide_daur_ulang` untuk menampung pengajuan ide daur ulang warga (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `system_configs` untuk menyimpan parameter bisnis dinamis (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `audit_trail` untuk mencatat log perubahan data sensitif oleh admin (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `social_feed` untuk menampung stream aktivitas positif publik (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat tabel `notification_logs` untuk logging status pengiriman notifikasi WhatsApp, Email, dan FCM (Selesai: Ditambahkan ke schema & migrated)
- [x] Database - Buat Prisma Migration files bertahap dan reversible (up/down) (Selesai: Ditulis di migrations/20260721130000_extend_schema_for_8_roles/migration.sql)
- [x] Database - Buat migration script untuk memigrasikan data lama (users, bins, waste_logs) tanpa kehilangan data (Selesai: Dialter secara safe via migration.sql)
- [ ] Database - Uji coba migration rollback (down) secara lokal untuk memastikan keandalan migrasi
- [ ] Database - Lakukan backup database production sebelum eksekusi migrasi di server
- [x] BE - Definisikan RBAC Matrix dan middleware verifikasi izin untuk ke-8 role (Selesai)
- [x] BE - Implementasikan data-scoping berjenjang berbasis polygon wilayah pada query database (Selesai)
- [x] BE - Implementasikan endpoint registrasi Admin DLH (oleh Super Admin) (Selesai)
- [x] BE - Implementasikan endpoint registrasi Camat, Lurah, RW, dan whitelist Mahasiswa KKN (oleh Admin DLH) (Selesai)
- [x] BE - Implementasikan endpoint registrasi Petugas Residu (oleh RW atau Admin DLH) (Selesai)
- [x] BE - Implementasikan endpoint self-registration Warga dengan validasi otomatis terhadap QR ID master database (Selesai)
- [x] BE - Implementasikan endpoint self-registration Mahasiswa KKN (status PENDING sebelum diapprove Admin DLH) (Selesai)
- [x] BE - Buat logic time-bound akun Mahasiswa KKN (otomatis read-only setelah `end_date`) (Selesai)
- [ ] FE - Buat halaman login dan register dinamis menyesuaikan tipe akun (Role-based UI flow)
- [ ] Mobile - Hubungkan antarmuka login dan register ke API backend menggunakan JWT & Secure Storage
- [x] BE - Implementasikan state machine transition untuk QR Code (PRINTED -> ASSIGNED_TO_PIC -> ACTIVE_BOUND -> BROKEN/INACTIVE) (Selesai)
- [ ] BE - Buat audit trail otomatis setiap terjadi transisi status QR Code
- [x] BE - Buat endpoint bagi Admin DLH untuk generate QR batch baru (menciptakan baris di `qr_batches` & `bins`) (Selesai)
- [x] BE - Buat endpoint bagi Admin DLH untuk assign QR batch ke PIC Mahasiswa KKN (Selesai)
- [x] BE - Buat endpoint scan & registrasi bin oleh Mahasiswa KKN (validasi kecocokan PIC dan status ASSIGNED_TO_PIC) (Selesai)
- [x] BE - Ubah status bin menjadi ACTIVE_BOUND setelah registrasi berhasil (Selesai)
- [x] BE - Implementasikan logic kepemilikan ganda (1 Warga Utama sebagai penanggung jawab fisik, N Warga Tambahan) (Selesai)
- [ ] BE - Hubungkan AI volume estimation endpoint untuk estimasi volume tong (P x L x T) dari foto saat registrasi
- [x] BE - Implementasikan bonus +10 poin otomatis per tong sampah yang berhasil mencapai status ACTIVE_BOUND (Selesai)
- [ ] BE - Buat endpoint bagi RW untuk menandai tong sampah sebagai BROKEN (otomatis transisi ke INACTIVE)
- [ ] BE - Buat endpoint pengajuan penggantian tong sampah rusak oleh Warga ke RW/Admin DLH
- [ ] FE - Buat panel Admin DLH untuk generate dan assign batch QR ke Mahasiswa KKN
- [ ] FE/Mobile - Buat alur form pengajuan penggantian tong rusak bagi Warga/RW
- [x] Database - Seed tabel `system_configs` dengan 14 parameter bisnis bawaan (ai_confidence_threshold, multiplier, penalty, dll.) (Selesai)
- [x] BE - Implementasikan Service/Repository untuk membaca konfigurasi dinamis dari `system_configs` (Selesai)
- [x] BE - Integrasikan caching Redis untuk optimasi pembacaan system configs (Selesai)
- [x] BE - Implementasikan invalidasi cache Redis otomatis ketika ada konfigurasi yang diupdate (Selesai)
- [ ] FE - Buat halaman panel admin Rule Engine (Super Admin & Admin DLH) untuk CRUD parameter bisnis secara dinamis
- [x] BE - Refactor `kepemilikanTambahanUserIds` dan `kepemilikanUtamaUserId` ke tabel junction `bin_ownerships` (Selesai)
- [x] BE - Terapkan middleware `readOnlyGuard` untuk `CAMAT` & `LURAH` (Selesai)
- [x] Database - Seed 13 parameter default `system_configs` di migration SQL (Selesai)
- [x] Dokumentasi - Tambahkan backup runbook `pg_dump` ke `docs/deployment_runbook.md` (Selesai)
- [x] BE - Hubungkan logging `AuditTrail` untuk approve KKN, status BROKEN, dan batch assignment (Selesai)
- [x] BE - Cegah race condition aktivasi QR dengan transaction lock `FOR UPDATE` (Selesai)
- [x] Testing - Tambahkan test case vitest untuk Camat/Lurah block, KKN expired block, dan PIC mismatch (Selesai)
- [ ] BE - Buat Cron job untuk memicu window pelaporan Petugas Residu pukul 06:00-08:00 dan 16:00-18:00
- [ ] BE - Implementasikan potongan skor KPI 15% otomatis jika Petugas telat atau tidak melaporkan di dalam window
- [ ] BE - Buat WebSocket server untuk sistem dispatch on-demand tong penuh (>80%)
- [ ] BE - Implementasikan broadcast dispatch ke seluruh Petugas Residu dalam radius 2 KM (Haversine formula)
- [ ] BE - Buat endpoint/WebSocket event "Terima Tugas" tercepat (concurrency safe)
- [ ] BE - Lakukan re-optimasi rute penjemputan dinamis setelah tugas diclaim oleh petugas
- [ ] FE - Tambahkan visualisasi status penjemputan petugas pada peta monitoring
- [ ] Mobile - Integrasikan WebSocket client pada aplikasi Petugas Residu untuk menerima broadcast dispatch secara real-time
- [ ] Mobile - Desain UI claim tugas "Terima Tugas" tercepat dengan kalkulasi rute navigasi GPS ke lokasi bin
- [ ] BE - Implementasikan endpoint discrepancy check: bandingkan input manual Petugas vs klasifikasi AI
- [ ] BE - Buat status PENDING_REVIEW jika ada ketidaksesuaian klasifikasi dan confidence AI > 90%
- [ ] BE - Buat endpoint bagi Admin DLH untuk mengaudit/memvalidasi laporan berstatus PENDING_REVIEW
- [ ] BE - Implementasikan kalkulator skor kepatuhan warga (Compliance Score) berbasis formula On-Time Rate & AI Accuracy
- [ ] BE - Buat kalkulator emisi gas rumah kaca yang dihindari (CO2e avoided) dari berat organik komposter/maggot (*0.05)
- [ ] BE - Buat endpoint bagi Petugas Residu untuk submit laporan aktual (timbangan, foto, klasifikasi manual, GPS)
- [ ] FE - Buat halaman audit discrepancy bagi Admin DLH untuk memproses laporan PENDING_REVIEW
- [ ] Mobile - Hubungkan form input setoran sampah Petugas Residu ke endpoint laporan aktual backend
- [ ] BE - Implementasikan ledger poin terpisah per dimensi (Reduksi Tonase, Partisipasi Streak, Ide Daur Ulang)
- [ ] BE - Buat tracker streak 5 hari berturut-turut setoran tepat waktu untuk bonus +10 poin Warga Tambahan
- [ ] BE - Buat endpoint pengajuan ide daur ulang oleh warga (upload foto, deskripsi, material)
- [ ] BE - Buat endpoint persetujuan ide daur ulang oleh RW (sekaligus memicu penambahan +50 poin)
- [ ] BE - Buat service poin KPI Petugas Residu (poin dari presisi laporan & ketepatan waktu)
- [ ] BE - Buat service poin Mahasiswa KKN (poin dari pendampingan rumah tangga aktif & growth compliance rate)
- [ ] BE - Buat logic agregasi poin wilayah (RT, RW, Kelurahan, Kecamatan) sebagai data virtual (read-only)
- [ ] FE - Buat leaderboard gamifikasi berjenjang berdasarkan agregasi wilayah dan individu warga
- [ ] FE/Mobile - Buat antarmuka pengajuan ide daur ulang (Warga) dan persetujuan ide daur ulang (RW)
- [ ] FE - Integrasikan peta Leaflet.js dengan kustomisasi marker (Loseda/Maggot=Hijau, Bank Sampah=Biru, TPS=Merah, Flash Drop=Emas)
- [ ] FE - Buat komponen legenda peta interaktif sesuai kategori fasilitas
- [ ] FE - Buat form GIS untuk input data fasilitas baru (oleh Mahasiswa KKN atau RW)
- [ ] BE - Buat endpoint manajemen fasilitas dan pencatatan produksi Rumah Maggot (Material masuk vs output panen)
- [ ] BE - Buat log distribusi produk maggot ke peternakan terdaftar
- [ ] BE - Buat model data dan CRUD untuk entitas peternakan penerima distribusi (populasi & hasil panen)
- [ ] BE - Buat model dan endpoint Bank Sampah Ledger untuk pencatatan saldo rupiah warga dari penjualan anorganik
- [ ] FE - Buat UI Bank Sampah Ledger untuk melihat saldo rupiah, riwayat transaksi, dan penarikan tunai warga
- [ ] BE - Buat provider-agnostic interface untuk layanan WhatsApp (Wablas/Fonnte)
- [ ] BE - Implementasikan pengiriman OTP Login Warga via WhatsApp
- [ ] BE - Implementasikan push alarm WhatsApp untuk notifikasi "Tong Penuh" ke Petugas Residu terdekat
- [ ] BE - Implementasikan pengiriman daily report kepatuhan wilayah ke WhatsApp RW jika kepatuhan menurun
- [ ] BE - Integrasikan SendGrid SMTP untuk pengiriman laporan PDF bulanan otomatis ke Camat & Lurah
- [ ] BE - Implementasikan pengiriman email SendGrid untuk konfirmasi penerimaan Ide Daur Ulang
- [ ] BE - Konfigurasikan Firebase Cloud Messaging (FCM) SDK di backend
- [ ] BE - Implementasikan trigger push notification FCM saat event "Flash Drop Hour" aktif
- [ ] BE - Implementasikan trigger push notification FCM saat warga berhasil meng-unlock Badge Gamifikasi baru
- [ ] FE/Mobile - Implementasikan receiver token FCM dan penanganan notifikasi in-app
- [ ] FE - Buat Multi-axis Line Chart gabungan tren mingguan (Organik, Non-Organik, Residu) berlabel satuan kg
- [ ] FE - Tambahkan fitur toggle filter untuk memecah bagan multi-axis menjadi bagan kategori individual
- [ ] FE - Buat chart donat komposisi sampah disertai tombol detail breakdown per RT/RW
- [ ] FE - Implementasikan fitur export CSV dan PDF untuk tabel breakdown komposisi sampah
- [ ] FE - Buat visualisasi Heatmap kepatuhan pada peta GIS berbasis polygon RT/RW sewarna skor kepatuhannya
- [ ] BE - Buat sistem logging Audit Trail untuk melacak perubahan data oleh admin (Super Admin only view)
- [ ] BE - Buat sistem logging Social Feed untuk menampilkan stream aktivitas positif publik secara real-time
- [ ] FE - Tampilkan feed aktivitas publik di Dashboard Warga
- [ ] FE - Buat fitur download panduan pemilahan sampah PDF statis yang diunggah oleh Admin DLH
- [ ] FE - Hapus card "Tempat Sampah QR" dari Dashboard Utama dan pindahkan ke halaman Manajemen Tempat Sampah
- [ ] FE - Hapus panel "Manajemen Pengguna" dari Dashboard Poin Warga
- [ ] FE - Ganti tombol "Hubungi RT" menjadi "Hubungi Petugas" yang memicu dispatch darurat & marker di peta petugas
- [ ] Mobile - Hapus seluruh fallback dummy/mock data pada `mobile/lib/config/app_config.dart`
- [ ] Mobile - Hapus file dummy `mobile/lib/data/mock/mock_data.dart`
- [ ] Mobile - Hubungkan layer repository auth ke API backend (`api_auth_repository.dart`) dengan JWT token rotation
- [ ] Mobile - Hubungkan layer repository bin ke API backend (`api_bin_repository.dart`) untuk monitoring kapasitas riil
- [ ] Mobile - Hubungkan riwayat setoran sampah ke API backend menggunakan `api_waste_log_repository.dart`
- [ ] Mobile - Uji sinkronisasi WebSocket untuk dispatch on-demand dari sisi aplikasi mobile Petugas Residu
- [ ] Mobile - Uji integrasi scan QR Code dan kirim payload registrasi bin beserta foto estimasi volume AI ke backend
- [ ] Sistem - Jalankan end-to-end integration testing antara Backend, Web Frontend, dan Mobile App secara penuh

## Dari monitoring-tracker.md

- [x] Middleware `readOnlyGuard` menolak (403) seluruh request POST/PUT/DELETE/PATCH dari role `ADMIN_DLH`, `CAMAT`, dan `LURAH` ke endpoint manapun.
- [x] Bypassing (pengecualian) khusus untuk endpoint `PUT /api/v1/waste/logs/:id/resolve` jika dilakukan oleh `ADMIN_DLH` (resolving discrepancy).
- [x] Data-scoping wilayah secara dinamis:
- [x] 3 Grafik tren setoran mingguan (Organik vs Anorganik) sesuai batasan scope wilayah.
- [x] Ringkasan data median wilayah kepatuhan.
- [x] Kartu Summary: Total Rumah Tangga, Sampah Terkumpul, Tempat Sampah Aktif, dan Peringatan Radar Merah Tong Penuh.
- [x] Peta interaktif Leaflet menampilkan titik tong sampah dengan indikator warna (Aman/Waspada/Penuh).
- [x] Radar merah berkedip (pulsing effect) pada tong sampah dengan tingkat keterisian penuh (>90%).
- [x] Marker fasilitas (Bata Terawang, Loseda, Rumah Maggot, Bank Sampah) terpasang di peta.
- [x] Seluruh komponen peta bersifat Read-Only bagi para pemantau.
- [x] Halaman Review Diskrepansi AI (`ReviewDiscrepancy.tsx`) memuat seluruh log berstatus `PENDING_REVIEW` akibat ketidaksesuaian input petugas dan deteksi AI.
- [x] Menampilkan data foto/timbangan/klasifikasi kontras untuk mempermudah audit.
- [x] Tombol resolusi putusan: "Setujui Hasil AI" dan "Setujui Petugas" yang mengirim data ke backend.
- [x] Camat dan Lurah dilarang keras/ditolak masuk ke halaman ini.
- [x] Tombol ekspor data CSV & PDF terintegrasi pada dashboard analitik.
- [x] Tombol "Buku Panduan PDF" untuk mengunduh pedoman pemilahan sampah cerdas.

## Dari petugas-tracker.md

- [x] Penambahan UI input angka manual di form `PetugasDashboard.tsx` khusus untuk berat timbangan fisik.
- [x] Menyimpan `actualWeightPetugas` secara terpisah dari estimasi AI di `WasteLog`.
- [x] Implementasi rumus `KPI_Petugas = (0.6 x Ketepatan_Waktu_Lapor) + (0.4 x Akurasi_vs_AI)`.
- [x] Pembaruan nilai `kpiScore` di tabel `PetugasResidu` setiap *submission* berhasil.
- [x] Menampilkan *real-time score* pada dashboard petugas di *frontend*.
- [x] Pembuatan `cronService.ts` untuk melacak `DispatchTask` yang tidak dipenuhi dalam *window* operasional (06:00-08:00 dan 16:00-18:00).
- [x] Mengirimkan notifikasi hierarkis secara otomatis (RW -> Lurah -> Camat -> Admin DLH).
- [x] Endpoint `/api/v1/dashboard/export-dataset` untuk men-download riwayat dalam format CSV (hanya bisa diakses oleh role yang ditentukan).
- [x] Tombol pada portal *read-only* Admin DLH.
- [x] Backend
- [x] Frontend
- [x] Verification

## Dari polish-tracker.md

- [x] Saat email/password salah, tampilkan pesan error dalam bentuk popup/modal atau toast modern (bukan alert bawaan browser, bukan teks error polos di bawah form) — desain clean, konsisten dengan tema warna project (hijau organik/biru non-organik), dengan ikon dan animasi masuk/keluar yang halus. (Selesai: Menambahkan modal error custom dan interaktif dengan warning icon)
- [x] Pesan error harus jelas dan manusiawi (contoh: "Email atau password salah, silakan coba lagi" — jangan tampilkan detail teknis/stack trace ke user). (Selesai: Diubah menjadi pesan humanis "Akses Ditolak: Email atau kata sandi salah...")
- [x] Tambahkan debounce/cooldown pada tombol Login: setelah diklik, tombol langsung disabled dan tampilkan loading indicator (spinner) selama 1-2 detik minimum sebelum bisa diklik lagi — ini untuk mencegah spam-click maupun spam request ke backend. (Selesai: Tombol disabled dengan spinner loading minimal 1.5 detik)
- [x] Saat login berhasil, tampilkan transisi/loading state yang halus sebelum redirect ke dashboard sesuai role (jangan langsung lompat halaman tanpa feedback visual). (Selesai: Overlay full-screen berwarna hijau sukses dengan progress spinner selama 1.5 detik)
- [x] Pastikan halaman "Pengaturan Informasi"/Profil benar-benar berfungsi di SETIAP role (bukan hanya salah satu role) — ambil data asli dari backend sesuai user yang sedang login, dan submit perubahan (nama, no HP, alamat, dsb sesuai field yang relevan per role) benar-benar tersimpan ke backend. (Selesai: Form terintegrasi untuk nama, email, no HP, dan alamat tinggal untuk semua role)
- [x] Tambahkan fitur upload foto profil: (Selesai: Multer upload avatar di `/auth/upload-avatar` terintegrasi)
- [x] Pastikan validasi & error handling saat update profil/upload foto gagal (tampilkan pesan error yang jelas, bukan blank/crash), konsisten dengan pola loading/error/empty state yang sudah dipakai di halaman lain. (Selesai: Pesan error/toast modern ditampilkan jika terjadi kegagalan)

## Dari portal-tracker.md

- [x] A.1 Dashboard Ringkasan Mahasiswa: Kartu ringkasan rumah tangga diregistrasi, kuota target/maksimum, progress bar visual. Masa tugas KKN, status whitelist, alert H-7.
- [x] A.2 Fitur Registrasi Tong Sampah (Assist Warga): Form registrasi, scan QR tong sampah, validasi QR batch mahasiswa, upload foto fisik, AI volume estimation, sukses state & retry error handling.
- [x] A.3 Monitor Warga yang Telah Diregistrasi: Tabel/list warga, search & filter (RT, status bin, kepatuhan), detail warga (setoran, foto, kontak), tombol WhatsApp.
- [x] A.4 Fitur Tambahan: Peta lokasi warga terdaftar, checklist "Rumah Belum Diregistrasi", log aktivitas mahasiswa, ringkasan poin kontribusi.
- [x] B.1 Pencatatan & Input Data: Tombol "Input Ketidakpatuhan", pemindai QR kantong sampah, wajib upload foto bukti dari kamera, validasi input, pemicu notifikasi pelanggaran.
- [x] B.2 Dashboard Analitik & Agregat: Grafik volume residu harian/mingguan/bulanan, heatmap peta "Zona Merah Kepatuhan", tabel "Skor Kepatuhan Wilayah", filter loading states.
- [x] B.3 Integrasi Siklus Hulu-ke-Hilir: Kirim edukasi/peringatan otomatis ke warga (in-app & WhatsApp), potong poin warga berdasarkan residu_penalty_multiplier, status badge "Hijau" tanpa pelanggaran 1 minggu, riwayat pelanggaran warga dapat diakses warga/admin/KKN.
- [x] B.4 Dashboard Ringkasan Petugas Residu: Ringkasan harian (pelanggaran, tonase residu, comparison %), riwayat input petugas.

## Dari progress-tracker.md

- [x] `frontend/src/pages/Dashboard/Dashboard.tsx` — Dashboard ditarik dari API `/dashboard/summary` (Warga) dan `/dashboard/kpi` + fetch tables (Admin/Petugas).
- [x] `frontend/src/pages/LaporanAnalitik/LaporanAnalitik.tsx` — Data metrik, uptime, AI accuracy, chart cache diambil dari backend via `dashboard/analytics`.
- [x] `frontend/src/pages/JadwalKegiatan/JadwalKegiatan.tsx` — Kalender dibuat dinamis dengan JS Date dan merender jadwal dari API backend.
- [x] `frontend/src/store/useMasterDataStore.ts` — Store menggunakan API sebenarnya.
- [x] `frontend/src/store/useLeaderboardStore.ts` — Telah disambung ke API `/points/leaderboard`.
- [ ] `mobile/lib/config/app_config.dart` — Terdapat konfigurasi fallback dummy (`mockHouseholdId`, `mockUserId`) yang harus disambungkan ke auth state real.
- [ ] `mobile/lib/data/mock/mock_data.dart` — Sumber utama data simulasi untuk aplikasi mobile, harus digantikan endpoint HTTP.
- [ ] `mobile/lib/data/repositories/mock_auth_repository.dart` — Implementasi login dan sesi masih menggunakan credentials dummy. Perlu diganti implementasi HTTP nyata (`api_auth_repository`).
- [ ] `mobile/lib/data/repositories/mock_bin_repository.dart` — Semua data bin, fetch bin, pengajuan, dan deteksi AI disimulasikan lokal. Perlu diganti implementasi HTTP nyata (`api_bin_repository`).
- [ ] `mobile/lib/data/repositories/mock_waste_log_repository.dart` — Riwayat transaksi setor sampah (waste logs) berjalan lokal tanpa fetch API server. Perlu diganti implementasi HTTP nyata.
- [ ] Konfigurasi Mobile API — Provider/Dependencies di mobile (Riverpod/Provider) harus di-switch agar menggunakan implementasi Repository HTTP (API), bukan lagi Mock Repository.

## Dari qc-fix-tracker.md

- [x] 1. MANAJEMEN TEMPAT SAMPAH — TOMBOL "TAMBAH TITIK" & KODE QR AUTO-GENERATE
  - [x] Perbaiki/tambahkan tombol "Tambah Titik Tempat Sampah" di Halaman Manajemen Tempat Sampah.
  - [x] Buat field Kode QR read-only/auto-generate dari backend dengan format `ORG0000XXXX` / `ANORG0000XXXX` (nomor urut lanjut dari yang ada).
  - [x] Frontend: tampilkan preview read-only Kode QR saat form tambah dibuka (fetch dari API).
  - [x] Backend: validasi tolak submit Kode QR kustom dari client.
- [x] 2. MANAJEMEN LOKASI & PETA — DATA DUMMY REALISTIS + UI ZONA
  - [x] Generate 30-50 data dummy lokasi warga via API (Coblong, lengkap GPS, nama, alamat, status tong).
  - [x] Pastikan seluruh titik warga/tong muncul sebagai marker di peta.
  - [x] Terapkan UI Zona di peta berdasarkan agregat kepatuhan warga (sesuai standar GIS 3-level zoom).
  - [x] Verifikasi filter RT, pencarian, dan tombol tambah lokasi.
- [x] 3. REVIEW DISKREPANSI KLASIFIKASI AI — DATA CONTOH REAL
  - [x] Generate 5-10 kasus discrepancy riil via API (AI confidence > 90% vs Petugas input, status `PENDING_REVIEW`).
  - [x] Lengkapi data kasus: foto, nama warga, nama petugas, waktu, AI confidence, AI vs Petugas classification.
  - [x] Verifikasi tampilan detail kasus di dashboard Admin DLH dan fungsionalitas tombol "Setujui AI" / "Setujui Petugas".
- [x] 4. REKAP SETORAN — BUG "GAGAL MEMUAT DATA DARI SERVER"
  - [x] Investigasi log backend / response API (cek rename tabel/kolom KBBI, timeout, pagination).
  - [x] Perbaiki akar masalah query/endpoint Rekap Setoran.
  - [x] Tambahkan log error detail di server dan error handling ramah di UI.
  - [x] Verifikasi filter/sortir dan ekspor CSV.
- [x] 5. IDE DAUR ULANG — TAMBAH DATA DUMMY CONTOH REAL
  - [x] Generate 5-10 ide daur ulang via API dengan variasi status (PENDING, APPROVED, REJECTED).
  - [x] Verifikasi status APPROVED memicu +50 poin warga dan tayang di Social Feed.
- [x] 6. JADWAL KEGIATAN — BUG "GAGAL MEMUAT DATA"
  - [x] Investigasi penyebab (skema KBBI / rename tabel) pada jadwal kegiatan.
  - [x] Perbaiki dan verifikasi data jadwal ter-load dengan benar.
- [x] 7. KATEGORI TEMPAT SAMPAH — BUG "GAGAL MEMUAT DATA"
  - [x] Investigasi penyebab (skema KBBI / rename tabel) pada kategori tempat sampah.
  - [x] Perbaiki data kategori agar tampil beserta fotonya.
- [x] 8. QC MENYELURUH & INVESTIGASI SISTEMIK
  - [x] Scan seluruh backend untuk referensi nama tabel/kolom lama (belum ter-rename KBBI).
  - [x] Jalankan QC mandiri ke semua 8 portal dan perbaiki halaman lain yang terdampak.
  - [x] Buat ringkasan kelayakan rilis.

## Dari revisi-trashcare-tracker.md

- [ ] Ganti nama aplikasi & semua referensi teks dari "Pilah Sampah Cerdas" menjadi "TrashCare" di seluruh web & mobile.
- [ ] Pasang logo baru TrashCare (asset sudah ada, minta filenya) di header/navbar/splash screen/favicon.
- [ ] Tambahkan halaman/section "Tentang Aplikasi" menampilkan: nama aplikasi (TrashCare), versi (mulai 1.0.0 saat rilis — siapkan konstanta versi terpusat, jangan hardcode di banyak tempat), logo.
- [ ] Hosting tetap di VPS existing, tidak perlu migrasi.
- [ ] Audit SEMUA nama tabel & kolom database, buat migration untuk rename ke Bahasa Indonesia baku sesuai KBBI.
- [ ] Buat dokumen mapping-nama-tabel.md berisi nama lama -> nama baru untuk semua tabel/kolom yang diubah.
- [ ] Migration WAJIB reversible, backup database dulu sebelum eksekusi.
- [ ] WARGA: tetap pakai foto -> AI deteksi -> hasil berat (kg) + klasifikasi organik/anorganik.
- [ ] PETUGAS RESIDU: TIDAK pakai AI — pakai timbangan IoT (manual input) + WAJIB foto dokumentasi.
- [ ] AI Warga WAJIB mendukung deteksi CAMPURAN dalam satu foto (hasil deteksi berupa breakdown per kategori dalam satu response).
- [ ] Format QR: `[JENIS][NNNN][TAHUN]` (lanjutkan nomor urut existing, unique constraint).
- [ ] State machine QR TETAP ADA (PRINTED -> ASSIGNED_TO_PIC -> ACTIVE -> NONAKTIF/BROKEN) dan approval RW.
- [ ] Alur baru: Warga & Mahasiswa punya akun terpisah -> Mahasiswa bantu Warga aktivasi (scan 2 QR) -> RW approve -> kepemilikan tercatat, catat `dibantu_oleh_mahasiswa_id`.
- [ ] Peta GIS: 2 tong (organik+anorganik) milik satu RT digabung jadi SATU marker.
- [ ] Dokumentasi foto tong: diambil rutin saat buang sampah.
- [ ] Kapasitas tong: ubah manual WAJIB pakai foto bukti.
- [ ] Tambah role RT (read-only scope RT).
- [ ] RW melihat scope RT dan warganya.
- [ ] Kelurahan ambil data agregat dari RW + Warga & Petugas Residu.
- [ ] Validasi: 1 RW WAJIB punya 1 Petugas Residu.
- [ ] UI Super Admin: hapus widget tidak penting.
- [ ] UI Admin DLH, Camat, Kelurahan: Sembunyikan total semua CRUD, hanya grafik dan monitoring.
- [ ] Formula poin: `confidence x poin_basic(10)`, dihitung terpisah per kategori jika campuran, akumulasi ke total.
- [ ] Misi jam 06-08 & 16-18 (luar jam tetap dapat poin dasar tanpa bonus).
- [ ] Penalty: -1 poin/hari berturut, floor di 0.
- [ ] Motivasi/kondisi: rule-based template (if streak > X hari), simpan di DB.
- [ ] Fase Mahasiswa: Threshold aktif vs reminder (satuan hari/bulan per mahasiswa), beralih fungsi notifikasi otomatis.
- [ ] Rute bebas (tidak diatur sistem).
- [ ] Setiap pengambilan: foto dokumentasi + hasil timbang (manual).
- [ ] Kategori residu: 1 kategori umum "Residu".
- [ ] Grafik tren volume residu.
- [ ] Hapus peta dari dashboard (pindah ke GIS).
- [ ] Hapus widget "Aktivitas Terbaru" (pindah ke Log Aktivitas).
- [ ] Dashboard utama hanya: grafik komposisi sampah, tren setoran, kepatuhan wilayah, performa.
- [ ] Bar Chart Race untuk grafik balapan real-time.
- [ ] Aktor dievaluasi: Warga, Petugas Residu, RT, RW.
- [ ] Rekap Setoran: data default scope login, fungsi filter untuk export dan grouping kohort.
- [ ] Halaman GIS terpisah. Level 1 (Kelurahan), Level 2 (RW), Level 3 (RT & titik individu gabungan 2 bin).
- [ ] Setiap level tampilkan grafik performa samping peta, animasi halus.
- [ ] Halaman "Panduan Kategori Sampah" (terpisah dari AI scan) dengan contoh foto.
- [ ] Struktur data tabel kategori (dengan `url_foto_contoh`) edit via admin.
- [ ] Modern, clean, minim.
- [ ] Konsisten dengan design system (Lucide, warna hijau/biru).
- [ ] Tetap loading/error state via API asli.

## Dari rw-tracker.md

- [ ] Analitik dan peta GIS ter-scope hanya untuk wilayah RW bersangkutan.
- [ ] Akses interaktif (bukan sekadar read-only seperti Camat/Lurah).
- [ ] Halaman daftar bin berstatus `PENDING_APPROVAL` di wilayahnya.
- [ ] Menampilkan detail: data warga, foto tong, hasil cek Master QR DB, GPS lokasi, mahasiswa pendamping.
- [ ] Tombol Setujui -> Ubah status menjadi `ACTIVE_BOUND`.
- [ ] Trigger otomatis penambahan +10 poin untuk Warga dan +10 poin untuk Mahasiswa KKN.
- [ ] Tombol Tolak -> Form alasan penolakan dan notifikasi balik ke warga/mahasiswa.
- [ ] Halaman daftar Petugas Residu berstatus PENDING di wilayahnya.
- [ ] Fitur Setujui / Tolak akun Petugas Residu.
- [ ] Menerima push notifikasi real-time saat warga menandai tong penuh beserta foto bukti.
- [ ] Peta wilayah menampilkan radar merah pada lokasi tong yang penuh.
- [ ] Memantau status penanganan tong penuh (sudah diambil/belum) beserta foto dokumentasi.
- [ ] Halaman daftar bin dengan status `INACTIVE` (30 hari tanpa aktivitas).
- [ ] Hanya akses Read-Only, tanpa tombol aktivasi (karena merupakan wewenang Super Admin / Warga mengajukan aktivasi ulang).
- [ ] Fitur menambahkan catatan/komentar opsional untuk diteruskan ke Super Admin.
- [ ] Fitur untuk menandai bin sebagai `BROKEN` (rusak/hilang fisik).
- [ ] Perubahan status ini membuat QR menjadi inaktif secara permanen dan tercatat dalam Audit Trail.
- [ ] Halaman daftar pengajuan Ide Daur Ulang (judul, foto, material).
- [ ] Tombol Setujui (+50 poin ke warga, tampil di Social Feed) atau Tolak.
- [ ] Halaman approval pendaftaran fasilitas lingkungan (Rumah Maggot, Bank Sampah, dll).
- [ ] Form input manual data produksi mingguan fasilitas (material masuk, output panen).
- [ ] Rekapitulasi monitoring seluruh fasilitas di wilayah RW tersebut.

## Dari superadmin-tracker.md

- [x] CRUD penuh untuk SEMUA akun: buat/edit/nonaktifkan akun Admin DLH, Camat, Lurah (Super Admin satu-satunya yang boleh buat akun ini)
- [x] Atur jadwal mulai/selesai (Time-Bound) akun Mahasiswa KKN, termasuk fitur "handover" pindah tangan PIC ke mahasiswa KKN periode berikutnya (form transfer wilayah tugas + histori PIC lama tetap tersimpan untuk audit)
- [x] Lihat & kelola SEMUA akun lintas role (termasuk RW, Petugas Residu, Warga) dengan kemampuan suspend/aktifkan
- [x] Halaman khusus daftar bin berstatus TIDAK AKTIF (lewat 30 hari tanpa aktivitas) — HANYA Super Admin yang punya tombol "Aktifkan Kembali"
- [x] Filter berdasarkan wilayah, lama tidak aktif, dan alasan (jika ada catatan RW)
- [x] Peta menampilkan SEMUA QR yang sudah ACTIVE_BOUND per wilayah, real-time, dengan detail: pemilik, tanggal aktivasi, status penggunaan
- [x] Halaman Master QR Database: generate batch baru, lihat status tiap QR (BELUM_DIGUNAKAN / DIPEGANG_MAHASISWA / PENDING_APPROVAL / ACTIVE_BOUND), search by kode QR individual
- [x] CRUD seluruh parameter system_configs (semua nilai di GLOBAL CONTEXT: threshold AI confidence, multiplier poin, radius dispatch, kuota mahasiswa, dll)
- [x] Fitur "Approval Berjenjang Otomatis": definisikan alur approval multi-level (mis. pengajuan fasilitas: Mahasiswa input -> RW review -> otomatis eskalasi ke Admin DLH jika RW tidak respon dalam X hari) — buat sebagai workflow configurable, bukan hardcode
- [x] Halaman Audit Trail lengkap: semua Action, User_ID, Timestamp, Old_Value, New_Value dari SELURUH sistem, dengan filter & search, TIDAK bisa diakses role manapun selain Super Admin
- [x] Analitik seluruh kota: 3 grafik tren, heatmap kepatuhan (median per wilayah), leaderboard semua wilayah, export semua data

## Dari system-audit-report.md

- [x] Scan seluruh codebase (backend, frontend, mobile) untuk: dead code, function/variable tidak terpakai, duplikasi logic yang seharusnya di-extract jadi helper/reusable.
- [x] Cek konsistensi penamaan (tabel/kolom Bahasa Indonesia KBBI, struktur folder Clean Architecture) — laporkan penyimpangan.
- [x] Cek semua endpoint punya validasi input + error handling eksplisit, tidak ada try-catch kosong.
- [x] Cek tidak ada kredensial/API key hardcoded di kode (grep untuk pattern key/secret/password mentah).
- [x] Cek dependency yang sudah tidak dipakai lagi di package.json/pubspec.yaml — catat untuk dibersihkan.
- [x] Login sukses & gagal (pesan error jelas).
- [x] Semua fitur utama role tsb dijalankan end-to-end via API asli, verifikasi hasilnya benar muncul di database & UI terkait.
- [x] RBAC: role ini mencoba akses endpoint role lain yang tidak berwenang -> WAJIB ditolak 403.
- [x] Data-scoping wilayah benar (tidak bocor lintas RT/RW/Kelurahan/Kecamatan).
- [x] QR lifecycle lengkap: generate -> assign mahasiswa -> registrasi+scan 2 QR -> approval RW -> ACTIVE -> uji BROKEN/nonaktif oleh RW.
- [x] Alur setor sampah warga: foto -> AI deteksi (termasuk kasus campuran organik+anorganik dalam 1 foto) -> poin terhitung benar sesuai formula confidence x 10, akumulasi ke total sebelumnya.
- [x] Alur Petugas Residu: keliling ambil residu -> foto dokumentasi + input timbang -> data tersimpan & muncul di grafik tren residu.
- [x] Penalty tidak setor: simulasikan 1, 2, 3 hari berturut tidak setor -> verifikasi minus poin akumulatif benar (-1, -2, -3) dan berhenti di 0 (tidak minus lebih jauh), notifikasi ajakan tetap terkirim.
- [x] Fase Mahasiswa: verifikasi threshold manual bekerja — sebelum threshold fitur assist aktif, sesudah threshold otomatis berganti jadi reminder saja.
- [x] GIS 3-level zoom: Kelurahan -> RW -> RT/titik tong, verifikasi transisi & data tiap level benar sesuai wilayah.
- [x] Race condition: 2 request aktivasi QR yang sama nyaris bersamaan -> hanya 1 berhasil.
- [x] Payload kosong/salah format ke endpoint utama -> ditolak 400, bukan crash 500.
- [x] Koneksi AI eksternal diputus -> alur setor gagal dengan sopan, sistem lain tetap jalan.
- [x] Simulasi 20-30 user aksi bersamaan (login, setor sampah) -> tidak ada data tercampur, response time wajar.
- [x] Cek resource server (CPU/RAM) tidak mendekati limit saat beban simulasi.

## Dari test-report.md

- [x] Login sukses 8 role & generate JWT valid (Verified E2E test)
- [x] Login gagal (password/email salah) ditangani anggun (401 Unauthorized dengan JSON terstruktur)
- [x] Read-only restriction untuk Camat, Lurah, & Mahasiswa KKN kadaluarsa (PASS, middleware readOnlyGuard memblokir POST/PUT/DELETE)
- [x] Token invalid/expired ditolak 401 (PASS, JWT verification middleware)
- [x] Data scoping (RW, Kelurahan, DLH, Super Admin) (PASS, RT/RW data isolation query)
- [x] Generate QR Batch baru (status PRINTED) (PASS)
- [x] Assign Batch ke Mahasiswa KKN (status ASSIGNED_TO_PIC) (PASS)
- [x] Scan & registrasi bin oleh PIC yang tepat (status ACTIVE_BOUND, bonus +10) (PASS, database-verified)
- [x] Scan bin oleh PIC yang salah (ditolak PIC_MISMATCH) (PASS)
- [x] Scan bin yang sudah aktif (double-activation protection) (PASS, thow error BIN_ALREADY_ACTIVE)
- [x] Scan QR Code tidak terdaftar (404 Not Found) (PASS)
- [x] RW mark bin BROKEN -> status INACTIVE + audit trail (PASS, tercatat di AuditTrail)
- [x] Alur setoran normal (foto -> estimasi volume -> verifikasi -> simpan) (PASS)
- [x] Integrasi AI Deteksi gagal/timeout ditangani secara anggun (PASS)
- [x] Discrepancy handling (AI >= 90% vs Petugas manual) -> PENDING_REVIEW (PASS)
- [x] Proteksi ketidakcocokan kategori sampah dengan deteksi AI (PASS)
- [x] Kalkulasi avoided emisi CO2e (multiplier 0.05) (PASS, verified formula: `weight * 0.05`)
- [x] Cron job check shift pagi/sore (PASS)
- [x] Penalti KPI 15% jika tidak melapor saat shift (PASS)
- [x] WebSocket on-demand dispatch broadcast (radius 2KM) (PASS, Haversine formula)
- [x] Race condition task claim (concurrency locking FOR UPDATE) (PASS, verified database row lock)
- [x] Point multiplier dibaca dinamis dari DB dengan Redis cache + invalidasi (PASS)
- [x] Streak 5 hari setoran warga tambahan (+10 bonus) & auto-reset (PASS)
- [x] Submit Ide Daur Ulang -> RW approve -> +50 poin & Social Feed (PASS)
- [x] Peta GIS marker berwarna sesuai kategori + legenda (PASS)
- [x] Polygon warna heatmap kepatuhan sesuai RT/RW Compliance Score (PASS)
- [x] Rumah Maggot produksi (material in, maggot out) & distribusi peternakan (PASS)
- [x] Bank Sampah Ledger balance rupiah, riwayat transaksi JSON, balance check (PASS)
- [x] WhatsApp OTP login mock logger & database entry (PASS)
- [x] Alarm WhatsApp tong penuh & daily report (PASS)
- [x] Email laporan bulanan Camat/Lurah & ide daur ulang (PASS)
- [x] FCM push notifications (flash drop hour & badge unlock) (PASS)
- [x] NotificationLog pencatatan persisten (PASS)
- [x] Multi-axis Line Chart & Donat komposisi sampah (PASS)
- [x] Export CSV & PDF tabel breakdown (PASS)
- [x] Audit Trail log retrieval (Super Admin only) (PASS)
- [x] Social Feed stream real-time (PASS)

## Dari ui-redesign-tracker.md

- [ ] Implementasi Warna Global di `lib/core/app_colors.dart` & Tema Terpusat (Plus Jakarta Sans)
- [ ] Perbaikan **Splash Screen Stuck** (ditambahkan timeout 3 detik + auto navigate sesuai Auth state)
- [ ] Penggunaan **Logo Asli** (`assets/logo.png`) pada Splash Screen dan Login Screen
- [ ] **login_screen.dart** (Redesign form, logo asli, style input dan button, validasi & toast custom)
- [ ] **beranda_screen.dart** (Redesign dashboard warga, card poin/saldo/setoran dengan gaya card web)
- [ ] **scan_flow_screen.dart** (Redesign step-by-step UI deteksi sampah dan QR code bin)
- [ ] **poin_screen.dart** & **riwayat_screen.dart** (Redesign riwayat, list item, badge status, empty state)
- [ ] **profil_screen.dart** (Redesign avatar profil bulat dengan aksen web, edit profil form)
- [ ] **aktivasi_bin_screen.dart** & **reset_bin_screen.dart** (Redesign form & steps pengajuan)
- [ ] **main_shell.dart** (Redesign bottom navigation bar mengikuti gaya modern web)
- [ ] Gunakan variabel warna terpusat di semua widget (tidak ada warna hardcoded)
- [ ] Reusable Button Component untuk semua tombol primary/secondary
- [ ] Transisi antar halaman yang halus (page transition animation)

## Dari warga-tracker.md

- [x] Backend: Endpoint `POST /request-otp` dan `POST /verify-otp`.
- [x] Frontend: Update form login untuk Warga dengan menggunakan input `phone` berawalan +62.
- [ ] 3 opsi kapasitas (Sistem Default, Estimasi AI, Input Manual).
- [ ] Tampilkan status berbunyi jelas "Menunggu Persetujuan RW" pada UI warga, bukan aktif jika masih *pending*.
- [ ] Tombol "Tong Sampah Saya Penuh".
- [ ] Halaman / Modal *upload* foto bukti sebelum kirim (memicu `DispatchTask`).
- [ ] Halaman Riwayat yang menampilkan masa aktif tong sampah (30 hari dari aktivitas).
- [ ] Tampilkan UI pesan "Hubungi RW/Admin untuk aktivasi ulang" jika tong menjadi `INACTIVE`.
- [ ] Form pengajuan (Judul, Foto, Material).
- [ ] Endpoint pengajuan dan tampilan status pantau (Pending, Approved, Rejected).
- [ ] Skema database untuk menampung event Flash Drop.
- [ ] Kalender atau peta visual di frontend Warga yang menunjukkan jadwal jam bonus poin dan indikator visual keberhasilan partisipasi.
- [ ] Backend
- [ ] Frontend
- [ ] Verification

## Dari warga-ux-tracker.md

- [x] Kartu "Poin Saya": klik untuk membuka halaman detail riwayat poin (bukan hanya angka statis) — tampilkan breakdown poin harian/mingguan dari data asli backend.
- [x] Kartu "Saldo Rupiah" (jika ada konversi poin ke saldo, konfirmasikan sumber datanya ke backend — jika belum ada endpoint-nya, buat dulu): klik untuk membuka halaman detail saldo/riwayat konversi.
- [x] Kartu "Total Setoran": klik untuk membuka halaman riwayat semua setoran (waste logs) milik warga tersebut.
- [x] Tambahkan efek hover/tap (elevation/shadow berubah, cursor pointer) di semua kartu ini supaya terasa jelas bisa diklik — konsisten dengan gaya kartu di dashboard Admin.
- [x] Tambahkan loading skeleton saat data kartu sedang diambil, dan empty state yang rapi jika data belum ada (misal warga baru belum pernah setor).
- [x] UI saat ini terlalu basic/polos — redesign dengan tampilan modern clean look, konsisten dengan tema warna project (hijau organik/biru non-organik), tombol dengan style jelas (primary/secondary), spacing rapi, dan micro-interaction (animasi transisi antar step: ambil foto -> hasil deteksi -> scan QR bin).
- [x] BUG PENTING: fitur ambil foto saat ini malah membuka file picker laptop/galeri, BUKAN mengakses kamera perangkat langsung — perbaiki agar benar-benar membuka kamera device (gunakan getUserMedia untuk web, atau image_picker dengan source kamera untuk Flutter).
- [x] Tambahkan permintaan izin akses kamera yang eksplisit: saat pertama kali fitur ini dibuka, browser/device harus menampilkan popup izin kamera; tangani 3 kondisi:
- [x] Tampilkan live preview kamera dengan overlay bingkai (guide frame) untuk membantu user memposisikan sampah saat difoto, plus tombol capture yang jelas (ikon shutter kamera).
- [x] Setelah foto diambil: tampilkan preview hasil foto dengan opsi "Pakai Foto Ini" atau "Ambil Ulang" sebelum benar-benar dikirim ke backend/AI.
- [x] Pastikan seluruh alur (foto -> kirim ke backend -> deteksi AI -> tampilkan hasil -> arahkan scan QR bin -> validasi -> simpan) benar-benar fetch API asli sesuai dokumentasi sebelumnya (request_id, kompresi foto maks 1MB, timeout 2000ms, Detection Token, dst) — TIDAK ADA lagi simulasi/data dummy di alur ini.
- [x] Tampilkan status loading yang jelas dan menarik (bukan spinner polos) selama menunggu hasil deteksi AI, termasuk indikator sisa kuota Token Request jika relevan.
- [x] Riwayat lengkap aktivitas setor sampah (list + filter tanggal/jenis sampah), fetch dari backend.
- [x] Status kapasitas tong milik warga tersebut (organik & non-organik) ditampilkan jelas dengan progress bar (liter terisi / kapasitas maksimum).
- [x] Notifikasi personal untuk warga (contoh: status pengajuan pengosongan tong, poin baru masuk) — fetch dari backend, bukan dummy.
- [x] Halaman profil warga menampilkan info rumah tangga (alamat, RT/RW) dan riwayat aktivitas terbaru dalam satu tampilan ringkas yang enak dilihat.

# REKAP ITEM BELUM SELESAI (TODO)

**[bugfix-tracker.md]** (HALAMAN KATEGORI SAMPAH)
- [ ] Navbar aman, tidak ada perubahan diperlukan di bagian ini untuk saat ini.

**[github-trello-automation-tracker.md]** (LANGKAH 0 — SETUP BOARD TRELLO TERPUSAT)
- [ ] Aktifkan Trello Butler di board ini untuk 2 aturan dasar:

**[github-trello-automation-tracker.md]** (LANGKAH 0 — SETUP BOARD TRELLO TERPUSAT)
  - [ ] Rule A: kalau SEMUA item checklist di card sudah dicentang → otomatis pindahkan card ke list "Done" + tambah label hijau "Completed"

**[github-trello-automation-tracker.md]** (LANGKAH 0 — SETUP BOARD TRELLO TERPUSAT)
  - [ ] Rule B: kalau card dipindah manual ke list "In Progress" → otomatis tambahkan comment timestamp "Started: {date}"

**[github-trello-automation-tracker.md]** (LANGKAH 5 — END-TO-END TEST)
- [ ] Buat 1 commit dummy di repo BE+FE dengan format `refs` yang benar → verifikasi card muncul di Trello dengan label & deskripsi lengkap

**[github-trello-automation-tracker.md]** (LANGKAH 5 — END-TO-END TEST)
- [ ] Buat commit dummy Mobile dengan label "Mobile" → verifikasi label Mobile muncul

**[github-trello-automation-tracker.md]** (LANGKAH 5 — END-TO-END TEST)
- [ ] Buat commit penutup dengan kata kunci `done` → verifikasi checklist tercentang semua

**[github-trello-automation-tracker.md]** (LANGKAH 5 — END-TO-END TEST)
- [ ] Konfirmasi job Trello sync tidak memblokir auto-deploy ke VPS

**[kkn-tracker.md]** (1. ALUR SCAN QR & REGISTRASI WARGA)
- [ ] Implementasi klaim awal QR: Mahasiswa wajib memindai QR (status awal `PRINTED`) lalu merekam GPS. Status berubah jadi `ASSIGNED_TO_PIC` atas nama mahasiswa tersebut.

**[kkn-tracker.md]** (1. ALUR SCAN QR & REGISTRASI WARGA)
- [ ] Implementasi form bantu registrasi warga: Dari QR yang sudah `ASSIGNED_TO_PIC`, data warga dimasukkan. Status berubah menjadi `PENDING_APPROVAL` (menunggu RW).

**[kkn-tracker.md]** (1. ALUR SCAN QR & REGISTRASI WARGA)
- [ ] Indikator status dampingan jelas: Di list aplikasi mahasiswa, tampil status "Menunggu Approval RW" vs "Aktif".

**[kkn-tracker.md]** (1. ALUR SCAN QR & REGISTRASI WARGA)
- [ ] Input 3 opsi kapasitas tong saat pendaftaran:

**[kkn-tracker.md]** (2. NOTIFIKASI & POIN)
- [ ] Saat RW memverifikasi aktivasi bin warga, mahasiswa penerima (PIC) mendapatkan notifikasi in-app: "Registrasi [Nama Warga] berhasil diaktivasi, kamu dapat +10 poin". (Poin sudah di-handle di `rwService.ts`, tinggal implementasi notifikasi push/in-app).

**[kkn-tracker.md]** (3. FITUR HANDOVER (SERAH TERIMA PIC))
- [ ] Form handover dari PIC mahasiswa lama ke mahasiswa baru.

**[kkn-tracker.md]** (3. FITUR HANDOVER (SERAH TERIMA PIC))
- [ ] Transfer warga dan wilayah tugas di-record ke dalam tabel histori (`kkn_handover_history`).

**[kkn-tracker.md]** (4. BANTU INPUT FASILITAS GIS)
- [ ] Form input fasilitas GIS (Bata Terawang, Loseda, Rumah Maggot, Bank Sampah, ternak).

**[kkn-tracker.md]** (4. BANTU INPUT FASILITAS GIS)
- [ ] Bisa upload dokumentasi pendukung (foto/pdf).

**[master-tracker.md]** (Bagian 2 — Perubahan Database & Migrasi (Batch 1))
- [ ] Database - Uji coba migration rollback (down) secara lokal untuk memastikan keandalan migrasi

**[master-tracker.md]** (Bagian 2 — Perubahan Database & Migrasi (Batch 1))
- [ ] Database - Lakukan backup database production sebelum eksekusi migrasi di server

**[master-tracker.md]** (3.1 IAM 8-Role (Batch 1))
- [ ] FE - Buat halaman login dan register dinamis menyesuaikan tipe akun (Role-based UI flow)

**[master-tracker.md]** (3.1 IAM 8-Role (Batch 1))
- [ ] Mobile - Hubungkan antarmuka login dan register ke API backend menggunakan JWT & Secure Storage

**[master-tracker.md]** (3.2 QR/Bin State Machine (Batch 1))
- [ ] BE - Buat audit trail otomatis setiap terjadi transisi status QR Code

**[master-tracker.md]** (3.2 QR/Bin State Machine (Batch 1))
- [ ] BE - Hubungkan AI volume estimation endpoint untuk estimasi volume tong (P x L x T) dari foto saat registrasi

**[master-tracker.md]** (3.2 QR/Bin State Machine (Batch 1))
- [ ] BE - Buat endpoint bagi RW untuk menandai tong sampah sebagai BROKEN (otomatis transisi ke INACTIVE)

**[master-tracker.md]** (3.2 QR/Bin State Machine (Batch 1))
- [ ] BE - Buat endpoint pengajuan penggantian tong sampah rusak oleh Warga ke RW/Admin DLH

**[master-tracker.md]** (3.2 QR/Bin State Machine (Batch 1))
- [ ] FE - Buat panel Admin DLH untuk generate dan assign batch QR ke Mahasiswa KKN

**[master-tracker.md]** (3.2 QR/Bin State Machine (Batch 1))
- [ ] FE/Mobile - Buat alur form pengajuan penggantian tong rusak bagi Warga/RW

**[master-tracker.md]** (3.8 Rule Engine (Batch 1))
- [ ] FE - Buat halaman panel admin Rule Engine (Super Admin & Admin DLH) untuk CRUD parameter bisnis secara dinamis

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] BE - Buat Cron job untuk memicu window pelaporan Petugas Residu pukul 06:00-08:00 dan 16:00-18:00

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] BE - Implementasikan potongan skor KPI 15% otomatis jika Petugas telat atau tidak melaporkan di dalam window

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] BE - Buat WebSocket server untuk sistem dispatch on-demand tong penuh (>80%)

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] BE - Implementasikan broadcast dispatch ke seluruh Petugas Residu dalam radius 2 KM (Haversine formula)

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] BE - Buat endpoint/WebSocket event "Terima Tugas" tercepat (concurrency safe)

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] BE - Lakukan re-optimasi rute penjemputan dinamis setelah tugas diclaim oleh petugas

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] FE - Tambahkan visualisasi status penjemputan petugas pada peta monitoring

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] Mobile - Integrasikan WebSocket client pada aplikasi Petugas Residu untuk menerima broadcast dispatch secara real-time

**[master-tracker.md]** (3.3 Fleet Management (Batch 2))
- [ ] Mobile - Desain UI claim tugas "Terima Tugas" tercepat dengan kalkulasi rute navigasi GPS ke lokasi bin

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] BE - Implementasikan endpoint discrepancy check: bandingkan input manual Petugas vs klasifikasi AI

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] BE - Buat status PENDING_REVIEW jika ada ketidaksesuaian klasifikasi dan confidence AI > 90%

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] BE - Buat endpoint bagi Admin DLH untuk mengaudit/memvalidasi laporan berstatus PENDING_REVIEW

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] BE - Implementasikan kalkulator skor kepatuhan warga (Compliance Score) berbasis formula On-Time Rate & AI Accuracy

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] BE - Buat kalkulator emisi gas rumah kaca yang dihindari (CO2e avoided) dari berat organik komposter/maggot (*0.05)

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] BE - Buat endpoint bagi Petugas Residu untuk submit laporan aktual (timbangan, foto, klasifikasi manual, GPS)

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] FE - Buat halaman audit discrepancy bagi Admin DLH untuk memproses laporan PENDING_REVIEW

**[master-tracker.md]** (3.4 AI Deteksi & Emisi (Batch 2))
- [ ] Mobile - Hubungkan form input setoran sampah Petugas Residu ke endpoint laporan aktual backend

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Implementasikan ledger poin terpisah per dimensi (Reduksi Tonase, Partisipasi Streak, Ide Daur Ulang)

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Buat tracker streak 5 hari berturut-turut setoran tepat waktu untuk bonus +10 poin Warga Tambahan

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Buat endpoint pengajuan ide daur ulang oleh warga (upload foto, deskripsi, material)

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Buat endpoint persetujuan ide daur ulang oleh RW (sekaligus memicu penambahan +50 poin)

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Buat service poin KPI Petugas Residu (poin dari presisi laporan & ketepatan waktu)

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Buat service poin Mahasiswa KKN (poin dari pendampingan rumah tangga aktif & growth compliance rate)

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] BE - Buat logic agregasi poin wilayah (RT, RW, Kelurahan, Kecamatan) sebagai data virtual (read-only)

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] FE - Buat leaderboard gamifikasi berjenjang berdasarkan agregasi wilayah dan individu warga

**[master-tracker.md]** (3.5 Gamifikasi 3D (Batch 2))
- [ ] FE/Mobile - Buat antarmuka pengajuan ide daur ulang (Warga) dan persetujuan ide daur ulang (RW)

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] FE - Integrasikan peta Leaflet.js dengan kustomisasi marker (Loseda/Maggot=Hijau, Bank Sampah=Biru, TPS=Merah, Flash Drop=Emas)

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] FE - Buat komponen legenda peta interaktif sesuai kategori fasilitas

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] FE - Buat form GIS untuk input data fasilitas baru (oleh Mahasiswa KKN atau RW)

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] BE - Buat endpoint manajemen fasilitas dan pencatatan produksi Rumah Maggot (Material masuk vs output panen)

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] BE - Buat log distribusi produk maggot ke peternakan terdaftar

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] BE - Buat model data dan CRUD untuk entitas peternakan penerima distribusi (populasi & hasil panen)

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] BE - Buat model dan endpoint Bank Sampah Ledger untuk pencatatan saldo rupiah warga dari penjualan anorganik

**[master-tracker.md]** (3.6 GIS & Fasilitas (Batch 3))
- [ ] FE - Buat UI Bank Sampah Ledger untuk melihat saldo rupiah, riwayat transaksi, dan penarikan tunai warga

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Buat provider-agnostic interface untuk layanan WhatsApp (Wablas/Fonnte)

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Implementasikan pengiriman OTP Login Warga via WhatsApp

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Implementasikan push alarm WhatsApp untuk notifikasi "Tong Penuh" ke Petugas Residu terdekat

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Implementasikan pengiriman daily report kepatuhan wilayah ke WhatsApp RW jika kepatuhan menurun

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Integrasikan SendGrid SMTP untuk pengiriman laporan PDF bulanan otomatis ke Camat & Lurah

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Implementasikan pengiriman email SendGrid untuk konfirmasi penerimaan Ide Daur Ulang

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Konfigurasikan Firebase Cloud Messaging (FCM) SDK di backend

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Implementasikan trigger push notification FCM saat event "Flash Drop Hour" aktif

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] BE - Implementasikan trigger push notification FCM saat warga berhasil meng-unlock Badge Gamifikasi baru

**[master-tracker.md]** (3.7 Notifikasi (Batch 3))
- [ ] FE/Mobile - Implementasikan receiver token FCM dan penanganan notifikasi in-app

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Buat Multi-axis Line Chart gabungan tren mingguan (Organik, Non-Organik, Residu) berlabel satuan kg

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Tambahkan fitur toggle filter untuk memecah bagan multi-axis menjadi bagan kategori individual

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Buat chart donat komposisi sampah disertai tombol detail breakdown per RT/RW

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Implementasikan fitur export CSV dan PDF untuk tabel breakdown komposisi sampah

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Buat visualisasi Heatmap kepatuhan pada peta GIS berbasis polygon RT/RW sewarna skor kepatuhannya

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] BE - Buat sistem logging Audit Trail untuk melacak perubahan data oleh admin (Super Admin only view)

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] BE - Buat sistem logging Social Feed untuk menampilkan stream aktivitas positif publik secara real-time

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Tampilkan feed aktivitas publik di Dashboard Warga

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Buat fitur download panduan pemilahan sampah PDF statis yang diunggah oleh Admin DLH

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Hapus card "Tempat Sampah QR" dari Dashboard Utama dan pindahkan ke halaman Manajemen Tempat Sampah

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Hapus panel "Manajemen Pengguna" dari Dashboard Poin Warga

**[master-tracker.md]** (3.9 Dashboard & Logging (Batch 4))
- [ ] FE - Ganti tombol "Hubungi RT" menjadi "Hubungi Petugas" yang memicu dispatch darurat & marker di peta petugas

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Hapus seluruh fallback dummy/mock data pada `mobile/lib/config/app_config.dart`

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Hapus file dummy `mobile/lib/data/mock/mock_data.dart`

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Hubungkan layer repository auth ke API backend (`api_auth_repository.dart`) dengan JWT token rotation

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Hubungkan layer repository bin ke API backend (`api_bin_repository.dart`) untuk monitoring kapasitas riil

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Hubungkan riwayat setoran sampah ke API backend menggunakan `api_waste_log_repository.dart`

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Uji sinkronisasi WebSocket untuk dispatch on-demand dari sisi aplikasi mobile Petugas Residu

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Mobile - Uji integrasi scan QR Code dan kirim payload registrasi bin beserta foto estimasi volume AI ke backend

**[master-tracker.md]** (3.10 Mobile & Web Sinkronisasi (Batch 4))
- [ ] Sistem - Jalankan end-to-end integration testing antara Backend, Web Frontend, dan Mobile App secara penuh

**[progress-tracker.md]** (Mobile (Flutter))
- [ ] `mobile/lib/config/app_config.dart` — Terdapat konfigurasi fallback dummy (`mockHouseholdId`, `mockUserId`) yang harus disambungkan ke auth state real.

**[progress-tracker.md]** (Mobile (Flutter))
- [ ] `mobile/lib/data/mock/mock_data.dart` — Sumber utama data simulasi untuk aplikasi mobile, harus digantikan endpoint HTTP.

**[progress-tracker.md]** (Mobile (Flutter))
- [ ] `mobile/lib/data/repositories/mock_auth_repository.dart` — Implementasi login dan sesi masih menggunakan credentials dummy. Perlu diganti implementasi HTTP nyata (`api_auth_repository`).

**[progress-tracker.md]** (Mobile (Flutter))
- [ ] `mobile/lib/data/repositories/mock_bin_repository.dart` — Semua data bin, fetch bin, pengajuan, dan deteksi AI disimulasikan lokal. Perlu diganti implementasi HTTP nyata (`api_bin_repository`).

**[progress-tracker.md]** (Mobile (Flutter))
- [ ] `mobile/lib/data/repositories/mock_waste_log_repository.dart` — Riwayat transaksi setor sampah (waste logs) berjalan lokal tanpa fetch API server. Perlu diganti implementasi HTTP nyata.

**[progress-tracker.md]** (Mobile (Flutter))
- [ ] Konfigurasi Mobile API — Provider/Dependencies di mobile (Riverpod/Provider) harus di-switch agar menggunakan implementasi Repository HTTP (API), bukan lagi Mock Repository.

**[revisi-trashcare-tracker.md]** (1. BRANDING & INFRASTRUKTUR)
- [ ] Ganti nama aplikasi & semua referensi teks dari "Pilah Sampah Cerdas" menjadi "TrashCare" di seluruh web & mobile.

**[revisi-trashcare-tracker.md]** (1. BRANDING & INFRASTRUKTUR)
- [ ] Pasang logo baru TrashCare (asset sudah ada, minta filenya) di header/navbar/splash screen/favicon.

**[revisi-trashcare-tracker.md]** (1. BRANDING & INFRASTRUKTUR)
- [ ] Tambahkan halaman/section "Tentang Aplikasi" menampilkan: nama aplikasi (TrashCare), versi (mulai 1.0.0 saat rilis — siapkan konstanta versi terpusat, jangan hardcode di banyak tempat), logo.

**[revisi-trashcare-tracker.md]** (1. BRANDING & INFRASTRUKTUR)
- [ ] Hosting tetap di VPS existing, tidak perlu migrasi.

**[revisi-trashcare-tracker.md]** (2. PENAMAAN DATABASE — BAHASA INDONESIA BAKU (KBBI))
- [ ] Audit SEMUA nama tabel & kolom database, buat migration untuk rename ke Bahasa Indonesia baku sesuai KBBI.

**[revisi-trashcare-tracker.md]** (2. PENAMAAN DATABASE — BAHASA INDONESIA BAKU (KBBI))
- [ ] Buat dokumen mapping-nama-tabel.md berisi nama lama -> nama baru untuk semua tabel/kolom yang diubah.

**[revisi-trashcare-tracker.md]** (2. PENAMAAN DATABASE — BAHASA INDONESIA BAKU (KBBI))
- [ ] Migration WAJIB reversible, backup database dulu sebelum eksekusi.

**[revisi-trashcare-tracker.md]** (3. BERAT SAMPAH — DUA MEKANISME BERBEDA (WAJIB DIBEDAKAN))
- [ ] WARGA: tetap pakai foto -> AI deteksi -> hasil berat (kg) + klasifikasi organik/anorganik.

**[revisi-trashcare-tracker.md]** (3. BERAT SAMPAH — DUA MEKANISME BERBEDA (WAJIB DIBEDAKAN))
- [ ] PETUGAS RESIDU: TIDAK pakai AI — pakai timbangan IoT (manual input) + WAJIB foto dokumentasi.

**[revisi-trashcare-tracker.md]** (3. BERAT SAMPAH — DUA MEKANISME BERBEDA (WAJIB DIBEDAKAN))
- [ ] AI Warga WAJIB mendukung deteksi CAMPURAN dalam satu foto (hasil deteksi berupa breakdown per kategori dalam satu response).

**[revisi-trashcare-tracker.md]** (4. QR CODE — FORMAT & ALUR)
- [ ] Format QR: `[JENIS][NNNN][TAHUN]` (lanjutkan nomor urut existing, unique constraint).

**[revisi-trashcare-tracker.md]** (4. QR CODE — FORMAT & ALUR)
- [ ] State machine QR TETAP ADA (PRINTED -> ASSIGNED_TO_PIC -> ACTIVE -> NONAKTIF/BROKEN) dan approval RW.

**[revisi-trashcare-tracker.md]** (4. QR CODE — FORMAT & ALUR)
- [ ] Alur baru: Warga & Mahasiswa punya akun terpisah -> Mahasiswa bantu Warga aktivasi (scan 2 QR) -> RW approve -> kepemilikan tercatat, catat `dibantu_oleh_mahasiswa_id`.

**[revisi-trashcare-tracker.md]** (4. QR CODE — FORMAT & ALUR)
- [ ] Peta GIS: 2 tong (organik+anorganik) milik satu RT digabung jadi SATU marker.

**[revisi-trashcare-tracker.md]** (4. QR CODE — FORMAT & ALUR)
- [ ] Dokumentasi foto tong: diambil rutin saat buang sampah.

**[revisi-trashcare-tracker.md]** (4. QR CODE — FORMAT & ALUR)
- [ ] Kapasitas tong: ubah manual WAJIB pakai foto bukti.

**[revisi-trashcare-tracker.md]** (5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY)
- [ ] Tambah role RT (read-only scope RT).

**[revisi-trashcare-tracker.md]** (5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY)
- [ ] RW melihat scope RT dan warganya.

**[revisi-trashcare-tracker.md]** (5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY)
- [ ] Kelurahan ambil data agregat dari RW + Warga & Petugas Residu.

**[revisi-trashcare-tracker.md]** (5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY)
- [ ] Validasi: 1 RW WAJIB punya 1 Petugas Residu.

**[revisi-trashcare-tracker.md]** (5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY)
- [ ] UI Super Admin: hapus widget tidak penting.

**[revisi-trashcare-tracker.md]** (5. ROLE & HIERARKI — TAMBAH ROLE RT, SEDERHANAKAN UI MONITORING-ONLY)
- [ ] UI Admin DLH, Camat, Kelurahan: Sembunyikan total semua CRUD, hanya grafik dan monitoring.

**[revisi-trashcare-tracker.md]** (6. GAMIFIKASI — FORMULA & PENALTY DIPERBARUI)
- [ ] Formula poin: `confidence x poin_basic(10)`, dihitung terpisah per kategori jika campuran, akumulasi ke total.

**[revisi-trashcare-tracker.md]** (6. GAMIFIKASI — FORMULA & PENALTY DIPERBARUI)
- [ ] Misi jam 06-08 & 16-18 (luar jam tetap dapat poin dasar tanpa bonus).

**[revisi-trashcare-tracker.md]** (6. GAMIFIKASI — FORMULA & PENALTY DIPERBARUI)
- [ ] Penalty: -1 poin/hari berturut, floor di 0.

**[revisi-trashcare-tracker.md]** (6. GAMIFIKASI — FORMULA & PENALTY DIPERBARUI)
- [ ] Motivasi/kondisi: rule-based template (if streak > X hari), simpan di DB.

**[revisi-trashcare-tracker.md]** (6. GAMIFIKASI — FORMULA & PENALTY DIPERBARUI)
- [ ] Fase Mahasiswa: Threshold aktif vs reminder (satuan hari/bulan per mahasiswa), beralih fungsi notifikasi otomatis.

**[revisi-trashcare-tracker.md]** (7. PETUGAS RESIDU — ALUR KERJA LAPANGAN)
- [ ] Rute bebas (tidak diatur sistem).

**[revisi-trashcare-tracker.md]** (7. PETUGAS RESIDU — ALUR KERJA LAPANGAN)
- [ ] Setiap pengambilan: foto dokumentasi + hasil timbang (manual).

**[revisi-trashcare-tracker.md]** (7. PETUGAS RESIDU — ALUR KERJA LAPANGAN)
- [ ] Kategori residu: 1 kategori umum "Residu".

**[revisi-trashcare-tracker.md]** (7. PETUGAS RESIDU — ALUR KERJA LAPANGAN)
- [ ] Grafik tren volume residu.

**[revisi-trashcare-tracker.md]** (8. DASHBOARD — DISEDERHANAKAN)
- [ ] Hapus peta dari dashboard (pindah ke GIS).

**[revisi-trashcare-tracker.md]** (8. DASHBOARD — DISEDERHANAKAN)
- [ ] Hapus widget "Aktivitas Terbaru" (pindah ke Log Aktivitas).

**[revisi-trashcare-tracker.md]** (8. DASHBOARD — DISEDERHANAKAN)
- [ ] Dashboard utama hanya: grafik komposisi sampah, tren setoran, kepatuhan wilayah, performa.

**[revisi-trashcare-tracker.md]** (8. DASHBOARD — DISEDERHANAKAN)
- [ ] Bar Chart Race untuk grafik balapan real-time.

**[revisi-trashcare-tracker.md]** (8. DASHBOARD — DISEDERHANAKAN)
- [ ] Aktor dievaluasi: Warga, Petugas Residu, RT, RW.

**[revisi-trashcare-tracker.md]** (8. DASHBOARD — DISEDERHANAKAN)
- [ ] Rekap Setoran: data default scope login, fungsi filter untuk export dan grouping kohort.

**[revisi-trashcare-tracker.md]** (9. GIS — PETA BERJENJANG 3 LEVEL ZOOM)
- [ ] Halaman GIS terpisah. Level 1 (Kelurahan), Level 2 (RW), Level 3 (RT & titik individu gabungan 2 bin).

**[revisi-trashcare-tracker.md]** (9. GIS — PETA BERJENJANG 3 LEVEL ZOOM)
- [ ] Setiap level tampilkan grafik performa samping peta, animasi halus.

**[revisi-trashcare-tracker.md]** (10. KATEGORI SAMPAH — HALAMAN PANDUAN BARU)
- [ ] Halaman "Panduan Kategori Sampah" (terpisah dari AI scan) dengan contoh foto.

**[revisi-trashcare-tracker.md]** (10. KATEGORI SAMPAH — HALAMAN PANDUAN BARU)
- [ ] Struktur data tabel kategori (dengan `url_foto_contoh`) edit via admin.

**[revisi-trashcare-tracker.md]** (STANDAR UI)
- [ ] Modern, clean, minim.

**[revisi-trashcare-tracker.md]** (STANDAR UI)
- [ ] Konsisten dengan design system (Lucide, warna hijau/biru).

**[revisi-trashcare-tracker.md]** (STANDAR UI)
- [ ] Tetap loading/error state via API asli.

**[rw-tracker.md]** (1. DASHBOARD WILAYAH RW)
- [ ] Analitik dan peta GIS ter-scope hanya untuk wilayah RW bersangkutan.

**[rw-tracker.md]** (1. DASHBOARD WILAYAH RW)
- [ ] Akses interaktif (bukan sekadar read-only seperti Camat/Lurah).

**[rw-tracker.md]** (2. APPROVAL AKTIVASI QR BIN WARGA)
- [ ] Halaman daftar bin berstatus `PENDING_APPROVAL` di wilayahnya.

**[rw-tracker.md]** (2. APPROVAL AKTIVASI QR BIN WARGA)
- [ ] Menampilkan detail: data warga, foto tong, hasil cek Master QR DB, GPS lokasi, mahasiswa pendamping.

**[rw-tracker.md]** (2. APPROVAL AKTIVASI QR BIN WARGA)
- [ ] Tombol Setujui -> Ubah status menjadi `ACTIVE_BOUND`.

**[rw-tracker.md]** (2. APPROVAL AKTIVASI QR BIN WARGA)
- [ ] Trigger otomatis penambahan +10 poin untuk Warga dan +10 poin untuk Mahasiswa KKN.

**[rw-tracker.md]** (2. APPROVAL AKTIVASI QR BIN WARGA)
- [ ] Tombol Tolak -> Form alasan penolakan dan notifikasi balik ke warga/mahasiswa.

**[rw-tracker.md]** (3. VERIFIKASI AKUN PETUGAS RESIDU)
- [ ] Halaman daftar Petugas Residu berstatus PENDING di wilayahnya.

**[rw-tracker.md]** (3. VERIFIKASI AKUN PETUGAS RESIDU)
- [ ] Fitur Setujui / Tolak akun Petugas Residu.

**[rw-tracker.md]** (4. NOTIFIKASI TONG PENUH & RADAR PETA)
- [ ] Menerima push notifikasi real-time saat warga menandai tong penuh beserta foto bukti.

**[rw-tracker.md]** (4. NOTIFIKASI TONG PENUH & RADAR PETA)
- [ ] Peta wilayah menampilkan radar merah pada lokasi tong yang penuh.

**[rw-tracker.md]** (4. NOTIFIKASI TONG PENUH & RADAR PETA)
- [ ] Memantau status penanganan tong penuh (sudah diambil/belum) beserta foto dokumentasi.

**[rw-tracker.md]** (5. STATUS BIN TIDAK AKTIF (READ-ONLY))
- [ ] Halaman daftar bin dengan status `INACTIVE` (30 hari tanpa aktivitas).

**[rw-tracker.md]** (5. STATUS BIN TIDAK AKTIF (READ-ONLY))
- [ ] Hanya akses Read-Only, tanpa tombol aktivasi (karena merupakan wewenang Super Admin / Warga mengajukan aktivasi ulang).

**[rw-tracker.md]** (5. STATUS BIN TIDAK AKTIF (READ-ONLY))
- [ ] Fitur menambahkan catatan/komentar opsional untuk diteruskan ke Super Admin.

**[rw-tracker.md]** (6. UBAH STATUS BIN RUSAK)
- [ ] Fitur untuk menandai bin sebagai `BROKEN` (rusak/hilang fisik).

**[rw-tracker.md]** (6. UBAH STATUS BIN RUSAK)
- [ ] Perubahan status ini membuat QR menjadi inaktif secara permanen dan tercatat dalam Audit Trail.

**[rw-tracker.md]** (7. APPROVAL IDE DAUR ULANG & FASILITAS)
- [ ] Halaman daftar pengajuan Ide Daur Ulang (judul, foto, material).

**[rw-tracker.md]** (7. APPROVAL IDE DAUR ULANG & FASILITAS)
- [ ] Tombol Setujui (+50 poin ke warga, tampil di Social Feed) atau Tolak.

**[rw-tracker.md]** (7. APPROVAL IDE DAUR ULANG & FASILITAS)
- [ ] Halaman approval pendaftaran fasilitas lingkungan (Rumah Maggot, Bank Sampah, dll).

**[rw-tracker.md]** (8. INPUT/MONITORING DATA FASILITAS)
- [ ] Form input manual data produksi mingguan fasilitas (material masuk, output panen).

**[rw-tracker.md]** (8. INPUT/MONITORING DATA FASILITAS)
- [ ] Rekapitulasi monitoring seluruh fasilitas di wilayah RW tersebut.

**[ui-redesign-tracker.md]** (1. Setup & Bug Kritis)
- [ ] Implementasi Warna Global di `lib/core/app_colors.dart` & Tema Terpusat (Plus Jakarta Sans)

**[ui-redesign-tracker.md]** (1. Setup & Bug Kritis)
- [ ] Perbaikan **Splash Screen Stuck** (ditambahkan timeout 3 detik + auto navigate sesuai Auth state)

**[ui-redesign-tracker.md]** (1. Setup & Bug Kritis)
- [ ] Penggunaan **Logo Asli** (`assets/logo.png`) pada Splash Screen dan Login Screen

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **login_screen.dart** (Redesign form, logo asli, style input dan button, validasi & toast custom)

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **beranda_screen.dart** (Redesign dashboard warga, card poin/saldo/setoran dengan gaya card web)

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **scan_flow_screen.dart** (Redesign step-by-step UI deteksi sampah dan QR code bin)

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **poin_screen.dart** & **riwayat_screen.dart** (Redesign riwayat, list item, badge status, empty state)

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **profil_screen.dart** (Redesign avatar profil bulat dengan aksen web, edit profil form)

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **aktivasi_bin_screen.dart** & **reset_bin_screen.dart** (Redesign form & steps pengajuan)

**[ui-redesign-tracker.md]** (2. Redesign Layar Mobile (Visual Redesign))
- [ ] **main_shell.dart** (Redesign bottom navigation bar mengikuti gaya modern web)

**[ui-redesign-tracker.md]** (3. Konsistensi Global & Transisi)
- [ ] Gunakan variabel warna terpusat di semua widget (tidak ada warna hardcoded)

**[ui-redesign-tracker.md]** (3. Konsistensi Global & Transisi)
- [ ] Reusable Button Component untuk semua tombol primary/secondary

**[ui-redesign-tracker.md]** (3. Konsistensi Global & Transisi)
- [ ] Transisi antar halaman yang halus (page transition animation)

**[warga-tracker.md]** (2. REGISTRASI TONG SAMPAH)
- [ ] 3 opsi kapasitas (Sistem Default, Estimasi AI, Input Manual).

**[warga-tracker.md]** (2. REGISTRASI TONG SAMPAH)
- [ ] Tampilkan status berbunyi jelas "Menunggu Persetujuan RW" pada UI warga, bukan aktif jika masih *pending*.

**[warga-tracker.md]** (3. LAPOR TONG PENUH)
- [ ] Tombol "Tong Sampah Saya Penuh".

**[warga-tracker.md]** (3. LAPOR TONG PENUH)
- [ ] Halaman / Modal *upload* foto bukti sebelum kirim (memicu `DispatchTask`).

**[warga-tracker.md]** (4. STATUS BIN & RIWAYAT)
- [ ] Halaman Riwayat yang menampilkan masa aktif tong sampah (30 hari dari aktivitas).

**[warga-tracker.md]** (4. STATUS BIN & RIWAYAT)
- [ ] Tampilkan UI pesan "Hubungi RW/Admin untuk aktivasi ulang" jika tong menjadi `INACTIVE`.

**[warga-tracker.md]** (5. IDE DAUR ULANG)
- [ ] Form pengajuan (Judul, Foto, Material).

**[warga-tracker.md]** (5. IDE DAUR ULANG)
- [ ] Endpoint pengajuan dan tampilan status pantau (Pending, Approved, Rejected).

**[warga-tracker.md]** (6. FLASH DROP (EVENT CALENDAR/MAP))
- [ ] Skema database untuk menampung event Flash Drop.

**[warga-tracker.md]** (6. FLASH DROP (EVENT CALENDAR/MAP))
- [ ] Kalender atau peta visual di frontend Warga yang menunjukkan jadwal jam bonus poin dan indikator visual keberhasilan partisipasi.

**[warga-tracker.md]** (Status Eksekusi)
- [ ] Backend

**[warga-tracker.md]** (Status Eksekusi)
- [ ] Frontend

**[warga-tracker.md]** (Status Eksekusi)
- [ ] Verification

