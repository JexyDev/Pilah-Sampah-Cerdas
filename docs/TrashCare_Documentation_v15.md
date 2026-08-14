# **TrashCare** 

Dokumentasi Sistem — Role Mapping, Fitur, Entitas & Alur End-to-End 

_Versi Dokumen 2.0 — Agustus 2026 — Status: Dokumentasi Teknis Resmi_ 

##### **Ringkasan Eksekutif** 

TrashCare adalah platform pengelolaan sampah berbasis gamifikasi dengan tiga ekosistem peran yang saling terhubung: Warga (aktor utama penghasil poin melalui pemilahan sampah), Mahasiswa KKN (agen lapangan yang mengaktivasi & mendampingi warga binaan), dan Petugas Pemilahan (operator hilir yang menangani residu fisik dari bin warga yang penuh). 

Ketiga role membentuk siklus tertutup: Mahasiswa onboarding (aktivasi bin) warga → Warga membuang & mendapat poin → Bin penuh → Petugas Pemilahan mengangkut & mencatat berat → Data terakumulasi di sistem, dan mahasiswa memonitor kepatuhan warga secara berkelanjutan. 

## **1. Gambaran Besar Ekosistem** 

MAHASISWA KKN --(aktivasi bin warga yang sudah punya akun)-->  WARGA WARGA --(foto sampah -> AI deteksi -> scan QR bin)-->  BIN --(volume bertambah, +poin warga) BIN (penuh) --(warga ajukan reset)-->  notifikasi sistem 

PETUGAS PEMILAHAN --(warga ajukan reset -> datangi rumah -> timbang -> submit log)-->  BIN (direset) MAHASISWA KKN --(monitoring mingguan, edukasi jika compliance <80%)-->  WARGA 

Empat aturan kritis yang mengikat seluruh ekosistem: 

- Bin harus aktif (Organik + Non-Organik) sebelum warga bisa scan — diaktivasi mandiri atau oleh Mahasiswa KKN. 

- Poin hanya keluar jika 3 syarat terpenuhi sekaligus: jenis sampah cocok, GPS ≤ 10 meter dari bin, dan bin belum penuh (proyeksi volume tidak overflow). 

- Mahasiswa KKN tidak bisa mendaftarkan akun warga baru — warga mendaftar mandiri; tugas mahasiswa adalah 

   - mengaktivasi bin warga yang sudah terdaftar. 

- Petugas Pemilahan mendatangi rumah warga untuk menimbang & mencatat berat sampah asli setiap ada pengajuan pengosongan bin; submit hanya aktif pada window 06:00–08:00 dan 16:00–18:00. 

## **2. Role Mapping** 

### **2.1 Warga** 

Pemilik rumah dengan bin fisik. Aktor utama penghasil poin melalui pemilahan sampah. Satu akun mewakili satu rumah tangga. 

#### **Hak Akses & Batasan** 

|**Bisa Diakses**|**Tidak Bisa Diakses**|
|---|---|
|Dafar & aktvasi bin mandiri<br>• scan sampah (AI + QR bin)<br>• ajukan reset bin • riwayat<br>& saldo poin • leaderboard •<br>kelola profl|Data warga lain • dashboard Mahasiswa/Petugas • mengubah poin sendiri secara manual|



### **2.2 Mahasiswa KKN** 

Agen aktivasi lapangan dan supervisi. Bertugas di wilayah penugasan (kelurahan/RW spesifik) untuk mengaktivasi bin milik warga yang SUDAH memiliki akun, memonitor kepatuhan pemilahan warga binaan, melaporkan pemanfaatan sampah, dan mencatat kehadiran berbasis GPS. 

**Catatan penting:** Mahasiswa tidak bisa mendaftarkan/membuat akun warga baru. Warga mendaftar mandiri — tugas mahasiswa adalah mengaktivasi bin milik warga yang sudah terdaftar, sehingga warga bisa mulai scan sampah. 

#### **Tujuan Utama** 

|**Tujuan**|**Penjelasan**|
|---|---|
|Aktvasi Ekosistem|Mengaktvasi bin (organik + anorganik) milik warga yang sudah terdafar di wilayah penugasan|
|Akumulasi Poin KKN|Poin kontribusi dari tap warga yang berhasil diaktvasi & aktf memilah|
|Monitoring Kepatuhan|Melihat tngkat kesalahan pemilahan warga binaan (threshold <80% = perlu re-edukasi)|
|Absensi Kegiatan|Mencatat kehadiran berbasis GPS geofencing saat kegiatan KKN|
|Pelaporan Pemanfaatan|Submit laporan kegiatan pemanfaatan sampah (kompos, kerajinan) dengan bukt foto|



|**Tujuan**|**Penjelasan**|
|---|---|
|Pengajuan Izin|Mengajukan izin tdak hadir ke DPL dengan bukt dokumen|
|Monitoring Dampak<br>Kelurahan|Melihat statstk kondisi kelurahan wilayah penugasan (persentase rumah aktf memilah, total<br>volume sampah tercatat), dihitung otomats oleh sistem secara real-tme — read-only, tdak ada<br>input manual|



#### **Hak Akses & Batasan** 

|**Bisa Diakses**|**Tidak Bisa Diakses**|
|---|---|
|Dashboard KKN • cari &<br>aktvasi bin warga (scan QR +<br>GPS) • monitoring warga<br>binaan (read-only) • presensi<br>GPS • laporan pemanfaatan<br>sampah • pengajuan izin •<br>info kelompok & DPL •<br>riwayat kegiatan • lihat<br>Dashboard Kelurahan (read-<br>only)|Scan sampah untuk poin sendiri • mendafarkan akun warga baru • data warga di luar wilayah<br>penugasan • mengubah data pemilahan warga • ftur tmbangan residu • mengubah wilayah<br>penugasan sendiri|



### **2.3 Petugas Pemilahan** 

Operator lapangan yang menangani permintaan pengosongan tempat sampah warga. Ketika tong sampah digital warga mendekati penuh (volume 100%) dan warga mengajukan pengosongan, Petugas Pemilahan melihat permintaan tersebut di Jadwal Penjemputan, mendatangi rumah warga bersangkutan, menimbang sampah asli, memfoto bukti, lalu mencatat berat aslinya (kg) ke aplikasi. 

**Catatan penting:** Akun Petugas Pemilahan langsung aktif setelah registrasi, tanpa proses approval/whitelist admin. Begitu Petugas Pemilahan menekan tombol Submit, tong sampah digital milik warga kembali ke 0% (kosong), Petugas mendapat poin (poin gaji), dan warga bisa kembali membuang sampah. 

#### **Tujuan Utama** 

|**Tujuan**|**Penjelasan**|
|---|---|
|Manajemen Jadwal|Melihat Jadwal Penjemputan: dafar rumah warga yang mengajukan pengosongan bin (bin<br>sudah/mendekat 100%)|
|Submit Log Timbangan|Mencatat berat fsik residu yang diangkut (kg) + foto bukt|
|Akumulasi Poin Petugas|Poin dari setap log tmbangan yang berhasil disubmit|
|KPI Monitoring|Skor kinerja: ketepatan waktu (60%) + akurasi (40%)|
|Riwayat Aktvitas|Riwayat pengangkutan dengan flter tanggal & tpe|



#### **Hak Akses & Batasan** 

|**Bisa Diakses**|**Tidak Bisa Diakses**|
|---|---|
|Dashboard (KPI, statstk,<br>jadwal) • jadwal harian per<br>zona • submit tmbangan<br>(foto+berat+klasifkasi+GPS)<br>• riwayat log • poin &<br>statstk pribadi • notfkasi<br>khusus petugas|Fitur scan AI/warga • data detail warga • submit di luar window waktu • mengubah jadwal • ftur<br>KKN mahasiswa|



## **3. Alur Kerja (User Journey) per Role** 

### **3.1 Mahasiswa KKN** 

STEP 1 - Login & Orientasi Login No. HP+password -> validasi role -> Dashboard KKN 

STEP 2 - Aktivasi Bin Warga Cari warga terdaftar di wilayah tugas -> scan QR bin ORGANIK (GPS aktif) -> validasi (warga valid? bin belum aktif? mahasiswa di zona benar?) -> scan QR bin ANORGANIK -> backend ikat kedua bin ke household warga -> notifikasi ke warga -> poin kontribusi mahasiswa bertambah 

