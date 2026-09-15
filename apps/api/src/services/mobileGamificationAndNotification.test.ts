import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";
import { calculatePersonalPoints, calculatePersonalPointsForUsers } from "./dplService.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    pointHistory: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    studentKkn: {
      findFirst: vi.fn(),
    },
    studentLeaveRequest: {
      findMany: vi.fn(),
    },
    programKerjaKkn: {
      findMany: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    userNotificationSync: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Mobile Gamification & Personal Point Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculatePersonalPoints should accurately deduct penalty points from total balance", async () => {
    vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
      { points: 4, kategori: "KKN_PRESENSI_HADIR" } as any,
      { points: 3, kategori: "KKN_DURASI_MEMENUHI" } as any,
      { points: 3, kategori: "KKN_LOGBOOK_HARIAN" } as any,
      { points: 2, kategori: "KKN_PROKER" } as any,
      { points: -5, kategori: "PENALTY_OUT_OF_ZONE" } as any,
    ]);

    const result = await calculatePersonalPoints("user-mhs-1");

    expect(result.rawKehadiran).toBe(4);
    expect(result.rawPemenuhanWaktu).toBe(3);
    expect(result.rawLogAktivitas).toBe(3);
    expect(result.poinPenalti).toBe(5);
    // Total: 4 + 3 + 3 + 2 - 5 = 7
    expect(result.personalPoints).toBe(7);
  });

  it("calculatePersonalPointsForUsers should calculate total balance with penalties across multiple users", async () => {
    vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
      { userId: "mhs-1", points: 10 } as any,
      { userId: "mhs-1", points: -3 } as any,
      { userId: "mhs-2", points: 8 } as any,
      { userId: "mhs-2", points: -10 } as any,
    ]);

    const resultMap = await calculatePersonalPointsForUsers(["mhs-1", "mhs-2"]);

    expect(resultMap.get("mhs-1")).toBe(7);
    expect(resultMap.get("mhs-2")).toBe(0);
  });
});
