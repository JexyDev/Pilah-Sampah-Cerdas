/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger printable 10 x 15 cm QR Code stickers / PDF export (Universal, Minimalist & High-Contrast)
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

      // Palet Warna: Kuning Cerah Menarik untuk Anorganik, Hijau Segar untuk Organik
      let primaryColor = "#16a34a"; // Hijau Organik
      let secondaryColor = "#15803d";
      let bgCard = "#f0fdf4";
      let badgeBg = "#16a34a";
      let badgeText = "#ffffff";
      let borderBadge = "#22c55e";
      let labelCategory = "SAMPAH ORGANIK";
      let headerTextColor = "#ffffff";

      if (isAnorganik) {
        primaryColor = "#eab308"; // Kuning Cerah Anorganik
        secondaryColor = "#ca8a04";
        bgCard = "#fefce8";
        badgeBg = "#facc15";
        badgeText = "#0f172a"; // Teks hitam/gelap kontras tinggi
        borderBadge = "#eab308";
        labelCategory = "SAMPAH ANORGANIK";
        headerTextColor = "#0f172a";
      } else if (!isOrganik) {
        primaryColor = "#475569";
        secondaryColor = "#334155";
        bgCard = "#f8fafc";
        badgeBg = "#475569";
        badgeText = "#ffffff";
        borderBadge = "#64748b";
        labelCategory = "TEMPAT SAMPAH";
        headerTextColor = "#ffffff";
      }

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
        item.qrCode
      )}`;

      return `
        <div class="sticker-wrapper">
          <div class="qr-card" style="border: 3.5px solid ${primaryColor}; background: linear-gradient(180deg, #ffffff 0%, ${bgCard} 100%);">
            
            <!-- Header Brand -->
            <div class="header-band" style="background-color: ${primaryColor}; color: ${headerTextColor};">
              <div class="band-title">BERSEKA</div>
              <div class="band-subtitle">TEMPAT SAMPAH PINTAR</div>
            </div>

            <!-- Category Banner (Besar & Jelas) -->
            <div class="category-box">
              <div class="category-ribbon" style="background-color: ${badgeBg}; color: ${badgeText}; border: 2px solid ${borderBadge};">
                ${labelCategory}
              </div>
            </div>

            <!-- Large QR Frame -->
            <div class="qr-frame" style="border: 2px solid ${primaryColor};">
              <img src="${qrUrl}" alt="${item.qrCode}" class="qr-image" />
            </div>

            <!-- Unique Serial Code -->
            <div class="serial-wrapper">
              <div class="serial-code" style="color: ${secondaryColor}; border: 1.5px solid ${primaryColor}88;">
                ${item.qrCode}
              </div>
            </div>

            <!-- Bottom Accent Band -->
            <div class="bottom-band" style="background-color: ${primaryColor};"></div>

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
      <style id="page-style">
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=JetBrains+Mono:wght@800;900&display=swap');

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
          background: #334155;
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
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
          gap: 16px;
          flex-wrap: wrap;
        }

        .no-print .info-title {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.3px;
        }

        .no-print .info-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .controls-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-mode {
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid #475569;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-mode.active {
          background: #3b82f6;
          color: white;
          border-color: #60a5fa;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
        }

        .no-print .btn-print {
          background: #16a34a;
          color: white;
          border: none;
          padding: 9px 22px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
        }

        .no-print .btn-print:hover {
          background: #15803d;
        }

        .print-canvas {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 30px;
          justify-content: center;
        }

        /* 10 x 15 cm Mode (Default) */
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
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          border-radius: 14px;
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
          box-sizing: border-box;
          position: relative;
          padding: 0;
        }

        .header-band {
          width: 100%;
          padding: 12px 12px 10px 12px;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
        }

        .band-title {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 3px;
          line-height: 1.1;
        }

        .band-subtitle {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 2px;
          opacity: 0.95;
          margin-top: 1px;
        }

        .category-box {
          margin-top: 10px;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .category-ribbon {
          padding: 6px 24px;
          border-radius: 9999px;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
        }

        .qr-frame {
          background: #ffffff;
          padding: 10px;
          border-radius: 16px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-image {
          width: 66mm;
          height: 66mm;
          display: block;
        }

        .serial-wrapper {
          margin-bottom: 12px;
        }

        .serial-code {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          font-size: 15px;
          letter-spacing: 1.5px;
          background: #ffffff;
          padding: 5px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.06);
          display: inline-block;
        }

        .bottom-band {
          width: 100%;
          height: 10px;
        }

        /* A4 Grid Mode Styling */
        body.mode-a4 .print-canvas {
          padding: 10mm;
          gap: 10mm;
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

          /* When A4 mode is active during print */
          body.mode-a4 .print-canvas {
            display: flex !important;
            flex-wrap: wrap !important;
            padding: 0 !important;
            margin: 0 !important;
            gap: 0 !important;
            justify-content: space-around !important;
          }

          body.mode-a4 .sticker-wrapper {
            width: 98mm !important;
            height: 144mm !important;
            min-width: 98mm !important;
            min-height: 144mm !important;
            max-width: 98mm !important;
            max-height: 144mm !important;
            page-break-after: auto !important;
            break-after: auto !important;
            margin: 2mm !important;
            border: 1px dashed #cbd5e1 !important;
          }

          body.mode-a4 .sticker-wrapper:nth-child(4n) {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      </style>
    </head>
    <body class="mode-single">
      <div class="no-print">
        <div>
          <div class="info-title">📄 Pratinjau Stiker QR BERSEKA (10 x 15 cm)</div>
          <div class="info-desc">Desain Minimalis & Universal. Pilih tata letak di bawah lalu klik "Cetak / Simpan PDF".</div>
        </div>

        <div class="controls-group">
          <button class="btn-mode active" id="btn-single" onclick="setMode('single')">
            📐 Stiker Satuan (10 x 15 cm)
          </button>
          <button class="btn-mode" id="btn-a4" onclick="setMode('a4')">
            📑 Lembar A4 (Grid 4 Stiker)
          </button>
          <button class="btn-print" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <div class="print-canvas" id="canvas">
        ${cardsHtml}
      </div>

      <script>
        function setMode(mode) {
          const btnSingle = document.getElementById('btn-single');
          const btnA4 = document.getElementById('btn-a4');
          const pageStyle = document.getElementById('page-style');

          if (mode === 'a4') {
            document.body.className = 'mode-a4';
            btnA4.className = 'btn-mode active';
            btnSingle.className = 'btn-mode';
            pageStyle.innerHTML = pageStyle.innerHTML.replace(/size:\s*100mm 150mm portrait;/, 'size: A4 portrait; margin: 5mm;');
          } else {
            document.body.className = 'mode-single';
            btnSingle.className = 'btn-mode active';
            btnA4.className = 'btn-mode';
            pageStyle.innerHTML = pageStyle.innerHTML.replace(/size:\s*A4 portrait; margin: 5mm;/, 'size: 100mm 150mm portrait; margin: 0;');
          }
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