STEP 3 - Monitoring Warga Binaan Tab Monitoring -> lihat % pemilahan benar per warga -> flag correctPercentage < 80% ("Perlu Re-edukasi") -> edukasi lapangan 

STEP 4 - Presensi Kegiatan Pilih kegiatan -> tracking GPS real-time -> dalam radius zona -> countdown durasi minimum -> tombol Absen aktif -> check-in tercatat 

STEP 5 - Laporan Pemanfaatan Sampah Pilih jenis (Kompos/Kerajinan/Biogas) -> isi form + foto -> submit 

STEP 6 - Pengajuan Izin Pilih kategori -> upload bukti -> submit -> notifikasi ke DPL untuk approval 

STEP 7 - Lihat Dashboard Kelurahan (Read-Only) Kapan saja: buka Dashboard Kelurahan -> lihat statistik kondisi wilayah penugasan (dihitung otomatis backend dari aktivitas scan Warga secara real-time, tidak ada form input manual) 

### **3.2 Petugas Pemilahan** 

STEP 1 - Login 

Login phone+password -> validasi role PETUGAS_PEMILAHAN -> langsung akses penuh ke Dashboard (tanpa approval admin) 

STEP 2 - Review & Terima Pengajuan Dashboard: KPI score, total kg hari ini, sisa jadwal 

-> buka daftar pengajuan pengosongan bin berstatus PENDING di zona penugasan 

-> tap "Terima Tugas" pada satu pengajuan -> status jadi DIPROSES, masuk ke Jadwal Penjemputan Saya 

STEP 3 - Kunjungan & Pencatatan di Rumah Warga 

Datangi rumah warga dari tugas yang sudah diterima -> buka Timbangan Residu -> foto bukti -> timbang sampah asli -> input berat asli(kg) + klasifikasi (Non-B3/B3) -> aktifkan GPS -> Submit Log 

STEP 4 - Validasi & Konfirmasi Sistem 

Backend terima binId+berat+klasifikasi+foto+GPS -> bin warga direset ke 0% (kosong) -> notifikasi lokal ke petugas & warga -> poin (poin gaji) petugas bertambah -> warga bisa buang sampah lagi 

###### STEP 5 - Monitoring Riwayat 

Tab Riwayat -> filter Hari Ini/Minggu/Bulan, tipe sampah -> total kg & breakdown 

STEP 6 - Notifikasi & Poin Poin otomatis bertambah -> notifikasi in-app -> halaman Poin 

## **4. Daftar Fitur per Modul** 

### **4.1 Modul Scan & Poin (Warga)** 

|**Fitur**|**Deskripsi**|**Endpoint / Catatan**|
|---|---|---|
|Deteksi Sampah AI|Foto sampah -> AI identfkasi jenis, volume,<br>berat, confdence score|/waste/detect|
|Scan QR Bin|Scan QR bin sesuai jenis sampah; validasi<br>kecocokan + geofencing|/bins/scan|
|Geofencing Validasi|Haversine distance check, user harus ≤10m dari<br>bin (prod) / ≤500m (debug)|Bagian dari /bins/scan|
|Validasi Kapasitas Bin|Cek volume proyeksi (current+estmate) vs<br>maxCapacity sebelum commit|Bagian dari /bins/scan|
|Aktvasi Bin Warga|Scan QR untuk aktvasi & ukur kapasitas bin<br>sebelum dipakai pertama kali|/bins/actvate, /bins/measure|
|Reset Bin (Pengajuan<br>Pengosongan)|Ajukan pengosongan bin penuh dengan foto<br>bukt|/bins/reset|



### **4.2 Modul Reward & Poin** 

**Catatan Update Sistem Poin:** Seluruh aturan berikut menggantikan total logika poin versi sebelumnya (per pembaruan terbaru). 

|**Fitur**|**Deskripsi**|**Role**|
|---|---|---|
|Welcome Bonus<br>Registrasi|Setap akun baru (Warga, Mahasiswa KKN, Petugas Pemilahan)<br>otomats mendapat saldo awal +20 Poin saat pertama kali<br>registrasi/login.<br>|Semua|
|Poin Warga<br>(Gamifkasi AI)|Formula: Poin = (Berat Sampah dalam Kg x 100) x (0.9 x Confdence Score AI)<br>Contoh: Berat 2 Kg, Confdence 0.95 -> Poin = (2x100) x (0.9x0.95) = 200 x 0.855<br>= 171 Poin<br>Bersifat dinamis,dihitungotomats tapscan berhasil.|Warga|
|Poin Aktvasi Warga<br>(Mahasiswa)|+5 Poin untuk setap 1 tong (bin) warga yang berhasil diaktvasi mahasiswa.<br>|Mahasiswa KKN|
|Bonus Target<br>Aktvasi<br>(Mahasiswa)|+20 Poin bonus setap kelipatan 3 warga berhasil diaktvasi (3, 6, 9, dst).|Mahasiswa KKN|
|Poin Presensi<br>(Mahasiswa)|+1 Poin untuk setap kehadiran tercatat di Posko.<br>Skala poin mahasiswa dijaga maksimal berkisar 100 karena dipakai sebagai<br>komponenpenilaian SKS akhir.|Mahasiswa KKN|
|Poin Timbangan<br>Residu (Petugas)|1 Poin per 1 Kg sampah residu yang berhasil ditmbang & disubmit (dibulatkan).<br>Tidak ada lagi nilai stats (+10 poin dihapus) - murni skala 1 Kg = 1 Poin agar<br>mencerminkan beban kerja riil.|Petugas Pemilahan|
|Bonus<br>Kehadiran<br>Kunjungan<br>Rumah<br>(Petugas)|+2 Poin bonus jika petugas hadir di rumah warga dan<br>menyertakan foto bukt yang valid.|Petugas Pemilahan|
|Leaderboard Warga|Rankingwarga berdasarkan totalpoin dalam lingkupRW/kelurahan.|Warga|
|Poin KKN Kelompok|Total poin kelompok = agregasi poin seluruh anggota kelompok (mengikut skala<br>poin mahasiswa individu).|Mahasiswa KKN|



### **4.3 Modul Verifikasi & Timbangan Residu (Petugas Pemilahan)** 

|**Fitur**|**Deskripsi**|**Endpoint / Catatan**|
|---|---|---|
|Dashboard Petugas|Ringkasan harian: KPI score, total kg hari ini, sisa<br>jadwal penjemputan & penimbangan|/petugas-pemilahan/dashboard|
|Jadwal Penjemputan|Dafar rumah warga dari pengajuan yang SUDAH<br>diterima (status DIPROSES) yang perlu<br>dikunjungi, prioritas bin dengan volume<br>≥70%/mendekat penuh = high priority|/petugas-pemilahan/jadwal-harian|
|Terima Pengajuan<br>Reset|Petugas melihat dafar pengajuan<br>pengosongan bin berstatus PENDING di<br>zonanya, lalu menekan "Terima Tugas" untuk<br>mengklaim satu pengajuan (status jadi<br>DIPROSES, ditugaskan ke petugas tsb).<br>Mencegah dua petugas mengerjakan<br>pengajuanyangsama.|/petugas-pemilahan/pengajuan/{id}/terima|
|Submit Log Timbangan|Foto -> input berat asli -> submit; backend reset<br>bin digital warga ke 0% (kosong)|/petugas-pemilahan/submit-log|
|KPI Score|Formula: (0.6 × ketepatan waktu%) + (0.4 ×<br>akurasi%)|Dashboard API|
|Riwayat Log|Histori log tmbangan dengan flter tanggal &<br>tpe|/petugas-pemilahan/riwayat|



### **4.4 Modul Edukasi & Monitoring KKN (Mahasiswa)** 

