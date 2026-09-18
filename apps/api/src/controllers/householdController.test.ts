import { describe, it, expect, vi, beforeEach } from "vitest";
import { householdController } from "./householdController.js";
import { householdService } from "../services/householdService.js";
import { Request, Response } from "express";

vi.mock("../services/householdService.js", () => {
  return {
    householdService: {
      joinHousehold: vi.fn(),
      getMyHouseholdDetail: vi.fn(),
      getBinsSummary: vi.fn(),
      registerHousehold: vi.fn(),
      getHouseholdsByUser: vi.fn(),
      getAllHouseholds: vi.fn(),
    },
  };
});

describe("householdController - joinHousehold", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it("should return 400 VALIDATION_ERROR when headPhone is missing or blank", async () => {
    req = {
      user: { userId: "user-1" } as any,
      body: {},
    };

    await householdController.joinHousehold(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "VALIDATION_ERROR",
      })
    );
  });

  it("should return 200 with result when joinHousehold succeeds", async () => {
    req = {
      user: { userId: "user-1" } as any,
      body: { headPhone: "08123456789" },
    };

    const mockResult = {
      household: { id: "hh-1", headName: "Budi" },
      user: { id: "user-1", lifecycleState: "FULLY_ACTIVE" },
    };
    vi.mocked(householdService.joinHousehold).mockResolvedValue(mockResult as any);

    await householdController.joinHousehold(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Berhasil terhubung ke Rumah Tangga",
      data: mockResult,
    });
  });

  it("should return custom error status and code when service throws", async () => {
    req = {
      user: { userId: "user-1" } as any,
      body: { headPhone: "08123456789" },
    };

    const err: any = new Error("Nomor HP Kepala Keluarga tidak terdaftar di Berseka.");
    err.status = 404;
    err.code = "HEAD_NOT_FOUND";
    vi.mocked(householdService.joinHousehold).mockRejectedValue(err);

    await householdController.joinHousehold(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: "HEAD_NOT_FOUND",
      message: "Nomor HP Kepala Keluarga tidak terdaftar di Berseka.",
    });
  });
});

describe("householdController - getMyHousehold", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it("should return 200 with my household detail", async () => {
    req = {
      user: { userId: "user-1" } as any,
    };

    const mockData = {
      myOwnershipType: "UTAMA",
      headName: "Budi",
      sharePhone: "08123456789",
      members: [],
    };
    vi.mocked(householdService.getMyHouseholdDetail).mockResolvedValue(mockData as any);

    await householdController.getMyHousehold(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: mockData,
    });
  });
});
