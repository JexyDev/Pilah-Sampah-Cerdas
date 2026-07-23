/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { authMiddleware } from "./authMiddleware.js";
import { verifyAccessToken } from "../utils/jwtUtils.js";

const mockFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      studentKkn = {
        findUnique: (...args: any[]) => mockFindUnique(...args),
      };
      user = {
        findUnique: (...args: any[]) => mockUserFindUnique(...args),
      };
    },
  };
});

vi.mock("../utils/jwtUtils.js", () => {
  return {
    verifyAccessToken: vi.fn(),
  };
});

describe("authMiddleware security policies", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ status: "Aktif" });
    mockReq = {
      headers: {
        authorization: "Bearer mock_token",
      },
      method: "GET",
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it("should block CAMAT role from POST request with 403", async () => {
    mockReq.method = "POST";
    const decodedToken = { userId: "user-camat", role: "CAMAT" };
    vi.mocked(verifyAccessToken).mockReturnValue(decodedToken as any);

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "FORBIDDEN" }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should allow CAMAT role for GET request", async () => {
    mockReq.method = "GET";
    const decodedToken = { userId: "user-camat", role: "CAMAT" };
    vi.mocked(verifyAccessToken).mockReturnValue(decodedToken as any);

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual(decodedToken);
  });

  it("should block expired Mahasiswa KKN role from POST request with 403", async () => {
    mockReq.method = "POST";
    const decodedToken = { userId: "user-kkn", role: "MAHASISWA_KKN" };
    vi.mocked(verifyAccessToken).mockReturnValue(decodedToken as any);

    // Mock studentKkn expired date (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockFindUnique.mockResolvedValue({ endDate: yesterday });

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "FORBIDDEN",
        message: "Masa tugas KKN Anda telah berakhir. Akses diubah menjadi Read-Only.",
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
