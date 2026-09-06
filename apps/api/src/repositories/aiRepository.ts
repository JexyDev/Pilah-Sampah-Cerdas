import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { AiRequestLog } from "@prisma/client";

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
