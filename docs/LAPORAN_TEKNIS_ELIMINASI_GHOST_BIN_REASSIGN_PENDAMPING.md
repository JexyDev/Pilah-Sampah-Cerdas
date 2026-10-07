# 🌿 BERSEKA - SISTEM TATA KELOLA KKN TEMATIK TERPADU
## LAPORAN TEKNIS & REQUEST FOR CHANGE (RFC) UNTUK TIM DEVELOPER
### ELIMINASI TEMPAT SAMPAH VIRTUAL (*GHOST BIN*) PADA FITUR PENGALIHAN PENDAMPING KKN (*REASSIGN PENDAMPING*)

* **Nomor Dokumen**: `REP-DEVRFC/KKN-BIN/2026-10/021`
* **Tanggal Terbit**: Rabu, 07 Oktober 2026
* **Penulis / Auditor**: Tim Data Governance & Architecture Backend Berseka
* **Target Pembaca**: Seluruh Tim Backend Developer & Mobile Developer Berseka
* **Tingkat Urgensi**: 🔴 **CRITICAL ARCHITECTURAL BUG (HIGH IMPACT)**
* **Tindakan yang Diwajibkan**: **HAPUS PERMANEN BLOK AUTO-CREATE TEMPAT SAMPAH PADA `kknService.reassignPendamping`**

---

## 1. Ringkasan Eksekutif (*Executive Summary*)

Ditemukan kegagalan sistemik saat warga binaan dan mahasiswa KKN melakukan aktivasi tempat sampah fisik di lapangan. Warga yang belum pernah memegang stiker tempat sampah fisik mendadak ditolak oleh sistem dengan pesan kesalahan:

> *"Anda belum menyelesaikan aktivasi awal. Selesaikan aktivasi Tempat Sampah Non-Organik Anda terlebih dahulu."*

Setelah dilakukan audit forensik menyeluruh pada kode backend dan database VPS live (`157.10.252.252` / `psc_db`), ditemukan bahwa sistem secara otomatis menciptakan **Tempat Sampah Virtual / Bodong (*Ghost Bin*)** berstatus `ACTIVE_BOUND` dengan format kode `BSK-MEMBER-MUWM...` setiap kali ada proses pengalihan mahasiswa pendamping KKN (*reassign pendamping*).

Dokumen ini disusun sebagai panduan teknis resmi bagi seluruh tim developer agar memahami akar masalah, dampak destruktif yang ditimbulkan, dan instruksi mutlak penghapusan logika tersebut dari basis kode.

---

## 2. Lokasi Kode & Analisis Akar Masalah (*Root Cause Analysis*)

### A. File dan Fungsi Penyebab
* **File Target**: `apps/api/src/services/kknService.ts`
* **Fungsi**: `reassignPendamping(requesterUserId, requesterRole, wargaIdInput, targetStudentIdInput)`
* **Baris Kode Bermasalah** (sebelumnya di baris 6730–6743):