|**Fitur**|**Deskripsi**|**Endpoint / Catatan**|
|---|---|---|
|Dashboard KKN|Progress aktvasi bin, poin kontribusi, sisa kuota|/kkn/dashboard|
|Dafar Warga<br>Dampingan|Warga yang sudah diaktvasi mahasiswa ini,<br>dengan stats pemilahan|/kkn/warga-dampingan|
|Monitoring Detail<br>Warga|% pemilahan benar, log terbaru, fag <80% perlu<br>re-edukasi|Per wargaId|
|Aktvasi Bin via QR<br>Scan|Scan QR bin organik & anorganik warga (sudah<br>punya akun) untuk aktvasi|/kkn/warga/actvate-bin|
|Presensi GPS<br>Geofencing|Tracking posisi real-tme, absen dalam radius<br>zona kegiatan|/kkn/atendance/check-in|
|Laporan Pemanfaatan<br>Sampah|Submit laporan daur ulang/kompos dengan foto|/kkn/pemanfaatan-sampah|
|Pengajuan Izin|Ajukan izin tdak hadir dengan kategori & foto<br>bukt ke DPL|/kkn/pengajuan-izin|
|Kelompok KKN|Info kelompok: nama, DPL, lokasi posko, total<br>poin, anggota|/kkn/kelompok/me|
|Dashboard Kelurahan|Read-only. Menampilkan statstk kondisi<br>kelurahan wilayah penugasan (persentase<br>rumah aktf scan, total volume sampah<br>tercatat), dihitung otomats backend dari<br>aktvitas nyata Warga secara real-tme. Tidak<br>ada form input manual — murni tampilan.|/kkn/dampak-kelurahan|



### **4.5 Modul Akun & Profil (Lintas Role)** 

|**Fitur**|**Deskripsi**|**Role**|
|---|---|---|
|Login|Auth dengan Nomor HP + password untuk seluruh role (Warga, Mahasiswa KKN,<br>Petugas Pemilahan)|Semua|
|Register Warga /<br>Petugas|Pendafaran mandiri via aplikasi mobile (dropdown role hanya Warga & Petugas<br>Pemilahan); akun Mahasiswa KKN dibuatkan oleh Admin di Web (bukan self-<br>register)|Warga & Petugas|
|Upload Avatar|Gant foto profl via kamera/galeri|Semua|
|Gant / Lupa<br>Password|Ubah password atau reset via email (token -> validasi -> reset)|Semua|
|Login Warga via OTP|Alternatf login: request OTP via HP -> verifkasi|Warga|
|FCM Token<br>Registraton &<br>Logout|Registrasi push notfcaton token; hapus sesi saat logout|Semua|



### **4.6 Modul Riwayat & Statistik** 

|**Fitur**|**Deskripsi**|**Role**|
|---|---|---|
|Riwayat Pemilahan<br>Warga|Histori transaksi scan + poin: jenis, berat, tanggal|Warga|
|Riwayat Log Petugas|Histori pengangkutan dengan flter tanggal & tpe residu|Petugas Pemilahan|
|Riwayat Kegiatan<br>KKN|Log aktvitas mahasiswa: presensi, aktvasi, pemanfaatan|Mahasiswa KKN|
|Statstk Poin Warga|Total poin, ranking leaderboard, breakdown per tpe sampah|Warga|
|Statstk Petugas|KPI score, total kg bulanan/harian, ketepatan & akurasi|Petugas Pemilahan|



### **4.7 Modul Notifikasi (Per-Role Terpisah)** 

_Filter notifikasi diimplementasikan client-side melalui keyword matching pada field type, title, dan desc. Setiap role memiliki provider notifikasi sendiri yang terpisah._ 

#### **Spesifikasi Endpoint REST API** 

|**Endpoint**|**Method**|**Fungsi**|**Response / Catatan**|
|---|---|---|---|
|/api/v1/notfcatons|GET|Mengambil seluruh dafar histori<br>notfkasi milik user yang sedang login.|Array of objects: id, judul, deskripsi,<br>tpe (mis. BIN_FULL, SETORAN), tanggal,<br>isRead.|
|/api/v1/notfcatons/{id}/read|PUT|Menandai satu notfkasi spesifk<br>menjadi sudah dibaca.|isRead diubah menjadi true untuk<br>notfkasi dengan id terkait.|
|/api/v1/notfcatons/read-all|PUT|Menandai seluruh notfkasi milik user<br>tersebut menjadi sudah dibaca<br>sekaligus.|Semua notfkasi milik user -> isRead =<br>true.|
|/api/v1/notfcatons/device-token|POST|Menyimpan/mendafarkan FCM<br>Device Token milik user ke database<br>agar backend bisa mengirim push<br>notfcaton.|Token FCM tersimpan & terikat ke<br>userId + device.|
|/api/v1/notfcatons/unregister-<br>token|POST|Menghapus FCM Device Token saat<br>user logout, agar push notfcaton<br>tdak lagi dikirim ke HP tersebut<br>setelah sesi berakhir.|Token FCM dihapus dari database<br>untuk device/user terkait.|



|**Role**|**Tipe Notfkasi**|
|---|---|
|Warga|REMINDER (07:00 & 16:00), BIN_FULL, SETORAN|
|Mahasiswa KKN|PRESENSI, IZIN, POIN, KKN, AKTIVASI|
|Petugas Pemilahan|TIMBANGAN_RESIDU, POIN_PETUGAS|



## **5. Relasi Antar Entitas** 

### **5.1 Entitas Utama** 

|**Enttas**|**Deskripsi**|**Kunci Utama**|
|---|---|---|
|User|Akun pengguna semua role|userId|
|Household|Rumah tangga warga|householdId|
|Bin|Tempat sampah fsik ber-QR|binId / qrSerial|
|WasteLog|Catatan tap transaksi pemilahan sampah|transactonId|
|PointHistory|Riwayat perolehan poin per user|pointId|
|KelompokKKN|Kelompok mahasiswa KKN|groupId|
|WargaDampingan|Relasi mahasiswa ↔ warga binaan|(mahasiswaId, wargaId)|
|JadwalKegiatan / Presensi|Jadwal kegiatan & catatan kehadiran KKN|scheduleId|
|PemanfaatanSampah /<br>PengajuanIzin|Laporan daur ulang / permohonan izin ke DPL|laporanId / izinId|
|ResiduBinPickup /<br>ResiduSubmitLog|Jadwal penjemputan ke rumah warga (status:<br>PENDING/DIPROSES/SELESAI) & log tmbangan<br>petugas|pickupId / logId|
|NotfkasiEntty|Pesan notfkasi per user per role|notfId|
|DPL|Dosen Pembimbing Lapangan|dplId / nip|



### **5.2 Tabel Relasi** 

|**Relasi**|**Kardinalitas**|**Alasan**|
|---|---|---|
|User → Household (Warga)|1 : 1|Satu warga satu rumah tangga|
|Household → Bin|1 : N|Satu rumah tangga = 2 bin (organik + anorganik)|
|User (Warga) → WasteLog|1 : N|Satu warga bisa punya banyak transaksi<br>pemilahan|
|WasteLog → PointHistory|1 : 1|Setap transaksi menghasilkan tepat 1 record poin|
|KelompokKKN → User<br>(Mahasiswa)|1 : N|Satu kelompok terdiri dari banyak mahasiswa|
|DPL → KelompokKKN|1 : N|Satu DPL bisa membimbing beberapa kelompok|
|User (Mahasiswa) ↔ User<br>(Warga)|N : M|Satu mahasiswa dampingi banyak warga; satu<br>warga punya satu pendamping|
|User (Mahasiswa) → Bin|1 : N|Mahasiswa mengaktvasi bin di banyak warga<br>binaan|
|Bin → ResiduBinPickup|1 : N|Satu bin bisa muncul di jadwal penjemputan<br>berulang (tap kali warga ajukan reset)|
|ResiduBinPickup →<br>ResiduSubmitLog|1 : 1|Setap kunjungan penjemputan ke rumah warga<br>menghasilkan satu log tmbangan|
|User → NotfkasiEntty|1 : N|Satu user punya banyak notfkasi|



### **5.3 Gambaran ERD** 

DPL --< KelompokKKN >-- User(Mahasiswa) | mendampingi (WargaDampingan: N:M) v User(Warga) -- Household --< Bin >-- WasteLog --> PointHistory | mengaktivasi (Mahasiswa) 

User(Mahasiswa) --< PemanfaatanSampah User(Mahasiswa) --< PengajuanIzin ---------------> DPL User(Mahasiswa) --< Presensi >-- JadwalKegiatan 

Bin --< ResiduBinPickup >-- User(Petugas) | +--< ResiduSubmitLog --> PointHistory (Petugas) 

