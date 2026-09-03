/**
 * Test Suite for TransactionController & Sorting Status Fields
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { transactionController } from "./transactionController.js";
import { transactionService } from "../services/transactionService.js";

vi.mock("../services/transactionService.js", () => ({
  transactionService: {
    getDeposits: vi.fn(),
    getMyDeposits: vi.fn(),
    getDepositDetails: vi.fn(),
  },
}));

describe("TransactionController - Sorting Status (is_correct) Response Tests", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: "warga-123" },
      query: {},
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getMyDeposits (GET /api/v1/transactions/my-deposits)", () => {
    it("should return is_correct: true when ai_confidence >= 0.50 and discrepancy is NONE", async () => {
      vi.mocked(transactionService.getMyDeposits).mockResolvedValue([
        {
          id: "dep-1",
          poin: 100,
          berat: 2.5,
          volumeEstimate: 2.5,
          createdAt: new Date("2026-09-03T10:00:00Z"),
          hasilKlasifikasiAi: "organik",
          confidenceAi: 0.64,
          bin: {
            qrCode: "BSK-OGN-001",
            category: { name: "ORGANIK" },
            rw: { name: "RW 01", kelurahan: { name: "Coblong" } },
          },
        },
      ] as any);

      await transactionController.getMyDeposits(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data).toHaveLength(1);

      const item = jsonCall.data[0];
      expect(item.id).toBe("dep-1");
      expect(item.ai_confidence).toBe(0.64);
      expect(item.discrepancy_status).toBe("NONE");
      expect(item.is_correct).toBe(true);
      expect(item.isCorrect).toBe(true);
    });

    it("should return is_correct: false when ai_confidence < 0.50 (e.g. 0.45)", async () => {
      vi.mocked(transactionService.getMyDeposits).mockResolvedValue([
        {
          id: "dep-2",
          poin: 50,
          berat: 1.0,
          createdAt: new Date("2026-09-03T11:00:00Z"),
          hasilKlasifikasiAi: "organik",
          confidenceAi: 0.45,
          bin: {
            qrCode: "BSK-OGN-001",
            category: { name: "ORGANIK" },
            rw: { name: "RW 01", kelurahan: { name: "Coblong" } },
          },
        },
      ] as any);

      await transactionController.getMyDeposits(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = res.json.mock.calls[0][0];
      const item = jsonCall.data[0];
      expect(item.ai_confidence).toBe(0.45);
      expect(item.discrepancy_status).toBe("NONE");
      expect(item.is_correct).toBe(false);
      expect(item.isCorrect).toBe(false);
    });

    it("should return is_correct: false when user throws organic waste into anorganic bin (discrepancy != NONE)", async () => {
      vi.mocked(transactionService.getMyDeposits).mockResolvedValue([
        {
          id: "dep-3",
          poin: 0,
          berat: 1.5,
          createdAt: new Date("2026-09-03T12:00:00Z"),
          hasilKlasifikasiAi: "organik",
          confidenceAi: 0.92,
          bin: {
            qrCode: "BSK-AGN-002",
            category: { name: "ANORGANIK" },
            rw: { name: "RW 01", kelurahan: { name: "Coblong" } },
          },
        },
      ] as any);

      await transactionController.getMyDeposits(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = res.json.mock.calls[0][0];
      const item = jsonCall.data[0];
      expect(item.ai_confidence).toBe(0.92);
      expect(item.discrepancy_status).toBe("MISMATCH");
      expect(item.is_correct).toBe(false);
      expect(item.isCorrect).toBe(false);
    });
  });

  describe("getDepositDetails (GET /api/v1/transactions/:id)", () => {
    it("should return is_correct and AI data on deposit detail", async () => {
      req.params = { id: "dep-1" };
      vi.mocked(transactionService.getDepositDetails).mockResolvedValue({
        id: "dep-1",
        poin: 100,
        berat: 2.5,
        hasilKlasifikasiAi: "organik",
        confidenceAi: 0.88,
        createdAt: new Date("2026-09-03T10:00:00Z"),
        warga: { name: "Budi", phone: "08123" },
        bin: {
          qrCode: "BSK-OGN-001",
          category: { name: "ORGANIK" },
          rw: { name: "RW 01", kelurahan: { name: "Coblong" } },
        },
      } as any);

      await transactionController.getDepositDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.data.ai_confidence).toBe(0.88);
      expect(jsonCall.data.discrepancy_status).toBe("NONE");
      expect(jsonCall.data.is_correct).toBe(true);
    });
  });
});
