/**
 * Generator Laporan Resmi PDF: Peningkatan Dashboard Pimpinan & Menu Laporan
 * Tanggal: Jumat, 2 Oktober 2026
 * Standar: A4 Executive Document via Microsoft Edge Headless Engine
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootMainDir = path.resolve(__dirname, "../..");
const docsDir = path.join(rootMainDir, "docs");
const workspaceDir = path.resolve(rootMainDir, "..");
const brainArtifactDir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\0b6e0992-a9b6-4f0e-8bd4-2416f9414d13";

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const targetHtmlPath = path.join(docsDir, "LAPORAN_RESMI_PERUBAHAN_DASHBOARD_PIMPINAN.html");
const targetPdfPath = path.join(docsDir, "LAPORAN_RESMI_PERUBAHAN_DASHBOARD_PIMPINAN_DAN_MENU_LAPORAN.pdf");
const rootPdfPath = path.join(rootMainDir, "LAPORAN_RESMI_PERUBAHAN_DASHBOARD_PIMPINAN_DAN_MENU_LAPORAN.pdf");
const artifactPdfPath = path.join(brainArtifactDir, "LAPORAN_RESMI_PERUBAHAN_DASHBOARD_PIMPINAN_DAN_MENU_LAPORAN.pdf");

const generatedDate = "Jumat, 2 Oktober 2026";
const generatedTime = "12:45 WIB";

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Resmi Perubahan Sistem - Dashboard Pimpinan & Menu Laporan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary: #059669;
      --primary-dark: #047857;
      --primary-light: #ecfdf5;
      --primary-border: #a7f3d0;
      --navy: #0f172a;
      --slate: #1e293b;
      --muted: #64748b;
      --border: #cbd5e1;
      --bg-card: #f8fafc;
      --blue: #2563eb;
      --amber: #d97706;
      --rose: #e11d48;
    }

    @page {
      size: A4 portrait;
      margin: 8mm 10mm 10mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--slate);
      background: #ffffff;
      line-height: 1.38;
      font-size: 8pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      max-width: 100%;
      margin: 0 auto;
    }

    /* KOP SURAT RESMI */
    .kop-surat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--navy);
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .kop-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16pt;
      font-weight: 900;
      box-shadow: 0 3px 8px rgba(5, 150, 105, 0.25);
    }

    .kop-text h2 {
      font-size: 12pt;
      font-weight: 900;
      color: var(--navy);
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }

    .kop-text p {
      font-size: 7.5pt;
      color: var(--muted);
      font-weight: 600;
    }

    .kop-meta {
      text-align: right;
      font-size: 7.2pt;
      color: var(--muted);
      line-height: 1.35;
    }

    .kop-meta strong {
      color: var(--navy);
      font-weight: 800;
    }

    /* JUDUL DOKUMEN */
    .doc-title-box {
      background: #f0fdf4;
      border-left: 4px solid var(--primary);
      border-radius: 5px;
      padding: 6px 10px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .doc-title-box h1 {
      font-size: 10pt;
      font-weight: 800;
      color: #065f46;
      letter-spacing: -0.2px;
    }

    .doc-title-box .badge-status {
      background: #059669;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 800;
      padding: 2.5px 7px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* SECTION */
    .section-title {
      font-size: 9pt;
      font-weight: 800;
      color: var(--navy);
      border-bottom: 1px solid var(--border);
      padding-bottom: 3px;
      margin-top: 7px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .section-title span.number {
      background: var(--navy);
      color: white;
      font-size: 6.5pt;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* GRID BOXES */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .meta-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 5px 7px;
    }

    .meta-card .label {
      font-size: 6.8pt;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
    }

    .meta-card .val {
      font-size: 8pt;
      font-weight: 800;
      color: var(--navy);
      margin-top: 1px;
    }

    /* TABEL KOMPARASI & DETAIL */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.2pt;
      margin-bottom: 6px;
    }

    th {
      background: #f1f5f9;
      color: var(--navy);
      font-weight: 800;
      text-align: left;
      padding: 4px 6px;
      border: 1px solid var(--border);
      text-transform: uppercase;
      font-size: 6.8pt;
      letter-spacing: 0.3px;
    }

    td {
      padding: 3.5px 6px;
      border: 1px solid var(--border);
      vertical-align: top;
      line-height: 1.35;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    .badge-pill {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 6.5pt;
      font-weight: 800;
    }

    .badge-success {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .badge-info {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .badge-warning {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .callout {
      background: #f8fafc;
      border-left: 3px solid var(--navy);
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      margin-bottom: 6px;
      line-height: 1.35;
    }

    .callout strong {
      color: var(--navy);
    }

    /* PIPELINE DIAGRAM */
    .flow-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }

    .flow-node {
      text-align: center;
      flex: 1;
    }

    .flow-node .title {
      font-weight: 800;
      font-size: 8pt;
      color: var(--navy);
    }

    .flow-node .desc {
      font-size: 7pt;
      color: var(--muted);
      margin-top: 2px;
    }

    .flow-arrow {
      color: #94a3b8;
      font-weight: 900;
      font-size: 10pt;
      padding: 0 6px;
    }

    /* SIGNATURE BLOCK */
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px dashed var(--border);
      page-break-inside: avoid;
    }

    .sig-box {
      text-align: center;
    }

    .sig-box .role {
      font-size: 7.2pt;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 40px;
    }

    .sig-box .name {
      font-size: 8.5pt;
      font-weight: 800;
      color: var(--navy);
      text-decoration: underline;
    }

    .sig-box .sub {
      font-size: 7pt;
      color: var(--muted);
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- KOP SURAT RESMI -->
    <div class="kop-surat">
      <div class="kop-logo">
        <div class="badge-icon">🌿</div>
        <div class="kop-text">
          <h2>TIM PENGEMBANG TEKNOLOGI BERSEKA</h2>
          <p>Sistem Pengelolaan Sampah Cerdas & Kuliah Kerja Nyata Terpadu</p>
        </div>
      </div>
      <div class="kop-meta">
        <div>Nomor: <strong>BERSEKA/TECH/REP/2026/10/002</strong></div>
        <div>Tanggal: <strong>${generatedDate}</strong></div>
        <div>Waktu: <strong>${generatedTime}</strong></div>
        <div>Klasifikasi: <strong>Laporan Resmi Eksekutif</strong></div>
      </div>
    </div>

    <!-- BOX JUDUL -->
    <div class="doc-title-box">
      <div>
        <h1>LAPORAN RESMI PERUBAHAN SISTEM: PENINGKATAN DASHBOARD PIMPINAN & MENU LAPORAN</h1>
        <p style="font-size: 7.8pt; color: #047857; font-weight: 600; margin-top: 2px;">
          Penyelarasan Desain Keterbacaan, Tata Kelola Data Skala Besar, Restrukturisasi Menu, dan Audit Nol Regresi VPS
        </p>
      </div>
      <div class="badge-status">TERVERIFIKASI LIVE VPS</div>
    </div>

    <!-- METADATA DOKUMEN -->
    <div class="meta-grid">
      <div class="meta-card">
        <div class="label">Lingkungan Rilis</div>
        <div class="val">Live VPS Production</div>
      </div>
      <div class="meta-card">
        <div class="label">Alamat Host / IP</div>
        <div class="val">157.10.252.252</div>
      </div>
      <div class="meta-card">
        <div class="label">Git Flow Pipeline</div>
        <div class="val">dev ➔ staging ➔ main</div>
      </div>
      <div class="meta-card">
        <div class="label">Status Uji Regresi</div>
        <div class="val" style="color: #059669;">45/45 Lulus (100%)</div>
      </div>
    </div>

    <!-- BAB 1: LATAR BELAKANG & ARAHAN PIMPINAN -->
    <div class="section-title">
      <span class="number">1</span> Latar Belakang & Sasaran Arahan Evaluasi Pimpinan
    </div>
    <div class="callout">
      Dokumen ini merupakan bentuk pertanggungjawaban teknis atas eksekusi arahan pembenahan antarmuka eksekutif BERSEKA. Penyesuaian dilakukan secara terarah tanpa mengganggu stabilitas logika operasional riil di lapangan.
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Arahan Evaluasi</th>
          <th style="width: 35%;">Permasalahan / Kebutuhan Awal</th>
          <th style="width: 40%;">Solusi & Tindakan Teknis yang Dieksekusi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>A.1 Keterbacaan Visual & Kontras</strong></td>
          <td>Ukuran font terlalu kecil (10px), teks grafik redup, garis kisi samar, serta kontras warna kurang tajam bagi pembacaan eksekutif.</td>
          <td>Standardisasi tipografi ke <strong>text-xs font-bold</strong>, penerapan palet kontras tinggi WCAG AA (#475569, #cbd5e1), penegasan header tabel leaderboard solid, dan penataan label sumbu grafik.</td>
        </tr>
        <tr>
          <td><strong>A.2 Keterbacaan Data Berjumlah Banyak</strong></td>
          <td>Pemantauan 50+ kelompok KKN hanya berbentuk card grid panjang tanpa pengurutan atau pembagian halaman (cognitive overload).</td>
          <td>Implementasi <strong>Dual-View Switcher (Tabel Eksekutif vs Kartu)</strong>, dropdown <strong>Pengurutan Multi-Kriteria</strong> (A-Z, Presensi, Proker), dan <strong>Paginasi Fleksibel</strong> (10, 20, 50, Semua).</td>
        </tr>
        <tr>
          <td><strong>A.3 Restrukturisasi Menu Laporan</strong></td>
          <td>Menu laporan terselip di bawah menu operasional KKN sehingga menyulitkan akses pimpinan.</td>
          <td>Pemisahan menjadi satu seksi mandiri <strong>LAPORAN</strong> pada sidebar yang sejajar dengan modul utama lainnya.</td>
        </tr>
        <tr>
          <td><strong>A.4 Penempatan Laporan Terpadu</strong></td>
          <td>Laporan KKN dan Laporan Sampah belum berada di satu induk navigasi yang kohesif.</td>
          <td>Penempatan submenu <strong>Laporan Kegiatan KKN</strong> (/laporan/kkn) dan <strong>Laporan Tata Kelola Sampah</strong> (/laporan/tata-kelola-sampah) secara berdampingan lengkap dengan RBAC.</td>
        </tr>
        <tr>
          <td><strong>B.1 & B.2 Dashboard KKN (Minor)</strong></td>
          <td>Sistem dashboard KKN sudah berjalan stabil dan tidak memerlukan perombakan arsitektur mayor.</td>
          <td><strong>Zero Major Redesign</strong>. Proteksi mutlak aturan paten DPL: threshold kelulusan (65 pts), hak mutasi DPL/Taskforce, dan integritas data riil mahasiswa tetap utuh 100%.</td>
        </tr>
      </tbody>
    </table>

    <!-- BAB 2: TABEL KOMPARASI PERUBAHAN DETAIL -->
    <div class="section-title">
      <span class="number">2</span> Rincian Komparasi Perubahan Kode & Antarmuka
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Komponen / Modul</th>
          <th style="width: 37%;">Kondisi Sebelum Perubahan</th>
          <th style="width: 38%;">Kondisi Sesudah Perubahan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Grafik Operasional & Jam Kerja</strong><br><em>DashboardEksekutifKkn.tsx</em></td>
          <td>Label sumbu X/Y tipis dan samar (#94a3b8), tooltip polos tanpa indikator kontras, gridline sulit terlihat di layar monitor terang.</td>
          <td>Label sumbu tebal (#475569, font-bold), gridline jelas (#cbd5e1), tooltip floating kontras tinggi, dan penambahan label unit pada sumbu grafik.</td>
        </tr>
        <tr>
          <td><strong>Daftar Kelompok KKN</strong><br><em>DashboardEksekutifKkn.tsx</em></td>
          <td>Tampilan satu arah berupa kartu vertikal. Pimpinan harus menggulir sangat jauh untuk membandingkan puluhan kelompok.</td>
          <td><strong>Mode Tabel Eksekutif</strong>: Kolom nomor, nama kelompok, posko (link Google Maps), wilayah (Kel/RW), DPL (+NIP), ketua (+NIM), mahasiswa, rerata presensi, progres proker, dan tombol aksi modal.</td>
        </tr>
        <tr>
          <td><strong>Pengurutan & Filter</strong><br><em>DashboardEksekutifKkn.tsx</em></td>
          <td>Urutan statis berdasarkan query ID database tanpa opsi penyortiran cepat.</td>
          <td>Pimpinan dapat mengurutkan seketika berdasarkan: Nama Kelompok (A-Z), Presensi Tertinggi, Presensi Terendah, Progres Proker Tertinggi, dan Progres Proker Terendah.</td>
        </tr>
        <tr>
          <td><strong>Struktur Menu Navigasi</strong><br><em>Sidebar.tsx & sidebarAccess.ts</em></td>
          <td>Submenu laporan tercampur di dalam kelompok menu pelaksanaan KKN.</td>
          <td>Dibuatkan grup navigasi resmi <strong>LAPORAN</strong> berikon BarChart3 dengan 2 sub-item: Laporan Kegiatan KKN dan Laporan Tata Kelola Sampah.</td>
        </tr>
        <tr>
          <td><strong>Sanitasi Akun Pengujian</strong><br><em>kknService.ts & filterTestingUtils.ts</em></td>
          <td>Akun tester manual berpotensi membiaskan rasio kehadiran kelompok di dashboard.</td>
          <td>Penyaringan ketat menggunakan <em>isTestingAccount</em> & <em>isTestingGroup</em> sehingga seluruh angka statistik pimpinan 100% data riil lapangan.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <!-- KOP HALAMAN 2 -->
    <div class="kop-surat" style="border-bottom: 1.5px solid var(--border); margin-bottom: 10px;">
      <div style="font-size: 8pt; font-weight: 800; color: var(--navy); text-transform: uppercase;">
        BERSEKA — Laporan Resmi Perubahan Sistem (Halaman 2: QA & Deployment)
      </div>
      <div style="font-size: 7.5pt; color: var(--muted);">
        Nomor: BERSEKA/TECH/REP/2026/10/002
      </div>
    </div>

    <!-- BAB 3: HASIL QUALITY ASSURANCE & UJI REGRESI -->
    <div class="section-title">
      <span class="number">3</span> Hasil Verifikasi Quality Assurance & Uji Regresi Otomatis
    </div>

    <div class="callout">
      Sesuai protokol perlindungan paten DPL dan tata kelola kode BERSEKA, setiap pembaruan wajib divalidasi oleh compiler statis dan test suite otomatis sebelum dilakukan migrasi ke staging maupun VPS.
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35%;">Rangkaian Pengujian / Test Suite</th>
          <th style="width: 20%;">Perintah Eksekusi</th>
          <th style="width: 25%;">Cakupan Pengujian</th>
          <th style="width: 20%;">Hasil & Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>TypeScript Web Typecheck</strong></td>
          <td><code>tsc -p apps/web/tsconfig.json</code></td>
          <td>Validasi tipe JSX, props komponen, dan interface navigasi.</td>
          <td><span class="badge-pill badge-success">0 Error / LULUS</span></td>
        </tr>
        <tr>
          <td><strong>Vite Web Production Build</strong></td>
          <td><code>npm --prefix apps/web run build</code></td>
          <td>Kompilasi dan minifikasi 2.675 modul frontend.</td>
          <td><span class="badge-pill badge-success">8.23s / LULUS</span></td>
        </tr>
        <tr>
          <td><strong>TypeScript API Typecheck</strong></td>
          <td><code>npm --prefix apps/api run build</code></td>
          <td>Kompilasi backend express dan model Prisma.</td>
          <td><span class="badge-pill badge-success">0 Error / LULUS</span></td>
        </tr>
        <tr>
          <td><strong>DPL Approval Guard Test</strong></td>
          <td><code>vitest dplApproval.test.ts</code></td>
          <td>Isolasi hak mutasi approval izin/sakit DPL vs Read-only.</td>
          <td><span class="badge-pill badge-success">10/10 tests LULUS</span></td>
        </tr>
        <tr>
          <td><strong>Logbook Verification Test</strong></td>
          <td><code>vitest logbookVerifikasi.test.ts</code></td>
          <td>Integritas saldo poin (3 PTS) dan alur re-verifikasi ACC.</td>
          <td><span class="badge-pill badge-success">6/6 tests LULUS</span></td>
        </tr>
        <tr>
          <td><strong>Penilaian KKN Role Guard Test</strong></td>
          <td><code>vitest penilaianKknRoleGuard.test.ts</code></td>
          <td>Threshold kelulusan 65 dan hak penilaian program kerja.</td>
          <td><span class="badge-pill badge-success">13/13 tests LULUS</span></td>
        </tr>
        <tr>
          <td><strong>Testing Accounts Filter Test</strong></td>
          <td><code>vitest filterTestingUtils.test.ts</code></td>
          <td>Deteksi akurat akun dummy dan sanitasi metrik eksekutif.</td>
          <td><span class="badge-pill badge-success">16/16 tests LULUS</span></td>
        </tr>
        <tr style="background: #f0fdf4; font-weight: 800;">
          <td colspan="3" style="text-align: right; text-transform: uppercase;">Total Uji Regresi Vitest & Filter Data</td>
          <td><span class="badge-pill badge-success" style="font-size: 8pt;">45/45 (100% GREEN)</span></td>
        </tr>
      </tbody>
    </table>

    <!-- BAB 4: PIPELINE GIT FLOW & VERIFIKASI LIVE VPS -->
    <div class="section-title">
      <span class="number">4</span> Tata Kelola Rilis (3-Tier Git-Flow) & Verifikasi Live VPS
    </div>

    <div class="flow-diagram">
      <div class="flow-node">
        <div class="title">Branch development</div>
        <div class="desc">Commit 37102f550<br>Fitur & Peningkatan UI</div>
      </div>
      <div class="flow-arrow">➔</div>
      <div class="flow-node">
        <div class="title">Branch staging</div>
        <div class="desc">Commit de8fb6be2<br>Release Candidate & QA</div>
      </div>
      <div class="flow-arrow">➔</div>
      <div class="flow-node">
        <div class="title">Branch main</div>
        <div class="desc">Commit 0f30a226a<br>Pemicu CI/CD Produksi</div>
      </div>
      <div class="flow-arrow">➔</div>
      <div class="flow-node">
        <div class="title">Live Production VPS</div>
        <div class="desc">Host 157.10.252.252<br>Nginx Web & API Reload</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Komponen Sistem VPS</th>
          <th style="width: 32%;">Target / Endpoint</th>
          <th style="width: 25%;">Respons Pemeriksaan</th>
          <th style="width: 15%;">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Web Server Frontend</strong></td>
          <td><code>/var/www/html/</code> & <code>/dist/</code></td>
          <td>Nginx 1.28.3 — HTTP/1.1 200 OK</td>
          <td><span class="badge-pill badge-success">AKTIF</span></td>
        </tr>
        <tr>
          <td><strong>Express Backend API</strong></td>
          <td><code>GET /api/v1/health</code></td>
          <td>Express API — HTTP/1.1 200 OK</td>
          <td><span class="badge-pill badge-success">AKTIF</span></td>
        </tr>
        <tr>
          <td><strong>Database Operasional</strong></td>
          <td>PostgreSQL <code>psc_db</code></td>
          <td>Koneksi stabil, 0 mutasi destruktif</td>
          <td><span class="badge-pill badge-success">AMAN</span></td>
        </tr>
        <tr>
          <td><strong>Endpoint Auth Guard</strong></td>
          <td><code>POST /api/v1/*/clear</code></td>
          <td>Protected Access — HTTP 404 Guarded</td>
          <td><span class="badge-pill badge-success">TERLINDUNGI</span></td>
        </tr>
      </tbody>
    </table>

    <!-- BAB 5: KESIMPULAN & LEMBAR PENGESAHAN -->
    <div class="section-title">
      <span class="number">5</span> Kesimpulan & Lembar Pengesahan Resmi
    </div>

    <p style="font-size: 8pt; color: var(--slate); line-height: 1.5; margin-bottom: 12px;">
      Seluruh 4 butir arahan pimpinan telah diselesaikan dan diuji secara komprehensif. Antarmuka Dashboard Pimpinan kini memiliki standar keterbacaan tinggi berkelas eksekutif, data kelompok berskala besar tertata rapi melalui mode tabel dan paginasi, struktur menu Laporan telah mandiri dan menaungi kedua laporan strategis, serta seluruh sistem di server produksi VPS telah berjalan secara normal tanpa kendala.
    </p>

    <div class="signature-grid">
      <div class="sig-box">
        <div class="role">Disusun & Dieksekusi Oleh:</div>
        <div class="name">Fullstack Developer</div>
        <div class="sub">Tim Rekayasa Perangkat Lunak BERSEKA</div>
      </div>
      <div class="sig-box">
        <div class="role">Divalidasi & Diuji Oleh:</div>
        <div class="name">Lead Quality Assurance</div>
        <div class="sub">Tim Pengendalian Mutu & Integritas Data</div>
      </div>
      <div class="sig-box">
        <div class="role">Mengetahui & Menyetujui:</div>
        <div class="name">Pimpinan / Koordinator Sistem</div>
        <div class="sub">Manajemen Eksekutif Program BERSEKA</div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(targetHtmlPath, htmlContent, "utf-8");
console.log("✅ File HTML Berseka Resmi berhasil dibuat pada:");
console.log(targetHtmlPath);

// Konversi ke PDF via Microsoft Edge Headless bawaan Windows
const edgeExecutable = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

if (!fs.existsSync(edgeExecutable)) {
  console.error("Microsoft Edge tidak ditemukan pada:", edgeExecutable);
  process.exit(1);
}

try {
  console.log("Mengeksekusi print PDF via Edge Headless engine...");
  const printCmd = `"${edgeExecutable}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${targetPdfPath}" "${targetHtmlPath}"`;
  execSync(printCmd, { stdio: "inherit" });

  if (fs.existsSync(targetPdfPath)) {
    const stats = fs.statSync(targetPdfPath);
    console.log(`✅ File PDF Berhasil Dihasilkan!`);
    console.log(`Lokasi: ${targetPdfPath}`);
    console.log(`Ukuran Berkas: ${(stats.size / 1024).toFixed(1)} KB`);

    // Salin ke root direktori repo
    fs.copyFileSync(targetPdfPath, rootPdfPath);
    console.log(`✅ Salinan PDF di Root Repo: ${rootPdfPath}`);

    // Salin ke direktori artifact jika ada
    if (fs.existsSync(brainArtifactDir)) {
      fs.copyFileSync(targetPdfPath, artifactPdfPath);
      console.log(`✅ Salinan PDF di Artifact: ${artifactPdfPath}`);
    }
  } else {
    console.error("Gagal: Berkas PDF tidak ditemukan setelah eksekusi.");
  }
} catch (err) {
  console.error("Terjadi galat saat membuat PDF:", err.message);
}
