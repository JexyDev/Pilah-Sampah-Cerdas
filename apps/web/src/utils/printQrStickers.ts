/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger printable BERSEKA QR Code posters (10 x 15 cm / A4)
 * 100% 1:1 High-Fidelity Match with Official BERSEKA Organik & Anorganik Designs.
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

export const generatePosterHtml = (
  items: QrStickerItem[],
  title: string = "Poster QR Code Resmi BERSEKA"
): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const cardsHtml = items
    .map((item, index) => {
      const catName = item.category?.name?.toUpperCase() || "";
      const isAnorganik =
        catName.includes("ANORGANIK") ||
        catName.includes("NON_ORGANIC") ||
        catName.includes("ANORG") ||
        catName.includes("AGN") ||
        item.qrCode.toUpperCase().includes("-AGN-");

      const themeClass = isAnorganik ? "theme-anorganik" : "theme-organik";
      const catTitle = isAnorganik ? "ANORGANIK" : "ORGANIK";
      const bgImageSrc = isAnorganik
        ? `${origin}/image/qr_template_anorganik.png`
        : `${origin}/image/qr_template_organik.png`;

      const formattedSerialCode = (() => {
        if (!item.qrCode) return isAnorganik ? "BSK-AGN-020926-0001" : "BSK-OGN-020926-0001";
        return item.qrCode;
      })();

      // High-resolution QR Code image URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(
        item.qrCode || formattedSerialCode
      )}`;

      return `
        <div class="poster-card ${themeClass}" id="poster-card-${index}" data-serial="${formattedSerialCode}" data-category="${catTitle}">
          <!-- Official Template Background Image -->
          <img 
            src="${bgImageSrc}" 
            alt="BERSEKA Template ${catTitle}" 
            class="poster-bg"
            crossorigin="anonymous"
          />

          <!-- QR Code Container placed exactly inside the lower-left white card area -->
          <div class="qr-overlay">
            <img 
              src="${qrUrl}" 
              alt="QR Code ${formattedSerialCode}" 
              class="qr-code-img"
              crossorigin="anonymous"
            />
          </div>

          <!-- Serial Code Badge Pill placed exactly inside the bottom-right badge area -->
          <div class="pill-overlay ${isAnorganik ? "pill-anorganik" : "pill-organik"}">
            ${formattedSerialCode}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title} (10 x 15 cm)</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@800;900&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
      <style id="page-style">
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
          color: #000000;
          background: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Top Action Bar (hidden when printing) */
        .no-print {
          background: #1e293b;
          color: #ffffff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 999;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          gap: 16px;
        }

        .no-print .info-title {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 8px;
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
          flex-wrap: wrap;
        }

        .select-layout {
          background: #334155;
          color: #ffffff;
          border: 1px solid #475569;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          outline: none;
        }

        .btn-action {
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-print {
          background: #059669;
          color: white;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        }

        .btn-print:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .btn-download {
          background: #2563eb;
          color: white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        }

        .btn-download:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .print-canvas {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 24px;
          justify-content: center;
          transition: all 0.3s;
        }

        /* 10 x 15 cm Official Poster Card Layout (2:3 Aspect Ratio) */
        .poster-card {
          width: 100mm;
          height: 150mm;
          min-width: 100mm;
          min-height: 150mm;
          max-width: 100mm;
          max-height: 150mm;
          position: relative;
          background: #ffffff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Background Official High-Res Template Image */
        .poster-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          display: block;
          z-index: 1;
        }

        /* QR Code Overlay (Precision calibrated: Left ~10.69%, Top ~69.82%, Size ~33.68%) */
        .qr-overlay {
          position: absolute;
          left: 10.69%;
          top: 69.82%;
          width: 33.68%;
          height: 22.46%;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 1.5%;
          box-sizing: border-box;
        }

        .qr-code-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          display: block;
        }

        /* Serial Code Text Overlay */
        .pill-overlay {
          position: absolute;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', 'Plus Jakarta Sans', monospace, sans-serif;
          font-weight: 900;
          text-align: center;
          letter-spacing: 0.6px;
          white-space: nowrap;
          line-height: 1;
          box-sizing: border-box;
        }

        /* Organik Pill Badge Position & Styling */
        .pill-organik {
          left: 54.61%;
          top: 89.45%;
          width: 38.21%;
          height: 2.93%;
          color: #ffffff;
          font-size: 8.5pt;
        }

        /* Anorganik Pill Badge Position & Styling */
        .pill-anorganik {
          left: 53.44%;
          top: 91.3%;
          width: 37.48%;
          height: 2.34%;
          color: #000000;
          font-size: 8.2pt;
        }

        /* A4 Multi-grid mode */
        body.layout-a4-grid .print-canvas {
          padding: 10mm;
          gap: 10mm;
        }

        body.layout-a4-grid .poster-card {
          width: 90mm;
          height: 135mm;
          min-width: 90mm;
          min-height: 135mm;
          max-width: 90mm;
          max-height: 135mm;
          page-break-after: auto;
          break-after: auto;
        }

        /* PRINT STYLES */
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
          .poster-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
            min-width: 100mm !important;
            min-height: 150mm !important;
            max-width: 100mm !important;
            max-height: 150mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <div class="info-title">
            📄 Poster Resmi QR Code BERSEKA (10 x 15 cm)
          </div>
          <div class="info-desc">
            Desain Grafis Resmi Organik (Hijau) & Anorganik (Kuning) 100% 1:1 High Fidelity.
          </div>
        </div>

        <div class="controls-group">
          <select class="select-layout" id="layout-select" onchange="changeLayout(this.value)">
            <option value="sticker">Format Stiker 10 x 15 cm (Standar)</option>
            <option value="a4">Format Kertas A4 (Grid)</option>
          </select>

          <button class="btn-action btn-download" onclick="downloadAllPng()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Unduh PNG (HD)
          </button>

          <button class="btn-action btn-print" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <div class="print-canvas">
        ${cardsHtml}
      </div>

      <script>
        function changeLayout(layout) {
          const styleEl = document.getElementById('page-style');
          if (layout === 'a4') {
            document.body.classList.add('layout-a4-grid');
            styleEl.innerHTML = styleEl.innerHTML.replace(
              /@page\\s*{[\\s\\S]*?}/,
              '@page { size: A4 portrait; margin: 10mm; }'
            );
          } else {
            document.body.classList.remove('layout-a4-grid');
            styleEl.innerHTML = styleEl.innerHTML.replace(
              /@page\\s*{[\\s\\S]*?}/,
              '@page { size: 100mm 150mm portrait; margin: 0; }'
            );
          }
        }

        async function downloadAllPng() {
          const cards = document.querySelectorAll('.poster-card');
          if (cards.length === 0) return;

          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const serial = card.getAttribute('data-serial') || ('QR_' + (i + 1));
            const category = card.getAttribute('data-category') || 'BERSEKA';
            const bgImg = card.querySelector('.poster-bg');
            const qrImg = card.querySelector('.qr-code-img');

            const canvas = document.createElement('canvas');
            canvas.width = 1366; // High-Res 2x (683 x 2)
            canvas.height = 2048; // High-Res 2x (1024 x 2)
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // Draw background template
            if (bgImg.complete && bgImg.naturalWidth > 0) {
              ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            } else {
              await new Promise(r => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); r(); };
                img.onerror = () => r();
                img.src = bgImg.src;
              });
            }

            // Draw QR Code onto Canvas (bounds: x: 146, y: 1430, w: 460, h: 460)
            await new Promise(r => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                // White backing
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(146, 1430, 460, 460);
                ctx.drawImage(img, 156, 1440, 440, 440);
                r();
              };
              img.onerror = () => r();
              img.src = qrImg.src;
            });

            // Draw Serial text on pill
            const isAnorg = category.includes('ANORGANIK');
            ctx.font = '900 30px "JetBrains Mono", "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isAnorg) {
              ctx.fillStyle = '#000000';
              ctx.fillText(serial, 985, 1895);
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.fillText(serial, 1007, 1862);
            }

            // Trigger download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'POSTER_' + category + '_' + serial + '.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Brief pause between multiple downloads
            if (cards.length > 1) {
              await new Promise(r => setTimeout(r, 300));
            }
          }
        }

        window.onload = function() {
          // Allow high-res fonts and QR images to settle before triggering print dialog
          setTimeout(function() {
            window.print();
          }, 600);
        };
      </script>
    </body>
    </html>
  `;
};

export const printQrStickers = (
  items: QrStickerItem[],
  title: string = "Poster QR Code Resmi BERSEKA"
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

  const htmlContent = generatePosterHtml(items, title);

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
