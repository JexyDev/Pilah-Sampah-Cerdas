/**
 * Unit Test for Baseline Waste Data & Actual Trends Endpoints
 * Endpoint: GET /api/v1/waste/baseline & GET /api/v1/waste/actual-trends
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiController } from "./aiController.js";
import { prisma } from "../lib/prisma.js";
import { dashboardService } from "../services/dashboardService.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    surveiKelurahan: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../services/dashboardService.js", () => ({
  dashboardService: {
    getTrend: vi.fn(),
  },
}));

describe("AiController - Waste Baseline & Actual Trends", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: "user-dlh-123", role: "ADMIN_DLH" },
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("GET /api/v1/waste/baseline", () => {
    it("harus mengembalikan data baseline statis Juli 2026 untuk 6 kelurahan Coblong", async () => {
      (prisma.surveiKelurahan.findMany as any).mockResolvedValue([
        {
          kelurahanId: 3,
          namaKelurahan: "Sekeloa",
          jumlahRw: 16,
          jumlahRt: 93,
          pemilahanSampah: {
            jumlahRumahMemilah: 921,
            totalJumlahRumahDiRw: 5173,
            persentasePemilahan: "0.178",
          },
          volumeSampah: {
            organikKgPerHari: "6482.27",
            anorganikKgPerHari: "3241.13",
            residuKgPerHari: "1080.38",
            totalVolumeKgPerHari: "10803.78",
          },
        },
      ]);

      await aiController.getBaseline(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(jsonResponse.data.periode).toBe("Juli 2026");
      expect(jsonResponse.data.cakupanSampel).toBe("24 RW Binaan KKN (Coblong)");
      expect(jsonResponse.data.summary.avgKepatuhanBaseline).toBe(17.1);
      expect(jsonResponse.data.summary.avgKepatuhanGrafik).toBe(17.8);
      expect(jsonResponse.data.summary.rwKepatuhanTinggi).toBe(24);
      expect(jsonResponse.data.summary.totalKelurahan).toBe(6);
      expect(jsonResponse.data.summary.totalVolumeBaselineKg).toBe(1670.5);

      const sekeloa = jsonResponse.data.kelurahan.find((k: any) => k.kelurahan === "Sekeloa");
      expect(sekeloa).toBeDefined();
      expect(sekeloa.kepatuhanBaseline).toBe(17.8);
      expect(sekeloa.volumeBaselineKg).toBe(421);
      expect(sekeloa.rwKepatuhanTinggi).toBe(5);

      // Pastikan ada catatan kaki anti-miskomunikasi
      expect(jsonResponse.data.catatanKaki).toContain("Data baseline diambil selama kegiatan survei lapangan KKN (Juli 2026)");
      expect(jsonResponse.data.keterangan).toContain("Data baseline dihimpun melalui survei sampel lapangan giat KKN pada Juli 2026");
    });
  });

  describe("GET /api/v1/waste/actual-trends", () => {
    it("harus memanggil dashboardService.getTrend dan mengembalikan data tren", async () => {
      req.query = { weeks: "4", wilayah: "Dago" };
      (dashboardService.getTrend as any).mockResolvedValue([
        { label: "Minggu 1", organic: 120, inorganic: 80, weight: 200 },
      ]);

      await aiController.getActualTrends(req, res);

      expect(dashboardService.getTrend).toHaveBeenCalledWith(4, "Dago");
      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(jsonResponse.data).toHaveLength(1);
    });
  });
});