User(any) --< NotifikasiEntity [tipe: WARGA | KKN | PETUGAS_PEMILAHAN] 

## **6. Alur Sistem End-to-End** 

Skenario lengkap satu siklus pengelolaan sampah TrashCare, melibatkan ketiga role secara berurutan. 

### **Fase 1 — Onboarding (Mahasiswa KKN)** 

Login -> cari warga terdaftar di wilayah tugas -> scan QR bin ORGANIK (GPS aktif) -> validasi (warga valid? bin belum aktif? mahasiswa di zona benar?) -> scan QR bin ANORGANIK -> backend ikat kedua bin ke household warga -> notifikasi ke warga: "Tempat sampah Anda berhasil diaktivasi" -> poin kontribusi mahasiswa bertambah OUTCOME: warga yang sudah punya akun kini bisa scan sampah 

### **Fase 2 — Pemilahan & Reward (Warga)** 

Notifikasi pengingat pagi -> foto sampah -> AI deteksi (jenis, volume, berat, confidence) -> konfirmasi estimasi poin -> scan QR bin (geofencing lolos, cek kapasitas aman) -> backend commit WasteLog + PointHistory -> UI tampilkan poin bertambah Sore hari, jika bin capai 80% kapasitas -> notifikasi otomatis "Bin hampir penuh" 

### **Fase 3 — Monitoring (Mahasiswa KKN)** 

Mingguan: buka Monitoring -> lihat correctPercentage tiap warga binaan -> warga dengan skor <80% di-flag "Perlu Re-edukasi" -> kunjungan lapangan Presensi: buka jadwal kegiatan -> GPS tracking aktif -> dalam radius lokasi -> timer durasi minimum terpenuhi -> tombol Absen aktif -> presensi tercatat 

### **Fase 4 — Pengangkutan Residu (Petugas Pemilahan)** 

Warga ajukan pengosongan bin (bin penuh/mendekati 100%) -> Petugas Pemilahan cek Jadwal Penjemputan -> mendatangi rumah warga bersangkutan -> foto bukti -> timbang sampah asli -> input berat & klasifikasi -> Submit Log -> backend reset bin warga ke 0% & poin (poin gaji) petugas bertambah. 

### **Fase 5 — Pelaporan & Poin KKN (Mahasiswa)** 

Akhir minggu: buka Pemanfaatan Sampah -> isi jenis, kategori, jumlah, deskripsi -> upload foto kegiatan -> submit -> poin KKN kelompok bertambah 

### **Ringkasan Siklus Lengkap** 

Mahasiswa aktivasi warga 

-> Warga memilah sampah -> dapat poin -> volume bin bertambah 

-> Bin mencapai kapasitas -> warga dapat notif + ajukan reset -> Petugas Pemilahan cek Jadwal Penjemputan -> datangi rumah warga -> timbang & catat log -> Bin kosong kembali -> warga bisa scan lagi -> siklus berulang -> Mahasiswa monitor kepatuhan warga -> edukasi jika perlu -> siklus membaik 

## **7. Catatan & Rekomendasi (Analisis Risiko)** 

### **7.1 Potensi Risiko Sistem** 

|**Risiko**|**Mitgasi Sudah Ada**|**Rekomendasi Tambahan**|
|---|---|---|
|Replay atack: scan berulang tanpa<br>buang sampah sungguhan|Volume bin dicek sebelum commit; scan<br>ditolak jika penuh|Cooldown per user per bin (maks 3x/hari); rate<br>limitng API; anomaly detecton|
|GPS spoofng / mock locaton|Haversine distance check 10m di<br>producton|Deteksi isMockLocaton; validasi koordinat<br>server-side; log anomaly|
|Foto bukt palsu<br>(petugas/mahasiswa)|Upload foto dikompresi & multpart|Validasi EXIF; wajib in-app camera; watermark<br>tmestamp & GPS otomats|
|Aktvasi bin oleh mahasiswa di luar<br>zona penugasan|-|Validasi backend: zona mahasiswa harus sama<br>dengan alamat warga|



### **7.2 Rekomendasi Fitur Tambahan** 

|**Fitur**|**Penjelasan**|
|---|---|
|Admin Dashboard<br>(Kecamatan/Kelurahan)|Peta sebaran bin, statstk agregat compliance, progress KKN, monitoring aktvitas Petugas<br>Pemilahan|
|Achievement & Badge<br>System|Badge 'Pemilah Konsisten 30 Hari', 'Zero Error Week'; level Warga Biasa → Eco Warrior → Green<br>Champion|
|Notfkasi Push Proaktf|Pengingat di waktu optmal per user; alert compliance turun drasts|
|Peta Interaktf Real-Time|Sebaran bin untuk petugas & warga binaan untuk mahasiswa; route planning|
|Sistem Reward/Tukar Poin|Marketplace virtual voucher/pulsa/token listrik; partnership UMKM; donasi poin|
|Reportng & Export Data|Export laporan KKN (PDF), laporan bulanan petugas (CSV/PDF), agregat admin|
|Ofine Mode Robust|Queue transaksi scan saat ofine, sync otomats, indikator poin pending|
|AI Model Improvement Loop|Feedback warga jika deteksi AI salah, dikumpulkan untuk re-training berkala|



## **8. Lampiran: Mapping Endpoint API ↔ Fitur** 

|**Endpoint**|**Method**|**Role**|**Fitur**|
|---|---|---|---|
|/auth/login|POST|Semua|Login|
|/auth/register/warga|POST|Warga|Register warga|
|/auth/register/mahasiswa-kkn|POST|Mahasiswa KKN|Register mahasiswa|
|/auth/register/petugas-pemilahan|POST|Petugas Pemilahan|Register petugas|
|/waste/detect|POST|Warga|Deteksi AI sampah|
|/bins/scan|POST|Warga|Commit transaksi scan + poin|
|/bins/actvate, /bins/measure|POST|Warga/Mahasiswa|Aktvasi & ukur kapasitas bin|
|/bins/reset|POST|Warga|Ajukan pengosongan bin|
|/transactons/my-deposits|GET|Warga|Riwayat pemilahan|
|/points/me, /points/leaderboard|GET|Warga|Poin & leaderboard|
|/kkn/dashboard|GET|Mahasiswa KKN|Dashboard KKN|
|/kkn/warga-dampingan, /kkn/warga|GET|Mahasiswa KKN|Dafar & cari warga binaan|
|/kkn/warga/actvate-bin|POST|Mahasiswa KKN|Aktvasi bin warga|
|/kkn/atendance/check-in|POST|Mahasiswa KKN|Presensi kehadiran|
|/kkn/pemanfaatan-sampah|POST|Mahasiswa KKN|Submit laporan pemanfaatan|
|/kkn/pengajuan-izin|POST|Mahasiswa KKN|Ajukan izin ke DPL|
|/kkn/kelompok/me, /kkn/history|GET|Mahasiswa KKN|Info kelompok & riwayat KKN|
|/kkn/dampak-kelurahan|GET|Mahasiswa KKN|Lihat statstk kondisi kelurahan (read-<br>only, real-tme, tanpa input manual)|
|/petugas-pemilahan/dashboard|GET|Petugas Pemilahan|Dashboard petugas|
|/petugas-pemilahan/jadwal-harian|GET|Petugas Pemilahan|Jadwal Penjemputan|
|/petugas-pemilahan/submit-log|POST|Petugas Pemilahan|Submit tmbangan residu|
|/petugas-pemilahan/riwayat|GET|Petugas Pemilahan|Riwayat log|
|/api/v1/notfcatons|GET|Semua|Ambil histori notfkasi|
|/api/v1/notfcatons/{id}/read<br>|PUT|Semua|Tandai satu notfkasi dibaca<br>|
|/api/v1/notfcatons/read-all<br>|PUT|Semua|Tandai semua notfkasi dibaca|
|/api/v1/notfcatons/device-token|POST|Semua|Registrasi FCM device token|
|/api/v1/notfcatons/unregister-token|POST|Semua|Hapus FCM device token saat logout|
|/petugas-pemilahan/pengajuan/{id}/<br>terima|PUT|Petugas Pemilahan|Terima/klaim pengajuan<br>pengosongan bin|



## **9. Pemetaan Fitur Mobile ke View (Flutter)** 

