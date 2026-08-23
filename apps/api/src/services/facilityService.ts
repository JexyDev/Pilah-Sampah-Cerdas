import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { FacilityType } from "@prisma/client";

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
    longitude?: number,
    registeredByUserId?: string,
    kelompokId?: string,
    alamat?: string,
    rwId?: number,
    statusApproval?: "APPROVED" | "PENDING" | "REJECTED"
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
      "posko_kkn",
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
        alamat: alamat || null,
        rwId: rwId !== undefined && !isNaN(Number(rwId)) ? Number(rwId) : null,
        kapasitas: kapasitas !== undefined ? Number(kapasitas) : null,
        latitude: latitude !== undefined ? Number(latitude) : 0.0,
        longitude: longitude !== undefined ? Number(longitude) : 0.0,
        registeredByUserId: registeredByUserId ?? undefined,
        kelompokId: kelompokId ?? undefined,
        statusApproval: statusApproval || "APPROVED",
      },
    });
  },

  /**
   * Master Data Jenis Fasilitas
   */
  getJenisFasilitas: async () => {
    const DEFAULT_JENIS = [
      {
        key: "rumah_maggot",
        nama: "Rumah Maggot",
        iconUrl: "/uploads/icons/rumah_maggot.png",
        deskripsi: "Fasilitas pengolahan sampah organik menggunakan larva BSF",
        isActive: true,
      },
      {
        key: "loseda",
        nama: "Loseda",
        iconUrl: "/uploads/icons/loseda.png",
        deskripsi: "Lubang sedalam 1 meter untuk pengomposan langsung",
        isActive: true,
      },
      {
        key: "bata_terawang",
        nama: "Bata Terawang",
        iconUrl: "/uploads/icons/bata_terawang.png",
        deskripsi: "Komposter aerobik menggunakan susunan bata berongga",
        isActive: true,
      },
      {
        key: "bank_sampah",
        nama: "Bank Sampah",
        iconUrl: "/uploads/icons/bank_sampah.png",
        deskripsi: "Tempat pengumpulan sampah anorganik bernilai ekonomi",
        isActive: true,
      },
      {
        key: "buruan_sae",
        nama: "Buruan Sae",
        iconUrl: "/uploads/icons/buruan_sae.png",
        deskripsi: "Program pengelolaan pekarangan untuk ketahanan pangan",
        isActive: true,
      },
      {
        key: "poc",
        nama: "Pupuk Organik Cair (POC)",
        iconUrl: "/uploads/icons/poc.png",
        deskripsi: "Fasilitas pembuatan pupuk cair dari sampah organik",
        isActive: true,
      },
      {
        key: "tps",
        nama: "TPS",
        iconUrl: "/uploads/icons/tps.png",
        deskripsi: "Tempat Pembuangan Sampah sementara",
        isActive: true,
      },
      {
        key: "posko_kkn",
        nama: "Posko KKN",
        iconUrl: "/uploads/icons/posko.png",
        deskripsi: "Posko / kantor kelurahan",
        isActive: true,
      },
    ];

    try {
      let list = await prisma.jenisFasilitas.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
      });
      if (list.length === 0) {
        for (const item of DEFAULT_JENIS) {
          await prisma.jenisFasilitas.upsert({
            where: { key: item.key },
            update: item,
            create: item,
          });
        }
        list = await prisma.jenisFasilitas.findMany({
          where: { isActive: true },
          orderBy: { id: "asc" },
        });
      }
      return list;
    } catch (e) {
      return DEFAULT_JENIS.map((d, index) => ({ id: index + 1, ...d }));
    }
  },

  /**
   * Get all facilities with optional type filtering
   */
  getFacilities: async (jenis?: string, user?: any) => {
    let whereClause: any = {};
    if (jenis) {
      const validTypes = [
        "loseda",
        "bata_terawang",
        "rumah_maggot",
        "bank_sampah",
        "tps",
        "buruan_sae",
        "poc",
        "posko_kkn",
      ];
      if (!validTypes.includes(jenis)) {
        throw new Error("INVALID_FACILITY_TYPE");
      }
      whereClause.jenis = jenis as any;
    }

    const roleName = String(user?.role || "").toUpperCase();
    if (user && !["SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE", "DEVELOPER"].includes(roleName)) {
      let allowedRwIds: number[] = [];
      let kelompokIdStr: string | undefined;

      if (roleName === "MAHASISWA_KKN") {
        const student = await prisma.studentKkn.findUnique({ where: { userId: user.userId }, include: { kelompok: true, user: true } });
        if (student?.assignedRwId) allowedRwIds.push(student.assignedRwId);
        if (student?.user?.rwId) allowedRwIds.push(student.user.rwId);
        if (student?.kelompokId) kelompokIdStr = student.kelompokId;
      } else if (roleName === "DPL" || roleName === "DOSEN_PEMBIMBING") {
        const userId = user.userId || user.id;
        const kelompoks = await prisma.kelompokKkn.findMany({ where: { dplId: userId } });
        if (kelompoks.length > 0) {
          const kelurahanNames = kelompoks.map((k) => k.kelurahan).filter((k): k is string => Boolean(k));
          const allCakupanRw: string[] = [];
          kelompoks.forEach((k) => {
            if (Array.isArray(k.cakupanRw)) {
              (k.cakupanRw as any[]).forEach((r) => {
                const s = String(r).trim();
                if (/^\d+$/.test(s)) allCakupanRw.push(`RW ${s.length === 1 ? `0${s}` : s}`);
                else allCakupanRw.push(s);
              });
            }
          });
          if (kelurahanNames.length > 0) {
            whereClause.rw = {
              kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } },
              ...(allCakupanRw.length > 0 ? { name: { in: allCakupanRw } } : {}),
            };
          }
        }
      } else if (user.rwId) {
        allowedRwIds.push(user.rwId);
      }
      
      const orConditions: any[] = [];
      if (allowedRwIds.length > 0) {
        orConditions.push({ rwId: { in: allowedRwIds } });
      }
      if (kelompokIdStr) {
        orConditions.push({ kelompokId: kelompokIdStr });
      }
      if (roleName === "MAHASISWA_KKN") {
        orConditions.push({ registeredByUserId: user.userId });
      }
      
      if (orConditions.length > 0) {
        // If there are other OR conditions, we merge them, but currently there are none.
        whereClause.OR = orConditions;
      }
    }

    return prisma.facility.findMany({
      where: whereClause,
      include: {
        rw: true,
        registeredBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
          inputBy: userId ?? null,
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
   * Verifikasi log produksi oleh RW/Petugas Pemilah
   */
  verifyProduction: async (logId: string, verifiedByUserId: string) => {
    const log = await prisma.facilityProductionLog.findUnique({ where: { id: logId } });
    if (!log) throw new Error("PRODUCTION_LOG_NOT_FOUND");
    if (log.isVerified) throw new Error("Log sudah diverifikasi sebelumnya");

    return prisma.facilityProductionLog.update({
      where: { id: logId },
      data: {
        isVerified: true,
        verifiedBy: verifiedByUserId,
        verifiedAt: new Date(),
      },
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
