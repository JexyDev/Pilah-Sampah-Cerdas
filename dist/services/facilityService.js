/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const facilityService = {
    /**
     * Create a new waste facility
     */
    createFacility: async (jenis, nama, pic, foto, kontak, kapasitas, latitude, longitude) => {
        // Validate facility type
        const validTypes = ["loseda", "bata_terawang", "rumah_maggot", "bank_sampah", "tps"];
        if (!validTypes.includes(jenis)) {
            throw new Error("INVALID_FACILITY_TYPE");
        }
        return prisma.facility.create({
            data: {
                jenis: jenis,
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
    getFacilities: async (jenis) => {
        if (jenis) {
            const validTypes = ["loseda", "bata_terawang", "rumah_maggot", "bank_sampah", "tps"];
            if (!validTypes.includes(jenis)) {
                throw new Error("INVALID_FACILITY_TYPE");
            }
            return prisma.facility.findMany({
                where: { jenis: jenis },
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
    recordProduction: async (facilityId, materialMasukKg, outputKg, jenisOutput, periode) => {
        const facility = await prisma.facility.findUnique({
            where: { id: facilityId },
        });
        if (!facility)
            throw new Error("FACILITY_NOT_FOUND");
        return prisma.facilityProductionLog.create({
            data: {
                facilityId,
                materialMasukKg: Number(materialMasukKg),
                outputKg: Number(outputKg),
                jenisOutput,
                periode,
            },
        });
    },
    /**
     * Register a new farm (Peternakan) for maggot distribution
     */
    createFarm: async (nama, pemilik, noWa, populasi, hasilPanenKg) => {
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
    distributeMaggot: async (peternakanId, quantityKg) => {
        const farm = await prisma.peternakan.findUnique({
            where: { id: peternakanId },
        });
        if (!farm)
            throw new Error("FARM_NOT_FOUND");
        return prisma.maggotDistributionLog.create({
            data: {
                peternakanId,
                quantityKg: Number(quantityKg),
                tanggal: new Date(),
            },
        });
    },
};
