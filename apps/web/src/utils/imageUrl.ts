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
      backendOrigin = window.location.origin;
    } else {
      backendOrigin = "";
    }
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
}

export default resolveImageUrl;
