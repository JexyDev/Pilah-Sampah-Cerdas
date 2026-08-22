KKN Berdampak Coblong | BERSEKA 

# **TERM OF REFERENCE (TOR)** 

## **PENGEMBANGAN SISTEM INFORMASI BERBASIS WEB BERSEKA - KKN BERDAMPAK COBLONG** 

_Platform Tata Kelola Sampah Rumah Tangga, Perubahan Perilaku, Gamifikasi, Monitoring, dan Dampak_ 

#### **Fokus Sistem** 

Mendukung alur Pilah - Scan - Setor - Dapat Poin - Lihat Dampak melalui QR House ID, pencatatan aktivitas, gamifikasi, <u>monitoring KPI, dan dashboard berbasis role.</u> 

|**Elemen**|**Keterangan**|
|---|---|
|Lokasi Implementasi|Kecamatan Coblong, Kota Bandung|
|Program|KKNBerdampakUNIKOM|
|Platform|BERSEKA|
|Jenis Sistem|WebResponsive /Progressive WebApp (PWA)|
|Pengguna|Super Admin, Pimpinan, DPL, Mahasiswa, RT/RW,<br>Kelurahan/Kecamatan,Petugas/Kader, Warga|
|Tahun Akademik|2025-2026|



**KKN BERDAMPAK UNIKOM x BERSEKA Dari Rumah - Menjadi Data - Menjadi Kebiasaan - Menjadi Dampak** 

TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

KKN Berdampak Coblong | BERSEKA 

### **I. LATAR BELAKANG** 

Program KKN Berdampak di Kecamatan Coblong menempatkan perubahan perilaku pemilahan sampah rumah tangga sebagai fokus utama. Sistem informasi dibutuhkan bukan hanya untuk administrasi kegiatan, tetapi sebagai instrumen operasional yang menghubungkan rumah tangga, mahasiswa, RT/RW, petugas sampah, DPL, pemerintah wilayah, dan pengelola program dalam satu alur data yang terukur. 

Sistem BERSEKA dirancang untuk menerjemahkan TOR program ke dalam proses digital: registrasi rumah, baseline, QR House ID, pencatatan pemilahan, pengumpulan terpisah, validasi, gamifikasi, monitoring indikator, feedback, challenge, reward, evaluasi endline, hingga pelaporan dampak. 

#### **Prinsip UX Utama** 

Teknologi boleh kompleks di belakang sistem, tetapi pengalaman pengguna lapangan harus sederhana: Pilah -> Scan -> Setor -> <u>Dapat Poin -> Lihat Dampak.</u> 

### **II. TUJUAN PENGEMBANGAN SISTEM** 

1. Menyediakan platform digital terintegrasi untuk mendukung pelaksanaan KKN Berdampak bidang tata kelola sampah. 

2. Mendigitalisasi proses baseline, onboarding, QR House ID, pemilahan, pengumpulan, validasi, dan endline. 

3. Menyediakan sistem gamifikasi untuk memperkuat kepatuhan dan konsistensi perilaku rumah tangga. 

4. Menyediakan dashboard KPI dan dampak pada tingkat rumah, RT, RW, kelurahan, kecamatan, DPL, dan pimpinan. 

5. Mendukung pengambilan keputusan berbasis data dan intervensi perilaku yang lebih tepat sasaran. 

6. Menyediakan mekanisme pelaporan, audit, keamanan, dan keberlanjutan pasca-KKN. 

### **III. RUANG LINGKUP SISTEM** 

|**Domain**|**Ruang Lingkup**|
|---|---|
|Data Wilayah|Kelurahan, RW, RT, rumah tangga, QR House ID, peta wilayah.|
|KKN & Pendampingan|Kelompok KKN, mahasiswa, DPL, wilayah binaan, baseline,<br>pendampingan, kegiatan, endline.|
|Pemilahan|Scan QR, input aktivitas, kategori organik/anorganik/residu,<br>verifikasi kualitas.|
|Pengumpulan|Jadwal, titik pengumpulan, bank sampah/recycler, audit, Smart<br>Waste Point opsional.|
|Gamifikasi|Green Point, streak, badge,level, challenge,leaderboard,reward.|
|Dampak|HSCR, consistency rate, waste diversion, organic recovery,<br>recycling,residual reduction, WSCS.|
|Laporan|Harian, mingguan, bulanan, RT/RW, kelurahan, kecamatan,<br>laporanakhir KKN.|
|Administrasi|User, role, hak akses, master data, audit log, backup, konfigurasi.|



