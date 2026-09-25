/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit Test: wasteExecutiveReportService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { wasteExecutiveReportService } from "./wasteExecutiveReportService.js";
import { prisma } from "../lib/prisma.js";
import * as XLSX from "xlsx";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    kelurahan: {
      findMany: vi.fn(),
    },
    rw: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    facility: {
      findMany: vi.fn(),
    },
    bin: {
      findMany: vi.fn(),
    },
    dispatchTask: {
      count: vi.fn(),
    },
    setoranOtomatis: {
      findMany: vi.fn(),
    },
    setoranManual: {
      findMany: vi.fn(),
    },
    facilityProductionLog: {
      findMany: vi.fn(),
    },
    pemanfaatan: {
      findMany: vi.fn(),
    },
    surveiKelurahan: {
      findMany: vi.fn(),
    },
  },
}));

describe("wasteExecutiveReportService - Aggregation & Impact Analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Kelurahan
    (prisma.kelurahan.findMany as any).mockResolvedValue([
      { id: "kel-1", name: "Cipaganti", rws: [{ id: 1, name: "RW 01" }] },
      { id: "kel-2", name: "Dago", rws: [{ id: 2, name: "RW 01" }] },
      { id: "kel-3", name: "Lebak Gede", rws: [{ id: 3, name: "RW 01" }] },
      { id: "kel-4", name: "Lebak Siliwangi", rws: [{ id: 4, name: "RW 01" }] },
      { id: "kel-5", name: "Sadang Serang", rws: [{ id: 5, name: "RW 01" }] },
      { id: "kel-6", name: "Sekeloa", rws: [{ id: 6, name: "RW 01" }] },
    ]);

    // Mock Fasilitas
    (prisma.facility.findMany as any).mockResolvedValue([
      {
        id: "fac-1",
        nama: "TPS3R Sadang Serang",
        jenis: "tps",
        pic: "Pak Budi",
        kontak: "081234567890",
        kapasitas: 2500,
        statusApproval: "APPROVED",
        rw: { kelurahan: { name: "Sadang Serang" }, name: "RW 02" },
        productionLogs: [],
      },
      {
        id: "fac-2",
        nama: "Bank Sampah Bersinar Dago",
        jenis: "bank_sampah",
        pic: "Ibu Siti",
        kontak: "081298765432",
        kapasitas: 1200,
        statusApproval: "APPROVED",
        rw: { kelurahan: { name: "Dago" }, name: "RW 01" },
        productionLogs: [],
      },
      {
        id: "fac-3",
        nama: "Rumah Maggot BSF Lebak Gede",
        jenis: "rumah_maggot",
        pic: "Kang Asep",
        kontak: "081345678901",
        kapasitas: 800,
        statusApproval: "APPROVED",
        rw: { kelurahan: { name: "Lebak Gede" }, name: "RW 03" },
        productionLogs: [],
      },
    ]);

    // Mock Bins
    (prisma.bin.findMany as any).mockResolvedValue([
      {
        id: "bin-1",
        status: "ACTIVE_BOUND",
        maxCapacityLiter: 50,
        currentVolumeLiter: 20,
        category: { name: "Organik" },
        rw: { kelurahan: { name: "Dago" } },
      },
      {
        id: "bin-2",
        status: "ACTIVE_BOUND",
        maxCapacityLiter: 50,
        currentVolumeLiter: 48, // > 90% (kritis)
        category: { name: "Anorganik" },
        rw: { kelurahan: { name: "Sadang Serang" } },
      },
      {
        id: "bin-3",
        status: "UNBOUND",
        maxCapacityLiter: 50,
        currentVolumeLiter: 0,
        category: { name: "Residu" },
        rw: { kelurahan: { name: "Sekeloa" } },
      },
    ]);

    // Mock Dispatch Tasks (Ritase)
    (prisma.dispatchTask.count as any).mockImplementation(({ where }: any) => {
      if (where?.status === "COMPLETED") return Promise.resolve(8);
      if (where?.status === "IN_PROGRESS") return Promise.resolve(2);
      if (where?.status === "PENDING") return Promise.resolve(0);
      return Promise.resolve(10); // total
    });

    // Mock Setoran Otomatis
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([
      {
        id: "setor-1",
        berat: 15.5,
        confidenceAi: 95.0,
        hasilKlasifikasiAi: "Sampah Organik",
        kategoriAktual: null,
        createdAt: new Date(),
        bin: { category: { name: "Organik" }, rw: { kelurahan: { name: "Dago" } } },
        warga: { rw: { kelurahan: { name: "Dago" } } },
      },
      {
        id: "setor-2",
        berat: 10.0,
        confidenceAi: 88.0,
        hasilKlasifikasiAi: "Sampah Anorganik",
        kategoriAktual: null,
        createdAt: new Date(),
        bin: { category: { name: "Anorganik" }, rw: { kelurahan: { name: "Dago" } } },
        warga: { rw: { kelurahan: { name: "Dago" } } },
      },
    ]);

    // Mock Setoran Manual (Residu)
    (prisma.setoranManual.findMany as any).mockResolvedValue([
      {
        id: "man-1",
        berat: 8.5,
        kategori: "residu",
        createdAt: new Date(),
        rw: { kelurahan: { name: "Dago" } },
        petugas: { id: "p-1", name: "Petugas Anton", phone: "0811111111" },
      },
    ]);

    // Mock Produksi Fasilitas & Pemanfaatan
    (prisma.facilityProductionLog.findMany as any).mockResolvedValue([
      {
        id: "prod-1",
        materialMasukKg: 50,
        outputKg: 35,
        jenisOutput: "Kompos Organik",
        facility: { rw: { kelurahan: { name: "Sadang Serang" } } },
      },
    ]);

    (prisma.pemanfaatan.findMany as any).mockResolvedValue([
      {
        id: "pem-1",
        program: "Maggot BSF",
        teknologi: "Biokonversi",
        volumeBahanBaku: 30,
        hasil: 12,
        rw: { kelurahan: { name: "Lebak Gede" } },
      },
    ]);

    // Mock Survei Baseline
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([
      {
        namaKelurahan: "Dago",
        pemilahanSampah: { persentasePemilahan: 12.5 },
      },
      {
        namaKelurahan: "Sadang Serang",
        pemilahanSampah: { persentasePemilahan: 24.8 },
      },
    ]);
  });

  it("should generate complete waste executive report with valid structure", async () => {
    const report = await wasteExecutiveReportService.getWasteExecutiveReport();

    // 1. Metadata Verification
    expect(report.metadata).toBeDefined();
    expect(report.metadata.nomorDokumen).toContain("BERSEKA/LAP-TKS/");
    expect(report.metadata.judulLaporan).toContain("Tata Kelola Sampah");

    // 2. Infrastruktur Verification
    expect(report.kpiSummary.infrastruktur.totalFasilitas).toBe(3);
    expect(report.kpiSummary.infrastruktur.tps3rCount).toBe(1);
    expect(report.kpiSummary.infrastruktur.bankSampahCount).toBe(1);
    expect(report.kpiSummary.infrastruktur.rumahMaggotCount).toBe(1);
    expect(report.kpiSummary.infrastruktur.wadahSampahTotal).toBe(3);
    expect(report.kpiSummary.infrastruktur.wadahSampahAktif).toBe(2);
    expect(report.kpiSummary.infrastruktur.wadahKritis).toBe(1);

    // 3. Operasional & Ritase Verification
    expect(report.kpiSummary.operasional.totalRitase).toBe(10);
    expect(report.kpiSummary.operasional.ritaseSelesai).toBe(8);
    expect(report.kpiSummary.operasional.tingkatKeberhasilanRitase).toBe(80);
    expect(report.kpiSummary.operasional.materialOrganikMasukKg).toBe(80); // 50 + 30
    expect(report.kpiSummary.operasional.outputProdukOrganikKg).toBe(47); // 35 + 12

    // 4. Dampak & Reduksi Verification
    expect(report.kpiSummary.dampakDanReduksi.totalSampahTerpilahKg).toBe(25.5); // 15.5 + 10.0
    expect(report.kpiSummary.dampakDanReduksi.residuKeTpaKg).toBe(8.5);
    expect(report.kpiSummary.dampakDanReduksi.totalTimbulanSampahKg).toBe(34.0);
    expect(report.kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaTon).toBeGreaterThan(0);
    expect(report.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen).toBeGreaterThan(50);
    expect(report.kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg).toBeGreaterThan(0);

    // 5. Kelurahan Audit Verification
    expect(report.kelurahanAudit).toHaveLength(6);
    const dagoAudit = report.kelurahanAudit.find((k) => k.kelurahan === "Dago");
    expect(dagoAudit).toBeDefined();
    expect(dagoAudit?.baselineRate).toBe(12.5);
    expect(dagoAudit?.currentComplianceRate).toBe(100); // 2 compliant out of 2 evaluated
    expect(dagoAudit?.deltaPercent).toBe(87.5);

    // 6. Signatories Verification
    expect(report.signatories.camat.nama).toBeDefined();
    expect(report.signatories.dlh.nama).toBeDefined();
    expect(report.signatories.pimpinan.nama).toBeDefined();
  });

  it("should generate valid Excel workbook with 4 sheets", async () => {
    const buffer = await wasteExecutiveReportService.exportWasteExecutiveReport();
    expect(buffer).toBeInstanceOf(Buffer);

    const wb = XLSX.read(buffer, { type: "buffer" });
    expect(wb.SheetNames).toContain("Ringkasan Eksekutif");
    expect(wb.SheetNames).toContain("Kinerja per Kelurahan");
    expect(wb.SheetNames).toContain("Database Fasilitas");
    expect(wb.SheetNames).toContain("Tren Berkala");
  });
});
