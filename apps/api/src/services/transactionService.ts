/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
const prisma = new PrismaClient();

export class TransactionService {
  async getDeposits(binCode?: string) {
    return prisma.setoranOtomatis.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        warga: {
          select: {
            name: true,
            rtRw: true,
          },
        },
        bin: true,
      },
      where: binCode
        ? {
            bin: {
              qrCode: binCode,
            },
          }
        : undefined,
    });
  }

  async getMyDeposits(userId: string) {
    return prisma.setoranOtomatis.findMany({
      where: { wargaId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        bin: {
          include: {
            rtRw: {
              include: {
                kelurahan: true,
              },
            },
          },
        },
      },
    });
  }

  async getDepositDetails(id: string) {
    return prisma.setoranOtomatis.findUnique({
      where: { id },
      include: {
        warga: {
          select: {
            name: true,
            phone: true,
          },
        },
        bin: {
          include: {
            rtRw: true,
          },
        },
      },
    });
  }

  async createManualDeposit(
    petugasResiduId: string,
    diinputOleh: "mandiri" | "rw",
    berat: number,
    fotoResiduUrl: string,
    lokasiGps: string | null,
    rwId?: number
  ) {
    return prisma.$transaction(async (tx) => {
      let finalRwId = rwId;
      if (!finalRwId) {
        const area = await tx.rtRwArea.findFirst({
          where: { petugasResiduId: petugasResiduId },
        });
        if (!area) throw new Error("PETUGAS_RESIDU_NOT_ASSIGNED_TO_ANY_RW");
        finalRwId = area.id;
      }

      const log = await tx.setoranManual.create({
        data: {
          petugasResiduId,
          diinputOleh,
          rwId: finalRwId,
          fotoResiduUrl,
          berat,
          unit: "Kg",
          lokasiGps,
          kategori: "residu",
        },
      });

      return log;
    });
  }

  async getManualDeposits(rwId?: number) {
    return prisma.setoranManual.findMany({
      where: rwId ? { rwId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        petugas: {
          select: {
            name: true,
          },
        },
        rw: true,
      },
    });
  }
}

export const transactionService = new TransactionService();