### **IV. PENGGUNA DAN ROLE AKSES** 

|**Role**|**Kebutuhan Utama**|**Karakter UI**|
|---|---|---|
|Super Admin|Konfigurasi sistem, master, user, role,<br>aturangamifikasi, audit, backup.|Desktop dashboard lengkap.|
|Pimpinan / Task Force|Melihat indikator strategis, capaian,<br>dampak, wilayah,laporan.|Executive dashboard ringkas.|
|DPL|Supervisi kelompok, validasi, progres<br>wilayah,intervensi, evaluasi.|Dashboard supervisi.|
|Mahasiswa KKN|Baseline, onboarding, pendampingan, scan,<br>input, validasi, dokumentasi.|Mobile-first operasional.|
|RT/RW|Monitoring rumah, pengumpulan,<br>challenge,leaderboard,laporanwilayah.|Dashboard komunitas.|
|Kelurahan/Kecamatan|Monitoring agregat, dampak, replikasi,|Dashboard agregat.|



TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

|||KKN Berdampak Coblong |BERSEKA|
|---|---|---|
||laporan.||
|Petugas/Kader|Scan QR, verifikasi, timbang, jadwal,<br>kendala.|Mobile web sederhana.|
|Warga|Poin, streak, badge, challenge, aktivitas,<br>dampakpribadi.|PWA mobile sangat sederhana.|



### **V. STRUKTUR MENU UTAMA** 

|**Menu Utama**|**Submenu**|
|---|---|
|Dashboard|Ringkasan KPI, tren,ranking, alert, progres.|
|Wilayah & Rumah|Wilayah, Rumah Tangga, QR House ID, Peta Wilayah.|
|KKN & Pendampingan|Kelompok KKN, Mahasiswa, DPL, Baseline, Pendampingan,<br>Kegiatan, Endline.|
|Pemilahan|ScanQR,InputAktivitas,Riwayat, Validasi.|
|Pengumpulan|Jadwal, Titik Pengumpulan, Smart Waste Point, Bank Sampah,<br>Audit.|
|Gamifikasi|Green Point, Streak, Badge, Level, Challenge, Leaderboard,<br>Reward.|
|Dampak|KPI, Kepatuhan, WSCS, Waste Diversion, Organik, Recycling,<br>Residu, Baseline vsEndline.|
|Laporan|Mingguan, Bulanan, RT/RW, Kelurahan, Kecamatan, Laporan<br>Akhir KKN.|
|Pengaturan|User & Role, Wilayah, Kategori, Aturan Poin, Device, Audit Log,<br>Backup.|



### **VI. DESAIN DASHBOARD UTAMA** 

Dashboard utama harus menjawab kondisi program hari ini secara cepat. Filter global ditempatkan di bagian atas: Kelurahan, RW, RT, dan Periode. 

|**Komponen**|**Isi**|
|---|---|
|KPI Cards|Rumah peserta, HSCR, rumah konsisten, waste diversion, sampah<br>terkelola, residu.|
|Tren Kepatuhan|Grafik HSCRper minggu/bulandibanding target.|
|Komposisi Sampah|Organik, anorganik, residu.|
|PeringkatRT/RW|Leaderboard berbasisHSCRatau WSCS agregat.|
|Perlu Perhatian|Rumah tidak aktif, penurunan HSCR, data belum valid, titik<br>pengumpulanpenuh.|
|Dampak|Perbandingan baseline-endline, total diversion, recovery,<br>recycling.|



#### **Aturan UI** 

|Dashboard tidak boleh dipenuhi grafik. Prioritaskan indikator yang dapat memicu tindakan: capaian, tren, alert, dan intervensi.|
|---|



### **VII. MODUL WILAYAH, RUMAH, DAN QR HOUSE ID** 

House ID menggunakan format anonim, misalnya CBL-RW05-RT03-0027. QR tidak menampilkan data pribadi secara terbuka. 

