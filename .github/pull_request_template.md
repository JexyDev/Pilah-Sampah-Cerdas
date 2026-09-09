## 📝 Deskripsi Perubahan
Jelaskan secara ringkas perubahan yang dilakukan pada Pull Request ini:
* **Masalah yang diselesaikan:**
* **Pendekatan teknis:**
* **Tiket / Issue terkait:**

---

## 📌 Jenis Perubahan
Pilih yang sesuai (berikan tanda `[x]`):
- [ ] `feat`: Penambahan fitur baru
- [ ] `fix`: Perbaikan bug
- [ ] `docs`: Perubahan atau penambahan dokumentasi
- [ ] `style`: Formatting / estetika kode tanpa perubahan logika
- [ ] `refactor`: Restrukturisasi kode tanpa merubah fungsionalitas
- [ ] `perf`: Optimalisasi performa sistem
- [ ] `test`: Penambahan atau pembaruan unit test
- [ ] `chore`: Konfigurasi CI/CD, build tools, dependencies

---

## 🎯 Target Cabang & Lingkungan (Branching SOP)
Pilih jalur integrasi PR ini (berikan tanda `[x]`):
- [ ] `feat/...` / `fix/...` ➡️ `development` (Integrasi kode baru lokal/dev)
- [ ] `development` ➡️ `staging` (Deploy otomatis ke **https://staging.berseka.id**)
- [ ] `staging` ➡️ `main` (Deploy otomatis ke **https://berseka.id** / Production)

---

## 📦 Komponen Terdampak
- [ ] `apps/api` (Backend Express & Prisma ORM)
- [ ] `apps/web` (Frontend React Dashboard)
- [ ] `mobile` (Flutter Client)
- [ ] `ci/cd` (GitHub Actions Workflows)
- [ ] `docs` (Dokumentasi & Guideline)

---

## ✅ Checklist Standar ISO & Quality Control (QC)
Wajib dicek sebelum mengajukan review dan merge:
- [ ] **Type Check Backend:** `cd apps/api && npx tsc --noEmit` lolos (0 error).
- [ ] **Type Check Web:** `cd apps/web && npx tsc --noEmit` lolos (0 error).
- [ ] **Prisma Check:** Migrasi tidak menyebabkan data loss pada tabel inti (`pengguna`, `kehadiran_kegiatan`, `kelompok_kkn`).
- [ ] **Standar Istilah:** Tidak menggunakan kata 'tong' / 'tong sampah', selalu menggunakan 'Tempat Sampah'.
- [ ] **Standar Identitas:** Tidak menggunakan NIK. Menggunakan No. Telepon (+62).
- [ ] **Standar Data:** Tidak menyertakan hardcoded data dummy statis tanpa status indicator yang jelas.
- [ ] **Security:** Tidak ada credentials, private keys, atau database password yang ter-commit.
- [ ] **Commit Message:** Mengikuti standar Conventional Commits (`feat(scope): ...`, `fix(scope): ...`).

---

## 📷 Cuplikan Layar / Screenshot (Jika Ada)
Tempel tangkapan layar antarmuka atau log hasil test di sini jika relevan.
