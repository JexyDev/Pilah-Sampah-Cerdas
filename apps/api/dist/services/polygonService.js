import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class PolygonService {
    /**
     * Regenerates the polygon for a specific RT/RW based on all its registered households.
     */
    async regenerateRtRwPolygon(rwId) {
        // WargaPolygon has been removed. Polygon logic is now manual via KknActivityZone.
        return;
    }
}
export const polygonService = new PolygonService();