Bagian ini memetakan seluruh fitur yang dijelaskan pada dokumentasi TrashCare Versi 2.0 ke file-file View (.dart) yang ada di source code aplikasi mobile (Flutter). Seluruh lokasi file berada di dalam directory lib/app/modules/. 

### **9.1 Role: Warga (Pengguna Utama)** 

Warga adalah pengguna utama yang memilah sampah dan mendapatkan poin. 

|**Fitur / Modul**|**Lokasi File Halaman (View) di Aplikasi**|
|---|---|
|Login & Register|auth/views/login_view.dart<br>auth/views/register_view.dart|
|Dashboard / Beranda Utama|beranda/beranda_view.dart<br>dashboard/dashboard_view.dart|
|Aktvasi Bin Pertama Kali|aktvasi/views/aktvasi_bin_view.dart<br>aktvasi/views/ukur_kapasitas_view.dart|
|Deteksi AI & Scan QR Bin|scan/views/scan_fow_view.dart|
|Pengajuan Reset Bin (Penuh)|auth/views/reset_bin_view.dart|
|Akumulasi Poin &<br>Leaderboard|poin/poin_view.dart|
|Riwayat & Monitoring<br>Pemilahan|riwayat/views/riwayat_view.dart<br>riwayat/views/pemilahan_monitoring_dashboard_view.dart|
|Kelola Profl & Bin|profl/profl_view.dart<br>profl/kelola_bin_view.dart|
|Notfkasi Warga|notfkasi/views/notfkasi_view.dart|



### **9.2 Role: Mahasiswa KKN (Agen Lapangan)** 

Mahasiswa KKN tidak mendaftar mandiri, tetapi login dengan akun yang sudah dibuatkan oleh Admin (login memakai Nomor HP + password, bukan NIM). Mereka bertugas mengaktivasi bin warga binaan dan melakukan presensi. 

|**Fitur / Modul**|**Lokasi File Halaman (View) di Aplikasi**|
|---|---|
|Dashboard KKN|mahasiswa/views/mahasiswa_view.dart|
|Aktvasi Bin Warga (Oleh<br>Mahasiswa)|mahasiswa/views/aktvasi_warga_view.dart|
|Dafar & Monitoring Warga<br>Dampingan|mahasiswa/views/dafar_warga_view.dart<br>mahasiswa/views/monitoring_warga_view.dart<br>mahasiswa/views/detail_warga_view.dart|
|Presensi Kegiatan (GPS<br>Geofencing)|mahasiswa/views/kkn_atendance_view.dart|
|Laporan Pemanfaatan<br>Sampah|mahasiswa/views/pemanfaatan_sampah_view.dart|
|Pengajuan Izin ke DPL|mahasiswa/views/pengajuan_izin_form_view.dart|
|Info Kelompok KKN|mahasiswa/views/kelompok_kkn_view.dart|
|Poin & Riwayat Mahasiswa|mahasiswa/views/mahasiswa_poin_view.dart<br>mahasiswa/views/riwayat_kkn_view.dart|
|Kelola Profl Mahasiswa|mahasiswa/views/edit_profl_mahasiswa_view.dart|
|Notfkasi Mahasiswa|mahasiswa/views/mahasiswa_notfkasi_view.dart|



### **9.3 Role: Petugas Pemilahan (Operator Hilir)** 

Petugas Pemilahan mendatangi rumah warga untuk menimbang sampah saat bin-nya sudah penuh. 

|**Fitur / Modul**|**Lokasi File Halaman (View) di Aplikasi**|
|---|---|
|Dashboard & Ringkasan KPI<br>Petugas|petugas_pemilahan/views/petugas_pemilahan_view.dart<br>petugas_pemilahan/views/petugas_pemilahan_dashboard_view.dart|
|Jadwal & Timbangan Fisik<br>Residu|petugas_pemilahan/tmbangan_residu_view.dart|
|Poin & Riwayat Log Petugas|petugas_pemilahan/views/petugas_pemilahan_poin_view.dart<br>petugas_pemilahan/views/riwayat_petugas_pemilahan_view.dart|
|Profl & Gant Password|petugas_pemilahan/views/petugas_pemilahan_profl_view.dart<br>petugas_pemilahan/views/gant_password_petugas_view.dart|
|Notfkasi Petugas|petugas_pemilahan/views/petugas_notfcaton_view.dart|



### **9.4 Modul Global (Berlaku Lintas Role)** 

|**Fitur / Modul**|**Lokasi File Halaman (View) di Aplikasi**|
|---|---|
|Lupa Password & OTP|auth/views/forgot_password_view.dart<br>shared/widgets/otp_input_widget.dart|
|Splash Screen (Orientasi<br>Awal)|splash/splash_view.dart|
|Kamera Bawaan Aplikasi<br>(Untuk AI & Bukt)|shared/widgets/inline_camera_widget.dart<br>shared/widgets/qr_scanner_widget.dart|



_Catatan: tabel ini dapat dijadikan referensi langsung saat melakukan debugging UI atau memodifikasi tampilan fitur tertentu di source code._ 

## **10. Pemetaan Relasi Data: Input Mobile ke Struktur Backend (Web Admin)** 

Bagian ini menjelaskan bagaimana setiap input penting dari sisi Mobile App berelasi (terhubung) dengan entitas dan struktur kepemilikan (ownership) di sisi Web Admin / Backend, guna mempercepat proses development API dan desain database. 

### **10.1 Modul Autentikasi & Registrasi (Warga & Petugas)** 

#### **Registrasi Warga** 

|**Aspek**|**Keterangan**|
|---|---|
|Input Mobile|Data Pribadi, hierarki domisili wajib berjenjang Kecamatan -> Kelurahan -> RW (Dropdown Dinamis),<br>Jumlah Anggota Keluarga (familySize)|
|Relasi / Foreign Key Backend|Warga tdak mendafar sebagai individu, melainkan sebagai enttas Satu Rumah Tangga (Household)<br>yang dikunci pada RW terpilih: User (Warga) 1:1 Household; Household N:1 RW; Backend<br>menyiapkan kolom familySize dan rw saat registrasi warga|
|Fungsi di Web Admin|Menetapkan kepemilikan teritorial — Admin Web tngkat RW/Kelurahan hanya dapat melihat data<br>statstk warga di bawah wilayahnya; membantu fltering bagi Mahasiswa KKN, yang hanya bisa<br>melihat dan mengaktvasi warga dengan RW sama dengan wilayah penugasannya|



#### **Profil Warga: Nama Mahasiswa Pendamping** 

|**Aspek**|**Keterangan**|
|---|---|
|Halaman|profl_view.dart (Halaman Profl Warga)|
|Input Mobile|Tidak ada input — bersifat tampilan (display only). Halaman Profl Warga menampilkan kolom baru<br>"Nama Mahasiswa Pendamping".|
|Relasi / Foreign Key Backend|Backend mengirimkan nama Mahasiswa KKN yang ditugaskan ke RW warga tersebut saat aplikasi<br>menembak endpoint GET /households/me atau /auth/login. Jika belum ada mahasiswa yang di-<br>assign ke RW tersebut, backend cukup merespons null.|
|Fungsi di Web Admin|Transparansi pendampingan — warga dapat mengetahui siapa mahasiswa KKN yang bertanggung<br>jawab atas wilayahnya, selaras dengan data assignment mahasiswa->RW yang dikelola Admin di<br>Web.|



_Catatan: fitur ini melengkapi 10.1 Registrasi Warga — satu Household yang terkunci pada RW kini juga terhubung secara eksplisit ke Mahasiswa pendamping wilayah tersebut._ 

### **10.2 Modul Aktivasi Bin & Monitoring (Mahasiswa KKN)** 

#### **Aktivasi Bin Warga (Oleh Mahasiswa)** 

|**Aspek**|**Keterangan**|
|---|---|
|Input Mobile|Scan QR Bin Organik, Scan QR Bin Anorganik, Data Kapasitas Bin|
|Relasi / Foreign Key Backend|Bin diikat (binding) ke Household milik Warga tersebut (Household 1:N Bin); menambahkan record<br>ke tabel juncton WargaDampingan (mahasiswaId <-> wargaId) — warga resmi menjadi binaan<br>mahasiswa tersebut|
|Fungsi di Web Admin|Web Admin (Dosen/Admin Pusat) dapat memonitor KPI Mahasiswa berdasarkan jumlah warga yang<br>berhasil diaktvasi; poin kontribusi otomats masuk ke total Poin Kelompok KKN|



