/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient, Household, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

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
  async findHouseholdsByUserId(userId: string): Promise<Household[]> {
    return prisma.household.findMany({
      where: { userId },
      include: {
        rw: {
          include: { kelurahan: true },
        },
      },
    });
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


