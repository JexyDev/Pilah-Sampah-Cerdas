# 📜 AGENTS.md — Agent Rulebook & Development Guidelines

## 👨‍💻 1. Profil Pengguna & Arsitektur Workspace
- **Role**: Senior Fullstack Developer & AI Engineer.
- **Struktur Repositori**:
  - `main/` (Monorepo Node.js / Express API Backend & React Web Dashboard)
  - `mobile/` (Aplikasi Mobile Flutter untuk Warga & Mahasiswa KKN)

---

## 🛡️ 2. Aturan Keamanan Git & Branch
1. **DILARANG KERAS PUSH LANGSUNG KE `main`**:
   - Jangan pernah menjalankan `git push origin main` atau push langsung ke branch `main`.
   - Segala perubahan wajib melalui branch pengembangan (`feat/*`, `fix/*`) atau Pull Request.
2. **Sinkronisasi & Keamanan Kode Tim**:
   - Selalu periksa `git status` dan amankan perubahan lokal (stash/commit) sebelum melakukan pull/rebase agar perubahan anggota tim tidak saling tertimpa atau konflik.
   - Dilarang keras melakukan `push --force` pada branch bersama.

---

## 🚫 3. Anti-Regression & Role-Scoping Rules (Pencegahan Bug Berulang)
1. **Dilarang Merusak Fiksasi Sebelumnya (Anti-Revert)**:
   - Sebelum mengubah atau merefaktor komponen dashboard/halaman, AI Agent WAJIB mengecek riwayat fiksasi dan aturan bisnis yang sudah disepakati (Single Source of Truth).
   - Dilarang keras mengembalikan fitur/label yang sudah dikoreksi Klien/Atasan (contoh: label "Ajukan Absensi" HANYA milik Mahasiswa KKN, DILARANG muncul di Dasbor DPL/Taskforce).
2. **Role-Based Component Scoping**:
   - **Dasbor DPL**: Menu & kartu berupa `Validasi Izin & Sakit`, `Monitoring Kelompok` (Bukan `Ajukan Absensi`).
   - **Dasbor Taskforce**: Menu & kartu berupa `Monitoring Presensi`, `Validasi Survei`.
   - **Aplikasi Mahasiswa / Warga**: Menu `Ajukan Absensi`, `Setor Sampah`.
   - Selalu gunakan guard peran yang ketat (`useAuthStore` role check) untuk memfilter navigasi.

---

## 🎨 4. Anti-Slop Guidelines (Filter Visual & Copywriting Generik AI)
1. **No Generic AI Slop Visuals**:
   - Dilarang membuat visual khas AI generik (gradient biru-purple bawaan, floating centered card polos, atau elemen template tanpa ciri khas).
   - Landing Page & UI Web WAJIB menggunakan identitas visual **BERSEKA Eco-Tech** (Warna Emerald/Slate terkurasi `#059669`, `#0f172a`, typography `Plus Jakarta Sans`, serta visual berkarakter humanis lokal Bandung).
2. **No AI Buzzword Copywriting**:
   - Dilarang menggunakan kalimat AI generik seperti *"Seamless, Empowering, Next-Gen, Revolutionary, All-in-One Solution"*.
   - Gunakan kalimat manusiawi, lugas, profesional, dan kontekstual seputar penimbangan sampah & KKN.

---

## 💎 5. Taste-Skill Standards (Frontend Craftsmanship)
1. **Typography & Hierarchy**:
   - Gunakan hirarki typography yang kontras antara judul (`font-black`/`font-extrabold`) dan teks isi (`font-medium`/`font-normal`).
2. **Micro-Animations & Responsive Tactility**:
   - Tambahkan interaksi mikro yang halus saat tombol/card di-hover (`hover:scale-[1.01]`, transition shadow, active state feedback).
3. **No Unstyled Elements**:
   - Setiap elemen interaktif wajib memiliki custom state focus, hover, dan dark/light mode yang konsisten.

---

## ⚙️ 6. Verifikasi & Integritas Teknis
1. **Kompilasi Safe**: Setiap perubahan backend/web WAJIB diverifikasi `npx tsc --noEmit` (0 error) sebelum diajukan.
2. **VPS Touch Approval**: Dilarang mengubah server VPS tanpa persetujuan dan review eksplisit dari pengguna.

---

## ⚠️ 7. Panduan Diagnosa & Antisisipasi 8 Jenis Error Programming

Agent wajib memahami, mengidentifikasi, dan mencegah 8 jenis error berikut dalam setiap siklus pengembangan:

1. **Logical Error (Kesalahan Logika & Algoritma)**
   - *Ciri*: Kode berjalan tanpa crash, namun output/perilaku program salah (contoh: regresi label dashboard, atau salah urutan perhitungan poin).
   - *Pencegahan*: Verifikasi aturan bisnis & scoping role sebelum menulis kode; tulis self-check logic.
2. **Syntax Error (Kesalahan Tata Bahasa Kode)**
   - *Ciri*: Kode gagal berjalan sama sekali karena kesalahan ejaan kata kunci, kurung buka/tutup yang hilang, atau struktur broken.
   - *Pencegahan*: Lakukan linter check & verifikasi keakuratan penulisan kode.
3. **Runtime Error (Kesalahan Saat Program Berjalan)**
   - *Ciri*: Program mengalami *crash* atau melempar pengecualian (*uncaught exception*) saat diproses (contoh: *null pointer dereference*, *unhandled promise rejection*).
   - *Pencegahan*: Gunakan *optional chaining* (`?.`), validasi `non-null`, dan *try-catch error boundary*.
4. **Compilation Error (Kesalahan Saat Build / Transpile)**
   - *Ciri*: TypeScript/Compiler gagal mengubah kode ke JavaScript/executable karena *type mismatch* atau *missing export/import*.
   - *Pencegahan*: Selalu jalankan `npx tsc --noEmit` secara lokal sebelum menganggap pekerjaan selesai.
5. **Interfacing Error (Kesalahan Protokol & Kontrak API)**
   - *Ciri*: Ketidaksesuaian kontrak payload antara frontend (Mobile/Web) dan backend API (contoh: format JSON beda, endpoint URL salah, HTTP status code keliru).
   - *Pencegahan*: Inspeksi skema DTO/Interface API secara utuh sebelum mengonsumsi data.
6. **Arithmetic Error (Kesalahan Perhitungan Matematika)**
   - *Ciri*: Operasi matematika yang tidak valid (contoh: pembagian angka dengan `0`, nilai `NaN`, atau *overflow* urutan kurung).
   - *Pencegahan*: Validasi pembagi tidak nol (`denominator !== 0`) dan gunakan pembulatan aman (`Math.round` / `toFixed`).
7. **Resource Error (Kesalahan Sumber Daya System / Memory Exceed)**
   - *Ciri*: Penggunaan memori/CPU melebihi kapasitas server, *memory leak*, atau *queue overflow*.
   - *Pencegahan*: Lakukan *compression image* di client, atur batas *time-out*, dan bersihkan resource listener/cron.
8. **Semantic Error (Kesalahan Makna Eksekusi Kode)**
   - *Ciri*: Pernyataan secara sintaksis valid, tetapi menghasilkan operasi yang tidak memiliki arti/makna bisnis (contoh: variabel terdefinisi tapi bernilai `undefined` tanpa kegunaan).
   - *Pencegahan*: Pastikan variabel dan ekspresi kode memiliki makna dan kegunaan nyata yang sesuai tujuan bisnis.
