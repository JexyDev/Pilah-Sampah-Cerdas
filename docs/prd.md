# Product Requirement Document (PRD) — BERSEKA

## 1. Pendahuluan
### 1.1 Deskripsi Produk
**BERSEKA (BERSEKA)** adalah sistem pemilahan sampah cerdas terintegrasi untuk Kecamatan Coblong, Kota Bandung. Platform ini mengotomatisasi pendataan, pemilahan dengan AI, pemantauan kapasitas tempat sampah, serta penimbangan residu secara akurat. Produk ini menghubungkan Warga, Mahasiswa KKN, DPL, Petugas Residu, RW, Lurah, Camat, Admin DLH, dan SUPER USER dalam satu ekosistem terpadu.

### 1.2 Platform & Arsitektur Akses Role
- **Aplikasi Mobile (Thin Client - Flutter):** Digunakan secara terbatas oleh role **Warga**, **Mahasiswa KKN**, dan **Petugas Residu**. Berfokus pada aksi lapangan cepat (Scan QR tempat sampah, Deteksi AI, Foto Bukti, Location Ping KKN, & Input Setoran/Residu).
- **Aplikasi Web (Superset Dashboard - React/Vite):** Digunakan oleh **RW, Lurah, Camat, Admin DLH, SUPER USER**, serta **Petugas Residu** dan role lainnya sebagai superset untuk monitoring visual, dasbor analitik, GIS geospasial, dan manajemen data.
  - *Read-Only Guard:* Role Admin DLH, Camat, dan Lurah dibatasi secara ketat menjadi **Read-Only** (monitoring visual & scoping wilayah), kecuali fitur approval diskrepansi AI khusus Admin DLH.

### 1.3 Standar Identifikasi & Autentikasi User (Tanpa NIK & Universal Phone Auth)
Seluruh identifikasi dan autentikasi pengguna di platform **bebas NIK**:
* **Universal Auth Identifier:** **SELURUH Role (100%)** (Warga, Mahasiswa KKN, DPL, Petugas Residu, RW, Lurah, Camat, Admin DLH, SUPER USER) menggunakan **Nomor Telepon (+62)** untuk login utama (OTP WhatsApp / Kredensial).
* **NIM & NIP:** Disimpan sebagai data profil / metadata tambahan untuk Mahasiswa KKN (`nim`) & DPL (`nip`).
* **NIK:** DIHAPUS TOTAL dari seluruh tabel database, UI, endpoint API, dan formulir aplikasi.

### 1.4 Masalah yang Diselesaikan
1. **Ketidakdisiplinan Pemilahan:** Sampah organik kerap tercampur dengan anorganik sehingga merusak proses daur ulang (diatasi dengan AI Classifier & Validasi QR tempat sampah).
2. **Tempat Sampah Meluber:** Tempat sampah penuh memicu notifikasi push ke Petugas & RW dan memberi marker merah pada peta geospasial.
3. **Penyusutan Data Timbulan:** Data timbulan sampah fisik dihitung akurat menggunakan penimbangan industri fisik oleh Petugas Residu.
4. **Data Tidak Terpusat:** Monitoring hirarkis (RT/RW -> Kelurahan -> Kecamatan -> Kota/DLH) terintegrasi pada dasbor web geospasial.

---

## 2. Ketentuan Kepemilikan, State Machine, & Aktivasi Tempat Sampah Warga

### 2.1 Dual Bins per Rumah
Setiap rumah tangga Warga memiliki maksimal **2 tempat sampah**:
- 1 Tempat Sampah **Organik** (QR Code tersendiri).
- 1 Tempat Sampah **Anorganik** (QR Code tersendiri).
- *Catatan:* Residu **tidak dibuatkan tempat sampah di rumah warga** (residu ditimbang di hilir oleh Petugas Residu).

