# 🔄 Sistem Sinkronisasi Otomatis GitHub ↔ Trello
## Pilah Sampah Cerdas — Panduan Developer

Sistem ini otomatis membuat & mengupdate **card Trello** setiap kali ada commit/push
ke repo. Developer cukup menulis commit message dengan format yang benar — sisanya
dikerjakan oleh GitHub Actions + Trello Butler.

---

## 📌 Format Commit Message WAJIB

```
<tipe>(<modul>): <judul singkat> - refs <ID-TASK>
```

### Komponen:
| Komponen | Keterangan | Contoh |
|---|---|---|
| `<tipe>` | Jenis perubahan | `feat`, `fix`, `refactor`, `style`, `docs`, `chore` |
| `<modul>` | Bagian yang diubah | `backend`, `frontend`, `mobile`, `auth`, `core` |
| `<judul>` | Deskripsi singkat (imperatif) | `tambahkan fitur scan QR` |
| `refs <ID>` | ID task yang dikerjakan | `refs MOB-012`, `refs BUG-014` |

### Format ID Task:
- **Backend**: `BUG-001`, `BE-001`, `API-001`
- **Frontend**: `FE-001`, `UI-001`, `WRG-001`
- **Mobile**: `MOB-001`, `APP-001`
- **Umum**: `TASK-001`, `FEAT-001`, `FIX-001`

---

## ✅ Contoh Commit BENAR

```bash
# Fitur baru di mobile — membuat card baru di Trello "Backlog"
feat(mobile): redesign halaman login dengan animasi - refs MOB-012

# Perbaikan bug backend — update card yang sudah ada ke "In Progress"
fix(backend): perbaiki validasi RBAC waste-logs - refs BUG-014

# Commit menyentuh frontend sekaligus — card dapat 2 label
feat(fe): tambahkan komponen chart statistik - refs FE-023

# Menyelesaikan task (kata kunci "selesai") — checklist tercentang otomatis
fix(mobile): selesaikan perbaikan crash saat kamera dibuka - refs MOB-012 selesai

# Alternatif kata kunci selesai yang juga valid:
feat(backend): complete implementasi endpoint setoran - refs BE-007 done
refactor(core): resolve masalah race condition login - refs BUG-005 close
```

## ❌ Contoh Commit SALAH (tidak akan membuat/update card)

```bash
# SALAH: Tidak ada "refs <ID>"
feat(mobile): redesign halaman login dengan animasi

# SALAH: Format ID salah (harus huruf besar semua + angka)
feat(mobile): redesign halaman login - refs mob-012

# SALAH: Menggunakan "ref" bukan "refs"
feat(mobile): redesign halaman login - ref MOB-012

# SALAH: ID tidak ada tanda hubung
feat(mobile): redesign halaman login - refs MOB012
```

---

## 🏷️ Deteksi Label Otomatis

GitHub Actions mendeteksi label **Backend / Frontend / Mobile** dari file yang berubah:

| File berubah di folder | Label Trello |
|---|---|
| `mobile/` | Mobile |
| `frontend/` atau `fe/` | Frontend |
| `src/`, `backend/`, `prisma/`, root | Backend |
| Menyentuh >1 folder | Dapat lebih dari 1 label |

---

## 🔁 Alur Kerja Otomatis

```
Push commit ke main
       ↓
GitHub Actions: Trello Sync job
       ↓
  Ada refs <ID>?
  ├── Tidak → skip commit ini
  └── Ya →
        Card sudah ada?
        ├── Tidak → Buat card baru di "Backlog"
        │           + Deskripsi lengkap
        │           + Checklist (Implementasi, Testing, Review)
        │           + Label (Backend/Frontend/Mobile)
        └── Ya  → Tambahkan comment + pindahkan ke "In Progress"
        
  Commit punya kata kunci done/selesai/close/resolve?
  └── Ya → Centang semua checklist → Butler otomatis pindahkan ke "Done"
```

---

## 🔍 Cara Cek Status Sync

File `.trello-sync-state.json` di root repo menyimpan mapping commit terakhir → card ID:

```json
{
  "lastProcessedSha": "abc123...",
  "cardMap": {
    "MOB-012": "trello-card-id-abc",
    "BUG-014": "trello-card-id-xyz"
  }
}
```

- **`lastProcessedSha`**: Commit terakhir yang sudah diproses. Commit sebelum ini tidak akan diproses ulang.
- **`cardMap`**: Mapping ID task → Trello card ID. Dipakai untuk anti-duplikat.

