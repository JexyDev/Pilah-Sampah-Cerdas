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
    user: { findUnique: vi.fn() },
    petugasResidu: { findUnique: vi.fn(), create: vi.fn() },
    setoranManual: { findMany: vi.fn() },
    violation: { count: vi.fn(), findMany: vi.fn() },
    bin: { count: vi.fn() },
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
    getConfig: vi.fn().mockResolvedValue("5"),
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

  it("should reward +5 points to Petugas UserId when accepting a valid PENDING reset bin request", async () => {
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
        points: 5,
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

describe("ResiduService - getDashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate and return weeklyWeightKg alongside todayWeightKg and monthlyWeightKg", async () => {
    const mockPetugas = {
      id: "ptr-uuid-123456",
      userId: "petugas-user-1",
      nama: "Petugas Lapangan 1",
      whitelistStatus: "APPROVED",
      assignedZone: "RW 03",
      kpiScore: 92,
    };

    const mockUser = {
      id: "petugas-user-1",
      name: "Petugas Lapangan 1",
      phone: "081234567890",
      status: "ACTIVE",
      rw: { name: "RW 03", kelurahan: { name: "Coblong" } },
      petugasProfile: mockPetugas,
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    // Mock 3 distinct calls to setoranManual.findMany (today, weekly, monthly)
    vi.mocked(prisma.setoranManual.findMany)
      .mockResolvedValueOnce([{ id: "s-1", berat: 12.5 }] as any) // today
      .mockResolvedValueOnce([{ id: "s-1", berat: 12.5 }, { id: "s-2", berat: 35.0 }] as any) // weekly
      .mockResolvedValueOnce([{ id: "s-1", berat: 12.5 }, { id: "s-2", berat: 35.0 }, { id: "s-3", berat: 50.0 }] as any); // monthly

    vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({ _sum: { points: 150 } } as any);
    vi.mocked(prisma.violation.count).mockResolvedValue(1);
    vi.mocked(prisma.violation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.bin.count).mockResolvedValue(15);

    const result = await residuService.getDashboardSummary("petugas-user-1");

    expect(result.todayWeightKg).toBe(12.5);
    expect(result.weeklyWeightKg).toBe(47.5);
    expect(result.monthlyWeightKg).toBe(97.5);
    expect(result.totalWeightKg).toBe(12.5);
    expect(result.name).toBe("Petugas Lapangan 1");
    expect(result.petugasId).toBe("PTR-PTR-UU");
  });
});
