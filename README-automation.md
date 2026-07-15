# Sistem Sinkronisasi Otomatis GitHub <-> Trello

Sistem ini mengotomatiskan pelacakan progres pengerjaan tugas (*task tracking*) dari repositori GitHub ke Trello Board secara dinamis menggunakan GitHub Actions dan Trello API.

---

## 1. Arsitektur & Sumber Kebenaran
* **Sumber Kebenaran (Single Source of Truth)**: Berada pada file `tasks.json` di root repositori.
* **ID Unik**: Setiap tugas memiliki ID permanen (seperti `BUG-001`, `POL-003`, `WRG-002`) yang dipetakan langsung ke kartu Trello (`trello_card_id`). Ini mencegah terciptanya kartu duplikat.
* **Modul & Label**: Setiap tugas dikelompokkan berdasarkan field `module` yang akan diterjemahkan menjadi label berwarna di Trello.

---

## 2. Kredensial & Konfigurasi GitHub Secrets
Agar sistem sinkronisasi dapat berjalan otomatis pada runner GitHub Actions, Anda harus mengonfigurasi tiga (3) rahasia (*secrets*) pada menu **Settings > Secrets and Variables > Actions** di repositori GitHub Anda:

1. `TRELLO_API_KEY`: API Key Trello Anda (dapat dibuat di [Trello Power-Up Admin Portal](https://trello.com/power-ups/admin)).
2. `TRELLO_TOKEN`: API Token Trello (token autentikasi pengguna Anda).
3. `TRELLO_BOARD_ID`: ID dari Board Trello tempat Anda mengelola tugas.

> [!WARNING]
> Jangan pernah memasukkan API Key atau Token secara langsung (*hardcode*) ke dalam file kode atau riwayat commit.

---

## 3. Konvensi Commit Message untuk Developer
Sistem ini memindai riwayat commit Git terbaru untuk mendeteksi ID tugas dan memperbarui statusnya di Trello secara otomatis:

* **Menandai Tugas Sedang Dikerjakan (In Progress)**:
  Tuliskan `refs <ID>` di dalam commit message.
  * *Contoh*: `feat(warga): tambahkan visual card summary - refs WRG-001`
  * Status tugas `WRG-001` di `tasks.json` akan berubah menjadi `in_progress` dan kartunya di Trello akan otomatis berpindah ke kolom **In Progress**.

* **Menandai Tugas Selesai (Done)**:
  Tuliskan `refs <ID>` diikuti oleh kata kunci penyelesaian (seperti `done`, `close`, `resolve`, `selesai`, `fix`).
  * *Contoh*: `fix(auth): perbaiki validasi form kosong - refs VAL-001 done`
  * Status tugas `VAL-001` di `tasks.json` akan berubah menjadi `done` dan kartunya di Trello akan berpindah ke kolom **Done**. Rincian SHA commit beserta timestamp penyelesaian akan dicatat sebagai komentar pada kartu Trello terkait.

---

## 4. Cara Menjalankan Sinkronisasi Secara Lokal
Jika Anda ingin mensinkronisasikan tugas secara manual dari komputer lokal:

1. Pastikan Anda memiliki variabel environment yang terdefinisi:
   ```bash
   $env:TRELLO_API_KEY="api-key-anda"
   $env:TRELLO_TOKEN="token-anda"
   $env:TRELLO_BOARD_ID="board-id-anda"
   ```
2. Jalankan perintah Node.js:
   ```bash
   node scripts/trello-sync.js
   ```
