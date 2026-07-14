import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class HouseholdRepository {
    /**
     * Create a new household registration.
     */
    async createHousehold(data) {
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
    async findHouseholdById(id) {
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
    async findHouseholdsByUserId(userId) {
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
    async findHouseholdByUserAndArea(userId, rtRwId) {
        return prisma.household.findFirst({
            where: {
                userId,
                rtRwId,
            }
        });
    }
}
export const householdRepository = new HouseholdRepository();
