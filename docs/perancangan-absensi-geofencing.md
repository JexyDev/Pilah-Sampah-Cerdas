# Perancangan Sistem Absensi Berbasis Geofencing

## 1. Ringkasan Konsep

Sistem ini memvalidasi kehadiran peserta pada suatu kegiatan (misal kegiatan lapangan/PKL/KKN) berdasarkan **keberadaan fisik dalam radius geofence** selama rentang waktu tertentu, bukan hanya satu titik absen tunggal. Validasi dilakukan dengan **sampling periodik** (interval pengecekan) yang dikonfigurasi lewat *Rule Engine*, lalu diakumulasi untuk menentukan apakah **durasi target** sudah terpenuhi.

---

## 2. Istilah & Definisi

| Istilah | Definisi |
|---|---|
| Jam masuk | Waktu pertama kali sistem mendeteksi pengguna memasuki wilayah kegiatan (geofence) |
| Jam pulang | Waktu ketika pengguna menekan tombol absensi (mengakhiri sesi) |
| Durasi kegiatan | Total rentang waktu kegiatan berlangsung, ditentukan Admin/DPL |
| Durasi target | Rentang waktu minimum yang harus dipenuhi pengguna di dalam wilayah agar tombol absen aktif |
| Durasi aktual | Total waktu real pengguna terdeteksi berada di dalam wilayah |
| Interval pengecekan | Frekuensi sampling GPS/geofence check (misal tiap 10 menit), diatur di Rule Engine |
| Status presensi | `sedang_berlangsung`, `hadir`, `izin`, `sakit`, `tanpa_keterangan` |
| Poin dampingan | Poin reward yang di-push ke mobile (notifikasi + in-app) setelah absen berhasil |
| Lokasi kegiatan | Titik koordinat geofence; jika ditekan di UI, menampilkan posisi pengguna relatif terhadap titik tersebut |

---

## 3. Rule Engine — Konfigurasi

Rule Engine menyimpan konfigurasi per **kegiatan** (bukan global), sehingga tiap kegiatan bisa punya aturan berbeda.

### 3.1 Skema Konfigurasi (Rule Engine Page)

```json
{
  "activity_id": "uuid",
  "geofence": {
    "latitude": -6.914744,
    "longitude": 107.609810,
    "radius_meters": 100
  },
  "durasi_kegiatan_menit": 120,
  "durasi_target_menit": 60,
  "interval_pengecekan_menit": 10,
  "toleransi_gap_menit": 0,
  "grace_period_start_menit": 0,
  "auto_expire": true
}
```

### 3.2 Perhitungan Turunan

```
total_checks_kegiatan   = durasi_kegiatan_menit / interval_pengecekan_menit
required_checks_target  = durasi_target_menit / interval_pengecekan_menit
sisa_kesempatan_checks  = total_checks_kegiatan - required_checks_target
```

Contoh sesuai kasus:
- Durasi kegiatan 120 menit, interval 10 menit → **12 kali pengecekan** total selama kegiatan.
- Durasi target 60 menit → **6 kali pengecekan** wajib terpenuhi (berurutan atau tidak, lihat §4.3).
- Sisa kesempatan = 12 − 6 = **6 kali pengecekan tambahan** sebagai "peluang susulan" jika ada gap.

> Rule Engine harus memvalidasi: `durasi_target_menit <= durasi_kegiatan_menit` dan keduanya kelipatan `interval_pengecekan_menit` (atau backend membulatkan ke atas).

---

## 4. Logika Backend

### 4.1 Entitas Data

**Activity (Kegiatan)**
```
id, nama, dpl_id, geofence(lat,long,radius),
durasi_kegiatan_menit, durasi_target_menit, interval_pengecekan_menit,
waktu_mulai, waktu_selesai, status
```

**AttendanceSession (Sesi Presensi per user per kegiatan)**
```
id, activity_id, user_id,
jam_masuk (nullable),
jam_pulang (nullable),
status_presensi: enum[sedang_berlangsung, hadir, izin, sakit, tanpa_keterangan],
durasi_aktual_menit,
checks_terpenuhi: int,
checks_total_dilakukan: int,
poin_dampingan: int (nullable),
created_at, updated_at
```

**GeofenceCheckLog (histori tiap sampling)**
```
id, session_id, sequence_number, timestamp,
latitude, longitude, jarak_ke_geofence_meter,
in_geofence: bool, source: [mobile_ping, backend_scheduler]
```

### 4.2 Alur Utama

