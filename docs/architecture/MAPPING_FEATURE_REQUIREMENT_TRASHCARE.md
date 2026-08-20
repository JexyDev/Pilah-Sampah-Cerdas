# Mapping Feature Requirement Aplikasi TrashCare

---

## 📌 Catatan Acuan Dokumen

Dokumen ini disusun ulang dari **Dokumentasi Hierarki Role TrashCare** sebelumnya. Beberapa penyesuaian struktural:

- **Hierarki role (5 role wilayah: Warga–RW–Lurah–Camat–Admin DLH) dan role pendukung (Super User, DPL, Pimpinan, Panitia Taskforce, Petugas Residu, Mahasiswa KKN)** yang sebelumnya disebut "Bagian I" dan "Bagian II" **bukan modul aplikasi** — keduanya adalah **acuan dasar** (baseline definisi identitas, auth, scope, dan relasi antar-role) yang menjadi fondasi seluruh feature requirement di dokumen ini. Diintegrasikan langsung ke tabel fitur tiap role di bawah, tidak ditulis ulang sebagai unit terpisah.
- **3 grup menu/fitur baru** (sebelumnya disebut "Modul A/B/C") **tidak lagi dinamai "Modul"** — ditulis langsung dengan judul menunya:
  - **KKN & Evaluasi Dampak** (Baseline, Hambatan, Endline, Komparasi) — *dulu Modul A*
  - **KPI & Gamifikasi** (HSCR, WSCS, Rule Engine) — *dulu Modul B*
  - **Audit Pengumpulan & Master Data House ID** — *dulu Modul C*
- **Auth diseragamkan — seluruh role kini pakai No HP (+62) + Password** (kecuali Warga yang tetap No HP + OTP, karena OTP tetap berbasis nomor HP yang sama, hanya beda metode verifikasi login harian). Ini mencakup role yang sebelumnya pakai Email (DPL, Pimpinan, Panitia Taskforce, Super User) maupun kombinasi NIM (Mahasiswa KKN) — semua kini konsisten No HP + Password.
- **Super User = Pimpinan — satu role yang sama**, bukan sekadar setara. Keduanya adalah **satu identitas peran tunggal** dengan satu set hak akses yang identik (full access ke seluruh sistem); "Super User" dan "Pimpinan" hanyalah dua sebutan/titik masuk untuk role yang sama, mewakili posisi puncak dari sisi teknis-sistem sekaligus institusi perguruan tinggi. Tidak ada lagi pembedaan fitur antara keduanya — seluruh fitur di bawah berlaku sama persis untuk kedua sebutan tersebut.
- **Panitia Taskforce diposisikan satu tingkat di bawah Pimpinan** — role operasional yang menjalankan koordinasi harian program KKN atas arahan Pimpinan.

---

## 📜 Latar Belakang & Alasan Adopsi TOR

Berdasarkan **Term of Reference (TOR) KKN Berdampak Coblong**, adopsi 11 poin fitur baru (yang tersebar di menu **KKN & Evaluasi Dampak**, **KPI & Gamifikasi**, dan **Audit Pengumpulan & Master Data House ID**) bersifat **wajib**, dengan alasan fundamental berikut:

| # | Alasan Adopsi | Penjelasan | Fitur Terkait |
|---|---|---|---|
| 1 | **Pengukuran Dampak Nyata** (*Impact Measurement*) | Tanpa Baseline dan Endline, sistem hanya berfungsi sebagai pencatat log harian. Adopsi ini memungkinkan sistem membuktikan secara akademis bahwa program KKN benar-benar mengubah perilaku warga. | Baseline & Hambatan, Endline & Evaluasi, Komparasi Dampak *(KKN & Evaluasi Dampak)* |
| 2 | **Intervensi Tepat Sasaran** | Segmentasi Hambatan dan WSCS (Skor Kepatuhan Rumah) memungkinkan DPL dan Mahasiswa tahu rumah mana yang butuh bantuan spesifik — apakah kurang edukasi, atau kurang fasilitas. | Segmentasi Hambatan *(KKN & Evaluasi Dampak)*, Rapor Warga/WSCS *(KPI & Gamifikasi)* |
| 3 | **Mendorong Perilaku Konsisten** (*Habit-forming*) | Poin saja tidak cukup — fitur Streak, Badge, dan Level secara psikologis mendorong warga untuk mengulangi kebiasaan memilah setiap minggunya. | Streak, Badge, Level *(KPI & Gamifikasi — WSCS)* |
| 4 | **Agregasi Pengawasan** | HSCR dan Audit Pengumpulan memberikan metrik yang bisa dilaporkan kepada Pimpinan Institusi dan Pemerintahan (Camat/Lurah) sebagai bukti konkret performa suatu wilayah. | HSCR Wilayah *(KPI & Gamifikasi)*, Audit Lapangan *(Audit Pengumpulan & Master Data House ID)* |

