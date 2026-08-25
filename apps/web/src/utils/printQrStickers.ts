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
          <!-- Top Header -->
          <div class="header-section">
            <div class="header-top">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 59 16.17 3.83 12 7.83 12 14 17 8z"/></svg>
              <div class="header-title">BERSEKA</div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 59 16.17 3.83 12 7.83 12 14 17 8z"/></svg>
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
              <div class="logo-badge">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M16 2L4 8v16l12 6 12-6V8L16 2z" fill="#15803D"/><path d="M16 6l-8 4v10l8 4 8-4V10l-8-4z" fill="#FACC15"/></svg>
              </div>
              <div class="logo-label">PROVINSI<br/>JAWA BARAT</div>
            </div>
            <div class="logo-item">
              <div class="logo-badge">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M16 2L6 8v16l10 4 10-4V8L16 2z" fill="#0284C7"/><path d="M16 6v16" stroke="#FACC15" stroke-width="2"/></svg>
              </div>
              <div class="logo-label">PEMERINTAH<br/>KOTA BANDUNG</div>
            </div>
            <div class="logo-item">
              <div class="logo-badge">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M8 20L16 4l8 16H8z" fill="#16A34A"/><circle cx="16" cy="18" r="4" fill="#EA580C"/></svg>
              </div>
              <div class="logo-label">DINAS<br/>LINGKUNGAN HIDUP</div>
            </div>
            <div class="logo-item">
              <div class="logo-badge">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#FACC15"/><path d="M16 6l6 14H10l6-14z" fill="#1D4ED8"/></svg>
              </div>
              <div class="logo-label">UNIVERSITAS<br/>KOMPUTER INDONESIA</div>
            </div>
          </div>

          <!-- Main Category Banner -->
          <div class="banner-box">
            <div class="banner-content">
              <div class="banner-icon-circle">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <path d="M10 11v6m4-6v6"></path>
                </svg>
              </div>
              <div class="banner-titles">
                <div class="banner-subtitle-sm">TEMPAT SAMPAH</div>
                <div class="banner-title-main">${catTitle}</div>
              </div>
            </div>
            <div class="banner-desc-box">
              ${catDesc}
            </div>
          </div>

          <!-- 4 Feature Bullets -->
          <div class="benefits-grid">
            <div class="benefit-item">
              <div class="benefit-icon">🍃</div>
              <div class="benefit-text">Menjaga lingkungan tetap bersih</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">♻️</div>
              <div class="benefit-text">Mengurangi sampah ke TPA</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">🗑️</div>
              <div class="benefit-text">Kelola sampah lebih baik & bermanfaat</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">👥</div>
              <div class="benefit-text">Bersama wujudkan kampung bersih & asri</div>
            </div>
          </div>

          <!-- Bottom QR Code Section -->
          <div class="qr-section">
            <div class="qr-left">
              <img src="${qrUrl}" alt="${item.qrCode}" class="qr-img" />
            </div>
            <div class="qr-right">
              <div class="scan-header">
                <div class="scan-icon-circle">📱</div>
                <div>
                  <div class="scan-title">SCAN UNTUK</div>
                  <div class="scan-title">CATAT & LAPOR</div>
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
              <span style="font-size: 11px;">🛡️</span>
              <div class="footer-text">MARI JAGA KEBERSIHAN<br/>UNTUK MASA DEPAN YANG LEBIH HIJAU</div>
            </div>
            <div style="font-size: 12px;">🍃</div>
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
          color: #0f172a;
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
          background: #10b981;
          color: white;
          border-color: #34d399;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
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

        /* 10 x 15 cm Mode (Default) */
        .poster-card {
          width: 100mm;
          height: 150mm;
          min-width: 100mm;
          min-height: 150mm;
          max-width: 100mm;
          max-height: 150mm;
          border-radius: 18px;
          padding: 5mm;
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
          border: 5.5px solid #F59E0B;
          background: #FFFFFF;
        }
        .poster-card.theme-anorganik .header-title { color: #000000; }
        .poster-card.theme-anorganik .banner-box {
          background: #FFFBEB;
          border: 2.5px solid #F59E0B;
        }
        .poster-card.theme-anorganik .banner-subtitle-sm { color: #000000; }
        .poster-card.theme-anorganik .banner-title-main { color: #000000; font-size: 22px; font-weight: 900; }
        .poster-card.theme-anorganik .banner-desc-box {
          background: #F59E0B;
          color: #000000;
          font-weight: 800;
        }
        .poster-card.theme-anorganik .banner-icon-circle {
          background: #F59E0B;
          color: #000000;
        }
        .poster-card.theme-anorganik .benefit-icon {
          background: #FEF3C7;
          color: #D97706;
          border: 1px solid #F59E0B;
        }
        .poster-card.theme-anorganik .scan-icon-circle {
          background: #F59E0B;
          color: #000000;
        }
        .poster-card.theme-anorganik .pill-serial {
          background: #F59E0B;
          color: #000000;
        }

        /* ORGANIK GREEN THEME */
        .poster-card.theme-organik {
          border: 5.5px solid #047857;
          background: #FFFFFF;
        }
        .poster-card.theme-organik .header-title { color: #047857; }
        .poster-card.theme-organik .banner-box {
          background: #047857;
          border: 2.5px solid #047857;
        }
        .poster-card.theme-organik .banner-subtitle-sm { color: #ECFDF5; }
        .poster-card.theme-organik .banner-title-main { color: #FFFFFF; font-size: 22px; font-weight: 900; }
        .poster-card.theme-organik .banner-desc-box {
          background: #065F46;
          color: #FFFFFF;
          font-weight: 800;
        }
        .poster-card.theme-organik .banner-icon-circle {
          background: #ECFDF5;
          color: #047857;
        }
        .poster-card.theme-organik .benefit-icon {
          background: #D1FAE5;
          color: #047857;
          border: 1px solid #047857;
        }
        .poster-card.theme-organik .scan-icon-circle {
          background: #047857;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .pill-serial {
          background: #047857;
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
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 2.5px;
          line-height: 1;
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
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #1e293b;
        }

        /* LOGOS ROW (4 LOGOS) */
        .logos-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          padding: 4px 2px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          text-align: center;
          margin: 3px 0;
          background: #ffffff;
        }
        .logo-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 2px;
        }
        .logo-badge {
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-label {
          font-size: 5.5px;
          font-weight: 900;
          line-height: 1.1;
          color: #0f172a;
          text-transform: uppercase;
        }

        /* BANNER BOX */
        .banner-box {
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 2px 0;
        }
        .banner-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .banner-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .banner-titles {
          flex: 1;
        }
        .banner-subtitle-sm {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          line-height: 1.1;
        }
        .banner-desc-box {
          border-radius: 8px;
          padding: 5px 8px;
          font-size: 7.5px;
          text-align: center;
          line-height: 1.25;
        }

        /* BENEFIT BULLETS (4 COLUMNS) */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3px;
          margin: 2px 0;
          text-align: center;
        }
        .benefit-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .benefit-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }
        .benefit-text {
          font-size: 6px;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
        }

        /* BOTTOM QR SECTION (2 COLUMNS) */
        .qr-section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 2px 0;
        }
        .qr-left {
          width: 44mm;
          height: 44mm;
          background: #ffffff;
          padding: 3px;
          border-radius: 8px;
          border: 2px solid #0f172a;
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
          gap: 4px;
        }
        .scan-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .scan-icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }
        .scan-title {
          font-size: 9.5px;
          font-weight: 900;
          line-height: 1.1;
          color: #0f172a;
        }
        .scan-desc {
          font-size: 6.5px;
          font-weight: 700;
          color: #334155;
          line-height: 1.25;
        }
        .pill-serial {
          border-radius: 9999px;
          padding: 4px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          font-weight: 900;
          text-align: center;
          letter-spacing: 0.5px;
        }

        /* FOOTER BAR */
        .footer-bar {
          border-top: 1.5px solid #cbd5e1;
          padding-top: 3px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .footer-text {
          font-size: 6.5px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          text-transform: uppercase;
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
    <body class="mode-single">
      <div class="no-print">
        <div>
          <div class="info-title">📄 Poster Resmi QR Code BERSEKA (10 x 15 cm)</div>
          <div class="info-desc">Desain Resmi Organik & Anorganik. Klik "Cetak / Simpan PDF" di bawah.</div>
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
