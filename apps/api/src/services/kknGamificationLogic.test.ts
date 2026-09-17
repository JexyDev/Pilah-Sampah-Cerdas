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
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      auditTrail: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
      $transaction: vi.fn(async (cb: any) => cb({
        user: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue(null),
        },
        studentKkn: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
        },
        bin: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue(null),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        pointHistory: {
          create: vi.fn().mockResolvedValue({ id: "pt-1" }),
        },
      })),
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

  describe("1. syncProkerGamificationPoints (3-Step Proker Points - Jalur Gamifikasi Mahasiswa)", () => {
    it("should award +2 points on Step 1 (DISETUJUI) for all group members", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }, { userId: "user-2" }],
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "BELUM_MULAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Program Kerja Disetujui: Judul Proker [ProkerID:proker-1:DISETUJUI]",
            kategori: "KKN_PROKER",
          },
          {
            userId: "user-2",
            points: 2,
            description: "Program Kerja Disetujui: Judul Proker [ProkerID:proker-1:DISETUJUI]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should award Step 2 (+2 points) when proker is SEDANG_BERJALAN", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "SEDANG_BERJALAN",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Program Kerja Berjalan: Judul Proker [ProkerID:proker-1:BERJALAN]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should award Step 3 (+2 points) when proker is SELESAI", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "SELESAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Program Kerja Selesai: Judul Proker [ProkerID:proker-1:SELESAI]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should be idempotent and not create duplicate points if already awarded", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({
        id: "pt-existing",
        description: "Program Kerja Disetujui: Judul Proker [ProkerID:proker-1:DISETUJUI]",
      } as any);

      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DISETUJUI",
        "BELUM_MULAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });

    it("should delete points when proker is rejected (DITOLAK)", async () => {
      await syncProkerGamificationPoints(
        "proker-1",
        "kel-1",
        "DITOLAK",
        "BELUM_MULAI",
        "Judul Proker"
      );

      expect(prisma.pointHistory.deleteMany).toHaveBeenCalledWith({
        where: { description: { contains: "[ProkerID:proker-1" } },
      });
      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });

    it("should award Step 1 (+2 points) instantly upon submission (BELUM_DISETUJUI) before DPL approval", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }, { userId: "user-2" }],
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);

      await syncProkerGamificationPoints(
        "proker-sub-1",
        "kel-1",
        "BELUM_DISETUJUI",
        "BELUM_MULAI",
        "Ide Proker Warga"
      );

      expect(prisma.pointHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "user-1",
            points: 2,
            description: "Pengajuan Program Kerja: Ide Proker Warga [ProkerID:proker-sub-1:PENGAJUAN]",
            kategori: "KKN_PROKER",
          },
          {
            userId: "user-2",
            points: 2,
            description: "Pengajuan Program Kerja: Ide Proker Warga [ProkerID:proker-sub-1:PENGAJUAN]",
            kategori: "KKN_PROKER",
          },
        ],
      });
    });

    it("should not duplicate Step 1 points when DPL subsequently approves an already submitted proker", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kel-1",
        students: [{ userId: "user-1" }],
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({
        id: "pt-existing-pengajuan",
        description: "Pengajuan Program Kerja: Ide Proker Warga [ProkerID:proker-sub-1:PENGAJUAN]",
      } as any);

      await syncProkerGamificationPoints(
        "proker-sub-1",
        "kel-1",
        "DISETUJUI",
        "BELUM_MULAI",
        "Ide Proker Warga"
      );

      expect(prisma.pointHistory.createMany).not.toHaveBeenCalled();
    });
  });

  describe("2. calculateGroupPoints & calculateDplPoints (Official 60:40 Formulas - Jalur Akademik On-The-Fly)", () => {
    it("should calculate Poin Kelompok with 60% Proker (Sequential/Bertahap: Disetujui +2, Berjalan +4, Selesai +6) + 40% Rata-rata Anggota", async () => {
      // 2 proker disetujui (2*2=4), 2 sedang berlangsung (2*4=8), 2 selesai (2*6=12) = 24 poin proker
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

      // Proker dihitung bertahap: (2*2) + (2*4) + (2*6) = 4 + 8 + 12 = 24 poin proker
      expect(res.poinProker).toBe(24);
      expect(res.prokerApprovedCount).toBe(6);
      expect(res.prokerSedangBerjalanCount).toBe(2);
      expect(res.prokerSelesaiCount).toBe(2);
      expect(res.rataRataPoinAnggota).toBe(4);
      // Rumus: (24 * 0.6) + (4 * 0.4) = 14.4 + 1.6 = 16
      expect(res.totalGroupPoints).toBe(16);
    });

    it("should calculate progressive proker points: BELUM_MULAI (+2), SEDANG_BERJALAN (+4), SELESAI (+6), and DITOLAK (0)", async () => {
      const mockProkers = [
        { id: "p1", statusUsulan: "BELUM_DISETUJUI", statusPelaksanaan: "BELUM_MULAI" }, // +2
        { id: "p2", statusUsulan: "BELUM_DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" }, // +4
        { id: "p3", statusUsulan: "DITOLAK", statusPelaksanaan: "BELUM_MULAI" }, // 0
        { id: "p4", statusUsulan: "DISETUJUI", statusPelaksanaan: "SELESAI" }, // +6
      ];

      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([]);

      const res = await calculateGroupPoints("kel-1", mockProkers, ["user-1"]);

      // Total poin proker: 2 + 4 + 0 + 6 = 12 poin
      expect(res.poinProker).toBe(12);
      expect(res.prokerApprovedCount).toBe(3);
      expect(res.prokerSedangBerjalanCount).toBe(1);
      expect(res.prokerSelesaiCount).toBe(1);
      // (12 * 0.6) + (0 * 0.4) = 7.2
      expect(res.totalGroupPoints).toBe(7.2);
    });

    it("should calculate cumulative member average without dividing by totalActiveDays (growing points over time)", async () => {
      // 2 mahasiswa dengan akumulasi beberapa hari (user-1: 20 pts, user-2: 30 pts, total 50 pts)
      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        { userId: "user-1", points: 10, createdAt: new Date("2026-09-01") } as any,
        { userId: "user-1", points: 10, createdAt: new Date("2026-09-02") } as any,
        { userId: "user-2", points: 15, createdAt: new Date("2026-09-01") } as any,
        { userId: "user-2", points: 15, createdAt: new Date("2026-09-02") } as any,
      ]);

      const res = await calculateGroupPoints("kel-1", [], ["user-1", "user-2"]);

      // Total kumulatif = 50. Jumlah anggota = 2.
      // Rata-rata kumulatif = 50 / 2 = 25 (TIDAK dibagi 2 hari aktif)
      expect(res.totalCumulativeMemberPoints).toBe(50);
      expect(res.rataRataPoinAnggota).toBe(25);
      // Rumus: (0 * 0.6) + (25 * 0.4) = 10
      expect(res.totalGroupPoints).toBe(10);
    });

    it("should calculate Poin DPL using binary logbook (6 or 0) and 50% Logbook + 50% Kelompok", async () => {
      // Skenario A: Logbook DPL tersedia (count > 0) -> 6 poin
      vi.mocked(prisma.logbookDpl.count).mockResolvedValue(2);
      const resWithLogbook = await calculateDplPoints("dpl-1", "kel-1", 16);

      expect(resWithLogbook.hasLogbookDpl).toBe(true);
      expect(resWithLogbook.poinLogbookDpl).toBe(6);
      expect(resWithLogbook.poinKelompok).toBe(16);
      // Rumus: (6 * 0.5) + (16 * 0.5) = 3 + 8 = 11
      expect(resWithLogbook.poinDpl).toBe(11);

      // Skenario B: Logbook DPL tidak tersedia (count = 0) -> 0 poin
      vi.mocked(prisma.logbookDpl.count).mockResolvedValue(0);
      const resWithoutLogbook = await calculateDplPoints("dpl-1", "kel-1", 16);

      expect(resWithoutLogbook.hasLogbookDpl).toBe(false);
      expect(resWithoutLogbook.poinLogbookDpl).toBe(0);
      expect(resWithoutLogbook.poinKelompok).toBe(16);
      // Rumus: (0 * 0.5) + (16 * 0.5) = 0 + 8 = 8
      expect(resWithoutLogbook.poinDpl).toBe(8);
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
                    name: { equals: "Sadang Serang", mode: "insensitive" },
                  },
                },
              }),
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { kelompokId: "kel-1" },
                  { registeredByStudentId: { in: expect.arrayContaining(["mhs-1", "mhs-2"]) } },
                ]),
              }),
            ]),
            status: { in: ["ACTIVE_BOUND", "PENDING_APPROVAL"] },
          }),
        })
      );
    });

    it("should reject claimWargaMandiri if a bin is owned by another kelompok", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          user: {
            findUnique: vi.fn().mockResolvedValue({ id: "warga-1", rwId: 5 }),
          },
          studentKkn: {
            findUnique: vi.fn().mockResolvedValue({
              userId: "mhs-1",
              kelompokId: "kel-7",
            }),
          },
          bin: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: "bin-1",
                qrCode: "BIN-SDG-10-001",
                kelompokId: "kel-10", // Milik kelompok lain!
                registeredByStudentId: null,
                status: "ACTIVE_BOUND",
              },
            ]),
            updateMany: vi.fn(),
          },
        });
      });

      await expect(
        kknService.claimWargaMandiri("mhs-1", "warga-1")
      ).rejects.toThrow(/kelompok KKN lain/);
    });

    it("should reject claimQr if the bin already belongs to another kelompok", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: "mhs-1",
        kelompokId: "kel-7",
      } as any);

      vi.mocked(prisma.bin.findUnique).mockResolvedValue({
        id: "bin-10",
        qrCode: "BIN-SDG-10-002",
        kelompokId: "kel-10",
      } as any);

      await expect(
        kknService.claimQr("mhs-1", "BIN-SDG-10-002")
      ).rejects.toThrow(/bukan milik kelompok KKN Anda/);
    });
  });

  describe("6. Real-time Proker Recalculation & Dashboard Field Separation", () => {
    it("should recalculate totalGroupPoints sequentially as proker moves: Diajukan -> Berjalan -> Selesai", async () => {
      // 1 proker progressing, with 2 students having 10 cumulative points (avg = 5 pts)
      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        { userId: "user-1", points: 5, createdAt: new Date() } as any,
        { userId: "user-2", points: 5, createdAt: new Date() } as any,
      ]);

      // Stage 1: Diajukan (+2)
      const stage1Prokers = [
        { id: "p1", statusUsulan: "BELUM_DISETUJUI", statusPelaksanaan: "BELUM_MULAI" },
      ];
      const resStage1 = await calculateGroupPoints("kel-1", stage1Prokers, ["user-1", "user-2"]);
      expect(resStage1.poinProker).toBe(2);
      expect(resStage1.rataRataPoinAnggota).toBe(5);
      // (2 * 0.6) + (5 * 0.4) = 1.2 + 2 = 3.2
      expect(resStage1.totalGroupPoints).toBe(3.2);

      // Stage 2: Berjalan (+4)
      const stage2Prokers = [
        { id: "p1", statusUsulan: "DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" },
      ];
      const resStage2 = await calculateGroupPoints("kel-1", stage2Prokers, ["user-1", "user-2"]);
      expect(resStage2.poinProker).toBe(4);
      // (4 * 0.6) + (5 * 0.4) = 2.4 + 2 = 4.4
      expect(resStage2.totalGroupPoints).toBe(4.4);

      // Stage 3: Selesai (+6)
      const stage3Prokers = [
        { id: "p1", statusUsulan: "DISETUJUI", statusPelaksanaan: "SELESAI" },
      ];
      const resStage3 = await calculateGroupPoints("kel-1", stage3Prokers, ["user-1", "user-2"]);
      expect(resStage3.poinProker).toBe(6);
      // (6 * 0.6) + (5 * 0.4) = 3.6 + 2 = 5.6
      expect(resStage3.totalGroupPoints).toBe(5.6);
    });

    it("should return separated metrics in getDashboardStats (personalPoints vs totalGroupPoints/poinProker)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "mhs-dash-1",
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "std-1",
        userId: "mhs-dash-1",
        nim: "12345678",
        kelompokId: "kel-dash-1",
        assignedRw: { id: 1, name: "RW 01", latitude: -6.89, longitude: 107.61 },
      } as any);

      vi.mocked(prisma.bin.count).mockResolvedValue(5);

      // Point history for student: Presensi 4 + Durasi 3 + Logbook 3 = 10
      vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
        { userId: "mhs-dash-1", points: 4, kategori: "KKN_PRESENSI_HADIR", createdAt: new Date() } as any,
        { userId: "mhs-dash-1", points: 3, kategori: "KKN_DURASI_MEMENUHI", createdAt: new Date() } as any,
        { userId: "mhs-dash-1", points: 3, kategori: "KKN_LOGBOOK_HARIAN", createdAt: new Date() } as any,
      ]);

      // Prokers in kelompok
      vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValue([
        { id: "prk-1", statusUsulan: "DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" } as any,
      ]);

      vi.mocked(prisma.studentKkn.findMany).mockResolvedValue([
        { userId: "mhs-dash-1" } as any,
      ]);

      const dashboard = await kknService.getDashboardStats("mhs-dash-1");

      expect(dashboard).toHaveProperty("stats");
      // Personal points
      expect(dashboard.stats.personalPoints).toBe(10);
      expect(dashboard.stats.contributionPoints).toBe(10);
      // Group points separated
      expect(dashboard.stats).toHaveProperty("totalGroupPoints");
      expect(dashboard.stats).toHaveProperty("poinKelompok");
      expect(dashboard.stats).toHaveProperty("poinProker");
      expect(dashboard.stats).toHaveProperty("rataRataPoinAnggota");

      // poinProker & prokerPoints for 1 SEDANG_BERJALAN = 4
      expect(dashboard.stats.poinProker).toBe(4);
      expect(dashboard.stats.prokerPoints).toBe(4);
      expect(dashboard.prokerPoints).toBe(4);
      // rataRataPoinAnggota = 10
      expect(dashboard.stats.rataRataPoinAnggota).toBe(10);
      // totalGroupPoints = (4 * 0.6) + (10 * 0.4) = 2.4 + 4 = 6.4
      expect(dashboard.stats.totalGroupPoints).toBe(6.4);
      expect(dashboard.stats.poinKelompok).toBe(6.4);
    });
  });
});
