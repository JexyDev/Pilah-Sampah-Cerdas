import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const kelompokService = {
  getAllKelompok: async (page = 1, limit = 0, search = "", kelurahan = "") => {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { kelurahan: { contains: search, mode: "insensitive" } },
        { dpl: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (kelurahan && kelurahan !== "ALL") {
      whereClause.kelurahan = kelurahan;
    }

    const isAll = limit <= 0 || limit >= 1000;
    const skip = isAll ? undefined : (page - 1) * limit;
    const take = isAll ? undefined : limit;

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
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      prisma.kelompokKkn.count({ where: whereClause }),
    ]);

    return { groups, total, page, limit: isAll ? total : limit };
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

  createKelompok: async (data: {
    name: string;
    dplId?: string;
    kelurahan?: string;
    cakupanRw?: any;
  }) => {
    return prisma.kelompokKkn.create({
      data: {
        name: data.name,
        dplId: data.dplId || null,
        kelurahan: data.kelurahan || null,
        cakupanRw: data.cakupanRw || null,
      },
    });
  },

  updateKelompok: async (
    id: string,
    data: { name?: string; dplId?: string | null; kelurahan?: string | null; cakupanRw?: any }
  ) => {
    return prisma.kelompokKkn.update({
      where: { id },
      data: {
        name: data.name,
        dplId: data.dplId === "" ? null : data.dplId,
        kelurahan: data.kelurahan,
        cakupanRw: data.cakupanRw,
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
    return prisma.user.findMany({
      where: {
        role: {
          name: { in: ["DPL", "DOSEN_PEMBIMBING"] },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        nip: true,
      },
      orderBy: { name: "asc" },
    });
  },
};