```typescript
// ❌ KODE ANOMALI / CACAT DESAIN:
// 5. Update Tempat Sampah Warga
const binUpdate = await tx.bin.updateMany({
  where: {
    OR: [
      { userId: cleanWargaId },
      { binOwnerships: { some: { userId: cleanWargaId } } },
    ],
  },
  data: {
    registeredByStudentId: targetStudent.userId,
    kelompokId: targetStudent.kelompokId,
  },
});

// BAGIAN INI YANG MENYEBABKAN GHOST BIN:
if (binUpdate.count === 0 && allBins.length === 0) {
  const defaultCategory = await tx.wasteCategory.findFirst();
  await tx.bin.create({
    data: {
      qrCode: `BSK-MEMBER-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "ACTIVE_BOUND",
      userId: cleanWargaId,
      registeredByStudentId: targetStudent.userId,
      kelompokId: targetStudent.kelompokId,
      categoryId: defaultCategory?.id, // ⚠️ Otomatis menjadi Organik
      rwId: warga.rwId,
    },
  });
}
```

---

### B. Mengapa Logika Tersebut Merupakan Pelanggaran Prinsip Sistem (*Flawed Logic*)

1. **Premis Desain yang Salah (Asumsi Palsu Developer)**:
   Developer terdahulu membuat logika ini dengan anggapan: *"Jika seorang warga belum punya tempat sampah saat dialihkan ke mahasiswa baru, buatkan saja satu tempat sampah agar akun warga tersebut langsung memiliki wadah dan mahasiswa memiliki capaian."*
2. **Ketiadaan Stiker Fisik (*Ghost Bin*)**:
   Nilai `qrCode` yang di-generate adalah string buatan `BSK-MEMBER-...`. Tempat sampah ini **tidak pernah dicetak pada stiker fisik**, tidak pernah ditempel pada ember/wadah warga, dan tidak bisa dipindai oleh kamera karena tidak ada fisiknya di rumah warga.
3. **Kategori Default Menjadi 'Organik'**:
   Perintah `tx.wasteCategory.findFirst()` secara deterministik selalu mengambil baris ID pertama dari tabel `WasteCategory`, yaitu kategori **Organik**.
4. **Merusak Alur Validasi Onboarding (*Deadlock Validasi*)**:
   Sistem Berseka menerapkan aturan onboarding ketat pada [`binService.ts`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/main/apps/api/src/services/binService.ts#L938-L948):
   - Warga baru wajib menyelesaikan aktivasi awal berupa **1 wadah Organik** dan **1 wadah Non-Organik**.
   - Sistem **melarang** aktivasi wadah Organik kedua jika wadah Non-Organik belum terdaftar (`ONBOARDING_INCOMPLETE_WRONG_CATEGORY:ORGANIC`).
   - Karena di database akun warga sudah terikat *ghost bin* Organik (`BSK-MEMBER-...`), saat warga/mahasiswa mencoba men-scan stiker fisik Organik hijau yang sebenarnya, sistem menolak dan menganggap warga mencoba mendaftarkan tempat sampah Organik ganda.
5. **Macet di Sisi Aplikasi Mobile**:
   Di sisi mobile ([`aktivasi_bin_view.dart`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/mobile/lib/app/modules/aktivasi/views/aktivasi_bin_view.dart)), penolakan tersebut memunculkan error:
   *"Anda belum menyelesaikan aktivasi awal. Selesaikan aktivasi Tempat Sampah Non-Organik Anda terlebih dahulu."*
   Namun state mobile secara otomatis me-reset form ke `_step = 1` (kembali meminta scan Organik), menyebabkan pengguna terjebak dalam *loop error* tanpa jalan keluar.

---

## 3. Bukti Forensik Kasus Lapangan (30 Akun Warga Terblokir)

Pada tanggal **06 Oktober 2026 pukul 18:41 – 18:49 WIB**, proses *reassign pendamping* dijalankan untuk 30 warga binaan KKN. Audit database live membuktikan bahwa ke-30 warga langsung memiliki 1 wadah hantu `BSK-MEMBER-` dengan kategori Organik:

| No | Nama Warga | Nomor Telepon | Kode QR Ghost Bin Terbentuk | Status | Kategori |
|---|---|---|---|---|---|
| 1 | Heni Hendri Yani | `081221464556` | `BSK-MEMBER-MUWM0ALM-3769` | `ACTIVE_BOUND` | Organik |
| 2 | Dina Hermawati | `087788981000` | `BSK-MEMBER-MUWM0HPS-2806` | `ACTIVE_BOUND` | Organik |
| 3 | Goestrining Tyas Rahayu | `087722378507` | `BSK-MEMBER-MUWM2BGC-4737` | `ACTIVE_BOUND` | Organik |
| 4 | Ucie Jalal | `085220233045` | `BSK-MEMBER-MUWM1JXV-8731` | `ACTIVE_BOUND` | Organik |
| 5 | Winarti | `082263750033` | `BSK-MEMBER-MUWM1WW7-8280` | `ACTIVE_BOUND` | Organik |
| 6 | Sartje Herlina | `082216265311` | `BSK-MEMBER-MUWM4UTG-5659` | `ACTIVE_BOUND` | Organik |
| 7 | Ekomaria | `082218840726` | `BSK-MEMBER-MUWM64U2-2852` | `ACTIVE_BOUND` | Organik |
| 8 | Euis Nurchayati | `085295171957` | `BSK-MEMBER-MUWM5LSH-5852` | `ACTIVE_BOUND` | Organik |
| 9 | Ritta Indriasari | `08112471888` | `BSK-MEMBER-MUWM4CZR-7844` | `ACTIVE_BOUND` | Organik |
| 10 | Ratih Winangsub | `081572787713` | `BSK-MEMBER-MUWM7PNO-8514` | `ACTIVE_BOUND` | Organik |
| 11 | Tini Henawati | `081320085537` | `BSK-MEMBER-MUWM6B5A-8296` | `ACTIVE_BOUND` | Organik |
| 12 | Sumiati | `089656734531` | `BSK-MEMBER-MUWM71SZ-4460` | `ACTIVE_BOUND` | Organik |
| 13 | Erna nurasyiah | `087722831491` | `BSK-MEMBER-MUWM6V0D-3575` | `ACTIVE_BOUND` | Organik |
| 14 | Umi sate madura | `087764103312` | `BSK-MEMBER-MUWM78L1-9657` | `ACTIVE_BOUND` | Organik |
| 15 | Rustin | `089502958003` | `BSK-MEMBER-MUWM8L38-1272` | `ACTIVE_BOUND` | Organik |
| 16 | Bude Sri | `082120061009` | `BSK-MEMBER-MUWM6MSO-7358` | `ACTIVE_BOUND` | Organik |
| 17 | Uyay | `083829981464` | `BSK-MEMBER-MUWM8QJA-7998` | `ACTIVE_BOUND` | Organik |
| 18 | Yusti | `08112348802` | `BSK-MEMBER-MUWM8E02-2951` | `ACTIVE_BOUND` | Organik |
| 19 | Yeyen | `085694099896` | `BSK-MEMBER-MUWM3I3T-8799` | `ACTIVE_BOUND` | Organik |
| 20 | Lilis | `082262626617` | `BSK-MEMBER-MUWM86CH-2901` | `ACTIVE_BOUND` | Organik |
| 21 | Indah | `081280956825` | `BSK-MEMBER-MUWM7DVS-7756` | `ACTIVE_BOUND` | Organik |
| 22 | Teh Ida Cilok | `08164695552` | `BSK-MEMBER-MUWM3XTK-1346` | `ACTIVE_BOUND` | Organik |
| 23 | Bu Ati | `081313440492` | `BSK-MEMBER-MUWM56MC-3622` | `ACTIVE_BOUND` | Organik |
| 24 | Yuliawan | `081321037022` | `BSK-MEMBER-MUWM5EYT-2941` | `ACTIVE_BOUND` | Organik |
| 25 | Eti | `083221129480` | `BSK-MEMBER-MUWM5V5E-4273` | `ACTIVE_BOUND` | Organik |
| 26 | Ruby | `08998928784` | `BSK-MEMBER-MUWM7V8A-7728` | `ACTIVE_BOUND` | Organik |
| 27 | Kidun | `081322048305` | `BSK-MEMBER-MUWLZ37S-2280` | `ACTIVE_BOUND` | Organik |
| 28 | Imas Madura | `08312007736` | `BSK-MEMBER-MUWLZARW-6024` | `ACTIVE_BOUND` | Organik |
| 29 | Nurul | `083842381254` | `BSK-MEMBER-MUWM2KDF-9070` | `ACTIVE_BOUND` | Organik |
| 30 | Ida | `087753710363` | `BSK-MEMBER-MUWM3B4R-2317` | `ACTIVE_BOUND` | Organik |

Akibatnya, seluruh 30 warga ini gagal total saat mencoba mengaktifkan stiker tempat sampah fisiknya.

---

## 4. Tindakan Korektif yang Telah Dijalankan

1. **Penyelamatan Data Mandatori (Golden Backup)**:
   Backup snapshot penuh PostgreSQL VPS telah diamankan sebelum intervensi:
   `/home/maker/golden_backup_2026-10-07T02-09-29-888Z.sql` (Ukuran: 538 MB).
2. **Pembersihan Database VPS**:
   Seluruh 30 record tempat sampah dummy `BSK-MEMBER-...` di atas telah dihapus dari tabel `Bin` via transaksi aman. Verifikasi pasca-pembersihan memastikan `Total ghost bins = 0`.
3. **Status Warga Saat Ini**:
   Seluruh 30 warga kini berstatus bersih (*unbound / belum memiliki tempat sampah*) sehingga siap memindai pasangan stiker fisik Organik dan Anorganik resmi.

---

## 5. Instruksi Perubahan Mutlak untuk Tim Developer (*Action Items*)

Seluruh developer backend diwajibkan mematuhi aturan baku berikut:

### 1. HAPUS PERMANEN Blok Auto-Create Tempat Sampah di `kknService.ts`
Pada fungsi `reassignPendamping`, jika `allBins.length === 0` (warga belum memiliki tempat sampah), **JANGAN LAKUKAN APAPUN** terhadap tabel `Bin`. Biarkan warga tetap tanpa tempat sampah hingga stiker fisik dipindai.

```typescript
// ✅ KODE YANG BENAR (SETELAH REFACTOR):
// 5. Update Tempat Sampah Warga (Hanya jika warga memang SUDAH memiliki tempat sampah riil)
await tx.bin.updateMany({
  where: {
    OR: [
      { userId: cleanWargaId },
      { binOwnerships: { some: { userId: cleanWargaId } } },
    ],
  },
  data: {
    registeredByStudentId: targetStudent.userId,
    kelompokId: targetStudent.kelompokId,
  },
});

