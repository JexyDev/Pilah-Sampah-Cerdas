# LAPORAN TEKNIS PERUBAHAN & STANDARDISASI UNTUK TIM DEVELOPER MOBILE

> **Dokumen**: Laporan Handover & Panduan Integrasi Tim Mobile Flutter  
> **Tanggal**: 14 September 2026  
> **Target Audiens**: Mobile App Engineer / Flutter Developer  
> **Tujuan**: Penyelarasan nomenklatur sistem dari istilah *"Pendamping"* menjadi *"Pembimbing"*, status kontrak API, audit UI Mobile, serta panduan pengujian (QC).

---

## 1. Latar Belakang & Ruang Lingkup

Telah dilakukan standardisasi istilah resmi di seluruh ekosistem BERSEKA (Web Portal Admin, Backend API, Dokumentasi KKN Tematik, dan Sistem Penilaian). Istilah lama yang menggunakan kata **"Pendamping"** (*Dosen Pendamping Lapangan*, *Mitra Pendamping Lapangan*, *Mahasiswa Pendamping*, *Pendamping Kelompok*, dll.) secara resmi diselaraskan menjadi **"Pembimbing"** (*Dosen Pembimbing Lapangan*, *Mitra Pembimbing Lapangan*, *Mahasiswa Pembimbing*, *Pembimbing Kelompok*).

Laporan ini ditujukan khusus kepada Tim Pengembang Mobile agar implementasi di sisi aplikasi Flutter tetap konsisten dengan Web & Backend tanpa merusak integritas serialisasi data (zero breaking changes).

---

## 2. Ringkasan Standardisasi Nomenklatur

| Konteks Sistem | Istilah Lama (Deprecated) | Istilah Baku Baru (Active) | Implementasi di Mobile |
|---|---|---|---|
| **Role DPL** | Dosen Pendamping Lapangan | **Dosen Pembimbing Lapangan** (DPL) | UI Label / Informasi Pembimbing |
| **Role MPL** | Mitra Pendamping Lapangan | **Mitra Pembimbing Lapangan** (MPL) | UI Label / PIC Wilayah |
| **Mahasiswa pada Profil Warga** | Mahasiswa Pendamping | **Mahasiswa Pembimbing** | `profil_view.dart` (Tile Profil Warga) |
| **Status Hubungan Warga ↔ Mahasiswa** | Warga Dampingan | **Warga Binaan / Mahasiswa Pembimbing** | Badge & Card Warga |
| **Fase Linimasa KKN** | Fase 3: Implementasi & Pendampingan | **Fase 3: Implementasi & Pembimbingan** | Tampilan Jadwal / Timeline |

---

## 3. Perubahan Kode yang Sudah Diterapkan di Mobile

### Berkas: `lib/app/modules/profil/profil_view.dart`
Pada kartu informasi profil akun **Warga**, label pendamping telah diperbarui menjadi **Mahasiswa Pembimbing**:

```dart
// Lokasi: lib/app/modules/profil/profil_view.dart (Baris ~480-490)
if (user?.role == UserRole.warga) ...[
  _InfoTile(
    Icons.school_outlined,
    'Mahasiswa Pembimbing', // <-- Sebelumnya: 'Mahasiswa Pendamping'
    user?.pendampingName != null && user!.pendampingName!.isNotEmpty
        ? user.pendampingName!
        : '-',
  ),
  _divider(),
],
```

---

## 4. Kebijakan Kontrak Data & Serialisasi API (PENTING!)

> [!IMPORTANT]
> **JANGAN MENGUBAH NAMA FIELD MODEL / DTO JSON DI DART**
> 
> Variabel model internal seperti `user.pendampingName`, `warga.pendampingName`, `extractPendampingName()`, atau map key `'pendampingName'` **tetap dipertahankan apa adanya**.

### Alasan Teknis:
1. **Backwards Compatibility**: Backend API versi stabil tetap mengirimkan field JSON `pendampingName` dan objek `pendamping: { name, nim }` pada endpoint `/api/v1/auth/me`, `/api/kkn/warga-dampingan`, dan `/api/kkn/dashboard`.
2. **Pencegahan NPE/Null Crash**: Jika nama variabel atau JSON key diubah sepihak pada `user_entity.dart` atau `mahasiswa_kkn_models.dart`, maka aplikasi yang belum di-update atau cache lokal SharedPreferences/SQLite akan mengalami kegagalan deserialisasi (kembali ke `null` atau `'-'`).
3. **Prinsip Separation of Concerns**:
   - **Data Layer (DTO / Model)**: Tetap memetakan JSON keys dari backend (`pendampingName`, `pendamping`).
   - **Presentation Layer (Widget / UI)**: Menampilkan label bahasa Indonesia resmi: **"Mahasiswa Pembimbing"**, **"Dosen Pembimbing Lapangan"**, **"Mitra Pembimbing Lapangan"**.

