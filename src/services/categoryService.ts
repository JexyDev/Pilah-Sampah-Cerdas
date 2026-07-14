import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const categoryService = {
  async getAllCategories() {
    return await prisma.wasteCategory.findMany();
  }
};
