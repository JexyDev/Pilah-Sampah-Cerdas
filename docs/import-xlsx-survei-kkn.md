# Spesifikasi Fitur: Impor Data Survei KKN (XLSX) — Express.js + React Vite

Dokumen ini adalah panduan implementasi untuk fitur **impor file `.xlsx`** (hasil dari
`survei_kkn_coblong.xlsx`) ke database, lengkap dengan alur UI, endpoint API, skema database,
dan validasi. Ditulis agar bisa langsung dipakai sebagai konteks development di Antigravity IDE.

---

## 1. Struktur Data Sumber

Workbook `survei_kkn_coblong.xlsx` berisi 7 sheet (relasional, 1 tabel induk + 6 tabel anak):

| Sheet | Relasi ke `kelurahan_id` | Baris per kelurahan |
|---|---|---|
| `kelurahan` | tabel induk | 1 |
| `karakteristik_wilayah` | 1:1 | 1 |
| `pemilahan_sampah` | 1:1 | 1 |
| `bank_sampah_pengolahan` | 1:1 | 1 |
| `key_player` | 1:N | banyak (1 baris per aktor) |
| `volume_sampah` | 1:1 | 1 |
| `catatan_kesimpulan` | 1:1 | 1 |

Kolom kosong pada sheet berarti **NULL** (data tidak diisi di formulir asli), bukan `0`.
Kolom boolean (`0`/`1`) merepresentasikan checkbox pada formulir survei.

---

## 2. Skema Database (PostgreSQL, contoh — sesuaikan dialek bila pakai MySQL)

```sql
CREATE TABLE kelurahan (
  kelurahan_id INTEGER PRIMARY KEY,
  nama_kelurahan VARCHAR(100) NOT NULL,
  kecamatan VARCHAR(100),
  jumlah_rw INTEGER,
  jumlah_rt INTEGER,
  tanggal_survei DATE,
  jumlah_kk INTEGER,
  jumlah_rumah_total INTEGER,
  enumerator VARCHAR(100),
  titik_kumpul_mahasiswa VARCHAR(255),
  catatan_data TEXT
);

CREATE TABLE karakteristik_wilayah (
  id SERIAL PRIMARY KEY,
  kelurahan_id INTEGER REFERENCES kelurahan(kelurahan_id),
  padat_penduduk BOOLEAN,
  banyak_kos_kontrakan BOOLEAN,
  banyak_umkm_warung_kafe BOOLEAN,
  dekat_kampus_sekolah BOOLEAN,
  pasar BOOLEAN,
  bantaran_sungai BOOLEAN,
  karakter_lainnya_flag BOOLEAN,
  karakter_lainnya_keterangan TEXT,
  perkiraan_jumlah_kos_kontrakan VARCHAR(50), -- teks bebas (mis. "778 bangunan / 3602 kamar")
  perkiraan_jumlah_umkm_warung_kafe VARCHAR(50)
);

CREATE TABLE pemilahan_sampah (
  id SERIAL PRIMARY KEY,
  kelurahan_id INTEGER REFERENCES kelurahan(kelurahan_id),
  jumlah_rumah_memilah INTEGER,
  total_jumlah_rumah_di_rw INTEGER,
  persentase_pemilahan NUMERIC(5,4),
  tingkat_pemilahan VARCHAR(50),
  catatan TEXT
);

CREATE TABLE bank_sampah_pengolahan (
  id SERIAL PRIMARY KEY,
  kelurahan_id INTEGER REFERENCES kelurahan(kelurahan_id),
  bank_sampah_aktif INTEGER,
  bank_sampah_tidak_aktif INTEGER,
  jumlah_unit_komposter VARCHAR(50),
  jumlah_titik_maggot_bsf VARCHAR(100),
  biopori_loseda BOOLEAN,
  ecobrick_kerajinan_daur_ulang BOOLEAN,
  buruan_sae BOOLEAN,
  pengepul_mitra_daur_ulang BOOLEAN,
  digitalisasi_data BOOLEAN,
  aktivitas_lainnya_keterangan TEXT
);

CREATE TABLE key_player (
  id SERIAL PRIMARY KEY,
  kelurahan_id INTEGER REFERENCES kelurahan(kelurahan_id),
  jenis_aktor VARCHAR(100),
  nama VARCHAR(150),
  kontak VARCHAR(50),
  peran VARCHAR(255)
);

CREATE TABLE volume_sampah (
  id SERIAL PRIMARY KEY,
  kelurahan_id INTEGER REFERENCES kelurahan(kelurahan_id),
  organik_kg_per_hari NUMERIC(10,2),
  anorganik_kg_per_hari NUMERIC(10,2),
  residu_kg_per_hari NUMERIC(10,2),
  total_volume_kg_per_hari NUMERIC(10,2),
  catatan TEXT
);

CREATE TABLE catatan_kesimpulan (
  id SERIAL PRIMARY KEY,
  kelurahan_id INTEGER REFERENCES kelurahan(kelurahan_id),
  prioritas_intervensi TEXT,
  catatan_tambahan_risiko_sosial TEXT
);
```

