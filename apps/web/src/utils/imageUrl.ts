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

  // Normalisasi Mixed Content jika tersimpan sebagai http://berseka.id atau http://157.10.252.252
  if (trimmed.startsWith("http://berseka.id/")) {
    trimmed = trimmed.replace("http://berseka.id/", "https://berseka.id/");
  } else if (trimmed.startsWith("http://157.10.252.252/uploads/")) {
    trimmed = trimmed.replace("http://157.10.252.252", "");
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
  // Cache-busting parameter for /uploads/ to bypass stale browser cache
  const separator = cleanPath.includes("?") ? "&" : "?";
  const finalPath = cleanPath.includes("v=") ? cleanPath : `${cleanPath}${separator}v=20261008c`;
  return `${backendOrigin}${finalPath}`;
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
 * Menghasilkan SVG Data URI representasi visual dokumentasi kegiatan / bukti foto
 * jika berkas foto fisik 404 / koneksi terputus.
 */
export function getDokumentasiFallbackImage(judul: string = "Dokumentasi"): string {
  const safeJudul = judul.length > 30 ? `${judul.slice(0, 27)}...` : judul;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="dokBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#dokBg)" rx="12"/>
    <circle cx="200" cy="115" r="40" fill="#334155" stroke="#475569" stroke-width="2"/>
    <path d="M185 110 h30 M182 115 h36 v22 c0 4 -4 7 -8 7 h-20 c-4 0 -8 -3 -8 -7 z" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="200" cy="126" r="5" fill="#94a3b8"/>
    <line x1="172" y1="87" x2="228" y2="143" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
    <text x="200" y="195" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#e2e8f0">${safeJudul}</text>
    <text x="200" y="222" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">Berkas arsip fisik tidak tersedia</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Event handler onError generik untuk elemen <img> dokumentasi agar beralih ke SVG fallback
 * dan mencegah infinite loop.
 */
export function handleDokumentasiImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  judul: string = "Dokumentasi Kegiatan"
): void {
  const target = event.currentTarget;
  const fallback = getDokumentasiFallbackImage(judul);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

export default resolveImageUrl;

