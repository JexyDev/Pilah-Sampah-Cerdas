# SPEC FINAL � BERSEKA (Hasil Klarifikasi Meeting 27 Juli 2026)

> Dokumen ini adalah **keputusan final** dari semua pertanyaan kritis di MEETING_BREAKDOWN_27JULI2026.md. Statusnya sudah **disetujui**, bukan lagi opsi/pertanyaan. AI agent atau developer manapun yang lanjut development **wajib ikut spesifikasi ini**, tidak boleh berasumsi lain.

---

## 0. Aturan Bahasa & Istilah (WAJIB, Karena Untuk Pemerintahan)

- Semua istilah UI, dokumentasi, dan nama entitas **wajib Bahasa Indonesia baku sesuai KBBI**, konsisten dengan standar industri internasional dalam hal struktur data.
- **Istilah wajib dipakai:** 	empat sampah
- **Istilah DILARANG dipakai** di manapun (UI, FE web, mobile, database label yang tampil ke user): 	ong sampah, 	ong, atau sinonim lain.
- Ini proyek pemerintahan yang direview oleh CEO S3 � **tidak boleh ada typo atau inkonsistensi istilah kecil sekalipun.** Setiap PR yang menyentuh teks UI wajib di-review khusus untuk konsistensi bahasa ini sebelum merge.

---

## 1. Aturan Timestamp & Audit

- **Sumber waktu:** jam **server saja** (bukan device user) � karena semua data terpusat di Bandung, timezone Asia/Jakarta (WIB).
- **Semua data dicatat timestamp-nya**, tanpa terkecuali � created_at wajib di setiap tabel/collection.
- **Setiap perubahan status/histori juga dicatat timestamp sendiri per perubahan** (bukan cuma 1 timestamp terakhir). Artinya perlu tabel/collection log terpisah untuk history perubahan status, contoh:
status_history {
  id
  reference_id
  reference_type
  status_from
  status_to
  changed_at
  changed_by
}

- Prinsip: **semua tertracking penuh (full audit trail)** � tidak ada perubahan data yang tidak punya jejak waktu.

---

## 2. Aturan Angka & Satuan

- **Satuan distandarkan: Kg saja** di seluruh sistem (tidak ada pilihan liter/karung, semua dikonversi ke Kg).
- **Penulisan "Kg" (K besar, g kecil) sesuai KBBI/SI, dipakai di JUDUL/HEADER kolom saja** � bukan diulang di tiap isi tabel.
  - ? Benar � Header kolom: Berat (Kg) ? isi tabel: 25
  - ? Salah � isi tabel: 25 Kg (satuan tidak perlu diulang di tiap baris data)
  - Di tempat lain yang bukan tabel (misal ringkasan/summary card, notifikasi), boleh ditulis lengkap: 25 Kg.
- Field database tetap dipisah sesuai aturan sebelumnya: erat: number (contoh: 25), unit: "Kg" (constant, tidak berubah-ubah).

---

## 3. QR Code & Deteksi Sampah (Flow Final)

**Lokasi QR:** dipasang di setiap **tempat sampah** (bukan di kartu warga).

**Alur lengkap saat warga membuang sampah:**
1. Warga foto sampahnya via app
        ?
2. Foto dianalisis oleh AI model
        ?
3. AI mengeluarkan hasil klasifikasi: "organik" atau "anorganik" + confidence score
        ?
4. App otomatis mengarahkan warga untuk scan QR di TEMPAT SAMPAH yang sesuai
        ?
5. Warga scan QR ? data tercatat (lihat dokumentasi foto juga disimpan agar bisa dilihat petugas)

**Detail teknis:**
- QR dipakai khusus untuk: **warga saat membuang sampah** (bukan untuk absen kehadiran mahasiswa � itu pakai GPS+polygon, lihat bagian 6).
- Dokumentasi foto yang diambil warga **disimpan dan bisa dilihat oleh petugas** (untuk verifikasi/keperluan audit).
- Model AI klasifikasi organik/anorganik: **integrasi dengan model dari vendor/industri** � tim backend perlu siapkan endpoint/interface untuk menerima hasil klasifikasi (bukan membangun model ML sendiri, kecuali dinyatakan lain nanti).
- Auto-focus kamera tetap dipakai untuk mempercepat proses scan QR di langkah 5.

---

## 4. Menu Pengangkutan & Permintaan Pengangkutan (Final)

- Petugas pengangkut **ditugaskan otomatis berdasarkan area terdekat**, menggunakan data **polygon wilayah** (lihat bagian 5).
- **Semua status dipakai:** menunggu ? diterima ? dalam perjalanan ? selesai (dan dibatalkan jika perlu).
- **Notifikasi ke warga saat status berubah** � scope pengerjaan: **tim mobile**, buat spesifikasi/list requirement notifikasi untuk diteruskan ke tim mobile (siapkan daftar trigger notifikasi per perubahan status).

---

## 5. Registrasi, Role, & Aktivasi (Final)

