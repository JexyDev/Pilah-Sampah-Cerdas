# 🔀 Git Workflow & Branching Strategy — Trashcare

## Aturan Utama

> **SATU branch utama (`main`), aplikasi dipisah FOLDER, bukan branch.**

```
✅ BENAR: apps/api, apps/web, apps/mobile (dalam 1 branch)
❌ SALAH: branch "be", "fe", "mobile" (terpisah per branch)
```

---

## Branch yang Diizinkan

| Jenis | Format Nama | Contoh | Dari Mana | Merge Ke |
|---|---|---|---|---|
| Utama | `main` | — | — | — |
| Fitur Baru | `feature/<deskripsi>` | `feature/auth-mobile` | `main` | `main` |
| Perbaikan Bug | `fix/<deskripsi>` | `fix/voronoi-crash` | `main` | `main` |
| Perbaikan Darurat | `hotfix/<deskripsi>` | `hotfix/login-broken` | `main` | `main` |

### ❌ DILARANG KERAS
- Branch bernama `be`, `backend`, `fe`, `frontend`, `mobile`
- Memisahkan aplikasi berdasarkan branch

---

## Alur Kerja Sehari-hari

### 1. Mulai Fitur Baru
```bash
git checkout main
git pull origin main
git checkout -b feature/nama-fitur
```

### 2. Koding & Commit
```bash
git add .
git commit -m "feat(api): add waste classification endpoint"
```

### 3. Push & Buat Pull Request
```bash
git push origin feature/nama-fitur
# Buka GitHub → Buat Pull Request ke main
```

### 4. Setelah di-Merge
```bash
git checkout main
git pull origin main
git branch -d feature/nama-fitur
```

---

## Konvensi Commit Message

Lihat `AGENTS.md` untuk detail lengkap. Ringkasan:

```
<tipe>(<cakupan>): <subjek>

Contoh:
feat(api): add bin activation endpoint
fix(web): resolve voronoi map crash
docs(mobile): update API integration guide
refactor(api): extract point calculation to service
```

Cakupan yang digunakan: `api`, `web`, `mobile`, `shared`, `ci`, `docs`

---

## Tips untuk Tim

1. **Selalu pull `main` terbaru** sebelum membuat branch baru
2. **Satu fitur = satu branch** — jangan campur banyak fitur dalam satu branch
3. **Jangan commit langsung ke `main`** — selalu lewat Pull Request
4. **Review kode satu sama lain** sebelum merge
