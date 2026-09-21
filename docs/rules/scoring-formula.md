# 📐 SINGLE SOURCE OF TRUTH — RUMUS PENILAIAN SISTEM BERSEKA

> **STATUS: AKTIF & BERLAKU**  
> **Terakhir diperbarui:** 17 September 2026  
> **Disetujui oleh:** Product Owner  
> **Dokumen ini adalah satu-satunya kebenaran rumus penilaian.**  
> Dokumen lain di `docs/` yang memuat rumus hanya bersifat arsip historis.

---

> [!IMPORTANT]
> **UNTUK AI CODING ASSISTANT**: Jika ada konflik antara rumus di dokumen ini dengan rumus di file lain (laporan, PRD, arsip), **selalu gunakan rumus di dokumen ini**. Laporkan konfliknya ke pengguna dan jangan pilih sendiri.

---

## 📌 DAFTAR ISI

1. [Aturan 3-Step Program Kerja (Proker)](#1-aturan-3-step-program-kerja-proker)
2. [Formula Poin Kelompok — Bobot 60% : 40%](#2-formula-poin-kelompok--bobot-60--40)
3. [Formula Poin DPL — Bobot 50% : 50%](#3-formula-poin-dpl--bobot-50--50)
4. [Batasan & Guardrail Teknis](#4-batasan--guardrail-teknis)
5. [Catatan Revisi](#5-catatan-revisi)

---

## 1. Aturan 3-Step Program Kerja (Proker)

Setiap 1 Program Kerja memiliki 3 tahapan. Setiap tahap memberikan **+2 poin statis** ke riwayat gamifikasi (`PointHistory`) semua anggota kelompok dengan kategori `KKN_PROKER`.

| Tahapan | `statusUsulan` | `statusPelaksanaan` | Nilai Poin | Total Akumulasi | Tag Idempotensi |
|:---|:---:|:---:|:---:|:---:|:---|
| **Step 1: Usulan Disetujui** | `DISETUJUI` | `BELUM_MULAI` | +2 PTS | 2 PTS | `[ProkerID:<id>:DISETUJUI]` |
| **Step 2: Mulai Berjalan** | `DISETUJUI` | `SEDANG_BERJALAN` | +2 PTS | 4 PTS | `[ProkerID:<id>:BERJALAN]` |
| **Step 3: Tuntas Selesai** | `DISETUJUI` | `SELESAI` | +2 PTS | 6 PTS | `[ProkerID:<id>:SELESAI]` |
| ❌ **Ditolak** | `DITOLAK` | `BELUM_MULAI` | 0 PTS | 0 PTS | Seluruh tag proker dihapus |

**Idempotensi:** Pemanggilan API berulang tidak menduplikasi poin berkat tag unik per proker per step.

---

## 2. Formula Poin Kelompok — Bobot 60% : 40%

$$\mathbf{\text{Poin Kelompok}} = (\text{Poin Proker} \times 0{,}6) + (\text{Rata-rata Saldo Anggota} \times 0{,}4)$$

### Komponen:

| Komponen | Definisi | Catatan |
|:---|:---|:---|
| **Poin Proker** | Kumulatif poin dari seluruh proker kelompok | Step 1 = 2pts, Step 2 = 4pts, Step 3 = 6pts per proker |
| **Rata-rata Saldo Anggota** (`rataRataPoinAnggota`) | Total saldo seluruh anggota ÷ jumlah anggota | **Dasar: Total Saldo** (presensi + bonus login + bonus normalisasi), BUKAN hanya presensi murni |

> [!WARNING]
> **Perubahan sejak 17 Sept 2026 (revisi PO):** Basis `rataRataPoinAnggota` adalah **Total Saldo** (field `totalCumulativeMemberPoints`), bukan `pureTotalCumulativeMemberPoints` (presensi murni). Revisi ini memastikan angka di kartu "Skor Terbobot" cocok secara matematika dengan angka di kartu "Total Akumulasi Tim".

### Guardrail Teknis:
```typescript
const MAX_AVERAGE_CAP = 1000;
rataRataPoinAnggota = Math.round(Math.min(rawRataRata, MAX_AVERAGE_CAP) * 10) / 10;
```

### Contoh Perhitungan Resmi (4 anggota, Poin Proker = 48 PTS, Total Saldo Tim = 333 PTS):

| Komponen | Kalkulasi | Hasil |
|:---|:---|:---:|
| Kontribusi Proker (60%) | 48 × 0,6 | **28,8** |
| Rata-rata Saldo | 333 ÷ 4 | 83,3 |
| Kontribusi Anggota (40%) | 83,3 × 0,4 | **33,3** |
| **Poin Kelompok Akhir** | 28,8 + 33,3 | **62,1 Poin** |

### Field DTO Respons (GET /api/v1/kkn/kelompok/me):
- `totalGroupPoints` / `poinKelompok` → Skor terbobot akhir
- `rataRataPoinAnggota` → Rata-rata saldo (basis total)
- `pureRataRataPoinAnggota` → Rata-rata presensi murni (untuk audit DPL saja)
- `totalCumulativeMemberPoints` → Total saldo seluruh anggota
- `pureTotalCumulativeMemberPoints` → Presensi murni (untuk audit DPL saja)

---

## 3. Formula Poin DPL — Bobot 50% : 50%

$$\mathbf{\text{Poin DPL}} = (\text{Poin Logbook DPL} \times 0{,}5) + (\text{Poin Kelompok} \times 0{,}5)$$

### Komponen:

| Komponen | Kondisi | Nilai |
|:---|:---|:---:|
| **Poin Logbook DPL** | Tersedia (≥ 1 entri) | **6 Poin** |
| **Poin Logbook DPL** | Tidak tersedia (0 entri) | **0 Poin** |
| **Poin Kelompok** | Nilai terbobot dari kelompok dampingan | (dari §2) |

> [!IMPORTANT]
> Logbook DPL bersifat **biner** (6 atau 0). Bukan akumulasi per-entri. Bukan `5 × n`.

### Contoh Perhitungan Resmi:

**Skenario A** (DPL sudah isi logbook, Poin Kelompok = 11,8):
$$\text{Poin DPL} = (6 \times 0{,}5) + (11{,}8 \times 0{,}5) = 3{,}0 + 5{,}9 = \mathbf{8{,}9 \text{ Poin}}$$

**Skenario B** (DPL belum isi logbook, Poin Kelompok = 11,8):
$$\text{Poin DPL} = (0 \times 0{,}5) + (11{,}8 \times 0{,}5) = 0 + 5{,}9 = \mathbf{5{,}9 \text{ Poin}}$$

---

## 4. Batasan & Guardrail Teknis

| Guardrail | Nilai | Keterangan |
|:---|:---:|:---|
| Max `rataRataPoinAnggota` (cap) | 1.000 PTS | Mencegah nilai ekstrem dari anomali data |
| `calculateGroupPoints()` | Read-only | Tidak melakukan penulisan DB, aman dari loop rekursif |
| Idempotensi proker | Per-step tag | Pemanggilan berulang tidak duplikasi poin |

---

## 5. Catatan Revisi

| Tanggal | Perubahan | Oleh |
|:---|:---|:---|
| 16 Sep 2026 | Rilis awal formula: Poin Proker 3-step, Kelompok 60:40, DPL 50:50 | Backend Engineering |
| 17 Sep 2026 | **Revisi PO**: Basis `rataRataPoinAnggota` diubah dari presensi murni → Total Saldo tim. Safety cap 1.000 PTS ditambahkan. Field `pure*` dipertahankan untuk audit DPL. | Product Owner |

---

*Untuk mengubah rumus dalam dokumen ini, diperlukan persetujuan eksplisit Product Owner dan harus disertai nomor revisi baru di tabel Catatan Revisi.*
