/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger PDF print/download of Buku Panduan TrashCare
 */

import toast from "react-hot-toast";

export const downloadPanduanPdf = () => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Gagal membuka jendela dokumen. Mohon izinkan popup di browser Anda.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Buku Panduan Operasional Ekosistem TrashCare - Kecamatan Coblong</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-size: 10pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        code {
          background: #f1f5f9;
          color: #047857;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 8.5pt;
          font-weight: 700;
          border: 1px solid #e2e8f0;
        }

        .header-cover {
          border-bottom: 2.5px solid #059669;
          padding-bottom: 14px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .logo-title h1 {
          font-size: 24pt;
          font-weight: 900;
          margin: 0;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .logo-title h1 span.highlight {
          color: #059669;
        }

        .logo-title p {
          margin: 3px 0 0 0;
          color: #64748b;
          font-size: 9pt;
          font-weight: 600;
        }

        .badge-doc {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 8pt;
          text-transform: uppercase;
        }

        .section-box {
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          background: #ffffff;
        }

        .section-title {
          font-size: 11pt;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 5px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .step-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 9pt;
        }

        .step-num {
          background: #059669;
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7.5pt;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .rule-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 6px;
        }

        .rule-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          background: #f8fafc;
        }

        .rule-card strong {
          display: block;
          font-size: 8.5pt;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .rule-card span {
          font-size: 8pt;
          color: #475569;
        }

        .role-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          margin-top: 6px;
        }

        .role-table th {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 5px 8px;
          text-align: left;
          font-weight: 700;
          color: #334155;
        }

        .role-table td {
          border: 1px solid #e2e8f0;
          padding: 5px 8px;
          color: #334155;
        }

        .note-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 8pt;
          color: #1e40af;
          margin-top: 10px;
        }

        .footer {
          text-align: center;
          font-size: 7.5pt;
          color: #94a3b8;
          margin-top: 14px;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
          }
          .section-box {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>

      <div class="no-print" style="background: #0f172a; color: white; padding: 12px 20px; text-align: center; font-weight: 700; position: sticky; top: 0; z-index: 100; font-family: sans-serif;">
        <span>Dokumen Buku Panduan PDF Siap Diekspor.</span>
        <button onclick="window.print()" style="margin-left: 15px; background: #059669; color: white; border: none; padding: 7px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 9pt;">
          Simpan / Unduh PDF
        </button>
      </div>

      <div style="padding: 10px 5px;">
        <!-- Header -->
        <div class="header-cover">
          <div class="logo-title">
            <h1>Trash<span class="highlight">Care</span></h1>
            <p>Buku Panduan Operasional &amp; Tata Kelola Pemilahan Sampah Terintegrasi</p>
          </div>
          <div style="text-align: right;">
            <span class="badge-doc">Kecamatan Coblong • 2026</span>
          </div>
        </div>

        <!-- Section 1: Ringkasan & Prinsip Utama -->
        <div class="section-box">
          <div class="section-title">1. Ketentuan Utama Ekosistem</div>
          <p style="font-size: 9pt; color: #334155; margin-top: 4px;">
            TrashCare menghadirkan ekosistem tata kelola sampah berbasis geolokasi dan akuntabilitas data di Kecamatan Coblong, Kota Bandung.
          </p>
          <ul style="font-size: 8.5pt;">
            <li><strong>Autentikasi Akun Warga:</strong> Menggunakan Nomor WhatsApp (+62) dengan verifikasi Kode OTP tanpa penggunaan NIK.</li>
            <li><strong>Digitalisasi Tempat Sampah:</strong> Maksimal 2 Tempat Sampah berlabel QR per rumah tangga (1 Tempat Sampah Organik &amp; 1 Tempat Sampah Anorganik). Sampah residu dipisahkan dan ditimbang di hilir. Masa aktif 30 hari.</li>
            <li><strong>Jam Penjemputan Berjadwal:</strong> Dilakukan pada window waktu 06:00–08:00 WIB dan 16:00–18:00 WIB oleh Petugas Residu.</li>
            <li><strong>Pencatatan Poin Terpisah:</strong> Skema ledger terpisah (Ledger Isolation) menjamin transparansi audit insentif Warga dan Mahasiswa KKN secara atomik.</li>
          </ul>
        </div>

        <!-- Section 2: Alur 6 Tahap Hulu ke Hilir -->
        <div class="section-box">
          <div class="section-title">2. Tahapan Alur Kerja Operasional</div>
          <div class="flow-grid">
            <div class="flow-card">
              <div class="flow-card-num">Langkah 01</div>
              <div class="flow-card-title">Registrasi &amp; Scanning QR</div>
              <div class="flow-card-desc">Mahasiswa KKN memindai QR Code, mengunci koordinat GPS lokasi fisik tempat sampah, dan mendaftarkan akun Warga.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Langkah 02</div>
              <div class="flow-card-title">Pemilahan Mandiri &amp; Laporan</div>
              <div class="flow-card-desc">Warga memilah sampah Organik &amp; Anorganik di rumah tangga, lalu mengunggah bukti foto setoran saat tempat sampah penuh.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Langkah 03</div>
              <div class="flow-card-title">Pengangkutan Berjadwal</div>
              <div class="flow-card-desc">Petugas mengangkut sampah pada window operasional jam 06:00–08:00 &amp; 16:00–18:00 WIB dengan sistem eskalasi otomatis.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Langkah 04</div>
              <div class="flow-card-title">Penimbangan Fisik &amp; Scan Kode QR</div>
              <div class="flow-card-desc">Petugas memindai QR Code Tempat Sampah di lokasi dan memasukkan angka hasil timbangan fisik industri secara manual.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Langkah 05</div>
              <div class="flow-card-title">Persetujuan RW &amp; Poin Ledger</div>
              <div class="flow-card-desc">Pengurus RW memverifikasi setoran. Poin insentif atomik bertambah ke ledger terpisah milik Warga &amp; Mahasiswa KKN.</div>
            </div>
            <div class="flow-card">
              <div class="flow-card-num">Langkah 06</div>
              <div class="flow-card-title">Monitoring Visual &amp; Fasilitas GIS</div>
              <div class="flow-card-desc">Admin DLH, Camat, &amp; Lurah memantau dashboard Read-Only. Sampah terolah disalurkan ke Loseda, BSF, &amp; Bank Sampah.</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Detail Panduan Per Peran -->
        <div class="section-box">
          <div class="section-title">3. Panduan Penggunaan Berdasarkan Peran</div>
          <table>
            <thead>
              <tr>
                <th style="width: 22%;">Peran / Role</th>
                <th style="width: 23%;">Metode Otentikasi</th>
                <th>Tanggung Jawab Utama</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Warga (Household)</strong></td>
                <td>Nomor WhatsApp (+62) OTP<br><em>(Tanpa NIK)</em></td>
                <td>
                  • Memiliki maksimal 2 Tempat Sampah berlabel QR.<br>
                  • Mengunggah bukti foto setoran sampah saat tempat sampah penuh.<br>
                  • Memantau masa aktif 30 hari &amp; perolehan poin ledger.<br>
                  • Mengirimkan ide daur ulang kreatif untuk klaim reward +50 poin.
                </td>
              </tr>
              <tr>
                <td><strong>Mahasiswa KKN</strong></td>
                <td>NIM + Email Mahasiswa</td>
                <td>
                  • Memindai QR awal (<code>PRINTED</code> &rarr; <code>DIPEGANG_MAHASISWA</code>).<br>
                  • Merekam koordinat GPS gawai lokasi fisik tempat sampah warga.<br>
                  • Memperoleh insentif +10 poin saat pendaftaran disetujui RW.<br>
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
                  • Evaluasi kinerja melalui KPI Petugas (Ketepatan Waktu + Akurasi AI).
                </td>
              </tr>
              <tr>
                <td><strong>Admin DLH, Camat &amp; Lurah</strong></td>
                <td>NIP + Email Terotorisasi<br><em>(Read-Only Guard)</em></td>
                <td>
                  • Akses Read-Only pada Dashboard Pemantauan Executive.<br>
                  • Data Scoping Wilayah: DLH (Kota), Camat (Kecamatan), Lurah (Kelurahan).<br>
                  • Evaluasi diskrepansi AI confidence (&gt;90%) khusus Admin DLH.<br>
                  • Memantau indikator kepatuhan &amp; reliabilitas wilayah (Median).
                </td>
              </tr>
              <tr>
                <td><strong>DPL (Dosen Pendamping Lapangan)</strong></td>
                <td>NIP + Email DPL</td>
                <td>
                  • Memantau progres pendampingan kelompok mahasiswa KKN di lapangan.<br>
                  • Memeriksa absensi &amp; logbook kegiatan harian mahasiswa.
                </td>
              </tr>
              <tr>
                <td><strong>SUPER USER</strong></td>
                <td>Kredensial SUPER USER</td>
                <td>
                  • Menggenerasi dan mengelola Master QR Code Tempat Sampah (<code>PRINTED</code>).<br>
                  • Mengelola <code>system_configs</code>, audit trail ledger, &amp; hak akses pengguna.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="note-box">
          📌 <strong>Catatan Resmi:</strong> Buku Panduan ini diterbitkan oleh Tim KKN Berdampak UNIKOM dan Pengembang Sistem untuk operasional tata kelola sampah di Kecamatan Coblong, Kota Bandung. Hubungi <code>kknberdampak@unikom.ac.id</code> untuk informasi lebih lanjut.
        </div>

        <div class="footer">
          TrashCare Ecosystem • KKN Berdampak UNIKOM • Kecamatan Coblong, Kota Bandung (2026)
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
