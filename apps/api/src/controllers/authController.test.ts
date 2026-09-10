/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { authController } from "./authController.js";
import { authRepository } from "../repositories/authRepository.js";
import { authService } from "../services/authService.js";

vi.mock("fs", () => {
  return {
    default: {
      existsSync: vi.fn(),
      unlinkSync: vi.fn(),
    },
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
});

vi.mock("../repositories/authRepository.js", () => {
  return {
    authRepository: {
      findUserById: vi.fn(),
    },
  };
});

vi.mock("../services/authService.js", () => {
  return {
    authService: {
      updateProfile: vi.fn(),
    },
  };
});

describe("authController - Physical Avatar Cleanup", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("uploadAvatar should delete old physical file if exists and starts with /uploads/", async () => {
    req = {
      user: { userId: "user-1" },
      file: { filename: "new-avatar-123.jpg" },
    };

    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: "user-1",
      fotoProfil: "/uploads/old-avatar-999.jpg",
    } as any);

    vi.mocked(fs.existsSync).mockReturnValue(true);

    await authController.uploadAvatar(req, res);

    expect(authService.updateProfile).toHaveBeenCalledWith(
      "user-1",
      undefined,
      undefined,
      undefined,
      "/uploads/new-avatar-123.jpg"
    );
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("uploadAvatar should NOT delete default-avatar.png", async () => {
    req = {
      user: { userId: "user-2" },
      file: { filename: "new-avatar-456.jpg" },
    };

    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: "user-2",
      fotoProfil: "/uploads/default-avatar.png",
    } as any);

    vi.mocked(fs.existsSync).mockReturnValue(true);

    await authController.uploadAvatar(req, res);

    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("uploadAvatar should NOT delete external Unsplash photo", async () => {
    req = {
      user: { userId: "user-3" },
      file: { filename: "new-avatar-789.jpg" },
    };

    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: "user-3",
      fotoProfil: "https://images.unsplash.com/photo-12345",
    } as any);

    await authController.uploadAvatar(req, res);

    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deleteAvatar should delete old physical file and set fotoProfil to null", async () => {
    req = {
      user: { userId: "user-4" },
    };

    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: "user-4",
      fotoProfil: "/uploads/old-user-photo.png",
    } as any);

    vi.mocked(fs.existsSync).mockReturnValue(true);

    await authController.deleteAvatar(req, res);

    expect(authService.updateProfile).toHaveBeenCalledWith(
      "user-4",
      undefined,
      undefined,
      undefined,
      null
    );
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
