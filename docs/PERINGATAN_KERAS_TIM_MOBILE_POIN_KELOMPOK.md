# SURAT PERINGATAN TEKNIS & INSTRUKSI PERBAIKAN SEGERA

**Nomor Dokumen**: 004/DEV-LEAD/WARNING-MOBILE/IX/2026  
**Kepada**: Habil & Tim Mobile Developer (Flutter)  
**Dari**: Lead Fullstack & Backend Architect (main)  
**Tanggal**: 15 September 2026  
**Sifat**: PENTING & SEGERA (HIGH PRIORITY)  
**Perihal**: Peringatan Keras Terkait Kesalahan Fatal Label UI Poin Kelompok KKN yang Memicu Kepanikan Pengguna

---

## 1. Latar Belakang Masalah & Dampak Lapangan

Hari ini, **15 September 2026**, tim operasional dan pimpinan menerima keluhan resmi dari mahasiswa/ketua kelompok KKN di lapangan (Kelompok 4 Sadang Serang) yang mengeluhkan bahwa:
> *"Kemarin poin kelompok 47, tapi sekarang berkurang drastis menjadi 6. Apakah ada peraturan pengurangan/penalti poin?"*

Setelah dilakukan audit komprehensif pada database VPS dan codebase API, **sama sekali TIDAK ADA pengurangan poin individu mahasiswa**. Seluruh poin presensi dan logbook mahasiswa tetap utuh (misal: Robi 174 Pts, Rully 100 Pts).

**Kepanikan ini murni dipicu oleh KESALAHAN FATAL pada teks antarmuka (UI Label) aplikasi mobile** yang dikembangkan oleh Tim Mobile.

---

## 2. Temuan Audit Kode & Pelanggaran Spesifikasi

### A. Lokasi Kode Bermasalah
Berkas: `mobile/lib/app/modules/mahasiswa/views/kelompok_kkn_view.dart` (Baris 388–414):

```dart
Text(
  'Poin Akumulasi Kelompok',
  style: TextStyle(fontSize: 12, ...),
),
Text(
  '${kelompokData.calculatedTotalPoints} Poin',
  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, ...),
),
Text(
  'Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok', // <-- FATAL ERROR DI SINI
  style: TextStyle(fontSize: 11, ...),
),
```

### B. Analisis Kesalahan Fatal:
1. Variabel `kelompokData.calculatedTotalPoints` mengambil nilai field `totalGroupPoints` dari API endpoint `/api/v1/kkn/kelompok/me`.
2. Sesuai spesifikasi resmi di `docs/LAPORAN_ENDPOINT_DAN_RESPONSE_MOBILE_DEVELOPER.md`, field `totalGroupPoints` bernilai **Formula Poin Terbobot KKN**:
   $$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-Rata Poin Anggota} \times 0{,}4)$$
   *(Skala capaian harian rata-rata anggota bernilai 0–10 poin, bukan total akumulasi).*
3. Namun, Tim Mobile menuliskan keterangan:
   > **"Penjumlahan poin individu 12 anggota kelompok"**
4. Mahasiswa melihat anggotanya memiliki 174 Pts dan 100 Pts (total tim $> 1.000\text{ Pts}$), lalu membaca bahwa hasil penjumlahannya hanya bernilai **6 Poin**. Hal ini secara langsung menciptakan mispersepsi bahwa sistem memotong atau korup data mereka.

---

## 3. Poin Peringatan Keras untuk Tim Mobile (Habil)

1. **Kelalaian Membaca Kontrak & Dokumentasi API**:  
   Dokumentasi teknis formula bobot $60\% : 40\%$ telah dirilis dan disosialisasikan secara resmi di berkas `docs/LAPORAN_ENDPOINT_DAN_RESPONSE_MOBILE_DEVELOPER.md` Bab 1 Bagian B. Menampilkan angka terbobot dengan label "Penjumlahan / SUM" adalah kelalaian yang tidak dapat ditoleransi karena merusak kredibilitas sistem di hadapan DPL dan Mahasiswa.

2. **Asumsi Mandiri Tanpa Konfirmasi**:  
   Logika fallback di `mahasiswa_kkn_models.dart`:
   ```dart
   int get calculatedTotalPoints {
     if (totalGroupPoints > 0) return totalGroupPoints;
     return members.fold(0, (sum, m) => sum + m.individualPoints);
   }
   ```
   mencampurkan dua konsep yang bertolak belakang (*Weighted Evaluation Score* vs *Raw Cumulative Sum*) dalam satu variabel yang sama.

---

## 4. Instruksi Perbaikan Wajib (ACTION PLAN SEGERA)

Tim Mobile (Habil) diwajibkan menyelesaikan perbaikan berikut sebelum build rilis berikutnya:

### Tindakan 1: Koreksi Teks & Label di `kelompok_kkn_view.dart`
Ubah label yang menyesatkan pada kartu utama menjadi representasi yang benar:

```dart
// SEBELUMNYA (SALAH & MENYESATKAN):
Text('Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok')

// WAJIB DIUBAH MENJADI:
Text('Skor Terbobot KKN (60% Proker + 40% Capaian Anggota)')
```

### Tindakan 2: Tampilkan 2 Metrik Terpisah (Sangat Direkomendasikan)
Agar mahasiswa tetap dapat melihat total kontribusi riil mereka tanpa salah paham, pecah kartu informasi menjadi dua indikator:

1. **Skor Terbobot Kelompok (Untuk Evaluasi DPL & Akademik)**:
   - Nilai: `${kelompokData.totalGroupPoints} Poin`
   - Subtitle: `Formula resmi: 60% Proker + 40% Rata-rata Anggota`
2. **Total Akumulasi Poin Tim (Untuk Gamifikasi & Prestasi Anggota)**:
   - Nilai: `${membersToDisplay.fold(0, (sum, m) => sum + m.individualPoints)} PTS`
   - Subtitle: `Total akumulasi poin dari 12 anggota kelompok`

### Tindakan 3: Sinkronisasi Model di `mahasiswa_kkn_models.dart`
Hapus logika ambigu `calculatedTotalPoints` yang mengaburkan data API. Pisahkan secara eksplisit getter untuk:
- `totalGroupPoints` (nilai resmi dari API)
- `cumulativeMemberPoints` (hasil `members.fold(...)`)

---

## 5. Batas Waktu & Verifikasi

- **Batas Waktu**: Hari ini, **15 September 2026, maksimal pukul 20:00 WIB**.
- **Verifikasi**: Harap ajukan Pull Request (PR) ke branch `development` dengan menyertakan screenshot hasil perbaikan UI sebelum dilakukan build APK staging/production.

Demikian surat peringatan dan instruksi ini dibuat untuk segera ditindaklanjuti demi menjaga integritas data dan kenyamanan seluruh pengguna BERSEKA.

---
**Lead Fullstack & Backend Architect**  
*Berseka Development Team*
