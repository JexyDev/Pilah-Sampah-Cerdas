/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { facilityService } from "./facilityService.js";
import { bankSampahService } from "./bankSampahService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

const mockCreate = vi.fn();
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@prisma/client", () => {
  const mPrisma = {
    facility: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    facilityProductionLog: {
      create: (...args: any[]) => mockCreate(...args),
    },
    peternakan: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    maggotDistributionLog: {
      create: (...args: any[]) => mockCreate(...args),
    },
    bankSampahLedger: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    notificationLog: {
      create: (...args: any[]) => mockCreate(...args),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => {
      return cb(mPrisma);
    }),
  };

  return {
    PrismaClient: class {
      facility = mPrisma.facility;
      facilityProductionLog = mPrisma.facilityProductionLog;
      peternakan = mPrisma.peternakan;
      maggotDistributionLog = mPrisma.maggotDistributionLog;
      bankSampahLedger = mPrisma.bankSampahLedger;
      notificationLog = mPrisma.notificationLog;
      $transaction = mPrisma.$transaction;
    },
    FacilityType: {
      loseda: "loseda",
      bata_terawang: "bata_terawang",
      rumah_maggot: "rumah_maggot",
      bank_sampah: "bank_sampah",
      tps: "tps",
    },
  };
});

describe("Batch 3 Modul Besar Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("facilityService", () => {
    it("should create a facility and filter by type", async () => {
      mockCreate.mockResolvedValue({ id: "f-1", jenis: "rumah_maggot", nama: "Rumah Maggot 1" });
      mockFindMany.mockResolvedValue([{ id: "f-1", jenis: "rumah_maggot" }]);

      const created = await facilityService.createFacility(
        "rumah_maggot",
        "Rumah Maggot 1",
        "PIC-1"
      );
      const list = await facilityService.getFacilities("rumah_maggot");

      expect(created.jenis).toBe("rumah_maggot");
      expect(list.length).toBe(1);
      expect(mockCreate).toHaveBeenCalled();
    });

    it("should log production and distribute maggot to farm", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "rm-1", jenis: "rumah_maggot" }); // for facility
      mockFindUnique.mockResolvedValueOnce({ id: "farm-1", nama: "Peternakan A" }); // for farm

      await facilityService.recordProduction("rm-1", 100, 10, "Maggot Kering", "2026-W29");
      await facilityService.distributeMaggot("farm-1", 5);

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("bankSampahService", () => {
    it("should process deposit transaction and update saldoRupiah", async () => {
      mockFindUnique.mockResolvedValue({
        id: "l-1",
        userId: "warga-1",
        saldoRupiah: 100.0,
        riwayatTransaksi: "[]",
      });

      mockUpdate.mockImplementation(async (args: any) => args.data);

      const res = await bankSampahService.addTransaction(
        "warga-1",
        "DEPOSIT",
        50,
        "Setoran plastik"
      );

      expect(Number(res.saldoRupiah)).toBe(150.0);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should throw error if withdrawal exceeds balance", async () => {
      mockFindUnique.mockResolvedValue({
        id: "l-1",
        userId: "warga-1",
        saldoRupiah: 20.0,
        riwayatTransaksi: "[]",
      });

      await expect(bankSampahService.addTransaction("warga-1", "WITHDRAWAL", 50)).rejects.toThrow(
        "INSUFFICIENT_FUNDS"
      );
    });
  });

  describe("notificationService", () => {
    it("should send mock notifications and create notification log", async () => {
      await notificationIntegrationService.sendWhatsApp("0812345", "OTP code is 1234", "OTP");
      await notificationIntegrationService.sendEmail(
        "user@example.com",
        "Test Subject",
        "Test Body"
      );
      await notificationIntegrationService.sendPushNotification("fcm-token-abc", "Title", "Body");

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });
});
