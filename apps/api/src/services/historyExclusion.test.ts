/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { historyCutoffService } from "./historyCutoffService.js";
import { historyController } from "../controllers/historyController.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      userHiddenHistoryItem: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

describe("History Exclusion (Hapus 1-1 & Multi-Select)", () => {
  const mockUserId = "user-uuid-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("historyCutoffService.normalizeItemType", () => {
    it("should normalize singular and plural item types correctly", () => {
      expect(historyCutoffService.normalizeItemType("POINT")).toBe("POINT");
      expect(historyCutoffService.normalizeItemType("POINTS")).toBe("POINT");
      expect(historyCutoffService.normalizeItemType("waste_deposit")).toBe("WASTE_DEPOSIT");
      expect(historyCutoffService.normalizeItemType("WASTE_DEPOSITS")).toBe("WASTE_DEPOSIT");
      expect(historyCutoffService.normalizeItemType("kkn_activity")).toBe("KKN_ACTIVITY");
      expect(historyCutoffService.normalizeItemType("KKN_ACTIVITIES")).toBe("KKN_ACTIVITY");
      expect(historyCutoffService.normalizeItemType("petugas_task")).toBe("PETUGAS_TASK");
      expect(historyCutoffService.normalizeItemType("PETUGAS_TASKS")).toBe("PETUGAS_TASK");
    });
  });

  describe("historyCutoffService.excludeItems", () => {
    it("should return 0 when itemIds is empty", async () => {
      const count = await historyCutoffService.excludeItems(mockUserId, "POINT", []);
      expect(count).toBe(0);
      expect((prisma as any).userHiddenHistoryItem.upsert).not.toHaveBeenCalled();
    });

    it("should upsert each item and return total excluded count", async () => {
      (prisma as any).userHiddenHistoryItem.upsert.mockResolvedValue({});

      const count = await historyCutoffService.excludeItems(mockUserId, "POINT", ["id-1", "id-2", "id-3"]);

      expect(count).toBe(3);
      expect((prisma as any).userHiddenHistoryItem.upsert).toHaveBeenCalledTimes(3);
      expect((prisma as any).userHiddenHistoryItem.upsert).toHaveBeenCalledWith({
        where: {
          userId_itemType_itemId: {
            userId: mockUserId,
            itemType: "POINT",
            itemId: "id-1",
          },
        },
        update: { hiddenAt: expect.any(Date) },
        create: {
          userId: mockUserId,
          itemType: "POINT",
          itemId: "id-1",
          hiddenAt: expect.any(Date),
        },
      });
    });
  });

  describe("historyCutoffService.getExcludedItemIds", () => {
    it("should return array of excluded item IDs", async () => {
      (prisma as any).userHiddenHistoryItem.findMany.mockResolvedValue([
        { itemId: "id-100" },
        { itemId: "id-200" },
      ]);

      const result = await historyCutoffService.getExcludedItemIds(mockUserId, "POINT");

      expect(result).toEqual(["id-100", "id-200"]);
      expect((prisma as any).userHiddenHistoryItem.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          itemType: "POINT",
        },
        select: { itemId: true },
      });
    });
  });

  describe("historyController", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = { user: null, body: { itemType: "POINT", itemIds: ["id-1"] } } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await historyController.excludeItems(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should return 400 if itemType is missing", async () => {
      const req = { user: { id: mockUserId }, body: { itemIds: ["id-1"] } } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await historyController.excludeItems(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should successfully exclude items and return 200 with count", async () => {
      (prisma as any).userHiddenHistoryItem.upsert.mockResolvedValue({});

      const req = {
        user: { id: mockUserId },
        body: { itemType: "POINT", itemIds: ["id-1", "id-2"] },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await historyController.excludeItems(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "2 item riwayat berhasil disembunyikan dari akun Anda",
        data: {
          itemType: "POINT",
          excludedCount: 2,
        },
      });
    });

    it("should support single itemId via DELETE /api/v1/history/exclude/:itemType/:itemId", async () => {
      (prisma as any).userHiddenHistoryItem.upsert.mockResolvedValue({});

      const req = {
        user: { id: mockUserId },
        params: { itemType: "WASTE_DEPOSIT", itemId: "deposit-uuid-456" },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await historyController.deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Item riwayat berhasil disembunyikan",
      });
      expect((prisma as any).userHiddenHistoryItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_itemType_itemId: {
              userId: mockUserId,
              itemType: "WASTE_DEPOSIT",
              itemId: "deposit-uuid-456",
            },
          },
        })
      );
    });
  });
});
