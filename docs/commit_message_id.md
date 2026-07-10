# 📝 Pedoman Penulisan Pesan Commit (Commit Message Guidelines)

Kami menerapkan standar yang ketat untuk penulisan pesan commit (*commit message*). Standar ini bertujuan untuk memastikan riwayat proyek **mudah dibaca**, terstruktur secara logis, dan memungkinkan sistem untuk menghasilkan *Changelog* secara otomatis (mengadaptasi standar Angular).

---

## 1. Struktur Dasar Pesan Commit

Setiap pesan commit wajib mengikuti format struktural berikut, yang terdiri dari **Header**, **Body** (Tubuh Pesan), dan **Footer** (Catatan Kaki):

```text
<tipe>(<cakupan>): <subjek>
<BARIS KOSONG>
<body>
<BARIS KOSONG>
<footer>

```

> ⚠️ **ATURAN EMAS:** > * **Header bersifat WAJIB**, sedangkan cakupan (*scope*) bersifat opsional.
> * **Batas Karakter:** Setiap baris dalam pesan commit **tidak boleh melebihi 100 karakter**! Hal ini memastikan pesan tidak terpotong dan mudah dibaca di antarmuka GitHub maupun alat *command-line* Git.

---

## 2. Aturan Komponen Commit

### A. Tipe (`<tipe>`)

Tipe harus diisi dengan salah satu kata kunci berikut untuk mendeskripsikan sifat perubahan secara akurat:

| Tipe | Deskripsi |
| --- | --- |
| **`feat`** | Penambahan fitur baru pada sistem. |
| **`fix`** | Perbaikan *bug* atau kesalahan sistem. |
| **`docs`** | Perubahan yang murni hanya pada dokumentasi (mis. `README.md`). |
| **`style`** | Perubahan estetika kode yang tidak memengaruhi logika (*white-space*, pemformatan, menghapus titik koma, dll). |
| **`refactor`** | Restrukturisasi kode sistem yang tidak memperbaiki *bug* maupun menambah fitur. |
| **`perf`** | Perubahan struktur kode yang bertujuan untuk meningkatkan performa. |
| **`test`** | Penambahan pengujian yang hilang atau mengoreksi pengujian yang sudah ada. |
| **`build`** | Perubahan yang memengaruhi sistem *build* atau dependensi eksternal (contoh: `gulp`, `npm`, `broccoli`). |
| **`ci`** | Perubahan pada fail konfigurasi dan skrip CI/CD (contoh: `CircleCI`, `GitHub Actions`, `SauceLabs`). |

### B. Cakupan (`<cakupan>`)

Cakupan merujuk pada area, modul, atau nama paket `npm` yang terpengaruh oleh commit tersebut. Contoh cakupan standar: `animations`, `common`, `core`, `forms`, `http`, `router`, dll.

**Pengecualian Aturan Cakupan:**

* **`packaging`**: Digunakan untuk perubahan yang mengubah tata letak paket secara global (misal: modifikasi `package.json` utama).
* **`changelog`**: Khusus untuk pembaruan catatan rilis di `CHANGELOG.md`.
* **`docs-infra`**: Digunakan untuk perubahan infrastruktur dokumentasi.
* **(Kosong)**: Biarkan kosong (tanpa tanda kurung) untuk perubahan global seperti `style`, `test`, atau `refactor` yang memengaruhi banyak tempat sekaligus (contoh: `style: add missing semicolons`).

### C. Subjek (`<subjek>`)

Subjek adalah ringkasan deskriptif dari perubahan. Aturan mutlak penulisannya:

1. Gunakan kalimat **imperatif, *present tense*** (kata kerja perintah). Contoh: gunakan "change" (ubah), BUKAN "changed" (diubah) atau "changes" (perubahan).
2. **Dilarang** menggunakan huruf kapital pada awal kalimat.
3. **Dilarang** mengakhiri subjek dengan tanda titik (`.`).

### D. Body (`<body>`)

Sama seperti pada Subjek, gunakan gaya bahasa imperatif dan *present tense*.

* Body harus memuat **motivasi** mengapa perubahan tersebut dilakukan.
* Jelaskan kontras atau perbandingan antara perilaku sistem sebelumnya dengan perilaku yang baru.

### E. Footer (`<footer>`)

* **Referensi Issue:** Footer adalah tempat untuk merujuk pada tiket atau *issue* di GitHub yang diselesaikan oleh commit ini (contoh: `Closes #123`).
* **Breaking Changes:** Jika commit memuat perubahan yang merusak kompatibilitas versi sebelumnya, **WAJIB** diawali dengan teks `BREAKING CHANGE:` diikuti spasi atau dua baris baru. Sisa pesan kemudian digunakan untuk mendeskripsikan perubahan tersebut secara detail.

---

## 3. Membatalkan Commit (Revert)

Jika commit bertujuan untuk membatalkan (*revert*) commit sebelumnya:

1. Header commit harus diawali dengan teks `revert: ` dan diikuti oleh header commit yang dibatalkan.
2. Di dalam Body, wajib berisi kalimat ini: `This reverts commit <hash>.` (di mana `<hash>` adalah nilai SHA dari commit yang dibatalkan).

---

## 4. Contoh Penulisan Ideal

✅ **Contoh 1: Penambahan fitur tunggal (Ringkas)**

```text
docs(changelog): update changelog to beta.5

```

✅ **Contoh 2: Perbaikan bug dengan Body yang menjelaskan motivasi**

```text
fix(release): need to depend on latest rxjs and zone.js

The version in our package.json gets copied to the one we publish, and users need the latest of these to ensure compatibility.

```

✅ **Contoh 3: Commit dengan Breaking Change dan Penutupan Issue**

```text
refactor(core): overhaul the dependency injection container

Modify the DI container to support hierarchical injectors. 
This improves performance and component scoping.

BREAKING CHANGE: The `Injector.get()` signature has changed. 
You must now pass a token instead of a string.

Closes #234