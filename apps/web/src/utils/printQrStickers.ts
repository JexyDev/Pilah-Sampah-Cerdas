/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger printable BERSEKA QR Code posters (10 x 15 cm / A4)
 * High-fidelity match with official BERSEKA Organik & Anorganik poster designs.
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

export const generatePosterHtml = (items: QrStickerItem[], title: string = "Poster QR Code BERSEKA"): string => {
  const cardsHtml = items
    .map((item) => {
      const catName = item.category?.name?.toUpperCase() || "";
      const isAnorganik =
        catName.includes("ANORGANIK") ||
        catName.includes("NON_ORGANIC") ||
        catName.includes("ANORG") ||
        catName.includes("AGN") ||
        item.qrCode.toUpperCase().includes("-AGN-");

      const themeClass = isAnorganik ? "theme-anorganik" : "theme-organik";
      const catTitle = isAnorganik ? "ANORGANIK" : "ORGANIK";
      const catDesc = isAnorganik
        ? "Untuk sampah anorganik seperti plastik, kaleng, kaca, logam, dan bahan sintetis lainnya."
        : "Untuk sampah organik dari sisa makanan, daun, ranting, dan bahan alami lainnya.";

      const formattedSerialCode = (() => {
        if (!item.qrCode) return "BSK-OGN-250826-0001";
        if (item.qrCode.startsWith("BSK-") || item.qrCode.startsWith("TC-")) return item.qrCode;
        const tag = isAnorganik ? "AGN" : "OGN";
        const digits = item.qrCode.replace(/\D/g, "");
        const seq = digits ? String(parseInt(digits.slice(-4) || "1", 10)).padStart(4, "0") : "0001";
        return `BSK-${tag}-250826-${seq}`;
      })();

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=1&data=${encodeURIComponent(
        item.qrCode
      )}`;

      return `
        <div class="poster-card ${themeClass}">
          <!-- Header Section -->
          <div class="header-section">
            <div class="header-top">
              <span class="leaf-icon-left">🍃</span>
              <div class="header-title">BERSEKA</div>
              <span class="leaf-icon-right">🍃</span>
            </div>
            <div class="header-sub-row">
              <div class="header-sub-line"></div>
              <div class="header-subtitle">BERSIH • SEHAT • KAMPUNG ASRI</div>
              <div class="header-sub-line"></div>
            </div>
          </div>

          <!-- Row of 4 Institutional Logos -->
          <div class="logos-row">
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="/image/mitra/prov-jabar.png" alt="Jawa Barat" class="logo-img" />
              </div>
              <div class="logo-pill">PROVINSI<br/>JAWA BARAT</div>
            </div>
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="/image/mitra/pemkot-bandung.svg" alt="Kota Bandung" class="logo-img" />
              </div>
              <div class="logo-pill">PEMERINTAH<br/>KOTA BANDUNG</div>
            </div>
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="/image/mitra/dlh-bandung.svg" alt="DLH Kota Bandung" class="logo-img" />
              </div>
              <div class="logo-pill">DINAS<br/>LINGKUNGAN HIDUP</div>
            </div>
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="/image/mitra/unikom.png" alt="UNIKOM" class="logo-img" />
              </div>
              <div class="logo-pill">UNIVERSITAS<br/>KOMPUTER INDONESIA</div>
            </div>
          </div>

          <!-- Main Category Banner -->
          <div class="banner-box">
            <div class="banner-left">
              <div class="bin-circle">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <path d="M10 11v6m4-6v6"></path>
                </svg>
              </div>
            </div>
            <div class="banner-right">
              <div class="banner-sub-sm">TEMPAT SAMPAH</div>
              <div class="banner-title-main">${catTitle}</div>
              <div class="banner-leaf-divider">🍃 🍃</div>
              <div class="banner-desc-box">${catDesc}</div>
            </div>
          </div>

          <!-- 4 Benefit Columns -->
          <div class="benefits-grid">
            <div class="benefit-item">
              <div class="benefit-icon">🍃</div>
              <div class="benefit-text">Menjaga<br/>lingkungan<br/>tetap bersih</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">♻️</div>
              <div class="benefit-text">Mengurangi<br/>sampah<br/>ke TPA</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">🗑️</div>
              <div class="benefit-text">Kelola sampah<br/>lebih baik dan<br/>bermanfaat</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">👥</div>
              <div class="benefit-text">Bersama wujudkan<br/>kampung yang<br/>bersih & asri</div>
            </div>
          </div>

          <!-- Bottom QR Code & Scan Section -->
          <div class="qr-section">
            <div class="qr-box">
              <img src="${qrUrl}" alt="${item.qrCode}" class="qr-img" />
            </div>
            <div class="qr-right">
              <div class="scan-header">
                <div class="scan-icon-circle">📱</div>
                <div class="scan-titles">
                  <div class="scan-title-bold">SCAN UNTUK</div>
                  <div class="scan-title-bold">CATAT & LAPOR</div>
                </div>
              </div>
              <div class="scan-desc">
                Setiap scan membantu kami mencatat dan mengelola sampah dengan lebih baik.
              </div>
              <div class="pill-serial">
                ${formattedSerialCode}
              </div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div class="footer-bar">
            <div class="footer-left">
              <span class="shield-icon">🛡️</span>
              <div class="footer-text">
                <div>MARI JAGA KEBERSIHAN</div>
                <div>UNTUK MASA DEPAN YANG LEBIH HIJAU</div>
              </div>
            </div>
            <div class="footer-right">🍃</div>
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
          color: #000000;
          background: #1e293b;
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

        .no-print .btn-print {
          background: #059669;
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
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        }

        .no-print .btn-print:hover {
          background: #047857;
        }

        .print-canvas {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 24px;
          justify-content: center;
        }

        /* Poster Card (100mm x 150mm) */
        .poster-card {
          width: 100mm;
          height: 150mm;
          min-width: 100mm;
          min-height: 150mm;
          max-width: 100mm;
          max-height: 150mm;
          border-radius: 16px;
          padding: 4mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          page-break-after: always;
          break-after: page;
        }

        /* ANORGANIK YELLOW THEME */
        .poster-card.theme-anorganik {
          border: 5mm solid #FFC20E;
          background: #FFFFFF;
        }
        .poster-card.theme-anorganik .banner-box {
          background: #FFC20E;
          color: #000000;
        }
        .poster-card.theme-anorganik .logo-pill {
          background: #FFC20E;
          color: #000000;
        }
        .poster-card.theme-anorganik .benefit-icon {
          background: #FFC20E;
          color: #000000;
        }
        .poster-card.theme-anorganik .scan-icon-circle {
          background: #FFC20E;
          color: #000000;
        }
        .poster-card.theme-anorganik .pill-serial {
          background: #FFC20E;
          color: #000000;
        }

        /* ORGANIK GREEN THEME */
        .poster-card.theme-organik {
          border: 5mm solid #006837;
          background: #FFFFFF;
        }
        .poster-card.theme-organik .banner-box {
          background: #006837;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .logo-pill {
          background: #006837;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .benefit-icon {
          background: #006837;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .scan-icon-circle {
          background: #006837;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .pill-serial {
          background: #006837;
          color: #FFFFFF;
        }

        /* HEADER */
        .header-section {
          text-align: center;
        }
        .header-top {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .header-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #000000;
          line-height: 1;
        }
        .leaf-icon-left, .leaf-icon-right {
          font-size: 14px;
        }
        .header-sub-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 2px;
        }
        .header-sub-line {
          flex: 1;
          height: 1.5px;
          background: #cbd5e1;
        }
        .header-subtitle {
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #000000;
        }

        /* LOGOS ROW */
        .logos-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          padding: 3px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          text-align: center;
          background: #ffffff;
        }
        .logo-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 2px;
          border-right: 1px solid #e2e8f0;
          padding: 2px;
        }
        .logo-item:last-child {
          border-right: none;
        }
        .logo-img-wrapper {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          max-height: 22px;
          max-width: 100%;
          object-fit: contain;
        }
        .logo-pill {
          font-size: 5px;
          font-weight: 900;
          line-height: 1.1;
          border-radius: 4px;
          padding: 2px 3px;
          width: 100%;
          text-transform: uppercase;
        }

        /* MAIN BANNER */
        .banner-box {
          border-radius: 12px;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .banner-left {
          flex-shrink: 0;
        }
        .bin-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .banner-right {
          flex: 1;
        }
        .banner-sub-sm {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
          line-height: 1;
        }
        .banner-title-main {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1px;
          line-height: 1.1;
        }
        .banner-leaf-divider {
          font-size: 8px;
          margin: 1px 0;
        }
        .banner-desc-box {
          font-size: 6.5px;
          line-height: 1.2;
          font-weight: 700;
        }

        /* 4 BENEFITS */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          text-align: center;
          margin: 2px 0;
        }
        .benefit-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          border-right: 1px solid #f1f5f9;
        }
        .benefit-item:last-child {
          border-right: none;
        }
        .benefit-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }
        .benefit-text {
          font-size: 5.5px;
          font-weight: 800;
          line-height: 1.15;
          color: #000000;
        }

        /* QR SECTION */
        .qr-section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 2px 0;
        }
        .qr-box {
          width: 38mm;
          height: 38mm;
          background: #ffffff;
          padding: 2px;
          border-radius: 6px;
          border: 1.5px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qr-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .qr-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .scan-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .scan-icon-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
        }
        .scan-title-bold {
          font-size: 9px;
          font-weight: 900;
          line-height: 1.1;
          color: #000000;
        }
        .scan-desc {
          font-size: 6px;
          font-weight: 700;
          color: #334155;
          line-height: 1.2;
        }
        .pill-serial {
          border-radius: 9999px;
          padding: 3px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px;
          font-weight: 900;
          text-align: center;
          letter-spacing: 0.5px;
        }

        /* FOOTER */
        .footer-bar {
          border-top: 1.5px solid #cbd5e1;
          padding-top: 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .shield-icon {
          font-size: 10px;
        }
        .footer-text {
          font-size: 6px;
          font-weight: 900;
          color: #000000;
          line-height: 1.1;
        }
        .footer-right {
          font-size: 10px;
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
          .poster-card {
            box-shadow: none !important;
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
          <div class="info-title">📄 Poster Resmi QR Code BERSEKA (10 x 15 cm)</div>
          <div class="info-desc">Desain Resmi Organik & Anorganik 1:1. Klik "Cetak / Simpan PDF" di bawah.</div>
        </div>

        <div class="controls-group">
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

      <div class="print-canvas">
        ${cardsHtml}
      </div>
    </body>
    </html>
  `;
};

export const printQrStickers = (
  items: QrStickerItem[],
  title: string = "Poster QR Code BERSEKA"
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
