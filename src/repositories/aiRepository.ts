/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

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
        resultStatus: status,
      },
    });
  }
}

export const aiRepository = new AiRepository();
