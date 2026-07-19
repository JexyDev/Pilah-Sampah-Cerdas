# Automation Tracker — GitHub <-> Trello Sync

## LANGKAH 0 — KONSOLIDASI SEMUA TRACKER YANG SUDAH ADA
- [x] Scan seluruh file tracker yang sudah dibuat sebelumnya di root project (progress-tracker.md, bugfix-tracker.md, polish-tracker.md, warga-ux-tracker.md, login-validation-tracker.md, dan tracker lain jika ada).
- [x] Gabungkan SEMUA item dari file-file itu menjadi satu sumber kebenaran terpusat: tasks.json di root project, dengan struktur per item:
  ```json
  {
    "id": "unik-dan-tetap (contoh: DASH-001, BUG-014)",
    "title": "judul singkat task",
    "description": "penjelasan detail: apa yang dikerjakan, kenapa, file/folder terkait",
    "module": "Dashboard | Login | Manajemen Pengguna | Manajemen Lokasi | dst",
    "source_file": "nama file tracker asal (contoh: bugfix-tracker.md)",
    "status": "todo | in_progress | done",
    "trello_card_id": null,
    "last_commit": null
  }
  ```
- [x] Setiap item WAJIB memiliki attribute id unik dan permanen (jangan berubah tiap script dijalankan ulang) — ini kunci supaya sinkronisasi tidak membuat kartu duplikat.

## LANGKAH 1 — SETUP KONEKSI TRELLO (AMAN, TANPA HARDCODE)
- [x] Buat board Trello (atau pakai board yang sudah ada) dengan minimal 3 list: "Backlog", "In Progress", "Done" (tambahkan "Blocked" jika perlu).
- [x] Simpan kredensial Trello (API Key, Token, Board ID) sebagai GitHub Secrets (TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID) — JANGAN PERNAH hardcode di kode atau commit ke repo.
- [x] Buat script terpisah scripts/trello-sync.js (Node.js) yang bertugas:
  - a) Baca tasks.json.
  - b) Untuk setiap task dengan trello_card_id masih null: buat card baru di list "Backlog" via Trello API, simpan card id kembali ke tasks.json.
  - c) Untuk task dengan status "in_progress": pindahkan card ke list "In Progress" (kalau belum di sana).
  - d) Untuk task dengan status "done": pindahkan card ke list "Done", tambahkan komentar di card berisi commit SHA + link commit GitHub terkait + timestamp selesai.
  - e) Update deskripsi card di Trello supaya selalu sinkron dengan field description terbaru di tasks.json (detail lengkap, bukan judul saja).
  - f) Tambahkan label Trello sesuai field module (buat label per modul jika belum ada: Dashboard, Login, Manajemen Pengguna, dst).

## LANGKAH 2 — OTOMATISASI VIA GITHUB ACTIONS
- [x] Buat workflow .github/workflows/trello-sync.yml yang berjalan otomatis setiap ada push ke branch utama.
- [x] Workflow ini menjalankan scripts/trello-sync.js dengan environment variable dari GitHub Secrets.
- [x] Tambahkan langkah untuk mendeteksi task mana yang statusnya berubah dari commit terbaru:
  - Konvensi commit message: developer menuliskan referensi id task di commit, contoh: `fix(login): validasi form modal - refs DASH-007`.
  - Script mem-parsing commit message di git log sejak commit terakhir yang tersinkron, mencari pola `refs <ID>`, lalu otomatis mengubah status task terkait di tasks.json jadi "in_progress" (jika baru disentuh) atau "done" (jika commit message mengandung kata kunci seperti `done`, `close`, `resolve`, `selesai`).
  - Jika tidak ada referensi id yang cocok, JANGAN mengubah status apapun (hindari asumsi salah).
- [x] Setelah update tasks.json, commit otomatis perubahan tasks.json ke branch utama (commit terpisah, pesan jelas: "chore: sync task tracker"), lalu jalankan trello-sync.js untuk push perubahan ke Trello.

## LANGKAH 3 — DETAIL & KUALITAS DATA DI TRELLO
- [x] Setiap card WAJIB berisi deskripsi lengkap (bukan cuma judul 3 kata): apa fiturnya, kenapa dikerjakan, halaman/modul terkait, dan status terakhir dalam bahasa yang jelas.
- [x] Card yang statusnya "in_progress" harus ada catatan/comment terbaru: sedang dikerjakan bagian apa, ada blocker atau tidak.
- [x] Card yang "done" harus ada comment ringkas: apa yang berhasil diperbaiki/dibangun, dan link commit sebagai bukti.
- [x] Tidak boleh ada card duplikat untuk task yang sama — validasi via task id sebelum membuat card baru (cek dulu apakah trello_card_id sudah terisi).

## BATASAN KERAS (WAJIB DIPATUHI)
- [x] Semua file automation (tasks.json, scripts/trello-sync.js, .github/workflows/trello-sync.yml) berada di lokasi terpisah dari kode aplikasi — TIDAK BOLEH menyentuh/mengubah file di folder backend, /fe, atau mobile.
- [x] Automation ini tidak boleh membuat deploy gagal — jika trello-sync.js error (misal API Trello down), workflow tetap lanjut men-deploy aplikasi seperti biasa (jangan sampai sinkronisasi Trello memblokir CI/CD utama). Pisahkan job Trello sync dari job build/deploy di workflow.
- [x] Simpan dokumentasi singkat cara kerja automation ini di README-automation.md agar bisa dipahami tim lain (termasuk cara menulis commit message dengan format `refs <ID>` yang benar).
