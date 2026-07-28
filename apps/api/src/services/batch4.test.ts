/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { systemService } from "./systemService.js";

const mockCreate = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@prisma/client", () => {
  const mPrisma = {
    auditTrail: {
      findMany: (...args: any[]) => mockFindMany(...args),
    },
    socialFeed: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
    },
  };

  return {
    PrismaClient: class {
      auditTrail = mPrisma.auditTrail;
      socialFeed = mPrisma.socialFeed;
    },
  };
});

describe("Batch 4 Penyempurnaan Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("systemService", () => {
    it("should fetch all audit trails for admin view", async () => {
      mockFindMany.mockResolvedValueOnce([{ id: "log-1", action: "APPROVE_KKN" }]);

      const logs = await systemService.getAuditTrails();

      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("APPROVE_KKN");
      expect(mockFindMany).toHaveBeenCalled();
    });

    it("should create and fetch social feed activities", async () => {
      mockCreate.mockResolvedValue({
        id: "post-1",
        tipe: "MAGGOT_HARVEST",
        deskripsi: "Harvested 5kg maggot",
      });
      mockFindMany.mockResolvedValue([{ id: "post-1", tipe: "MAGGOT_HARVEST" }]);

      const created = await systemService.createSocialFeed(
        "user-1",
        "MAGGOT_HARVEST",
        "Harvested 5kg maggot"
      );
      const feed = await systemService.getSocialFeed();

      expect(created.tipe).toBe("MAGGOT_HARVEST");
      expect(feed.length).toBe(1);
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe("aiService - estimateVolume", () => {
    it("should return random length, width, height, and calculate volume", async () => {
      const { aiService } = await import("./aiService.js");
      const res = await aiService.estimateVolume("test-image.jpg");

      expect(res.imageUrl).toBe("test-image.jpg");
      expect(res.lengthCm).toBeGreaterThanOrEqual(30);
      expect(res.volumeLiters).toBe(
        parseFloat(((res.lengthCm * res.widthCm * res.heightCm) / 1000).toFixed(2))
      );
    });
  });
});
