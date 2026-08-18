import { prisma } from "../lib/prisma.js";
import { convexHull, Point } from "../utils/geoUtils.js";

export class PolygonService {
  /**
   * Regenerates the polygon for a specific RT/RW based on all its registered households.
   */
  async regenerateRtRwPolygon(rwId: number): Promise<void> {
    // WargaPolygon has been removed. Polygon logic is now manual via KknActivityZone.
    return;
  }
}

export const polygonService = new PolygonService();