#### **Monitoring Warga Dampingan: Limitasi Wilayah Otomatis** 

|**Aspek**|**Keterangan**|
|---|---|
|Halaman|monitoring_warga_view.dart (Halaman Monitoring KKN)|



|**Aspek**|**Keterangan**|
|---|---|
|Input Mobile|Tidak ada input manual RW. Aplikasi otomats menarik (GET) parameter kelurahan dan rw dari profl<br>Mahasiswa yang sedang login, lalu hanya menampilkan dafar warga dari RW tersebut.|
|Relasi / Foreign Key Backend|Endpoint API monitoring mahasiswa memiliki parameter saringan (flter) wilayah agar hanya<br>mengembalikan data warga yang domisilinya persis sama dengan wilayah penugasan Mahasiswa<br>(mahasiswaId -> KelompokKKN/penugasan -> RW).|
|Fungsi di Web Admin|Mahasiswa secara sistem tdak dapat mengakses, melihat, atau mengaktvasi Bin milik warga di luar<br>wilayah penugasannya — isolasi data per RW dijaga di level API, bukan hanya di UI.|



#### **Laporan Pemanfaatan Sampah & Izin Absensi** 

|**Aspek**|**Keterangan**|
|---|---|
|Input Mobile|Jenis Pemanfaatan (Kompos/Kerajinan), Foto Bukt, Pengajuan Izin|
|Relasi / Foreign Key Backend|Laporan dan Izin berelasi ke User (Mahasiswa) dan diteruskan relasinya ke KelompokKKN serta DPL<br>(Dosen Pembimbing Lapangan)|
|Fungsi di Web Admin|DPL dapat melihat laporan per mahasiswa/kelompok di Web Admin untuk memberikan approval izin<br>atau menilai laporan pemanfaatan|



### **10.3 Modul Scan Pemilahan (Warga)** 

#### **Scan AI & QR Bin** 

|**Aspek**|**Keterangan**|
|---|---|
|Input Mobile|Foto Sampah (AI), Scan QR Bin, GPS (Geofencing)|
|Relasi / Foreign Key Backend|Menghasilkan record baru di tabel WasteLog yang berelasi ke User (Warga) dan Bin; WasteLog men-<br>trigger record baru di tabel PointHistory (WasteLog 1:1 PointHistory)|
|Fungsi di Web Admin|Volume/kapasitas fsik Bin di database bertambah secara real-tme; jika volume Bin >= 80%, status<br>bin di Web Admin berubah menjadi Warning / High Volume, yang otomats memicu penjadwalan ke<br>Petugas Pemilahan|



#### **Sinkronisasi Data Evaluasi (Akurasi AI)** 

|**Aspek**|**Keterangan**|
|---|---|
|Halaman|beranda_view.dart (Halaman Dashboard/Home Warga)|
|Input Mobile|Tidak ada input — kartu "Statstk Saya" di Dashboard Warga menampilkan metrik tambahan<br>"Akurasi AI (Rata-rata)".|
|Relasi / Foreign Key Backend|Endpoint riwayat sampah Warga (/transactons/my-deposits) mengirimkan nilai aiConfdence pada<br>tap transaksi; aplikasi merata-ratakan nilai ini secara real-tme di sisi klien.|
|Fungsi di Web Admin|Skor pemilahan (benar/salah) dan Akurasi AI yang dilihat Warga di aplikasinya kini 100% transparan<br>dan sama dengan data yang dievaluasi oleh Mahasiswa KKN di halaman Monitoring — satu sumber<br>data yang konsisten di kedua sisi.|



### **10.4 Modul Operasional Pengangkutan (Petugas Pemilahan)** 

#### **Submit Log Timbangan** 

|**Aspek**|**Keterangan**|
|---|---|
|Input Mobile|Input Berat Residu (Kg), Klasifkasi (B3/Non-B3), Foto Bukt Timbangan, Geotagging|
|Relasi / Foreign Key Backend|Menghasilkan record di tabel ResiduSubmitLog yang berelasi ke Bin (milik RW) dan User (Petugas)|
|Fungsi di Web Admin|Reset Volume Bin: kapasitas Bin milik warga/RW yang diangkut akan direset menjadi 0% di Web|



|**Aspek**|**Keterangan**|
|---|---|
||Admin; KPI Petugas: log ini masuk ke dalam perhitungan skor KPI (ketepatan waktu & akurasi) milik<br>Petugas yang dapat dipantau oleh Admin Dinas Lingkungan Hidup|



### **10.5 Ringkasan Relasi Kunci (Key Takeaways untuk Backend Dev)** 

|**#**|**Ringkasan**|
|---|---|
|1|Hierarchy Kepemilikan Teritorial: User -> RW -> Kelurahan -> Kecamatan (pentng untuk flter<br>Dashboard Web Admin)|
|2|Hierarchy KKN: User (Mahasiswa) -> KelompokKKN -> DPL|
|3|Juncton Table Wajib: harus ada tabel relasi (contoh: WargaDampingan) untuk memetakan warga<br>mana yang dibina oleh mahasiswa mana|
|4|Trigger Otomats: input tmbangan fsik dari Petugas Pemilahan di aplikasi mobile harus men-trigger<br>reset volume bin Warga di tabel Bin|



_Penting: Pastikan Backend memvalidasi setiap FK (Foreign Key) saat aplikasi mobile melakukan POST data, terutama validasi wilayah (RW Warga harus cocok dengan RW penugasan Mahasiswa saat aktivasi)._ 

###### **10.6 Relasi Web ↔ Mobile (Lintas Peran)** 

Aplikasi mobile TrashCare tidak berdiri sendiri. Setiap Mahasiswa KKN dan Warga yang terlihat mandiri di mobile sebenarnya "diawasi" dan "diatur" oleh pihak lain lewat Web Admin. Bagian ini menjelaskan relasi tersebut supaya jelas siapa mengatur siapa, dan data mana yang otomatis mengalir ke Web ketika ada aktivitas di mobile. 

###### **Relasi Web ↔ Mahasiswa KKN** 

Di mobile, Mahasiswa terlihat seperti pengawas lapangan. Tapi di Web, mereka justru menjadi pihak yang diawasi dan diatur. 

|**Pihak (Web)**|**Relasi ke Mahasiswa**|
|---|---|
|Taskforce|Berperan sebagai "Admin Kampus" di Web. Taskforce yang membuatkan akun Mahasiswa,<br>membagi kelompok, dan menentukan Mahasiswa A ditugaskan ke RW mana. Ini menjawab<br>kenapa di mobile, Mahasiswa tba-tba langsung terhubung ke RW tertentu — penugasan itu<br>diatur dari Web oleh Taskforce, bukan dipilih sendiri oleh Mahasiswa.|
|DPL (Dosen Pembimbing<br>Lapangan)|Menggunakan Web untuk memantau/melihat absensi Mahasiswa, menyetujui (approve) izin<br>Mahasiswa jika sakit, dan mengevaluasi laporan Pemanfaatan Sampah yang dikirim Mahasiswa<br>dari aplikasi mobile.|



###### **Relasi Web ↔ Warga** 

Meskipun Warga mendaftar mandiri di mobile, mereka memiliki "bapak asuh" di tingkat wilayah. 

|<br>**Pihak (Web)**|<br>**Relasi ke Warga**|
|---|---|
|Pengurus RW/RT (Portal RW)|Karena di mobile Warga mendafar dengan memilih RW-nya sendiri, semua data pendafaran<br>warga tersebut otomats masuk ke Dashboard Web milik Ketua RW bersangkutan. Ketua RW<br>bisa memantau warganya — siapa saja yang paling rajin memilah sampah (Leaderboard RW).|



Catatan: relasi di atas menjelaskan sisi Web (siapa mengatur/memantau siapa). Alur teknis mobile (endpoint, field, tabel) untuk masing-masing modul tetap mengikuti bagian 9 dan 10 di atas — bagian ini tidak mengubah endpoint atau struktur data yang sudah ada, hanya menjelaskan pihak Web di baliknya. 

