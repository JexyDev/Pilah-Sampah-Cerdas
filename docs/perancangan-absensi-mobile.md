# Perancangan Sistem Absensi Geofencing — MOBILE

## 1. Ringkasan Konsep

Mobile bertugas mengirim koordinat GPS secara periodik dan menampilkan status kehadiran secara sederhana kepada pengguna. Semua keputusan bisnis (apakah target durasi terpenuhi, kapan tombol absen aktif) **dihitung backend** — mobile hanya menampilkan hasilnya.

---

## 2. Istilah & Definisi

| Istilah | Definisi |
|---|---|
| Jam masuk | Waktu ketika pengguna memasuki wilayah kegiatan (ditentukan backend, ditampilkan di mobile) |
| Jam pulang | Waktu ketika pengguna menekan tombol absensi di akhir kegiatan |
| Durasi target | Rentang waktu yang harus dipenuhi pengguna agar bisa absen |
| Poin dampingan | Poin yang didapat setelah absen sukses, dikirim via push notification + in-app |
| Lokasi kegiatan | Kolom di UI yang bila ditekan menampilkan posisi pengguna & titik geofence di peta |

---

## 3. Pengiriman GPS

- Mobile mengaktifkan background location service dengan interval sesuai `interval_pengecekan_menit` yang **diambil dari backend** (via endpoint config kegiatan), bukan di-hardcode di aplikasi.
- Tiap ping dikirim ke `POST /sessions/{id}/geo-ping` beserta timestamp lokal (backend tetap memakai timestamp server sebagai acuan utama, mobile tidak menentukan waktu resmi).
- Disarankan pakai geofencing API native (Android `GeofencingClient`, iOS `CLLocationManager` region monitoring) dikombinasikan dengan periodic ping, agar hemat baterai dibanding polling GPS terus-menerus.
- Jika mobile sempat offline, simpan ping di local queue dan kirim batch saat online kembali.

---

## 4. Deteksi Jam Masuk / Jam Pulang

- **Jam masuk**: mobile **tidak menentukan sendiri**. Ambil nilai `session.jam_masuk` dari backend (di-set backend saat ping pertama yang berstatus di dalam geofence diterima).
- **Jam pulang**: terjadi saat user:
  - menekan tombol Absen (kirim `POST /sessions/{id}/checkin`), ATAU
  - kegiatan berakhir dan backend melakukan auto-close.

---

## 5. Tampilan di Mobile

### 5.1 Timer Berjalan

- Tampilkan **menit berjalan** sejak `jam_masuk` sampai sekarang (real-time countup), format `MM:SS` atau `X menit berjalan`.
- **Jangan** menampilkan detail teknis seperti "check ke berapa dari berapa" — cukup satu angka menit total agar UX tetap sederhana bagi pengguna.

### 5.2 Tombol Absen

- Status tombol (aktif/nonaktif) murni mengikuti flag `tombol_absen_aktif` dari backend, didapat lewat:
  - Polling `GET /sessions/{id}/status` tiap interval, atau
  - Push/websocket real-time jika tersedia.
- Mobile tidak menghitung sendiri kapan syarat target terpenuhi.

### 5.3 Dialog Klarifikasi Gap

- Jika backend mengirim `butuh_klarifikasi = true` beserta waktu sequence yang gagal, tampilkan dialog: *"Kami tidak mendeteksi Anda di lokasi pukul HH:MM, ada kendala apa?"*
- Sediakan pilihan singkat (mis. keluar sebentar, sinyal GPS lemah, dll).
- Kirim jawaban ke `POST /sessions/{id}/gap-clarification`.

### 5.4 Poin Dampingan

- Setelah checkin sukses, tampilkan toast/modal *"Selamat! Anda mendapat X poin"*.
- Terima juga push notification (FCM/APNs) yang muncul di notifikasi HP, serta update badge/poin counter in-app secara background.

### 5.5 Lokasi Kegiatan

- Kolom lokasi bersifat *tappable*. Saat ditekan:
  - Buka map view (native map intent atau in-app map SDK seperti Google Maps/Mapbox) yang menampilkan titik geofence kegiatan + posisi pengguna saat ini secara real-time.
  - Data diambil dari `GET /sessions/{id}/location-map`.

### 5.6 Contoh Tampilan Timer (pseudo-UI)

Sebelum target terpenuhi:

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

Setelah `tombol_absen_aktif = true`:

```
┌─────────────────────────────┐
│      ⏱  61 menit berjalan     │
│  Status: Sedang Berlangsung  │
│  [   ABSEN SEKARANG   ]      │
└─────────────────────────────┘
```

---

## 6. Status Presensi yang Ditampilkan

Mobile menampilkan status apa adanya dari backend, tanpa logika tambahan:

| Status | Tampilan di Mobile |
|---|---|
| `sedang_berlangsung` | Timer berjalan + tombol absen (aktif/nonaktif sesuai flag) |
| `hadir` | Ringkasan durasi aktual + poin didapat |
| `izin` / `sakit` | Badge status, timer berhenti |
| `tanpa_keterangan` | Notifikasi bahwa target tidak terpenuhi (info dari backend) |

Mobile juga menyediakan form pengajuan **izin/sakit** yang mengirim ke `POST /sessions/{id}/leave-request`, baik sebelum maupun selama kegiatan berlangsung.

---

## 7. Pertimbangan Teknis Tambahan (sisi Mobile)

1. **Anti-spoofing**: deteksi mock-location (Android: cek flag `isMock`, iOS: deteksi indikasi jailbreak/spoofing) sebelum mengirim ping, tandai di payload agar backend bisa menolak data mencurigakan.
2. **Battery optimization**: gunakan geofencing API native + periodic ping, hindari polling GPS terus-menerus.
3. **Konsistensi waktu**: selalu percaya waktu/status dari respons backend untuk hal yang menentukan kelulusan absensi (jam masuk, tombol aktif), jangan hitung ulang di sisi klien.
4. **Resilience jaringan**: simpan antrian ping lokal saat offline dan kirim ulang saat online, tandai retry dengan sequence_number agar backend bisa idempotent.