```
1. Mobile mengirim koordinat GPS ke backend setiap `interval_pengecekan_menit`
   (server tetap validasi timestamp, jangan percaya interval client 100%).

2. Backend cek titik koordinat vs geofence (haversine distance <= radius).

3. Jika titik pertama in_geofence = true DAN session belum punya jam_masuk:
   -> set jam_masuk = timestamp, status = "sedang_berlangsung"

4. Setiap check disimpan sebagai GeofenceCheckLog (sequence_number naik terus,
   in_geofence true/false dicatat apa adanya - TIDAK didrop kalau false).

5. checks_terpenuhi = COUNT(GeofenceCheckLog WHERE session_id=x AND in_geofence=true)
   checks_total_dilakukan = COUNT(GeofenceCheckLog WHERE session_id=x)

6. Setelah tiap check masuk, backend evaluasi:

   IF checks_terpenuhi >= required_checks_target:
        -> tombol_absen_aktif = true  (kirim event/flag ke mobile)

   ELSE IF checks_total_dilakukan >= total_checks_kegiatan:
        -> semua kesempatan habis, target belum tercapai
        -> tombol_absen_aktif = false
        -> trigger status = "tanpa_keterangan" (atau butuh input izin/sakit)

   ELSE:
        -> masih dalam window kesempatan, tombol tetap nonaktif,
           tunggu check berikutnya

7. Jika sebuah check bernilai in_geofence = false, backend TIDAK langsung
   menggagalkan sesi. Ia hanya tidak menambah checks_terpenuhi.
   Karena total_checks_kegiatan (12) > required_checks_target (6),
   pengguna masih punya sisa kesempatan (6x) untuk "menyusul" checks
   yang gagal, selama tidak melebihi durasi_kegiatan_menit.

8. Ketika ditemukan in_geofence = false pada suatu sequence, backend
   MENANDAI session dengan flag butuh_klarifikasi = true dan menyimpan
   check ke berapa yang gagal (sequence_number). Ini dipakai FE untuk
   menampilkan pertanyaan "Kenapa Anda tidak berada di lokasi pada
   pukul HH:MM?" -> jawaban user (izin/keperluan lain/dst) disimpan
   di field `keterangan_gap` pada GeofenceCheckLog terkait.

9. Saat user menekan tombol Absen (hanya aktif jika syarat §6 terpenuhi):
   -> jam_pulang = now()
   -> durasi_aktual_menit = jam_pulang - jam_masuk
   -> status_presensi = "hadir"
   -> hitung & simpan poin_dampingan
   -> kirim push notification (poin + notifikasi latar belakang) ke mobile
```

### 4.3 Aturan "Terpenuhi" — Berurutan vs Akumulatif

Dua mode yang bisa dipilih di Rule Engine (field tambahan `mode_pemenuhan`):

| Mode | Deskripsi |
|---|---|
| `akumulatif` (default) | 6 dari 12 check bernilai `true`, boleh tidak berurutan (ada gap tetap dihitung, gap wajib diklarifikasi) |
| `berurutan` | 6 check `true` harus beruntun tanpa gap `false` di antaranya; jika ada `false`, counter reset ke 0 |

> Rekomendasi default: **akumulatif**, karena lebih toleran terhadap sinyal GPS lemah/indoor, dan sesuai narasi kasus (user diberi "kesempatan susulan").

### 4.4 Auto-close Sesi

Scheduler backend (cron/queue) mengecek sesi yang:
- `status = sedang_berlangsung`
- `now() > waktu_mulai_kegiatan + durasi_kegiatan_menit`
- tombol_absen tidak pernah ditekan

Maka backend otomatis set:
- Jika `checks_terpenuhi >= required_checks_target` tapi user lupa tekan absen → status tetap `sedang_berlangsung` menunggu aksi manual, ATAU auto set `hadir` (tergantung kebijakan, sebaiknya configurable: `auto_close_action: manual | auto_hadir`).
- Jika `checks_terpenuhi < required_checks_target` → status = `tanpa_keterangan` (kecuali user sudah submit izin/sakit sebelumnya via endpoint terpisah).

---

## 5. Poin Dampingan

```
POST /sessions/{id}/checkin  (tekan tombol absen)
  -> validasi checks_terpenuhi >= required_checks_target
  -> hitung poin (rule bisa flat / berbasis durasi_aktual / berbasis activity)
  -> simpan ke session.poin_dampingan
  -> publish event ke Notification Service:
       - Push notification (FCM/APNs) -> muncul di notifikasi HP
       - In-app background update -> badge/poin counter di aplikasi
```

---

## 6. Kondisi Tombol Absen Muncul (Backend → Mobile Flag)

Backend mengirim field `tombol_absen_aktif: boolean` pada setiap response status sesi (baik via polling maupun push/websocket), dihitung real-time dari:

```
tombol_absen_aktif =
    (checks_terpenuhi >= required_checks_target)
    AND (status_presensi == "sedang_berlangsung")
    AND (jam_pulang == null)
```

Mobile **tidak menghitung sendiri** kapan tombol muncul — murni mengikuti flag dari backend agar tidak ada manipulasi client-side.

---