> Jika kamu belum punya ORM: gunakan Knex atau Prisma. Contoh di bawah pakai **Knex** karena
> paling ringan untuk kasus "upload xlsx → insert banyak tabel".

---

## 3. Dependensi Backend (Express.js)

```bash
npm install express multer xlsx knex pg cors
# multer   -> menerima file upload (multipart/form-data)
# xlsx     -> parsing file .xlsx (SheetJS)
# knex+pg  -> query builder + driver PostgreSQL
```

---

## 4. Backend — Endpoint Impor

### 4.1 Setup upload (Multer, simpan di memori — file kecil, tidak perlu disk)

```js
// src/middleware/upload.js
import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const okTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!okTypes.includes(file.mimetype)) {
      return cb(new Error("File harus berformat .xlsx"));
    }
    cb(null, true);
  },
});
```

### 4.2 Parser xlsx → JSON per sheet

```js
// src/services/xlsxParser.js
import * as XLSX from "xlsx";

const REQUIRED_SHEETS = [
  "kelurahan",
  "karakteristik_wilayah",
  "pemilahan_sampah",
  "bank_sampah_pengolahan",
  "key_player",
  "volume_sampah",
  "catatan_kesimpulan",
];

export function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
  if (missing.length) {
    throw new Error(`Sheet tidak ditemukan: ${missing.join(", ")}`);
  }

  const result = {};
  for (const sheetName of REQUIRED_SHEETS) {
    const ws = wb.Sheets[sheetName];
    // defval: null -> sel kosong jadi NULL, bukan hilang dari objek
    result[sheetName] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
  }
  return result;
}
```

### 4.3 Validasi ringan sebelum insert

```js
// src/services/xlsxValidator.js
export function validateData(data) {
  const errors = [];

  data.kelurahan.forEach((row, i) => {
    if (!row.kelurahan_id) errors.push(`kelurahan baris ${i + 2}: kelurahan_id kosong`);
    if (!row.nama_kelurahan) errors.push(`kelurahan baris ${i + 2}: nama_kelurahan kosong`);
  });

  const validIds = new Set(data.kelurahan.map((r) => r.kelurahan_id));
  const childSheets = [
    "karakteristik_wilayah",
    "pemilahan_sampah",
    "bank_sampah_pengolahan",
    "key_player",
    "volume_sampah",
    "catatan_kesimpulan",
  ];
  childSheets.forEach((sheet) => {
    data[sheet].forEach((row, i) => {
      if (!validIds.has(row.kelurahan_id)) {
        errors.push(`${sheet} baris ${i + 2}: kelurahan_id ${row.kelurahan_id} tidak ada di sheet kelurahan`);
      }
    });
  });

  return errors;
}
```

### 4.4 Insert ke database dalam satu transaksi (Knex)

```js
// src/services/xlsxImporter.js
import db from "../db/knex.js";

const BOOL_COLS = {
  karakteristik_wilayah: [
    "padat_penduduk", "banyak_kos_kontrakan", "banyak_umkm_warung_kafe",
    "dekat_kampus_sekolah", "pasar", "bantaran_sungai", "karakter_lainnya_flag",
  ],
  bank_sampah_pengolahan: [
    "biopori_loseda", "ecobrick_kerajinan_daur_ulang", "buruan_sae",
    "pengepul_mitra_daur_ulang", "digitalisasi_data",
  ],
};

function toBool(v) {
  if (v === null || v === undefined) return null;
  return v === 1 || v === true || v === "1";
}

function normalizeRows(sheet, rows) {
  const boolCols = BOOL_COLS[sheet] || [];
  return rows.map((row) => {
    const clone = { ...row };
    boolCols.forEach((c) => (clone[c] = toBool(clone[c])));
    return clone;
  });
}

export async function importToDatabase(data) {
  return db.transaction(async (trx) => {
    // urutan insert WAJIB: induk dulu, baru anak (foreign key)
    await trx("kelurahan").insert(data.kelurahan).onConflict("kelurahan_id").merge();

    for (const sheet of [
      "karakteristik_wilayah",
      "pemilahan_sampah",
      "bank_sampah_pengolahan",
      "key_player",
      "volume_sampah",
      "catatan_kesimpulan",
    ]) {
      const rows = normalizeRows(sheet, data[sheet]);
      if (rows.length) {
        // strategi re-import: hapus data lama utk kelurahan_id yg diimpor, lalu insert ulang
        const ids = [...new Set(rows.map((r) => r.kelurahan_id))];
        await trx(sheet).whereIn("kelurahan_id", ids).del();
        await trx(sheet).insert(rows);
      }
    }
  });
}
```