### 5.1 Role yang Ada
- Warga
- **RT** ? **role baru, belum ada di sistem, WAJIB dikembangkan**
- RW
- Pengangkut
- Admin Kelurahan (monitoring only)
- Admin Kecamatan (monitoring only)
- SUPER USER (akses penuh)
- Mahasiswa KKN
- DPL (Dosen Pembimbing Lapangan)

**Setiap role independen** � masing-masing punya alur registrasi & data yang berbeda satu sama lain (tidak ada 1 form registrasi generik untuk semua role).

### 5.2 Aktivasi Registrasi (Tanpa Approval Manual)
- **Tidak perlu approval manual dari admin.**
- Sistem otomatis mengecek: **lokasi GPS warga saat registrasi** dicocokkan dengan **RT/RW yang dia input manual di form**.
- Jika lokasi sesuai dengan wilayah RT/RW yang diinput ? **otomatis ter-aktivasi (auto-accept)**, tanpa proses approval dari siapapun.

### 5.3 Aktivasi Tempat Sampah (Terpisah dari Registrasi Akun)
- Warga **bisa registrasi akun**, tapi untuk bisa membuang sampah (tertrack di sistem), **wajib aktivasi tempat sampah miliknya dulu** secara terpisah.
- **Mahasiswa KKN bertugas membantu** warga yang tidak bisa melakukan aktivasi tempat sampah sendiri (misal warga lansia/gaptek).

---

## 6. Polygon � DUA Fitur Berbeda (Jangan Tertukar!)

?? **Penting:** ini ada **2 sistem polygon yang benar-benar terpisah**, jangan dicampur logic-nya.

### 6.1 Polygon Warga (Zona Wilayah RT/RW)
- **Tujuan:** membagi wilayah berdasarkan data RT/RW warga, dipakai untuk auto-assign petugas pengangkut terdekat & visualisasi peta wilayah.
- **Dibuat otomatis oleh sistem**, bukan digambar manual admin � sistem mengumpulkan data lokasi rumah semua warga yang terdaftar di RT/RW yang sama, lalu menggambar garis detail dari **rumah ke rumah**, membentuk 1 zona wilayah.
- **Warna zona** merepresentasikan akumulasi data pembuangan sampah dari warga di area tersebut (misal: makin aktif buang sampah & makin banyak volumenya ? warna makin "hidup"/pekat � perlu didetailkan lagi skala warnanya saat desain UI).
- **Interaksi UI (drill-down zoom):**
  - Klik zona besar (misal kelurahan) ? zoom in ke detail RW
  - Klik lagi di dalam situ ? zoom in lebih detail lagi ke RT/rumah individual
  - Bertingkat, bukan cuma 1 level zoom.

### 6.2 Polygon Monitoring Mahasiswa (Zona Kegiatan KKN)
- **Tujuan:** mendefinisikan area kegiatan KKN tempat mahasiswa harus berada, dipakai untuk validasi kehadiran/absensi.
- **Berbeda dari 6.1** � ini bukan otomatis dari data warga, melainkan zona kegiatan yang sudah ditentukan sesuai diskusi project (dianggap sudah presisi mencakup rumah-rumah warga yang relevan di area kegiatan tsb).
- Dipakai murni untuk tracking GPS mahasiswa masuk/keluar zona (detail lengkap di bagian 7).

---

## 7. Rule Kehadiran Mahasiswa KKN (Final)

- **Threshold hadir default: 2 jam akumulasi** di dalam zona kegiatan (Polygon 6.2).
- **Metode tracking:** GPS mahasiswa dipantau **terus-menerus tapi dengan interval delay 5�10 menit** (bukan real-time tanpa jeda) � demi efisiensi baterai & data.
- **Tidak ada toleransi radius** di luar polygon � karena zona kegiatan KKN sudah dirancang detail & presisi mencakup rumah warga yang relevan sejak awal.
- **Jika mahasiswa keluar dari zona:** terdeteksi sistem, dan **waktu di luar zona tidak dihitung** ke akumulasi kehadiran.
- **Status kehadiran hanya 1 jenis:** Hadir � dihitung murni dari total durasi mahasiswa berada di dalam zona kegiatan (tidak ada status "hadir sebagian" dsb).
- **Absen wajib 2x: datang dan pulang**, hasilnya diakumulasikan menjadi total durasi hadir dalam sehari.
- **Verifikasi kehadiran otomatis oleh sistem** (bukan manual approve DPL) � syarat: mahasiswa login app + GPS tracking aktif.
- **DPL tetap punya menu terpisah:** monitoring kehadiran mahasiswa + penilaian aktivitas mahasiswa (fleksibel, bukan untuk verifikasi absen, tapi untuk assessment/pemantauan performa).

---

## 8. Aktivitas Pemilahan Sampah (Rename dari "Audit Trail")

- Istilah resmi diganti jadi **"Aktivitas Pemilahan Sampah"** (bukan "Audit Trail" � lebih sesuai KBBI & terdengar standar industri internasional untuk konteks government project).
- **Tidak ada CRUD sama sekali** � data ini murni log real (immutable, read-only untuk semua role, termasuk SUPER USER tidak edit manual, hanya sistem yang menulis).
- Status/kondisi yang tercatat termasuk kondisi **"bermasalah"** � contoh pemicu: tempat sampah milik warga **rusak** (perlu didefinisikan trigger detail teknis kondisi rusak ini saat desain fitur monitoring perangkat/tempat sampah).
- **Struktur data seragam sesuai standar internasional industri**, dipakai konsisten di 3 sub-aktivitas (pemilahan, pengangkutan, pemanfaatan) dalam Menu Aktivitas Tata Kelola Sampah.

