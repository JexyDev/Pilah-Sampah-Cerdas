/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { prisma } from "../lib/prisma.js";

export class PoskoKknService {
  async upsertPosko(
    kelompokId: string,
    data: {
      nama: string;
      alamat: string;
      latitude: number;
      longitude: number;
      fotoUrl?: string;
      keterangan?: string;
    }
  ) {
    return prisma.poskoKkn.upsert({
      where: { kelompokId },
      update: {
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        fotoUrl: data.fotoUrl ?? undefined,
        keterangan: data.keterangan ?? undefined,
      },
      create: {
        kelompokId,
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        fotoUrl: data.fotoUrl ?? null,
        keterangan: data.keterangan ?? null,
      },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true, dpl: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async getAllPosko(userId?: string, role?: string) {
    let whereClause: any = {};
    if (userId && role) {
      const normalizedRole = role.toUpperCase();
      const isAdmin = ["DEVELOPER", "ADMIN_DLH", "DLH", "DLH_ADMIN", "SUPER_USER", "ADMIN", "PANITIA_TASKFORCE", "PEMIMPIN"].some(r => normalizedRole.includes(r));
      
      if (!isAdmin) {
        if (normalizedRole.includes("MAHASISWA")) {
          whereClause = { kelompok: { students: { some: { userId } } } };
        } else if (normalizedRole.includes("DPL") || normalizedRole.includes("DOSEN")) {
          whereClause = { OR: [{ kelompok: { dplId: userId } }, { kelompok: { dpl: { id: userId } } }] };
        } else if (normalizedRole.includes("RW")) {
          const userRw = await prisma.user.findUnique({ where: { id: userId }, select: { rwId: true } });
          if (userRw?.rwId) {
            const rwData = await prisma.rw.findUnique({ where: { id: userRw.rwId }, include: { kelurahan: true } });
            if (rwData?.kelurahan?.name) {
              whereClause = { kelompok: { kelurahan: { equals: rwData.kelurahan.name, mode: "insensitive" } } };
            } else {
              whereClause = { kelompokId: "NONE" };
            }
          } else {
            whereClause = { kelompokId: "NONE" };
          }
        }
      }
    }

    return prisma.poskoKkn.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            dpl: { select: { id: true, name: true } },
            students: {
              select: {
                id: true,
                isKetua: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });
  }

  async getPoskoByKelompok(kelompokId: string) {
    return prisma.poskoKkn.findUnique({
      where: { kelompokId },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true, dpl: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async getPoskoByUserId(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      select: { kelompokId: true },
    });
    if (!student?.kelompokId) return null;
    return this.getPoskoByKelompok(student.kelompokId);
  }

  async deletePosko(kelompokId: string) {
    return prisma.poskoKkn.delete({ where: { kelompokId } });
  }
}

export const poskoKknService = new PoskoKknService();
