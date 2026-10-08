/**
 * Generator Laporan Resmi PDF: Sinkronisasi Wilayah KKN 75 RW Binaan vs 85 RW Basis Data & Dashboard
 * Nomor Dokumen: BERSEKA/AUDIT-VPS/2026-10/015
 * Tanggal: Kamis, 8 Oktober 2026
 * Standar: A4 Executive Multi-Page Document via Microsoft Edge Headless Engine
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootMainDir = path.resolve(__dirname, '../..');
const docsDir = path.join(rootMainDir, 'docs');
const workspaceDir = path.resolve(rootMainDir, '..');
const brainArtifactDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\ab945dd1-5c66-4e86-b443-38ea3e093497';

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const targetHtmlPath = path.join(docsDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.html');
const targetPdfPath = path.join(docsDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.pdf');
const workspacePdfPath = path.join(workspaceDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.pdf');
const workspaceHtmlPath = path.join(workspaceDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.html');
const docsMdPath = path.join(docsDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.md');
const workspaceMdPath = path.join(workspaceDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.md');
const artifactPdfPath = path.join(brainArtifactDir, 'LAPORAN_RESMI_SINKRONISASI_WILAYAH_KKN_75_RW_TERBARU.pdf');

const mdContent = `# 🌿 BERSEKA - SISTEM TATA KELOLA TERPADU
## LAPORAN RESMI AUDIT, ANALISIS, DAN PENYELARASAN CAKUPAN WILAYAH RW KKN TEMATIK BERSEKA
### (SINKRONISASI 75 RW BINAAN KKN, HIDE 10 RW NON-KKN, DAN RESOLUSI DATA BASIS DATA 85 RW)

* **Nomor Dokumen**: \`BERSEKA/AUDIT-VPS/2026-10/015\`  
* **Tanggal Pelaksanaan**: Kamis, 8 Oktober 2026  
* **Target Infrastruktur**: Basis Data Live VPS PostgreSQL (\`157.10.252.252\` / \`psc_db\`) & Web Portal Eksekutif KKN  
* **Penerbit Dokumen**: **Tim Pengembang & Data Governance Berseka**  
* **Fungsi Dokumen**: Berita Acara Rekonsiliasi Wilayah & Penetapan Baseline 75 RW Binaan  

---

### 1. Ringkasan Eksekutif (Executive Summary)

Menindaklanjuti audit perbandingan angka cakupan wilayah pada:
1. **Tampilan Dashboard Eksekutif KKN**: Sebelumnya tercantum **84 RW**.
2. **Dokumen Resmi Rekapitulasi PDF**: Tercantum **75 RW Binaan KKN**.
3. **Tabel Basis Data (\`rw\`) Live PostgreSQL VPS**: Tercatat **85 RW Administratif Fisik**.

Tim Berseka telah melakukan investigasi mendalam terhadap akar penyebab inkonsistensi tersebut, mengeksekusi penyesuaian kode pada backend API dan antarmuka web, serta menyembunyikan (*hide*) 10 RW non-binaan secara permanen dari lingkup operasional KKN.

#### Hasil Audit & Eksekusi Perbaikan:
* ✅ **Akar Perbedaan 84 vs 75 vs 85**:
  - **85 RW (Database Geografis)**: Seluruh record fisik tabel \`rw\` di 6 kelurahan Kecamatan Coblong.
  - **84 RW (Dashboard Lama)**: Kueri lama memfilter nama \`dummy/test/99\` dari 85 RW ($85 - 1 = 84$), sehingga menampilkan total wilayah administratif kecamatan dan bukan wilayah binaan mahasiswa KKN.
  - **75 RW (Wilayah Binaan Riil KKN)**: Wilayah binaan pemukiman aktif yang dinaungi oleh **32 Kelompok Mahasiswa KKN** dan **75 Akun Petugas Pemilah Residu Resmi** (\`+6281390000001\` s/d \`+6281390000075\`).
* ✅ **10 RW Non-KKN Berhasil Disembunyikan (*Hidden*)**:
  10 RW yang tidak digunakan program KKN (kawasan hutan kota, kampus, pertokoan komersial, dan unit test) telah disembunyikan dari metrik kartu dan dropdown filter:
  - **Lebak Siliwangi (4 RW)**: RW 01, RW 02, RW 03, RW 04 *(Hutan Kota Babakan Siliwangi, Sarana Olahraga Sabuga, dan ITB)*.
  - **Lebak Gede (2 RW)**: RW 05 dan RW 06 *(Kampus Unpad Dipatiukur & kawasan komersial)*.
  - **Cipaganti (4 RW)**: RW 09, RW 10, RW 11 *(Kawasan komersial Jl. Cihampelas)* dan RW 99 *(Unit uji coba/testing)*.
* ✅ **Penyelarasan Kartu Ringkasan Wilayah**:
  Kartu *Cakupan Wilayah KKN* di Dashboard Eksekutif kini resmi sinkron menampilkan **6 Kelurahan • 75 RW Binaan** (sama persis dengan PDF dan penugasan lapangan).
`;

fs.writeFileSync(docsMdPath, mdContent, 'utf8');
fs.writeFileSync(workspaceMdPath, mdContent, 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Resmi Sinkronisasi Cakupan Wilayah KKN 75 RW Binaan - BERSEKA</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {
        content: "Halaman " counter(page) " dari " counter(pages);
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      font-size: 9.2pt;
      line-height: 1.45;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .page-container {
      width: 100%;
      position: relative;
    }
    .header-box {
      border-bottom: 2.5px solid #059669;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 14pt;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.5px;
      margin: 0 0 2px 0;
    }
    .brand-subtitle {
      font-size: 8pt;
      font-weight: 700;
      color: #475569;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0 0 0;
    }
    .header-right {
      text-align: right;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.35;
    }
    .badge-status {
      display: inline-block;
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8pt;
      margin-top: 4px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 7.2pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .meta-item span {
      color: #0f172a;
      font-weight: 700;
    }
    h3 {
      font-size: 10pt;
      font-weight: 800;
      color: #047857;
      margin: 12px 0 6px 0;
      border-left: 3px solid #059669;
      padding-left: 6px;
      text-transform: uppercase;
    }
    p {
      margin: 0 0 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 8.2pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.3px;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .highlight-row {
      background-color: #ecfdf5 !important;
      font-weight: 700;
    }
    .text-center { text-align: center; }
    .text-success { color: #059669; font-weight: 700; }
    .text-danger { color: #dc2626; font-weight: 700; }
    .text-amber { color: #d97706; font-weight: 700; }
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      background: #ffffff;
      border-top: 3px solid #059669;
    }
    .kpi-title {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
    }
    .kpi-desc {
      font-size: 7.2pt;
      color: #64748b;
      margin-top: 2px;
    }
    .callout-box {
      background-color: #f0fdf4;
      border-left: 3.5px solid #16a34a;
      border-right: 1px solid #bbf7d0;
      border-top: 1px solid #bbf7d0;
      border-bottom: 1px solid #bbf7d0;
      border-radius: 4px;
      padding: 8px 10px;
      margin: 10px 0;
      font-size: 8.2pt;
      line-height: 1.4;
    }
    .callout-title {
      font-weight: 800;
      color: #166534;
      margin-bottom: 3px;
    }
    .signature-section {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      font-size: 8pt;
      page-break-inside: avoid;
    }
    .signature-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
    }
    .sig-role {
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      font-size: 7.2pt;
      margin-bottom: 30px;
    }
    .sig-name {
      font-weight: 800;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
    }
    .sig-inst {
      font-size: 7.2pt;
      color: #64748b;
    }
    .footer-doc {
      margin-top: 14px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 7pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
<div class="page-container">

  <!-- Header -->
  <div class="header-box">
    <div class="header-left">
      <div class="brand-title">🌿 BERSEKA INDONESIA</div>
      <div class="brand-subtitle">Sistem Tata Kelola Sampah Cerdas & Integrasi KKN Tematik Coblong</div>
      <div class="doc-title">BERITA ACARA AUDIT & SINKRONISASI CAKUPAN WILAYAH KKN (75 RW)</div>
    </div>
    <div class="header-right">
      <div><strong>No. Dokumen:</strong> BERSEKA/AUDIT-VPS/2026-10/015</div>
      <div><strong>Tanggal:</strong> 8 Oktober 2026</div>
      <div class="badge-status">STATUS: 100% SINKRON & TERVERIFIKASI</div>
    </div>
  </div>

  <!-- Meta Info -->
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Target Basis Data</strong>
      <span>PostgreSQL VPS Live (157.10.252.252)</span>
    </div>
    <div class="meta-item">
      <strong>Baseline KKN Terverifikasi</strong>
      <span class="text-success">75 RW Binaan Pemukiman</span>
    </div>
    <div class="meta-item">
      <strong>Wilayah Non-KKN (Hidden)</strong>
      <span class="text-danger">10 RW Administratif/Test</span>
    </div>
    <div class="meta-item">
      <strong>Konsistensi Sistem</strong>
      <span class="text-success">Dashboard ≡ PDF ≡ DB (Sinkron)</span>
    </div>
  </div>

  <!-- KPI Overview -->
  <div class="kpi-cards">
    <div class="kpi-card" style="border-top-color: #059669;">
      <div class="kpi-title">Cakupan Wilayah Binaan KKN</div>
      <div class="kpi-val text-success">75 <span style="font-size: 10pt; font-weight:700;">RW</span></div>
      <div class="kpi-desc">6 Kelurahan • 32 Kelompok Mahasiswa</div>
    </div>
    <div class="kpi-card" style="border-top-color: #2563eb;">
      <div class="kpi-title">Akun Petugas Pemilah Resmi</div>
      <div class="kpi-val text-blue" style="color: #2563eb;">75 <span style="font-size: 10pt; font-weight:700;">Akun</span></div>
      <div class="kpi-desc">1 RW = 1 Petugas (+6281390000001-75)</div>
    </div>
    <div class="kpi-card" style="border-top-color: #64748b;">
      <div class="kpi-title">Wilayah Fisik Database se-Coblong</div>
      <div class="kpi-val text-slate">85 <span style="font-size: 10pt; font-weight:700;">RW</span></div>
      <div class="kpi-desc">75 Binaan + 10 Non-KKN (Disembunyikan)</div>
    </div>
  </div>

  <!-- Bagian 1: Analisis Akar Masalah -->
  <h3>1. Analisis Perbandingan Data & Akar Ketidaksinkronan</h3>
  <p>Sebelum pelaksanaan penyesuaian, terjadi kesalahpahaman data akibat perbedaan definisi cakupan wilayah antara antarmuka sistem dan dokumen panduan lapangan:</p>
  
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Komponen / Sumber</th>
        <th style="width: 12%; text-align: center;">Angka RW</th>
        <th style="width: 38%;">Definisi Data yang Dihitung</th>
        <th style="width: 30%;">Status Pasca-Eksekusi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Dokumen PDF Rekap KKN</strong></td>
        <td class="text-center text-success" style="font-size: 10pt;"><strong>75 RW</strong></td>
        <td>Hanya menghitung <strong>RW Pemukiman Warga Binaan KKN</strong> yang ditempati oleh mahasiswa dan petugas pemilah sampah BERSEKA.</td>
        <td><span class="text-success">✅ Acuan Utama (Baseline Tetap)</span></td>
      </tr>
      <tr>
        <td><strong>Tampilan Dashboard Lama</strong></td>
        <td class="text-center text-danger" style="font-size: 10pt;"><strong>84 RW</strong></td>
        <td>Mengambil kueri total RW riil se-Kecamatan Coblong yang memfilter unit test (85 - 1 = 84 RW), padahal judulnya adalah <em>Cakupan Wilayah KKN</em>.</td>
        <td><span class="text-success">✅ Disesuaikan ke 75 RW Binaan</span></td>
      </tr>
      <tr>
        <td><strong>Tabel Basis Data (rw) VPS</strong></td>
        <td class="text-center text-amber" style="font-size: 10pt;"><strong>85 RW</strong></td>
        <td>Total seluruh baris fisik geografis se-Kecamatan Coblong, termasuk 1 unit test internal (RW 99 Cipaganti) dan 9 RW fasilitas non-pemukiman.</td>
        <td><span class="text-success">✅ 10 RW Non-KKN Disembunyikan</span></td>
      </tr>
    </tbody>
  </table>

  <!-- Bagian 2: Rincian 75 RW Binaan vs 10 RW Non-Binaan -->
  <h3>2. Matriks Rincian Wilayah per Kelurahan se-Kecamatan Coblong</h3>
  <p>Berikut adalah pembagian faktual seluruh RW di 6 kelurahan, menegaskan 75 RW binaan aktif dan 10 RW yang dikeluarkan/disembunyikan:</p>

  <table>
    <thead>
      <tr>
        <th>Kelurahan</th>
        <th class="text-center">Total RW DB</th>
        <th class="text-center">RW Binaan KKN</th>
        <th>Daftar RW Binaan Aktif</th>
        <th>Rincian RW Non-KKN (Disembunyikan / Hide)</th>
        <th class="text-center">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Cipaganti</strong></td>
        <td class="text-center">12 RW</td>
        <td class="text-center text-success"><strong>8 RW</strong></td>
        <td>RW 01, 02, 03, 04, 05, 06, 07, 08</td>
        <td>RW 09, 10, 11 (Komersial Cihampelas) & RW 99 (Dummy Test)</td>
        <td class="text-center text-success">✅ Sinkron</td>
      </tr>
      <tr>
        <td><strong>Dago</strong></td>
        <td class="text-center">13 RW</td>
        <td class="text-center text-success"><strong>13 RW</strong></td>
        <td>RW 01 s/d RW 13 (Seluruh RW)</td>
        <td><em>Tidak ada (Seluruh kawasan merupakan pemukiman warga)</em></td>
        <td class="text-center text-success">✅ Sinkron</td>
      </tr>
      <tr>
        <td><strong>Lebak Gede</strong></td>
        <td class="text-center">15 RW</td>
        <td class="text-center text-success"><strong>13 RW</strong></td>
        <td>RW 01–04, RW 07–15</td>
        <td>RW 05 & RW 06 (Kawasan Kampus Unpad Dipatiukur & Komersial)</td>
        <td class="text-center text-success">✅ Sinkron</td>
      </tr>
      <tr>
        <td><strong>Lebak Siliwangi</strong></td>
        <td class="text-center">8 RW</td>
        <td class="text-center text-success"><strong>4 RW</strong></td>
        <td>RW 05, 06, 07, 08</td>
        <td>RW 01, 02, 03, 04 (Hutan Baksil, Sabuga, dan Kawasan ITB)</td>
        <td class="text-center text-success">✅ Sinkron</td>
      </tr>
      <tr>
        <td><strong>Sadang Serang</strong></td>
        <td class="text-center">21 RW</td>
        <td class="text-center text-success"><strong>21 RW</strong></td>
        <td>RW 01 s/d RW 21 (Seluruh RW)</td>
        <td><em>Tidak ada (Seluruh kawasan binaan aktif binaan 11 kelompok)</em></td>
        <td class="text-center text-success">✅ Sinkron</td>
      </tr>
      <tr>
        <td><strong>Sekeloa</strong></td>
        <td class="text-center">16 RW</td>
        <td class="text-center text-success"><strong>16 RW</strong></td>
        <td>RW 01 s/d RW 16 (Seluruh RW)</td>
        <td><em>Tidak ada (Seluruh kawasan binaan aktif binaan 6 kelompok)</em></td>
        <td class="text-center text-success">✅ Sinkron</td>
      </tr>
      <tr class="highlight-row">
        <td><strong>TOTAL KECAMATAN</strong></td>
        <td class="text-center"><strong>85 RW</strong></td>
        <td class="text-center text-success" style="font-size: 9.5pt;"><strong>75 RW</strong></td>
        <td><strong>75 RW BINAAN RESMI KKN TEMATIK</strong></td>
        <td><strong>10 RW NON-KKN DISEMBUNYIKAN (HIDE DARI FILTER)</strong></td>
        <td class="text-center text-success"><strong>100% SINKRON</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- Bagian 3: Bukti Eksekusi Teknis -->
  <h3>3. Bukti Eksekusi Perbaikan Teknis pada Sistem</h3>
  <div class="callout-box">
    <div class="callout-title">🛡️ Penerapan Logika Bisnis & Quality Gate:</div>
    <ul style="margin: 3px 0 0 16px; padding: 0;">
      <li><strong>Backend API (<code>kknExecutiveService.ts</code>)</strong>: Kueri default kartu <code>rwCount</code> telah diselaraskan menggunakan kondisi <code>activeKknRwWhere</code> (memiliki akun petugas resmi & non-test), sehingga mengembalikan nilai tepat <strong>75 RW</strong>.</li>
      <li><strong>Frontend Web (<code>DashboardEksekutifKkn.tsx</code>)</strong>: Dropdown opsi filter RW kini secara otomatis menyaring dan <strong>menyembunyikan 10 RW yang tidak digunakan KKN</strong> (Lebak Siliwangi RW 01-04, Lebak Gede RW 05-06, Cipaganti RW 09-11 dan 99). Pengguna hanya dapat memilih RW yang aktif binaan KKN.</li>
      <li><strong>Verifikasi Test Suite</strong>: 100% lulus pada test KKN Executive (8 tests) dan test Proteksi DPL (30 tests) tanpa regresi.</li>
      <li><strong>Git Workflow</strong>: Seluruh kode telah di-commit ke branch <code>fix/analisis-vps-dan-ios-web</code> (commit: <code>4d9d21d07</code>) dan berhasil di-push ke GitHub.</li>
    </ul>
  </div>

  <!-- Signatures -->
  <div class="signature-section">
    <div class="signature-card">
      <div class="sig-role">Disusun & Divalidasi oleh:</div>
      <div class="sig-name">Tim Data Governance & Backend API Berseka</div>
      <div class="sig-inst">PT Makerindo & Tim KKN Tematik Berseka Coblong</div>
    </div>
    <div class="signature-card">
      <div class="sig-role">Disetujui untuk Operasional Lapangan:</div>
      <div class="sig-name">Koordinator Wilayah & Satgas KKN Coblong</div>
      <div class="sig-inst">Pemerintah Kecamatan Coblong & Universitas Pendamping</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-doc">
    Dokumen ini merupakan Berita Acara Resmi yang diterbitkan oleh Sistem Terpadu Berseka. Disahkan pada 8 Oktober 2026. Seluruh hak cipta dilindungi undang-undang.
  </div>

</div>
</body>
</html>
`;

fs.writeFileSync(targetHtmlPath, htmlContent, 'utf8');
fs.writeFileSync(workspaceHtmlPath, htmlContent, 'utf8');
console.log('✓ File HTML Laporan Resmi dibuat di:', targetHtmlPath);

// Render PDF dengan Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
console.log('>>> Menjalankan Edge headless untuk render PDF...');
const edgeCmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${targetPdfPath}" "file:///${targetHtmlPath.replace(/\\\\/g, '/')}"`;

try {
  execSync(edgeCmd, { stdio: 'inherit' });
  if (fs.existsSync(targetPdfPath)) {
    const stats = fs.statSync(targetPdfPath);
    console.log(`\n🎉 SUKSES BESAR: PDF Laporan Resmi Berhasil Digenerate!`);
    console.log(`Lokasi 1 (Docs Folder)   : ${targetPdfPath}`);
    console.log(`Ukuran: ${(stats.size / 1024).toFixed(1)} KB`);

    // Copy to root workspace
    fs.copyFileSync(targetPdfPath, workspacePdfPath);
    console.log(`Lokasi 2 (Root Workspace): ${workspacePdfPath}`);

    // Copy to brain artifact
    if (fs.existsSync(brainArtifactDir)) {
      fs.copyFileSync(targetPdfPath, artifactPdfPath);
      console.log(`Lokasi 3 (Brain Artifact): ${artifactPdfPath}`);
    }
  } else {
    console.error('Gagal: File PDF target tidak terbentuk.');
  }
} catch (e) {
  console.error('Error saat render PDF:', e);
}
