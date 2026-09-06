# Alur Pengajuan Pengosongan Tempat Sampah (Reset Bin)
### Dengan Fitur Petugas Pemilah Tetap & Filter Wilayah Otomatis

---

## 0. Platform

- **Role Warga** → Aplikasi Mobile (Android/iOS).
- **Role Petugas Pemilah Sampah** → Aplikasi Mobile (Android/iOS).
- Kedua role menggunakan aplikasi mobile terpisah (atau satu aplikasi dengan tampilan berbeda sesuai role), yang terhubung ke backend/API yang sama.
- Notifikasi ke petugas dikirim melalui **push notification mobile** (FCM untuk Android, APNs untuk iOS — bisa digabung dengan layanan seperti Firebase Cloud Messaging atau OneSignal yang mendukung keduanya).
- Karena berbasis mobile, aplikasi warga wajib meminta izin akses **kamera & galeri** (untuk unggah foto bukti) dan aplikasi petugas wajib meminta izin **notifikasi push** agar pengajuan baru dapat diterima secara real-time.

---

## 1. Tujuan Fitur

Alur ini digunakan ketika tempat sampah milik warga sudah penuh dan perlu diangkut oleh Petugas Kebersihan/Pemilahan. Fitur tambahan yang diintegrasikan pada alur ini:

1. **Notifikasi otomatis** ke petugas pemilah setiap kali warga mengajukan pengosongan.
2. **Petugas pemilah tetap (default petugas)** — warga hanya memilih petugas pada pengajuan pertama, selanjutnya otomatis terpakai.
3. **Filter wilayah** — pilihan petugas yang muncul hanya petugas yang bertugas di Kelurahan & RW yang sama dengan wilayah warga (bukan daftar umum/general).

---

## 2. Konsep Utama

- Setiap warga memiliki data wilayah tetap: `kelurahan` dan `rw`, diambil dari data alamat/domisili warga.
- Setiap petugas pemilah memiliki wilayah kerja (`kelurahan`, `rw`) yang menjadi tanggung jawabnya.
- Saat warga membuka menu pilih petugas, sistem **hanya menampilkan petugas yang wilayah kerjanya sama dengan wilayah warga tersebut**.
- Setelah warga memilih petugas untuk pertama kali, sistem menyimpan `default_petugas_id` pada data warga sehingga pengajuan berikutnya tidak perlu memilih ulang.
- Setiap pengajuan berhasil dikirim → backend otomatis mengirim notifikasi ke petugas yang ter-assign.

---

## 3. Alur Frontend (Sisi Aplikasi Warga)

### Langkah 1: Akses Menu Pengosongan
Di halaman Beranda, warga menekan tombol besar dengan ikon tempat sampah bertuliskan **"Minta Kosongkan"**.

### Langkah 2: Pilih Tempat Sampah
Pada halaman Pengajuan, warga memilih tempat sampah mana yang ingin dikosongkan:
- Organik
- Anorganik
- Centang keduanya jika mendaftarkan lebih dari satu

### Langkah 2.5 (BARU): Pilih Petugas Pemilah — Sesuai Wilayah
Sistem mengecek status warga terlebih dahulu:

**Kondisi A — Warga belum memiliki petugas tetap (`default_petugas_id` kosong):**
- Sistem otomatis mengambil `kelurahan` dan `rw` dari profil warga yang sedang login.
- Sistem menampilkan **daftar petugas pemilah yang wilayah kerjanya cocok saja** (contoh: Kelurahan Sekeloa, RW 02) — bukan daftar seluruh petugas.
- Setiap kartu petugas menampilkan: nama, foto, dan (opsional) jumlah tugas selesai/rating.
- Warga memilih salah satu petugas, lalu menekan tombol **"Konfirmasi Petugas"**.
- Jika tidak ditemukan petugas di wilayah tersebut, sistem menampilkan pesan:
  > "Belum ada petugas pemilah terdaftar di wilayah Anda. Pengajuan akan diteruskan ke Admin RW untuk diproses manual."
  → pengajuan tetap bisa lanjut dengan status diarahkan ke Admin RW sebagai fallback.

**Kondisi B — Warga sudah memiliki petugas tetap:**
- Langkah ini dilewati otomatis.
- Sistem menampilkan info non-blocking di halaman pengajuan:
  > "Pengajuan ini akan dikirim ke [Nama Petugas]"
- Tersedia opsi kecil **"Ganti Petugas"** apabila warga ingin mengganti petugas tetapnya (akan menampilkan kembali daftar petugas sesuai wilayah, seperti Kondisi A).

### Langkah 3: Unggah Foto Bukti
Warga diwajibkan mengunggah foto asli kondisi tempat sampah saat itu (melalui ikon kamera/galeri) sebagai bukti validasi bahwa tempat sampah memang sudah penuh dan layak diajukan pengangkutannya.