> Keempat alasan ini menjadi dasar mengapa 3 menu baru (KKN & Evaluasi Dampak, KPI & Gamifikasi, Audit Pengumpulan & Master Data House ID) tidak bersifat opsional — tanpa Baseline/Endline sistem tidak bisa membuktikan dampak; tanpa WSCS/Segmentasi Hambatan intervensi tidak bisa presisi per rumah tangga; tanpa Streak/Badge/Level partisipasi warga cenderung menurun setelah periode awal; dan tanpa HSCR/Audit, pelaporan ke jenjang pengawas (Camat, Lurah, Admin DLH, Super User = Pimpinan) tidak punya metrik agregat yang bisa dipertanggungjawabkan.

---

## 🗺️ Diagram Hierarki Dua Jalur (Wilayah & Akademik)

```
                        ┌───────────────────────────────┐
 PUNCAK (satu role)  →  │      SUPER USER = PIMPINAN     │
                        │   (satu role, satu set akses,  │
                        │    dua sebutan/titik masuk)     │
                        └───────────────────────────────┘
                          │  (jalur wilayah)   │ (jalur akademik)
                          ▼                    ▼
                     ADMIN DLH (L4)      PANITIA TASKFORCE
                     [final eskalasi     [1 tingkat di bawah Pimpinan,
                      jalur wilayah]      koordinasi operasional KKN]
                          │                    │
                          ▼                    ▼
                      CAMAT (L3)             DPL
                          │                    │  (membimbing)
                          ▼                    ▼
                      LURAH (L2)         MAHASISWA KKN ──► (mendaftarkan &
                          │                    │            mendampingi, +10 poin)
                          ▼                    ▼
                       RW (L1) ◄── diverifikasi ── PETUGAS RESIDU
                          │
                          ▼ (approve aktivasi bin & ide daur ulang)
                       WARGA (L0)
```

**Jalur Wilayah (rantai eskalasi):** Warga → RW → Lurah → Camat → Admin DLH → *(di atas Admin DLH)* Super User = Pimpinan.
**Jalur Akademik (KKN):** Mahasiswa KKN → DPL → Panitia Taskforce → Pimpinan (= Super User).
**Titik temu:** Super User dan Pimpinan **bukan dua role yang setara, melainkan satu role yang sama** — satu identitas puncak tunggal yang menaungi kedua jalur sekaligus (mendaftarkan Admin DLH, kelola RBAC, Audit Trail, Master QR, Master Wilayah, sekaligus oversight seluruh program KKN & full Rule Engine gamifikasi).
**Role pendukung non-berjenjang:** Petugas Residu (respons pertama sebelum eskalasi ke RW, diverifikasi RW).

---

## 📊 Ringkasan Kedudukan, Wewenang & Auth Antar-Level

| Level | Role | Jalur | Sifat Akses | Auth | Didaftarkan Oleh |
|---|---|---|---|---|---|
| Puncak (satu role) | **Super User = Pimpinan** | Teknis-Sistem & Akademik (satu role, dua sebutan) | Full access seluruh sistem | No HP (+62) + Password | Root/akun awal |
| 4 | Admin DLH | Wilayah | Pengawas kota + hak tulis khusus | No HP (+62) + Password | Super User = Pimpinan |
| −1 dari Pimpinan | **Panitia Taskforce** | Akademik | Koordinasi operasional + read-only lintas menu dampak/gamifikasi | No HP (+62) + Password | Admin DLH |
| 3 | Camat | Wilayah | Read-only (pengawas kecamatan) | No HP (+62) + Password | Admin DLH |
| — | DPL | Akademik | Operasional akademik (approval terbatas ke bimbingan) | No HP (+62) + Password | Admin DLH |
| 2 | Lurah | Wilayah | Read-only (pengawas kelurahan) | No HP (+62) + Password | Admin DLH |
| 1 | RW | Wilayah | Operasional (approval + input) | No HP (+62) + Password | Admin DLH |
| — | Petugas Residu | Pendukung operasional | Operasional lapangan | No HP (+62) + Password | Self-register, diverifikasi RW |
| — | Mahasiswa KKN | Akademik (enabler L0) | Operasional lapangan | No HP (+62) + Password | Self-register, whitelist Admin DLH |
| 0 | Warga | Wilayah | Input/transaksi harian | No HP (+62) + OTP | Mahasiswa KKN |

---

# 🔎 Feature Requirement Detail per Role

> Format tiap role: **Identitas** → **Relasi** → **Feature Requirement Lengkap** (Menu/Submenu → Fitur → Fungsi → Isi Halaman → Tabel → Chart → Hak Tulis). Baris yang menunjuk ke menu **KKN & Evaluasi Dampak**, **KPI & Gamifikasi**, atau **Audit Pengumpulan & Master Data House ID** adalah fitur dari 3 grup menu baru tersebut.

---