|**Fitur**|**Deskripsi**|
|---|---|
|Data Wilayah|CRUD kelurahan, RW, RT dan hubungan hierarkinya.|
|Data Rumah|Registrasi, status aktif, jumlah penghuni, wilayah, baseline,<br>histori.|
|Generate QR|PembuatanQR HouseID per rumahsecaraindividualataumassal.|
|Cetak QR|Template stiker/label QR siap cetak.|
|Detail Rumah|Ringkasan WSCS, Green Point, streak, level, badge, aktivitas,<br>pendampingan.|
|Import/Export|ImportExcel/CSV danexport data sesuai role.|



TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

KKN Berdampak Coblong <u>| BERSEKA</u> 

Privasi 

Pseudonymous ID untuk tampilan publik dan pembatasan data <u>personal.</u> 

### **VIII. MODUL KKN & PENDAMPINGAN** 

|**Submodul**|**Fitur Utama**|
|---|---|
|Kelompok KKN|Kelompok, anggota, wilayah binaan, progres.|
|Mahasiswa|Profil,kelompok, aktivitas, capaianpendampingan.|
|DPL|Kelompok binaan, validasi, monitoring, catatan evaluasi.|
|Baseline|Wizard identitas, perilaku, pengetahuan, hambatan, fasilitas,<br>partisipasi.|
|Segmentasi Hambatan|Knowledge, convenience,facility, trust,motivation, socialbarrier.|
|Pendampingan|Kunjungan, catatan, rekomendasi intervensi, status tindak lanjut.|
|Kegiatan|Agenda, peserta, dokumentasi,hasil.|
|Endline|Pengukuran ulang indikator dan perbandingan dengan baseline.|



### **IX. MODUL PEMILAHAN DAN SCAN QR** 

**Alur Operasional** <u>Scan QR -> Identifikasi rumah -> Pilih kategori -> Verifikasi kualitas -> Input berat -> Foto opsional -> Simpan aktivitas.</u> 

|**Field Minimum**|**Keterangan**|
|---|---|
|HouseID|Terisiotomatis setelahQRdipindai.|
|Tanggal/Waktu|Otomatis dari sistem.|
|Kategori|Organik, anorganik,residu.|
|Kualitas|Benar / perlu koreksi.|
|Berat|<br>Kilogram; opsionaljika penimbanganbelumtersedia.|
|Verifikator|Petugas/mahasiswa yang melakukan verifikasi.|
|Bukti|Foto opsional.|
|Gamifikasi|Poin dan streak dihitung otomatis setelah validasi.|



Untuk petugas lapangan, fungsi Scan QR menjadi tombol utama dan dapat diselesaikan maksimal dalam tiga langkah utama agar cepat digunakan melalui telepon genggam. 

### **X. MODUL PENGUMPULAN DAN SMART WASTE POINT** 

|**Fitur**|**Deskripsi**|
|---|---|
|Jadwal|Jadwal pengumpulan per RT/RW dan kategori.|
|Pengumpulan Hari Ini|Daftar rumah/titikyang selesaidanbelumselesai.|
|Titik Pengumpulan|Lokasi, PIC, kapasitas, alur hilir.|
|BankSampah/Recycler|Mitra, jenismaterial, transaksi/serahterima.|
|Audit|Checklist pemisahan kategori, timbangan, QR/scanner,<br>sinkronisasi, alur hilir.|
|Smart Waste Point|Status online, berat, kapasitas, level, histori, notifikasi penuh;<br>opsional.|



### **XI. MODUL GAMIFIKASI** 

Gamifikasi dipakai untuk memperkuat perilaku benar, konsistensi, identitas positif, dan norma sosial; bukan mendorong produksi sampah. 

|**Aktivitas**|**Poin**|**Validasi**|
|---|---|---|
|Setoranterpilahbenar|+10|Petugas/mahasiswa|
|Organik dipilah benar|+5|Kategori|
|Anorganikbersih/kering|+5|Kualitas|



TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

|||KKN Berdampak Coblong |BERSEKA|
|---|---|---|
|Residu tidaktercampur|+5|Kualitas|
|Konsisten mingguan|+10|Histori sistem|
|Mengikutiedukasi|+10|Daftar hadir/QR|
|Bank sampah|+10|Bukti transaksi|
|Mengolahorganik|+15|Sampling/verifikasi|
|Relawan lingkungan|+15|PIC|
|Konsisten 4 minggu|+30|Sistem|
|Konsisten 8 minggu|+50|Sistem|



