/**
 * Indonesian Month Name to 2-digit representation
 */
const INDONESIAN_MONTHS: Record<string, string> = {
  januari: "01",
  jan: "01",
  january: "01",
  februari: "02",
  feb: "02",
  february: "02",
  maret: "03",
  mar: "03",
  march: "03",
  april: "04",
  apr: "04",
  mei: "05",
  may: "05",
  juni: "06",
  jun: "06",
  june: "06",
  juli: "07",
  jul: "07",
  july: "07",
  agustus: "08",
  agu: "08",
  agt: "08",
  august: "08",
  september: "09",
  sep: "09",
  sept: "09",
  oktober: "10",
  okt: "10",
  oct: "10",
  october: "10",
  november: "11",
  nov: "11",
  desember: "12",
  des: "12",
  dec: "12",
  december: "12",
};

/**
 * Returns today's date in Asia/Jakarta timezone (UTC+7) in YYYY-MM-DD format.
 */
export function getTodayWibDateString(): string {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return nowWib.toISOString().slice(0, 10);
}

/**
 * Parses a date string fragment into YYYY-MM-DD if possible.
 */
function parseSingleDateToken(token: string): string | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  // Pattern A: ISO date YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Pattern B: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Pattern C: Indonesian textual date "25 September 2026" or "25 Sep 2026"
  const indoMatch = trimmed.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (indoMatch) {
    const d = indoMatch[1].padStart(2, "0");
    const monKey = indoMatch[2].toLowerCase();
    const y = indoMatch[3];
    const m = INDONESIAN_MONTHS[monKey];
    if (m) {
      return `${y}-${m}-${d}`;
    }
  }

  // Fallback: Date.parse standard
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Extracts the End Date (Tanggal Akhir Pelaksanaan) of a Program Kerja in YYYY-MM-DD format.
 * Supports:
 * - Date ranges: "2026-09-20 s/d 2026-09-25", "2026-09-20 - 2026-09-25", "20 – 25 September 2026"
 * - Single dates: "2026-09-25", "25 September 2026", "2026-09-25T00:00:00.000Z"
 * Returns null if the date string is absent, invalid, or conditional ("Menyesuaikan", "-").
 */
export function extractProkerEndDate(waktuPelaksanaan: string | null | undefined): string | null {
  if (!waktuPelaksanaan || typeof waktuPelaksanaan !== "string") {
    return null;
  }

  const trimmed = waktuPelaksanaan.trim();
  if (
    !trimmed ||
    trimmed === "-" ||
    trimmed.toLowerCase() === "kondisional" ||
    trimmed.toLowerCase() === "menyesuaikan"
  ) {
    return null;
  }

  // Split by common range delimiters: s/d, sampai, hingga, to, or dashes (- – —)
  const parts = trimmed.split(/\s+(?:s\/d|sampai|hingga|to|[-–—])\s+/i);

  if (parts.length > 1) {
    // If the last part is a complete date (e.g. "2026-09-25" or "25 September 2026")
    const lastPart = parts[parts.length - 1].trim();
    const parsedLast = parseSingleDateToken(lastPart);
    if (parsedLast) {
      return parsedLast;
    }

    // Special case for formats like "20 – 25 September 2026"
    // where the last part might contain month and year, but first part is only day number
    const combinedIndo = lastPart.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
    if (combinedIndo) {
      const d = combinedIndo[1].padStart(2, "0");
      const m = INDONESIAN_MONTHS[combinedIndo[2].toLowerCase()];
      const y = combinedIndo[3];
      if (m) return `${y}-${m}-${d}`;
    }
  }

  // Single date check
  return parseSingleDateToken(trimmed);
}

/**
 * Checks whether a proker has passed its execution end date.
 * A proker is expired ONLY if today's date in WIB is strictly greater than the end date.
 * e.g., if end date is 2026-09-25:
 *   - On 2026-09-25: NOT expired (current date == end date, still allowed)
 *   - On 2026-09-26: EXPIRED (current date > end date)
 *
 * @param waktuPelaksanaan raw date string stored in proker
 * @param referenceDateStr optional YYYY-MM-DD date string to check against (defaults to today WIB)
 */
export function isProkerExpired(
  waktuPelaksanaan: string | null | undefined,
  referenceDateStr?: string
): boolean {
  const endDate = extractProkerEndDate(waktuPelaksanaan);
  if (!endDate) {
    // If end date cannot be determined, do NOT auto-cancel
    return false;
  }

  const todayStr = referenceDateStr || getTodayWibDateString();
  return todayStr > endDate;
}