// ⛔ DILARANG KERAS MENAMBAHKAN else / if (allBins.length === 0) tx.bin.create(...)
// Warga/mahasiswa akan melakukan aktivasi stiker fisik QR resmi secara mandiri.
```

### 2. Prinsip Arsitektur Data Berseka (Kaidah Mutlak)
* **Kaidah 1**: **Tidak Ada Tempat Sampah Tanpa Stiker Fisik**. Satu-satunya cara sebuah record `Bin` bertipe `RUMAH_TANGGA` menjadi `ACTIVE_BOUND` adalah melalui pemindaian stiker fisik resmi yang berstatus `PRINTED`.
* **Kaidah 2**: **Dilarang Men-generate Dummy QR pada Runtime Bisnis**. Kode prefix `BSK-MEMBER-*` tidak boleh dibuat secara otomatis di backend untuk mewakili wadah fisik.
* **Kaidah 3**: **Idempoten pada Alih Penugasan**. Fitur administrasi seperti pengalihan pendamping, perubahan RW, atau edit profil **hanya boleh memutasi metadata relasi**, bukan menciptakan entitas fisik baru.

---

## 6. Verifikasi & Pengujian (*Verification Sign-Off*)

Sebelum melakukan pull request ke branch `development`:
1. Pastikan build TypeScript lulus tanpa error:
   ```bash
   npm run build:api
   ```
2. Jalankan test suite verifikasi dan role guard:
   ```bash
   npx vitest run apps/api/src/controllers/dplApproval.test.ts apps/api/src/services/logbookVerifikasi.test.ts apps/api/src/services/penilaianKknRoleGuard.test.ts
   ```
3. Pastikan test suite 100% green (30/30 passed).

---

*Laporan ini bersifat instruksional dan mengikat bagi seluruh pengembang backend dan mobile Berseka.*