### Langkah 4: Kirim Pengajuan
Setelah foto diunggah, warga menekan tombol **kirim pengajuan**.

---

## 4. Hasil & Status (Pending)

- Aplikasi menampilkan pop-up sukses, warga menerima notifikasi:
  > "Pengajuan pengosongan berhasil dikirim. Menunggu proses persetujuan RW (PENDING)."
- Data pengajuan warga (nama, alamat, jenis sampah, foto bukti, petugas tujuan) masuk ke daftar antrean di aplikasi Petugas Pemilahan yang bersangkutan.
- **Notifikasi otomatis terkirim** ke petugas tetap/petugas terpilih tanpa aksi tambahan dari warga.
- Warga hanya perlu menunggu hingga petugas memproses (mengklaim/menyetujui) pengajuan dan datang ke lokasi untuk mengangkut sampah.

---

## 5. Struktur Data (Backend)

### Tabel `warga`
| Kolom | Keterangan |
|---|---|
| id | Primary key |
| nama | Nama warga |
| alamat | Alamat lengkap |
| kelurahan | Wilayah kelurahan warga |
| rw | Wilayah RW warga |
| default_petugas_id | FK ke tabel `petugas` (nullable) — diisi setelah pengajuan pertama |

### Tabel `petugas`
Jika satu petugas hanya menangani satu wilayah:
| Kolom | Keterangan |
|---|---|
| id | Primary key |
| nama | Nama petugas |
| foto | Foto profil petugas |
| kelurahan | Wilayah kerja |
| rw | Wilayah kerja |
| status_aktif | Status keaktifan petugas |

Jika satu petugas bisa menangani beberapa RW (lebih fleksibel), gunakan tabel relasi terpisah:

**Tabel `petugas`**
| Kolom | Keterangan |
|---|---|
| id | Primary key |
| nama | Nama petugas |
| foto | Foto profil petugas |
| status_aktif | Status keaktifan petugas |

**Tabel `petugas_wilayah`**
| Kolom | Keterangan |
|---|---|
| id | Primary key |
| petugas_id | FK ke `petugas` |
| kelurahan | Wilayah kerja |
| rw | Wilayah kerja |

### Tabel `pengajuan_reset_bin`
| Kolom | Keterangan |
|---|---|
| id | Primary key |
| warga_id | FK ke `warga` |
| petugas_id | FK ke `petugas` — petugas tujuan pengajuan |
| jenis_sampah | Organik / Anorganik / Keduanya |
| foto_url | Bukti foto kondisi tempat sampah |
| status | PENDING / DIKLAIM / SELESAI |
| created_at | Waktu pengajuan dibuat |

### Tabel `notifikasi`
| Kolom | Keterangan |
|---|---|
| id | Primary key |
| petugas_id | FK ke `petugas` penerima notifikasi |
| pengajuan_id | FK ke `pengajuan_reset_bin` |
| status | unread / read |
| created_at | Waktu notifikasi dibuat |

---

## 6. Alur Backend (Endpoint & Logika)

### 6.1 Cek status petugas warga
```
GET /api/warga/{id}/petugas-status
```
Response:
```json
{
  "has_default_petugas": true,
  "petugas": {
    "id": "P001",
    "nama": "Budi Santoso",
    "foto": "url_foto"
  }
}
```
Logika tambahan:
- Jika `kelurahan`/`rw` warga berubah (pindah domisili) dan `default_petugas_id` tersimpan sudah tidak sesuai wilayah baru → sistem otomatis me-reset `default_petugas_id` menjadi `null`, sehingga warga diminta memilih ulang petugas sesuai wilayah barunya.

### 6.2 Ambil daftar petugas sesuai wilayah warga
```
GET /api/petugas?kelurahan=Sekeloa&rw=02
```
Logika backend:
1. `kelurahan` dan `rw` diambil dari data profil warga yang sedang login di server (bukan dari input manual frontend), untuk mencegah manipulasi wilayah.
2. Query ke tabel `petugas` (atau `petugas_wilayah` jika pakai relasi terpisah) dengan kondisi:
   ```
   kelurahan = 'Sekeloa' AND rw = '02' AND status_aktif = true
   ```
3. Backend hanya mengembalikan petugas yang cocok dengan wilayah tersebut.
4. Jika hasil kosong, backend mengembalikan array kosong → frontend menampilkan pesan fallback ke Admin RW.

### 6.3 Menyimpan petugas tetap (default petugas)
```
POST /api/warga/{id}/set-default-petugas
Body: { "petugas_id": "P001" }
```
Logika backend:
1. Validasi bahwa `petugas_id` yang dipilih memiliki wilayah kerja (`kelurahan`, `rw`) yang **sama** dengan wilayah warga tersebut.
2. Jika tidak cocok → request ditolak (mencegah pemilihan petugas dari wilayah lain, termasuk manipulasi API langsung).
3. Jika valid → update kolom `default_petugas_id` pada tabel `warga`.

