/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { residuService } from "./residuService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => {
  const mPrisma = {
    binResetRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    pointHistory: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }),
    },
    $transaction: vi.fn(async (cb) => cb(mPrisma)),
  };

  return {
    prisma: mPrisma,
  };
});

vi.mock("./configService.js", () => ({
  configService: {
    getConfig: vi.fn().mockResolvedValue("2"),
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendWhatsApp: vi.fn(),
  },
}));

vi.mock("./websocketService.js", () => ({
  websocketService: {
    broadcastPetugasNotification: vi.fn(),
  },
}));

describe("ResiduService - acceptPengajuanResetBin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reward +15 points to Petugas UserId when accepting a valid PENDING reset bin request", async () => {
    const mockRequest = {
      id: "req-123",
      binId: "bin-abc",
      userId: "warga-1",
      status: "PENDING",
      bin: { id: "bin-abc", qrCode: "QR-BIN-123" },
    };

    vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.binResetRequest.update).mockResolvedValue({
      ...mockRequest,
      status: "IN_PROGRESS",
      reviewedById: "petugas-user-1",
    } as any);
    vi.mocked(prisma.pointHistory.create).mockResolvedValue({ id: "pt-1" } as any);

    const result = await residuService.acceptPengajuanResetBin("req-123", "petugas-user-1");

    expect(prisma.binResetRequest.update).toHaveBeenCalledWith({
      where: { id: "req-123" },
      data: {
        status: "IN_PROGRESS",
        reviewedById: "petugas-user-1",
      },
    });

    expect(prisma.pointHistory.create).toHaveBeenCalledWith({
      data: {
        userId: "petugas-user-1",
        points: 15,
        description: "Reward validasi pengosongan tempat sampah (QR-BIN-123)",
        kategori: "VALIDASI_PENGOSONGAN",
        redeemable: false,
      },
    });

    expect(result.status).toBe("IN_PROGRESS");
  });

  it("should throw error if request is not found or already taken", async () => {
    vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(null);

    await expect(
      residuService.acceptPengajuanResetBin("req-nonexistent", "petugas-user-1")
    ).rejects.toThrow("PENGAJUAN_NOT_FOUND");

    vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue({
      id: "req-123",
      status: "IN_PROGRESS",
    } as any);

    await expect(
      residuService.acceptPengajuanResetBin("req-123", "petugas-user-1")
    ).rejects.toThrow("PERMINTAAN_SUDAH_DIAMBIL");
  });
});