## 7. API Endpoint (Ringkas)

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/activities/{id}/rule-config` | Simpan konfigurasi rule engine (interval, durasi target, dsb) |
| POST | `/sessions/{id}/geo-ping` | Mobile kirim koordinat tiap interval |
| GET | `/sessions/{id}/status` | Ambil status real-time (checks_terpenuhi, tombol_absen_aktif, menit berjalan) |
| POST | `/sessions/{id}/checkin` | Submit absensi akhir |
| POST | `/sessions/{id}/gap-clarification` | User menjawab kenapa tidak terdeteksi di check ke-N |
| POST | `/sessions/{id}/leave-request` | Ajukan izin/sakit |
| GET | `/sessions/{id}/location-map` | Data untuk tampilkan lokasi kegiatan & posisi user saat kolom lokasi ditekan |

---

## 8. Logika Mobile

### 8.1 Pengiriman GPS

- Mobile mengaktifkan background location service dengan interval sesuai `interval_pengecekan_menit` yang **diambil dari backend** (bukan hardcode), lewat endpoint config kegiatan.
- Tiap ping dikirim ke `/sessions/{id}/geo-ping` beserta timestamp lokal (backend tetap pakai timestamp server sebagai acuan utama).

### 8.2 Deteksi Jam Masuk / Jam Pulang

- **Jam masuk**: ditentukan backend saat ping pertama `in_geofence = true` diterima → mobile hanya menampilkan hasil dari backend (`session.jam_masuk`), tidak menentukan sendiri.
- **Jam pulang**: hanya terjadi saat user menekan tombol Absen di mobile (endpoint checkin), ATAU auto-close oleh sistem sesuai §4.4.

### 8.3 Tampilan di Mobile

- **Timer berjalan**: tampilkan **menit berjalan** sejak `jam_masuk` hingga sekarang (real-time countup), format `MM:SS` atau `X menit berjalan`.
  - **Jangan** menampilkan detail "check ke berapa dari berapa" — cukup angka menit total agar UX sederhana.
- **Status tombol absen**: mengikuti flag `tombol_absen_aktif` dari backend (polling `/sessions/{id}/status` tiap interval, atau via websocket/push).
- **Notifikasi klarifikasi gap**: jika backend set `butuh_klarifikasi = true`, mobile tampilkan dialog "Kami tidak mendeteksi Anda di lokasi pukul HH:MM, ada kendala apa?" dengan pilihan singkat (keluar sebentar, sinyal GPS lemah, dll) → kirim ke `/gap-clarification`.
- **Poin dampingan**: setelah checkin sukses, tampilkan toast/modal "Selamat! Anda mendapat X poin", plus push notification & badge counter (via FCM/APNs + in-app state).
- **Lokasi kegiatan**: kolom lokasi bersifat *tappable* → saat ditekan, buka map view menampilkan titik geofence + posisi pengguna saat ini (real-time), bisa pakai native map intent atau in-app map (Google Maps/Mapbox SDK).

### 8.4 Contoh Tampilan Timer (pseudo-UI)

```
┌─────────────────────────────┐
│  Kegiatan: Bimbingan Lapangan │
│                              │
│      ⏱  42 menit berjalan     │
│                              │
│  Status: Sedang Berlangsung  │
│  [ Tombol Absen - nonaktif ] │
│                              │
│  📍 Lokasi Kegiatan  >        │
└─────────────────────────────┘
```

Ketika `tombol_absen_aktif = true`:

```
┌─────────────────────────────┐
│      ⏱  61 menit berjalan     │
│  Status: Sedang Berlangsung  │
│  [   ABSEN SEKARANG   ]      │
└─────────────────────────────┘
```

---

## 9. Status Presensi — State Machine

```
sedang_berlangsung
   ├──(checkin sukses)──────────────> hadir
   ├──(auto-close, target gagal)────> tanpa_keterangan
   ├──(user ajukan izin, disetujui)─> izin
   └──(user ajukan sakit, disetujui)> sakit
```

Catatan:
- `izin` dan `sakit` bisa diajukan **sebelum kegiatan mulai** atau **selama kegiatan berlangsung** (mengubah status dari `sedang_berlangsung`), dan menghentikan pengecekan geofence lebih lanjut untuk sesi tersebut.
- `tanpa_keterangan` hanya dijatuhkan otomatis oleh sistem via scheduler auto-close, bukan input manual.

---

## 10. Pertimbangan Teknis Tambahan

1. **Akurasi GPS**: tetapkan radius geofence dengan buffer (misal +20–30m) untuk mengakomodasi drift GPS di area terbuka/tertutup.
2. **Anti-spoofing**: validasi mock-location di mobile (Android: `isMock`, iOS: deteksi jailbreak/GPS spoofing tools) dan tolak ping yang mencurigakan.
3. **Offline handling**: jika mobile sempat offline, simpan ping di local queue dan kirim batch saat online kembali, backend tetap urutkan berdasarkan timestamp asli, bukan waktu terima.
4. **Battery optimization**: gunakan geofencing API native (Android `GeofencingClient`, iOS `CLLocationManager` region monitoring) dikombinasikan dengan periodic ping, bukan polling GPS terus-menerus.
5. **Scalability Rule Engine**: simpan rule per activity di tabel terpisah agar DPL/Admin bisa ubah konfigurasi tanpa deploy ulang, dan histori rule versi lama tetap tersimpan untuk audit sesi yang sudah berjalan dengan rule sebelumnya.
6. **Idempotency**: endpoint `geo-ping` harus idempotent terhadap sequence_number untuk mencegah duplikasi saat retry jaringan.
