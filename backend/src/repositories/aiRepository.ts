import { PrismaClient, AiRequestLog } from "@prisma/client";

const prisma = new PrismaClient();

export class AiRepository {
  /**
   * Log AI request result
   */
  async logRequest(
    userId: string,
    requestId: string,
    imageUrl: string,
    status: "SUCCESS" | "TIMEOUT" | "IMAGE_UNREADABLE"
  ): Promise<AiRequestLog> {
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
