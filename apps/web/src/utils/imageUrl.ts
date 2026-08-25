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
export function resolveImageUrl(path?: string | null): string {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return "";
  }

  const trimmed = path.trim();

  // Konversi link Google Drive menjadi direct image thumbnail
  if (trimmed.includes("drive.google.com")) {
    const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return trimmed;
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

  // Jika base URL hanya relatif (/api/v1), gunakan origin window jika ada
  if (backendOrigin.startsWith("/")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      // Jika di localhost Vite dev (biasanya port 5173), gunakan port backend 3000 jika hostname localhost
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        backendOrigin = `http://${window.location.hostname}:3000`;
      } else {
        backendOrigin = window.location.origin;
      }
    } else {
      backendOrigin = "";
    }
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
}

export default resolveImageUrl;