|**Streak/Level**|**Kriteria**|
|---|---|
|Pilah Starter|2 minggu|
|Green Household|4 minggu|
|Eco Family|8 minggu|
|<br>Waste Champion|<br>12 minggu|
|Level Pemula|0-100 poin|
|Aktif|<br>101-250|
|Peduli|251-500|
|KeluargaHijau|501-800|
|Waste Champion Level|>800|



Leaderboard publik diprioritaskan pada agregat RT/RW, bukan nama individu, untuk menghindari kompetisi personal yang tidak sehat. 

### **XII. COMMUNITY CHALLENGE DAN REWARD** 

|**Challenge**|**Target**|
|---|---|
|30 Hari Pilah Sampah|>=80% rumah aktif pada wilayah challenge.|
|7 HariOrganik Tidak Masuk Residu|Organikdipisahkandandialihkan ke pengolahan.|
|RW 80% Taat Pilah|HSCR RW>=80%.|
|100Rumah Konsisten|100rumah memenuhitargetkonsistensi.|
|100 kg Anorganik Terkelola|Anorganik tersalurkan ke bank sampah/recycler.|



Reward dapat berbentuk badge digital, sertifikat, bibit/tanaman, produk daur ulang, komposter, alat kebersihan, fasilitas komunitas sederhana, dan pengakuan sosial pada dashboard atau forum warga. 

### **XIII. MODUL DAMPAK DAN ANALITIK** 

|**KPI**|**Definisi Sistem**|
|---|---|
|Household Participation Rate|Rumah peserta / rumah sasaran x 100%.|
|HSCR|Rumahpatuh memilah/rumahpesertax 100%.|
|Consistency Rate|Rumah konsisten / rumah peserta x 100%.|
|Waste Diversion Rate|Sampahdialihkandari residu / totaltercatatx 100%.|
|Organic Recovery Rate|Organik terolah / organik tercatat x 100%.|
|RecyclingRate|Anorganiktersalurkan/ anorganiktercatatx 100%.|
|Residual Waste Reduction|Penurunan residu terhadap baseline.|
|Data ValidityRate|Data tervalidasi/ data tercatatx 100%.|



### **XIV. WASTE SORTING COMPLIANCE SCORE (WSCS)** 

|**Komponen**|**Bobot**|**Contoh Ukuran**|
|---|---|---|
|Konsistensipemilahan|40%|Frekuensisesuaitarget.|
|Kualitas pemilahan|30%|Ketepatan kategori, anorganik<br>bersih/kering.|
|Partisipasi kegiatan|20%|Edukasi, challenge, bank sampah.|
|Kontribusi komunitas|10%|Relawan, pengolahan, dukungan<br>lingkungan.|
|**Skor**|**Status**|**Tindak Lanjut**|



TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

|||KKN Berdampak Coblong |BERSEKA|
|---|---|---|
|90-100|Sangat Baik|Penghargaan/rolemodel|
|75-89|Baik|Pertahankan dan tingkatkan|
|60-74|Berkembang|Pendampingan ringan|
|<60|Perlu Pendampingan|Identifikasi hambatan dan intervensi<br>spesifik|



### **XV. DASHBOARD BERDASARKAN ROLE** 

|**Role**|**Dashboard Utama**|
|---|---|
|Pimpinan|Jumlah wilayah, peserta, HSCR, waste diversion, baseline-current,<br>tren dampak, laporan.|
|DPL|Kelompok binaan, mahasiswa, rumah, progres<br>baseline/onboarding, HSCR, alert validasi.|
|Mahasiswa|Tugas hari ini, rumah binaan, baseline, scan, pendampingan, data<br>belum lengkap.|
|RT/RW|Rumah aktif, rumah perlu pendampingan, pengumpulan,<br>challenge, leaderboard, dampak wilayah.|
|Petugas/Kader|ScanQR, jadwal hari ini, timbang,inputmanual,lapor kendala.|
|Warga|Green Point, streak, level, badge, aktivitas minggu ini, challenge,<br>dampakpribadi.|



