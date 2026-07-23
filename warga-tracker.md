# 🏘️ Warga Tracker

Dokumen ini melacak kemajuan implementasi fitur-fitur pada Portal Warga sesuai spesifikasi Prompt 6.

## Checklist Implementasi

### 1. LOGIN VIA OTP WHATSAPP
- [x] Backend: Endpoint `POST /request-otp` dan `POST /verify-otp`.
- [x] Frontend: Update form login untuk Warga dengan menggunakan input `phone` berawalan +62.

### 2. REGISTRASI TONG SAMPAH
- [ ] 3 opsi kapasitas (Sistem Default, Estimasi AI, Input Manual).
- [ ] Tampilkan status berbunyi jelas "Menunggu Persetujuan RW" pada UI warga, bukan aktif jika masih *pending*.

### 3. LAPOR TONG PENUH
- [ ] Tombol "Tong Sampah Saya Penuh".
- [ ] Halaman / Modal *upload* foto bukti sebelum kirim (memicu `DispatchTask`).

### 4. STATUS BIN & RIWAYAT
- [ ] Halaman Riwayat yang menampilkan masa aktif tong sampah (30 hari dari aktivitas).
- [ ] Tampilkan UI pesan "Hubungi RW/Admin untuk aktivasi ulang" jika tong menjadi `INACTIVE`.

### 5. IDE DAUR ULANG
- [ ] Form pengajuan (Judul, Foto, Material).
- [ ] Endpoint pengajuan dan tampilan status pantau (Pending, Approved, Rejected).

### 6. FLASH DROP (EVENT CALENDAR/MAP)
- [ ] Skema database untuk menampung event Flash Drop.
- [ ] Kalender atau peta visual di frontend Warga yang menunjukkan jadwal jam bonus poin dan indikator visual keberhasilan partisipasi.

## Status Eksekusi
- [ ] Backend
- [ ] Frontend
- [ ] Verification
