import { PrismaClient, Household, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class HouseholdRepository {
  /**
   * Create a new household registration.
   */
  async createHousehold(data: Prisma.HouseholdUncheckedCreateInput): Promise<Household> {
    return prisma.household.create({
      data,
      include: {
        rtRw: true,
      },
    });
  }

  /**
   * Find a household by its ID.
   */
  async findHouseholdById(id: string): Promise<Household | null> {
    return prisma.household.findUnique({
      where: { id },
      include: {
        rtRw: {
          include: { kelurahan: true }
        },
      },
    });
  }

  /**
   * Get all households for a user.
   */
  async findHouseholdsByUserId(userId: string): Promise<Household[]> {
    return prisma.household.findMany({
      where: { userId },
      include: {
        rtRw: {
          include: { kelurahan: true }
        },
      },
    });
  }

  /**
   * Check if user already registered a household in the same area.
   */
  async findHouseholdByUserAndArea(userId: string, rtRwId: number): Promise<Household | null> {
    return prisma.household.findFirst({
      where: {
        userId,
        rtRwId,
      }
    });
  }

  /**
   * Find all households in the system.
   */
  async findAll(): Promise<any[]> {
    return prisma.household.findMany({
      include: {
        rtRw: {
          include: { kelurahan: true }
        },
        user: {
          select: { name: true }
        }
      }
    });
  }
}

export const householdRepository = new HouseholdRepository();
