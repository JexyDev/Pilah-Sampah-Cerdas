import { prisma } from "../lib/prisma.js";
import { getScopingFilters } from "../utils/rbacScoping.js";
import bcrypt from "bcryptjs";
import { formatPhoneNumber } from "../utils/phoneUtils.js";

export const adminMahasiswaService = {
  getAllMahasiswa: async (page = 1, limit = 10, search = "", user?: any) => {
    let whereClause: any = {
      role: { name: "MAHASISWA_KKN" },
    };

    if (user) {
      const scopes = await getScopingFilters(user);
      if (scopes.userFilter && Object.keys(scopes.userFilter).length > 0) {
        whereClause = { AND: [whereClause, scopes.userFilter] };
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchOr = [
        { name: { contains: q, mode: "insensitive" } },
        { studentProfile: { nim: { contains: q, mode: "insensitive" } } },
        { phone: { contains: q, mode: "insensitive" } },
        { studentProfile: { kelompok: { name: { contains: q, mode: "insensitive" } } } },
        { studentProfile: { kelompok: { kelurahan: { contains: q, mode: "insensitive" } } } },
        { rw: { name: { contains: q, mode: "insensitive" } } },
      ];
      if (whereClause.AND) {
        whereClause.AND.push({ OR: searchOr });
      } else {
        whereClause.AND = [{ OR: searchOr }];
      }
    }

    const isUnbounded = limit <= 0;
    const skip = isUnbounded ? undefined : (page - 1) * limit;
    const take = isUnbounded ? undefined : limit;

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
                      nip: true,
                    },
                  },
                },
              },
              assignedRw: {
                include: {
                  kelurahan: true,
                },
              },
            },
          },
          rw: {
            include: {
              kelurahan: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return { users, total, page, limit: isUnbounded ? total : limit };
  },

  createMahasiswa: async (data: {
    nama_lengkap: string;
    nim: string;
    universitas?: string;
    no_telepon: string;
    prodi?: string;
    jurusan?: string;
    jenjangPendidikan?: string;
    kelompokId?: string;
    area_tugas?: number;
    is_ketua?: boolean;
    status_aktif?: string;
  }) => {
    const role = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
    if (!role) throw new Error("Role MAHASISWA_KKN not found");

    const formattedPhone = formatPhoneNumber(data.no_telepon);
    const existingPhone = await prisma.user.findUnique({ where: { phone: formattedPhone } });
    if (existingPhone) {
      throw new Error("Nomor telepon (+62) sudah terdaftar di sistem BERSEKA");
    }

    const cleanNim =
      data.nim && data.nim.trim() !== "" && data.nim !== "-" ? data.nim.trim() : null;
    if (cleanNim) {
      const existingNim = await prisma.studentKkn.findUnique({ where: { nim: cleanNim } });
      if (existingNim) {
        throw new Error("NIM (Nomor Induk Mahasiswa) sudah terdaftar di sistem BERSEKA");
      }
    }

    let targetKelompok: any = null;
    if (data.kelompokId) {
      targetKelompok = await prisma.kelompokKkn.findUnique({ where: { id: data.kelompokId } });
    }

    // Determine default RW ID if not provided but kelompok is selected
    let effectiveRwId: number | null = data.area_tugas ? Number(data.area_tugas) : null;
    if (!effectiveRwId && targetKelompok?.kelurahan) {
      const firstRw = await prisma.rw.findFirst({
        where: { kelurahan: { name: { equals: targetKelompok.kelurahan, mode: "insensitive" } } },
        orderBy: { name: "asc" },
      });
      if (firstRw) effectiveRwId = firstRw.id;
    }

    const passwordHash = await bcrypt.hash("password123", 10);
    const prodi = data.prodi || data.jurusan || "S1 Teknik Informatika";
    const jenjang = data.jenjangPendidikan || (prodi.startsWith("D3") ? "D3" : "S1");

    return prisma.$transaction(async (tx) => {
      // If setting as ketua, unset previous ketua in that group
      if (data.is_ketua && data.kelompokId) {
        await tx.studentKkn.updateMany({
          where: { kelompokId: data.kelompokId, isKetua: true },
          data: { isKetua: false },
        });
      }

      const user = await tx.user.create({
        data: {
          name: data.nama_lengkap,
          phone: formattedPhone,
          password: passwordHash,
          roleId: role.id,
          status: data.status_aktif || "Aktif",
          rwId: effectiveRwId,
          address: targetKelompok?.kelurahan ? `Kel. ${targetKelompok.kelurahan}` : null,
          programStudi: prodi,
          jenjangPendidikan: jenjang,
          institusi: data.universitas || "UNIKOM",
        },
      });

      const studentProfile = await tx.studentKkn.create({
        data: {
          userId: user.id,
          nim: cleanNim,
          jurusan: prodi,
          fakultas: data.universitas || "UNIKOM",
          jenjangPendidikan: jenjang,
          noWa: data.no_telepon,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          whitelistStatus: "APPROVED",
          assignedRwId: effectiveRwId,
          kelompokId: data.kelompokId || null,
          isKetua: !!data.is_ketua,
        },
        include: {
          assignedRw: {
            include: { kelurahan: true },
          },
          kelompok: {
            include: { dpl: true },
          },
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
      prodi?: string;
      jurusan?: string;
      jenjangPendidikan?: string;
      kelompokId?: string | null;
      area_tugas?: number | null;
      is_ketua?: boolean;
      status_aktif?: string;
    }
  ) => {
    const cleanNim =
      data.nim !== undefined
        ? data.nim && data.nim.trim() !== "" && data.nim !== "-"
          ? data.nim.trim()
          : null
        : undefined;
    if (cleanNim) {
      const existingNim = await prisma.studentKkn.findFirst({
        where: { nim: cleanNim, userId: { not: id } },
      });
      if (existingNim) {
        throw new Error("NIM (Nomor Induk Mahasiswa) sudah terdaftar di sistem BERSEKA");
      }
    }

    if (data.no_telepon) {
      const formattedPhone = formatPhoneNumber(data.no_telepon);
      const existingPhone = await prisma.user.findFirst({
        where: { phone: formattedPhone, id: { not: id } },
      });
      if (existingPhone) {
        throw new Error("Nomor telepon (+62) sudah terdaftar di akun lain");
      }
    }

    let targetKelompok: any = null;
    if (data.kelompokId) {
      targetKelompok = await prisma.kelompokKkn.findUnique({ where: { id: data.kelompokId } });
    }

    let effectiveRwId: number | null | undefined = undefined;
    if (data.area_tugas !== undefined) {
      effectiveRwId = data.area_tugas ? Number(data.area_tugas) : null;
    } else if (targetKelompok?.kelurahan) {
      const firstRw = await prisma.rw.findFirst({
        where: { kelurahan: { name: { equals: targetKelompok.kelurahan, mode: "insensitive" } } },
        orderBy: { name: "asc" },
      });
      if (firstRw) effectiveRwId = firstRw.id;
    }

    const prodi = data.prodi || data.jurusan;
    const jenjang = data.jenjangPendidikan;

    return prisma.$transaction(async (tx) => {
      // If setting as ketua, unset previous ketua in that group
      if (data.is_ketua) {
        const currentProfile = await tx.studentKkn.findUnique({ where: { userId: id } });
        const targetGid = data.kelompokId !== undefined ? data.kelompokId : currentProfile?.kelompokId;
        if (targetGid) {
          await tx.studentKkn.updateMany({
            where: { kelompokId: targetGid, isKetua: true, userId: { not: id } },
            data: { isKetua: false },
          });
        }
      }

      const userUpdateData: any = {};
      if (data.nama_lengkap !== undefined) userUpdateData.name = data.nama_lengkap;
      if (data.no_telepon !== undefined) userUpdateData.phone = formatPhoneNumber(data.no_telepon);
      if (data.status_aktif !== undefined) userUpdateData.status = data.status_aktif;
      if (effectiveRwId !== undefined) userUpdateData.rwId = effectiveRwId;
      if (targetKelompok?.kelurahan) userUpdateData.address = `Kel. ${targetKelompok.kelurahan}`;
      if (prodi) userUpdateData.programStudi = prodi;
      if (jenjang) userUpdateData.jenjangPendidikan = jenjang;
      if (data.universitas) userUpdateData.institusi = data.universitas;

      const user = await tx.user.update({
        where: { id },
        data: userUpdateData,
      });

      const studentProfile = await tx.studentKkn.findUnique({ where: { userId: id } });
      let updatedStudent = null;
      if (studentProfile) {
        const studentUpdateData: any = {};
        if (cleanNim !== undefined) studentUpdateData.nim = cleanNim;
        if (data.universitas !== undefined) studentUpdateData.fakultas = data.universitas;
        if (data.no_telepon !== undefined) studentUpdateData.noWa = data.no_telepon;
        if (prodi !== undefined) studentUpdateData.jurusan = prodi;
        if (jenjang !== undefined) studentUpdateData.jenjangPendidikan = jenjang;
        if (data.kelompokId !== undefined) studentUpdateData.kelompokId = data.kelompokId;
        if (effectiveRwId !== undefined) studentUpdateData.assignedRwId = effectiveRwId;
        if (data.is_ketua !== undefined) studentUpdateData.isKetua = !!data.is_ketua;

        updatedStudent = await tx.studentKkn.update({
          where: { userId: id },
          data: studentUpdateData,
          include: {
            assignedRw: {
              include: { kelurahan: true },
            },
            kelompok: {
              include: { dpl: true },
            },
          },
        });
      }

      return { user, studentProfile: updatedStudent };
    });
  },

  deleteMahasiswa: async (id: string) => {
    return prisma.user.update({
      where: { id },
      data: { status: "Nonaktif" },
    });
  },
};
