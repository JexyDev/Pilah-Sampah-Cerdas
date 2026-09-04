import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";
import { kknService } from "./kknService.js";

describe("KKN Service - getProgramKerjaById Pemanfaatan Aggregation & Grouping", () => {
  let testKelompok: any;
  let studentUser: any;
  let studentKkn: any;
  let dplUser: any;
  let testProker: any;
  let rw: any;
  const createdPemanfaatanIds: string[] = [];

  beforeAll(async () => {
    let roleMahasiswa = await prisma.role.findFirst({ where: { name: "MAHASISWA_KKN" } });
    if (!roleMahasiswa) {
      roleMahasiswa = await prisma.role.create({ data: { name: "MAHASISWA_KKN" } });
    }

    let roleDpl = await prisma.role.findFirst({ where: { name: "DPL" } });
    if (!roleDpl) {
      roleDpl = await prisma.role.create({ data: { name: "DPL" } });
    }

    rw = await prisma.rw.findFirst();
    if (!rw) {
      const kel =
        (await prisma.kelurahan.findFirst()) ||
        (await prisma.kelurahan.create({ data: { name: "Kelurahan Test Proker" } }));
      rw = await prisma.rw.create({
        data: { name: "RW 05 Test", kelurahanId: kel.id },
      });
    }

    dplUser = await prisma.user.create({
      data: {
        name: "DPL Test User",
        phone: "0898" + Math.floor(10000000 + Math.random() * 90000000),
        password: "password123",
        roleId: roleDpl.id,
      },
    });

    testKelompok = await prisma.kelompokKkn.create({
      data: {
        name: "Kelompok Proker Test-" + Date.now(),
        kelurahan: "Coblong",
        dplId: dplUser.id,
      },
    });

    studentUser = await prisma.user.create({
      data: {
        name: "Mahasiswa Proker Test",
        phone: "0897" + Math.floor(10000000 + Math.random() * 90000000),
        password: "password123",
        roleId: roleMahasiswa.id,
      },
    });

    studentKkn = await prisma.studentKkn.create({
      data: {
        userId: studentUser.id,
        nim: "NIM-PROKER-" + Date.now(),
        jurusan: "Teknik Lingkungan",
        fakultas: "FTSL",
        noWa: studentUser.phone,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        kelompokId: testKelompok.id,
        assignedRwId: rw.id,
      },
    });

    testProker = await prisma.programKerjaKkn.create({
      data: {
        kelompokId: testKelompok.id,
        studentId: studentKkn.id,
        deskripsi: "**Optimalisasi Pengolahan Sampah Organik & Budidaya Maggot**\n\nPelaksanaan program kerja pemanfaatan sampah di posko RW.",
        kategori: "Pemanfaatan",
        status: "APPROVED",
        statusUsulan: "DISETUJUI",
        statusPelaksanaan: "SEDANG_BERJALAN",
        waktuPelaksanaan: "2026-08-01 s/d 2026-08-30",
        kebutuhanBiaya: 500000,
      },
    });
  });

  afterAll(async () => {
    for (const id of createdPemanfaatanIds) {
      await prisma.pointHistory.deleteMany({ where: { description: { contains: id } } }).catch(() => {});
      await prisma.pemanfaatan.deleteMany({ where: { id } }).catch(() => {});
    }
    if (testProker) {
      await prisma.logbookKkn.deleteMany({ where: { programKerjaId: testProker.id } }).catch(() => {});
      await prisma.programKerjaKkn.deleteMany({ where: { id: testProker.id } }).catch(() => {});
    }
    if (studentUser) {
      await prisma.studentKkn.deleteMany({ where: { userId: studentUser.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: studentUser.id } }).catch(() => {});
    }
    if (dplUser) {
      await prisma.user.deleteMany({ where: { id: dplUser.id } }).catch(() => {});
    }
    if (testKelompok) {
      await prisma.kelompokKkn.deleteMany({ where: { id: testKelompok.id } }).catch(() => {});
    }
  });

  it("should return proker detail with empty pemanfaatan aggregation when no logs exist", async () => {
    const detail = await kknService.getProgramKerjaById(studentUser.id, testProker.id);

    expect(detail).toHaveProperty("id", testProker.id);
    expect(detail).toHaveProperty("pemanfaatan");
    expect(detail.pemanfaatan.totalBeratInputKg).toBe(0);
    expect(detail.pemanfaatan.totalBeratOutputKg).toBe(0);
    expect(detail.pemanfaatan.totalNilaiEkonomi).toBe(0);
    expect(detail.pemanfaatan.totalEntri).toBe(0);
    expect(detail.pemanfaatan.perTeknologi).toEqual([]);
    expect(detail.pemanfaatan.entries).toEqual([]);
  });

  it("should correctly aggregate pemanfaatan data and group by teknologi", async () => {
    // 1. Create Logbook Pemanfaatan for Maggot BSF
    const log1 = await kknService.createLogbookPemanfaatan(studentUser.id, {
      programKerjaId: testProker.id,
      teknologi: "Maggot BSF",
      bahanBaku: "Sisa Makanan Pasar",
      beratInputKg: 40.0,
      fotoDokumentasiUrl: "https://example.com/maggot1.jpg",
    });
    createdPemanfaatanIds.push(log1.id);

    // 2. Create Logbook Pemanfaatan for Kompos Organik
    const log2 = await kknService.createLogbookPemanfaatan(studentUser.id, {
      programKerjaId: testProker.id,
      teknologi: "Kompos Organik (Buruan Sae)",
      bahanBaku: "Daun Kering & Sayuran",
      beratInputKg: 25.5,
      fotoDokumentasiUrl: "https://example.com/kompos1.jpg",
    });
    createdPemanfaatanIds.push(log2.id);

    // 3. Record Panen Hasil for log1 (Maggot BSF: 15 Kg, Nilai Ekonomi Rp 120.000)
    await kknService.createPanenHasil(studentUser.id, {
      pemanfaatanId: log1.id,
      beratOutputKg: 15.0,
      nilaiEkonomiRp: 120000,
    });

    // 4. Fetch proker detail
    const detail = await kknService.getProgramKerjaById(studentUser.id, testProker.id);

    expect(detail.pemanfaatan).toBeDefined();
    expect(detail.pemanfaatan.totalEntri).toBe(2);
    expect(detail.pemanfaatan.totalBeratInputKg).toBe(65.5);
    expect(detail.pemanfaatan.totalBeratOutputKg).toBe(15.0);
    expect(detail.pemanfaatan.totalNilaiEkonomi).toBe(120000);

    // Check grouping per teknologi
    expect(detail.pemanfaatan.perTeknologi.length).toBe(2);

    const maggotGroup = detail.pemanfaatan.perTeknologi.find(
      (g: any) => g.teknologi === "Maggot BSF"
    );
    expect(maggotGroup).toBeDefined();
    expect(maggotGroup.totalBeratInputKg).toBe(40.0);
    expect(maggotGroup.totalBeratOutputKg).toBe(15.0);
    expect(maggotGroup.totalNilaiEkonomi).toBe(120000);
    expect(maggotGroup.count).toBe(1);

    const komposGroup = detail.pemanfaatan.perTeknologi.find(
      (g: any) => g.teknologi === "Kompos Organik (Buruan Sae)"
    );
    expect(komposGroup).toBeDefined();
    expect(komposGroup.totalBeratInputKg).toBe(25.5);
    expect(komposGroup.totalBeratOutputKg).toBe(0);
    expect(komposGroup.totalNilaiEkonomi).toBe(0);
    expect(komposGroup.count).toBe(1);

    // Check entries
    expect(detail.pemanfaatan.entries.length).toBe(2);
    const entryMaggot = detail.pemanfaatan.entries.find((e: any) => e.id === log1.id);
    expect(entryMaggot.status).toBe("PANEN");
    expect(entryMaggot.beratOutputKg).toBe(15.0);
    expect(entryMaggot.nilaiEkonomiRp).toBe(120000);

    const entryKompos = detail.pemanfaatan.entries.find((e: any) => e.id === log2.id);
    expect(entryKompos.status).toBe("PROSES");
    expect(entryKompos.beratOutputKg).toBe(0);
  });
});
