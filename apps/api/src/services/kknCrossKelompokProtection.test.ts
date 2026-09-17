import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma directly inside factory
vi.mock("../lib/prisma.js", () => {
  const mockObj: any = {
    $transaction: vi.fn(async (cb: any) => cb(mockObj)),
    user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    studentKkn: { findUnique: vi.fn(), findFirst: vi.fn() },
    bin: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    binOwnership: { findFirst: vi.fn(), create: vi.fn() },
    pointHistory: { create: vi.fn() },
    household: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn().mockResolvedValue({}) },
    rw: { findUnique: vi.fn() },
  };
  return {
    prisma: mockObj,
    default: mockObj,
  };
});

vi.mock("./redisService", () => ({
  redisService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("./firebaseService", () => ({
  sendPushNotification: vi.fn().mockResolvedValue(true),
}));

import { prisma } from "../lib/prisma.js";
import { kknService } from "./kknService";

describe("KKN Cross-Kelompok Protection Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activateByScan should reject activation if bin belongs to another kelompok", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "warga-1",
      name: "Pak Budi",
      rwId: 77,
    } as any);

    vi.mocked(prisma.bin.findUnique).mockResolvedValueOnce({
      id: "bin-10",
      qrCode: "BSK-OGN-060926-0466",
      userId: null,
      status: "PRINTED",
      kelompokId: "kelompok-10",
      rwId: 77,
    } as any);

    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValueOnce({
      id: "mhs-7",
      userId: "user-mhs-7",
      kelompokId: "kelompok-7",
      assignedRwId: 12,
    } as any);

    await expect(
      kknService.activateByScan("warga-1", "BSK-OGN-060926-0466", -6.89, 107.62, "user-mhs-7")
    ).rejects.toThrow(/bukan milik kelompok KKN Anda/);
  });

  it("activateByScan should allow activation if bin belongs to same kelompok", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "warga-1",
      name: "Pak Budi",
      rwId: 77,
    } as any);

    vi.mocked(prisma.bin.findUnique).mockResolvedValueOnce({
      id: "bin-10",
      qrCode: "BSK-OGN-060926-0466",
      userId: null,
      status: "PRINTED",
      kelompokId: "kelompok-10",
      rwId: 77,
    } as any);

    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValueOnce({
      id: "mhs-10",
      userId: "user-mhs-10",
      kelompokId: "kelompok-10",
      assignedRwId: 77,
    } as any);

    vi.mocked(prisma.bin.update).mockResolvedValueOnce({
      id: "bin-10",
      status: "ACTIVE_BOUND",
    } as any);
    vi.mocked(prisma.binOwnership.findFirst).mockResolvedValueOnce(null as any);
    vi.mocked(prisma.binOwnership.create).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.household.findFirst).mockResolvedValueOnce({ id: "hh-1", userId: "warga-1" } as any);

    const res = await kknService.activateByScan("warga-1", "BSK-OGN-060926-0466", -6.89, 107.62, "user-mhs-10");
    expect(prisma.bin.update).toHaveBeenCalled();
  });

  it("claimWargaMandiri should reject claim if warga bin belongs to another kelompok", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "warga-1",
      name: "Pak Budi",
      rwId: 77,
    } as any);

    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValueOnce({
      id: "mhs-7",
      userId: "user-mhs-7",
      kelompokId: "kelompok-7",
    } as any);

    vi.mocked(prisma.bin.findMany).mockResolvedValueOnce([
      {
        id: "bin-10",
        qrCode: "BSK-OGN-060926-0466",
        status: "ACTIVE_BOUND",
        registeredByStudentId: null,
        kelompokId: "kelompok-10",
        rwId: 77,
      } as any,
    ]);

    await expect(
      kknService.claimWargaMandiri("user-mhs-7", "warga-1")
    ).rejects.toThrow(/terdaftar pada kelompok KKN lain/);
  });

  it("claimWargaMandiri should allow claim if warga bin belongs to same kelompok", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "warga-1",
      name: "Pak Budi",
      rwId: 77,
    } as any);

    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValueOnce({
      id: "mhs-10",
      userId: "user-mhs-10",
      kelompokId: "kelompok-10",
    } as any);

    vi.mocked(prisma.bin.findMany).mockResolvedValueOnce([
      {
        id: "bin-10",
        qrCode: "BSK-OGN-060926-0466",
        status: "ACTIVE_BOUND",
        registeredByStudentId: null,
        kelompokId: "kelompok-10",
        rwId: 77,
      } as any,
    ]);

    vi.mocked(prisma.bin.updateMany).mockResolvedValueOnce({ count: 1 } as any);
    vi.mocked(prisma.pointHistory.create).mockResolvedValueOnce({} as any);

    const res = await kknService.claimWargaMandiri("user-mhs-10", "warga-1");
    expect(res.claimedBinsCount).toBe(1);
    expect(prisma.bin.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["bin-10"] } },
      data: { registeredByStudentId: "user-mhs-10", kelompokId: "kelompok-10" },
    });
  });
});
