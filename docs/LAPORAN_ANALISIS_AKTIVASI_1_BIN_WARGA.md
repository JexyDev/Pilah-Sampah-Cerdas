# Laporan Analisis & Implementasi: Aktivasi 1 Tempat Sampah Warga

**Tanggal:** 11 September 2026  
**Topik:** Penanganan Aktivasi Tempat Sampah Warga Ketika 1 Wadah Terhapus/Non-Aktif (Hanya Wajib Aktivasi 1 Tempat Sampah yang Kurang, Tidak Keduanya)  
**Komponen:** Mobile App (`mobile/lib`) & Backend API (`main/apps/api`)

---

## 1. Ringkasan Eksekutif

Sebelumnya, aplikasi mobile memiliki kelemahan logika di mana warga yang sudah memiliki 1 tempat sampah aktif (karena tempat sampah pasangannya dihapus oleh sistem/admin) dipaksa untuk mengaktivasi ulang **sepasang (2 tempat sampah: Organik & Anorganik)**. Hal ini menyebabkan kebingungan bagi pengguna dan memicu penolakan *Bad Request* dari server backend.

Sekarang, aplikasi mobile telah disempurnakan dengan **Smart Detection**:
1. **Warga Baru (0 Wadah Aktif):** Wajib aktivasi awal sepasang (Organik & Anorganik) untuk memulai pemilahan sampah.
2. **Warga Sisa 1 Wadah (Misal Anorganik Dihapus):** Sistem otomatis mengidentifikasi bahwa Organik sudah aktif, dan **hanya meminta warga mengukur serta memindai 1 stiker QR Anorganik**.
3. **Warga Sisa 1 Wadah (Misal Organik Dihapus):** Sistem otomatis hanya meminta aktivasi **1 stiker QR Organik**.
4. **Warga Lengkap (Minimal 1 Organik & 1 Anorganik):** Warga bebas menambah 1 wadah atau sepasang sesuai kebutuhan.

---

## 2. Analisis Backend: Apakah Backend Memerlukan Perubahan?

### Kesimpulan Backend: **TIDAK PERLU PERUBAHAN UNTUK ALUR WARGA MANDIRI**

Endpoint aktivasi mandiri warga di backend **sudah 100% mendukung dan memang mengharapkan aktivasi 1 tempat sampah saja**.

#### Bukti Kode Backend (`main/apps/api/src/services/binService.ts`):
Pada baris 816–849 method `registerWargaBin`:
```typescript
// 1. Ambil daftar tempat sampah aktif milik warga
const currentBins = await tx.bin.findMany({
  where: {
    OR: [{ userId: user.id }, { binOwnerships: { some: { userId: user.id } } }],
    status: "ACTIVE_BOUND",
  },
  include: { category: true },
});

const hasOrganik = currentBins.some((b) => checkIsOrganicCategory(b.category?.name));
const hasNonOrganik = currentBins.some(
  (b) => b.category?.name && !checkIsOrganicCategory(b.category?.name)
);
const onboardingComplete = hasOrganik && hasNonOrganik;

// 2. Enforce onboarding rules
if (!onboardingComplete) {
  const catName = bin.category?.name || "";
  const isCatOrg = checkIsOrganicCategory(catName);
  if (isCatOrg && hasOrganik) {
    throw new Error("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:ORGANIC");
  }
  if (!isCatOrg && hasNonOrganik) {
    throw new Error("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:NON_ORGANIC");
  }
}
```

#### Alur Eksekusi di Backend:
* Jika warga sudah punya Organik (`hasOrganik = true`, `hasNonOrganik = false`):
  * Warga mengirim payload: `{ qrCodes: ["BSK-AGN-..."] }` (hanya 1 wadah Anorganik).
  * Evaluasi: `isCatOrg = false`.
  * Kondisi `isCatOrg && hasOrganik` bernilai **FALSE**.
  * Kondisi `!isCatOrg && hasNonOrganik` bernilai **FALSE**.
  * **Hasil:** Validasi lolos! Tempat sampah Anorganik berhasil di-bind ke warga. Status onboarding warga menjadi lengkap!
* Sebaliknya, jika aplikasi mobile memaksakan mengirim 2 tempat sampah (Organik + Anorganik):
  * Ketika loop memproses stiker Organik, kondisi `isCatOrg && hasOrganik` bernilai **TRUE**.
  * Server melempar error: `ONBOARDING_INCOMPLETE_WRONG_CATEGORY:ORGANIC` (400 Bad Request).
  * Ini membuktikan bahwa kesalahan sebelumnya murni berada pada alur mobile yang salah mengirimkan 2 wadah.

---

