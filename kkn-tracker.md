# 🛠️ KKN Portal (Mahasiswa KKN) Tracker

Dokumen ini melacak kemajuan implementasi fitur-fitur pada Portal Mahasiswa KKN sesuai spesifikasi Prompt 4.

## Checklist Implementasi

### 1. ALUR SCAN QR & REGISTRASI WARGA
- [ ] Implementasi klaim awal QR: Mahasiswa wajib memindai QR (status awal `PRINTED`) lalu merekam GPS. Status berubah jadi `ASSIGNED_TO_PIC` atas nama mahasiswa tersebut.
- [ ] Implementasi form bantu registrasi warga: Dari QR yang sudah `ASSIGNED_TO_PIC`, data warga dimasukkan. Status berubah menjadi `PENDING_APPROVAL` (menunggu RW).
- [ ] Indikator status dampingan jelas: Di list aplikasi mahasiswa, tampil status "Menunggu Approval RW" vs "Aktif".
- [ ] Input 3 opsi kapasitas tong saat pendaftaran:
  - Default pemerintah.
  - Estimasi AI dari Foto.
  - Manual input dimensi.

### 2. NOTIFIKASI & POIN
- [ ] Saat RW memverifikasi aktivasi bin warga, mahasiswa penerima (PIC) mendapatkan notifikasi in-app: "Registrasi [Nama Warga] berhasil diaktivasi, kamu dapat +10 poin". (Poin sudah di-handle di `rwService.ts`, tinggal implementasi notifikasi push/in-app).

### 3. FITUR HANDOVER (SERAH TERIMA PIC)
- [ ] Form handover dari PIC mahasiswa lama ke mahasiswa baru.
- [ ] Transfer warga dan wilayah tugas di-record ke dalam tabel histori (`kkn_handover_history`).

### 4. BANTU INPUT FASILITAS GIS
- [ ] Form input fasilitas GIS (Bata Terawang, Loseda, Rumah Maggot, Bank Sampah, ternak).
- [ ] Bisa upload dokumentasi pendukung (foto/pdf).

---
*Status disinkronkan otomatis sesuai pengerjaan fitur.*