## 1️⃣ WARGA (Level 0)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + OTP |
| Platform | Mobile |
| Scope data | Individu, terikat ke 1 RW |
| Sifat akses | Input/transaksi harian |
| Didaftarkan oleh | Mahasiswa KKN |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| Mahasiswa KKN | Pendampingan | Registrasi awal, bantu scan aktivasi QR (+10 poin ke keduanya) |
| RW | Approval (naik) | Aktivasi tempat sampah & ide daur ulang harus disetujui RW |
| Petugas Residu | Operasional | Ditimbang & dicatat pelanggaran pemilahan oleh petugas |
| Lurah | Transitif | Tidak langsung — hanya lewat jalur Warga → RW → Kelurahan |

### Feature Requirement
| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Foto Sampah | Foto → AI klasifikasi Organik/Anorganik + confidence% | ✅ Input |
| 2 | Scan QR | Scan QR tempat sampah sesuai kategori, validasi & rekam setoran | ✅ Input |
| 3 | Poin Otomatis | `poin = berat(Kg) × confidence_AI × 0.9` | Otomatis (read) |
| 4 | Riwayat Setoran | Histori seluruh transaksi | Read |
| 5 | Leaderboard | Poin & ranking pribadi real-time | Read |
| 6 | Ide Daur Ulang | Submit ide → approve RW → +50 poin | ✅ Input |
| 7 | Notifikasi | Status bin, poin, jadwal, hasil approval | Read |
| 8 | Aktivasi Ulang | Ajukan reaktivasi bin `INACTIVE` (idle 30 hari) | ✅ Input |
| 9 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |
| 10 | *Sumber data Baseline/Endline (KKN & Evaluasi Dampak)* | Data diisi via wawancara Mahasiswa KKN, bukan input langsung Warga | — (tidak akses langsung) |

**State Machine Tempat Sampah:** `PRINTED → (KKN scan) ASSIGNED_TO_PIC → (Warga registrasi) PENDING_APPROVAL → (RW approve) ACTIVE_BOUND → (30 hari idle) INACTIVE → (ajukan ulang) kembali ke PENDING_APPROVAL`, atau `→ (RW tandai) BROKEN (permanen)`. Maks. 2 bin/rumah tangga (1 Organik + 1 Anorganik); Residu tidak punya bin sendiri.

---

## 2️⃣ PETUGAS RESIDU (Pendukung Operasional)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password (self-register) |
| Platform | Mobile (utama) + Web Portal `/residu-portal` |
| Scope data | Wilayah tugas, terikat ke RW tertentu |
| Sifat akses | Operasional lapangan |
| Didaftarkan oleh | Self-register, diverifikasi RW |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| RW | Naik (diverifikasi oleh) | Akun harus di-approve RW sebelum bertugas |
| Warga | Operasional | Menimbang residu, mencatat pelanggaran pemilahan |

### Feature Requirement
| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Dashboard Residu | Ringkasan monitoring timbulan & penjemputan | Read |
| 2 | Jadwal Harian | Antrian pengangkutan (window 06.00–08.00 & 16.00–18.00) | Read |
| 3 | Pending Logs | Daftar bin yang perlu ditimbang/diangkut | Read |
| 4 | Submit Log Timbangan | Input berat manual dari timbangan industri + foto bukti | ✅ Write |
| 5 | Catat Pelanggaran | Lapor pelanggaran pemilahan warga + foto bukti (poin warga berkurang) | ✅ Write |
| 6 | Analitik Residu | Grafik timbulan per wilayah | Read |
| 7 | Riwayat Setoran | Histori penimbangan | Read |
| 8 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |

**State Machine Verifikasi Akun:** `Self-register → PENDING → (RW verifikasi) APPROVED` atau `→ (RW tolak) REJECTED`.

**Posisi dalam alur:** respons pertama sebelum eskalasi wilayah — jika bin penuh tidak diklaim dalam window waktu, eskalasi naik ke RW (Level 1).

---

## 3️⃣ MAHASISWA KKN (Enabler Level 0, Jalur Akademik)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password (self-register) |
| Platform | Mobile (utama) + Web Portal `/kkn-portal` |
| Scope data | Zona/wilayah penugasan (polygon) + warga dampingan |
| Sifat akses | Operasional lapangan |
| Didaftarkan oleh | Self-register, di-whitelist Admin DLH |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| DPL | Naik (dibimbing oleh) | Monitoring absensi GPS, logbook, penilaian |
| Warga | Turun (mendampingi) | Registrasi & aktivasi bin warga (+10 poin bersama) |
| Admin DLH | Naik (di-whitelist oleh) | Approval akun sebelum login penuh |
| Panitia Taskforce, Pimpinan | Naik (diawasi) | Aktivitas dipantau di level institusi |

