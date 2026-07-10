# PRD — Product Requirement Document
## pilahsampah.id | Backend API Service
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026
**Status:** Active Development | **Phase:** Sprint 1 (Localhost + Ngrok)

---

## 1. Ringkasan Produk

**pilahsampah.id Backend** adalah RESTful API Service + WebSocket Server yang menjadi tulang punggung sistem pemantauan pemilahan sampah berbasis AI untuk Kecamatan Coblong, Kota Bandung. Backend ini melayani dua klien sekaligus: **React Dashboard Web** dan **Flutter Mobile App**.

### 1.1 Tujuan Bisnis
- Mendigitalisasi pencatatan pemilahan sampah rumah tangga tanpa IoT hardware mahal
- Memberikan visibilitas real-time kapasitas tong sampah kepada petugas RT/RW
- Mengotomatisasi kalkulasi poin dan evaluasi kepatuhan warga via AI detection

### 1.2 Target Pengguna Backend
| Role | Akses |
|------|-------|
| Admin Kecamatan | Full read/write semua endpoint |
| Petugas RT/RW | Read semua, write terbatas pada area RT-nya |
| Warga (via Mobile) | Write waste log, read profil & poin sendiri |
| Sistem (Internal) | Cron job, WebSocket broadcast |

### 1.3 Batasan Scope Sprint 1 (Localhost + Ngrok)
- Tidak ada cloud storage (foto diterima sebagai Base64 atau multipart, diproses langsung)
- Tidak ada email service (notifikasi via WebSocket + in-app)
- Tidak ada deployment VPS (tunneling via Ngrok sementara)
- Redis untuk queue & quota; fallback ke in-memory jika Redis offline

---

## 2. Fitur Utama Backend

### 2.1 Autentikasi & Otorisasi (AUTH)
- Login menggunakan Email + Password
- JWT diissue oleh server:
  - **Web Client:** dikirim sebagai `httpOnly Cookie` (SameSite=Strict, Secure)
  - **Mobile Client:** dikirim sebagai JSON response body, disimpan di `flutter_secure_storage`
- Role-Based Access Control (RBAC): ADMIN / RT_RW / CITIZEN
- Middleware validasi token di setiap protected endpoint
- Logout: invalidasi cookie (web) atau hapus token dari client (mobile)

### 2.2 Manajemen Data Warga & Rumah Tangga
- CRUD rumah tangga dengan koordinat GPS (DECIMAL 11,8)
- Relasi rumah tangga ke area RT/RW
- QR Code unik per rumah tangga & tong sampah

### 2.3 Manajemen Tong Sampah (Bins)
- CRUD tong sampah per rumah tangga
- Kapasitas maksimal tetap: **25.0 Liter**
- Endpoint reset volume tong pasca pengangkutan petugas

### 2.4 AI Detection & Queue Management
- Endpoint mock deteksi AI dengan Redis FIFO queue (max 100 concurrent)
- Quota harian: 50 request/user/hari (di Redis, key: `quota:{userId}:{date}`)
- Timeout threshold: 2000ms; quota dikembalikan jika timeout
- SHA-256 hash gambar untuk deteksi duplikasi upload

### 2.5 Validasi Transaksi Pemilahan Sampah
- Validasi kecocokan jenis sampah vs tipe tong (ORGANIC/NON_ORGANIC)
- Validasi kapasitas sisa tong dengan pessimistic locking (`SELECT FOR UPDATE`)
- Konversi volume → berat: ORGANIC × 0.4 kg/L, NON_ORGANIC × 0.2 kg/L
- Kalkulasi poin otomatis: Berat (Kg) × 100 poin
- Notifikasi "Tong Penuh" jika volume ≥ 22.5L (90% dari 25L)

### 2.6 WebSocket Real-Time Server
- Event `bin_full_alert` → broadcast ke petugas RT terkait
- Event `capacity_update` → update live di dashboard
- Event `notification_new` → trigger notifikasi bell

### 2.7 Analytics & Leaderboard
- Agregasi data kepatuhan per RT/RW
- Tren volume 30 hari terakhir (organik vs anorganik)
- Ranking RT berdasarkan total poin akumulasi warga
- Evaluasi & prediksi bulanan berbasis rata-rata 30 hari

---

## 3. Non-Functional Requirements

| Aspek | Target |
|-------|--------|
| Response time API | < 500ms untuk CRUD biasa |
| AI Mock response time | < 2000ms (timeout threshold) |
| Queue capacity | Max 100 concurrent request |
| Quota harian | Max 50 request AI per user |
| Kapasitas tong | Max 25.0 Liter (hard constraint) |
| Auth token expiry | 24 jam (access token) |
| WebSocket reconnect | Auto-reconnect dengan exponential backoff |

---

## 4. Definisi Selesai (Definition of Done) — Sprint 1

- [ ] Semua endpoint terdefinisi berjalan tanpa error di localhost port 3000
- [ ] Ngrok tunnel aktif dan Flutter Mobile dapat terhubung
- [ ] WebSocket broadcast berjalan untuk event bin_full_alert
- [ ] Database Prisma ter-migrate sempurna di PostgreSQL lokal
- [ ] Semua endpoint tervalidasi dengan Postman Collection
