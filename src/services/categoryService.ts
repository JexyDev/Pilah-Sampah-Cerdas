import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const categoryService = {
  async getAllCategories() {
    const categories = await prisma.wasteCategory.findMany();
    
    return categories.map(cat => {
      const isOrganik = cat.name.includes('ORGANIC');
      const isAnorganik = cat.name.includes('NON_ORGANIC') || cat.name.includes('ANORGANIK');
      
      let jenis = 'Lainnya';
      let iconBg = 'bg-gray-100';
      let iconColor = 'text-gray-700';
      
      if (isOrganik) {
        jenis = 'Organik';
        iconBg = 'bg-green-100';
        iconColor = 'text-green-700';
      } else if (isAnorganik) {
        jenis = 'Anorganik';
        iconBg = 'bg-blue-100';
        iconColor = 'text-blue-700';
      } else if (cat.name.includes('B3')) {
        jenis = 'B3';
        iconBg = 'bg-red-100';
        iconColor = 'text-red-700';
      }

      return {
        id: cat.id,
        nama: cat.name,
        jenis: jenis,
        iconBg: iconBg,
        iconColor: iconColor,
        poin: `${cat.pointsPerKg} Poin / kg`,
        harga: `Rp ${cat.pointsPerKg * 100} / kg`, // mock price calculation based on points
        desc: cat.description || `Kategori ${cat.name}`
      };
    });
  }
};