## **11. Panduan Detail UI, Aksi & Relasi Backend (Seluruh Halaman Mobile)** 

Bagian ini memetakan seluruh halaman (pages/views) yang ada di dalam aplikasi mobile TrashCare dari ujung ke ujung. Setiap halaman dijelaskan mencakup elemen antarmuka (UI/Button), logika aksi yang terjadi, dan relasi/dampaknya ke Web Admin Backend. 

_Pembaruan Penting: Sesuai aturan terbaru, sistem login kini mutlak hanya menggunakan Nomor HP untuk seluruh role (termasuk Mahasiswa KKN), dan tidak lagi menggunakan NIM. Referensi login berbasis NIM pada bagian-bagian sebelumnya di dokumen ini telah disesuaikan mengikuti aturan ini._ 

### **11.1 Fase Awal & Autentikasi (Global)** 

#### **Splash Screen (splash_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Logo TrashCare berukuran besar di tengah, teks versi aplikasi di bawah, dan indikator loading<br>melingkar.|
|Aksi / Buton|Tidak ada interaksi manual. Proses berjalan otomats di latar belakang (background).|
|Relasi Backend|Aplikasi mengambil Token Sesi dari penyimpanan lokal (device) dan melakukan pengecekan ke<br>endpoint /auth/me. Jika valid, server mengembalikan data UserRole dan aplikasi langsung routng<br>user ke Dashboard sesuai rolenya. Jika gagal/kosong, diarahkan ke Login.|



#### **Halaman Login (login_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Input "NOMOR TELEPON" dengan awalan bendera Indonesia dan teks +62 permanen; Input "KATA<br>SANDI" (dengan ikon mata untuk melihat sandi); Teks Buton "Lupa Password?"; Buton Utama<br>"MASUK SISTEM"; Buton Sekunder "Dafar Akun Baru".|
|Aksi / Buton|Mengetk nomor HP otomats diflter jika pengguna memasukkan angka 08 atau 628 di depan.<br>Tombol "Masuk Sistem" mengirim data ke server.|
|Relasi Backend|Hit endpoint /auth/login dengan payload phone dan password. Mengembalikan Access Token yang<br>disimpan di perangkat untuk menjaga sesi (session). Berlaku untuk seluruh role, termasuk<br>Mahasiswa KKN (login memakai Nomor HP + password, bukan NIM).|



#### **Halaman Daftar Akun / Register (register_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Dropdown Role: hanya menampilkan opsi Warga dan Petugas Pemilahan (pendafaran Mahasiswa<br>hanya via Web Admin); Form Teks: Nama Lengkap, Nomor HP (prefx +62), Kata Sandi; Dropdown<br>Berjenjang wajib (khusus Warga): Kecamatan -> Kelurahan -> RW -> RT; Input wajib "Jumlah Anggota<br>Keluarga" (familySize); Buton Utama "DAFTAR SEKARANG".|
|Aksi / Buton|Mengunci pilihan RT/RW sebelum Kecamatan dipilih. Tombol "Dafar" memvalidasi kelengkapan<br>form sebelum submit.|
|Relasi Backend|Wilayah yang dipilih (Kelurahan & RW) menjadi Foreign Key ke tabel teritorial. Warga tdak<br>mendafar sebagai individu, melainkan sebagai enttas Satu Rumah Tangga (Household) yang dikunci<br>pada RW terpilih, dengan kolom familySize tersimpan di data Household. Dampak di Web Admin:<br>warga yang mendafar langsung tercatat sebagai "milik" Admin RW terkait; Admin RW di Web<br>langsung melihat penambahan 1 jumlah warga.|



#### **Lupa Password (forgot_password_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Form Input Nomor HP, Buton "Kirim Kode OTP", Input OTP (kotak-kotak angka), Form Password<br>Baru.|
|Aksi / Buton|Mengirim permintaan kode verifkasi setelah nomor HP diisi, lalu submit password baru setelah OTP<br>tervalidasi.|
|Relasi Backend|Meminta kode verifkasi OTP ke server via SMS/WhatsApp. Setelah valid, mengirim password baru<br>untuk ditmpa di database.|



### **11.2 Role: Warga (Pengguna Utama)** 

