import { prisma } from "../lib/prisma.js";
import { getScopingFilters } from "../utils/rbacScoping.js";
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

    let resolvedPic = (pic || "").trim();
    let resolvedKontak = kontak ? String(kontak).trim() : undefined;
    if (
      resolvedPic &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedPic)
    ) {
      const userObj = await prisma.user.findUnique({
        where: { id: resolvedPic },
        select: { name: true, phone: true },
      });
      if (userObj?.name) {
        resolvedPic = userObj.name;
        if (!resolvedKontak && userObj.phone) {
          resolvedKontak = userObj.phone;
        }
      }
    }

    const safeKapasitas =
      kapasitas !== undefined && kapasitas !== null && !isNaN(Number(kapasitas))
        ? Math.min(Math.max(Number(kapasitas), 0), 99999999)
        : null;

    return prisma.facility.create({
      data: {
        jenis: jenis as FacilityType,
        nama: (nama || "").trim(),
        pic: resolvedPic,
        foto: foto || null,
        kontak: resolvedKontak || null,
        alamat: alamat ? alamat.trim() : null,
        rwId: rwId !== undefined && !isNaN(Number(rwId)) && Number(rwId) > 0 ? Number(rwId) : null,
        kapasitas: safeKapasitas,
        latitude: latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : 0.0,
        longitude: longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : 0.0,
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
    if (jenis && jenis !== "ALL") {
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
    } else if (!jenis || jenis === "ALL") {
      // Default: Fasilitas pengelolaan sampah murni (tanpa posko_kkn)
      whereClause.jenis = { not: "posko_kkn" };
    }

    if (user) {
      const scopes = await getScopingFilters(user);

      // Merge the scope filters into whereClause
      // If whereClause already has a 'jenis', we use AND
      if (Object.keys(whereClause).length > 0) {
        whereClause = {
          AND: [whereClause, scopes.facilityFilter || {}],
        };
      } else {
        whereClause = scopes.facilityFilter || {};
      }
    }

    const list = await prisma.facility.findMany({
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

    return list.map((fac) => {
      let resolvedPic = fac.pic;
      let resolvedKontak = fac.kontak;
      if (
        fac.pic &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fac.pic.trim())
      ) {
        if (fac.registeredBy?.name) {
          resolvedPic = fac.registeredBy.name;
        }
        if ((!resolvedKontak || resolvedKontak === "-") && fac.registeredBy?.phone) {
          resolvedKontak = fac.registeredBy.phone;
        }
      }
      return {
        ...fac,
        pic: resolvedPic,
        kontak: resolvedKontak,
      };
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
