/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger printable A4 QR Code stickers / PDF export
 */

import toast from "react-hot-toast";

export interface QrStickerItem {
  id?: string;
  qrCode: string;
  category?: { name: string } | null;
  rtRw?: { name: string; kelurahan: { name: string } } | null;
  qrBatch?: { batchCode: string } | null;
  status?: string;
}

export const printQrStickers = (
  items: QrStickerItem[],
  title: string = "Master QR Code BERSEKA"
) => {
  if (!items || items.length === 0) {
    toast.error("Tidak ada data QR Code untuk dicetak.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Gagal membuka jendela cetak. Mohon izinkan pop-up di browser Anda.");
    return;
  }

  const cardsHtml = items
    .map((item) => {
      const catName = item.category?.name?.toUpperCase() || "UMUM";
      const isOrganik = catName.includes("ORGANIK") && !catName.includes("ANORGANIK");
      const isAnorganik = catName.includes("ANORGANIK");

      let themeColor = "#0f766e"; // teal default
      let bgLight = "#f0fdfa";
      let borderBadge = "#99f6e4";

      if (isOrganik) {
        themeColor = "#059669"; // emerald
        bgLight = "#ecfdf5";
        borderBadge = "#a7f3d0";
      } else if (isAnorganik) {
        themeColor = "#2563eb"; // blue
        bgLight = "#eff6ff";
        borderBadge = "#bfdbfe";
      }

      const wilayahStr = item.rtRw
        ? `${item.rtRw.name} - Kel. ${item.rtRw.kelurahan.name}`
        : "Wilayah Umum Coblong";

      const batchStr = item.qrBatch?.batchCode ? `Batch: ${item.qrBatch.batchCode}` : "";

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        item.qrCode
      )}`;

      return `
        <div class="qr-card" style="border-top: 5px solid ${themeColor};">
          <div class="card-header">
            <div class="brand-title">BERSEKA</div>
            <div class="brand-subtitle">Pilah Sampah Cerdas &bull; Coblong</div>
          </div>

          <div class="qr-image-box">
            <img src="${qrUrl}" alt="${item.qrCode}" class="qr-img" />
          </div>

          <div class="qr-code-text" style="color: ${themeColor};">${item.qrCode}</div>

          <div class="badge-category" style="background-color: ${bgLight}; color: ${themeColor}; border: 1px solid ${borderBadge};">
            ${catName}
          </div>

          <div class="card-meta">
            ${batchStr ? `<span class="meta-batch">${batchStr}</span>` : ""}
            <span class="meta-area">${wilayahStr}</span>
          </div>

          <div class="card-footer">
            Pindai dengan Aplikasi Mobile BERSEKA untuk Aktivasi
          </div>
        </div>
      `;
    })
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Siap Cetak / Simpan PDF</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .no-print {
          background: #0f172a;
          color: #ffffff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 999;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .no-print .info-text {
          font-size: 13px;
          font-weight: 600;
        }

        .no-print .info-sub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .no-print .btn-print {
          background: #059669;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .no-print .btn-print:hover {
          background: #047857;
        }

        .print-container {
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .qr-card {
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          background: #ffffff;
          padding: 10px 8px 8px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          page-break-inside: avoid;
          break-inside: avoid;
          min-height: 250px;
          position: relative;
        }

        .card-header {
          margin-bottom: 6px;
          line-height: 1.15;
        }

        .brand-title {
          font-size: 13px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.5px;
        }

        .brand-subtitle {
          font-size: 8px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .qr-image-box {
          background: #ffffff;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }

        .qr-img {
          width: 125px;
          height: 125px;
          display: block;
        }

        .qr-code-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .badge-category {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 2px 10px;
          border-radius: 9999px;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .card-meta {
          font-size: 8px;
          color: #475569;
          font-weight: 600;
          line-height: 1.25;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .meta-batch {
          font-weight: 700;
          color: #0f172a;
        }

        .card-footer {
          border-top: 1px dashed #e2e8f0;
          padding-top: 4px;
          font-size: 7px;
          color: #94a3b8;
          font-weight: 600;
          width: 100%;
          text-transform: uppercase;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
            background: #ffffff;
          }
          .print-container {
            padding: 0;
            gap: 10px;
          }
          .qr-card {
            border: 1.5px solid #94a3b8;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <div class="info-text">📄 Pratinjau Dokumen Cetak (${items.length} Stiker QR Code)</div>
          <div class="info-sub">Gunakan opsi "Save as PDF" / "Simpan sebagai PDF" pada dialog cetak browser untuk mengekspor ke berkas PDF.</div>
        </div>
        <button class="btn-print" onclick="window.print()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Cetak / Simpan PDF
        </button>
      </div>

      <div class="print-container">
        ${cardsHtml}
      </div>

      <script>
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
