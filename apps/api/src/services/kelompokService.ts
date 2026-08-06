import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const kelompokService = {
  getAllKelompok: async (page = 1, limit = 10, search = "") => {
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }

    const [groups, total] = await Promise.all([
      prisma.kelompokKkn.findMany({
        where: whereClause,
        include: {
          dpl: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          students: {
            select: {
              id: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.kelompokKkn.count({ where: whereClause }),
    ]);

    return { groups, total, page, limit };
  },

  getKelompokById: async (id: string) => {
    return prisma.kelompokKkn.findUnique({
      where: { id },
      include: {
        dpl: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  },

  createKelompok: async (data: { name: string; dplId?: string }) => {
    return prisma.kelompokKkn.create({
      data: {
        name: data.name,
        dplId: data.dplId || null,
      },
    });
  },

  updateKelompok: async (id: string, data: { name?: string; dplId?: string | null }) => {
    return prisma.kelompokKkn.update({
      where: { id },
      data: {
        name: data.name,
        dplId: data.dplId === "" ? null : data.dplId,
      },
    });
  },

  deleteKelompok: async (id: string) => {
    const studentCount = await prisma.studentKkn.count({
      where: { kelompokId: id },
    });
    if (studentCount > 0) {
      throw new Error("CANNOT_DELETE_KELOMPOK_WITH_STUDENTS");
    }
    return prisma.kelompokKkn.delete({
      where: { id },
    });
  },

  setLeader: async (kelompokId: string, studentId: string) => {
    // Reset any previous leader in this kelompok
    await prisma.studentKkn.updateMany({
      where: { kelompokId },
      data: { isKetua: false },
    });

    // Set the specified student as leader
    return prisma.studentKkn.update({
      where: { id: studentId },
      data: { isKetua: true, kelompokId },
    });
  },

  getDplList: async () => {
    let role = await prisma.role.findUnique({ where: { name: "DPL" } });
    if (!role) {
      role = await prisma.role.create({ data: { name: "DPL" } });
    }
    return prisma.user.findMany({
      where: {
        roleId: role.id,
      },
      select: {
        id: true,
        name: true,
      },
    });
  },
};
