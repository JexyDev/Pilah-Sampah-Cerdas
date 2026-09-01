import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";
import { kknService } from "./kknService.js";

describe("KKN Service - Pemanfaatan & Panen Group Point Distribution and CRUD", () => {
  let testKelompok: any;
  let studentUser1: any;
  let studentUser2: any;
  let studentKkn1: any;
  let studentKkn2: any;
  let rw: any;
  const createdReportIds: string[] = [];

  beforeAll(async () => {
    let roleMahasiswa = await prisma.role.findFirst({ where: { name: "MAHASISWA_KKN" } });
    if (!roleMahasiswa) {
      roleMahasiswa = await prisma.role.create({
        data: { name: "MAHASISWA_KKN" },
      });
    }

    rw = await prisma.rw.findFirst();
    if (!rw) {
      const kel =
        (await prisma.kelurahan.findFirst()) ||
        (await prisma.kelurahan.create({ data: { name: "Kelurahan Test" } }));
      rw = await prisma.rw.create({
        data: { name: "RW 01 Test", kelurahanId: kel.id },
      });
    }

    testKelompok = await prisma.kelompokKkn.create({
      data: {
        name: "Kelompok Test Point-" + Date.now(),
        kelurahan: "Coblong",
      },
    });

    studentUser1 = await prisma.user.create({
      data: {
        name: "Mahasiswa Test 1",
        phone: "0899" + Math.floor(10000000 + Math.random() * 90000000),
        password: "password123",
        roleId: roleMahasiswa.id,
      },
    });

    studentUser2 = await prisma.user.create({
      data: {
        name: "Mahasiswa Test 2",
        phone: "0899" + Math.floor(10000000 + Math.random() * 90000000),
        password: "password123",
        roleId: roleMahasiswa.id,
      },
    });

    studentKkn1 = await prisma.studentKkn.create({
      data: {
        userId: studentUser1.id,
        nim: "NIM-" + Date.now() + "-1",
        jurusan: "Teknik Informatika",
        fakultas: "Fasilkom",
        noWa: studentUser1.phone,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        kelompokId: testKelompok.id,
        assignedRwId: rw.id,
      },
    });

    studentKkn2 = await prisma.studentKkn.create({
      data: {
        userId: studentUser2.id,
        nim: "NIM-" + Date.now() + "-2",
        jurusan: "Teknik Lingkungan",
        fakultas: "FTSL",
        noWa: studentUser2.phone,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        kelompokId: testKelompok.id,
        assignedRwId: rw.id,
      },
    });
  });

  afterAll(async () => {
    for (const reportId of createdReportIds) {
      await prisma.pointHistory
        .deleteMany({ where: { description: { contains: reportId } } })
        .catch(() => {});
      await prisma.pemanfaatan.deleteMany({ where: { id: reportId } }).catch(() => {});
    }
    if (studentUser1) {
      await prisma.pointHistory.deleteMany({ where: { userId: studentUser1.id } }).catch(() => {});
      await prisma.studentKkn.deleteMany({ where: { userId: studentUser1.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: studentUser1.id } }).catch(() => {});
    }
    if (studentUser2) {
      await prisma.pointHistory.deleteMany({ where: { userId: studentUser2.id } }).catch(() => {});
      await prisma.studentKkn.deleteMany({ where: { userId: studentUser2.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: studentUser2.id } }).catch(() => {});
    }
    if (testKelompok) {
      await prisma.kelompokKkn.deleteMany({ where: { id: testKelompok.id } }).catch(() => {});
    }
  });

  it("TASK 1 & TASK 4: createLogbookPemanfaatan should award +10 points to ALL group members", async () => {
    const report = await kknService.createLogbookPemanfaatan(studentUser1.id, {
      teknologi: "Kompos Organik Super",
      bahanBaku: "Sampah Sayur",
      beratInputKg: 45.5,
      fotoDokumentasiUrl: "https://example.com/kompos.jpg",
    });

    expect(report).toHaveProperty("id");
    createdReportIds.push(report.id);

    const pointsUser1 = await prisma.pointHistory.findMany({
      where: {
        userId: studentUser1.id,
        description: { contains: report.id },
      },
    });
    expect(pointsUser1.length).toBe(1);
    expect(pointsUser1[0].points).toBe(10);
    expect(pointsUser1[0].kategori).toBe("REDUKSI_TONASE");

    const pointsUser2 = await prisma.pointHistory.findMany({
      where: {
        userId: studentUser2.id,
        description: { contains: report.id },
      },
    });
    expect(pointsUser2.length).toBe(1);
    expect(pointsUser2[0].points).toBe(10);
    expect(pointsUser2[0].kategori).toBe("REDUKSI_TONASE");
  });

  it("TASK 4 (Rule 2): updateLogbookPemanfaatan should update report data without modifying PointHistory", async () => {
    const reportId = createdReportIds[0];
    const pointsBeforeCount = await prisma.pointHistory.count({
      where: { description: { contains: reportId } },
    });

    const updated = await kknService.updateLogbookPemanfaatan(studentUser1.id, reportId, {
      beratInputKg: 60.0,
      teknologi: "Kompos Organik Diperbarui",
    });

    expect(Number(updated.volumeBahanBaku)).toBe(60.0);
    expect(updated.teknologi).toBe("Kompos Organik Diperbarui");

    const pointsAfterCount = await prisma.pointHistory.count({
      where: { description: { contains: reportId } },
    });
    expect(pointsAfterCount).toBe(pointsBeforeCount);
  });

  it("TASK 1 & TASK 4: createPanenHasil should award +25 points to ALL group members", async () => {
    const reportId = createdReportIds[0];

    const panenResult = await kknService.createPanenHasil(studentUser2.id, {
      pemanfaatanId: reportId,
      beratOutputKg: 20.0,
      nilaiEkonomiRp: 50000,
    });

    expect(Number(panenResult.hasil)).toBe(20.0);

    const panenPointsUser1 = await prisma.pointHistory.findMany({
      where: {
        userId: studentUser1.id,
        description: { contains: reportId },
        points: 25,
      },
    });
    expect(panenPointsUser1.length).toBe(1);

    const panenPointsUser2 = await prisma.pointHistory.findMany({
      where: {
        userId: studentUser2.id,
        description: { contains: reportId },
        points: 25,
      },
    });
    expect(panenPointsUser2.length).toBe(1);
  });

  it("TASK 3B & TASK 4 (Rule 2): updatePanenHasil should update panen output without modifying PointHistory", async () => {
    const reportId = createdReportIds[0];
    const pointsBeforeCount = await prisma.pointHistory.count({
      where: { description: { contains: reportId } },
    });

    const updatedPanen = await kknService.updatePanenHasil(studentUser1.id, reportId, {
      beratOutputKg: 28.5,
      nilaiEkonomiRp: 75000,
    });

    expect(Number(updatedPanen.hasil)).toBe(28.5);
    expect(Number(updatedPanen.luasLahanM2)).toBe(75000);

    const pointsAfterCount = await prisma.pointHistory.count({
      where: { description: { contains: reportId } },
    });
    expect(pointsAfterCount).toBe(pointsBeforeCount);
  });

  it("TASK 3B & TASK 4 (Rule 1): deletePanenHasil should reset panen and delete panen points for ALL members", async () => {
    const reportId = createdReportIds[0];

    const deleteResult = await kknService.deletePanenHasil(studentUser1.id, reportId);
    expect(deleteResult.success).toBe(true);

    const checkPemanfaatan = await prisma.pemanfaatan.findUnique({ where: { id: reportId } });
    expect(Number(checkPemanfaatan?.hasil)).toBe(0);

    const panenPointsAfter = await prisma.pointHistory.findMany({
      where: {
        description: { contains: reportId },
        points: 25,
      },
    });
    expect(panenPointsAfter.length).toBe(0);

    const pemanfaatanPoints = await prisma.pointHistory.findMany({
      where: {
        description: { contains: reportId },
        points: 10,
      },
    });
    expect(pemanfaatanPoints.length).toBe(2);
  });

  it("TASK 3A & TASK 4 (Rule 1): deleteLogbookPemanfaatan should delete report and delete ALL associated points", async () => {
    const reportId = createdReportIds[0];

    const deleteResult = await kknService.deleteLogbookPemanfaatan(studentUser1.id, reportId);
    expect(deleteResult.success).toBe(true);

    const checkPemanfaatan = await prisma.pemanfaatan.findUnique({ where: { id: reportId } });
    expect(checkPemanfaatan).toBeNull();

    const allPointsAfter = await prisma.pointHistory.findMany({
      where: {
        description: { contains: reportId },
      },
    });
    expect(allPointsAfter.length).toBe(0);
  });

  it("MOBILE HABIL: should support mobile payload { program, teknologi, volumeBahanBaku } and { hasil }", async () => {
    const report = await kknService.createLogbookPemanfaatan(studentUser1.id, {
      teknologi: "Maggot BSF",
      bahanBaku: "Sampah Makanan",
      beratInputKg: 30,
    });
    expect(report).toHaveProperty("id");
    createdReportIds.push(report.id);

    // 1. Mobile payload edit pemanfaatan: { program, teknologi, volumeBahanBaku }
    const updated = await kknService.updateLogbookPemanfaatan(studentUser1.id, report.id, {
      program: "Budidaya Maggot RW 01",
      teknologi: "Maggot BSF Moderen",
      volumeBahanBaku: 55,
    });
    expect(updated.program).toBe("Budidaya Maggot RW 01");
    expect(updated.teknologi).toBe("Maggot BSF Moderen");
    expect(Number(updated.volumeBahanBaku)).toBe(55);

    // 2. Mobile payload edit panen: { hasil }
    const updatedPanen = await kknService.updatePanenHasil(studentUser1.id, report.id, {
      hasil: 18.5,
    });
    expect(Number(updatedPanen.hasil)).toBe(18.5);

    // 3. Mobile delete panen (reset hasil to 0)
    const resetPanen = await kknService.deletePanenHasil(studentUser1.id, report.id);
    expect(resetPanen.success).toBe(true);
    const checkAfterReset = await prisma.pemanfaatan.findUnique({ where: { id: report.id } });
    expect(Number(checkAfterReset?.hasil)).toBe(0);

    // 4. Mobile hard delete pemanfaatan
    const deleted = await kknService.deleteLogbookPemanfaatan(studentUser1.id, report.id);
    expect(deleted.success).toBe(true);
    const checkDeleted = await prisma.pemanfaatan.findUnique({ where: { id: report.id } });
    expect(checkDeleted).toBeNull();
  });

  it("LOGBOOK GROUP VISIBILITY: Mahasiswa KKN should see all logbooks belonging to their kelompok", async () => {
    const { logbookService } = await import("./logbookService.js");

    const log1 = await prisma.logbookKkn.create({
      data: {
        kelompokId: testKelompok.id,
        penulisId: studentUser1.id,
        tanggalKegiatan: new Date(),
        tempat: "Posko 1",
        deskripsi: "Logbook User 1",
        fotoBuktiUrl: "/uploads/user1.jpg",
      },
    });

    const log2 = await prisma.logbookKkn.create({
      data: {
        kelompokId: testKelompok.id,
        penulisId: studentUser2.id,
        tanggalKegiatan: new Date(),
        tempat: "Posko 2",
        deskripsi: "Logbook User 2",
        fotoBuktiUrl: "/uploads/user2.jpg",
      },
    });

    try {
      // Both students in testKelompok can see log1 and log2
      const user1Logbooks = await logbookService.getMahasiswaLogbooks(studentUser1.id, "MAHASISWA_KKN", {});
      const user1Ids = user1Logbooks.map((l: any) => l.id);
      expect(user1Ids).toContain(log1.id);
      expect(user1Ids).toContain(log2.id);

      const user2Logbooks = await logbookService.getMahasiswaLogbooks(studentUser2.id, "MAHASISWA_KKN", {});
      const user2Ids = user2Logbooks.map((l: any) => l.id);
      expect(user2Ids).toContain(log1.id);
      expect(user2Ids).toContain(log2.id);
    } finally {
      await prisma.logbookKkn.deleteMany({
        where: { id: { in: [log1.id, log2.id] } },
      });
    }
  });
});
