import { describe, it, expect, vi, beforeEach } from "vitest";
import { systemService } from "./systemService.js";
import { systemController } from "../controllers/systemController.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    systemConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditTrail: {
      findMany: vi.fn(),
    },
    socialFeed: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    bin: {
      count: vi.fn(),
    },
    setoranManual: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    setoranOtomatis: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    pemanfaatan: {
      aggregate: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    schedule: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    kelurahan: {
      count: vi.fn(),
    },
    pointHistory: {
      aggregate: vi.fn(),
    },
    ideDaurUlang: {
      count: vi.fn(),
    },
  },
}));

describe("SystemService & SystemController - App Version & Updater", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default fallback app version when no config is in DB", async () => {
    (prisma.systemConfig.findUnique as any).mockResolvedValue(null);

    const release = await systemService.getLatestRelease();
    expect(release).toBeDefined();
    expect(release.latestVersion).toBe("1.0.0");
    expect(release.downloadUrl).toBe("http://157.10.252.252:3000/api/v1/system/download-apk");
    expect(release.forceUpdate).toBe(false);
  });

  it("should return custom app version when configured in DB", async () => {
    const mockConfig = {
      key: "app_release_info",
      value: JSON.stringify({
        latestVersion: "1.0.2",
        downloadUrl: "https://drive.google.com/uc?id=example_apk_id",
        forceUpdate: true,
        releaseNotes: "Update fitur pemilahan sampah",
      }),
    };
    (prisma.systemConfig.findUnique as any).mockResolvedValue(mockConfig);

    const release = await systemService.getLatestRelease();
    expect(release.latestVersion).toBe("1.0.2");
    expect(release.downloadUrl).toBe("https://drive.google.com/uc?id=example_apk_id");
    expect(release.forceUpdate).toBe(true);
  });

  it("should publish a new release successfully and persist to systemConfig", async () => {
    (prisma.systemConfig.upsert as any).mockResolvedValue({});

    const releaseData = await systemService.publishRelease("Admin DLH", {
      version: "1.0.3",
      latestVersion: "1.0.3",
      downloadUrl: "https://storage.googleapis.com/trashcare/BERSEKA-v1.0.3.apk",
      forceUpdate: false,
      releaseNotes: "Fixes and improvements",
    });

    expect(releaseData.latestVersion).toBe("1.0.3");
    expect(releaseData.downloadUrl).toBe(
      "https://storage.googleapis.com/trashcare/BERSEKA-v1.0.3.apk"
    );
    expect(prisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "app_release_info" },
      })
    );
  });

  it("should handle getAppVersion controller response format accurately for mobile update checker", async () => {
    const mockConfig = {
      key: "app_release_info",
      value: JSON.stringify({
        latestVersion: "1.0.2",
        downloadUrl: "https://server.com/app-v1.0.2.apk",
        forceUpdate: false,
        releaseNotes: "Pembaruan rutin",
      }),
    };
    (prisma.systemConfig.findUnique as any).mockResolvedValue(mockConfig);

    let jsonResponse: any = null;
    let statusCode: number = 0;
    const req = {} as any;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
          },
        };
      },
    } as any;

    await systemController.getAppVersion(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResponse.latestVersion).toBe("1.0.2");
    expect(jsonResponse.downloadUrl).toBe("https://server.com/app-v1.0.2.apk");
    expect(jsonResponse.forceUpdate).toBe(false);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.data).toBeDefined();
  });

  it("should return exact force update JSON structure on GET /api/v1/config/app-version", async () => {
    const { configService } = await import("./configService.js");
    const { configController } = await import("../controllers/configController.js");

    const appVerConfig = await configService.getAppVersionConfig();
    expect(appVerConfig).toHaveProperty("min_required_version");
    expect(appVerConfig).toHaveProperty("latest_version");
    expect(appVerConfig).toHaveProperty("update_url");

    let jsonResponse: any = null;
    let statusCode: number = 0;
    const req = {} as any;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
          },
        };
      },
    } as any;

    await configController.getAppVersion(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResponse).toEqual(
      expect.objectContaining({
        min_required_version: expect.any(String),
        latest_version: expect.any(String),
        update_url: expect.any(String),
      })
    );
  });
});
