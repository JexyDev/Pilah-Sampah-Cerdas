/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger printable 10 x 15 cm QR Code stickers / PDF export
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
  title: string = "Stiker QR Code BERSEKA"
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
      const catName = item.category?.name?.toUpperCase() || "";
      const isAnorganik =
        catName.includes("ANORGANIK") ||
        catName.includes("NON_ORGANIC") ||
        catName.includes("ANORG") ||
        catName.includes("AGN") ||
        item.qrCode.toUpperCase().includes("-AGN-");

      const isOrganik =
        !isAnorganik &&
        (catName.includes("ORGANIK") ||
          catName.includes("ORGANIC") ||
          catName.includes("OGN") ||
          item.qrCode.toUpperCase().includes("-OGN-") ||
          catName === "");

      // Tema Warna: Organik = Hijau, Anorganik = Kuning/Amber
      let primaryColor = "#16a34a"; // Hijau Organik
      let darkColor = "#15803d";
      let bgCard = "#f0fdf4";
      let badgeBg = "#16a34a";
      let badgeText = "#ffffff";
      let borderBadge = "#22c55e";
      let labelCategory = "SAMPAH ORGANIK";
      let subCategoryText = "Sisa Makanan • Dedaunan • Organik";

      if (isAnorganik) {
        primaryColor = "#d97706"; // Kuning / Amber Anorganik
        darkColor = "#b45309";
        bgCard = "#fefce8";
        badgeBg = "#eab308";
        badgeText = "#78350f";
        borderBadge = "#facc15";
        labelCategory = "SAMPAH ANORGANIK";
        subCategoryText = "Plastik • Kertas • Kardus • Logam";
      } else if (!isOrganik) {
        primaryColor = "#475569";
        darkColor = "#334155";
        bgCard = "#f8fafc";
        badgeBg = "#475569";
        badgeText = "#ffffff";
        borderBadge = "#64748b";
        labelCategory = "TEMPAT SAMPAH";
        subCategoryText = "Pilah Sampah Sesuai Kategori";
      }

      const wilayahStr = item.rtRw
        ? `${item.rtRw.name} • Kel. ${item.rtRw.kelurahan.name}`
        : "Wilayah Dampingan BERSEKA";

      const batchStr = item.qrBatch?.batchCode ? `Batch: ${item.qrBatch.batchCode}` : "";

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        item.qrCode
      )}`;

      return `
        <div class="sticker-wrapper">
          <div class="qr-card" style="border: 3px solid ${primaryColor}; background: linear-gradient(180deg, #ffffff 0%, ${bgCard} 100%);">
            
            <!-- Top Header Accent -->
            <div class="header-band" style="background-color: ${primaryColor};">
              <div class="band-title">BERSEKA</div>
              <div class="band-subtitle">TEMPAT SAMPAH PINTAR</div>
            </div>

            <!-- Category Ribbon -->
            <div class="category-ribbon" style="background-color: ${badgeBg}; color: ${badgeText}; border: 1.5px solid ${borderBadge};">
              <span class="ribbon-text">${labelCategory}</span>
            </div>
            <div class="category-subtext" style="color: ${darkColor};">${subCategoryText}</div>

            <!-- QR Code Frame -->
            <div class="qr-frame" style="border-color: ${primaryColor};">
              <img src="${qrUrl}" alt="${item.qrCode}" class="qr-image" />
            </div>

            <!-- Unique Serial Code -->
            <div class="serial-code" style="color: ${darkColor};">
              ${item.qrCode}
            </div>

            <!-- Metadata & Instructions -->
            <div class="card-meta">
              ${batchStr ? `<span class="meta-batch">${batchStr}</span> &bull; ` : ""}<span class="meta-area">${wilayahStr}</span>
            </div>

            <div class="footer-instruction" style="border-top: 1px dashed ${primaryColor}66; color: ${darkColor};">
              Pindai QR dengan Aplikasi BERSEKA untuk Aktivasi &amp; Catat Setoran
            </div>

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
      <title>${title} (10 x 15 cm)</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=JetBrains+Mono:wght@700;800;900&display=swap');

        @page {
          size: 100mm 150mm portrait;
          margin: 0;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          background: #e2e8f0;
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
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .no-print .info-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }

        .no-print .info-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .no-print .btn-print {
          background: #16a34a;
          color: white;
          border: none;
          padding: 9px 22px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
        }

        .no-print .btn-print:hover {
          background: #15803d;
        }

        .print-canvas {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding: 24px;
          justify-content: center;
        }

        .sticker-wrapper {
          width: 100mm;
          height: 150mm;
          min-width: 100mm;
          min-height: 150mm;
          max-width: 100mm;
          max-height: 150mm;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
          display: flex;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .qr-card {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
          padding: 0 0 10px 0;
          box-sizing: border-box;
          position: relative;
        }

        .header-band {
          width: 100%;
          padding: 8px 12px 7px 12px;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .band-title {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
          line-height: 1.1;
        }

        .band-subtitle {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 1.5px;
          opacity: 0.92;
        }

        .category-ribbon {
          margin-top: 6px;
          padding: 4px 18px;
          border-radius: 9999px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }

        .ribbon-text {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .category-subtext {
          font-size: 8px;
          font-weight: 700;
          margin-top: 2px;
          letter-spacing: 0.3px;
        }

        .qr-frame {
          background: #ffffff;
          padding: 8px;
          border-radius: 14px;
          border: 2px solid;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          margin: 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-image {
          width: 58mm;
          height: 58mm;
          display: block;
        }

        .serial-code {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 1.2px;
          background: #ffffff;
          padding: 3px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .card-meta {
          font-size: 8.5px;
          font-weight: 700;
          color: #475569;
          margin-top: 4px;
          padding: 0 8px;
          line-height: 1.2;
        }

        .meta-batch {
          color: #0f172a;
        }

        .footer-instruction {
          width: 90%;
          padding-top: 6px;
          font-size: 7.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          line-height: 1.2;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
          }
          .print-canvas {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            gap: 0 !important;
          }
          .sticker-wrapper {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <div class="info-title">📄 Pratinjau Cetak Stiker QR BERSEKA (Ukuran 10 x 15 cm)</div>
          <div class="info-desc">Total: ${items.length} Lembar Stiker. Pilih opsi "Save as PDF" / "Simpan sebagai PDF" pada dialog cetak browser.</div>
        </div>
        <button class="btn-print" onclick="window.print()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Cetak / Simpan PDF (10x15 cm)
        </button>
      </div>

      <div class="print-canvas">
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