### Feature Requirement
| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Dashboard KKN | Statistik progress penugasan | Read |
| 2 | Validasi & Klaim Batch QR | Scan QR serah terima, klaim batch QR assigned | ✅ Write |
| 3 | Registrasi Warga | Daftarkan akun warga (+10 poin masing-masing) | ✅ Write |
| 4 | Aktivasi Tempat Sampah | Scan QR + GPS aktivasi bin warga | ✅ Write |
| 5 | Warga Dampingan | Daftar warga yang didampingi | Read |
| 6 | Location Ping | Ping GPS real-time (interval 5–10 menit) | Otomatis |
| 7 | Check-in/Check-out Absen | Absensi via GPS + polygon | ✅ Write |
| 8 | Pengajuan Izin/Sakit | Submit izin + foto bukti ke DPL | ✅ Write |
| 9 | Info Kelompok | Kelompok, anggota, DPL pembimbing | Read |
| 10 | Input Fasilitas & Pemanfaatan | Bantu catat data fasilitas & pemanfaatan sampah warga | ✅ Write |
| 11 | Activity Log | Logbook kegiatan lapangan | ✅ Write |
| 12 | Handover | Serah terima wilayah antar gelombang | ✅ Write |
| 13 | Input Form Wizard Baseline/Endline *(KKN & Evaluasi Dampak)* | Input data mentah `baseline_records` & `endline_records` di lapangan | ✅ Write |
| 14 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |

**State Machine Whitelist:** `Self-register → PENDING → (Admin DLH approve) APPROVED` atau `→ (Admin DLH reject) REJECTED`.

**Posisi dalam alur:** enabler Level 0, bukan bagian rantai eskalasi bin penuh.

---

## 4️⃣ RW — Ketua Rukun Warga (Level 1)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | 1 RW |
| Sifat akses | Operasional — hak tulis (approve/input) |
| Didaftarkan oleh | Admin DLH |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| Warga | Turun (approval) | Approve aktivasi bin, approve ide daur ulang, mark broken |
| Petugas Residu | Turun (verifikasi + monitoring) | Approve akun bertugas, pantau setoran/penimbangan |
| Lurah | Naik (diawasi) | RW berada di scope kelurahan |

### Feature Requirement Lengkap
| # | Menu/Submenu | Fitur | Fungsi | Tabel | Chart | Hak Tulis |
|---|---|---|---|---|---|---|
| 1 | Dashboard | Dashboard RW | Ringkasan warga aktif, bin pending, ide pending, fasilitas | — | KPI card | Read |
| 2 | Tata Kelola Sampah | Approval Tempat Sampah | Approve/reject aktivasi bin (`PENDING_APPROVAL → ACTIVE_BOUND`) | Tabel pengajuan bin | — | ✅ Write |
| 3 | Tata Kelola Sampah | Approval Ide Daur Ulang | Approve/reject ide (+50 poin jika approve) | Tabel ide pending | — | ✅ Write |
| 4 | Manajemen Data / Fasilitas | Verifikasi & CRUD Fasilitas | Approve registrasi + kelola data fasilitas (Loseda, Maggot, POC) | Tabel fasilitas | — | ✅ Write |
| 5 | Manajemen Data | Input Produksi | Catat material masuk & hasil panen fasilitas | Tabel riwayat produksi | Bar Chart (opsional) | ✅ Write |
| 6 | Manajemen Tempat Sampah | Mark Broken | Tandai bin rusak permanen (`BROKEN`) | Tabel bin aktif | — | ✅ Write |
| 7 | Monitoring | Monitoring Residu | Pantau setoran Petugas Residu di wilayahnya | Tabel log residu | Line Chart tren residu | Read |
| 8 | Monitoring Wilayah | Monitoring Wilayah | Peta sebaran bin & warga se-RW | — | Peta interaktif | Read |
| 9 | Portal KKN / Monitoring Dampak *(KKN & Evaluasi Dampak)* | Baseline & Hambatan, Endline, Komparasi Dampak | Cross-check kondisi warga binaan di wilayahnya | Tabel List Warga | Pie, Bar, Radar, Side-by-side Bar, Line | **Read-only** |
| 10 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | HSCR Wilayah (Peringkat & Kepatuhan) | Kepatuhan wilayah sendiri | Leaderboard RT dalam RW | Gauge, Line Chart | Read |
| 11 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | Rapor Warga (WSCS) | Detail WSCS, level, streak, badge (**nama asli tampil**) | Tabel WSCS interaktif | Radar Chart per warga | Read |
| 12 | Manajemen Pengumpulan *(Audit Pengumpulan & Master Data House ID)* | Audit Lapangan | Input & lihat checklist serah terima sampah di wilayahnya | Tabel audit harian | Donut Chart kepatuhan SOP | ✅ Write |
| 13 | Master Data *(Audit Pengumpulan & Master Data House ID)* | Data Rumah & House ID | Kelola identitas rumah tangga di wilayahnya | Tabel House ID | — | ✅ Write (CRUD) |
| 14 | Pengaturan | Profil | Edit profil, ubah password | — | — | ✅ Write (data sendiri) |

**Posisi eskalasi:** Level 1 — penerima eskalasi pertama saat bin penuh tidak diklaim Petugas Residu dalam window waktu. Tidak ditindaklanjuti → naik ke Lurah.

---