### **XVI. UI/UX DESIGN GUIDELINE** 

- Clean, minimalis, responsif, dengan dominasi putih, biru sebagai warna teknologi/kepercayaan, dan hijau sebagai aksen lingkungan. 

- Mobile-first untuk mahasiswa, petugas, kader, dan warga; desktop-first untuk admin, DPL, pimpinan, dan pemerintah wilayah. 

- Gunakan maksimal 3 langkah untuk tugas lapangan utama seperti scan dan pencatatan. 

- Gunakan label kategori yang konsisten: hijau - organik, biru - daur ulang/anorganik, abu - residu. 

- Hindari tabel terlalu padat; prioritaskan kartu KPI, filter, visual tren, dan action list. 

- Gunakan progressive disclosure: detail muncul setelah pengguna memilih objek/rumah/wilayah. 

- Notifikasi diprioritaskan berdasarkan Critical, Action Required, Behavior Intervention, Positive Feedback, dan Achievement. 

### **XVII. ROLE BASED ACCESS CONTROL (RBAC)** 

|**Modul**|**Admin**|**Pimpinan**|**DPL**|**Mahasiswa**|**RT/RW**|**Petugas**|**Warga**|
|---|---|---|---|---|---|---|---|
|Dashboard|Full|View|View|View|View|View|Own|
|Rumah|Full|Agregat|View|CRUD<br>wilayah|CRUD<br>wilayah|View|Own|
|Baseline|Full|Agregat|Validate|CRUD|View|-|-|
|ScanQR|Full|-|-|Ya|-|Ya|-|
|Gamifikasi|Config|View|View|View|View|View|Own|
|Dampak/KPI|Full|Agregat|Wilayah|Wilayah|Wilayah|-|Own|
|Laporan|Full|Ya|Ya|Ya|Ya|Terbatas|-|
|Pengaturan|Full|-|-|-|-|-|-|



### **XVIII. ALUR SISTEM END-TO-END** 

Rumah Tangga -> Pemilahan 3 Kategori -> QR House ID -> Scan -> Verifikasi -> Penimbangan -> Pengumpulan Terpisah -> BERSEKA Database -> Green Point/Streak/Badge/WSCS/KPI -> Dashboard Dampak -> Feedback/Challenge/Reward -> Perilaku Berulang -> Kebiasaan. 

TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

KKN Berdampak Coblong | BERSEKA 

Alur hilir dipisahkan menjadi: organik ke pengolahan; anorganik ke bank sampah/recycler; residu ke TPS/TPA sesuai sistem setempat. 

### **XIX. KEBUTUHAN NONFUNGSIONAL** 

|**Aspek**|**Kebutuhan**|
|---|---|
|Keamanan|HTTPS, password hash, RBAC, session management, audit log.|
|Privasi|Minimisasi data, House ID anonim, pembatasan data personal<br>berdasarkan role.|
|Kinerja|Dashboard utama <3 detik pada kondisi koneksi normal;<br>pagination untuk data besar.|
|Responsif|Berfungsibaikpada desktop, tablet, dansmartphone.|
|Availability|Backup berkala, mekanisme restore, health monitoring.|
|Offline/Low Connectivity|Pencatatan cadangan atau queue lokal untuk sinkronisasi ulang,<br>khusus operasi lapangan.|
|Auditabilitas|Setiap perubahanpentingmenyimpanuser, waktu, aksi, danobjek.|
|Ekspor|PDF/Excel untuk laporan dan data sesuai izin role.|



### **XX. ARSITEKTUR TEKNIS REKOMENDASI** 

|**Layer**|**Rekomendasi**|
|---|---|
|Frontend|Responsive web / PWA; komponen role-based; mobile-first untuk<br>operasi lapangan.|
|Backend|REST API atau service layer terstruktur dengan autentikasi dan<br>RBAC.|
|Database|Relational database untuk user, wilayah, rumah, aktivitas,<br>gamifikasi,KPI,laporan.|
|Storage|Object/file storage untuk foto dan dokumen.|
|Integration|QR generator/scanner; Smart Waste Point opsional melalui<br>API/IoT gateway.|
|Reporting|Generator PDF/Exceldandashboard agregat.|
|Deployment|Cloud/VPS dengan SSL, backup, monitoring, staging dan<br>productionenvironment.|