### 4.5 Route

```js
// src/routes/importRoute.js
import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { parseWorkbook } from "../services/xlsxParser.js";
import { validateData } from "../services/xlsxValidator.js";
import { importToDatabase } from "../services/xlsxImporter.js";

const router = Router();

router.post("/api/import/survei-kkn", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File tidak ditemukan" });

    const data = parseWorkbook(req.file.buffer);
    const errors = validateData(data);
    if (errors.length) {
      return res.status(422).json({ message: "Validasi gagal", errors });
    }

    await importToDatabase(data);

    res.json({
      message: "Impor berhasil",
      summary: Object.fromEntries(
        Object.entries(data).map(([sheet, rows]) => [sheet, rows.length])
      ),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
```

Daftarkan di `app.js`:

```js
import express from "express";
import cors from "cors";
import importRoute from "./routes/importRoute.js";

const app = express();
app.use(cors());
app.use(importRoute);
app.listen(3000, () => console.log("API on :3000"));
```

---

## 5. Frontend — React (Vite)

### 5.1 Dependensi

```bash
npm install axios
```

### 5.2 Komponen upload

```jsx
// src/components/ImportSurveiKKN.jsx
import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ImportSurveiKKN() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f && !f.name.endsWith(".xlsx")) {
      setStatus("error");
      setResult({ message: "File harus berformat .xlsx" });
      return;
    }
    setFile(f);
    setStatus("idle");
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/api/import/survei-kkn`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("success");
      setResult(res.data);
    } catch (err) {
      setStatus("error");
      setResult(err.response?.data || { message: err.message });
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 border rounded-lg space-y-4">
      <h2 className="text-lg font-semibold">Impor Data Survei KKN (.xlsx)</h2>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="block w-full text-sm"
      />

      <button
        onClick={handleUpload}
        disabled={!file || status === "uploading"}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {status === "uploading" ? "Mengunggah..." : "Impor ke Database"}
      </button>

      {status === "success" && (
        <div className="text-green-700 text-sm">
          <p>{result.message}</p>
          <ul className="list-disc pl-5">
            {Object.entries(result.summary).map(([sheet, count]) => (
              <li key={sheet}>{sheet}: {count} baris</li>
            ))}
          </ul>
        </div>
      )}

      {status === "error" && (
        <div className="text-red-700 text-sm">
          <p>{result.message}</p>
          {result.errors?.map((e, i) => <p key={i}>- {e}</p>)}
        </div>
      )}
    </div>
  );
}
```

---

## 6. Checklist Implementasi

- [ ] Buat migrasi database dari skema di Bagian 2 (Knex migration atau Prisma schema)
- [ ] Set koneksi database di `src/db/knex.js`
- [ ] Implementasikan `upload.js`, `xlsxParser.js`, `xlsxValidator.js`, `xlsxImporter.js`
- [ ] Daftarkan route `POST /api/import/survei-kkn`
- [ ] Buat komponen `ImportSurveiKKN.jsx` di React
- [ ] Tambahkan `.env` → `VITE_API_URL` di frontend, kredensial DB di backend
- [ ] Uji coba impor dengan file `survei_kkn_coblong.xlsx`
- [ ] Tambahkan penanganan re-import (opsi: replace by `kelurahan_id`, sudah diterapkan di `xlsxImporter.js` via delete+insert)
- [ ] (Opsional) Tambahkan preview data di frontend sebelum konfirmasi impor (parse di client dengan `xlsx` package sebelum submit)

---

## 7. Perintah Membangun Tampilan Frontend (UI Siap Pakai)

Bagian ini berisi **daftar perintah/instruksi kerja** untuk dijalankan oleh developer atau AI
coding agent (Antigravity IDE / Claude Code) agar halaman impor punya tampilan yang matang,
konsisten dengan gaya halaman lain di aplikasi, dan langsung bisa dipakai (bukan sekadar
`<input type="file">` polos).

> **Catatan:** Karena saya belum melihat kode/desain halaman lain di project ini, langkah 1 di
> bawah WAJIB dijalankan lebih dulu — instruksi berikutnya bergantung pada hasilnya. Jika kamu
> menjalankan ini lewat Antigravity IDE, tempel section ini sebagai satu task berurutan.

### Langkah 0 — Kumpulkan Referensi Gaya (wajib sebelum ngoding)

Perintah untuk agent:

```
1. Baca file konfigurasi styling project: tailwind.config.js, src/index.css / globals.css,
   dan theme/token file jika ada (design-tokens.js, theme.ts).