## 5️⃣ DPL — Dosen Pembimbing Lapangan (Jalur Akademik)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | 1 kelompok KKN bimbingan |
| Sifat akses | Operasional akademik — approval terbatas ke mahasiswa bimbingan |
| Didaftarkan oleh | Admin DLH |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| Mahasiswa KKN | Turun (membimbing) | Monitoring absensi GPS, logbook, approve izin/sakit, beri skor |
| Panitia Taskforce | Naik (dikoordinasikan) | Berada di bawah koordinasi operasional Taskforce |
| Pimpinan | Naik (diawasi) | Aktivitas dipantau institusi |

### Feature Requirement
| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Dashboard KKN | Ringkasan kelompok bimbingan | Read |
| 2 | Kelompok KKN | Lihat kelompok yang dibimbing | Read |
| 3 | Portofolio Mahasiswa | Detail mahasiswa (NIM, jurusan, skor, aktivitas) | Read |
| 4 | Penilaian Mahasiswa | Submit assessment score | ✅ Write |
| 5 | Approval Izin/Sakit | Approve/reject pengajuan mahasiswa | ✅ Write |
| 6 | Peta Cakupan | Sebaran polygon RW & titik koordinat bin KKN | Read |
| 7 | Monitoring Absen | Kehadiran mahasiswa bimbingan via GPS ping | Read |
| 8 | Warga Dampingan | Warga yang didampingi per mahasiswa | Read |
| 9 | Riwayat Approval | Histori keputusan logbook | Read |
| 10 | Baseline & Hambatan, Endline, Komparasi Dampak *(KKN & Evaluasi Dampak, scope kelompok)* | Memantau & memvalidasi data warga binaan | ✅ **Validasi/Revisi** |
| 11 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |

**Posisi dalam alur:** jalur akademik KKN, terpisah dari rantai eskalasi wilayah.

---

## 6️⃣ LURAH — Admin Kelurahan (Level 2)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | 1 Kelurahan |
| Sifat akses | Read-only (pengawas) |
| Didaftarkan oleh | Admin DLH |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| RW | Turun (mengawasi) | Mengawasi performa seluruh RW, termasuk kehadiran Mahasiswa KKN |
| Camat | Naik (diawasi) | Kelurahan berada di scope kecamatan |

### Feature Requirement Lengkap
| # | Menu/Submenu | Fitur | Fungsi | Tabel | Chart | Hak Tulis |
|---|---|---|---|---|---|---|
| 1 | Dashboard | Dashboard KPI Kelurahan | Warga aktif, timbulan, compliance score, alert | — | KPI card | Read |
| 2 | Monitoring | Monitoring Wilayah Sekelurahan | Peta kelurahan dengan detail tiap RW | — | Peta | Read |
| 3 | Monitoring | Monitoring Aktivitas Warga & RW | Aktivitas warga (setoran/poin) & RW (approval) | Tabel log aktivitas | — | Read |
| 4 | Rekap | Rekap Setoran | Laporan setoran scope kelurahan | Tabel rekap | Bar/Line Chart | Read |
| 5 | Laporan | Laporan & Leaderboard Kelurahan | Analitik + ranking RW/warga | Tabel leaderboard | Chart analitik | Read |
| 6 | Manajemen Tempat Sampah | Manajemen Tempat Sampah | Data bin scope kelurahan | Tabel bin | — | Read-only |
| 7 | Export | Export Data Sekelurahannya | Unduh seluruh data kelurahan | — | — | Read (aksi export) |
| 8 | Portal KKN / Monitoring Dampak *(KKN & Evaluasi Dampak)* | Baseline & Hambatan, Endline, Komparasi Dampak | Rekap hambatan untuk kebijakan intervensi tingkat kelurahan | Tabel List Warga, Matriks Delta | Pie, Bar, Radar, Side-by-side Bar, Line | Read-only |
| 9 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | HSCR Wilayah | Kepatuhan agregat se-kelurahan | Leaderboard RW | Gauge, Line Chart | Read |
| 10 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | Rapor Warga (WSCS) | Lihat WSCS warga (**House ID disamarkan**) | Tabel WSCS (House ID) | Radar Chart | Read |
| 11 | Manajemen Pengumpulan *(Audit Pengumpulan & Master Data House ID)* | Audit Lapangan | Monitoring SOP serah terima se-kelurahan | Tabel audit | Donut Chart | Read-only |
| 12 | Pengaturan | Profil | Edit profil, ubah password | — | — | ✅ Write (data sendiri) |

**Batasan:** semua operasi tulis (POST/PUT/DELETE/PATCH) ditolak kecuali profil sendiri & notifikasi pribadi.

**Posisi eskalasi:** Level 2 — menerima eskalasi dari RW jika tidak ditindaklanjuti. Tidak ditindaklanjuti → naik ke Camat.

---

## 7️⃣ CAMAT — Admin Kecamatan (Level 3)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | 1 Kecamatan |
| Sifat akses | Read-only (pengawas) |
| Didaftarkan oleh | Admin DLH |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| Lurah | Turun (mengawasi) | Mengawasi timbulan sampah & progres KKN seluruh kelurahan |
| Admin DLH | Naik (diawasi) | Kecamatan berada di scope kota |

### Relasi Data
```
Camat → Kecamatan (1:1)
Kecamatan → Kelurahan (1:N)
Kelurahan → RW (1:N)
```