### 8.1 Hak Akses (Penting, Sudah Final)

| Role | Akses ke Aktivitas Pemilahan Sampah (data mentah/real) |
|------|----------------------------------------------------------|
| **SUPER USER** | ? Akses penuh (satu-satunya yang boleh lihat data mentah lengkap) |
| **Admin Kelurahan** | ? Tidak akses data mentah � hanya dashboard **monitoring** (UI ringkasan, dibuat semenarik mungkin, bukan data tabel mentah) |
| **Admin Kecamatan** | ? Sama seperti Admin Kelurahan � monitoring saja |
| **Warga** | ? Tidak ada akses sama sekali ke fitur ini |

? **Implikasi:** perlu dibuat 2 tampilan berbeda untuk data yang sama secara konsep � (1) tabel data mentah khusus SUPER USER, dan (2) dashboard monitoring visual (chart/summary, bukan tabel mentah) khusus Admin Kelurahan/Kecamatan.

---

## 9. Riwayat Setoran (Final)

- **Poin dan berat WAJIB dipisah** (dua field berbeda) � dikonfirmasi karena menggabungkan keduanya dianggap tidak sesuai standar industri internasional.
- **Rumus konversi poin:** poin = berat (Kg) � confidence_AI � 0.9
  *(confidence_AI = nilai keyakinan hasil klasifikasi AI organik/anorganik dari bagian 3, dalam skala 0�1)*
- **Leaderboard yang bisa dilihat warga: hanya leaderboard "Poin Terbanyak"** (bukan leaderboard berat/volume).

---

## 10. Pemanfaatan: Buruan Sae, Rumah Maggot, POC (Final)

- **Field spesifik untuk tiap program** perlu riset lanjutan (referensi dari sumber resmi/Google terkait definisi & data yang lazim dicatat untuk Buruan Sae, Rumah Maggot budidaya BSF, dan POC/Pupuk Organik Cair) � disesuaikan kebutuhan lapangan saat desain skema data.
- **Yang input data: RW** (bukan warga langsung, bukan admin kelurahan).
- **TIDAK otomatis terhubung dari data Riwayat Setoran warga** � artinya input bahan baku/hasil program ini **manual dicatat oleh RW**, bukan pipeline otomatis dari sampah organik yang disetor warga.
- **Setiap hasil wajib dicatat di sistem oleh RW**, termasuk **dokumentasi foto** hasilnya (mirip pola dokumentasi foto di fitur QR/setoran).

### 10.1 Menu Hasil Pemanfaatan Sampah
- **Perlu CRUD juga** (bukan cuma tampilan read-only).
- **Data ditampilkan dengan 3 mode filter default:** realtime, mingguan, bulanan.

---

## 11. Papan Peringkat / Leaderboard (Final)

| Kategori | Rumus Ranking |
|----------|----------------|
| **Warga** | Berdasarkan **poin terbanyak** (dari rumus poin bagian 9) |
| **RT/RW** | Berdasarkan **total volume sampah (Kg) yang dikelola** di wilayahnya |
| **Kelurahan** | Berdasarkan **total volume sampah (Kg) yang dikelola** se-kelurahan |
| **Pengangkut** | *(belum didetailkan rumusnya � perlu klarifikasi lanjutan, lihat bagian "Catatan Terbuka")* |

- **Periode:** **all-time**, ditampilkan **real-time** (tidak ada reset periodik bulanan/tahunan untuk versi awal ini).
- **Visibilitas:** **Publik** � semua orang bisa melihat ranking di **semua daerah** (bukan cuma daerah sendiri), tujuannya memancing warga untuk termotivasi masuk leaderboard.

---

## 12. Redeem Poin

- **TIDAK dikembangkan dulu** � fitur ini di-defer karena mekanismenya belum jelas/disepakati. Jangan bangun fitur ini di iterasi sekarang, cukup pastikan struktur data poin (bagian 9) fleksibel untuk kemungkinan ditambah fitur redeem nanti.

---

## 13. Struktur Mahasiswa, Kelompok, DPL (Final)

- Mahasiswa, Kelompok Mahasiswa, dan DPL **punya alur registrasi sendiri**, terpisah dari warga � karena kebutuhan datanya berbeda (misal: NIM, universitas, kelompok, DPL pembimbing, zona kegiatan yang ditugaskan, dst � detail field perlu didesain terpisah).
- **DPL punya 2 fungsi di sistem:**
  1. **Monitoring kehadiran** mahasiswa bimbingannya (lihat data dari bagian 7)
  2. **Penilaian aktivitas mahasiswa** (assessment performa, terpisah dari data absen otomatis)
- Struktur kelompok mahasiswa **terhubung ke zona kegiatan (Polygon 6.2)** � kelompok ditugaskan ke zona tertentu.
