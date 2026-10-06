# SURAT PERINTAH KERJA (WORK ORDER) - PENGEMBANGAN FITUR TONG KOMUNAL TPS

**Kepada:** Tim Backend Berseka  
**Dari:** Tim Mobile Berseka  
**Status Desain:** **FINAL (APPROVED FOR DEVELOPMENT)**  
**Konteks:** Menindaklanjuti kesepakatan arsitektur terkait pengadaan Tong Komunal (Hanya Organik) di TPS yang dikelola oleh role Petugas.  

Melalui dokumen ini, Tim Mobile menyatakan sepakat 100% terhadap arsitektur yang diusulkan oleh Tim Backend. Untuk memastikan tidak ada *miss-communication* dan eksekusi berjalan sesuai standar operasional (SOP), harap kerjakan penyesuaian sistem dengan mengacu pada **Daftar Instruksi Eksekusi (Procedural Task List)** di bawah ini secara runut.

---

## 📋 DAFTAR INSTRUKSI EKSEKUSI (TASK LIST)

### TAHAP 1: Modifikasi Skema Database (Prisma)
- [ ] **Kolom Baru:** Tambahkan kolom `isCommunal: Boolean` (dengan nilai bawaan/default `false`) pada entitas tabel `Bin`.
- [ ] **Enum Baru:** Tambahkan *value* `"KOMUNAL"` pada daftar Enum untuk entitas tabel `BinOwnership`.
- [ ] **Migrasi:** Eksekusi pembuatan *migration file* dan aplikasikan perubahan pada *database* (Staging/Production).

### TAHAP 2: Pembuatan Endpoint Registrasi Komunal (Khusus Petugas)
- [ ] **Routing Terpisah:** Buat *method/service* dan *endpoint* baru (contoh: `POST /api/v1/bins/komunal`) yang terisolasi dari *endpoint* registrasi warga biasa.
- [ ] **Validasi Otorisasi:** Pastikan *endpoint* ini dikunci secara ketat dan HANYA dapat diakses oleh token JWT dengan role `PETUGAS`.
- [ ] **Pencegahan Polusi Data (Household):** Cegah sistem (di *endpoint* ini) agar **tidak otomatis meng-generate** atau mengaitkan data `Household` (Rumah Tangga) baru ke akun Petugas.
- [ ] **Bypass Aturan Kewajiban 1 Pasang:** Ubah *rules* pada *endpoint* ini agar **menerima payload 1 QR Code saja** (contoh: mendaftar Organik saja tanpa anorganik) tanpa melempar error `ONBOARDING_INCOMPLETE_WRONG_CATEGORY`.
- [ ] **Penyisipan Relasi Status:** Saat insersi data *Bin* berhasil, pastikan sistem memasukkan *value* `isCommunal: true` pada tabel `Bin` dan relasi kepemilikan bertipe `"KOMUNAL"` (di `BinOwnership`) yang merujuk permanen ke `userId` petugas.
- [ ] **Kunci Lokasi (GPS):** Bind `latitude` dan `longitude` secara permanen ke *database* berdasarkan koordinat dari *payload*.

### TAHAP 3: Penyesuaian Endpoint Deposit / Setor Sampah (Warga)
- [ ] **Modifikasi Logika:** Perbarui *controller/service* penyetoran sampah (saat warga melakukan scan QR) di `POST /api/v1/bins/scan`.
- [ ] **Bypass Error Kepemilikan:** Berikan penanda logika (IF condition): **JIKA** QR yang di-scan memiliki status `isCommunal == true`, **MAKA** abaikan validasi *ownership*. Jangan lempar error `BIN_NOT_OWNED` ke aplikasi warga.
- [ ] **Perputaran Nilai Transaksi:** Pastikan ketika kondisi komunal terpenuhi, **Poin Transaksi** tetap mengalir/dikreditkan ke dompet akun Warga pembuang, namun **Beban Volume Sampah** didebit masuk ke kapasitas Tong Komunal TPS milik Petugas.

---

## 📌 DELIVERABLES (OUTPUT YANG DIBUTUHKAN)
Jika TAHAP 1 hingga TAHAP 3 telah selesai di-*deploy* ke lingkup *Staging/Development*, mohon Tim Backend segera menyerahkan *output* berikut kepada Tim Mobile untuk proses integrasi antarmuka (UI):

1. **URL Lengkap** dari *endpoint* aktivasi komunal yang baru.
2. **Dokumentasi Payload JSON** (*Request Body*) yang valid beserta tipe datanya.
3. **Pembaruan Postman Collection / Swagger** (opsional namun sangat disarankan).

Silakan jadikan *Work Order* ini sebagai acuan teknis. Kami dari sisi Tim Mobile akan segera menyelaraskan rancangan UI dan logika GPS (*background auto-lock*) secara paralel. Terima kasih atas kerja samanya.