### Feature Requirement Lengkap
| # | Menu/Submenu | Fitur | Fungsi | Tabel | Chart | Hak Tulis |
|---|---|---|---|---|---|---|
| 1 | Dashboard | Dashboard KPI Kecamatan | Agregat seluruh kelurahan | — | KPI card | Read |
| 2 | Monitoring | Monitoring Wilayah Sekecamatan | Peta & perbandingan antar-kelurahan | — | Bar Chart | Read |
| 3 | Monitoring | Monitoring Aktivitas Kelurahan & RW | Drill-down aktivitas tiap kelurahan/RW | Tabel log aktivitas | — | Read |
| 4 | Rekap | Rekap Setoran | Laporan teragregasi kecamatan | Tabel rekap | Bar/Line Chart | Read |
| 5 | Leaderboard | Leaderboard | Ranking seluruh kelurahan/RW/warga | Tabel leaderboard | — | Read |
| 6 | Manajemen Tempat Sampah | Manajemen Tempat Sampah | Data bin se-kecamatan | Tabel bin | — | Read-only |
| 7 | Export | Export Dataset | Unduh data tingkat kecamatan | — | — | Read (aksi export) |
| 8 | Portal KKN / Monitoring Dampak *(KKN & Evaluasi Dampak)* | Baseline, Endline, Komparasi Dampak | Rekap hambatan untuk kebijakan tingkat kecamatan | Tabel List Warga, Matriks Delta | Pie, Bar, Radar, Side-by-side Bar, Line | Read-only |
| 9 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | HSCR Wilayah | Kepatuhan agregat se-kecamatan | Leaderboard kelurahan | Gauge, Line Chart | Read |
| 10 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | Rapor Warga (WSCS) | Lihat WSCS warga (**House ID disamarkan**) | Tabel WSCS (House ID) | Radar Chart | Read |
| 11 | Manajemen Pengumpulan *(Audit Pengumpulan & Master Data House ID)* | Audit Lapangan | Monitoring SOP se-kecamatan | Tabel audit agregat | Donut Chart | Read-only |
| 12 | Pengaturan | Profil | Edit profil, ubah password | — | — | ✅ Write (data sendiri) |

**Posisi eskalasi:** Level 3 — menerima eskalasi dari Lurah. Tidak ditindaklanjuti → naik ke Admin DLH (final).

---

## 8️⃣ ADMIN DLH — Dinas Lingkungan Hidup (Level 4, Puncak Jalur Wilayah)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | Seluruh Kota |
| Sifat akses | Pengawas utama + beberapa hak tulis khusus |
| Didaftarkan oleh | Super User |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| Camat, Lurah, RW, DPL | Turun (mendaftarkan + mengawasi) | Satu-satunya (selain Super User) yang mendaftarkan role pemerintahan & DPL |
| Mahasiswa KKN | Approval | Whitelist — approve/reject sebelum login |
| Super User | Naik (diawasi & didaftarkan oleh) | Didaftarkan Super User sebagai pengawas utama kota |

### Feature Requirement Lengkap
| # | Menu/Submenu | Fitur | Fungsi | Tabel | Chart | Hak Tulis |
|---|---|---|---|---|---|---|
| 1 | Dashboard | Dashboard KPI Kota | Performa seluruh kecamatan/kelurahan | — | KPI card | Read |
| 2 | Registrasi | Registrasi Hierarkis | Mendaftarkan Camat, Lurah, RW, DPL | Tabel akun terdaftar | — | ✅ Write |
| 3 | Whitelist | Whitelist Mahasiswa KKN | Approve/reject pendaftaran mandiri | Tabel status whitelist | — | ✅ Write |
| 4 | Monitoring | Monitoring Seluruh Wilayah | Kecamatan, kelurahan, KKN, petugas se-kota | — | Bar/Line Chart | Read |
| 5 | AI | Review Diskrepansi AI | Resolve perbedaan klasifikasi AI vs manual petugas | Tabel diskrepansi | — | ✅ Write |
| 6 | Rekap & Laporan | Rekap Setoran & Laporan Analitik | Level kota, semua wilayah | Tabel rekap | Chart analitik | Read |
| 7 | Export | Export Dataset | Unduh data seluruh kota | — | — | Read (aksi export) |
| 8 | Master Data | Master Wilayah | CRUD Kecamatan/Kelurahan/RW | Tabel wilayah | — | ✅ Write (CRUD) |
| 9 | Portal KKN / Monitoring Dampak *(KKN & Evaluasi Dampak)* | Baseline, Endline, Komparasi Dampak | Rekap hambatan level kota untuk kebijakan | Tabel List Warga, Matriks Delta | Pie, Bar, Radar, Side-by-side Bar, Line | Read-only |
| 10 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | HSCR Wilayah | Kepatuhan agregat se-kota | Leaderboard kecamatan | Gauge, Line Chart | Read |
| 11 | Analitik Dampak / Gamifikasi *(KPI & Gamifikasi)* | Rapor Warga (WSCS) | Lihat WSCS warga (**nama asli tampil**) | Tabel WSCS (nama asli) | Radar Chart | Read |
| 12 | Pengaturan Sistem *(KPI & Gamifikasi)* | Konfigurasi Rule Engine | Lihat bobot poin & threshold (tanpa ubah) | Tabel Rules Level & Badge | — | ❌ **Read-only** |
| 13 | Manajemen Pengumpulan *(Audit Pengumpulan & Master Data House ID)* | Audit Lapangan | Input & lihat checklist se-kota | Tabel audit | Donut Chart | ✅ Write |
| 14 | Master Data *(Audit Pengumpulan & Master Data House ID)* | Data Rumah & House ID | Kelola seluruh data rumah tangga (cleansing) | Tabel House ID | — | ✅ Write (CRUD) |
| 15 | Pengaturan | Profil | Edit profil, ubah password | — | — | ✅ Write (data sendiri) |

