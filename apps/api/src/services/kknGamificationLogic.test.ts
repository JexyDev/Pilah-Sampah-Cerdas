import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      kelompokKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      programKerjaKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue({}),
      },
      studentKkn: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      bin: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      pointHistory: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "pt-1" }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }),
      },
      pemanfaatan: {
        create: vi.fn().mockResolvedValue({ id: "pem-1" }),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: "pem-1" }),
        delete: vi.fn().mockResolvedValue({ id: "pem-1" }),
      },
      notification: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      schedule: {
        findUnique: vi.fn(),
      },
      activityAttendance: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      logbookDpl: {
        count: vi.fn().mockResolvedValue(0),
      },
    },
  };
});

// Mock notificationIntegrationService
vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendToUsers: vi.fn().mockResolvedValue(true),
  },
}));

// Mock configService
vi.mock("./configService.js", () => ({
  configService: {
    getConfig: vi.fn().mockResolvedValue(null),
    getRuleEngineConfigs: vi.fn().mockResolvedValue({
      attendanceOutOfZonePenaltyActive: true,
      attendanceOutOfZonePenaltyPoints: 10,
    }),
  },
}));

// Mock auditTrailService
vi.mock("./auditTrailService.js", () => ({
  auditTrailService: {
    recordPresensiPelanggaranZona: vi.fn().mockResolvedValue(true),
  },
}));

import { prisma } from "../lib/prisma.js";
import {
  syncProkerGamificationPoints,
  calculateGroupPoints,
  calculateDplPoints,
} from "./dplService.js";
import { kknAttendanceService } from "./kknAttendanceService.js";
import { kknService } from "./kknService.js";

