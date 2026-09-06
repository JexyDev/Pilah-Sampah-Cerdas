/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PemanfaatanService {
  async create(data: {
    rwId: number;
    nomorCaraPemanfaatan: string;
    program: string;
    teknologi: string;
    bahanBaku: string;
    volumeBahanBaku: number;
    unitBahanBaku: string;
    hasil: number;
    unitHasil: string;
    fotoDokumentasiUrl: string;
    tanggalPencatatan: Date;
    jenisKomoditas?: string;
    luasLahanM2?: number;
    volumePupukDipakaiKg?: number;
    bibitTelurGram?: number;
    hasilKasgotKg?: number;
    volumeBioaktivatorLiter?: number;
    masaFermentasiHari?: number;
  }) {
    return prisma.pemanfaatan.create({
      data: {
        ...data,
        volumeBahanBaku: data.volumeBahanBaku,
        hasil: data.hasil,
      },
    });
  }

  async getAll() {
    return prisma.pemanfaatan.findMany({
      include: {
        rw: { include: { kelurahan: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const item = await prisma.pemanfaatan.findUnique({
      where: { id },
      include: {
        rw: { include: { kelurahan: true } },
      },
    });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");
    return item;
  }

  async update(
    id: string,
    data: {
      rwId?: number;
      nomorCaraPemanfaatan?: string;
      program?: string;
      teknologi?: string;
      bahanBaku?: string;
      volumeBahanBaku?: number;
      unitBahanBaku?: string;
      hasil?: number;
      unitHasil?: string;
      fotoDokumentasiUrl?: string;
      tanggalPencatatan?: Date;
      jenisKomoditas?: string;
      luasLahanM2?: number;
      volumePupukDipakaiKg?: number;
      bibitTelurGram?: number;
      hasilKasgotKg?: number;
      volumeBioaktivatorLiter?: number;
      masaFermentasiHari?: number;
    }
  ) {
    const item = await prisma.pemanfaatan.findUnique({ where: { id } });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");

    return prisma.pemanfaatan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const item = await prisma.pemanfaatan.findUnique({ where: { id } });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");

    return prisma.pemanfaatan.delete({
      where: { id },
    });
  }
}

export const pemanfaatanService = new PemanfaatanService();