**Posisi eskalasi:** Level 4 (final) — titik akhir rantai eskalasi bin penuh jika RW, Lurah, Camat tidak menindaklanjuti.

---

## 9️⃣ PANITIA TASKFORCE (1 Tingkat di Bawah Pimpinan)

### Identitas
| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope data | Seluruh institusi (semua kelompok KKN) |
| Sifat akses | Operasional harian + read-only lintas menu dampak/gamifikasi, **satu tingkat di bawah Pimpinan** |
| Didaftarkan oleh | Admin DLH |

### Relasi
| Relasi ke | Jenis | Detail |
|---|---|---|
| DPL, Mahasiswa KKN | Koordinasi (turun) | Operasional & administrasi KKN sehari-hari, lintas kelompok |
| **Super User = Pimpinan** | **Naik (dikoordinasikan oleh, 1 tingkat di bawah)** | Panitia Taskforce menjalankan operasional atas arahan Pimpinan (= Super User); diawasi & dievaluasi kinerjanya oleh role puncak ini |

### Feature Requirement
| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Dashboard Utama & KKN | Overview seluruh program KKN | Read |
| 2 | Manajemen Pengguna | Lihat semua user | Read |
| 3 | Master Wilayah | Lihat data wilayah | Read |
| 4 | Monitoring Absen | Kehadiran seluruh mahasiswa | Read |
| 5 | Manajemen Tempat Sampah | Lihat data bin | Read |
| 6 | Rekap Setoran & Laporan Analitik | Lihat laporan & chart | Read |
| 7 | Review Diskrepansi AI | Lihat hasil review AI | Read |
| 8 | Pengguna Online | Monitor real-time | Read |
| 9 | Baseline, Endline, Komparasi Dampak *(KKN & Evaluasi Dampak, semua kelompok)* | Rekap dampak lintas kelompok KKN | Read-only |
| 10 | HSCR Wilayah *(KPI & Gamifikasi, semua wilayah)* | Kepatuhan agregat seluruh wilayah program | Read-only |
| 11 | Koordinasi Operasional KKN | Administrasi harian program KKN lintas kelompok | ✅ Operasional (bukan hak tulis data sistem) |
| 12 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |

**Posisi dalam alur:** jalur institusi/akademik, level operasional — di bawah Pimpinan, mengoordinasikan DPL & Mahasiswa KKN.

---

## 🔟 SUPER USER = PIMPINAN — Satu Role yang Sama (Puncak Hierarki)

> **Super User dan Pimpinan bukan dua role yang setara, melainkan satu role tunggal.** "Super User" dan "Pimpinan" hanyalah dua sebutan/titik masuk untuk satu identitas peran yang sama, dengan **satu set fitur dan hak akses yang identik** — full access ke seluruh sistem, mencakup domain teknis (RBAC, Audit Trail, Master QR, Master Wilayah, Data Cleansing) sekaligus domain akademik-institusi (oversight KKN, Rule Engine gamifikasi).

### Identitas

| Atribut | Nilai |
|---|---|
| Auth | No HP (+62) + Password |
| Platform | Web |
| Scope | Seluruh sistem (tanpa batasan) |
| Sifat akses | Full Access — satu role untuk kedua sebutan (Super User / Pimpinan) |
| Didaftarkan oleh | — (akun root/awal sistem) |

### Feature Requirement Lengkap (berlaku sama untuk sebutan Super User maupun Pimpinan)