2. Buka 2-3 halaman/komponen yang sudah ada (misalnya halaman dashboard, form, atau tabel data)
   untuk mengambil pola yang konsisten:
   - palet warna (primary, secondary, background, surface, border, danger/success)
   - font family & skala ukuran heading/body
   - radius sudut (rounded-md / rounded-lg / rounded-xl) yang dipakai
   - gaya card/panel (shadow, border, padding) yang sudah ada
   - gaya tombol (primary/secondary/ghost) dan komponen status/badge yang sudah ada
3. Catat token-token ini sebagai variabel yang akan dipakai ulang di komponen baru,
   JANGAN membuat palet warna atau gaya baru yang berbeda dari yang sudah ada.
```

Jika project pakai **shadcn/ui**, **Chakra UI**, atau **Ant Design**, gunakan komponen
resmi dari library tersebut (Card, Button, Table, Toast) daripada menulis ulang dari nol —
ini otomatis menjaga konsistensi visual.

### Langkah 1 — Prinsip Desain "Tidak Flat"

Perintah untuk agent, terapkan pada semua komponen baru di bagian ini:

```
- Beri kedalaman visual: card memakai shadow lembut (shadow-sm/shadow-md) + border tipis
  (border border-gray-200 dark:border-gray-700), BUKAN hanya garis datar tanpa elevasi.
- Gunakan hirarki warna: background halaman sedikit lebih gelap/terang dari surface card,
  supaya card "mengambang" di atas background.
- Gunakan state visual yang jelas untuk setiap interaksi: hover, focus-ring, disabled,
  loading (spinner/skeleton), success, error — jangan cuma ubah warna teks polos.
- Tambahkan micro-interaction: transisi halus (transition-colors, transition-shadow,
  duration-150/200) pada hover tombol dan drop-zone file.
- Gunakan ikon (lucide-react sudah tersedia) di samping label, bukan teks polos saja,
  supaya halaman terasa "aplikasi", bukan formulir HTML dasar.
- Progress harus terlihat: progress bar saat upload, bukan hanya teks "Mengunggah...".
```

### Langkah 2 — Struktur Halaman yang Diminta

Perintah untuk agent — bangun halaman impor dengan struktur berikut (bukan cuma satu form):

```
Buat halaman/route baru: /import/survei-kkn (atau sesuaikan routing project).

Halaman terdiri dari 4 blok, tersusun vertikal, masing-masing dalam card terpisah:

1. Header halaman
   - Judul "Impor Data Survei KKN" + subjudul singkat penjelasan fungsi halaman
   - Tombol "Unduh Template" (link ke contoh file xlsx) di kanan header

2. Card Upload
   - Drop-zone drag-and-drop (bukan hanya <input type=file>), dengan:
     - ikon upload di tengah
     - teks "Tarik file ke sini atau klik untuk memilih" 
     - validasi ekstensi .xlsx dan ukuran file di sisi client sebelum submit
     - saat file dipilih: tampilkan nama file, ukuran file, ikon file xlsx, dan tombol "Ganti file"
   - Tombol utama "Impor ke Database" dengan state: default / loading (spinner) / disabled
     saat belum ada file

3. Card Pratinjau (preview) — WAJIB, jangan langsung insert ke DB tanpa preview
   - Setelah file dipilih (sebelum submit ke backend), parse di client menggunakan
     package `xlsx` dan tampilkan ringkasan per sheet dalam bentuk tabel kecil:
     nama sheet | jumlah baris | status validasi (✅ valid / ⚠️ ada catatan)
   - Beri opsi "Lihat detail" per sheet yang membuka modal/tabel data lengkap
     (paginated table, bukan dump semua baris sekaligus)

