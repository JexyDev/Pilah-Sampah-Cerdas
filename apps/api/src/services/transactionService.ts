import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { v4 as uuidv4 } from "uuid";

export class TransactionService {
  async getDeposits(binCode?: string) {
    return prisma.setoranOtomatis.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        warga: {
          select: {
            name: true,
            phone: true,
            rw: {
              include: {
                kelurahan: true,
              },
            },
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
            rw: {
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
            rw: true,
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
        const area = await tx.rw.findFirst({
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

  async updateTransactionStatus(
    id: string,
    status: string,
    catatanPenolakan?: string
  ) {
    const formattedStatus = status.toUpperCase();

    return prisma.$transaction(async (tx) => {
      // 1. Check SetoranOtomatis
      const setoranOtomatis = await tx.setoranOtomatis.findUnique({
        where: { id },
        include: { bin: true, warga: true },
      });

      if (setoranOtomatis) {
        const oldStatus = setoranOtomatis.status || "PENDING";
        const updated = await tx.setoranOtomatis.update({
          where: { id },
          data: {
            status: formattedStatus,
            catatanPenolakan: catatanPenolakan || null,
          },
        });

        // Trigger logic if status changes to ACCEPTED
        if (formattedStatus === "ACCEPTED" && oldStatus !== "ACCEPTED") {
          const pointsEarned = Math.round(Number(setoranOtomatis.poin || 0));

          // Award Points to Warga
          if (pointsEarned > 0 && setoranOtomatis.wargaId) {
            await tx.pointHistory.create({
              data: {
                userId: setoranOtomatis.wargaId,
                points: pointsEarned,
                description: `Setoran Sampah ${setoranOtomatis.hasilKlasifikasiAi || "Terpilah"} Disetujui (+${pointsEarned} Pts)`,
                kategori: "SETORAN_SAMPAH",
                redeemable: true,
              },
            });
          }

          // Reset Bin Fullness / Capacity
          if (setoranOtomatis.qrTempatSampahId) {
            await tx.bin.update({
              where: { id: setoranOtomatis.qrTempatSampahId },
              data: {
                currentVolumeLiter: 0,
                status: "ACTIVE_BOUND",
              },
            });
          }

          // Real-Time Notification Trigger for Warga
          if (setoranOtomatis.wargaId) {
            await tx.notification.create({
              data: {
                userId: setoranOtomatis.wargaId,
                title: "Setoran Sampah Diterima!",
                message: `Setoran Anda (${setoranOtomatis.hasilKlasifikasiAi || "sampah"}, ${Number(setoranOtomatis.berat)} kg) telah diverifikasi dan diterima oleh Petugas. Poin +${pointsEarned} Pts ditambahkan ke akun Anda!`,
                isRead: false,
              },
            });
          }
        } else if (formattedStatus === "REJECTED" && oldStatus !== "REJECTED") {
          // Real-Time Notification Trigger for Rejection
          if (setoranOtomatis.wargaId) {
            await tx.notification.create({
              data: {
                userId: setoranOtomatis.wargaId,
                title: "Setoran Sampah Ditolak",
                message: `Setoran Anda (${setoranOtomatis.hasilKlasifikasiAi || "sampah"}, ${Number(setoranOtomatis.berat)} kg) ditolak oleh Petugas. Catatan: ${catatanPenolakan || "Tidak sesuai kriteria pemilahan."}`,
                isRead: false,
              },
            });
          }
        }

        return updated;
      }

      // 2. Check SetoranManual
      const setoranManual = await tx.setoranManual.findUnique({
        where: { id },
        include: { petugas: true },
      });

      if (setoranManual) {
        const oldStatus = setoranManual.status || "PENDING";
        const updated = await tx.setoranManual.update({
          where: { id },
          data: {
            status: formattedStatus,
            catatanPenolakan: catatanPenolakan || null,
          },
        });

        if (formattedStatus === "ACCEPTED" && oldStatus !== "ACCEPTED") {
          if (setoranManual.petugasResiduId) {
            await tx.notification.create({
              data: {
                userId: setoranManual.petugasResiduId,
                title: "Setoran Residu Diterima!",
                message: `Pengangkutan residu seberat ${Number(setoranManual.berat)} kg telah disetujui oleh Petugas Verifikasi.`,
                isRead: false,
              },
            });
          }
        } else if (formattedStatus === "REJECTED" && oldStatus !== "REJECTED") {
          if (setoranManual.petugasResiduId) {
            await tx.notification.create({
              data: {
                userId: setoranManual.petugasResiduId,
                title: "Setoran Residu Ditolak",
                message: `Pengangkutan residu seberat ${Number(setoranManual.berat)} kg ditolak. Catatan: ${catatanPenolakan || "Foto/data tidak valid."}`,
                isRead: false,
              },
            });
          }
        }

        return updated;
      }

      throw new Error("TRANSACTION_NOT_FOUND");
    });
  }
}

export const transactionService = new TransactionService();
