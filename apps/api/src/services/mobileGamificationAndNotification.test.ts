import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";
import { calculatePersonalPoints, calculatePersonalPointsForUsers } from "./dplService.js";
import { kknService } from "./kknService.js";
import { logbookService } from "./logbookService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
import { auditTrailService } from "./auditTrailService.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    pointHistory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    studentKkn: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    poskoKkn: {
      findUnique: vi.fn(),
    },
    facility: {
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
      create: vi.fn(),
    },
    userNotificationSync: {
      findUnique: vi.fn(),
    },
    systemConfig: {
      findUnique: vi.fn(),
    },
    logbookKkn: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendToUser: vi.fn().mockResolvedValue({ success: true }),
    sendToUsers: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("./auditTrailService.js", () => ({
  auditTrailService: {
    recordLogbookSubmit: vi.fn().mockResolvedValue(true),
  },
}));

describe("Mobile Gamification & Personal Point Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculatePersonalPoints should accurately separate pure personal points, proker points, and total balance with penalties", async () => {
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
    // Poin Personal Murni: 4 + 3 + 3 - 5 = 5
    expect(result.personalPoints).toBe(5);
    // Poin Proker Murni: 2
    expect(result.prokerPoints).toBe(2);
    // Total Gabungan: 4 + 3 + 3 + 2 - 5 = 7
    expect(result.contributionPoints).toBe(7);
  });

  it("calculatePersonalPoints should match mobile scenario: 23 personal points, 6 proker points, 29 contribution points", async () => {
    vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
      { points: 12, kategori: "KKN_PRESENSI_HADIR" } as any,
      { points: 5, kategori: "KKN_DURASI_MEMENUHI" } as any,
      { points: 6, kategori: "KKN_LOGBOOK_HARIAN" } as any,
      { points: 2, kategori: "KKN_PROKER", description: "Program Kerja Disetujui [ProkerID:1:DISETUJUI]" } as any,
      { points: 2, kategori: "KKN_PROKER", description: "Program Kerja Berjalan [ProkerID:1:BERJALAN]" } as any,
      { points: 2, kategori: "KKN_PROKER", description: "Program Kerja Selesai [ProkerID:1:SELESAI]" } as any,
    ]);

    const result = await calculatePersonalPoints("user-mhs-2");

    // Presensi + Durasi + Logbook = 12 + 5 + 6 = 23
    expect(result.personalPoints).toBe(23);
    // Proker = 2 + 2 + 2 = 6
    expect(result.prokerPoints).toBe(6);
    // Total = 23 + 6 = 29
    expect(result.contributionPoints).toBe(29);
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

  it("calculatePersonalPointsForUsers should exclude KKN_PROKER and POIN_KKN_FINAL points", async () => {
    vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([
      { userId: "mhs-1", points: 30 } as any,
    ]);

    await calculatePersonalPointsForUsers(["mhs-1"]);

    expect(prisma.pointHistory.findMany).toHaveBeenCalledWith({
      where: {
        userId: { in: ["mhs-1"] },
        kategori: { notIn: ["KKN_PROKER", "POIN_KKN_FINAL"] },
      },
      select: { userId: true, points: true },
    });
  });

  it("kknService.getMyGroup should filter out KKN_PROKER so member individualPoints reflects pure personal points (30 Pts instead of 38 Pts)", async () => {
    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
      id: "student-habik",
      userId: "user-habik",
      nim: "10121099",
      jurusan: "Teknik Informatika",
      fakultas: "STEI",
      isKetua: true,
      kelompokId: "kel-1",
      kelompok: {
        id: "kel-1",
        name: "Kelompok 04",
        kelurahan: "Sadang Serang",
        dpl: {
          id: "dpl-1",
          name: "Dr. Pembimbing",
          nip: "19800101",
          phone: "08123456789",
        },
        students: [
          {
            id: "student-habik",
            userId: "user-habik",
            nim: "10121099",
            jurusan: "Teknik Informatika",
            fakultas: "STEI",
            isKetua: true,
            user: { name: "Habik" },
          },
          {
            id: "student-temen",
            userId: "user-temen",
            nim: "10121100",
            jurusan: "Teknik Elektro",
            fakultas: "STEI",
            isKetua: false,
            user: { name: "Temen Habik" },
          },
        ],
      },
    } as any);

    // Mock groupBy returning pure personal points (30 for Habik)
    vi.mocked(prisma.pointHistory.groupBy).mockResolvedValue([
      { userId: "user-habik", _sum: { points: 30 } } as any,
      { userId: "user-temen", _sum: { points: 25 } } as any,
    ]);

    vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValue([]);
    vi.mocked(prisma.pointHistory.findMany).mockResolvedValue([]);
    vi.mocked(prisma.poskoKkn.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.facility.findFirst).mockResolvedValue(null);

    const result = await kknService.getMyGroup("user-habik");

    expect(result).not.toBeNull();
    // Check that pointHistory.groupBy was called with kategori: { notIn: ["KKN_PROKER"] } and anti-leak proker description guard
    expect(prisma.pointHistory.groupBy).toHaveBeenCalledWith({
      by: ["userId"],
      where: {
        userId: { in: ["user-habik", "user-temen"] },
        kategori: { notIn: ["KKN_PROKER", "REDUKSI_TONASE", "BONUS_LOGIN_PERTAMA"] },
        NOT: {
          description: { contains: "[ProkerID:" },
        },
      },
      _sum: { points: true },
    });

    const habikMember = result!.members.find((m) => m.userId === "user-habik");
    expect(habikMember).toBeDefined();
    expect(habikMember!.individualPoints).toBe(30);
  });

  it("kknService.getMyGroup should swap cumulativeMemberPoints to totalCumulativeMemberPointsWithNormalization for Mobile UX Card compatibility", async () => {
    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
      id: "student-acef",
      userId: "user-acef",
      nim: "12345678",
      jurusan: "Teknik Informatika",
      fakultas: "UNIKOM",
      isKetua: false,
      kelompokId: "kel-test",
      kelompok: {
        id: "kel-test",
        name: "Kelompok TEST",
        kelurahan: "Sadang Serang",
        dpl: {
          id: "dpl-1",
          name: "Dr. Pembimbing",
          nip: "19800101",
          phone: "08123456789",
        },
        students: [
          {
            id: "student-acef",
            userId: "user-acef",
            nim: "12345678",
            jurusan: "Teknik Informatika",
            fakultas: "UNIKOM",
            isKetua: false,
            user: { name: "Acef Testing" },
          },
        ],
      },
    } as any);

    vi.mocked(prisma.pointHistory.groupBy).mockResolvedValue([
      { userId: "user-acef", _sum: { points: 99 } } as any,
    ]);

    // Mock pointHistory for calculateGroupPoints:
    // Pure daily attendance = 57, Normalization bonus = 196 (total = 253)
    vi.mocked(prisma.pointHistory.findMany).mockImplementation((args: any) => {
      const where = args?.where;
      if (where?.kategori?.in) {
        return Promise.resolve([
          { userId: "user-acef", points: 57, kategori: "KKN_PRESENSI_HADIR", createdAt: new Date() },
        ]) as any;
      }
      if (where?.kategori === "POIN_KKN_FINAL") {
        return Promise.resolve([
          { userId: "user-acef", points: 196, kategori: "POIN_KKN_FINAL" },
        ]) as any;
      }
      return Promise.resolve([]) as any;
    });

    vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValue([]);
    vi.mocked(prisma.poskoKkn.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.facility.findFirst).mockResolvedValue(null);

    const result = await kknService.getMyGroup("user-acef");

    expect(result).not.toBeNull();
    // Verify that the mobile UX Card fields receive the dynamic composite value (253)
    expect(result!.cumulativeMemberPoints).toBe(253);
    expect(result!.totalCumulativeMemberPoints).toBe(253);
    expect(result!.totalCumulativeMemberPointsWithNormalization).toBe(253);
    // Verify pure points are preserved for academic audit
    expect(result!.pureTotalCumulativeMemberPoints).toBe(57);
  });

  describe("Logbook Submission Points & Metadata (Mobile Requirements)", () => {
    const mockStudentUser = {
      id: "mhs-1",
      name: "Budi Santoso",
      studentProfile: {
        id: "stud-1",
        nim: "10121001",
        kelompokId: "kel-1",
        kelompok: {
          id: "kel-1",
          name: "Kelompok 01",
          dplId: "dpl-1",
          students: [],
        },
      },
    };

    const mockPayload = {
      tanggalKegiatan: "2026-08-20",
      tempat: "Balai RW 05",
      deskripsi: "Sosialisasi Pemilahan Sampah",
      fotoBuktiUrl: "https://example.com/foto.jpg",
    };

    it("should award +3 points on first logbook for a date and return pointsAwarded: true", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStudentUser as any);
      vi.mocked(prisma.logbookKkn.create).mockResolvedValue({
        id: "log-1",
        ...mockPayload,
        tipeAktivitas: "INDIVIDU",
      } as any);
      // No existing point for this date
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.pointHistory.create).mockResolvedValue({ id: "pt-1", points: 3 } as any);

      const result = await logbookService.createMahasiswaLogbook("mhs-1", "MAHASISWA_KKN", mockPayload);

      expect(result.pointsAwarded).toBe(true);
      expect(result.pointsAdded).toBe(3);
      expect(prisma.pointHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "mhs-1",
            points: 3,
            kategori: "KKN_LOGBOOK_HARIAN",
          }),
        })
      );
    });

    it("should return pointsAwarded: false and pointsAdded: 0 when logbook for that date already earned points", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStudentUser as any);
      vi.mocked(prisma.logbookKkn.create).mockResolvedValue({
        id: "log-2",
        ...mockPayload,
        tipeAktivitas: "INDIVIDU",
      } as any);
      // Already earned point for this date
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({
        id: "pt-existing",
        points: 3,
      } as any);

      const result = await logbookService.createMahasiswaLogbook("mhs-1", "MAHASISWA_KKN", mockPayload);

      expect(result.pointsAwarded).toBe(false);
      expect(result.pointsAdded).toBe(0);
      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });
  });
});
