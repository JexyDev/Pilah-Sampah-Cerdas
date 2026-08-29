# Panduan Pembuatan Google Form Pendataan Mahasiswa KKN BERSEKA

Dokumen ini berisi panduan untuk membuat dan menjalankan Google Form pendataan mahasiswa KKN secara otomatis menggunakan Google Apps Script. Form ini telah dilengkapi **validasi pattern regex ketat** untuk mencegah kesalahan fatal seperti:
- **NIM tertukar dengan Nomor WhatsApp / HP**
- **Format nomor telepon terpotong angka `0` atau salah ketik**
- **Kelompok & RW dampingan tidak terstruktur**

---

## 🚀 Langkah Cepat (1-Click Google Apps Script)

1. Buka [Google Apps Script](https://script.google.com) di browser (pastikan login dengan akun Google tim/admin Berseka).
2. Klik **+ Project Baru** (*New Project*).
3. Hapus kode bawaan `function myFunction() {}`.
4. Copy seluruh kode dari file [`main/scripts/google_form_mahasiswa_berseka.gs`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/main/scripts/google_form_mahasiswa_berseka.gs) dan paste ke dalam editor Apps Script.
5. Klik ikon **Simpan** (*Save* / Ctrl+S).
6. Di bagian atas (sebelah tombol *Debug*), pastikan dropdown memilih fungsi `buatFormMahasiswaBerseka`.
7. Klik tombol **Run (Jalankan)** ▶️.
8. Saat pertama kali dijalankan, Google akan meminta izin otorisasi (*Review Permissions*):
   - Pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** > **Go to Untitled project (unsafe)**.
   - Klik **Allow (Izinkan)**.
9. Buka panel **Execution Log (Log Eksekusi)** di bagian bawah editor. Anda akan langsung mendapatkan 3 link:
   - 🔗 **Link Publik Form**: Link yang dibagikan ke mahasiswa KKN di grup WhatsApp.
   - 🛠️ **Link Edit Form**: Link untuk admin mengedit atau melihat ringkasan visual form.
   - 📊 **Link Google Spreadsheet**: Database respon yang otomatis terbuat dan terhubung secara realtime.

---

## 🛡️ Fitur Validasi Anti Data Tertukar

| Field | Validasi Sistem | Penjelasan & Pencegahan |
|---|---|---|
| **NIM** | `requireTextMatchesPattern("^[0-9]{6,12}$")` | Mahasiswa tidak bisa memasukkan teks nama atau nomor HP (yang berpanjang 12-14 digit dengan awalan 08). |
| **Nomor WhatsApp** | `requireTextMatchesPattern("^(\\+62\|62\|08)[0-9]{8,13}$")` | Wajib format nomor Indonesia yang valid (10-14 digit). Jika memasukkan NIM (yang hanya 8 digit tanpa 08), form akan otomatis menolak. |
| **Nama Lengkap** | `requireTextMatchesPattern("^[a-zA-Z\\s\\.,']{3,100}$")` | Mencegah angka atau nomor kontak masuk ke kolom nama. |
| **Email** | `requireTextIsEmail()` | Memastikan format email valid. |
| **Kelurahan & RW** | Dropdown & Helper Text | Format wilayah konsisten sesuai master data penugasan KKN BERSEKA. |
| **Pernyataan** | Checkbox Wajib | Mahasiswa wajib mencentang konfirmasi kebenaran data sebelum submit. |

---

## 📥 Cara Export & Integrasi ke Sistem BERSEKA

Setelah mahasiswa mengisi formulir:
1. Buka Google Spreadsheet respon yang telah dibuat.
2. Anda bisa langsung export ke **CSV** / **Excel** (`File > Download > Microsoft Excel (.xlsx)`).
3. Data sudah dijamin rapi, kolom nomor telepon tetap berawalan 0 / +62, dan siap disinkronisasikan ke database BERSEKA.
