# CLAUDE.md — Pedoman Tata Kelola AI Agent (Semua AI Coding Assistant)

> Dokumen ini berlaku untuk **seluruh AI coding assistant** yang bekerja pada repo BERSEKA:  
> Claude Code, Cursor, Copilot, Windsurf, Antigravity, dan sejenisnya.

---

## 🔴 ATURAN 1 — MODE DEFAULT: BACA-SAJA (READ-ONLY BY DEFAULT)

**AI DILARANG KERAS melakukan perubahan apa pun sebelum ada persetujuan eksplisit dari pengguna.**

### Yang dimaksud "persetujuan eksplisit":
- Pengguna mengetik konfirmasi positif seperti: `"ya"`, `"lanjut"`, `"eksekusi"`, `"oke"`, atau setara.
- **BUKAN**: Diam, tidak ada respons, pertanyaan balik, atau frasa ambigu seperti `"bagaimana menurut kamu?"`.

### Prosedur Wajib Sebelum Eksekusi Kode:
1. **Sajikan rencana** (plan/ringkasan perubahan) dulu dalam format yang jelas.
2. **Tutup dengan blok berikut** (WAJIB, tidak boleh dihilangkan):
   ```
   ═══════════════════════════════════════
   ⚠️  YANG SAYA BUTUHKAN DARI KAMU
   ═══════════════════════════════════════
   Ketik: "ya" atau "lanjut" untuk mengeksekusi
   Ketik: "tidak" atau "stop" untuk membatalkan
   Ketik: pertanyaan jika ada yang perlu diklarifikasi
   ═══════════════════════════════════════
   ```
3. **Hanya setelah konfirmasi diterima**, AI boleh menulis/memodifikasi kode.

---

## 🔴 ATURAN 2 — LARANGAN GIT MUTLAK (ABSOLUTE GIT PROHIBITION)

**AI DILARANG KERAS menjalankan perintah git berikut TANPA konfirmasi eksplisit per-perintah:**

| Perintah yang Dilarang | Alasan |
|---|---|
| `git push` (dalam bentuk apa pun) | Memutarbalikkan remote yang tidak bisa di-undo dengan mudah |
| `git push --force` / `git push -f` | **DILARANG KERAS SELAMANYA** di branch bersama |
| `git commit -m ...` | Harus disertai ringkasan perubahan dulu |
| `git merge` | Harus ada review konflik dulu |
| `git rebase` | Harus ada konfirmasi eksplisit |
| `git reset --hard` | Dapat menghapus perubahan yang belum di-commit |
| `git checkout -b` (buat branch baru) | Harus dikonfirmasi nama branch-nya |
| `git stash pop` | Harus dikonfirmasi konteks stash-nya |

### Yang BOLEH dilakukan tanpa konfirmasi:
- `git status`, `git log`, `git diff`, `git branch` — perintah read-only aman.
- `git fetch` — hanya mengunduh, tidak mengubah working tree.
- `git stash` — hanya menyimpan, tidak menerapkan.

### Prosedur Wajib untuk Setiap Git Mutasi:
```
Sebelum menjalankan: git [perintah] [argumen]
AI WAJIB menampilkan:
  - Perintah lengkap yang akan dijalankan
  - Dampak yang akan terjadi (branch mana, remote mana, file apa)
  - Apakah ada risiko data loss atau konflik
Lalu tunggu konfirmasi.
```

---

## 🟡 ATURAN 3 — BATAS OUTPUT & KOMUNIKASI

Untuk menjaga efisiensi komunikasi dan menghindari overload informasi:

1. **Batas 400 kata per respons** kecuali pengguna secara eksplisit meminta "detail penuh" atau "jelaskan semua".
2. **Setiap respons yang menyarankan tindakan** WAJIB diakhiri dengan blok `YANG SAYA BUTUHKAN DARI KAMU` (lihat Aturan 1).
3. **Jika pengguna tampak lelah atau tidak responsif**: AI WAJIB menyederhanakan output dan menawarkan opsi menunda ke sesi berikutnya.

---

## 🟡 ATURAN 4 — HIERARKI OTORITAS DOKUMEN

Jika ada konflik antara dua sumber informasi, urutan prioritas adalah:

```
1. 🥇 docs/rules/scoring-formula.md    ← Satu-satunya kebenaran rumus penilaian
2. 🥈 AGENTS.md (di root monorepo)     ← Standar kode & workflow git
3. 🥉 CLAUDE.md (file ini)             ← Aturan tata kelola AI
4. 📄 docs/*.md (laporan/arsip)        ← Referensi historis, BUKAN kebenaran aktif
5. ❌ Memori/training AI               ← TIDAK VALID sebagai sumber rumus bisnis
```

**Aturan Konflik:** Jika ada dua dokumen berbeda yang menunjukkan rumus berbeda,  
AI **WAJIB berhenti**, melaporkan konfliknya ke pengguna, dan **TIDAK BOLEH** memilih salah satu sendiri.

---

## 🛑 ATURAN 5 — LARANGAN EKSEKUSI LANGSUNG KE VPS

Lihat detail lengkap di [AGENTS.md](./AGENTS.md) bagian "Aturan Perlindungan Database VPS".

Ringkasan keras:
- **Dilarang** `prisma db push` di VPS — hanya `prisma migrate deploy`.
- **Dilarang** skrip seeder/bulk-insert ke database produksi.
- **Dilarang** raw SQL mutasi (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) tanpa Golden Backup dan persetujuan eksplisit.

---

## 📋 CHECKLIST SEBELUM AI MEMULAI SESI

Sebelum mengerjakan tugas apa pun, AI WAJIB memverifikasi:

```
[ ] Apakah saya sudah membaca CLAUDE.md ini? (ya/tidak)
[ ] Apakah tugas ini membutuhkan perubahan kode? → Sajikan plan dulu
[ ] Apakah ada operasi git dalam tugas? → Minta konfirmasi per-perintah
[ ] Apakah ada rumus/formula yang perlu dikonsultasi? → Baca docs/rules/scoring-formula.md
[ ] Apakah menyentuh VPS/production? → STOP dan minta persetujuan eksplisit
```

---

*Dokumen ini dibuat pada 19 September 2026 dan berlaku untuk semua sesi AI pada repo ini.*  
*Untuk update dokumen ini, diperlukan persetujuan Product Owner.*
