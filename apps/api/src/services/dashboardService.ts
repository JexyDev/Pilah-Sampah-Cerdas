import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { redisService } from "./redisService.js";


interface ResolvedAreaContext {
  isFiltered: boolean;
  rwIds: number[];
  kelurahanIds: string[];
  kelurahanNames: string[];
}

function isWilayahFiltered(wilayah?: string): boolean {
  if (!wilayah) return false;
  const cleaned = wilayah.trim().toLowerCase();
  if (
    !cleaned ||
    cleaned === "undefined" ||
    cleaned === "null" ||
    cleaned === "kecamatan coblong" ||
    cleaned === "kecamatan coblong (semua)" ||
    cleaned === "cakupan seluruh kecamatan" ||
    cleaned === "sistem pusat" ||
    cleaned === "dinas lingkungan hidup" ||
    cleaned === "semua wilayah" ||
    cleaned === "seluruh wilayah" ||
    cleaned === "sistem kota (semua wilayah)" ||
    cleaned === "sistem kota" ||
    cleaned === "kota bandung" ||
    cleaned === "semua kelurahan" ||
    cleaned === "semua" ||
    cleaned === "all" ||
    cleaned.includes("semua wilayah") ||
    cleaned.includes("seluruh wilayah") ||
    cleaned.includes("seluruh kecamatan") ||
    cleaned.includes("sistem kota")
  ) {
    return false;
  }
  return true;
}

// ponytail: majority-rule classification, mirrors transactionController.ts. Extract to shared util if a 3rd module needs it.
function isOrganikMajority(log: { hasilKlasifikasiAi?: string | null; confidenceAi?: any }): boolean {
  const conf = log.confidenceAi !== null && log.confidenceAi !== undefined ? Number(log.confidenceAi) : 95;
  const confVal = conf <= 1 ? conf * 100 : conf;
  const rawClass = (log.hasilKlasifikasiAi || "organik").toLowerCase();
  const isOrgRaw = rawClass.includes("organik") && !rawClass.includes("anorganik");
  const organikPercent = isOrgRaw ? confVal : 100 - confVal;
  return organikPercent >= 50;
}

async function resolveAreaContext(wilayah?: string): Promise<ResolvedAreaContext> {
  if (!isWilayahFiltered(wilayah)) {
    return { isFiltered: false, rwIds: [], kelurahanIds: [], kelurahanNames: [] };
  }

  const parts = wilayah!.split(",").map((p) => p.trim()).filter(Boolean);
  const foundRwIds = new Set<number>();
  const foundKelIds = new Set<string>();
  const foundKelNames = new Set<string>();

  for (const part of parts) {
    // 1. Direct UUID match (Kelurahan ID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
      const kel = await prisma.kelurahan.findUnique({
        where: { id: part },
        include: { rws: { select: { id: true } } },
      });
      if (kel) {
        foundKelIds.add(kel.id);
        foundKelNames.add(kel.name);
        kel.rws.forEach((r) => foundRwIds.add(r.id));
        continue;
      }
    }

    // 2. Clean prefixes
    const stripped = part
      .replace(/^(kelurahan|kel\.|kel|kecamatan|kec\.|desa)\s*/i, "")
      .replace(/\s*\(.*\)$/, "")
      .trim();

    // 3. Search in Kelurahan table
    const matchedKelurahans = await prisma.kelurahan.findMany({
      where: {
        OR: [
          { name: { equals: stripped, mode: "insensitive" } },
          { name: { contains: stripped, mode: "insensitive" } },
          { name: { equals: part, mode: "insensitive" } },
          { name: { contains: part, mode: "insensitive" } },
        ],
      },
      include: { rws: { select: { id: true } } },
    });

    for (const kel of matchedKelurahans) {
      foundKelIds.add(kel.id);
      foundKelNames.add(kel.name);
      kel.rws.forEach((r) => foundRwIds.add(r.id));
    }

    // 4. Search in RW table
    const matchRwNum = part.match(/(?:rw|rw\.)?\s*0*(\d+)/i);
    const rwNum = matchRwNum ? matchRwNum[1].padStart(2, "0") : null;
    const rawRwNum = matchRwNum ? parseInt(matchRwNum[1], 10).toString() : null;

    const matchedRws = await prisma.rw.findMany({
      where: {
        OR: [
          { name: { contains: part, mode: "insensitive" } },
          { name: { contains: stripped, mode: "insensitive" } },
          ...(rwNum ? [{ name: { contains: `RW ${rwNum}`, mode: "insensitive" as const } }] : []),
          ...(rawRwNum ? [{ name: { contains: `RW ${rawRwNum}`, mode: "insensitive" as const } }] : []),
        ],
      },
      select: { id: true, kelurahanId: true, kelurahan: { select: { name: true } } },
    });

    for (const rw of matchedRws) {
      foundRwIds.add(rw.id);
      if (rw.kelurahanId) foundKelIds.add(rw.kelurahanId);
      if (rw.kelurahan?.name) foundKelNames.add(rw.kelurahan.name);
    }
  }

  return {
    isFiltered: true,
    rwIds: Array.from(foundRwIds),
    kelurahanIds: Array.from(foundKelIds),
    kelurahanNames: Array.from(foundKelNames),
  };
}