### **XXI. TAHAPAN PENGEMBANGAN** 

|**Fase**|**Aktivitas**|**Output**|
|---|---|---|
|1.Requirement|Validasi TOR,role, data, alur,KPI.|SRS/BRDfinal.|
|2. UX/UI|Information architecture, wireframe,<br>prototype.|Prototype disetujui.|
|3. Core Development|User, wilayah, rumah, KKN, scan,<br>aktivitas.|MVP.|
|4. Gamification & KPI|Poin, streak, badge, challenge, WSCS,<br>dashboard.|MVP lengkap.|
|5. Reporting & Integration|Laporan, QR, Smart Waste opsional.|Release candidate.|
|6. Testing|Functional, role access, usability, security<br>basic, UAT.|UAT sign-off.|
|7. Deployment|Production, akun, data awal, training.|Go-live.|
|8. Operation|Support, monitoring, perbaikan, evaluasi.|Sistem stabil & berkelanjutan.|



### **XXII. ACCEPTANCE CRITERIA** 

- Setiap role hanya dapat mengakses menu dan data sesuai otoritas. 

- QR House ID dapat dibuat, dipindai, dan terhubung ke rumah yang benar. 

- Aktivitas pemilahan dapat dicatat dan divalidasi dengan histori yang dapat diaudit. 

- Green Point, streak, badge, level, challenge, dan leaderboard dihitung sesuai aturan. 

TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

KKN Berdampak Coblong | BERSEKA 

- KPI utama dan WSCS dapat dihitung dari data yang valid. 

- Dashboard dapat difilter berdasarkan wilayah dan periode. 

- Laporan dapat diekspor ke PDF/Excel sesuai hak akses. 

- Tampilan utama berfungsi baik pada smartphone dan desktop. 

- Baseline-endline dapat dibandingkan dan menghasilkan ringkasan perubahan. 

- Backup, audit log, dan mekanisme pemulihan tersedia. 

### **XXIII. OUTPUT PENGEMBANGAN** 

|**No**|**Luaran**|
|---|---|
|1|Dokumen kebutuhan sistem / SRS.|
|2|Desain informationarchitecture dan rolematrix.|
|3|UI/UX design system dan prototype.|
|4|Webresponsive/PWA BERSEKA.|
|5|Database dan API/backend.|
|6|QR HouseID.|
|7|Modul gamifikasi.|
|8|DashboardKPIdandampak.|
|9|Modul laporan.|
|10|Dokumentesting/UAT.|
|11|Manual pengguna per role.|
|12|Dokumendeployment, backup, dan maintenance.|



### **XXIV. INDIKATOR KEBERHASILAN SISTEM** 

|**Indikator**|**Target Kualitatif**|
|---|---|
|Adopsi|Pengguna utama mampu menjalankan tugas sesuai role tanpa<br>ketergantungan tinggi pada admin.|
|Data|Aktivitas penting tercatat, tervalidasi, dapat ditelusuri.|
|Operasional|Scan dan pencatatan lapangan cepat serta sederhana.|
|Analitik|KPIdanbaseline-endline tersedia untukevaluasi.|
|Behavior Support|Gamifikasi dan feedback bekerja sesuai skenario perubahan<br>perilaku.|
|Sustainability|Akun, SOP, data, dan dashboard dapat dialihkan ke kader/RT/RW<br>pasca-KKN.|



### **XXV. PENUTUP** 

BERSEKA dirancang sebagai sistem operasional KKN Berdampak yang menghubungkan aktivitas rumah tangga dengan data, pendampingan, gamifikasi, pengumpulan, evaluasi, dan dampak. Nilai utama sistem bukan pada banyaknya fitur, tetapi pada kemampuannya membuat perilaku pemilahan lebih mudah, terukur, konsisten, memperoleh umpan balik, dan dapat dipertahankan setelah periode KKN selesai. 

#### **Arah Akhir Sistem** 

<u>KKN -> Rumah -> Perilaku -> Sampah -> Data -> Gamifikasi -> Intervensi -> Dampak -> Kebijakan.</u> 

TOR Pengembangan Sistem Informasi Berbasis Web BERSEKA 

