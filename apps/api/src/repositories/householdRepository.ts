import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Household, Prisma } from "@prisma/client";

export class HouseholdRepository {
  /**
   * Create a new household registration.
   */
  async createHousehold(data: Prisma.HouseholdUncheckedCreateInput): Promise<Household> {
    return prisma.household.create({
      data,
      include: {
        rw: true,
      },
    });
  }

  /**
   * Find a household by its ID.
   */
  async findHouseholdById(id: string): Promise<Household | null> {
    return prisma.household.findUnique({
      where: { id },
      include: {
        rw: {
          include: { kelurahan: true },
        },
      },
    });
  }

  /**
   * Get all households for a user.
   */
  async findHouseholdsByUserId(userId: string): Promise<any[]> {
    const direct = await prisma.household.findMany({
      where: { userId },
      include: {
        rw: {
          include: { kelurahan: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            jumlahAnggotaKeluarga: true,
          },
        },
      },
    });

    if (direct.length > 0) {
      return direct;
    }

    // Jika akun adalah anggota keluarga, cari household via kepemilikan bin bersama
    const userBinOwnerships = await prisma.binOwnership.findMany({
      where: { userId },
      select: { binId: true },
    });

    if (userBinOwnerships.length > 0) {
      const primaryOwner = await prisma.binOwnership.findFirst({
        where: {
          binId: { in: userBinOwnerships.map((b) => b.binId) },
          type: "UTAMA",
        },
        select: { userId: true },
      });

      if (primaryOwner && primaryOwner.userId !== userId) {
        return prisma.household.findMany({
          where: { userId: primaryOwner.userId },
          include: {
            rw: {
              include: { kelurahan: true },
            },
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                jumlahAnggotaKeluarga: true,
              },
            },
          },
        });
      }
    }

    return [];
  }

  /**
   * Check if user already registered a household in the same area.
   */
  async findHouseholdByUserAndArea(userId: string, rwId: number): Promise<Household | null> {
    return prisma.household.findFirst({
      where: {
        userId,
        rwId,
      },
    });
  }

  /**
   * Find all households in the system.
   */
  async findAll(): Promise<any[]> {
    return prisma.household.findMany({
      include: {
        rw: {
          include: { kelurahan: true },
        },
        user: {
          select: { name: true },
        },
      },
    });
  }
}

export const householdRepository = new HouseholdRepository();
