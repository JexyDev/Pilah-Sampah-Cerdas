/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class CategoryService {
  async getAllCategories() {
    let categories = await prisma.wasteCategory.findMany({
      include: {
        _count: {
          select: { bins: true },
        },
      },
      orderBy: { name: "asc" },
    });
    if (categories.length === 0) {
      await prisma.wasteCategory.createMany({
        data: [
          { name: "Organik", pointsPerKg: 10, description: "Sisa makanan & organik basah" },
          { name: "Anorganik", pointsPerKg: 15, description: "Plastik, kertas, logam, dll" },
        ],
      });
      categories = await prisma.wasteCategory.findMany({
        include: {
          _count: {
            select: { bins: true },
          },
        },
        orderBy: { name: "asc" },
      });
    }
    return categories;
  }

  async createCategory(data: { name: string; pointsPerKg: number; description?: string }) {
    return prisma.wasteCategory.create({
      data: {
        name: data.name,
        pointsPerKg: data.pointsPerKg,
        description: data.description,
      },
    });
  }

  async updateCategory(
    id: string,
    data: { name?: string; pointsPerKg?: number; description?: string }
  ) {
    return prisma.wasteCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    return prisma.wasteCategory.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();
