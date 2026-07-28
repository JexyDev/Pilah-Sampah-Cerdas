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
    // REKAP-01 FIX: Only return waste logs from WARGA users (role.name = 'WARGA')
    // This prevents admin/petugas-created records from appearing in rekap setoran
    return prisma.wasteLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        household: {
          include: {
            user: {
              select: {
                name: true,
                role: {
                  select: { name: true },
                },
              },
            },
          },
        },
        category: true,
        bin: {
          include: {
            rtRw: true,
          },
        },
      },
      where: {
        household: {
          user: {
            role: {
              name: "WARGA", // RBAC: Only include WasteLog from WARGA users
            },
          },
        },
        bin: binCode
          ? {
              qrCode: binCode,
            }
          : undefined,
      },
    });
  }

  async getMyDeposits(userId: string) {
    const household = await prisma.household.findFirst({
      where: { userId },
    });

    if (!household) {
      return [];
    }

    return prisma.wasteLog.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        bin: {
          include: {
            rtRw: true,
          },
        },
      },
    });
  }

  async getDepositDetails(id: string) {
    return prisma.wasteLog.findUnique({
      where: { id },
      include: {
        household: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        category: true,
        bin: {
          include: {
            rtRw: true,
          },
        },
        verifiedByPetugas: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async createManualDeposit(
    petugasId: string,
    wargaId: string,
    beratKg: number,
    kategoriId: string,
    fotoUrl: string,
    overridePoin: number | null
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Dapatkan householdId dari wargaId
      const household = await tx.household.findFirst({
        where: { userId: wargaId },
        include: { user: true },
      });
      if (!household) throw new Error("Rumah tangga tidak ditemukan untuk warga ini");

      // 2. Dapatkan bin warga (ambil bin pertama yg aktif jika ada)
      const bin = await tx.bin.findFirst({
        where: { userId: wargaId, status: "ACTIVE_BOUND" },
      });
      if (!bin) throw new Error("Warga belum memiliki tong sampah aktif");

      const category = await tx.wasteCategory.findUnique({
        where: { id: kategoriId },
      });
      if (!category) throw new Error("Kategori sampah tidak valid");

      // 3. Mock AI Check
      // Normally we'd call a real AI service, but we mock the result here for the requirements
      const isOrganic =
        category.name.toUpperCase().includes("ORGANIK") &&
        !category.name.toUpperCase().includes("ANORGANIK") &&
        !category.name.toUpperCase().includes("NON");

      // We'll randomly generate AI confidence to simulate discrepancies
      // Or just always match the category if confidence < 90, but to allow PENDING_REVIEW, we'll randomize a bit
      const aiConfidence = Math.random() * 0.2 + 0.8; // 0.8 to 1.0
      let aiClassification = isOrganic ? "ORGANIC" : "NON_ORGANIC";

      // Simulate discrepancy occasionally (if random > 0.8, we flip the AI classification)
      if (Math.random() > 0.8) {
        aiClassification = aiClassification === "ORGANIC" ? "NON_ORGANIC" : "ORGANIC";
      }

      // Check threshold > 0.90
      let discrepancyStatus = "NONE";
      const manualClass = isOrganic ? "ORGANIC" : "NON_ORGANIC";
      if (aiClassification !== manualClass && aiConfidence > 0.9) {
        discrepancyStatus = "PENDING_REVIEW";
      }

      // 4. Hitung Poin
      const calculatedPoints =
        overridePoin !== null ? overridePoin : Math.floor(beratKg * category.pointsPerKg);

      // 5. Buat WasteLog
      const volumeLiter = beratKg * 1.5; // Rough estimate

      const log = await tx.wasteLog.create({
        data: {
          householdId: household.id,
          binId: bin.id,
          weightKg: beratKg,
          volumeLiter,
          categoryId: category.id,
          requestId: uuidv4(),
          aiConfidence,
          aiClassification,
          actualWeightPetugas: beratKg,
          discrepancyStatus,
          verifiedByPetugasId: petugasId,
          verifiedAt: new Date(),
          petugasClassification: manualClass,
          evidencePhotoUrl: fotoUrl,
        },
      });

      // 6. Jika poin > 0 dan tidak PENDING_REVIEW, tambahkan poin
      // Jika PENDING_REVIEW, poin ditahan dulu sampai direview
      if (calculatedPoints > 0 && discrepancyStatus !== "PENDING_REVIEW") {
        await tx.pointHistory.create({
          data: {
            userId: wargaId,
            points: calculatedPoints,
            description: `Setoran sampah via Petugas (${beratKg}kg ${category.name})`,
            kategori: "REDUKSI_TONASE",
          },
        });
      }

      return { log, discrepancyStatus, calculatedPoints };
    });
  }

  async createResiduDeposit(petugasId: string, rtRwId: number, beratKg: number, photoPath: string) {
    return prisma.residuLog.create({
      data: {
        petugasId,
        rtRwId,
        beratKg,
        fotoUrl: photoPath,
      },
    });
  }
}

export const transactionService = new TransactionService();
