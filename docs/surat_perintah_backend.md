# Surat Perintah & Spesifikasi Endpoint Backend (Real-Time Duration KKN)

**Kepada: Tim Backend / API Developer**  
**Perihal: Perbaikan dan Pembuatan Endpoint Kalkulasi Durasi KKN Real-Time**

---

## 📌 Latar Belakang Masalah
Saat ini, aplikasi *mobile* telah disesuaikan agar **100% mengikuti waktu yang dikalkulasi oleh backend (Source of Truth)** untuk mencegah isu manipulasi *cache* atau *timer* yang melompat di sisi perangkat mahasiswa.

Namun, saat mahasiswa menekan tombol **"Mulai Kegiatan"**, pada *dashboard web* (admin) masih terlihat:
- **Jam Masuk:** `-` (Kosong)
- **Jam Pulang:** `-` (Kosong)
- **Durasi Aktual:** `0 Menit`

Menurut hasil penelusuran, backend saat ini sepertinya **baru mencatat Jam Masuk ketika mahasiswa menekan tombol "Presensi/Hadir"**, bukan saat mereka pertama kali masuk ke wilayah KKN atau menekan "Mulai Kegiatan". Hal ini menyebabkan durasi tidak berjalan secara *real-time* di aplikasi maupun di *dashboard*.

---

## 🛠️ Instruksi Perbaikan untuk Backend

Agar durasi dapat berjalan secara *real-time* (baik di aplikasi mahasiswa maupun *dashboard* admin), backend diinstruksikan untuk melakukan penyesuaian logika berikut:

### 1. Pencatatan `jam_masuk` secara Otomatis
Backend **wajib** menetapkan nilai `jam_masuk` pada database saat salah satu dari dua kondisi ini terjadi (pilih salah satu sesuai arsitektur yang disepakati):
- **Kondisi A:** Saat mahasiswa *hit* endpoint `/api/v1/kkn/mahasiswa/aktifkan` (Mulai Kegiatan) dan terdeteksi berada di dalam koordinat radius.
- **Kondisi B:** Saat mahasiswa *hit* endpoint `/api/v1/kkn/mahasiswa/ping-lokasi` (Ping GPS berkala) untuk pertama kalinya pada jadwal tersebut dan koordinatnya berada di dalam radius.

*(Penting: Jangan menunggu mahasiswa menekan tombol "Presensi/Hadir" di akhir waktu untuk mencatat Jam Masuk).*

### 2. Kalkulasi Dinamis `actualInZoneSeconds`
Pada setiap *response* dari endpoint:
- `GET /api/v1/kkn/mahasiswa/active-zone` (atau `kegiatan-aktif`)
- `POST /api/v1/kkn/mahasiswa/ping-lokasi`

Backend **wajib** mengembalikan JSON parameter `actualInZoneSeconds` (atau `actualInZoneMinutes`) yang nilainya dikalkulasi secara dinamis saat itu juga.
**Rumus Kalkulasi Backend:**
```text
IF jam_masuk IS NOT NULL:
    actualInZoneSeconds = (Waktu Saat Ini) - (jam_masuk) + (Total Durasi Sesi Sebelumnya Jika Ada)
ELSE:
    actualInZoneSeconds = 0
```

---

## 🚀 Desain Endpoint / Payload yang Diharapkan

Jika endpoint yang ada saat ini belum mendukung logika di atas, mohon buat/perbarui respons dari endpoint `ping-lokasi` dan `active-zone` agar selalu mengembalikan blok *payload* berikut:

**Response Body (JSON):**
```json
{
  "success": true,
  "data": {
    "scheduleId": "SCH-12345",
    "jam_masuk": "2026-08-21T09:00:00Z", // Harus terisi sejak awal mulai/masuk zona
    "actualInZoneSeconds": 1850,         // Durasi real-time mahasiswa di dalam zona
    "targetDurationMinutes": 120,        // Target durasi
    "isAttended": false,
    ...
  }
}
```

Dengan mengembalikan nilai `actualInZoneSeconds` yang terus bertambah setiap kali di-*hit*, aplikasi *mobile* akan otomatis menyinkronkan *progress bar* di layar ponsel mahasiswa dengan durasi *dashboard* admin secara 100% presisi.

Mohon segera diimplementasikan. Terima kasih.
