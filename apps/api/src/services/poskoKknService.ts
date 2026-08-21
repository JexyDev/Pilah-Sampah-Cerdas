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

  async getAllPosko() {
    return prisma.poskoKkn.findMany({
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
