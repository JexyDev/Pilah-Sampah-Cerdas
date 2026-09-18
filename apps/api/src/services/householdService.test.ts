import { describe, it, expect, vi, beforeEach } from "vitest";
import { householdService } from "./householdService.js";
import { householdRepository } from "../repositories/householdRepository.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../repositories/householdRepository.js", () => {
  return {
    householdRepository: {
      findHouseholdsByUserId: vi.fn(),
    },
  };
});

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      binOwnership: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe("householdService - joinHousehold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw USER_NOT_FOUND if current user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(householdService.joinHousehold("user-1", "08123456789")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
      status: 404,
    });
  });

  it("should throw CANNOT_JOIN_SELF if head phone matches current user phone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      phone: "08123456789",
      binOwnerships: [],
    } as any);

    await expect(householdService.joinHousehold("user-1", "08123456789")).rejects.toMatchObject({
      code: "CANNOT_JOIN_SELF",
      status: 400,
    });
  });

  it("should throw ALREADY_FULLY_ACTIVE if current user has primary bin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      phone: "08111111111",
      binOwnerships: [{ type: "UTAMA", binId: "bin-1" }],
    } as any);

    await expect(householdService.joinHousehold("user-1", "08222222222")).rejects.toMatchObject({
      code: "ALREADY_FULLY_ACTIVE",
      status: 400,
    });
  });

  it("should throw HEAD_NOT_FOUND if head user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      phone: "08111111111",
      binOwnerships: [],
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(householdService.joinHousehold("user-1", "08222222222")).rejects.toMatchObject({
      code: "HEAD_NOT_FOUND",
      status: 404,
    });
  });

  it("should throw HEAD_HAS_NO_BIN if head user has no active bin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      phone: "08111111111",
      binOwnerships: [],
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "head-1",
      phone: "08222222222",
      binOwnerships: [],
      households: [],
    } as any);

    await expect(householdService.joinHousehold("user-1", "08222222222")).rejects.toMatchObject({
      code: "HEAD_HAS_NO_BIN",
      status: 400,
    });
  });

  it("should connect user to household successfully with existing valid komunitasId", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      phone: "08111111111",
      komunitasId: "WB-32730211100001",
      binOwnerships: [],
    } as any);

    const mockHeadUser = {
      id: "head-1",
      name: "Budi Santoso",
      phone: "08222222222",
      address: "Jl. Mawar No. 1",
      rwId: 1,
      rtId: 2,
      komunitasId: "WB-32730222200002",
      binOwnerships: [{ binId: "bin-100", type: "UTAMA" }],
      households: [
        {
          id: "hh-1",
          address: "Jl. Mawar No. 1",
          rwId: 1,
          rw: {
            name: "03",
            kelurahan: {
              name: "Dago",
              kode: "1001",
              kecamatan: {
                name: "Coblong",
                kode: "02",
                kabupaten: {
                  name: "Kota Bandung",
                  kode: "73",
                  provinsi: { name: "Jawa Barat", kode: "32" },
                },
              },
            },
          },
        },
      ],
    };
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockHeadUser as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      return cb({
        binOwnership: {
          upsert: vi.fn(),
          findMany: vi.fn().mockResolvedValue([{ userId: "user-1" }, { userId: "head-1" }]),
        },
        user: { update: vi.fn() },
      });
    });

    const result = await householdService.joinHousehold("user-1", "08222222222");

    expect(result.household.headName).toBe("Budi Santoso");
    expect(result.household.rw).toBe("03");
    expect(result.household.kelurahan).toBe("Dago");
    expect(result.household.kecamatan).toBe("Coblong");
    expect(result.user.lifecycleState).toBe("FULLY_ACTIVE");
    expect(result.user.komunitasId).toBe("WB-32730211100001");
  });

  it("should generate new WB- format ID when user has null or legacy KOM- komunitasId", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({
        id: "user-2",
        phone: "081234567890",
        komunitasId: "KOM-OLD123",
        binOwnerships: [],
      } as any)
      .mockResolvedValueOnce(null); // for uniqueness check

    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const mockHeadUser = {
      id: "head-1",
      name: "Budi Santoso",
      phone: "08222222222",
      address: "Jl. Mawar No. 1",
      rwId: 1,
      rtId: 2,
      binOwnerships: [{ binId: "bin-100", type: "UTAMA" }],
      households: [
        {
          id: "hh-1",
          address: "Jl. Mawar No. 1",
          rwId: 1,
          rw: {
            name: "03",
            kelurahan: {
              name: "Dago",
              kode: "1001",
              kecamatan: {
                name: "Coblong",
                kode: "02",
                kabupaten: {
                  name: "Kota Bandung",
                  kode: "73",
                  provinsi: { name: "Jawa Barat", kode: "32" },
                },
              },
            },
          },
        },
      ],
    };
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockHeadUser as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
      return cb({
        binOwnership: {
          upsert: vi.fn(),
          findMany: vi.fn().mockResolvedValue([{ userId: "user-2" }, { userId: "head-1" }]),
        },
        user: { update: vi.fn() },
      });
    });

    const result = await householdService.joinHousehold("user-2", "08222222222");

    expect(result.user.lifecycleState).toBe("FULLY_ACTIVE");
    expect(result.user.komunitasId).toBe("WB-32730289000001");
  });
});

