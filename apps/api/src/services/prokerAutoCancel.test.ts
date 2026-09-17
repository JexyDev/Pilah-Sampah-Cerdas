import { describe, it, expect } from "vitest";
import {
  extractProkerEndDate,
  isProkerExpired,
  getTodayWibDateString,
} from "../utils/prokerDateUtils.js";

describe("prokerDateUtils - Date Extraction and Expiration Check", () => {
  describe("extractProkerEndDate", () => {
    it("should extract end date from ISO range with 's/d'", () => {
      const result = extractProkerEndDate("2026-09-20 s/d 2026-09-25");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from ISO range with '-'", () => {
      const result = extractProkerEndDate("2026-09-20 - 2026-09-25");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from ISO range with en-dash '–'", () => {
      const result = extractProkerEndDate("2026-09-20 \u2013 2026-09-25");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from single ISO date", () => {
      const result = extractProkerEndDate("2026-09-25");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from ISO datetime string", () => {
      const result = extractProkerEndDate("2026-09-25T00:00:00.000Z");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from Indonesian date range: '20 \u2013 25 September 2026'", () => {
      const result = extractProkerEndDate("20 \u2013 25 September 2026");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from Indonesian date range: '20 September 2026 - 25 September 2026'", () => {
      const result = extractProkerEndDate("20 September 2026 - 25 September 2026");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from Indonesian single date: '25 September 2026'", () => {
      const result = extractProkerEndDate("25 September 2026");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from Indonesian abbreviation: '25 Sep 2026'", () => {
      const result = extractProkerEndDate("25 Sep 2026");
      expect(result).toBe("2026-09-25");
    });

    it("should extract end date from slash format '20/09/2026 s/d 25/09/2026'", () => {
      const result = extractProkerEndDate("20/09/2026 s/d 25/09/2026");
      expect(result).toBe("2026-09-25");
    });

    it("should return null for non-date / conditional strings", () => {
      expect(extractProkerEndDate(null)).toBeNull();
      expect(extractProkerEndDate(undefined)).toBeNull();
      expect(extractProkerEndDate("")).toBeNull();
      expect(extractProkerEndDate("-")).toBeNull();
      expect(extractProkerEndDate("Kondisional")).toBeNull();
      expect(extractProkerEndDate("Menyesuaikan")).toBeNull();
      expect(extractProkerEndDate("Belum ditentukan")).toBeNull();
    });
  });

  describe("isProkerExpired - Business Rule Verification", () => {
    // Skenario Spesifikasi:
    // Mahasiswa mengajukan proker pada 1 September untuk dilaksanakan 20-25 September.
    // DPL menyetujui pada 2 September.
    const waktuPelaksanaan = "2026-09-20 s/d 2026-09-25";

    it("Aturan lama (7 September): Tidak boleh batal lagi pada H+5 setelah disetujui", () => {
      const referenceDate = "2026-09-07"; // 5 hari setelah approved pada 2 September
      expect(isProkerExpired(waktuPelaksanaan, referenceDate)).toBe(false);
    });

    it("Sebelum pelaksanaan (19 September): Proker standby, tidak batal", () => {
      const referenceDate = "2026-09-19";
      expect(isProkerExpired(waktuPelaksanaan, referenceDate)).toBe(false);
    });

    it("Hari pertama pelaksanaan (20 September): Proker standby, tidak batal", () => {
      const referenceDate = "2026-09-20";
      expect(isProkerExpired(waktuPelaksanaan, referenceDate)).toBe(false);
    });

    it("Hari terakhir pelaksanaan (25 September): Proker standby, masih boleh dimulai", () => {
      const referenceDate = "2026-09-25";
      expect(isProkerExpired(waktuPelaksanaan, referenceDate)).toBe(false);
    });

    it("Lewat batas akhir pelaksanaan (26 September): Proker otomatis KADALUARSA / BATAL", () => {
      const referenceDate = "2026-09-26";
      expect(isProkerExpired(waktuPelaksanaan, referenceDate)).toBe(true);
    });

    it("Jauh setelah batas akhir (1 Oktober): Proker kadaluarsa", () => {
      const referenceDate = "2026-10-01";
      expect(isProkerExpired(waktuPelaksanaan, referenceDate)).toBe(true);
    });

    it("Single date proker (2026-09-20): standby on 20 Sep, expired on 21 Sep", () => {
      const singleDate = "2026-09-20";
      expect(isProkerExpired(singleDate, "2026-09-20")).toBe(false);
      expect(isProkerExpired(singleDate, "2026-09-21")).toBe(true);
    });

    it("Proker tanpa tanggal pelaksanaan yang valid: TIDAK pernah dibatalkan otomatis", () => {
      expect(isProkerExpired(null, "2026-09-26")).toBe(false);
      expect(isProkerExpired("Menyesuaikan", "2026-09-26")).toBe(false);
      expect(isProkerExpired("-", "2026-09-26")).toBe(false);
    });
  });
});