4. Card Hasil / Riwayat Impor
   - Setelah proses impor berhasil, tampilkan ringkasan hasil (jumlah baris per tabel
     yang berhasil diimpor) dalam bentuk list dengan ikon centang
   - Jika gagal, tampilkan daftar error per baris dalam bentuk collapsible list,
     bukan satu blok teks JSON mentah
   - Simpan riwayat impor terakhir (opsional: tabel `import_log` di database) dan
     tampilkan sebagai list riwayat di bawah card hasil, dengan status badge
     (Berhasil / Gagal / Sebagian) dan timestamp
```

### Langkah 3 — Komponen yang Perlu Dibuat

Perintah untuk agent — pecah menjadi komponen reusable berikut:

```
src/components/import/
  ImportPageHeader.jsx      - judul, subjudul, tombol unduh template
  FileDropzone.jsx          - drag-and-drop + validasi client + preview nama file
  SheetPreviewTable.jsx     - tabel ringkasan sheet (nama, jumlah baris, status)
  SheetDetailModal.jsx      - modal tabel data per-sheet dengan pagination
  ImportResultCard.jsx      - ringkasan hasil sukses/gagal per tabel
  ImportHistoryList.jsx     - riwayat impor dengan badge status
  StatusBadge.jsx           - badge kecil reusable (success/error/warning/pending)

src/pages/ImportSurveiKKNPage.jsx  - merangkai semua komponen di atas menjadi satu halaman
```

Setiap komponen harus:
- Menerima props, tidak hardcode data
- Memakai token warna/style yang sudah diambil dari Langkah 0
- Punya state loading & error yang ditangani secara eksplisit (skeleton loader untuk tabel,
  bukan halaman kosong saat data belum termuat)

### Langkah 4 — Sambungkan ke Fungsi Nyata

Perintah untuk agent:

```
1. Pindahkan logic upload dari contoh ImportSurveiKKN.jsx (Bagian 5.2 dokumen ini) ke dalam
   struktur komponen baru di atas — jangan buat logic baru, gunakan alur yang sudah ada:
   pilih file -> validasi client -> parse & preview -> submit ke POST /api/import/survei-kkn
   -> tampilkan hasil dari response backend.
2. Tambahkan library notifikasi toast yang sudah dipakai di project (atau `sonner` /
   `react-hot-toast` bila belum ada) untuk menampilkan notifikasi sukses/gagal singkat,
   selain ringkasan di ImportResultCard.
3. Tambahkan endpoint baru di backend: GET /api/import/survei-kkn/history yang membaca
   tabel import_log, untuk mengisi ImportHistoryList.
4. Pastikan seluruh halaman responsif (mobile-first breakpoint sm/md/lg) karena drop-zone
   dan tabel preview mudah pecah tampilannya di layar kecil.
5. Uji end-to-end: upload survei_kkn_coblong.xlsx -> lihat preview -> konfirmasi impor ->
   lihat hasil dan riwayat.
```

### Langkah 5 — Checklist "Siap Digunakan"

- [ ] Token warna, font, radius, dan shadow diambil dari halaman lain yang sudah ada (bukan buat baru)
- [ ] Drop-zone drag-and-drop berfungsi + validasi ekstensi/ukuran file di client
- [ ] Preview data per sheet tampil sebelum data benar-benar diimpor ke database
- [ ] Tombol & elemen interaktif punya state hover/focus/disabled/loading yang jelas secara visual
- [ ] Progress bar/spinner saat proses upload & impor berjalan
- [ ] Hasil impor dan error ditampilkan terstruktur (bukan JSON mentah)
- [ ] Riwayat impor tersimpan dan bisa dilihat kembali
- [ ] Halaman responsif di mobile dan desktop
- [ ] Notifikasi toast untuk feedback cepat, ditambah ringkasan detail di card hasil

---

## 8. Catatan Tambahan

- Nilai NULL pada workbook wajib tetap NULL di database — jangan diubah jadi `0` atau string kosong, karena bisa mengaburkan makna "data tidak diisi" vs "nilai sebenarnya nol".
- Kolom teks bebas seperti `perkiraan_jumlah_kos_kontrakan` sengaja disimpan sebagai `VARCHAR`, bukan `INTEGER`, karena beberapa data sumber berupa teks (contoh: "778 Bangunan/3602 Kamar").
- Sheet `key_player` bersifat one-to-many — pastikan proses insert tidak mengasumsikan 1 baris per kelurahan.
- Sebelum deploy ke production, tambahkan autentikasi pada endpoint impor (mis. middleware JWT) agar tidak sembarang orang bisa menimpa data.