| # | Fitur | Fungsi | Hak Tulis |
|---|---|---|---|
| 1 | Dashboard Agregat | KPI seluruh kecamatan + overview seluruh program KKN | Read |
| 2 | Manajemen Pengguna | CRUD seluruh user semua role | ✅ Write |
| 3 | Rule Engine & RBAC | Kelola konfigurasi sistem & permission dinamis | ✅ Write |
| 4 | Audit Trail | Jejak perubahan data (immutable log) | Read |
| 5 | Master QR & Inaktif | Generate batch QR, reaktivasi bin inaktif | ✅ Write |
| 6 | Review Diskrepansi AI | Review seluruh setoran flagged | ✅ Write |
| 7 | Manajemen Tempat Sampah | Full CRUD + replace bin rusak | ✅ Write |
| 8 | Master Wilayah | CRUD hierarki Kecamatan→Kelurahan→RW | ✅ Write |
| 9 | Pengguna Online | Monitor real-time + force logout | ✅ Write |
| 10 | Handover KKN | Serah terima antar gelombang mahasiswa | ✅ Write |
| 11 | Monitoring Absen | Kehadiran seluruh mahasiswa KKN | Read |
| 12 | Data Cleansing | Purge data duplikat | ✅ Write |
| 13 | Circular Economy Report | Laporan ekonomi sirkular | Read |
| 14 | Flash Drop Event | Buat event pembuangan berhadiah | ✅ Write |
| 15 | Baseline, Endline, Komparasi Dampak *(KKN & Evaluasi Dampak, seluruh kelompok)* | Oversight dampak seluruh kelompok KKN | Read-only |
| 16 | HSCR Wilayah *(KPI & Gamifikasi)* | Kepatuhan seluruh wilayah program | Read |
| 17 | Rapor Warga (WSCS) *(KPI & Gamifikasi)* | Lihat WSCS warga | Read |
| 18 | Konfigurasi Rule Engine *(KPI & Gamifikasi)* | Full CRUD bobot WSCS, threshold Level & Badge | ✅ Write |
| 19 | Profil | Edit profil, ubah password | ✅ Write (data sendiri) |

### Relasi
Mendaftarkan **Admin DLH**; mengawasi seluruh role di jalur wilayah maupun akademik; berada **di luar rantai eskalasi wilayah** (bertindak sebagai puncak pengelola sistem & institusi); mengawasi **Panitia Taskforce** (1 tingkat di bawahnya), yang selanjutnya mengoordinasikan **DPL** dan **Mahasiswa KKN**.

---

# 📐 Tabel Ringkasan Akses — Menu KKN & Evaluasi Dampak / KPI & Gamifikasi / Audit & House ID

| Role | KKN & Evaluasi Dampak | KPI & Gamifikasi — HSCR/WSCS | KPI & Gamifikasi — Rule Engine | Audit Pengumpulan & House ID |
|---|---|---|---|---|
| **Super User = Pimpinan** (satu role) | ✅ Read-only (semua kelompok) | ✅ Read | ✅ Full CRUD | ✅ Full akses |
| Admin DLH | ✅ Read-only (kota) | ✅ Read (nama asli) | ❌ Read-only | ✅ Read+Write (kota) |
| **Panitia Taskforce** | ✅ Read-only (semua kelompok) | ✅ Read-only (semua wilayah, HSCR) | ❌ | ❌ |
| Camat | ✅ Read-only (kecamatan) | ✅ Read (House ID) | ❌ | ✅ Read-only (kecamatan) |
| Lurah | ✅ Read-only (kelurahan) | ✅ Read (House ID) | ❌ | ✅ Read-only (kelurahan) |
| DPL | ✅ Read + Validasi (kelompok) | ❌ | ❌ | ❌ |
| RW | ✅ Read-only (scope RW) | ✅ Read (nama asli) | ❌ | ✅ Read+Write (scope RW) |

> Baris "Super User = Pimpinan" digabung menjadi satu karena keduanya kini satu role yang sama, bukan dua role terpisah dengan hak setara — sehingga tidak ada lagi perbedaan akses antara "sebutan Super User" dan "sebutan Pimpinan".

---

# ✅ Ringkasan Perubahan dari Versi Sebelumnya

1. **Auth diseragamkan** — seluruh role (termasuk DPL, Panitia Taskforce, Pimpinan, Super User, Petugas Residu, Mahasiswa KKN) kini konsisten pakai **No HP (+62) + Password**; Warga tetap No HP + OTP.
2. **Super User dan Pimpinan digabung menjadi satu role yang sama** (bukan sekadar setara) — satu identitas puncak tunggal dengan satu set fitur & hak akses identik, mencakup seluruh domain teknis-sistem sekaligus akademik-institusi.
3. **Penamaan menu diperjelas** — "Modul A/B/C" tidak lagi dipakai sebagai istilah; digantikan judul aslinya: **KKN & Evaluasi Dampak**, **KPI & Gamifikasi**, dan **Audit Pengumpulan & Master Data House ID**, ditulis sebagai penanda konteks di kolom Menu/Submenu tiap role.

---

# 📋 Koreksi Inkonsistensi dari Dokumen Sumber (Tetap Berlaku)

1. **RW & menu KKN/Evaluasi Dampak** — dikoreksi jadi **Read-only** (dokumen sumber lama sempat menulis "tidak disebutkan").
2. **Lurah/Camat & Audit Pengumpulan** — dikoreksi jadi **Read-only** (dokumen sumber lama sempat menulis "perlu konfirmasi").
3. **Panitia Taskforce & HSCR Wilayah** — dikoreksi jadi **Read-only** (dokumen sumber lama sempat menulis "tidak disebutkan").