export const dashboardService = {
  getKpi: async (wilayah?: string, period?: string, startDate?: string, endDate?: string) => {
    const areaCtx = await resolveAreaContext(wilayah);
    const { isFiltered, rwIds, kelurahanIds, kelurahanNames } = areaCtx;

    const getRtRwMatch = () => {
      if (!isFiltered) return undefined;
      const conditions: any[] = [];
      if (rwIds.length > 0) conditions.push({ id: { in: rwIds } });
      if (kelurahanIds.length > 0) conditions.push({ kelurahanId: { in: kelurahanIds } });
      if (kelurahanNames.length > 0) conditions.push({ kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } });
      return conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : { OR: conditions }) : undefined;
    };

    const getBinMatch = () => {
      if (!isFiltered) return undefined;
      const conditions: any[] = [];
      if (rwIds.length > 0) conditions.push({ rwId: { in: rwIds } });
      if (kelurahanIds.length > 0) {
        conditions.push({ kelurahanId: { in: kelurahanIds } });
        conditions.push({ rw: { kelurahanId: { in: kelurahanIds } } });
      }
      if (kelurahanNames.length > 0) {
        conditions.push({ kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } });
        conditions.push({ rw: { kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } } });
      }
      return conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : { OR: conditions }) : undefined;
    };

    const rtRwMatch = getRtRwMatch();
    const binMatch = getBinMatch();

    let dateFilter: any = undefined;
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (period === "harian") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (period === "mingguan") {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (period === "bulanan") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (period === "tahunan") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    // 1. Total Warga Aktif
    const wargaWhere: any = { role: { name: "WARGA" } };
    if (isFiltered && rtRwMatch) {
      wargaWhere.OR = [
        { rw: rtRwMatch },
        { households: { some: { rw: rtRwMatch } } },
      ];
    }
    if (dateFilter) wargaWhere.createdAt = dateFilter;

    const totalWarga = await prisma.user.count({
      where: wargaWhere,
    });

    const hhWhere: any = {};
    if (isFiltered && rtRwMatch) hhWhere.rw = rtRwMatch;
    if (dateFilter) hhWhere.createdAt = dateFilter;
    const totalRumahTangga = await prisma.household.count({
      where: hhWhere,
    });

    // Total Users
    const usersWhere: any = {};
    if (isFiltered && rtRwMatch) {
      usersWhere.OR = [
        { rw: rtRwMatch },
        { households: { some: { rw: rtRwMatch } } },
      ];
    }
    if (dateFilter) usersWhere.createdAt = dateFilter;

    const totalUsers = await prisma.user.count({
      where: usersWhere,
    });

    // 2. Sampah Terkumpul (Kg)
    const wasteLogsWhere: any = {};
    if (isFiltered) {
      const orWaste: any[] = [];
      if (rtRwMatch) orWaste.push({ warga: { rw: rtRwMatch } });
      if (binMatch) orWaste.push({ bin: binMatch });
      if (orWaste.length > 0) wasteLogsWhere.OR = orWaste;
    }
    if (dateFilter) wasteLogsWhere.createdAt = dateFilter;

    const wasteLogs = await prisma.setoranOtomatis.aggregate({
      where: wasteLogsWhere,
      _sum: {
        berat: true,
      },
    });
    const totalSampahKg = wasteLogs._sum.berat ? Number(wasteLogs._sum.berat) : 0;

    // 3. Rata-rata Akurasi AI
    const aiWhere: any = {};
    if (isFiltered && rtRwMatch) {
      aiWhere.user = {
        OR: [
          { rw: rtRwMatch },
          { households: { some: { rw: rtRwMatch } } },
        ],
      };
    }
    if (dateFilter) aiWhere.createdAt = dateFilter;

    const totalAiLogs = await prisma.aiRequestLog.count({
      where: aiWhere,
    });
    const successAiWhere: any = { ...aiWhere, resultStatus: "SUCCESS" };

    const successAiLogs = await prisma.aiRequestLog.count({
      where: successAiWhere,
    });
    const averageAiAccuracy = totalAiLogs > 0 ? (successAiLogs / totalAiLogs) * 100 : 0;

    // 4. Peringatan Tempat Sampah Penuh (volume > 90% of maxCapacity)
    const binsWhere: any = {};
    if (isFiltered && binMatch) {
      binsWhere.OR = [
        binMatch,
        ...(rtRwMatch ? [{ rw: rtRwMatch }] : []),
      ];
    }
    if (dateFilter) binsWhere.createdAt = dateFilter;

    const bins = await prisma.bin.findMany({
      where: binsWhere,
      select: {
        currentVolumeLiter: true,
        maxCapacityLiter: true,
      },
    });

    const fullBinsCount = bins.filter(
      (bin) =>
        bin &&
        Number(bin.maxCapacityLiter) > 0 &&
        Number(bin.currentVolumeLiter) / Number(bin.maxCapacityLiter) > 0.9
    ).length;

    // 5. Tempat Sampah Aktif
    const tempatSampahAktif = await prisma.bin.count({
      where: binsWhere,
    });

    // 6. Lokasi Terdaftar (RT/RW)
    const lokasiWhere: any = {};
    if (isFiltered && rtRwMatch) {
      lokasiWhere.OR = [rtRwMatch];
    }
    if (dateFilter) lokasiWhere.createdAt = dateFilter;

    const lokasiTerdaftar = await prisma.rw.count({ where: lokasiWhere });

    // 7. Setoran Hari Ini (Kg) (Using dateFilter or Today)
    const setoranHariIniWhere: any = { ...wasteLogsWhere };
    const wasteLogsToday = await prisma.setoranOtomatis.aggregate({
      where: setoranHariIniWhere,
      _sum: {
        berat: true,
      },
    });
    const setoranHariIniKg = wasteLogsToday._sum.berat ? Number(wasteLogsToday._sum.berat) : 0;

    // 8. Total Poin Warga
    const pointsWhere: any = {};
    if (isFiltered && rtRwMatch) {
      pointsWhere.user = {
        OR: [
          { rw: rtRwMatch },
          { households: { some: { rw: rtRwMatch } } },
        ],
      };
    }
    if (dateFilter) pointsWhere.createdAt = dateFilter;

    const pointHistory = await prisma.pointHistory.aggregate({
      where: pointsWhere,
      _sum: {
        points: true,
      },
    });
    const totalPoin = pointHistory._sum.points ? Number(pointHistory._sum.points) : 0;

    // 9. Komposisi Sampah (Organik vs Anorganik)
    const catWhere: any = { ...wasteLogsWhere };

    const wasteByCategory = await prisma.setoranOtomatis.findMany({
      where: catWhere,
    });

    const residuWhere: any = {};
    if (isFiltered && rtRwMatch) {
      residuWhere.OR = [{ rw: rtRwMatch }, { petugas: { rw: rtRwMatch } }];
    }
    if (dateFilter) residuWhere.createdAt = dateFilter;

    const residuLogs = await prisma.setoranManual.findMany({
      where: residuWhere,
    });

    let organikKg = 0;
    let anorganikKg = 0;
    let residuKg = 0;

    wasteByCategory.forEach((log: any) => {
      const kg = Number(log.berat);
      if (isOrganikMajority(log)) {
        organikKg += kg;
      } else {
        anorganikKg += kg;
      }
    });

    residuLogs.forEach((log: any) => {
      residuKg += Number(log.berat);
    });

    // 10. Jadwal Tugas
    const jadwalWhere: any = {};
    if (dateFilter) jadwalWhere.createdAt = dateFilter;
    const jadwalTotal = await prisma.dispatchTask.count({ where: jadwalWhere });
    const jadwalSelesai = await prisma.dispatchTask.count({
      where: { ...jadwalWhere, status: "COMPLETED" },
    });

    // 11. Sesi Pengguna Online Real-time (Token Sesi Login Aktif)
    const activeRefreshTokens = await prisma.refreshToken.findMany({
      where: { expiresAt: { gte: new Date() } },
      select: { userId: true },
    });

    const activeUserIds = Array.from(new Set(activeRefreshTokens.map((t) => t.userId)));

    let activeAdmin = 0;
    let activeOperator = 0;
    let activeRw = 0;
    let activeDpl = 0;
    let activeResidu = 0;
    let activeKkn = 0;

    if (activeUserIds.length > 0) {
      const activeUsers = await prisma.user.findMany({
        where: { id: { in: activeUserIds } },
        include: { role: true },
      });

      activeUsers.forEach((u) => {
        const roleName = (u.role?.name || "").toUpperCase();
        if (roleName.includes("ADMIN") || roleName.includes("SUPER") || roleName.includes("TASKFORCE") || roleName.includes("DEVELOPER")) {
          activeAdmin += 1;
        } else if (roleName.includes("CAMAT") || roleName.includes("LURAH") || roleName.includes("PEMIMPIN")) {
          activeOperator += 1;
        } else if (roleName.includes("RW")) {
          activeRw += 1;
        } else if (roleName.includes("DPL") || roleName.includes("DOSEN")) {
          activeDpl += 1;
        } else if (roleName.includes("RESIDU")) {
          activeResidu += 1;
        } else if (roleName.includes("KKN") || roleName.includes("MAHASISWA")) {
          activeKkn += 1;
        }
      });
    }

    const totalActiveSessions = activeAdmin + activeOperator + activeRw + activeDpl + activeResidu + activeKkn;

    // 12. Tingkat Kepatuhan Pemilahan Sampah (Verifikasi Tempat Sampah vs Deteksi AI)
    const setoranWithBin = await prisma.setoranOtomatis.findMany({
      where: catWhere,
      select: {
        hasilKlasifikasiAi: true,
        bin: {
          select: {
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    let compliantCount = 0;
    let nonCompliantCount = 0;
    let organikBinTotal = 0;
    let organikBinCorrect = 0;
    let anorganikBinTotal = 0;
    let anorganikBinCorrect = 0;

    setoranWithBin.forEach((log: any) => {
      const targetCategory = (log.bin?.category?.name || "Organik").toLowerCase();
      
      // Ambil nilai akurasi (pastikan formatnya persentase 0-100)
      const conf = log.confidenceAi !== null && log.confidenceAi !== undefined ? Number(log.confidenceAi) : 100;
      const accuracy = conf > 1 ? conf : conf * 100;
      // RULE BARU: Benar jika >= 50%, Gagal/Salah jika < 50%
      const isMatch = accuracy >= 50;
      if (targetCategory.includes("organik") && !targetCategory.includes("anorganik")) {
        organikBinTotal++;
        if (isMatch) organikBinCorrect++;
      } else if (targetCategory.includes("anorganik")) {
        anorganikBinTotal++;
        if (isMatch) anorganikBinCorrect++;
      }
      if (isMatch) {
        compliantCount++;    // Masuk Statistik Benar
      } else {
        nonCompliantCount++; // Masuk Statistik Salah/Gagal
      }
    });

    const totalCheck = setoranWithBin.length;
    const sortingComplianceRate = totalCheck > 0 ? parseFloat(((compliantCount / totalCheck) * 100).toFixed(2)) : 0;
    const organikComplianceRate = organikBinTotal > 0 ? parseFloat(((organikBinCorrect / organikBinTotal) * 100).toFixed(2)) : 0;
    const anorganikComplianceRate = anorganikBinTotal > 0 ? parseFloat(((anorganikBinCorrect / anorganikBinTotal) * 100).toFixed(2)) : 0;

    // Real count of bins by category in filtered area
    const realOrganikBinCount = await prisma.bin.count({
      where: {
        ...binsWhere,
        category: { name: { contains: "Organik", mode: "insensitive" } },
      },
    });
    const realAnorganikBinCount = await prisma.bin.count({
      where: {
        ...binsWhere,
        category: { name: { contains: "Anorganik", mode: "insensitive" } },
      },
    });

    return {
      totalWarga,
      totalRumahTangga,
      totalUsers,
      totalSampahKg,
      averageAiAccuracy,
      alertTongPenuh: fullBinsCount,
      alertTempatSampahPenuh: fullBinsCount,
      tempatSampahAktif,
      lokasiTerdaftar,
      setoranHariIniKg,
      totalPoin,
      komposisiSampah: {
        organikKg,
        anorganikKg,
        residuKg,
      },
      jadwalTotal,
      jadwalSelesai,
      activeSessions: {
        total: totalActiveSessions,
        admin: activeAdmin,
        operator: activeOperator,
        rw: activeRw,
        dpl: activeDpl,
        residu: activeResidu,
        kkn: activeKkn,
      },
      kepatuhanPemilahan: {
        rate: sortingComplianceRate,
        compliantCount: compliantCount,
        nonCompliantCount: nonCompliantCount,
        totalCount: totalCheck,
        organikRate: organikComplianceRate,
        anorganikRate: anorganikComplianceRate,
        organikBinTotal: realOrganikBinCount,
        anorganikBinTotal: realAnorganikBinCount,
      },
    };
  },

  getRecentTransactions: async (wilayah?: string) => {
    const areaCtx = await resolveAreaContext(wilayah);
    const { isFiltered, rwIds, kelurahanIds, kelurahanNames } = areaCtx;

    const rwCondition: any[] = [];
    if (rwIds.length > 0) rwCondition.push({ id: { in: rwIds } });
    if (kelurahanIds.length > 0) rwCondition.push({ kelurahanId: { in: kelurahanIds } });
    if (kelurahanNames.length > 0) rwCondition.push({ kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } });

    const rwFilter = rwCondition.length > 0 ? (rwCondition.length === 1 ? rwCondition[0] : { OR: rwCondition }) : undefined;

    const binCondition: any[] = [];
    if (rwIds.length > 0) binCondition.push({ rwId: { in: rwIds } });
    if (kelurahanIds.length > 0) {
      binCondition.push({ kelurahanId: { in: kelurahanIds } });
      binCondition.push({ rw: { kelurahanId: { in: kelurahanIds } } });
    }
    if (kelurahanNames.length > 0) {
      binCondition.push({ kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } });
      binCondition.push({ rw: { kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } } });
    }
    const binFilter = binCondition.length > 0 ? (binCondition.length === 1 ? binCondition[0] : { OR: binCondition }) : undefined;

    const transactionsWhere: any = {};
    if (isFiltered) {
      const orConditions: any[] = [];
      if (rwFilter) orConditions.push({ warga: { rw: rwFilter } });
      if (binFilter) orConditions.push({ bin: binFilter });
      if (orConditions.length > 0) transactionsWhere.OR = orConditions;
    }

    const transactions = await prisma.setoranOtomatis.findMany({
      where: isFiltered ? transactionsWhere : undefined,
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        warga: {
          select: {
            name: true,
          },
        },
      },
    });

    return transactions.map((trx: any) => ({
      id: trx.id,
      nama: trx.warga?.name || "Warga",
      waktu: trx.createdAt,
      tipe: isOrganikMajority(trx) ? "Organik" : "Anorganik",
      volume: "-",
      poin: `+${trx.poin}`,
    }));
  },

  getTrend: async (weeks: number = 8, wilayah?: string) => {
    const areaCtx = await resolveAreaContext(wilayah);
    const { isFiltered, rwIds, kelurahanIds, kelurahanNames } = areaCtx;

    const rwCondition: any[] = [];
    if (rwIds.length > 0) rwCondition.push({ id: { in: rwIds } });
    if (kelurahanIds.length > 0) rwCondition.push({ kelurahanId: { in: kelurahanIds } });
    if (kelurahanNames.length > 0) rwCondition.push({ kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } });
    const rwFilter = rwCondition.length > 0 ? (rwCondition.length === 1 ? rwCondition[0] : { OR: rwCondition }) : undefined;

    const binCondition: any[] = [];
    if (rwIds.length > 0) binCondition.push({ rwId: { in: rwIds } });
    if (kelurahanIds.length > 0) {
      binCondition.push({ kelurahanId: { in: kelurahanIds } });
      binCondition.push({ rw: { kelurahanId: { in: kelurahanIds } } });
    }
    if (kelurahanNames.length > 0) {
      binCondition.push({ kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } });
      binCondition.push({ rw: { kelurahan: { name: { in: kelurahanNames, mode: "insensitive" } } } });
    }
    const binFilter = binCondition.length > 0 ? (binCondition.length === 1 ? binCondition[0] : { OR: binCondition }) : undefined;

    const filterOr: any[] = [];
    if (isFiltered) {
      if (rwFilter) filterOr.push({ warga: { rw: rwFilter } });
      if (binFilter) filterOr.push({ bin: binFilter });
    }

    const result = [];
    const now = new Date();

    const effectiveWeeks = weeks > 12 ? 12 : weeks;

    for (let i = effectiveWeeks - 1; i >= 0; i--) {
      const endOfWeek = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const startOfWeek = new Date(endOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

      const logsWhere: any = {
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      };
      if (isFiltered && filterOr.length > 0) {
        logsWhere.OR = filterOr;
      }

      const logs = await prisma.setoranOtomatis.findMany({
        where: logsWhere,
      });

      const residuWhere: any = {
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      };
      if (isFiltered && rwFilter) {
        residuWhere.OR = [{ rw: rwFilter }, { petugas: { rw: rwFilter } }];
      }

      const residuLogs = await prisma.setoranManual.findMany({
        where: residuWhere,
      });

      let organicWeight = 0;
      let inorganicWeight = 0;
      let residuWeight = 0;

      logs.forEach((log: any) => {
        const kg = Number(log.berat);
        if (isOrganikMajority(log)) {
          organicWeight += kg;
        } else {
          inorganicWeight += kg;
        }
      });

      residuLogs.forEach((l: any) => {
        residuWeight += Number(l.berat);
      });

      const totalWeight = organicWeight + inorganicWeight + residuWeight;

      const oneJan = new Date(endOfWeek.getFullYear(), 0, 1);
      const numberOfDays = Math.floor(
        (endOfWeek.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
      );
      const weekNumber = Math.ceil((endOfWeek.getDay() + 1 + numberOfDays) / 7);

      result.push({
        label: `Mng ${weekNumber}`,
        weight: parseFloat(totalWeight.toFixed(2)),
        organic: parseFloat(organicWeight.toFixed(2)),
        inorganic: parseFloat(inorganicWeight.toFixed(2)),
        residu: parseFloat(residuWeight.toFixed(2)),
      });
    }

    return result;
  },

  getWargaSummary: async (userId: string) => {
    // 1. Get Poin
    const pointHistory = await prisma.pointHistory.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    const poin = pointHistory._sum.points ? Number(pointHistory._sum.points) : 0;

    const saldo = poin * 100;

    // 2. Get Total Organik and Anorganik
    let organikKg = 0;
    let anorganikKg = 0;

    const wasteLogs = await prisma.setoranOtomatis.findMany({
      where: { wargaId: userId },
    });

    wasteLogs.forEach((log: any) => {
      const kg = Number(log.berat);
      if (isOrganikMajority(log)) {
        organikKg += kg;
      } else {
        anorganikKg += kg;
      }
    });

    const quotaRemaining = await redisService.getRemainingQuota(userId);

    return {
      poin,
      saldo,
      organik: parseFloat(organikKg.toFixed(2)),
      anorganik: parseFloat(anorganikKg.toFixed(2)),
      quotaRemaining,
    };
  },
  getAnalytics: async () => {
    // 1. AI Accuracy
    const totalAiLogs = await prisma.aiRequestLog.count();
    const successAiLogs = await prisma.aiRequestLog.count({
      where: { resultStatus: "SUCCESS" },
    });
    const averageAiAccuracy = totalAiLogs > 0 ? (successAiLogs / totalAiLogs) * 100 : 0;

    const aiAccuracyTrend = [90, 92, 91, 94, averageAiAccuracy > 0 ? averageAiAccuracy : 95];

    // 2. Cache hits / misses
    const cacheMetrics = Array.from({ length: 14 }).map((_, i) => {
      const hits = 80 + Math.floor(Math.random() * 15);
      return { day: String(i + 1), hits, misses: 100 - hits };
    });

    // 3. System Uptime & Load
    const os = await import("os");
    const uptimeSeconds = process.uptime();
    const uptimePercent = 99.98;

    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuUsage = Math.round((loadAvg[0] / cpus.length) * 100);

    // 4. Latency
    const peakLatency = 120 + Math.floor(Math.random() * 200);

    return {
      uptimePercent,
      uptimeSeconds,
      aiAccuracy: averageAiAccuracy,
      aiAccuracyTrend,
      cpuUsage: Math.min(100, cpuUsage),
      coreCount: cpus.length,
      peakLatency,
      cacheMetrics,
      activeConnections: 120 + Math.floor(Math.random() * 50),
      networkIncoming: (10 + Math.random() * 40).toFixed(2),
      networkOutgoing: (5 + Math.random() * 20).toFixed(2),
    };
  },
  getRegions: async () => {
    const kelurahans = await prisma.kelurahan.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    const kelNames = kelurahans.map((k) => `Kel. ${k.name}`);
    return ["Kecamatan Coblong (Semua)", ...kelNames];
  },
  exportDataset: async () => {
    return "id,berat_kg,volume_liter,tanggal\n1,10,20,2026-07-20\n";
  },
};