describe("householdService - getMyHouseholdDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return UTAMA detail with members when user is head", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "head-1",
      name: "Budi Santoso",
      phone: "08222222222",
      binOwnerships: [
        {
          type: "UTAMA",
          bin: {
            binOwnerships: [
              {
                type: "UTAMA",
                userId: "head-1",
                user: { id: "head-1", name: "Budi Santoso", phone: "08222222222" },
              },
              {
                type: "TAMBAHAN",
                userId: "member-1",
                user: { id: "member-1", name: "Siti Aminah", phone: "08333333333" },
              },
            ],
          },
        },
      ],
    } as any);

    const result = await householdService.getMyHouseholdDetail("head-1");

    expect(result.myOwnershipType).toBe("UTAMA");
    expect(result.headName).toBe("Budi Santoso");
    expect(result.sharePhone).toBe("08222222222");
    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe("Siti Aminah");
  });

  it("should return TAMBAHAN detail with empty members array when user is member", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "member-1",
      name: "Siti Aminah",
      phone: "08333333333",
      binOwnerships: [
        {
          type: "TAMBAHAN",
          bin: {
            binOwnerships: [
              {
                type: "UTAMA",
                userId: "head-1",
                user: { id: "head-1", name: "Budi Santoso", phone: "08222222222" },
              },
              {
                type: "TAMBAHAN",
                userId: "member-1",
                user: { id: "member-1", name: "Siti Aminah", phone: "08333333333" },
              },
            ],
          },
        },
      ],
    } as any);

    const result = await householdService.getMyHouseholdDetail("member-1");

    expect(result.myOwnershipType).toBe("TAMBAHAN");
    expect(result.headName).toBe("Budi Santoso");
    expect(result.sharePhone).toBe("08222222222");
    expect(result.members).toHaveLength(0);
  });
});

describe("householdService - getHouseholdsByUser (Hybrid Auto-Scale)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should keep manual declared familySize when connected accounts are fewer (max(4, 2) = 4)", async () => {
    vi.mocked(householdRepository.findHouseholdsByUserId).mockResolvedValue([
      {
        id: "hh-1",
        userId: "head-1",
        user: { id: "head-1", jumlahAnggotaKeluarga: 4 },
      },
    ] as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "head-1",
      jumlahAnggotaKeluarga: 4,
    } as any);

    vi.mocked(prisma.binOwnership.findMany)
      .mockResolvedValueOnce([{ binId: "bin-1" }] as any) // headBins
      .mockResolvedValueOnce([{ userId: "head-1" }, { userId: "member-1" }] as any); // distinctMembers (2 akun)

    const result = await householdService.getHouseholdsByUser("head-1");

    expect(result).toHaveLength(1);
    expect(result[0].familySize).toBe(4);
    expect(result[0].jumlahAnggotaKeluarga).toBe(4);
  });

  it("should auto-scale familySize when connected accounts exceed manual input (max(3, 5) = 5)", async () => {
    vi.mocked(householdRepository.findHouseholdsByUserId).mockResolvedValue([
      {
        id: "hh-1",
        userId: "head-1",
        user: { id: "head-1", jumlahAnggotaKeluarga: 3 },
      },
    ] as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "member-4",
      jumlahAnggotaKeluarga: null,
    } as any);

    vi.mocked(prisma.binOwnership.findMany)
      .mockResolvedValueOnce([{ binId: "bin-1" }] as any) // headBins
      .mockResolvedValueOnce([
        { userId: "head-1" },
        { userId: "member-1" },
        { userId: "member-2" },
        { userId: "member-3" },
        { userId: "member-4" },
      ] as any); // distinctMembers (5 akun)

    const result = await householdService.getHouseholdsByUser("member-4");

    expect(result).toHaveLength(1);
    expect(result[0].familySize).toBe(5);
    expect(result[0].jumlahAnggotaKeluarga).toBe(5);
  });
});
