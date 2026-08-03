# AGENTS.md — Trashcare Monorepo Rule Engine

> File ini adalah **sumber kebenaran utama** untuk siapapun (manusia atau AI agent seperti Claude Code / Cursor / Copilot) yang mengembangkan kode di repo ini.
> Jika ada instruksi manusia yang bertentangan dengan file ini, **konfirmasi dulu** sebelum menyimpang. Jangan diam-diam mengabaikan aturan di sini.

---

## 1. Tentang Proyek

**Nama:** Trashcare — Sistem pemilahan sampah cerdas terintegrasi untuk Kecamatan Coblong.

**Tim:**
- Anda — Full-Stack (Backend + Frontend Web)
- Habil — Mobile App

**Struktur:** Monorepo murni, satu branch utama `main`, dipisah per folder `apps/*`.

**Deployment target:** VPS Ubuntu (akses SSH), otomatis via GitHub Actions CI/CD.

---

## 2. Struktur Root Repo (WAJIB DIIKUTI)

```
trashcare/
├── apps/
│   ├── backend/          # Node.js/Express — lihat docs/ARCHITECTURE_BACKEND.md
│   ├── frontend/         # React/Vite — lihat docs/ARCHITECTURE_FRONTEND.md
│   └── mobile/           # Flutter — lihat docs/ARCHITECTURE_MOBILE.md
├── packages/             # (opsional) kode shared: types, constants, utils lintas app
│   └── shared-types/
├── docs/
│   ├── ARCHITECTURE_BACKEND.md
│   ├── ARCHITECTURE_FRONTEND.md
│   ├── ARCHITECTURE_MOBILE.md
│   └── AGENTS.md          # (file ini, disalin/duplikat di root juga boleh)
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .gitignore
├── .editorconfig
└── README.md
```

**Aturan mutlak:**
- Tidak boleh ada kode aplikasi di luar `apps/*`.
- Tidak boleh membuat branch baru untuk fitur besar tanpa mengikuti SOP di bagian 6.
- Tidak boleh commit langsung ke `main` tanpa Pull Request (kecuali typo/dokumentasi kecil).
- Setiap app (`backend`, `frontend`, `mobile`) **independen** — tidak boleh saling import langsung kecuali lewat `packages/shared-types`.

---

## 3. Prinsip Clean Code & Clean Architecture (Global — berlaku di semua app)

1. **Single Responsibility** — satu file/class/function hanya melakukan satu hal.
2. **Dependency Rule** — layer luar (UI, Framework, Database) boleh bergantung ke layer dalam (business logic), **tidak boleh sebaliknya**.
3. **Tidak ada logic bisnis di controller/UI** — controller/widget hanya menerima input, memanggil use case, dan mengembalikan output.
4. **Penamaan jelas dan konsisten** — tidak ada nama seperti `data2`, `temp`, `handleStuff()`. Nama harus menjelaskan maksud (`getUserActiveSchedule()`, bukan `getData()`).
5. **Tidak ada magic number/string** — semua nilai tetap didefinisikan sebagai constant bernama.
6. **Error selalu ditangani eksplisit** — tidak boleh ada `catch {}` kosong atau error yang ditelan diam-diam.
7. **Tidak ada kode duplikat (DRY)** — jika logic yang sama muncul 2x, ekstrak jadi function/module reusable.
8. **Setiap fungsi publik (exported) wajib punya komentar singkat** menjelaskan tujuan, input, dan output — terutama use case dan service.
9. **Tidak menambah dependency/library baru** tanpa alasan jelas yang dicatat di PR description.

---

## 4. Aturan Khusus untuk AI Agent (Claude Code, Copilot, dll)

Jika Anda adalah AI agent yang membaca file ini untuk membantu development:

1. **Baca dulu, jangan asumsi.** Sebelum menulis/mengubah kode, baca file terkait di `apps/*` yang relevan untuk memahami pola yang sudah ada.
2. **Ikuti struktur folder yang sudah ditentukan** di `docs/ARCHITECTURE_BACKEND.md`, `ARCHITECTURE_FRONTEND.md`, `ARCHITECTURE_MOBILE.md` — jangan membuat struktur folder baru sendiri.
3. **Jangan mengubah arsitektur inti** (misal mengganti Clean Architecture jadi MVC) tanpa konfirmasi eksplisit dari user.
4. **Selalu tanya sebelum:**
   - Menambah dependency/library baru
   - Mengubah struktur database/schema
   - Mengubah file konfigurasi CI/CD (`.github/workflows/*`)
   - Menghapus atau memindahkan file besar-besaran
