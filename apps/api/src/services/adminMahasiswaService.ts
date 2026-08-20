import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { formatPhoneNumber } from "../utils/phoneUtils.js";


export const adminMahasiswaService = {
  getAllMahasiswa: async (page = 1, limit = 10, search = "") => {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: { name: "MAHASISWA_KKN" },
      status: "Aktif",
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { studentProfile: { nim: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          studentProfile: {
            include: {
              kelompok: {
                include: {
                  dpl: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
              assignedRw: true,
            },
          },
          rw: {
            include: {
              kelurahan: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return { users, total, page, limit };
  },

  createMahasiswa: async (data: {
    nama_lengkap: string;
    nim: string;
    universitas?: string;
    no_telepon: string;
    area_tugas?: number;
    status_aktif?: string;
  }) => {
    const role = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
    if (!role) throw new Error("Role MAHASISWA_KKN not found");

    const formattedPhone = formatPhoneNumber(data.no_telepon);
    const existingPhone = await prisma.user.findUnique({ where: { phone: formattedPhone } });
    if (existingPhone) {
      throw new Error("Nomor telepon (+62) sudah terdaftar di sistem BERSEKA");
    }

    const cleanNim = data.nim && data.nim.trim() !== "" && data.nim !== "-" ? data.nim.trim() : null;
    if (cleanNim) {
      const existingNim = await prisma.studentKkn.findUnique({ where: { nim: cleanNim } });
      if (existingNim) {
        throw new Error("NIM (Nomor Induk Mahasiswa) sudah terdaftar di sistem BERSEKA");
      }
    }

    const passwordHash = await bcrypt.hash("password123", 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.nama_lengkap,
          phone: formattedPhone,
          password: passwordHash,
          roleId: role.id,
          status: data.status_aktif || "Aktif",
          rwId: data.area_tugas || null,
        },
      });

      const studentProfile = await tx.studentKkn.create({
        data: {
          userId: user.id,
          nim: cleanNim,
          jurusan: "Teknik Informatika",
          fakultas: data.universitas || "UNIKOM",
          noWa: data.no_telepon,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          whitelistStatus: "APPROVED",
          assignedRwId: data.area_tugas || null,
        },
        include: {
          assignedRw: true,
        },
      });

      return { user, studentProfile };
    });
  },

  updateMahasiswa: async (
    id: string,
    data: {
      nama_lengkap?: string;
      nim?: string;
      universitas?: string;
      no_telepon?: string;
      area_tugas?: number;
      status_aktif?: string;
    }
  ) => {
    const cleanNim = data.nim !== undefined ? (data.nim && data.nim.trim() !== "" && data.nim !== "-" ? data.nim.trim() : null) : undefined;
    if (cleanNim) {
      const existingNim = await prisma.studentKkn.findFirst({
        where: { nim: cleanNim, userId: { not: id } },
      });
      if (existingNim) {
        throw new Error("NIM (Nomor Induk Mahasiswa) sudah terdaftar di sistem BERSEKA");
      }
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(data.nama_lengkap && { name: data.nama_lengkap }),
          ...(data.no_telepon && { phone: formatPhoneNumber(data.no_telepon) }),
          ...(data.status_aktif && { status: data.status_aktif }),
          ...(data.area_tugas !== undefined && { rwId: data.area_tugas || null }),
        },
      });

      const studentProfile = await tx.studentKkn.findUnique({ where: { userId: id } });
      let updatedStudent = null;
      if (studentProfile) {
        updatedStudent = await tx.studentKkn.update({
          where: { userId: id },
          data: {
            ...(cleanNim !== undefined && { nim: cleanNim }),
            ...(data.universitas && { fakultas: data.universitas }),
            ...(data.no_telepon && { noWa: data.no_telepon }),
            ...(data.area_tugas !== undefined && { assignedRwId: data.area_tugas || null }),
          },
          include: {
            assignedRw: true,
          },
        });
      }

      return { user, studentProfile: updatedStudent };
    });
  },

  deleteMahasiswa: async (id: string) => {
    // Soft delete by updating status to Nonaktif
    return prisma.user.update({
      where: { id },
      data: { status: "Nonaktif" },
    });
  },
};
