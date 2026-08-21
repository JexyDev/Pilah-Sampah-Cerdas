import { prisma } from "../lib/prisma.js";


export class IdeDaurUlangService {
  async createIde(
    userId: string,
    judul: string,
    material: string,
    foto: string | null,
    sumber: "WARGA" | "MAHASISWA_KKN" = "WARGA"
  ) {
    const ide = await prisma.ideDaurUlang.create({
      data: {
        userId,
        judul,
        material,
        foto,
        sumber,
        statusApproval: "PENDING",
      },
    });
    return ide;
  }

  async getSemuaIde(filters?: { search?: string; status?: string; sumber?: string }) {
    let whereClause: any = {};
    if (filters?.status) {
      whereClause.statusApproval = filters.status;
    }
    if (filters?.sumber) {
      whereClause.sumber = filters.sumber;
    }
    if (filters?.search) {
      whereClause.OR = [
        { judul: { contains: filters.search, mode: "insensitive" } },
        { material: { contains: filters.search, mode: "insensitive" } },
        { user: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    return prisma.ideDaurUlang.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, role: { select: { name: true } } },
        },
      },
    });
  }

  async getIdeWarga(userId: string) {
    return prisma.ideDaurUlang.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /** RW approve ide dari WARGA (+50 poin) */
  async approveIde(id: string, approvedBy: string) {
    const ide = await prisma.ideDaurUlang.update({
      where: { id },
      data: { statusApproval: "APPROVED", approvedBy },
    });

    // Add +50 points to user
    await prisma.pointHistory.create({
      data: {
        userId: ide.userId,
        points: 50,
        description: `Ide Daur Ulang Disetujui: ${ide.judul}`,
        kategori: "IDE_DAUR_ULANG",
      },
    });

    // Add to Social Feed
    await prisma.socialFeed.create({
      data: {
        tipe: "RECYCLE_IDEA",
        deskripsi: `Ide daur ulang "${ide.judul}" telah disetujui untuk diimplementasikan!`,
        userId: ide.userId,
        entityId: ide.id,
      },
    });

    return ide;
  }

  /** DPL approve ide dari MAHASISWA_KKN (+30 poin) */
  async approveDpl(id: string, dplUserId: string) {
    const ide = await prisma.ideDaurUlang.findUnique({ where: { id } });
    if (!ide) throw new Error("IDE_NOT_FOUND");
    if (ide.sumber !== "MAHASISWA_KKN") throw new Error("Hanya ide dari Mahasiswa KKN yang bisa di-approve oleh DPL");
    if (ide.statusApproval !== "PENDING") throw new Error("Ide sudah diproses sebelumnya");

    const updated = await prisma.ideDaurUlang.update({
      where: { id },
      data: { statusApproval: "APPROVED", approvedBy: dplUserId },
    });

    // +30 poin untuk mahasiswa
    await prisma.pointHistory.create({
      data: {
        userId: ide.userId,
        points: 30,
        description: `Ide Daur Ulang KKN Disetujui DPL: ${ide.judul}`,
        kategori: "IDE_DAUR_ULANG",
      },
    });

    await prisma.socialFeed.create({
      data: {
        tipe: "RECYCLE_IDEA",
        deskripsi: `Ide mahasiswa KKN "${ide.judul}" disetujui DPL untuk dijadikan program kerja!`,
        userId: ide.userId,
        entityId: ide.id,
      },
    });

    return updated;
  }

  async rejectIde(id: string, rejectedBy: string) {
    return prisma.ideDaurUlang.update({
      where: { id },
      data: { statusApproval: "REJECTED", approvedBy: rejectedBy },
    });
  }

  async updateIde(id: string, judul: string, material: string, foto: string | null) {
    const data: any = { judul, material };
    if (foto !== null) {
      data.foto = foto;
    }
    return prisma.ideDaurUlang.update({
      where: { id },
      data,
    });
  }

  async deleteIde(id: string) {
    return prisma.ideDaurUlang.delete({
      where: { id },
    });
  }
}

export const ideDaurUlangService = new IdeDaurUlangService();