### Catatan Opsional untuk Endpoint Mahasiswa KKN (`kknService.activateWargaBin`)
Jika ke depannya **Mahasiswa KKN** juga ditugaskan untuk mengaktivasi hanya 1 wadah bagi warga dampingan yang kehilangan tempat sampahnya (saat ini alur mahasiswa di `kknService.activateWargaBin` masih menerima sepasang parameter `binOrganikId` dan `binAnorganikId`), backend dapat memperbarui fungsi tersebut menjadi fleksibel (opsional parameter):

```typescript
// Rekomendasi Masa Depan (Jika Mahasiswa perlu aktivasi 1 wadah untuk warga):
async activateWargaBin(
  wargaIdInput: string,
  binOrganikId?: string,
  binAnorganikId?: string,
  latitude?: number,
  longitude?: number,
  kknUserId?: string
) {
  // Hanya proses id yang diberikan (tidak wajib keduanya jika warga sudah punya salah satunya)
}
```
*Untuk saat ini, warga mengaktivasi secara mandiri melalui aplikasi mobile warga, sehingga tidak ada blocker sama sekali di backend.*

---

## 3. Rincian Perubahan di Sisi Mobile App (`mobile/lib/`)

### A. `lib/app/modules/profil/kelola_bin_view.dart`
* **Smart Detection di List**: Jika warga hanya memiliki 1 jenis wadah aktif (`isMissingOne`), bagian atas daftar langsung menampilkan kartu informasi peringatan berwarna sesuai jenis wadah yang kurang:
  *"Tempat Sampah Belum Lengkap: Anda baru memiliki Tempat Sampah Organik aktif. Harap aktivasi Tempat Sampah Anorganik untuk melengkapi pemilahan dan pengumpulan poin sampah."*
* **Label Tombol Dinamis**:
  * 0 wadah: *"Aktivasi Tempat Sampah (Sepasang)"*
  * Sisa Organik: *"Aktivasi Tempat Sampah Anorganik"*
  * Sisa Anorganik: *"Aktivasi Tempat Sampah Organik"*
  * Lengkap: *"Tambah Tempat Sampah Baru"*
* **Navigasi Presisi**: `_onTambahBinPressed` secara otomatis mengirim argumen `{'targetType': 'non_organic'}` atau `{'targetType': 'organic'}` ke halaman ukur kapasitas.

### B. `lib/app/modules/aktivasi/views/ukur_kapasitas_view.dart`
* **Auto-Resolve `_targetCategory`**: Jika rute dibuka tanpa parameter eksplisit, sistem secara otomatis mengecek data `binsProvider` saat build:
  * Jika hanya punya Organik $\rightarrow$ otomatis terkunci ke `non_organic`.
  * Jika hanya punya Anorganik $\rightarrow$ otomatis terkunci ke `organic`.
  * Jika belum punya keduanya $\rightarrow$ terkunci ke `both`.
* **Notis Langkah 1 (`_buildStep1`)**:
  * Menampilkan `_buildLengkapiNotice` jika warga dalam status kehilangan 1 wadah, menjelaskan dengan ramah bahwa wadah pertama sudah aktif dan hanya perlu mengukur wadah kedua.
* **Pengiriman ke Scanner (`_submit`)**:
  * Mengirim `targetType` tunggal dan flag status wadah yang sudah ada ke `aktivasi_bin_view`.

### C. `lib/app/modules/beranda/beranda_view.dart`
* Menambahkan banner reminder di bawah kartu tempat sampah di Beranda jika warga baru memiliki 1 kategori aktif:
  *"Lengkapi tempat sampah Anorganik (Kuning) Anda agar dapat mulai memilah sampah. [Aktivasi]"*
* Tombol "Aktivasi" langsung mengarahkan warga ke proses ukur dan scan wadah yang kurang tersebut.

### D. `lib/app/modules/profil/profil_view.dart` & `scan_trial_view.dart`
* Menu "Tambah Tempat Sampah Baru" dan CTA di mode uji coba kini memeriksa keberadaan tempat sampah aktif terlebih dahulu sebelum membuka halaman ukur kapasitas, sehingga parameter `targetType` yang diteruskan selalu tepat sasaran.

### E. `lib/app/modules/aktivasi/views/aktivasi_bin_view.dart`
* Menambahkan pemetaan kode error `ONBOARDING_INCOMPLETE_WRONG_CATEGORY` ke pesan bahasa Indonesia yang ramah pada `_mapError`.

---

## 4. Hasil Verifikasi Kode

* **Flutter Analysis:**
  ```text
  Analyzing mobile...
  No issues found! (ran in 17.6s)
  ```
  Bersih dari lint error, unused import, ataupun deprecation warning.
* **Integritas Data:**
  * 0 data dummy / 0 hardcoded QR.
  * Tetap tunduk pada konvensi istilah *"Tempat Sampah"* (tidak menggunakan istilah tong sampah).
  * Validasi RW dan pencegahan spam tetap aktif terjaga.
