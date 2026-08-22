import { prisma } from "../lib/prisma.js";


export const kelompokService = {
  getAllKelompok: async (page = 1, limit = 0, search = "", kelurahan = "", dplUserId = "") => {
    const whereClause: any = {};

    if (dplUserId) {
      const dplOr: any[] = [{ dplId: dplUserId }, { dpl: { id: dplUserId } }];
      try {
        const dplUser = await prisma.user.findUnique({
          where: { id: dplUserId },
          select: { id: true, name: true, phone: true, nip: true },
        });

        if (dplUser) {
          if (dplUser.name && dplUser.name.trim()) {
            dplOr.push({ dplNamaMentah: { equals: dplUser.name.trim(), mode: "insensitive" } });
            dplOr.push({ dpl: { name: { equals: dplUser.name.trim(), mode: "insensitive" } } });
          }
          if (dplUser.phone) dplOr.push({ dpl: { phone: dplUser.phone } });
          if (dplUser.nip) dplOr.push({ dpl: { nip: dplUser.nip } });

          // Auto-heal
          const unlinkedOr: any[] = [];
          if (dplUser.name) unlinkedOr.push({ dplNamaMentah: { equals: dplUser.name.trim(), mode: "insensitive" } });
          if (dplUser.nip) unlinkedOr.push({ dpl: { nip: dplUser.nip } });
          if (dplUser.phone) unlinkedOr.push({ dpl: { phone: dplUser.phone } });

          const unlinkedGroups = unlinkedOr.length > 0 ? await prisma.kelompokKkn.findMany({
            where: {
              OR: unlinkedOr,
              NOT: { dplId: dplUserId },
            },
            select: { id: true },
          }) : [];

          if (unlinkedGroups.length > 0) {
            await prisma.kelompokKkn.updateMany({
              where: { id: { in: unlinkedGroups.map((g) => g.id) } },
              data: { dplId: dplUserId, dplNamaMentah: dplUser.name },
            });
          }
        }
      } catch (err) {
        console.warn("[kelompokService] Error resolving DPL fallback:", err);
      }

      whereClause.OR = dplOr;
    }

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
          dpl: { select: { id: true, name: true, phone: true } },
          students: {
            include: { user: { select: { id: true, name: true, phone: true } } },
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
        dpl: { select: { id: true, name: true, phone: true } },
        students: {
          include: { user: { select: { id: true, name: true, phone: true } } },
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
      },
    });
  },

  updateKelompok: async (
    id: string,
    data: { name?: string; dplId?: string | null; kelurahan?: string | null; cakupanRw?: any }
  ) => {
    const updatePayload: any = {
      name: data.name,
      kelurahan: data.kelurahan,
      cakupanRw: data.cakupanRw,
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
      select: { id: true, name: true, phone: true, nip: true },
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