### 2.2 State Machine Tempat Sampah (Bin Lifecycle - Otomatis Aktif, Tanpa Approval RW)
1. **`PRINTED` / `BELUM_DIGUNAKAN`:** QR Code fisik dicetak dan siap didistribusikan.
2. **`ASSIGNED_TO_PIC` / `DIPEGANG_MAHASISWA`:** Mahasiswa KKN memindai QR pertama kali saat diterjunkan ke lapangan (+ merekam GPS Mahasiswa).
3. **`ACTIVE_BOUND` (Otomatis Langsung Aktif):** Saat pendaftaran warga / scan tempat sampah oleh Mahasiswa KKN atau Warga -> koordinat GPS direkam permanen dan status bin **otomatis langsung berubah menjadi `ACTIVE_BOUND`** (tanpa persetujuan RW, persetujuan/approval QR di-skip). Poin bonus ditambahkan secara atomik (+10 Poin Warga, +10 Poin Mahasiswa).
5. **Masa Aktif 30 Hari & Reset:** Tempat sampah aktif selama 30 hari. Masa aktif di-reset otomatis setiap kali warga mengunggah foto setoran + memindai QR + disetujui pengambilan.
6. **`TIDAK AKTIF` (Expired):** Jika 30 hari tanpa aktivitas, status bin berubah menjadi TIDAK AKTIF. Warga tidak bisa melakukan penyetoran dan wajib mengajukan aktivasi ulang yang diverifikasi & disetujui oleh RW.
7. **`BROKEN`:** Tempat sampah rusak dapat ditandai oleh RW -> QR non-aktif secara permanen.

---

## 3. Alur Pengguna (User Flow)

### 3.1 Penyetoran Sampah & Rumus Poin Warga (Aplikasi Mobile)
1. **Foto Sampah:** Warga mengambil foto sampah yang akan dibuang.
2. **Verifikasi AI:** Foto dikirim ke AI Service. AI mengembalikan klasifikasi (`ORGANIC` / `NON_ORGANIC`) dan confidence score (0.0 – 1.0).
3. **Scan QR Tempat Sampah:** Warga memindai QR Code pada tempat sampah fisik. Jenis sampah AI wajib cocok dengan jenis tempat sampah.
4. **Validasi Geofencing:** Backend mengecek koordinat GPS pengguna (<= 10 meter dari lokasi rumah terdaftar).
5. **Kirim Transaksi & Rumus Poin (Ledger Terpisah):**
   - Volume (L) dikonversi ke Berat (Kg): `ORGANIC = 0.4 kg/L`, `NON_ORGANIC = 0.2 kg/L`.
   - Formula Poin: 
     $$\text{Poin} = \text{Berat (Kg)} \times 100 \times \text{Confidence AI} \times 0.9$$
   - Poin murni gamifikasi (`redeemable: false`) dan dicatat pada ledger terpisah.

### 3.2 Penjemputan, Window Waktu, & Eskalasi Otomatis
1. **Window Waktu Operational:** Pengangkutan dilakukan pada jendela waktu **06:00–08:00** dan **16:00–18:00 WIB**.
2. **Notifikasi Meluber:** Foto tempat sampah penuh memicu notifikasi push ke Petugas & RW serta penandaan marker merah di peta GIS.
3. **Eskalasi Otomatis:** Jika petugas tidak mendokumentasikan pengangkutan dalam window waktu, notifikasi eskalasi dikirim secara hierarkis (RW -> Lurah -> Camat -> Admin DLH).

### 3.3 Rule of Discrepancy & Timbangan Petugas Residu
1. Hasil timbangan sampah diinput **secara manual** oleh Petugas Residu dari timbangan fisik industri.
2. Jika input manual petugas berbeda signifikan dari klasifikasi AI (dengan AI confidence >90%), status setoran masuk `PENDING_REVIEW` untuk dievaluasi oleh Admin DLH.

---

## 4. Master Data & Bulk Actions

### 4.1 Bulk Generate Bins (Pre-Registration)
- Menghasilkan ID Tempat Sampah dan Serial QR secara massal untuk dicetak stiker fisik.

### 4.2 Bulk Import & Assign Bins
- Mengimpor file Excel/CSV berisi pemetaan tempat sampah ke Warga / Mahasiswa KKN.

---

## 5. Gamifikasi & Leaderboard
- **Skor Kepatuhan Warga:** $\text{Compliance Score} = (0.5 \times \text{OnTimeSubmissionRate}) + (0.5 \times \text{Average AI Confidence})$.
- **Papan Peringkat (Leaderboard):** Warga berperingkat berdasarkan Poin Terbanyak; RT/RW & Kelurahan berperingkat berdasarkan Total Volume (Kg) terkelola. Periode: All-time & Real-time (Publik).
