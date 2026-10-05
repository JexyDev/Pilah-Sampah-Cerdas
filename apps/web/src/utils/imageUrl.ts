/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility untuk konversi URL gambar / dokumen bukti ke URL backend yang valid.
 */

import { getApiBaseUrl } from "./api";

/**
 * Mengubah path relatif (seperti '/uploads/foto.jpg' atau 'uploads/foto.jpg')
 * menjadi URL absolut yang valid mengarah ke backend server.
 */
export function resolveImageUrl(path?: string | null, convertHeic: boolean = true): string {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return "";
  }

  let trimmed = path.trim();

  // Otomatis ubah ekstensi .heic / .heif menjadi .jpg agar selalu kompatibel di browser web jika convertHeic = true
  if (convertHeic) {
    trimmed = trimmed.replace(/\.(heic|heif)$/i, ".jpg");
  }

  // Konversi link Google Drive menjadi direct image thumbnail
  if (trimmed.includes("drive.google.com")) {
    const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return trimmed;
  }

  // Jika URL mengarah ke port 3000 pada localhost / IP VPS tetapi browser sedang membuka lewat domain / reverse proxy:
  // Normalisasi ke path relatif /uploads/... agar tidak terkena Mixed Content (HTTP vs HTTPS)
  if (trimmed.includes(":3000/uploads/")) {
    trimmed = trimmed.substring(trimmed.indexOf("/uploads/"));
  }

  // Jika sudah URL absolut (http, https, blob, data), kembalikan langsung
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Normalisasi path upload: jika berformat nama file langsung (misal: '1789533802138-...jpg' atau 'uploads/...'):
  if (trimmed.startsWith("uploads/")) {
    trimmed = `/${trimmed}`;
  } else if (
    !trimmed.includes("/") &&
    /\.(jpg|jpeg|png|webp|svg|gif|heic|heif|pdf)$/i.test(trimmed)
  ) {
    trimmed = `/uploads/${trimmed}`;
  } else if (
    /^\/\d{10,}-[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|svg|gif|heic|heif)$/i.test(trimmed) &&
    !trimmed.startsWith("/uploads/")
  ) {
    trimmed = `/uploads${trimmed}`;
  }

  // Dapatkan base URL backend (hapus suffix /api/v1 atau /api)
  const apiBase = getApiBaseUrl();
  let backendOrigin = apiBase.replace(/\/api(\/v1)?\/?$/, "");

  // Jika backendOrigin kosong atau hanya path relatif (/api/v1), tentukan origin yang sesuai
  if (!backendOrigin || backendOrigin.startsWith("/")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        backendOrigin = `http://${window.location.hostname}:3000`;
      } else {
        // Pada VPS atau domain: jika diakses via port Vite langsung (5173 / 5174), arahkan ke backend port 3000
        if (window.location.port === "5173" || window.location.port === "5174") {
          backendOrigin = `${window.location.protocol}//${window.location.hostname}:3000`;
        } else {
          backendOrigin = window.location.origin;
        }
      }
    } else {
      backendOrigin = "";
    }
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
}

/**
 * Menghasilkan SVG Data URI representasi visual Posko KKN sebagai fallback
 * jika foto posko gagal dimuat / 404 / koneksi terputus.
 */
export function getPoskoFallbackImage(nama: string = "Posko KKN"): string {
  const clean = nama.replace(/Posko\s*KKN\s*/i, "").trim() || "Posko";
  const safeName = clean.length > 28 ? `${clean.slice(0, 25)}...` : clean;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="poskoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3730a3"/>
        <stop offset="50%" stop-color="#4f46e5"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
      <pattern id="poskoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#poskoGrad)"/>
    <rect width="100%" height="100%" fill="url(#poskoGrid)"/>
    <circle cx="400" cy="170" r="54" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    <path d="M375 175 L400 150 L425 175 L418 175 L418 200 L382 200 L382 175 Z" fill="#ffffff"/>
    <rect x="394" y="183" width="12" height="17" rx="1" fill="#4338ca"/>
    <text x="400" y="265" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="1">DOKUMENTASI POSKO KKN</text>
    <text x="400" y="297" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#c7d2fe">${safeName}</text>
    <rect x="320" y="320" width="160" height="24" rx="12" fill="rgba(255,255,255,0.15)"/>
    <text x="400" y="336" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#ffffff">KECAMATAN COBLONG</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Event handler onError untuk elemen <img> posko agar otomatis beralih ke SVG fallback
 * dan mencegah infinite error loop di browser.
 */
export function handlePoskoImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  nama: string = "Posko KKN"
): void {
  const target = event.currentTarget;
  const fallback = getPoskoFallbackImage(nama);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

/**
 * Menghasilkan SVG Data URI representasi visual Fasilitas Pengelolaan Sampah sebagai fallback
 * jika foto fasilitas 404 / belum tersedia / jaringan terputus.
 */
export function getFacilityFallbackImage(
  jenis: string = "fasilitas",
  nama: string = "Fasilitas Pengelolaan Sampah"
): string {
  const cleanJenis = (jenis || "").toLowerCase().replace(/_/g, " ");
  const cleanNama = (nama || "Fasilitas").trim();
  const safeName = cleanNama.length > 28 ? `${cleanNama.slice(0, 25)}...` : cleanNama;

  let gradStart = "#059669"; // Emerald (Bank Sampah / Default)
  let gradEnd = "#064e3b";
  let labelBadge = "BANK SAMPAH";

  if (cleanJenis.includes("maggot")) {
    gradStart = "#d97706"; // Amber
    gradEnd = "#78350f";
    labelBadge = "RUMAH MAGGOT";
  } else if (cleanJenis.includes("kompos") || cleanJenis.includes("loseda") || cleanJenis.includes("bata")) {
    gradStart = "#0d9488"; // Teal
    gradEnd = "#134e4a";
    labelBadge = "PENGOMPOSAN";
  } else if (cleanJenis.includes("buruan") || cleanJenis.includes("garden") || cleanJenis.includes("tanaman") || cleanJenis.includes("poc")) {
    gradStart = "#16a34a"; // Green
    gradEnd = "#14532d";
    labelBadge = "BURUAN SAE / ORGANIK";
  } else if (cleanJenis.includes("tps") || cleanJenis.includes("roda")) {
    gradStart = "#475569"; // Slate
    gradEnd = "#1e293b";
    labelBadge = "TPS / PENGUMPULAN";
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="facGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradStart}"/>
        <stop offset="100%" stop-color="${gradEnd}"/>
      </linearGradient>
      <pattern id="facGrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#facGrad)"/>
    <rect width="100%" height="100%" fill="url(#facGrid)"/>
    <circle cx="400" cy="170" r="54" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <path d="M375 180 L400 145 L425 180 L415 180 L415 200 L385 200 L385 180 Z" fill="#ffffff"/>
    <text x="400" y="265" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff" letter-spacing="1">DOKUMENTASI FASILITAS</text>
    <text x="400" y="297" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">${safeName}</text>
    <rect x="290" y="320" width="220" height="26" rx="13" fill="rgba(255,255,255,0.2)"/>
    <text x="400" y="337" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="0.5">${labelBadge}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Event handler onError untuk elemen <img> fasilitas agar otomatis beralih ke SVG fallback
 */
export function handleFacilityImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  jenis: string = "fasilitas",
  nama: string = "Fasilitas Pengelolaan Sampah"
): void {
  const target = event.currentTarget;
  const fallback = getFacilityFallbackImage(jenis, nama);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

export default resolveImageUrl;