> [!NOTE]
> File ini di-commit otomatis oleh GitHub Actions setelah setiap sync berhasil.
> Jangan edit manual kecuali perlu reset.

**Reset sync state (misalnya pindah board):**
```bash
echo '{"lastProcessedSha":null,"cardMap":{}}' > .trello-sync-state.json
git add .trello-sync-state.json
git commit -m "chore: reset trello sync state [skip ci]"
git push
```

---

## ⚙️ Setup Awal (Satu Kali)

### 1. Konfigurasi GitHub Secrets

Tambahkan di **Settings → Secrets and Variables → Actions**:

| Secret | Cara mendapatkan |
|---|---|
| `TRELLO_API_KEY` | [trello.com/power-ups/admin](https://trello.com/power-ups/admin) → Generate API Key |
| `TRELLO_TOKEN`   | Klik "Token" di halaman yang sama → Authorize |
| `TRELLO_BOARD_ID` | Buka board Trello → lihat URL: `trello.com/b/**BOARD_ID**/...` |

> [!CAUTION]
> **JANGAN** hardcode credentials ini di kode. Selalu gunakan GitHub Secrets.

### 2. Setup Board Trello

Pastikan board Trello memiliki list dengan nama persis (case-insensitive):
- `Backlog`
- `In Progress`
- `Review/Testing` *(opsional)*
- `Done`

### 3. Konfigurasi Trello Butler (Manual — Wajib)

Butler adalah bot otomasi bawaan Trello yang **harus dikonfigurasi manual di UI** (tidak bisa via API).

**Rule A — Auto-pindah ke "Done" saat checklist selesai:**
1. Buka board → klik **Automation** (pojok kanan atas)
2. Pilih **Rules** → **+ Add Rule**
3. **Trigger**: *"When all the items in a checklist on a card are checked"*
4. **Action 1**: *"Move the card to list 'Done'"*
5. **Action 2**: *"Add the label 'Completed' to the card"*
6. Simpan

**Rule B — Auto-comment timestamp saat masuk "In Progress":**
1. **Rules** → **+ Add Rule**
2. **Trigger**: *"When a card is moved into list 'In Progress'"*
3. **Action**: *"Post comment: 'Started: {date}' by Butler"*
4. Simpan

---

## 🧪 Test End-to-End

```bash
# 1. Buat commit test dengan refs baru
git commit --allow-empty -m "feat(backend): test automation sync - refs TEST-001"
git push

# → Tunggu GitHub Actions selesai (~1 menit)
# → Card "TEST-001" harus muncul di Trello "Backlog" dengan deskripsi lengkap

# 2. Update task (pindah ke In Progress)
git commit --allow-empty -m "fix(backend): update implementasi test - refs TEST-001"
git push

# → Card harus pindah ke "In Progress" + ada comment baru

# 3. Selesaikan task
git commit --allow-empty -m "chore(backend): selesaikan test automation - refs TEST-001 done"
git push

# → Checklist tercentang semua → Butler pindahkan ke "Done"
```

---

## 🚨 Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Card tidak muncul | Credentials salah / tidak di-set | Cek GitHub Secrets |
| Card tidak muncul | Format refs salah | Pastikan pola `refs XX-000` (huruf kapital) |
| Card duplikat | State file di-reset tanpa clear cardMap | Jangan hapus `cardMap` di state file |
| Workflow gagal tapi deploy jalan | ✅ Normal — `continue-on-error: true` | Tidak perlu action |
| Board tidak punya list "Backlog" | Nama list tidak sesuai | Rename list di Trello |
| Butler tidak pindahkan ke Done | Butler rule belum dikonfigurasi | Ikuti panduan Butler di atas |

---

## 📁 Struktur File Automation

```
pilahsampah-id/
├── scripts/
│   └── trello-sync.js          # Script utama sync (commit-driven)
├── .github/
│   └── workflows/
│       ├── trello-sync.yml     # Workflow GitHub Actions untuk Trello sync
│       └── backend-ci.yml      # CI/CD build & deploy (TERPISAH dari Trello)
├── .trello-sync-state.json     # State tracker (auto-commit oleh Actions)
└── README-automation.md        # Dokumentasi ini
```

> [!IMPORTANT]
> Script automation **tidak menyentuh** kode aplikasi (backend, frontend, mobile).
> Hanya beroperasi di `scripts/`, `.github/workflows/`, dan `.trello-sync-state.json`.
