/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger PDF print/download of Buku Panduan TrashCare
 */

export const downloadPanduanPdf = () => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Gagal membuka jendela cetak. Mohon izinkan popup di browser Anda.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Buku Panduan Lengkap Operasional Ekosistem TrashCare - Kecamatan Coblong</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          background: #fff;
          font-size: 11pt;
        }

        code {
          background: #f1f5f9;
          color: #047857;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 8.5pt;
          font-weight: 700;
        }

        .header-cover {
          border-bottom: 3px solid #059669;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-title h1 {
          margin: 0;
          font-size: 20pt;
          font-weight: 800;
          color: #059669;
          letter-spacing: -0.5px;
        }

        .logo-title p {
          margin: 4px 0 0 0;
          font-size: 10pt;
          color: #475569;
          font-weight: 600;
        }

        .badge-doc {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 8pt;
          font-weight: 700;
          text-transform: uppercase;
        }

        .section-box {
          margin-bottom: 22px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 13pt;
          font-weight: 800;
          color: #0f172a;
          border-left: 4px solid #059669;
          padding-left: 10px;
          margin-bottom: 10px;
        }

        .flow-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .flow-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .flow-card-num {
          font-size: 8pt;
          font-weight: 800;
          color: #059669;
          text-transform: uppercase;
        }

        .flow-card-title {
          font-size: 10pt;
          font-weight: 700;
          color: #0f172a;
          margin: 2px 0 4px 0;
        }

        .flow-card-desc {
          font-size: 8.5pt;
          color: #475569;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 9pt;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 700;
        }

        ul {
          margin: 4px 0;
          padding-left: 18px;
        }

        li {
          margin-bottom: 3px;
        }

        .note-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 8.5pt;
          color: #1e40af;
          margin-top: 15px;
        }

        .footer {
          margin-top: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          text-align: center;
          font-size: 8pt;
          color: #94a3b8;
        }

        @media print {
          .no-print {
            display: none;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>

      <div class="no-print" style="background: #0f172a; color: white; padding: 12px 20px; text-align: center; font-weight: 700; position: sticky; top: 0; z-index: 100; font-family: sans-serif;">
        <span>Dokumen Buku Panduan PDF Siap Dicetak.</span>
        <button onclick="window.print()" style="margin-left: 15px; background: #10b981; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">
          🖨️ Cetak / Simpan sebagai PDF
        </button>
      </div>

      <div style="padding: 20px;">
        <!-- Header -->
        <div class="header-cover">
          <div class="logo-title">
            <h1>TrashCare Coblong</h1>
            <p>Buku Panduan Operasional &amp; Tata Kelola Sampah Terintegrasi</p>
          </div>
          <div>
            <span class="badge-doc">Dokumen Resmi • 2026</span>
          </div>
        </div>

        <!-- Section 1: Ringkasan & Prinsip Utama -->
        <div class="section-box">
          <div class="section-title">1. Prinsip Utama &amp; Ketentuan Ekosistem</div>
          <p style="font-size: 9.5pt; color: #334155;">
            Sistem TrashCare menerapkan tata kelola sampah pintar berbasis partisipasi masyarakat di Kecamatan Coblong, Kota Bandung. Sistem berjalan tanpa NIK, menggunakan autentikasi WhatsApp (+62), serta transparansi ledger poin atomik.
          </p>
          <ul>
            <li><strong>Tempat Sampah Mandiri:</strong> Maksimal 2 Tempat Sampah per rumah tangga (1 Tempat Sampah Organik &amp; 1 Tempat Sampah Anorganik). Masa aktif 30 hari.</li>
            <li><strong>Jam Operasional Penjemputan:</strong> Pukul 06:00–08:00 WIB dan 16:00–18:00 WIB oleh Petugas Residu Hilir.</li>
            <li><strong>Penimbangan Hilir:</strong> Timbangan diinput secara manual dari hasil timbangan industri fisik oleh Petugas Residu.</li>
            <li><strong>Gamifikasi Poin:</strong> Penambahan poin atomik ke ledger Warga (+10 poin) &amp; Mahasiswa (+10 poin) saat registrasi disetujui RW (<code>ACTIVE_BOUND</code>).</li>
          </ul>
        </div>

        <!-- Section 2: Alur 6 Tahap Hulu ke Hilir -->
        <div class="section-box">
          <div class="section-title">2. Alur Operasional 6 Tahap (Hulu ke Hilir)</div>
          <div class="flow-grid">
            <div class="flow-card">
              <div class="flow-card-num">Tahap 01</div>
              <div class="flow-card-title">Aktivasi &amp; Scan QR Tempat Sampah</div>
              <div class="flow-card-desc">Mahasiswa KKN memindai QR master (<code>DIPEGANG_MAHASISWA</code>), merekam koordinat GPS lokasi fisik gawai, dan mengaitkan akun Warga (+62 WA OTP).</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Tahap 02</div>
              <div class="flow-card-title">Pemilahan Mandiri Warga</div>
              <div class="flow-card-desc">Warga memilah sampah Organik &amp; Anorganik di rumah. Saat tempat sampah penuh, warga mengunggah foto setoran via aplikasi.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Tahap 03</div>
              <div class="flow-card-title">Penjemputan Window Berjadwal</div>
              <div class="flow-card-desc">Petugas mengangkut sampah pada window operasional jam 06:00–08:00 &amp; 16:00–18:00 WIB dengan sistem eskalasi otomatis.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Tahap 04</div>
              <div class="flow-card-title">Penimbangan Fisik &amp; Scan Kode QR</div>
              <div class="flow-card-desc">Petugas memindai kode QR Tempat Sampah di lokasi dan memasukkan angka hasil timbangan fisik industri secara manual.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Tahap 05</div>
              <div class="flow-card-title">Verifikasi RW &amp; Poin Ledger</div>
              <div class="flow-card-desc">Pengurus RW memverifikasi setoran. Poin insentif atomik bertambah ke akun Warga &amp; Mahasiswa di skema ledger terpisah.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Tahap 06</div>
              <div class="flow-card-title">Monitoring Visual &amp; GIS Hilir</div>
              <div class="flow-card-desc">Admin DLH, Camat, &amp; Lurah memantau dashboard Read-Only. Sampah terkelola disalurkan ke Loseda, Bata Terawang, BSF, &amp; Bank Sampah.</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Detail Panduan Per Peran -->
        <div class="section-box">
          <div class="section-title">3. Panduan Detail Spesifik Per Role</div>
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Peran / Role</th>
                <th style="width: 25%;">Metode Akses &amp; Auth</th>
                <th>Tanggung Jawab &amp; Fitur Utama</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Warga (Household)</strong></td>
                <td>Nomor WhatsApp (+62) OTP<br><em>(Tanpa NIK)</em></td>
                <td>
                  • Memiliki maksimal 2 Tempat Sampah (Organik &amp; Anorganik).<br>
                  • Mengunggah bukti foto setoran sampah saat penuh.<br>
                  • Memantau masa aktif tempat sampah (30 hari) &amp; perolehan poin ledger.<br>
                  • Mengirimkan ide daur ulang kreatif untuk klaim reward +50 poin.
                </td>
              </tr>
              <tr>
                <td><strong>Mahasiswa KKN</strong></td>
                <td>NIM + Email Mahasiswa</td>
                <td>
                  • Memindai QR awal (<code>PRINTED</code> &rarr; <code>DIPEGANG_MAHASISWA</code>).<br>
                  • Merekam koordinat GPS gawai lokasi fisik tempat sampah warga.<br>
                  • Mendapatkan insentif +10 poin saat pendaftaran disetujui RW.<br>
                  • Mencatat riwayat serah terima (handover) wilayah dampingan.
                </td>
              </tr>
              <tr>
                <td><strong>Pengurus RW / RT</strong></td>
                <td>Email &amp; Password Pengurus</td>
                <td>
                  • Verifikasi pendaftaran tempat sampah (<code>PENDING_APPROVAL</code> &rarr; <code>ACTIVE_BOUND</code>).<br>
                  • Menandai Tempat Sampah Rusak (<code>BROKEN</code>) untuk penonaktifan QR.<br>
                  • Memvalidasi setoran sampah harian &amp; menyetujui poin.<br>
                  • Input data &amp; hasil panen fasilitas GIS (Loseda, BSF, Bank Sampah).
                </td>
              </tr>
              <tr>
                <td><strong>Petugas Residu</strong></td>
                <td>Email &amp; Password Petugas</td>
                <td>
                  • Standby penjemputan pada window jam 06-08 &amp; 16-18 WIB.<br>
                  • Memindai QR Code Tempat Sampah warga saat tiba di lokasi.<br>
                  • Menginput angka hasil timbangan fisik industri secara manual.<br>
                  • Dievaluasi melalui KPI Petugas (Ketepatan Waktu + Akurasi AI).
                </td>
              </tr>
              <tr>
                <td><strong>Admin DLH, Camat &amp; Lurah</strong></td>
                <td>NIP + Email Terotorisasi<br><em>(Read-Only Guard)</em></td>
                <td>
                  • Akses Read-Only pada Executive Monitoring Dashboard.<br>
                  • Data Scoping: DLH (Kota), Camat (Kecamatan), Lurah (Kelurahan).<br>
                  • Evaluasi diskrepansi AI confidence (&gt;90%) khusus Admin DLH.<br>
                  • Memantau indikator kepatuhan &amp; reliabilitas wilayah (Median).
                </td>
              </tr>
              <tr>
                <td><strong>DPL (Dosen Pembimbing)</strong></td>
                <td>NIP + Email DPL</td>
                <td>
                  • Memantau progres pendampingan kelompok mahasiswa KKN di lapangan.<br>
                  • Memeriksa absensi &amp; logbook kegiatan harian mahasiswa.
                </td>
              </tr>
              <tr>
                <td><strong>Super Admin</strong></td>
                <td>Kredensial Super Admin</td>
                <td>
                  • Menggenerasi dan mencetak Master QR Code Tempat Sampah (<code>PRINTED</code>).<br>
                  • Mengelola <code>system_configs</code>, audit trail ledger, &amp; hak akses pengguna.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="note-box">
          📌 <strong>Catatan Pengembang:</strong> Buku Panduan ini diterbitkan secara resmi oleh PT Makerindo dan UNIKOM untuk operasional kebersihan Kecamatan Coblong, Kota Bandung (2026). Seluruh hak cipta dilindungi.
        </div>

        <div class="footer">
          TrashCare Ecosystem • Kecamatan Coblong, Kota Bandung • Halaman 1 dari 1
        </div>
      </div>

      <script>
        // Auto trigger print prompt after render
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 600);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
