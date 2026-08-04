/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/monitoring/live:
 *   get:
 *     summary: Get live geospatial monitoring data for all bins
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/live", async (req, res) => {
    try {
        const bins = await prisma.bin.findMany({
            include: {
                category: true,
                rtRw: true,
                user: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
            },
        });

        const liveData = bins.map((bin) => {
            const currentVol = Number(bin.currentVolumeLiter || 0);
            const maxVol = Number(bin.maxCapacityLiter || 25);
            const fullness = maxVol > 0 ? Math.round((currentVol / maxVol) * 100) : 0;
            let status = "NORMAL";
            if (fullness >= 90) status = "KRITIS";
            else if (fullness >= 70) status = "SEDANG";

            return {
                id: bin.id,
                qrCode: bin.qrCode,
                latitude: bin.latitude ? Number(bin.latitude) : -6.890123,
                longitude: bin.longitude ? Number(bin.longitude) : 107.612345,
                currentVolumeLiter: currentVol,
                maxCapacityLiter: maxVol,
                fullnessPercent: fullness,
                status,
                category: bin.category?.name || "ORGANIC",
                rtRw: bin.rtRw?.name || "Coblong",
                wargaName: bin.user?.name || "-",
                updatedAt: bin.updatedAt,
            };
        });

        res.status(200).json({
            success: true,
            totalBins: liveData.length,
            data: liveData,
        });
    } catch (error) {
        console.error("[MonitoringRouter] Live endpoint error:", error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data live monitoring geospasial",
        });
    }
});

export default router;
