import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { householdRepository } from "../repositories/householdRepository.js";

export class HouseholdService {
  /**
   * Register a new household.
   */
  async registerHousehold(
    userId: string,
    address: string,
    rwId: number,
    latitude: number,
    longitude: number
  ) {
    // 1. Check if user already has a household in this specific RT/RW (to avoid duplicates)
    const existing = await householdRepository.findHouseholdByUserAndArea(userId, rwId);
    if (existing) {
      throw new Error("HOUSEHOLD_ALREADY_EXISTS");
    }

    // 2. Create the household with precise DECIMAL(11,8) GPS coordinates
    const household = await householdRepository.createHousehold({
      userId,
      address,
      rwId,
      latitude,
      longitude,
    });

    return household;
  }

  /**
   * Get households by user.
   */
  async getHouseholdsByUser(userId: string) {
    const households = await householdRepository.findHouseholdsByUserId(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { jumlahAnggotaKeluarga: true },
    });
    const defaultFamilySize = user?.jumlahAnggotaKeluarga || 1;

    return households.map((h: any) => {
      const fSize = h.user?.jumlahAnggotaKeluarga ?? defaultFamilySize;
      return {
        ...h,
        familySize: fSize,
        jumlahAnggotaKeluarga: fSize,
        user: h.user
          ? {
              ...h.user,
              familySize: fSize,
              jumlahAnggotaKeluarga: fSize,
            }
          : {
              familySize: fSize,
              jumlahAnggotaKeluarga: fSize,
            },
      };
    });
  }

  /**
   * Get specific household details.
   */
  async getHouseholdById(id: string) {
    const household = await householdRepository.findHouseholdById(id);
    if (!household) {
      throw new Error("HOUSEHOLD_NOT_FOUND");
    }
    return household;
  }

  /**
   * Get all households in the system.
   */
  async getAllHouseholds() {
    return householdRepository.findAll();
  }

  /**
   * Get summary of user's full bins for Beranda Warga
   */
  async getBinsSummary(userId: string) {
    const userBins = await prisma.bin.findMany({
      where: {
        OR: [{ userId }, { binOwnerships: { some: { userId } } }],
        status: "ACTIVE_BOUND",
      },
      include: {
        category: true,
        rw: true,
      },
    });

    const binsWithFlag = userBins.map((bin) => {
      const current = Number(bin.currentVolumeLiter || 0);
      const max = Number(bin.maxCapacityLiter || 1);
      const percentage = max > 0 ? parseFloat(((current / max) * 100).toFixed(2)) : 0;
      const isCritical = percentage >= 80;

      return {
        id: bin.id,
        qrCode: bin.qrCode,
        category: bin.category?.name || "Umum",
        currentVolumeLiter: current,
        maxCapacityLiter: max,
        percentage,
        isCritical,
        status: bin.status,
      };
    });

    const criticalBins = binsWithFlag.filter((b) => b.isCritical);

    return {
      totalBins: binsWithFlag.length,
      fullBinsCount: criticalBins.length,
      hasCriticalBins: criticalBins.length > 0,
      criticalBins,
      bins: binsWithFlag,
    };
  }
}

export const householdService = new HouseholdService();
