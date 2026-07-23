/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService.js";
import { authRepository } from "../repositories/authRepository.js";
import { binRepository } from "../repositories/binRepository.js";

vi.mock("../repositories/authRepository.js", () => {
  return {
    authRepository: {
      findUserByEmail: vi.fn(),
      findUserByNik: vi.fn(),
      registerWargaTx: vi.fn(),
      createRefreshToken: vi.fn(),
    },
  };
});

vi.mock("../repositories/binRepository.js", () => {
  return {
    binRepository: {
      findByQrCode: vi.fn(),
      findQrBatchById: vi.fn(),
    },
  };
});

vi.mock("../utils/hashUtils.js", () => {
  return {
    hashPassword: vi.fn().mockResolvedValue("hashed_password"),
  };
});

describe("AuthService - registerWarga security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw PIC_MISMATCH when Mahasiswa KKN registers a bin assigned to another PIC", async () => {
    const scannerUser = { userId: "kkn-1", role: "MAHASISWA_KKN" };
    const qrCode = "QR-BATCH-1-123456";
    const wargaSubtype = "UTAMA";

    const mockBin = {
      id: "bin-1",
      qrCode,
      qrBatchId: "batch-1",
    };

    const mockBatch = {
      id: "batch-1",
      assignedPicUserId: "kkn-different-pic",
    };

    vi.mocked(binRepository.findByQrCode).mockResolvedValue(mockBin as any);
    vi.mocked(binRepository.findQrBatchById).mockResolvedValue(mockBatch as any);

    await expect(
      authService.registerWarga(
        { email: "warga@psc.id", password: "password123", name: "Warga" },
        {},
        qrCode,
        wargaSubtype,
        scannerUser
      )
    ).rejects.toThrow("PIC_MISMATCH");
  });

  it("should allow registration when Mahasiswa KKN registers a bin assigned to themselves", async () => {
    const scannerUser = { userId: "kkn-1", role: "MAHASISWA_KKN" };
    const qrCode = "QR-BATCH-1-123456";
    const wargaSubtype = "UTAMA";

    const mockBin = {
      id: "bin-1",
      qrCode,
      qrBatchId: "batch-1",
    };

    const mockBatch = {
      id: "batch-1",
      assignedPicUserId: "kkn-1",
    };

    vi.mocked(binRepository.findByQrCode).mockResolvedValue(mockBin as any);
    vi.mocked(binRepository.findQrBatchById).mockResolvedValue(mockBatch as any);
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.registerWargaTx).mockResolvedValue({ id: "warga-1" } as any);

    const result = await authService.registerWarga(
      { email: "warga@psc.id", password: "password123", name: "Warga" },
      {},
      qrCode,
      wargaSubtype,
      scannerUser
    );

    expect(authRepository.registerWargaTx).toHaveBeenCalled();
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith("warga-1", expect.any(String), expect.any(Date));
    expect(result).toEqual({
      user: {
        id: "warga-1",
        name: undefined,
        email: undefined,
        phone: undefined,
        role: "WARGA",
        rtRwId: undefined,
        fotoProfil: undefined,
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });
});
