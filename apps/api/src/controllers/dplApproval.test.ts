/**
 * Project: BERSEKA
 * Unit test: Pembatasan Otorisasi & Hak Akses Approval Izin Mahasiswa pada Role Pimpinan
 */

import { describe, it, expect, vi } from "vitest";
import { Request, Response } from "express";
import { disallowPimpinanLeaveMutation } from "../routes/dplRoutes.js";
import { dplController } from "./dplController.js";
import { dplService } from "../services/dplService.js";

describe("DPL Approval Authorization & Read-Only for Pimpinan", () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  describe("disallowPimpinanLeaveMutation middleware", () => {
    it("should return 403 Forbidden when user has role PIMPINAN", () => {
      const req = {
        user: { userId: "user-pimpinan-1", role: "PIMPINAN" },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn();

      disallowPimpinanLeaveMutation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "FORBIDDEN",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 Forbidden when user has role PEMIMPIN", () => {
      const req = {
        user: { userId: "user-pemimpin-1", role: "PEMIMPIN" },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn();

      disallowPimpinanLeaveMutation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow DPL to proceed to next()", () => {
      const req = {
        user: { userId: "user-dpl-1", role: "DPL" },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn();

      disallowPimpinanLeaveMutation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow PANITIA_TASKFORCE to proceed to next()", () => {
      const req = {
        user: { userId: "user-taskforce-1", role: "PANITIA_TASKFORCE" },
      } as unknown as Request;
      const res = mockResponse();
      const next = vi.fn();

      disallowPimpinanLeaveMutation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("dplController role checks", () => {
    it("decideLeaveRequest should reject PIMPINAN with 403 Forbidden", async () => {
      const req = {
        user: { userId: "pimpinan-id", role: "PIMPINAN" },
        params: { requestId: "req-123" },
        body: { status: "APPROVED" },
      } as unknown as Request;
      const res = mockResponse();

      await dplController.decideLeaveRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "FORBIDDEN",
        })
      );
    });

    it("decideCancelLeaveRequest should reject PIMPINAN with 403 Forbidden", async () => {
      const req = {
        user: { userId: "pimpinan-id", role: "PIMPINAN" },
        params: { requestId: "req-123" },
        body: { action: "APPROVE_HADIR" },
      } as unknown as Request;
      const res = mockResponse();

      await dplController.decideCancelLeaveRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "FORBIDDEN",
        })
      );
    });
  });

  describe("dplService role checks", () => {
    it("getAlerts should return empty pending arrays immediately for PIMPINAN", async () => {
      const result = await dplService.getAlerts("any-user-id", "PIMPINAN");
      expect(result).toEqual({
        pendingApprovalsCount: 0,
        pendingRequests: [],
      });
    });

    it("getAlerts should return empty pending arrays immediately for PEMIMPIN", async () => {
      const result = await dplService.getAlerts("any-user-id", "PEMIMPIN");
      expect(result).toEqual({
        pendingApprovalsCount: 0,
        pendingRequests: [],
      });
    });

    it("decideLeaveRequest should throw FORBIDDEN_READ_ONLY for PIMPINAN", async () => {
      await expect(
        dplService.decideLeaveRequest("pimpinan-id", "req-1", "APPROVED", undefined, "PIMPINAN")
      ).rejects.toThrow("FORBIDDEN_READ_ONLY");
    });

    it("decideCancelLeaveRequest should throw FORBIDDEN_READ_ONLY for PIMPINAN", async () => {
      await expect(
        dplService.decideCancelLeaveRequest(
          "pimpinan-id",
          "req-1",
          "APPROVE_HADIR",
          undefined,
          "PIMPINAN"
        )
      ).rejects.toThrow("FORBIDDEN_READ_ONLY");
    });
  });
});