describe("KKN Gamification Logic & Fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. syncProkerGamificationPoints (Proker Points Purely Group Assets, No Individual PointHistory)", () => {
    it("should NOT award points to individual student PointHistory on proker submission, approval, or completion", async () => {
      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "BELUM_MULAI",
        "Judul Proker"
      );

      // Proker points HARAM masuk ke dompet individu mahasiswa
      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });

    it("should clean up any legacy PointHistory records associated with prokerId", async () => {
      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "SEDANG_BERJALAN",
        "Judul Proker"
      );

      expect(prisma.pointHistory.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { description: { contains: "[ProkerID:proker-1" } },
            {
              AND: [
                { kategori: "KKN_PROKER" },
                { description: { contains: "proker-1" } },
              ],
            },
          ],
        },
      });
      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });

    it("should clean up legacy PointHistory when proker is rejected (DITOLAK)", async () => {
      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DITOLAK",
        "BELUM_MULAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { description: { contains: "[ProkerID:proker-1" } },
            {
              AND: [
                { kategori: "KKN_PROKER" },
                { description: { contains: "proker-1" } },
              ],
            },
          ],
        },
      });
      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });

    it("should not create PointHistory upon instant submission (BELUM_DISETUJUI)", async () => {
      await syncProkerGamificationPoints(
        "proker-sub-1",
        "kel-1",
        "BELUM_DISETUJUI",
        "BELUM_MULAI",
        "Ide Proker Warga"
      );

      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });
  });

  describe("2. calculateGroupPoints & calculateDplPoints (Official 60:40 Formulas)", () => {
    it("should calculate Poin Kelompok with 60% Proker + 40% Rata-rata Anggota (Example Rule)", async () => {
      // Contoh aturan: 2 proker disetujui (+4), 2 sedang berlangsung (+8), 2 selesai (+12) = 24 poin proker
      const mockProkers = [
        { id: "p1", statusUsulan: "DISETUJUI", statusPelaksanaan: "BELUM_MULAI" },
        { id: "p2", statusUsulan: "DISETUJUI", statusPelaksanaan: "BELUM_MULAI" },
        { id: "p3", statusUsulan: "DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" },
        { id: "p4", statusUsulan: "DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" },
        { id: "p5", statusUsulan: "DISETUJUI", statusPelaksanaan: "SELESAI" },
        { id: "p6", statusUsulan: "DISETUJUI", statusPelaksanaan: "SELESAI" },
      ];

      // Simulasi rata-rata poin harian anggota = 4 poin
      const now = new Date("2026-09-15T08:00:00Z");
      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        { userId: "user-1", points: 4, createdAt: now } as any,
      ]);

      const res = await calculateGroupPoints("kel-1", mockProkers, ["user-1"]);

      expect(res.poinProker).toBe(24);
      expect(res.rataRataPoinAnggota).toBe(4);
      // Rumus: (24 * 0.6) + (4 * 0.4) = 14.4 + 1.6 = 16
      expect(res.totalGroupPoints).toBe(16);
    });

    it("should count submitted prokers (BELUM_DISETUJUI) as +2 base points and ignore rejected prokers (DITOLAK)", async () => {
      const mockProkers = [
        { id: "p1", statusUsulan: "BELUM_DISETUJUI", statusPelaksanaan: "BELUM_MULAI" }, // +2
        { id: "p2", statusUsulan: "BELUM_DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" }, // +4
        { id: "p3", statusUsulan: "DITOLAK", statusPelaksanaan: "BELUM_MULAI" }, // 0
      ];

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([]);

      const res = await calculateGroupPoints("kel-1", mockProkers, ["user-1"]);

      // p1 = 2, p2 = 4, p3 = 0 -> total poinProker = 6
      expect(res.poinProker).toBe(6);
      expect(res.prokerApprovedCount).toBe(2);
      expect(res.prokerSedangBerjalanCount).toBe(1);
      expect(res.prokerSelesaiCount).toBe(0);
      // (6 * 0.6) + (0 * 0.4) = 3.6
      expect(res.totalGroupPoints).toBe(3.6);
    });

    it("should calculate Poin DPL using binary logbook (6 or 0) and 60% Logbook + 40% Kelompok", async () => {
      // Skenario A: Logbook DPL tersedia (count > 0) -> 6 poin
      vi.mocked(prisma.logbookDpl.count).mockResolvedValue(2);
      const resWithLogbook = await calculateDplPoints("dpl-1", "kel-1", 16);

      expect(resWithLogbook.hasLogbookDpl).toBe(true);
      expect(resWithLogbook.poinLogbookDpl).toBe(6);
      expect(resWithLogbook.poinKelompok).toBe(16);
      // Rumus: (6 * 0.6) + (16 * 0.4) = 3.6 + 6.4 = 10
      expect(resWithLogbook.poinDpl).toBe(10);

      // Skenario B: Logbook DPL tidak tersedia (count = 0) -> 0 poin
      vi.mocked(prisma.logbookDpl.count).mockResolvedValue(0);
      const resWithoutLogbook = await calculateDplPoints("dpl-1", "kel-1", 16);

      expect(resWithoutLogbook.hasLogbookDpl).toBe(false);
      expect(resWithoutLogbook.poinLogbookDpl).toBe(0);
      expect(resWithoutLogbook.poinKelompok).toBe(16);
      // Rumus: (0 * 0.6) + (16 * 0.4) = 0 + 6.4 = 6.4
      expect(resWithoutLogbook.poinDpl).toBe(6.4);
    });
  });

  describe("3. recordOutOfZoneViolation (No Balance Deduction)", () => {
    it("should record violation with points: 0 and not deduct student point balance", async () => {
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: "sch-1",
        title: "Kegiatan KKN",
        kelompok: { name: "Kelompok 1" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "st-1",
        userId: "user-1",
        nim: "10120001",
        user: { name: "Budi" },
        kelompok: { name: "Kelompok 1" },
      } as any);

      const result = await kknAttendanceService.recordOutOfZoneViolation("user-1", {
        scheduleId: "sch-1",
        outOfZoneMinutes: 10,
      });

      expect(result.success).toBe(true);
      expect(result.pointsDeducted).toBe(0);

      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          points: 0,
          kategori: "PENALTY_OUT_OF_ZONE",
        }),
      });
    });
  });

  describe("4. createLogbookPemanfaatan & createPanenHasil (Non-Point Activities)", () => {
    it("createLogbookPemanfaatan should not create PointHistory records", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "st-1",
        userId: "user-1",
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.pemanfaatan.create).mockResolvedValue({
        id: "pem-1",
        rwId: 1,
      } as any);

      await kknService.createLogbookPemanfaatan("user-1", {
        teknologi: "Kompos",
        bahanBaku: "Sampah",
        beratInputKg: 20,
      });

      // No point history records created for pemanfaatan form
      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });
  });

  describe("5. getRegisteredWarga - Strict AND Isolation (Ownership & Wilayah)", () => {
    it("should construct strict AND query separating ownership and wilayah to prevent data leakage", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "mhs-1",
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findFirst).mockResolvedValue({
        userId: "mhs-1",
        assignedRwId: 5,
        kelompokId: "kel-1",
        kelompok: {
          kelurahan: "Sadang Serang",
          students: [{ userId: "mhs-1" }, { userId: "mhs-2" }],
        },
      } as any);

      vi.mocked(prisma.bin.findMany).mockResolvedValue([]);

      await kknService.getRegisteredWarga("mhs-1", {});

      expect(prisma.bin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { registeredByStudentId: "mhs-1" },
                  { qrBatch: { assignedPicUserId: "mhs-1" } },
                  { kelompokId: "kel-1" },
                  { registeredByStudentId: { in: ["mhs-1", "mhs-2"] } },
                ]),
              }),
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { rwId: 5 },
                  { user: { rwId: 5 } },
                  { user: { households: { some: { rwId: 5 } } } },
                ]),
              }),
              expect.objectContaining({
                rw: {
                  kelurahan: {
                    name: { contains: "Sadang Serang", mode: "insensitive" },
                  },
                },
              }),
            ]),
            status: { in: ["ACTIVE_BOUND", "PENDING_APPROVAL"] },
          }),
        })
      );
    });
  });
});