**Beranda / Dashboard Warga (beranda_view.dart & dashboard_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Header: sapaan "Halo, [Nama]" dan foto profl; Kartu Saldo menampilkan Total Poin berdesain hijau;<br>Indikator Bin: bar persentase (0%-100%) untuk Bin Organik dan Anorganik; Buton Utama Melayang<br>(FAB) "SCAN SAMPAH" (ikon kamera); Buton Sekunder "Ajukan Pengosongan" (muncul jika<br>indikator bin merah/penuh); Kartu "Statstk Saya" menampilkan metrik tambahan "Akurasi AI (Rata-<br>rata)"; Dafar Riwayat Mini: 3 transaksi terakhir.|
|Aksi / Buton|Tap FAB membuka alur scan sampah; tap "Ajukan Pengosongan" mengirim permintaan reset bin.|
|Relasi Backend|Indikator persentase bin ditarik dari tabel Bin milik Household warga tersebut. Warga adalah<br>"pemilik" sah dari tempat sampah fsik di rumahnya. Metrik "Akurasi AI (Rata-rata)" dihitung di sisi<br>klien dari nilai aiConfdence yang dikirim endpoint riwayat sampah Warga (/transactons/my-<br>deposits), sehingga selaras dengan data yang dievaluasi Mahasiswa KKN di halaman Monitoring.|



#### **Deteksi AI & Scan QR Bin (scan_flow_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Layar 1 (Kamera Sampah): jendela kamera untuk memfoto sampah, Buton "Jepret"; Layar 2 (Hasil<br>Prediksi AI): teks hasil (misal Botol Plastk, 0.5 Kg, Prediksi 50 Poin), Buton "Lanjut Scan QR Bin";<br>Layar 3 (Kamera QR): memindai stker QR yang tertempel di Bin.|
|Aksi / Buton|Jepret foto -> submit ke AI -> lanjut ke scan QR bin -> commit transaksi.|
|Relasi Backend|Layar 1 (AI) menembak endpoint /waste/detect ke server AI. Layar 3 (QR): koordinat GPS ponsel<br>dikirim ke server untuk divalidasi dengan fungsi Haversine Geofencing (jarak harus <=10 meter dari<br>ttk Bin terdafar). Dampak Web Admin: jika lolos, tabel WasteLog bertambah, PointHistory<br>bertambah, kapasitas Bin naik, dan peta Admin Web diperbarui (Bin mulai terisi).|



**Poin & Leaderboard (poin_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Menampilkan Saldo Poin besar; di bawahnya dafar Leaderboard (Peringkat 1, 2, 3...) berisi foto<br>avatar tetangga satu RW dan jumlah poin mereka.|
|Aksi / Buton|Scroll untuk melihat peringkat lengkap.|
|Relasi Backend|Query agregasi total poin berelasi pada enttas RW. Web Admin dapat melihat peringkat ini untuk<br>program reward warga tngkat desa.|



#### **Riwayat Pemilahan (riwayat_view.dart & catatan_kegiatan_warga_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Dafar transaksi (List View). Tiap baris menunjukkan ikon jenis sampah (Organik/Anorganik), tanggal,<br>jam, berat (Kg), dan poin didapat (ditandai "+").|
|Aksi / Buton|Scroll/flter dafar riwayat.|
|Relasi Backend|Murni Read-Only dari tabel WasteLog untuk ID warga yang login.|



**Profil & Kelola Bin (profil_view.dart & kelola_bin_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Tombol Gant Foto, Ubah Data Diri, Buton "Logout"; kolom baru "Nama Mahasiswa Pendamping"<br>(display only). Halaman Kelola Bin menampilkan kode seri Bin yang dimiliki warga.|
|Aksi / Buton|Tap "Logout" menghapus sesi; ubah foto/data diri mengirim update ke server.|
|Relasi Backend|Menghapus sesi lokal saat logout. Update relasi User jika mengubah foto. Nama Mahasiswa<br>Pendamping diambil dari endpoint GET /households/me atau /auth/login (nama Mahasiswa KKN<br>yang ditugaskan ke RW warga); jika belum ada mahasiswa yang di-assign, backend merespons null.|



### **11.3 Role: Mahasiswa KKN (Agen Lapangan)** 

_Catatan: akun Mahasiswa KKN dibuatkan oleh Admin dari Web (bukan self-register), dan login menggunakan Nomor HP + password._ 

#### **Dashboard KKN (mahasiswa_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Header: nama mahasiswa, nama kelompok, nama DPL (Dosen Pembimbing); Teks metrik "Progress<br>Aktvasi: X Warga" dan "Total Poin Terkumpul: Y Poin"; Grid Buton Menu (4 kotak): "Aktvasi<br>Warga", "Dafar Binaan", "Presensi Kegiatan", "Laporan DPL".|
|Aksi / Buton|Tap salah satu dari 4 menu untuk masuk ke ftur terkait.|
|Relasi Backend|Mengambil agregasi dari tabel KelompokKKN. Relasi ini pentng karena Web Admin mengukur KPI<br>kampus dari angka-angka di dashboard ini.|



#### **Aktivasi Bin Warga (aktivasi_warga_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Scanner QR, Input Nomor Seri Bin (jika kamera rusak), Input Dimensi Tong Sampah (Tinggi x Lebar),<br>Buton "Aktvasi & Bind".|
|Aksi / Buton|Scan/isi nomor seri -> isi dimensi -> tap "Aktvasi & Bind" untuk menyimpan.|
|Relasi Backend|Menyatukan Warga dengan Mahasiswa di tabel WargaDampingan (warga resmi menjadi "Binaan"<br>mahasiswa tersebut). Mengubah status tabel Bin warga menjadi ACTIVE dan menetapkan ttk<br>koordinat absolut (GPS) Bin tersebut.|



**Daftar & Monitoring Warga (daftar_warga_view.dart & monitoring_warga_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|List nama-nama warga (binaan) dengan badge warna: Hijau (Rajin), Kuning (Perlu Perhatan), Merah<br>(Sering Salah Pemilahan). Buton "Detail Riwayat" tap warga. Tidak ada input RW manual — dafar<br>otomats tersaring sesuai wilayah penugasan Mahasiswa yang login.|
|Aksi / Buton|Tap "Detail Riwayat" membuka halaman detail per warga.|
|Relasi Backend|Hanya memunculkan warga yang wargaId-nya berelasi ke mahasiswaId di tabel WargaDampingan.<br>Aplikasi otomats menarik (GET) parameter kelurahan dan rw dari profl Mahasiswa yang login;<br>endpoint monitoring memflter agar hanya mengembalikan warga dengan domisili persis sama<br>dengan wilayah penugasan — Mahasiswa dilarang melihat/mengaktvasi Bin warga di RW lain.<br>Admin Web bisa mengecek warga mana yang sering gagal scan AI (misal buang botol ke organik).|



#### **Presensi Kehadiran (kkn_attendance_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Peta interaktf menampilkan radius biru (Area Posko KKN); Timer Countdown (hitung mundur);<br>Buton "Absen Hadir" berwarna abu-abu (disable) dan berubah hijau (enable) jika mahasiswa masuk<br>radius dan waktu habis.|
|Aksi / Buton|Tunggu hingga posisi masuk radius dan tmer selesai -> tap "Absen Hadir".|
|Relasi Backend|Check-in GPS langsung di-insert ke tabel JadwalKegiatan. Dosen DPL di Web Admin akan melihat Log<br>Kehadiran "Valid" atau "Invalid".|



#### **Form Laporan & Izin (pemanfaatan_sampah_view.dart & pengajuan_izin_form_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Dropdown (Izin Sakit / Izin Kampus / Lapor Kompos), Textbox Deskripsi Panjang, Kotak Upload Foto,<br>Buton "Kirim ke DPL".|
|Aksi / Buton|Isi form -> upload foto -> tap "Kirim ke DPL" untuk submit.|
|Relasi Backend|Data dikirim dengan status PENDING. Di Web Admin, layar DPL memunculkan Pop-up/Notfkasi<br>meminta Approval atas izin atau laporan mahasiswa ini.|



### **11.4 Role: Petugas Pemilahan (Operator Hilir)** 

#### **Dashboard Petugas (petugas_pemilahan_dashboard_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Header: langsung tampil Speedometer Skor KPI setelah login; Kartu Total "Total Tonase Hari Ini (Kg)";<br>Buton Menu Terpusat: "Jadwal Penjemputan", "Input Timbangan Truk", "Histori".|
|Aksi / Buton|Tap salah satu menu untuk langsung masuk ke ftur terkait (tdak ada penguncian approval).|
|Relasi Backend|Tidak ada lagi feld whitelistStatus untuk Petugas Pemilahan — akun otomats berstatus aktf penuh<br>sejak registrasi berhasil.|



**Daftar Pengajuan & Terima Tugas (daftar_pengajuan_reset_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|List Card berisi seluruh pengajuan pengosongan bin dari Warga yang berstatus PENDING di zona<br>penugasan Petugas: nama/alamat warga, foto bukt bin penuh dari Warga, level prioritas (badge<br>"HIGH VOLUME" jika ≥70%), dan tombol "Terima Tugas" di tap card.|
|Aksi / Buton|Tap "Terima Tugas" pada satu pengajuan -> status pengajuan berubah dari PENDING menjadi<br>DIPROSES dan otomats ditugaskan ke Petugas yang menerima (assignedPetugasId terisi) -> pengajuan<br>pindah ke dafar "Jadwal Penjemputan Saya" dan tdak lagi muncul di dafar Petugas lain -> tombol<br>berubah jadi "Mulai Timbang" yang mengarahkan ke Form Input Timbangan Fisik.|
|Relasi Backend|PUT ke endpoint terima tugas mengubah bin_reset_requests.status: PENDING -> DIPROSES dan<br>mengisi bin_reset_requests.assigned_petugas_id. Mencegah dua Petugas mengerjakan pengajuan<br>yang sama (race conditon) karena begitu satu Petugas menerima, card otomats hilang dari dafar<br>Petugas lain. Jika Petugas gagal datang/batal, ada opsi "Lepas Tugas" yang mengembalikan status ke<br>PENDING agar bisa diambil Petugas lain.|



#### **Form Input Timbangan Fisik (timbangan_residu_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Kamera untuk memotret sampah/tmbangan di bak truk; Kotak Input Angka "Masukkan Berat (Kg)";<br>Dropdown Klasifkasi "B3" atau "Non-B3"; Buton Utama Hijau "SUBMIT TIMBANGAN".|
|Aksi / Buton|Foto -> input berat -> pilih klasifkasi -> tap "SUBMIT TIMBANGAN".|
|Relasi Backend|SANGAT KRUSIAL: saat tombol Submit ditekan, data masuk ke tabel ResiduSubmitLog. Trigger<br>database terjadi: kapasitas Bin milik warga/RW yang barusan dijemput otomats direset ke 0%<br>(kosong). Dampak Web Admin: notfkasi merah "Bin Kepenuhan" di peta Web Admin langsung<br>hilang dan berubah hijau (Aman); poin kinerja petugas bertambah.|



#### **Riwayat & Poin Petugas (riwayat_petugas_pemilahan_view.dart & petugas_pemilahan_poin_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Tabel data berisi Jam Angkut, RW Tujuan, dan Total Kg; opsi Filter Kalender (Dari tanggal - Sampai<br>tanggal).|
|Aksi / Buton|Atur flter tanggal untuk menyaring data yang ditampilkan.|
|Relasi Backend|Cerminan langsung dari laporan yang ada di Web Admin. Data di page ini persis dengan data yang<br>akan diekspor menjadi format PDF/Excel bulanan oleh Dinas LH.|



#### **Tentang Aplikasi (tentang_aplikasi_view.dart)** 

|**Aspek**|**Keterangan**|
|---|---|
|Isi UI|Halaman stats berisi versi aplikasi, logo developer, dan penjelasan singkat Terms & Conditon (S&K)<br>TrashCare.|
|Aksi / Buton|Tidak ada aksi selain scroll/kembali.|
|Relasi Backend|Murni frontend tanpa relasi database.|



_Dokumen ini disusun berdasarkan gabungan dokumentasi fitur Warga, Mahasiswa KKN, dan Petugas Pemilahan — mencakup model data, alur bisnis, endpoint API, dan analisis risiko sistem TrashCare._ 

