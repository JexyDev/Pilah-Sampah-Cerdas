import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class CategoryService {
  async getAllCategories() {
    return prisma.wasteCategory.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createCategory(data: { name: string; pointsPerKg: number; description?: string }) {
    return prisma.wasteCategory.create({
      data: {
        name: data.name,
        pointsPerKg: data.pointsPerKg,
        description: data.description
      }
    });
  }

  async updateCategory(id: string, data: { name?: string; pointsPerKg?: number; description?: string }) {
    return prisma.wasteCategory.update({
      where: { id },
      data
    });
  }

  async deleteCategory(id: string) {
    return prisma.wasteCategory.delete({
      where: { id }
    });
  }
}

export const categoryService = new CategoryService();