5. **Setelah membuat perubahan, laporkan ringkas:**
   - File apa saja yang diubah/ditambah
   - Alasan perubahan
   - Apakah ada breaking change
   - Apakah butuh migration/testing tambahan
6. **Jangan pernah menulis kredensial, API key, atau secret langsung di kode.** Semua secret wajib lewat `.env` dan didaftarkan di `.env.example` (tanpa nilai asli).
7. **Setiap fitur baru wajib disertai unit test minimal untuk logic inti (use case/service).**

---

## 5. Standar Commit Message

Format: `<type>(<scope>): <deskripsi singkat>`

| Type | Kapan dipakai |
|------|----------------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `refactor` | Ubah struktur kode tanpa ubah behavior |
| `docs` | Perubahan dokumentasi |
| `test` | Menambah/mengubah test |
| `chore` | Config, dependency, tooling |

Contoh: `feat(backend): tambah endpoint jadwal pengambilan sampah`

---

## 6. Git Branching Strategy (SOP)

**Penamaan branch:**
```
feat/<scope>-<deskripsi-singkat>     -> contoh: feat/backend-auth
fix/<scope>-<deskripsi-singkat>      -> contoh: fix/mobile-notif-crash
refactor/<scope>-<deskripsi-singkat>
docs/<deskripsi-singkat>
```

**Scope yang valid:** `backend`, `frontend`, `mobile`, `ci`, `docs`, `shared`

**Alur kerja:**
1. Branch baru dari `main` yang sudah update: `git pull origin main` lalu `git checkout -b feat/backend-auth`
2. Kerjakan perubahan, commit dengan format di atas.
3. Push branch, buka Pull Request ke `main`.
4. PR wajib diisi: deskripsi perubahan, screenshot (jika UI), checklist testing manual.
5. Minimal 1 reviewer (rekan tim) approve sebelum merge.
6. CI (lint + unit test) harus **hijau/lolos** sebelum merge diizinkan.
7. Setelah merge, hapus branch fitur tersebut.

**Dilarang:**
- Force push ke `main`.
- Merge PR sendiri tanpa review (kecuali proyek solo sementara & sudah disepakati tim).

---

## 7. Checklist Sebelum PR Diajukan

```
[ ] Kode sudah lolos linter (tidak ada warning/error)
[ ] Unit test untuk logic baru sudah ditambahkan dan lolos
[ ] Tidak ada console.log/print debug yang tertinggal
[ ] Tidak ada secret/API key hardcoded
[ ] Struktur folder sesuai ARCHITECTURE_*.md
[ ] Sudah dites manual di lokal sesuai skenario fitur
[ ] README/dokumentasi terkait sudah diupdate (jika ada perubahan API/struktur)
```

---

## 8. Referensi Detail per App

- Backend (Clean Architecture, Node.js/Express) → `docs/ARCHITECTURE_BACKEND.md`
- Frontend Web (React/Vite) → `docs/ARCHITECTURE_FRONTEND.md`
- Mobile (Flutter) → `docs/ARCHITECTURE_MOBILE.md`
- CI/CD Pipeline → `.github/workflows/deploy.yml`

---

## 9. Kebijakan Identitas Pengguna & Penghapusan NIK (WAJIB DIIKUTI)

- **NIK (Nomor Induk Kependudukan)**: DIHAPUS dari SELURUH tabel database, UI, endpoint API, dan formulir aplikasi. **Tidak ada role atau modul yang menggunakan NIK**.
- **Mahasiswa KKN**: Menggunakan **NIM** (Nomor Induk Mahasiswa).
- **DPL (Dosen Pembimbing Lapangan)**: Menggunakan **NIP** (Nomor Induk Pegawai).
- **Seluruh Role Lain (Warga, Petugas Residu, RW, Lurah, Camat, Admin DLH, Super Admin)**: Hanya menggunakan **Nomor Telepon (+62)**.

