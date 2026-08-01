/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
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
                resultStatus: status,
            },
        });
    }
}
export const aiRepository = new AiRepository();
