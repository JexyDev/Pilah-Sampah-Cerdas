import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class AiRepository {
    /**
     * Log AI request result
     */
    async logRequest(userId, requestId, imageUrl, status) {
        return prisma.aiRequestLog.create({
            data: {
                userId,
                requestId,
                imageUrl,
                resultStatus: status
            }
        });
    }
}
export const aiRepository = new AiRepository();
