/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient, FacilityType } from "@prisma/client";

const prisma = new PrismaClient();

export const facilityService = {
  /**
   * Create a new waste facility
   */
  createFacility: async (
    jenis: string,
    nama: string,
    pic: string,
    foto?: string,
    kontak?: string,
    kapasitas?: number,
    latitude?: number,
    longitude?: number
  ) => {
    // Validate facility type
    const validTypes = [
      "loseda",
      "bata_terawang",
      "rumah_maggot",
      "bank_sampah",
      "tps",
      "buruan_sae",
      "poc",
    ];
    if (!validTypes.includes(jenis)) {
      throw new Error("INVALID_FACILITY_TYPE");
    }

    return prisma.facility.create({
      data: {
        jenis: jenis as FacilityType,
        nama,
        pic,
        foto,
        kontak,
        kapasitas: kapasitas !== undefined ? Number(kapasitas) : null,
        latitude: latitude !== undefined ? Number(latitude) : 0.0,
        longitude: longitude !== undefined ? Number(longitude) : 0.0,
      },
    });
  },

  /**
   * Get all facilities with optional type filtering
   */
  getFacilities: async (jenis?: string) => {
    if (jenis) {
      const validTypes = ["loseda", "bata_terawang", "rumah_maggot", "bank_sampah", "tps"];
      if (!validTypes.includes(jenis)) {
        throw new Error("INVALID_FACILITY_TYPE");
      }
      return prisma.facility.findMany({
        where: { jenis: jenis as FacilityType },
        orderBy: { nama: "asc" },
      });
    }
    return prisma.facility.findMany({
      orderBy: { nama: "asc" },
    });
  },

  /**
   * Record production log for a facility (e.g. Rumah Maggot)
   */
  recordProduction: async (
    facilityId: string,
    materialMasukKg: number,
    outputKg: number,
    jenisOutput: string,
    periode: string,
    userId?: string
  ) => {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });
    if (!facility) throw new Error("FACILITY_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const log = await tx.facilityProductionLog.create({
        data: {
          facilityId,
          materialMasukKg: Number(materialMasukKg),
          outputKg: Number(outputKg),
          jenisOutput,
          periode,
        },
      });

      // Award gamification points: 1 Kg = 10 Poin default
      if (userId && Number(outputKg) > 0) {
        const points = Math.floor(Number(outputKg) * 10);
        await tx.pointHistory.create({
          data: {
            userId,
            points,
            description: `Produksi ${jenisOutput} dari ${facility.nama} (${outputKg} Kg)`,
            kategori: "PEMANFAATAN",
            redeemable: true,
          },
        });
      }

      return log;
    });
  },

  /**
   * Register a new farm (Peternakan) for maggot distribution
   */
  createFarm: async (
    nama: string,
    pemilik: string,
    noWa: string,
    populasi?: number,
    hasilPanenKg?: number
  ) => {
    return prisma.peternakan.create({
      data: {
        nama,
        pemilik,
        noWa,
        populasi: populasi !== undefined ? Number(populasi) : 0,
        hasilPanenKg: hasilPanenKg !== undefined ? Number(hasilPanenKg) : 0.0,
      },
    });
  },

  /**
   * Get list of all registered farms
   */
  getFarms: async () => {
    return prisma.peternakan.findMany({
      orderBy: { nama: "asc" },
    });
  },

  /**
   * Log distribution of maggot to a registered farm
   */
  distributeMaggot: async (peternakanId: string, quantityKg: number) => {
    const farm = await prisma.peternakan.findUnique({
      where: { id: peternakanId },
    });
    if (!farm) throw new Error("FARM_NOT_FOUND");

    return prisma.maggotDistributionLog.create({
      data: {
        peternakanId,
        quantityKg: Number(quantityKg),
        tanggal: new Date(),
      },
    });
  },
};
