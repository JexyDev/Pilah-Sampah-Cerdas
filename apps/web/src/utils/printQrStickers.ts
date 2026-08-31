/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Utility to generate and trigger printable BERSEKA QR Code posters (10 x 15 cm / A4)
 * High-fidelity 1:1 match with official BERSEKA Organik (Green) & Anorganik (Yellow) poster designs.
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

// Vector SVG Icons for Header, Benefits, CTA, and Footer
const SVG_ICONS = {
  leaf: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle;">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
    </svg>
  `,
  leafPair: `
    <svg width="22" height="14" viewBox="0 0 32 20" fill="currentColor" style="display:inline-block; vertical-align:middle;">
      <path d="M13 5 C7 6 5 12 3 17 L5 18 L6 16 C14 16 16 2 16 2 C15 4 10 4 7 5 C5 6 3 9 3 10 C3 12 4 14 4 14 C7 6 13 5 13 5 Z"/>
      <path d="M19 5 C25 6 27 12 29 17 L27 18 L26 16 C18 16 16 2 16 2 C17 4 22 4 25 5 C27 6 29 9 29 10 C29 12 28 14 28 14 C25 6 19 5 19 5 Z"/>
    </svg>
  `,
  benefitClean: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  `,
  benefitRecycle: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
      <path d="M11 19h8.2a1.8 1.8 0 0 0 1.583-.914.8.8 0 0 0 .017-.817L17.5 11"/>
      <path d="m14 16 3 3-3 3"/>
      <path d="M8.293 13.596 3.5 9.5 8.293 5.404"/>
      <path d="m14 8-3-3 3-3"/>
      <path d="M12 5.5h4.2a1.8 1.8 0 0 1 1.583.914.8.8 0 0 1 .017.817L14.5 13.5"/>
    </svg>
  `,
  benefitBin: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  `,
  benefitCommunity: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `,
  scanPhone: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
      <path d="M12 18h.01"/>
      <path d="M10 6h4"/>
    </svg>
  `,
  shieldCheck: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `,
};

// High-fidelity vector illustrations for the main banner & bottom section
const getBannerTrashIllustration = (isAnorganik: boolean) => {
  const binColor = isAnorganik ? "#FFC107" : "#008744";
  const lidColor = isAnorganik ? "#FFA000" : "#006837";
  const leafColor = isAnorganik ? "#22C55E" : "#4ADE80";

  return `
    <svg width="54" height="54" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Decorative Leaves -->
      <path d="M20 65 C10 50 15 30 35 25 C30 45 25 55 20 65 Z" fill="${leafColor}" opacity="0.9"/>
      <path d="M80 65 C90 50 85 30 65 25 C70 45 75 55 80 65 Z" fill="${leafColor}" opacity="0.9"/>
      <path d="M15 75 C8 68 10 52 28 48 C22 62 20 70 15 75 Z" fill="${leafColor}" opacity="0.75"/>
      <path d="M85 75 C92 68 90 52 72 48 C78 62 80 70 85 75 Z" fill="${leafColor}" opacity="0.75"/>

      <!-- Trash Bin Body -->
      <path d="M30 38 L34 86 C34 89 37 91 40 91 H60 C63 91 66 89 66 86 L70 38 Z" fill="${binColor}" stroke="#1E293B" stroke-width="3" stroke-linejoin="round"/>
      
      <!-- Bin Side Ribs / Details -->
      <path d="M38 45 L40 82" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      <path d="M62 45 L60 82" stroke="#000000" stroke-width="2" stroke-linecap="round" opacity="0.2"/>

      <!-- Recycle Logo on Bin Body -->
      <g transform="translate(50, 64) scale(0.65)">
        <path d="M0 -15 L4 -8 L1 -8 C3 -2 7 2 12 3 L10 6 C4 5 -1 0 -3 -7 L-6 -7 Z" fill="#ffffff"/>
        <path d="M13 7 L7 9 L9 7 C6 11 2 13 -3 13 L-3 16 C3 16 8 13 12 8 L14 10 Z" fill="#ffffff"/>
        <path d="M-13 7 L-11 0 L-9 2 C-9 -4 -6 -9 -1 -12 L-3 -15 C-9 -11 -12 -5 -12 1 L-14 -1 Z" fill="#ffffff"/>
      </g>

      <!-- Bin Lid Rim -->
      <rect x="25" y="32" width="50" height="7" rx="3.5" fill="${lidColor}" stroke="#1E293B" stroke-width="3"/>
      <!-- Bin Lid Top Handle -->
      <path d="M42 32 V27 C42 25 45 24 50 24 C55 24 58 25 58 27 V32" fill="${lidColor}" stroke="#1E293B" stroke-width="3"/>
    </svg>
  `;
};

// Bottom Illustration (Anorganik: yellow bin + bottles & cans; Organik: green bin + fruits & leaves)
const getBottomIllustration = (isAnorganik: boolean) => {
  if (isAnorganik) {
    return `
      <svg width="100" height="42" viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Sprouting Leaves Behind -->
        <path d="M25 50 C12 40 18 20 38 18 C32 35 28 42 25 50 Z" fill="#22C55E"/>
        <path d="M135 50 C148 40 142 20 122 18 C128 35 132 42 135 50 Z" fill="#22C55E"/>

        <!-- Blue Water Bottle (Left) -->
        <g transform="translate(38, 16) rotate(-18)">
          <rect x="0" y="8" width="16" height="34" rx="4" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
          <rect x="4" y="2" width="8" height="6" rx="1.5" fill="#0284C7"/>
          <rect x="3" y="0" width="10" height="3" rx="1" fill="#FFFFFF"/>
          <line x1="4" y1="16" x2="12" y2="16" stroke="#FFFFFF" stroke-width="1.5" opacity="0.8"/>
          <line x1="4" y1="24" x2="12" y2="24" stroke="#FFFFFF" stroke-width="1.5" opacity="0.8"/>
        </g>

        <!-- Red Soda Can (Left Front) -->
        <g transform="translate(54, 34) rotate(12)">
          <rect x="0" y="0" width="15" height="24" rx="3" fill="#EF4444" stroke="#991B1B" stroke-width="2"/>
          <ellipse cx="7.5" cy="3" rx="6" ry="2" fill="#E2E8F0"/>
          <ellipse cx="7.5" cy="21" rx="6" ry="2" fill="#991B1B"/>
          <path d="M4 8 C8 6 12 12 12 16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
        </g>

        <!-- Center Yellow Trash Bin -->
        <g transform="translate(68, 10)">
          <path d="M6 18 L9 52 C9 54 11 55 13 55 H29 C31 55 33 54 33 52 L36 18 Z" fill="#FFC107" stroke="#1E293B" stroke-width="2.5"/>
          <rect x="3" y="14" width="36" height="5" rx="2" fill="#FFA000" stroke="#1E293B" stroke-width="2"/>
          <path d="M16 14 V10 C16 9 18 8 21 8 C24 8 26 9 26 10 V14" fill="#FFA000" stroke="#1E293B" stroke-width="2"/>
          <!-- Recycle icon -->
          <circle cx="21" cy="34" r="7" fill="#FFFFFF" opacity="0.9"/>
          <path d="M21 29 L23 33 H19 Z M25 35 L23 39 L22 36 Z M17 37 L19 33 L18 36 Z" fill="#D97706"/>
        </g>

        <!-- Green Glass Bottle (Right) -->
        <g transform="translate(108, 14) rotate(16)">
          <path d="M5 14 L2 22 V42 C2 44 4 46 6 46 H12 C14 46 16 44 16 42 V22 L13 14 V4 H5 Z" fill="#10B981" stroke="#065F46" stroke-width="2"/>
          <rect x="4" y="0" width="10" height="4" rx="1" fill="#D1D5DB"/>
        </g>

        <!-- Metal Food Tin / Paper Ball (Right Front) -->
        <g transform="translate(100, 38) rotate(-15)">
          <ellipse cx="10" cy="5" rx="9" ry="4" fill="#94A3B8" stroke="#334155" stroke-width="1.5"/>
          <path d="M1 5 V15 C1 17 5 19 10 19 C15 19 19 17 19 15 V5" fill="#CBD5E1" stroke="#334155" stroke-width="1.5"/>
        </g>
        <path d="M124 45 C122 41 126 37 130 38 C134 39 135 44 132 47 C129 49 126 48 124 45 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5"/>
      </svg>
    `;
  } else {
    return `
      <svg width="100" height="42" viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Sprouting Leaves Behind -->
        <path d="M25 50 C12 40 18 20 38 18 C32 35 28 42 25 50 Z" fill="#4ADE80"/>
        <path d="M135 50 C148 40 142 20 122 18 C128 35 132 42 135 50 Z" fill="#4ADE80"/>

        <!-- Apple Core / Fruit (Left) -->
        <g transform="translate(42, 24) rotate(-15)">
          <path d="M10 2 C10 0 12 0 12 2 C12 6 11 8 11 8" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
          <path d="M6 8 C2 10 2 18 6 22 C4 26 4 32 8 34 C12 34 14 30 14 30 C14 30 16 34 20 34 C24 32 24 26 22 22 C26 18 26 10 22 8 C18 6 14 9 14 9 C14 9 10 6 6 8 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
          <ellipse cx="14" cy="20" rx="3" ry="7" fill="#FEF3C7"/>
          <circle cx="14" cy="18" r="1" fill="#78350F"/>
          <circle cx="14" cy="22" r="1" fill="#78350F"/>
        </g>

        <!-- Center Green Trash Bin -->
        <g transform="translate(68, 10)">
          <path d="M6 18 L9 52 C9 54 11 55 13 55 H29 C31 55 33 54 33 52 L36 18 Z" fill="#008744" stroke="#1E293B" stroke-width="2.5"/>
          <rect x="3" y="14" width="36" height="5" rx="2" fill="#006837" stroke="#1E293B" stroke-width="2"/>
          <path d="M16 14 V10 C16 9 18 8 21 8 C24 8 26 9 26 10 V14" fill="#006837" stroke="#1E293B" stroke-width="2"/>
          <!-- Recycle / Leaf icon -->
          <circle cx="21" cy="34" r="7" fill="#FFFFFF" opacity="0.9"/>
          <path d="M21 28 C17 32 17 38 21 40 C25 38 25 32 21 28 Z" fill="#15803D"/>
        </g>

        <!-- Banana Peel (Right) -->
        <g transform="translate(108, 28) rotate(15)">
          <path d="M2 18 C12 6 24 6 32 16 C26 12 16 14 10 24 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
          <path d="M18 10 C24 16 28 26 24 32 C22 24 18 18 14 14 Z" fill="#EAB308"/>
          <circle cx="2" cy="18" r="2" fill="#713F12"/>
        </g>

        <!-- Fresh Fallen Leaves -->
        <path d="M52 48 C46 44 48 38 54 38 C58 42 56 48 52 48 Z" fill="#22C55E"/>
        <path d="M102 46 C96 42 98 36 104 36 C108 40 106 46 102 46 Z" fill="#16A34A"/>
      </svg>
    `;
  }
};

export const generatePosterHtml = (
  items: QrStickerItem[],
  title: string = "Poster QR Code BERSEKA"
): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

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
        : "Untuk sampah organik seperti sisa makanan, daun, ranting, dan bahan alami lainnya.";

      const formattedSerialCode = (() => {
        if (!item.qrCode) return isAnorganik ? "BSK-AGN-250826-0001" : "BSK-OGN-250826-0001";
        if (item.qrCode.startsWith("BSK-") || item.qrCode.startsWith("TC-")) return item.qrCode;
        const tag = isAnorganik ? "AGN" : "OGN";
        const digits = item.qrCode.replace(/\D/g, "");
        const seq = digits ? String(parseInt(digits.slice(-4) || "1", 10)).padStart(4, "0") : "0001";
        return `BSK-${tag}-250826-${seq}`;
      })();

      // The QR Code directly encodes the unique string code used for waste recording / scanning in BERSEKA
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=1&data=${encodeURIComponent(
        item.qrCode || formattedSerialCode
      )}`;

      const bannerTrashSvg = getBannerTrashIllustration(isAnorganik);
      const bottomTrashSvg = getBottomIllustration(isAnorganik);

      return `
        <div class="poster-card ${themeClass}">
          <!-- Header Section -->
          <div class="header-section">
            <div class="header-top">
              <span class="header-leaf">${SVG_ICONS.leaf}</span>
              <h1 class="header-title">BERSEKA</h1>
              <span class="header-leaf header-leaf-flip">${SVG_ICONS.leaf}</span>
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
                <img src="${origin}/image/mitra/prov-jabar.png" alt="Provinsi Jawa Barat" class="logo-img" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Coat_of_arms_of_West_Java.svg/200px-Coat_of_arms_of_West_Java.svg.png'" />
              </div>
              <div class="logo-pill">PROVINSI<br/>JAWA BARAT</div>
            </div>
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="${origin}/image/mitra/pemkot-bandung.png" alt="Pemerintah Kota Bandung" class="logo-img" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Coat_of_arms_of_Bandung.svg/200px-Coat_of_arms_of_Bandung.svg.png'" />
              </div>
              <div class="logo-pill">PEMERINTAH<br/>KOTA BANDUNG</div>
            </div>
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="${origin}/image/mitra/dlh-bandung.jpg" alt="Dinas Lingkungan Hidup" class="logo-img" onerror="this.src='${origin}/image/mitra/dlh-bandung.svg'" />
              </div>
              <div class="logo-pill">DINAS<br/>LINGKUNGAN HIDUP</div>
            </div>
            <div class="logo-item">
              <div class="logo-img-wrapper">
                <img src="${origin}/image/mitra/unikom.png" alt="Universitas Komputer Indonesia" class="logo-img" onerror="this.src='https://upload.wikimedia.org/wikipedia/id/thumb/0/07/Logo_Unikom.png/200px-Logo_Unikom.png'" />
              </div>
              <div class="logo-pill">UNIVERSITAS<br/>KOMPUTER INDONESIA</div>
            </div>
          </div>

          <!-- Main Category Banner -->
          <div class="banner-box">
            <div class="banner-left">
              <div class="bin-circle">
                ${bannerTrashSvg}
              </div>
            </div>
            <div class="banner-right">
              <div class="banner-sub-sm">TEMPAT SAMPAH</div>
              <div class="banner-title-main">${catTitle}</div>
              <div class="banner-leaf-divider">
                <span class="divider-line"></span>
                <span class="divider-leaf">${SVG_ICONS.leafPair}</span>
                <span class="divider-line"></span>
              </div>
              <div class="banner-desc-box">${catDesc}</div>
            </div>
          </div>

          <!-- 4 Benefit Columns -->
          <div class="benefits-grid">
            <div class="benefit-item">
              <div class="benefit-icon">${SVG_ICONS.benefitClean}</div>
              <div class="benefit-text">Menjaga<br/>lingkungan<br/>tetap bersih</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">${SVG_ICONS.benefitRecycle}</div>
              <div class="benefit-text">Mengurangi<br/>sampah<br/>ke TPA</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">${SVG_ICONS.benefitBin}</div>
              <div class="benefit-text">Kelola sampah<br/>lebih baik dan<br/>bermanfaat</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">${SVG_ICONS.benefitCommunity}</div>
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
                <div class="scan-icon-circle">${SVG_ICONS.scanPhone}</div>
                <div class="scan-titles">
                  <div class="scan-title-bold">SCAN UNTUK</div>
                  <div class="scan-title-bold">CATAT & LAPOR</div>
                </div>
              </div>
              <div class="scan-desc">
                Setiap scan membantu kami mencatat dan mengelola sampah dengan lebih baik.
              </div>
              <div class="qr-illustration-wrapper">
                ${bottomTrashSvg}
              </div>
              <div class="pill-serial">
                ${formattedSerialCode}
              </div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div class="footer-bar">
            <div class="footer-left">
              <span class="shield-icon">${SVG_ICONS.shieldCheck}</span>
              <div class="footer-text">
                <div>MARI JAGA KEBERSIHAN</div>
                <div>UNTUK MASA DEPAN YANG LEBIH HIJAU</div>
              </div>
            </div>
            <div class="footer-right">${SVG_ICONS.leafPair}</div>
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
      <title>${title} (Stiker 10 x 15 cm)</title>
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
          background: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Top Action Bar */
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
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        }

        .no-print .btn-print:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .print-canvas {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 24px;
          justify-content: center;
        }

        /* Poster Card (Sticker 100mm x 150mm / 10 x 15 cm) */
        .poster-card {
          width: 100mm;
          height: 150mm;
          min-width: 100mm;
          min-height: 150mm;
          max-width: 100mm;
          max-height: 150mm;
          border-radius: 18px;
          padding: 3.5mm 3.8mm 3mm 3.8mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          page-break-after: always;
          break-after: page;
          overflow: hidden;
        }

        /* ANORGANIK THEME (Vibrant Yellow / Gold) */
        .poster-card.theme-anorganik {
          border: 4.5mm solid #FFC107;
          background: #FFFFFF;
        }
        .poster-card.theme-anorganik .banner-box {
          background: #FFC107;
          color: #000000;
        }
        .poster-card.theme-anorganik .logo-pill {
          background: #FFC107;
          color: #000000;
        }
        .poster-card.theme-anorganik .benefit-icon {
          background: #FFC107;
          color: #000000;
        }
        .poster-card.theme-anorganik .scan-icon-circle {
          background: #FFC107;
          color: #000000;
        }
        .poster-card.theme-anorganik .pill-serial {
          background: #FFC107;
          color: #000000;
        }

        /* ORGANIK THEME (Vibrant Eco Green) */
        .poster-card.theme-organik {
          border: 4.5mm solid #008744;
          background: #FFFFFF;
        }
        .poster-card.theme-organik .banner-box {
          background: #008744;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .logo-pill {
          background: #008744;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .benefit-icon {
          background: #008744;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .scan-icon-circle {
          background: #008744;
          color: #FFFFFF;
        }
        .poster-card.theme-organik .pill-serial {
          background: #008744;
          color: #FFFFFF;
        }

        /* HEADER */
        .header-section {
          text-align: center;
          margin-bottom: 1.5mm;
        }
        .header-top {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .header-title {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 2.5px;
          color: #000000;
          line-height: 1;
        }
        .header-leaf {
          display: inline-flex;
          align-items: center;
          color: #000000;
        }
        .header-leaf-flip {
          transform: scaleX(-1);
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
          background: #000000;
        }
        .header-subtitle {
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.2px;
          color: #000000;
          white-space: nowrap;
        }

        /* LOGOS ROW (4 INSTITUTIONAL LOGOS) */
        .logos-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5px;
          padding: 3px 2px;
          border: 1.5px solid #cbd5e1;
          border-radius: 7px;
          text-align: center;
          background: #ffffff;
          margin-bottom: 2mm;
        }
        .logo-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 3px;
          border-right: 1px solid #e2e8f0;
          padding: 1px 2px;
        }
        .logo-item:last-child {
          border-right: none;
        }
        .logo-img-wrapper {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .logo-img {
          max-height: 23px;
          max-width: 95%;
          object-fit: contain;
        }
        .logo-pill {
          font-size: 5px;
          font-weight: 900;
          line-height: 1.15;
          border-radius: 4px;
          padding: 2px 2px;
          width: 100%;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        /* MAIN BANNER */
        .banner-box {
          border-radius: 12px;
          padding: 5px 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2mm;
        }
        .banner-left {
          flex-shrink: 0;
        }
        .bin-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          overflow: hidden;
        }
        .banner-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .banner-sub-sm {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.8px;
          line-height: 1;
          text-transform: uppercase;
        }
        .banner-title-main {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 1.5px;
          line-height: 1.05;
          margin: 1px 0;
        }
        .banner-leaf-divider {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 2px 0 3px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: currentColor;
          opacity: 0.45;
        }
        .divider-leaf {
          display: inline-flex;
          align-items: center;
          opacity: 0.9;
        }
        .banner-desc-box {
          font-size: 6.8px;
          line-height: 1.25;
          font-weight: 700;
        }

        /* 4 BENEFITS GRID */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          text-align: center;
          margin-bottom: 2mm;
        }
        .benefit-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          border-right: 1px solid #f1f5f9;
          padding: 0 1px;
        }
        .benefit-item:last-child {
          border-right: none;
        }
        .benefit-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .benefit-text {
          font-size: 5.6px;
          font-weight: 800;
          line-height: 1.2;
          color: #000000;
        }

        /* QR CODE & SCAN CTA SECTION */
        .qr-section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.5mm;
        }
        .qr-box {
          width: 37mm;
          height: 37mm;
          background: #ffffff;
          padding: 2px;
          border-radius: 8px;
          border: 2px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
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
          justify-content: space-between;
          height: 37mm;
        }
        .scan-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .scan-icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .scan-titles {
          display: flex;
          flex-direction: column;
        }
        .scan-title-bold {
          font-size: 9.5px;
          font-weight: 900;
          line-height: 1.1;
          color: #000000;
          letter-spacing: 0.3px;
        }
        .scan-desc {
          font-size: 6.2px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
        }
        .qr-illustration-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1px 0;
          height: 38px;
        }
        .pill-serial {
          border-radius: 9999px;
          padding: 3px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px;
          font-weight: 900;
          text-align: center;
          letter-spacing: 0.5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        /* FOOTER BAR */
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
          gap: 5px;
        }
        .shield-icon {
          display: inline-flex;
          align-items: center;
          color: #000000;
        }
        .footer-text {
          font-size: 6.2px;
          font-weight: 900;
          color: #000000;
          line-height: 1.15;
        }
        .footer-right {
          color: #000000;
          display: inline-flex;
          align-items: center;
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
            margin: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
            page-break-inside: avoid !important;
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
            Desain Resmi Organik (Hijau) & Anorganik (Kuning) 1:1 High Fidelity.
          </div>
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

      <script>
        window.onload = function() {
          // Allow fonts and QR images to settle before triggering print dialog
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
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

