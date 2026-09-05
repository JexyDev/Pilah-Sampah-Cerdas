import { prisma } from "../lib/prisma.js";
import { ensureDplKelompokRelation } from "./dplService.js";
import { getScopingFilters } from "../utils/rbacScoping.js";

export const kelompokService = {
  getAllKelompok: async (
    page = 1,
    limit = 0,
    search = "",
    kelurahan = "",
    dplUserId = "",
    user?: any
  ) => {
    let whereClause: any = {};

    if (user) {
      const scopes = await getScopingFilters(user);
      whereClause = scopes.kelompokKknFilter || {};
    }

    if (dplUserId && !user) {
      await ensureDplKelompokRelation(dplUserId);
      if (Object.keys(whereClause).length > 0) {
        whereClause.AND = [{ OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }] }];
      } else {
        whereClause.OR = [{ dplId: dplUserId }, { dpl: { id: dplUserId } }];
      }
    }

    if (search) {
      const searchOr = [
        { name: { contains: search, mode: "insensitive" } },
        { kelurahan: { contains: search, mode: "insensitive" } },
        { dpl: { name: { contains: search, mode: "insensitive" } } },
      ];
      if (whereClause.OR) {
        whereClause = { AND: [{ OR: whereClause.OR }, { OR: searchOr }], ...whereClause };
        delete whereClause.OR;
      } else {
        whereClause.OR = searchOr;
      }
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
          dpl: { select: { id: true, name: true, phone: true, email: true, nip: true } },
          students: {
            include: { user: { select: { id: true, name: true, phone: true, email: true } } },
          },
        },
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      prisma.kelompokKkn.count({ where: whereClause }),
    ]);

    // Natural sort: Kelompok 1, Kelompok 2, ..., Kelompok 10, Kelompok 11
    groups.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "id", { numeric: true, sensitivity: "base" })
    );

    return { groups, total, page, limit: isAll ? total : limit };
  },

  getKelompokById: async (id: string) => {
    return prisma.kelompokKkn.findUnique({
      where: { id },
      include: {
        dpl: { select: { id: true, name: true, phone: true, email: true, nip: true } },
        students: {
          include: { user: { select: { id: true, name: true, phone: true, email: true } } },
        },
      },
    });
  },

  createKelompok: async (data: {
    name: string;
    dplId?: string;
    kelurahan?: string;
    cakupanRw?: any;
    linkGoogleDrive?: string;
  }) => {
    let dplNamaMentah: string | null = null;
    if (data.dplId) {
      const dplUser = await prisma.user.findUnique({
        where: { id: data.dplId },
        select: { name: true },
      });
      dplNamaMentah = dplUser?.name || null;
    }

    return prisma.kelompokKkn.create({
      data: {
        name: data.name,
        dplId: data.dplId || null,
        dplNamaMentah,
        kelurahan: data.kelurahan || null,
        cakupanRw: data.cakupanRw || null,
        linkGoogleDrive: data.linkGoogleDrive ? data.linkGoogleDrive.trim() : null,
      },
    });
  },

  updateKelompok: async (
    id: string,
    data: { name?: string; dplId?: string | null; kelurahan?: string | null; cakupanRw?: any; linkGoogleDrive?: string | null }
  ) => {
    const updatePayload: any = {
      name: data.name,
      kelurahan: data.kelurahan,
      cakupanRw: data.cakupanRw,
      ...(data.linkGoogleDrive !== undefined ? { linkGoogleDrive: data.linkGoogleDrive ? data.linkGoogleDrive.trim() : null } : {}),
    };

    if (data.dplId !== undefined) {
      if (data.dplId === "" || data.dplId === null) {
        updatePayload.dplId = null;
        updatePayload.dplNamaMentah = null;
      } else {
        updatePayload.dplId = data.dplId;
        const dplUser = await prisma.user.findUnique({
          where: { id: data.dplId },
          select: { name: true },
        });
        if (dplUser?.name) {
          updatePayload.dplNamaMentah = dplUser.name;
        }
      }
    }

    return prisma.kelompokKkn.update({
      where: { id },
      data: updatePayload,
    });
  },

  deleteKelompok: async (id: string) => {
    const studentCount = await prisma.studentKkn.count({
      where: { kelompokId: id },
    });
    if (studentCount > 0) {
      throw new Error("CANNOT_DELETE_KELOMPOK_WITH_STUDENTS");
    }
    return prisma.kelompokKkn.delete({ where: { id } });
  },

  setLeader: async (kelompokId: string, studentId: string | null) => {
    await prisma.studentKkn.updateMany({
      where: { kelompokId },
      data: { isKetua: false },
    });
    if (!studentId || studentId === "NONE" || studentId === "") {
      return { kelompokId, leader: null };
    }
    return prisma.studentKkn.update({
      where: { id: studentId },
      data: { isKetua: true, kelompokId },
    });
  },

  getDplList: async () => {
    return prisma.user.findMany({
      where: { role: { name: { in: ["DPL", "DOSEN_PEMBIMBING"] } } },
      select: { id: true, name: true, phone: true, nip: true, email: true, programStudi: true },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Assign (atau lepas) 1 DPL ke kelompok.
   * @param kelompokId ID kelompok target
   * @param dplId ID user DPL. Null untuk melepas DPL.
   */
  assignDpl: async (kelompokId: string, dplId: string | null) => {
    let dplNamaMentah: string | null = null;
    if (dplId) {
      const dplUser = await prisma.user.findFirst({
        where: { id: dplId, role: { name: { in: ["DPL", "DOSEN_PEMBIMBING"] } } },
        select: { id: true, name: true },
      });
      if (!dplUser) throw new Error("DPL_NOT_FOUND");
      dplNamaMentah = dplUser.name;
    }

    return prisma.kelompokKkn.update({
      where: { id: kelompokId },
      data: {
        dplId: dplId || null,
        dplNamaMentah,
      },
      include: {
        dpl: { select: { id: true, name: true, phone: true } },
        students: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  },

  /**
   * Set cakupan RW kelompok (multi-RW sebagai JSON array integer).
   * @param kelompokId ID kelompok
   * @param rwIds Array ID RW (integer) yang dicakup kelompok ini
   */
  assignRw: async (kelompokId: string, rwIds: number[]) => {
    if (!Array.isArray(rwIds)) throw new Error("RW_IDS_MUST_BE_ARRAY");

    const existingRws = await prisma.rw.findMany({
      where: { id: { in: rwIds } },
      select: { id: true, name: true },
    });

    if (existingRws.length !== rwIds.length) {
      const foundIds = existingRws.map((r) => r.id);
      const missing = rwIds.filter((id) => !foundIds.includes(id));
      throw new Error(`RW_NOT_FOUND:${missing.join(",")}`);
    }

    return prisma.kelompokKkn.update({
      where: { id: kelompokId },
      data: { cakupanRw: rwIds },
      include: {
        dpl: { select: { id: true, name: true } },
        students: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  },

  /**
   * Pindah mahasiswa ke kelompok lain.
   * @param studentKknId ID record StudentKkn (bukan userId)
   * @param targetKelompokId ID kelompok tujuan
   */
  pindahMahasiswa: async (studentKknId: string, targetKelompokId: string) => {
    const student = await prisma.studentKkn.findUnique({
      where: { id: studentKknId },
      include: { user: { select: { id: true, name: true } }, kelompok: true },
    });
    if (!student) throw new Error("STUDENT_KKN_NOT_FOUND");

    const targetKelompok = await prisma.kelompokKkn.findUnique({
      where: { id: targetKelompokId },
    });
    if (!targetKelompok) throw new Error("TARGET_KELOMPOK_NOT_FOUND");

    return prisma.studentKkn.update({
      where: { id: studentKknId },
      data: { kelompokId: targetKelompokId, isKetua: false },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        kelompok: true,
      },
    });
  },
};
