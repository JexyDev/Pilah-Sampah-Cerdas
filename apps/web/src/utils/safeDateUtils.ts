/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Safe Date Formatting Utility for Safari WebKit & Cross-Browser Stability
 * Mencegah uncaught RangeError: "date value is not finite in DateTimeFormat.format()" pada Safari.
 */

/**
 * Mengubah string tanggal sembarang menjadi Date object yang valid,
 * menormalisasi format dengan spasi ("YYYY-MM-DD HH:mm:ss") menjadi ISO ("YYYY-MM-DDTHH:mm:ss").
 */
export function parseSafeDate(rawDate?: string | Date | number | null): Date | null {
  if (!rawDate || rawDate === "-" || rawDate === "null" || rawDate === "undefined") {
    return null;
  }

  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? null : rawDate;
  }

  if (typeof rawDate === "number") {
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof rawDate === "string") {
    const trimmed = rawDate.trim();
    if (!trimmed || trimmed === "-" || trimmed === "Invalid Date") return null;

    // Normalisasi format "2026-08-25 10:30:00" -> "2026-08-25T10:30:00" agar kompatibel di Safari
    let normalized = trimmed;
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed)) {
      normalized = trimmed.replace(/\s+/, "T");
    }

    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d;
    }

    // Fallback coba parsing YYYY-MM-DD murni jika ada suffix aneh
    const dateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const dFallback = new Date(dateMatch[1]);
      if (!isNaN(dFallback.getTime())) return dFallback;
    }
  }

  return null;
}

/**
 * Format tanggal pendek aman: "7 Sep" atau "7 Sep 2026"
 */
export function safeFormatDateShort(
  rawDate?: string | Date | number | null,
  includeYear: boolean = false,
  fallback: string = "-"
): string {
  const d = parseSafeDate(rawDate);
  if (!d) return fallback;

  try {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    if (includeYear) {
      options.year = "numeric";
    }
    return d.toLocaleDateString("id-ID", options);
  } catch {
    return fallback;
  }
}

/**
 * Format tanggal lengkap aman: "Senin, 7 September 2026"
 */
export function safeFormatDateLong(
  rawDate?: string | Date | number | null,
  includeWeekday: boolean = true,
  fallback: string = "-"
): string {
  const d = parseSafeDate(rawDate);
  if (!d) return fallback;

  try {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    if (includeWeekday) {
      options.weekday = "long";
    }
    return d.toLocaleDateString("id-ID", options);
  } catch {
    return fallback;
  }
}

/**
 * Format jam aman: "10:30 WIB" atau "10:30"
 */
export function safeFormatTime(
  rawDate?: string | Date | number | null,
  includeWib: boolean = true,
  fallback: string = "-"
): string {
  const d = parseSafeDate(rawDate);
  if (!d) return fallback;

  try {
    const timeStr = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return includeWib ? `${timeStr} WIB` : timeStr;
  } catch {
    return fallback;
  }
}

/**
 * Format toDateString aman untuk perbandingan tanggal
 */
export function safeToDateString(
  rawDate?: string | Date | number | null,
  fallback: string = ""
): string {
  const d = parseSafeDate(rawDate);
  if (!d) return fallback;
  try {
    return d.toDateString();
  } catch {
    return fallback;
  }
}