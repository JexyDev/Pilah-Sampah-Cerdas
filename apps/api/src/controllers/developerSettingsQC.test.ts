/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * QC Item #2 Test Suite:
 * Toggle "Sembunyikan Akun Pengujian" in Developer Settings
 * Aturan Ketat: Khusus peran DEVELOPER saja, tidak boleh diakses oleh SUPER_USER atau role lain.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { configController } from "./configController.js";
import { configService } from "../services/configService.js";
import { kknAttendanceController } from "./kknAttendanceController.js";
import { kknAttendanceService } from "../services/kknAttendanceService.js";

vi.mock("../services/configService.js", () => ({
  configService: {
    updateConfig: vi.fn(),
    getAllConfigs: vi.fn(),
  },
}));

vi.mock("../services/kknAttendanceService.js", () => ({
  kknAttendanceService: {
    getActiveStudentsLocations: vi.fn(),
  },
}));

describe("QC Item #2: Developer Settings & Strict Role Protection", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("configController.update — Developer Config Isolation", () => {
    it("harus menolak permintaan jika key atau value kosong (400 BAD_REQUEST)", async () => {
      req = {
        body: { key: "" },
        user: { role: "DEVELOPER" },
      };

      await configController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "BAD_REQUEST",
        })
      );
    });

    it("harus MENOLAK peran SUPER_USER (403 FORBIDDEN) saat mengubah key berawalan 'dev_'", async () => {
      req = {
        body: { key: "dev_hide_test_accounts", value: "false" },
        user: { userId: "su-1", role: "SUPER_USER" }, // BUKAN DEVELOPER
      };

      await configController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "FORBIDDEN",
          message: "Konfigurasi pengembang hanya dapat diubah oleh peran DEVELOPER",
        })
      );
      expect(configService.updateConfig).not.toHaveBeenCalled();
    });

    it("harus MENOLAK peran ADMIN_DLH atau PIMPINAN saat mengubah key berawalan 'dev_'", async () => {
      req = {
        body: { key: "dev_hide_test_accounts", value: "false" },
        user: { userId: "pimpinan-1", role: "PIMPINAN" },
      };

      await configController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(configService.updateConfig).not.toHaveBeenCalled();
    });

    it("harus MENGIZINKAN peran DEVELOPER untuk mengubah konfigurasi 'dev_hide_test_accounts'", async () => {
      req = {
        body: { key: "dev_hide_test_accounts", value: "false" },
        user: { userId: "dev-1", role: "DEVELOPER" }, // STRICT DEVELOPER
      };

      vi.mocked(configService.updateConfig).mockResolvedValue({
        id: "cfg-1",
        key: "dev_hide_test_accounts",
        value: "false",
        tipe: "string",
        deskripsi: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await configController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(configService.updateConfig).toHaveBeenCalledWith("dev_hide_test_accounts", "false");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ key: "dev_hide_test_accounts" }),
        })
      );
    });
  });

  describe("Query Parameter includeTestAccounts — Hak Akses Khusus DEVELOPER", () => {
    it("harus mengizinkan includeTestAccounts=true HANYA jika pemanggil adalah DEVELOPER", async () => {
      req = {
        query: { includeTestAccounts: "true" },
        user: { userId: "dev-1", role: "DEVELOPER" },
      };

      vi.mocked(kknAttendanceService.getActiveStudentsLocations).mockResolvedValue([]);

      await kknAttendanceController.getActiveStudentsLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Argumen ke-4 adalah includeTestAccounts: harus bernilai true untuk DEVELOPER
      expect(kknAttendanceService.getActiveStudentsLocations).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        true
      );
    });

    it("harus MENGABAIKAN includeTestAccounts=true dan memaksanya menjadi false jika pemanggil adalah SUPER_USER", async () => {
      req = {
        query: { includeTestAccounts: "true" },
        user: { userId: "su-1", role: "SUPER_USER" }, // SUPER_USER TIDAK BOLEH MEMAKSA TEST ACCOUNTS
      };

      vi.mocked(kknAttendanceService.getActiveStudentsLocations).mockResolvedValue([]);

      await kknAttendanceController.getActiveStudentsLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Argumen ke-4 includeTestAccounts harus bernilai false
      expect(kknAttendanceService.getActiveStudentsLocations).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        false
      );
    });

    it("harus MENGABAIKAN includeTestAccounts=true untuk peran DPL / DOSEN_PEMBIMBING", async () => {
      req = {
        query: { includeTestAccounts: "true" },
        user: { userId: "dpl-1", role: "DPL" },
      };

      vi.mocked(kknAttendanceService.getActiveStudentsLocations).mockResolvedValue([]);

      await kknAttendanceController.getActiveStudentsLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(kknAttendanceService.getActiveStudentsLocations).toHaveBeenCalledWith(
        "dpl-1",
        undefined,
        undefined,
        false
      );
    });
  });
});
