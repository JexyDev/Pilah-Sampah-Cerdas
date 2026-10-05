/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit test for roleMiddleware security and Developer vs Super User isolation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { roleMiddleware } from "./roleMiddleware.js";

describe("roleMiddleware Security & Developer Isolation", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: {},
      originalUrl: "/api/test",
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it("should allow DEVELOPER unconditionally across all endpoints", () => {
    mockReq.user = { role: "DEVELOPER" };
    const middleware = roleMiddleware(["PANITIA_TASKFORCE"]);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should allow SUPER_USER when route explicitly includes SUPER_USER", () => {
    mockReq.user = { role: "SUPER_USER" };
    const middleware = roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should block SUPER_USER with 403 when route is restricted exclusively to DEVELOPER", () => {
    mockReq.user = { role: "SUPER_USER" };
    const middleware = roleMiddleware(["DEVELOPER"]);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "FORBIDDEN",
        message: expect.stringContaining("Developer"),
      })
    );
  });

  it("should support alias normalization between PIMPINAN and PEMIMPIN", () => {
    mockReq.user = { role: "PEMIMPIN" };
    const middleware = roleMiddleware(["PIMPINAN"]);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("should block unauthorized roles with 403", () => {
    mockReq.user = { role: "WARGA" };
    const middleware = roleMiddleware(["SUPER_USER", "ADMIN_DLH"]);

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
  });
});
