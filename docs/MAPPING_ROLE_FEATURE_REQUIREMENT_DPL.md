# Mapping Role Feature Requirement TrashCare — DPL (Dosen Pembimbing Lapangan)

> Dokumen ini adalah **turunan khusus role DPL**, diekstrak dari dokumen induk **Mapping Role Feature Requirement TrashCare**. Auth, hierarki, dan hak akses di sini mengikuti versi terbaru dokumen induk (pasca-rekonsiliasi Web vs Mobile). Jika ada revisi hierarki/role lain di masa depan, dokumen ini perlu disinkronkan ulang dari sana.

---

## 📍 Posisi DPL dalam Hierarki

DPL berada di **jalur akademik (KKN)**, bukan jalur wilayah:

```
Mahasiswa KKN → DPL → Panitia Taskforce (Admin Kegiatan KKN) → Pimpinan (= Super User)
```

- **Membimbing** Mahasiswa KKN secara langsung (1 DPL : 1 kelompok KKN).
- **Didaftarkan, dikelola akunnya, dan dikoordinasikan** oleh **Panitia Taskforce (Admin Kegiatan KKN)** — bukan lagi oleh Admin DLH (kewenangan ini sudah dialihkan sepenuhnya ke Panitia Taskforce sejak Panitia Taskforce berubah peran menjadi Admin Kegiatan KKN).
- **Diawasi** oleh Pimpinan (yang merupakan satu role yang sama dengan Super User).
- **Tidak termasuk** dalam rantai eskalasi wilayah (Warga→RW→Lurah→Camat→Admin DLH) — DPL murni beroperasi di jalur akademik.

---

## 🪪 Identitas

| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | 1 kelompok KKN bimbingan |
| Sifat akses | Operasional akademik — approval terbatas ke mahasiswa bimbingan |
| Didaftarkan oleh | **Panitia Taskforce (Admin Kegiatan KKN)** |

---

## 🔗 Relasi

| Relasi ke | Jenis | Detail |
|---|---|---|
| Mahasiswa KKN | Turun (membimbing) | Monitoring absensi GPS, logbook, approve izin/sakit (lapis pertama), beri skor |
| Panitia Taskforce | Naik (didaftarkan & dikoordinasikan oleh) | Akun DPL dibuat, diedit, atau dinonaktifkan oleh Taskforce; izin/sakit mahasiswa jangka lama bisa eskalasi ke Taskforce sebagai approval lapis kedua |
| Pimpinan (= Super User) | Naik (diawasi) | Aktivitas dipantau institusi |

---

## 🔎 Feature Requirement

| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Dashboard KKN | Ringkasan kelompok bimbingan | Read |
| 2 | Kelompok KKN | Lihat kelompok yang dibimbing | Read |
| 3 | Portofolio Mahasiswa | Detail mahasiswa (NIM, jurusan, skor, aktivitas) | Read |
| 4 | Penilaian Mahasiswa | Submit assessment score | ✅ Write |
| 5 | Approval Izin/Sakit | Approve/reject pengajuan mahasiswa (approval lapis pertama; kasus jangka lama bisa eskalasi ke Panitia Taskforce) | ✅ Write |
| 6 | Peta Cakupan | Sebaran polygon RW & titik koordinat bin KKN | Read |
| 7 | Monitoring Absen | Kehadiran mahasiswa bimbingan via GPS ping | Read |
| 8 | Warga Dampingan | Warga yang didampingi per mahasiswa | Read |
| 9 | Riwayat Approval | Histori keputusan logbook | Read |
| 10 | Baseline & Hambatan, Endline, Komparasi Dampak *(menu KKN & Evaluasi Dampak, scope kelompok)* | Memantau & memvalidasi data warga binaan hasil input Mahasiswa KKN | ✅ **Validasi/Revisi** |
| 11 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |

**Posisi dalam alur:** jalur akademik KKN, terpisah dari rantai eskalasi wilayah.

---

## 🎨 Perintah Implementasi UI

> **Wajib diikuti oleh tim pengembang (frontend/UI) saat membangun atau merevisi halaman DPL:**

- **Gunakan komponen, layout, dan pola UI yang sudah ada** di aplikasi Web TrashCare (Sidebar, Dashboard card, tabel data, form approval, dsb.) — **jangan membuat komponen baru dari nol** kecuali fitur tersebut memang belum punya padanan di role lain.
- **Jaga konsistensi visual** dengan role Web sejenis yang sudah dibangun lebih dulu (RW, Lurah, Camat, Admin DLH, Panitia Taskforce) — meliputi: warna, tipografi, ukuran tombol, ikon, penempatan filter/search, dan struktur navigasi (sidebar/menu).
- **Pola tabel & approval mengikuti standar yang sudah berjalan** — contoh: tabel "Approval Izin/Sakit" DPL harus punya struktur kolom, badge status (Pending/Approved/Rejected), dan tombol aksi yang identik gayanya dengan tabel approval di role lain (mis. Approval Ide Daur Ulang milik RW), supaya pengguna lintas-role tidak perlu belajar pola baru.
- **Chart & visualisasi** (jika ada, mis. saat menampilkan data Baseline/Endline kelompok bimbingan) mengikuti jenis chart & styling yang sudah ditetapkan di menu KKN & Evaluasi Dampak untuk role lain (RW/Lurah/Camat/Admin DLH), bukan membuat gaya visualisasi baru.
- Jika ada kebutuhan elemen UI yang benar-benar belum ada di role manapun, **konsultasikan dulu ke tim desain/UI lead** sebelum membangun komponen baru, agar tetap sejalan dengan design system TrashCare secara keseluruhan.

---

## 📌 Catatan Penting

- **DPL tidak memiliki akses** ke menu **KPI & Gamifikasi** (HSCR/WSCS/Rule Engine) maupun **Audit Pengumpulan & Master Data House ID** — kedua menu ini berada di luar scope kelompok bimbingan DPL dan menjadi domain role wilayah (RW ke atas) serta Panitia Taskforce/Pimpinan untuk sisi dampak akademik.
- Otoritas **registrasi & manajemen akun DPL** sepenuhnya berada di tangan **Panitia Taskforce (Admin Kegiatan KKN)**, bukan Admin DLH — perubahan ini berlaku sejak Panitia Taskforce didelegasikan menjadi administrator operasional penuh program KKN.
- Approval Izin/Sakit DPL bersifat **lapis pertama**; untuk kasus izin/sakit jangka panjang, alur eskalasi naik ke Panitia Taskforce sebagai **approval lapis kedua**.
