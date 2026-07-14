import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class PointRepository {
    /**
     * Get point history by user ID, ordered by newest
     */
    async getHistoryByUserId(userId) {
        return prisma.pointHistory.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Get total accumulated points by user ID
     */
    async getTotalPoints(userId) {
        const aggregate = await prisma.pointHistory.aggregate({
            where: { userId },
            _sum: {
                points: true
            }
        });
        return aggregate._sum.points || 0;
    }
}
export const pointRepository = new PointRepository();