### 6.4 Submit pengajuan pengosongan
```
POST /api/pengajuan-reset-bin
Body: {
  "warga_id": "W001",
  "jenis_sampah": ["organik", "anorganik"],
  "foto_url": "url_foto_bukti",
  "petugas_id": "P001"  // opsional, dikirim manual hanya jika ganti petugas
}
```
Logika backend:
1. Validasi data (foto wajib ada, minimal satu jenis sampah dicentang).
2. Jika `petugas_id` tidak dikirim di request (kasus pengajuan kedua dan seterusnya), backend otomatis mengambil dari `warga.default_petugas_id`.
3. Simpan record pengajuan baru dengan status `PENDING` dan `petugas_id` yang sudah ditentukan.
4. **Trigger notifikasi otomatis**:
   - Kirim push notification (contoh: FCM/OneSignal) ke device petugas terkait.
   - Insert record baru ke tabel `notifikasi` dengan `petugas_id`, `pengajuan_id`, `status: unread`.
5. Backend mengirim response sukses ke aplikasi warga → memicu pop-up sukses & notifikasi status PENDING di sisi warga.

### 6.5 Sisi Aplikasi Petugas (Mobile)
- Petugas menerima **push notification** langsung di perangkat mobile-nya, contoh isi:
  > "Ada pengajuan pengosongan baru dari [Nama Warga] – [Alamat, RW]"
- Notifikasi tetap masuk meskipun aplikasi petugas sedang tidak dibuka (background/terminated state), selama device token petugas terdaftar aktif di server.
- Tap notifikasi → aplikasi mobile otomatis membuka halaman detail pengajuan (foto bukti, alamat, jenis sampah) melalui deep link.
- Petugas dapat mengklaim/menyetujui pengajuan tersebut langsung dari aplikasi mobile untuk diproses.
- Backend perlu menyimpan **device token** (FCM/APNs token) petugas pada saat login/registrasi perangkat, agar push notification dapat terkirim ke device yang tepat. Simpan pada tabel tambahan `petugas_device_token` (kolom: `id`, `petugas_id`, `device_token`, `platform` [android/ios], `updated_at`) agar mendukung multi-device dan token yang bisa berubah.

---

## 7. Validasi & Keamanan

| Validasi | Keterangan |
|---|---|
| Wilayah warga vs petugas | Petugas yang ditampilkan/dipilih wajib memiliki `kelurahan` & `rw` sama dengan warga |
| Sumber data wilayah warga | Diambil dari data server (profil warga), bukan dari parameter yang dikirim frontend, untuk mencegah manipulasi |
| Pemilihan petugas beda wilayah | Ditolak oleh backend meskipun dikirim langsung lewat API |
| Perubahan domisili warga | `default_petugas_id` otomatis direset agar warga memilih ulang petugas sesuai wilayah baru |
| Wilayah tanpa petugas terdaftar | Fallback otomatis ke antrean umum Admin RW |

---

## 8. Ringkasan Perbandingan Alur

| Aspek | Alur Lama | Alur Baru |
|---|---|---|
| Penerima pengajuan | Masuk ke antrean umum RW | Terarah langsung ke petugas tetap warga |
| Pemilihan petugas | Tidak ada | Hanya di pengajuan pertama, tersimpan otomatis sebagai default |
| Daftar petugas yang tampil | — | Difilter sesuai Kelurahan & RW warga (tidak general) |
| Notifikasi ke petugas | Tidak otomatis disebutkan | Otomatis terkirim setiap pengajuan baru |
| Warga pindah wilayah | — | Default petugas direset, wajib pilih ulang sesuai wilayah baru |
| Wilayah tanpa petugas | — | Fallback ke Admin RW / antrean umum |
| Fleksibilitas ganti petugas | — | Tersedia tombol "Ganti Petugas" (opsional) |

---

## 9. Ringkasan Alur End-to-End

1. Warga tekan **"Minta Kosongkan"** di Beranda.
2. Pilih jenis tempat sampah (Organik/Anorganik/Keduanya).
3. **[Kondisional]** Jika belum punya petugas tetap → pilih petugas dari daftar yang sudah difilter sesuai Kelurahan & RW warga → simpan sebagai `default_petugas_id`.
   Jika sudah punya → lewati langkah ini, tampilkan info petugas tujuan.
4. Unggah foto bukti kondisi tempat sampah.
5. Kirim pengajuan.
6. Backend simpan data pengajuan berstatus `PENDING` + trigger notifikasi otomatis ke petugas tujuan.
7. Warga menerima pop-up sukses & status PENDING.
8. Petugas menerima notifikasi, membuka detail, dan memproses (klaim/setujui) pengajuan.
