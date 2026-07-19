# GitHub ↔ Trello Automation Tracker
# Pilah Sampah Cerdas — Monorepo (Backend + Frontend + Mobile)

> Repositori: `JexyDev/Pilah-Sampah-Cerdas`
> Board Trello: Satu board terpusat, label per modul (Backend / Frontend / Mobile)
> Arsitektur: Commit-driven (bukan task.json statis) — setiap push otomatis diproses

---

## LANGKAH 0 — SETUP BOARD TRELLO TERPUSAT

- [x] Satu board Trello untuk seluruh project, dengan list: "Backlog", "In Progress", "Review/Testing", "Done"
- [x] Label per bagian: "Backend", "Frontend", "Mobile" — dibuat otomatis via API saat pertama kali sync
- [ ] Aktifkan Trello Butler di board ini untuk 2 aturan dasar:
  - [ ] Rule A: kalau SEMUA item checklist di card sudah dicentang → otomatis pindahkan card ke list "Done" + tambah label hijau "Completed"
  - [ ] Rule B: kalau card dipindah manual ke list "In Progress" → otomatis tambahkan comment timestamp "Started: {date}"
  > ⚠️ Butler harus dikonfigurasi MANUAL di UI Trello (tidak bisa via API). Lihat panduan di bagian bawah.
- [x] Simpan kredensial Trello sebagai GitHub Secrets: `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID`

---

## LANGKAH 1 — SCRIPT SYNC COMMIT-DRIVEN

- [x] Buat `scripts/trello-sync.js` (Node.js, commit-driven) yang:
  - [x] a) Membaca `.trello-sync-state.json` untuk mengetahui commit terakhir yang sudah diproses (skip commit lama)
  - [x] b) Parsing commit message dengan pola: `<tipe>(<modul>): <judul> - refs <ID-TASK>`
  - [x] c) Untuk setiap commit yang match pola `refs <ID>`:
    - [x] Jika ID belum ada card-nya → buat card baru di "Backlog" dengan deskripsi lengkap + label modul + checklist default
    - [x] Jika ID sudah ada card-nya → tambahkan comment + pindahkan ke "In Progress" jika masih di Backlog
    - [x] Jika commit message mengandung kata kunci done/selesai/close/resolve/complete → centang semua checklist item (Butler lanjutkan ke "Done")
  - [x] d) Simpan mapping `ID-task → Trello card id` ke `.trello-sync-state.json` untuk anti-duplikat

---

## LANGKAH 2 — GITHUB ACTIONS

- [x] Buat `.github/workflows/trello-sync.yml` yang:
  - [x] Berjalan otomatis setiap push ke branch utama (`main`)
  - [x] Mendeteksi label otomatis dari path file yang berubah:
    - File di `mobile/` → label "Mobile"
    - File di `frontend/` atau `fe/` → label "Frontend"
    - File lainnya (root, `src/`, `backend/`, `prisma/`) → label "Backend"
    - Bisa dapat 2+ label jika commit menyentuh multiple folder
  - [x] Job `trello-sync` TERPISAH dari job build/deploy — Trello API gagal tidak memblokir deployment
  - [x] Step commit otomatis untuk `.trello-sync-state.json` setelah sync berhasil (commit dengan `[skip ci]`)

---

## LANGKAH 3 — DETAIL & KUALITAS CARD TRELLO

- [x] Format deskripsi card yang konsisten dan informatif:
  ```
  ## Ringkasan
  {judul singkat dari commit}

  ## Detail
  {isi lengkap commit message/body}

  ## Modul
  {Backend / Frontend / Mobile}

  ## File Terkait
  {daftar file yang berubah}

  ## Commit Terakhir
  {link commit GitHub} — {timestamp}
  ```
- [x] Setiap card WAJIB punya checklist dengan minimal 3 item: "Implementasi", "Testing", "Review"
- [x] Tidak boleh ada card duplikat — validasi via `.trello-sync-state.json` sebelum buat card baru

---

## LANGKAH 4 — DOKUMENTASI CARA PAKAI

- [x] Perbarui `README-automation.md` dengan:
  - [x] Format commit message wajib: `<tipe>(<modul>): <judul> - refs <ID>`
  - [x] Contoh commit BENAR dan SALAH
  - [x] Cara cek status sync via `.trello-sync-state.json`
  - [x] Cara menandai task selesai (kata kunci done/selesai/close/resolve)
  - [x] Panduan konfigurasi Trello Butler (manual)

---

## LANGKAH 5 — END-TO-END TEST

- [ ] Buat 1 commit dummy di repo BE+FE dengan format `refs` yang benar → verifikasi card muncul di Trello dengan label & deskripsi lengkap
- [ ] Buat commit dummy Mobile dengan label "Mobile" → verifikasi label Mobile muncul
- [ ] Buat commit penutup dengan kata kunci `done` → verifikasi checklist tercentang semua
- [ ] Konfirmasi job Trello sync tidak memblokir auto-deploy ke VPS

---

## PANDUAN KONFIGURASI TRELLO BUTLER (Manual — Wajib Dilakukan Sekali)

Butler adalah fitur otomasi bawaan Trello yang tidak bisa dikonfigurasi via API, harus dilakukan langsung di UI Trello.

### Rule A — Auto-pindah ke "Done" saat semua checklist selesai:
1. Buka board Trello → klik "Automation" (pojok kanan atas)
2. Pilih "Rules" → "+ Add Rule"
3. **Trigger**: "When all the items in a checklist on a card are checked"
4. **Action 1**: "Move the card to list 'Done' in the current board"
5. **Action 2**: "Add the label 'Completed' to the card"
6. Simpan rule

### Rule B — Auto-comment timestamp saat card masuk "In Progress":
1. Buka "Rules" → "+ Add Rule"
2. **Trigger**: "When a card is moved into list 'In Progress'"
3. **Action**: "Post comment 'Started: {date}' by Butler"
4. Simpan rule

---

## STATUS KESELURUHAN

| Langkah | Status | Catatan |
|---------|--------|---------|
| Langkah 0 — Board Trello | 🔄 Partial | Butler rule perlu setup manual di UI Trello |
| Langkah 1 — Script sync | ✅ Done | `scripts/trello-sync.js` (commit-driven, dry-run verified) |
| Langkah 2 — GitHub Actions | ✅ Done | `.github/workflows/trello-sync.yml` (terpisah dari CI/CD) |
| Langkah 3 — Detail card | ✅ Done | Deskripsi + checklist otomatis (Implementasi/Testing/Review) |
| Langkah 4 — Dokumentasi | ✅ Done | `README-automation.md` diperbarui lengkap |
| Langkah 5 — E2E Test | 🔄 In Progress | Workflow dipush ke `local-dev`, menunggu konfirmasi run |

> **Catatan Arsitektur**: Project ini adalah **monorepo tunggal** (`JexyDev/Pilah-Sampah-Cerdas`).
> Mobile app berada di subfolder `mobile/` — bukan repo terpisah. Satu workflow yang
> sama mendeteksi label Backend/Frontend/Mobile secara otomatis dari path file yang berubah.