---

## 5. Audit UI Komponen Mobile Terkait

Berdasarkan audit menyeluruh pada `lib/app/modules/`:

| File View | Komponen / Widget | Teks yang Ditampilkan | Status |
|---|---|---|---|
| `profil_view.dart` | Tile Profil Role Warga | `Mahasiswa Pembimbing` | ✅ Sudah diperbarui |
| `daftar_warga_view.dart` | Chip Badge Aktivasi Warga | `Diaktivasi oleh: [Nama]` | ✅ Netral & Aman (tidak ada kata pendamping) |
| `detail_warga_view.dart` | Detail Status Registrasi | `Diaktivasi oleh: [Nama]` / `Aktivasi Mandiri` | ✅ Netral & Aman |
| `monitoring_warga_view.dart` | List Card Warga Mahasiswa | `Diaktivasi oleh: [Nama]` / `Aktivasi Mandiri` | ✅ Netral & Aman |
| `mahasiswa_view.dart` | Dashboard Tab Mahasiswa | `Diaktivasi: [Nama]` | ✅ Netral & Aman |

> [!TIP]
> Jika di masa mendatang Tim Mobile menambahkan halaman/dialog baru yang menampilkan informasi dosen pembimbing atau mitra pembimbing lapangan, pastikan menggunakan string:
> - `"Dosen Pembimbing Lapangan (DPL)"`
> - `"Mitra Pembimbing Lapangan (MPL)"`
> - Hindari kata *"Pendamping"*.

---

## 6. Checklist Pengujian (Quality Control / QC) untuk Tim Mobile

Sebelum melakukan rilis atau merge PR berikutnya, tim mobile disarankan melakukan verifikasi fungsional:

- [ ] **Skenario 1: Profil Akun Warga**
  - Login dengan akun Warga (contoh: nomor handphone warga terdaftar).
  - Masuk ke tab **Profil**.
  - Verifikasi bahwa tile info menampilkan ikon sekolah/topi toga dengan judul: **"Mahasiswa Pembimbing"** dan nama mahasiswa yang mengaktivasi (bukan `-` jika sudah diaktivasi).
- [ ] **Skenario 2: Monitoring Warga (Mahasiswa KKN)**
  - Login dengan akun Mahasiswa KKN.
  - Buka menu **Monitoring Warga** / **Daftar Warga**.
  - Pastikan list warga binaan termuat dengan benar (`GET /api/kkn/warga-dampingan`), badge aktivasi hijau/biru tampil tanpa exception parsing JSON.
- [ ] **Skenario 3: Registrasi Warga Baru oleh Mahasiswa**
  - Lakukan alur registrasi warga baru dari aplikasi mobile mahasiswa.
  - Pastikan relasi binding mahasiswa berhasil dibuat dan nama mahasiswa langsung terhubung sebagai pembimbing warga tersebut.
- [ ] **Skenario 4: Mode Offline / Cache Lokal**
  - Pastikan pembacaan cache dari SQLite / SharedPreferences tetap berjalan mulus tanpa error migrasi skema.

---

## 7. Referensi Endpoint Terkait

| Endpoint API | Method | Keterangan | Field Terkait |
|---|---|---|---|
| `/api/v1/auth/me` | `GET` | Profil Pengguna Login | `pendampingName`, `pendamping` |
| `/api/kkn/warga-dampingan` | `GET` | Daftar Warga Binaan Mahasiswa | `wargaId`, `nama`, `pendampingName` |
| `/api/kkn/dashboard` | `GET` | Statistik Dasbor Mahasiswa | `totalWargaDampingan`, `targetWarga` |
| `/api/v1/auth/register/warga` | `POST` | Registrasi Warga Baru via Mobile | Header Bearer Mahasiswa (Auto-bound) |

---

## 8. Kontak & Koordinasi

Jika terdapat pertanyaan teknis, kendala parsing model, atau kebutuhan sinkronisasi endpoint baru antara API dan Mobile, silakan berkoordinasi langsung dengan tim **Backend & Web Developer (main)**.
