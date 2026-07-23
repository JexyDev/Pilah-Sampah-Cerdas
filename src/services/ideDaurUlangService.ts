import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class IdeDaurUlangService {
  async createIde(userId: string, judul: string, material: string, foto: string | null) {
    const ide = await prisma.ideDaurUlang.create({
      data: {
        userId,
        judul,
        material,
        foto,
        statusApproval: "PENDING",
      },
    });
    return ide;
  }

  async getSemuaIde() {
    return prisma.ideDaurUlang.findMany({
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
      },
    });

    return ide;
  }

  async rejectIde(id: string, rejectedBy: string) {
    return prisma.ideDaurUlang.update({
      where: { id },
      data: { statusApproval: "REJECTED", approvedBy: rejectedBy },
    });
  }
}

export const ideDaurUlangService = new IdeDaurUlangService();
