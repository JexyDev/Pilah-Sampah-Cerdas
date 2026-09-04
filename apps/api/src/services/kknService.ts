import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { isPointInPolygonWithBuffer } from "../utils/geoUtils.js";
import {
  calculateDistance,
  calculateLiveInZoneSeconds,
  calculateLiveInZoneMinutes,
  kknAttendanceService,
} from "./kknAttendanceService.js";
import { parseProkerDeskripsi } from "./dplService.js";
import { calculateNilaiEkonomi, normalizeJenisOlahan } from "./pemanfaatanService.js";
import { logbookService } from "./logbookService.js";
import { evaluateSortingStatus } from "../utils/sortingEvaluation.js";

export function normalizeProkerKategori(kategori?: string | null): string {
  if (!kategori) return "Lainnya";
  const raw = kategori.trim().toUpperCase();
  if (raw.includes("PEMILAHAN") || raw.includes("PILAH")) return "Pemilahan";
  if (raw.includes("PENGANGKUTAN") || raw.includes("ANGKUT")) return "Pengangkutan";
  if (raw.includes("PENGOLAHAN") || raw.includes("OLAH")) return "Pengolahan";
  if (raw.includes("PEMANFAATAN") || raw.includes("MANFAAT") || raw === "FISIK")
    return "Pemanfaatan";
  if (
    raw.includes("EDUKASI") ||
    raw.includes("SOSIALISASI") ||
    raw === "NON-FISIK" ||
    raw === "NON_FISIK"
  )
    return "Edukasi & Sosialisasi";
  if (raw === "LAINNYA" || raw === "OTHER") return "Lainnya";
  return kategori.trim();
}

export function isAnorganikBin(
  bin?: { category?: { name?: string | null; type?: string | null } | null; binType?: string | null; qrCode?: string | null } | null
): boolean {
  if (!bin) return false;
  const cat = (bin.category?.name || bin.category?.type || (bin as any).binType || "").toUpperCase();
  if (
    cat.includes("NON_ORGANIC") ||
    cat.includes("ANORGANIK") ||
    cat.includes("NON_ORGANIK") ||
    cat.includes("NON ORGANIK") ||
    cat.includes("INORGANIC")
  ) {
    return true;
  }
  const qr = (bin.qrCode || "").toLowerCase();
  if (
    qr.includes("anorganik") ||
    qr.includes("non_organic") ||
    qr.includes("nonorganik") ||
    qr.includes("non-organik") ||
    qr.includes("anorg")
  ) {
    return true;
  }
  return false;
}

export function isOrganikBin(
  bin?: { category?: { name?: string | null; type?: string | null } | null; binType?: string | null; qrCode?: string | null } | null
): boolean {
  if (!bin) return false;
  if (isAnorganikBin(bin)) return false;
  const cat = (bin.category?.name || bin.category?.type || (bin as any).binType || "").toUpperCase();
  if (
    cat.includes("ORGANIC") ||
    cat.includes("ORGANIK")
  ) {
    return true;
  }
  const qr = (bin.qrCode || "").toLowerCase();
  if (
    qr.includes("organik") ||
    qr.includes("organic") ||
    /(?:^|[^a-z0-9])org(?:$|[^a-z0-9])/i.test(qr) ||
    qr.startsWith("org")
  ) {
    return true;
  }
  return false;
}

export function checkClassificationMatch(
  hasilKlasifikasiAi?: string | null,
  binCategory?: { name?: string | null; type?: string | null } | null
): boolean {
  const aiType = (hasilKlasifikasiAi || "").toLowerCase().trim();
  const binType = (binCategory?.name || binCategory?.type || "").toLowerCase().trim();

  if (!binType || !aiType) {
    return true;
  }

  const isAiOrg =
    aiType.includes("organik") && !aiType.includes("anorganik") && !aiType.includes("non");
  const isAiAnorg = aiType.includes("anorganik") || aiType.includes("non");
  const isBinOrg =
    (binType.includes("organik") || binType.includes("organic")) &&
    !binType.includes("anorganik") &&
    !binType.includes("non");
  const isBinAnorg =
    binType.includes("anorganik") || binType.includes("non_organic") || binType.includes("non");

  if (isAiOrg && isBinAnorg) return false;
  if (isAiAnorg && isBinOrg) return false;
  if (isAiOrg && isBinOrg) return true;
  if (isAiAnorg && isBinAnorg) return true;

  return binType.includes(aiType) || aiType.includes(binType);
}

export class KknService {
  async getDashboardStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, rw: true },
    });

    const isSuperOrAdmin =
      user?.role?.name === "SUPER_USER" ||
      user?.role?.name === "ADMIN_DLH" ||
      user?.role?.name === "DPL" ||
      user?.role?.name === "DOSEN_PEMBIMBING" ||
      user?.role?.name === "PEMIMPIN" ||
      user?.role?.name === "PANITIA_TASKFORCE";

    let student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { assignedRw: true },
    });

    if (!student && !isSuperOrAdmin) {
      if (user) {
        student = await prisma.studentKkn.create({
          data: {
            userId,
            nim: "1012" + Math.floor(1000 + Math.random() * 9000).toString(),
            jurusan: "Teknik Lingkungan",
            fakultas: "FTSL",
            noWa: user.phone || "-",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            whitelistStatus: "APPROVED",
          },
          include: { assignedRw: true },
        });
      } else {
        throw new Error("STUDENT_NOT_FOUND");
      }
    }

    // Total registered bins
    const totalRegistered = isSuperOrAdmin
      ? await prisma.bin.count({ where: { status: "ACTIVE_BOUND" } })
      : await prisma.bin.count({
          where: {
            status: "ACTIVE_BOUND",
            qrBatch: {
              assignedPicUserId: userId,
            },
          },
        });

    const maxLimitStr = await configService.getConfig("kkn_max_assignment_per_student");
    const maxLimit = maxLimitStr ? parseInt(maxLimitStr, 10) : isSuperOrAdmin ? 500 : 100;
    const remainingQuota = Math.max(0, maxLimit - totalRegistered);
    const progressPct =
      maxLimit > 0 ? parseFloat(((totalRegistered / maxLimit) * 100).toFixed(2)) : 0;

    // Points
    const pointsSum = isSuperOrAdmin
      ? await prisma.pointHistory.aggregate({ _sum: { points: true } })
      : await prisma.pointHistory.aggregate({
          where: { userId },
          _sum: { points: true },
        });
    const contributionPoints = pointsSum._sum.points || 0;

    const poskoLat = student?.assignedRw?.latitude ? Number(student.assignedRw.latitude) : -6.8906;
    const poskoLng = student?.assignedRw?.longitude
      ? Number(student.assignedRw.longitude)
      : 107.615;

    const areaName = student?.assignedRw?.name
      ? student.assignedRw.name
      : isSuperOrAdmin
        ? "Kecamatan Coblong (Seluruh Wilayah)"
        : "Area KKN Coblong";

    return {
      studentKkn: {
        nim: student?.nim || (isSuperOrAdmin ? user?.role?.name || "SUPER ADMIN" : "10123000"),
        jurusan: student?.jurusan || (isSuperOrAdmin ? "Monitoring Terpadu" : "Teknik Lingkungan"),
        fakultas: student?.fakultas || (isSuperOrAdmin ? "Admin DLH / DPL" : "FTSL"),
        whitelistStatus: student?.whitelistStatus || "APPROVED",
        endDate: student?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedArea: areaName,
        latitude: poskoLat,
        longitude: poskoLng,
        radiusMeter: 5000,
      },
      poskoLocation: {
        name: areaName,
        latitude: poskoLat,
        longitude: poskoLng,
        radiusMeter: 5000,
      },
      stats: {
        totalRegistered: totalRegistered,
        remainingQuota,
        progressPct,
        contributionPoints,
        points: contributionPoints,
        totalPoints: contributionPoints,
        pointKkn: contributionPoints,
        maxLimit,
      },
      // Backward compatibility aliases
      nim: student?.nim || (isSuperOrAdmin ? "ADMIN" : "10123000"),
      jurusan: student?.jurusan || (isSuperOrAdmin ? "Monitoring Wilayah" : "Teknik Informatika"),
      programStudi: student?.jurusan || (isSuperOrAdmin ? "Monitoring Wilayah" : "Teknik Informatika"),
      poskoKkn: areaName,
      poskoName: areaName,
      wilayahKkn: areaName,
      totalRegisteredBins: totalRegistered,
      remainingQuota,
      progressPct,
      contributionPoints,
      points: contributionPoints,
      totalPoints: contributionPoints,
      pointKkn: contributionPoints,
      assignmentLimit: maxLimit,
      latitude: poskoLat,
      longitude: poskoLng,
      radiusMeter: 5000,
    };
  }

  async getRegisteredWarga(kknUserId: string, filters: { rwId?: number; search?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: kknUserId },
      include: { role: true },
    });

    const roleName = String(user?.role?.name || "").toUpperCase();
    const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
    const isMhs = roleName === "MAHASISWA_KKN";

    let whereBin: any = { status: "ACTIVE_BOUND" };

    if (isDpl) {
      // DPL: Ambil kelompok bimbingan DPL ini
      const dplGroups = await prisma.kelompokKkn.findMany({
        where: { OR: [{ dplId: kknUserId }, { dpl: { id: kknUserId } }] },
        include: { students: { select: { userId: true } } },
      });

      const studentUserIds = dplGroups.flatMap((g) => g.students.map((s) => s.userId));
      const groupKelurahans = dplGroups.map((g) => g.kelurahan).filter(Boolean) as string[];

      const orConditions: any[] = [];
      if (studentUserIds.length > 0) {
        orConditions.push({ registeredByStudentId: { in: studentUserIds } });
      }
      if (groupKelurahans.length > 0) {
        orConditions.push({
          rw: { kelurahan: { name: { in: groupKelurahans, mode: "insensitive" } } },
        });
      }

      if (orConditions.length > 0) {
        whereBin = {
          status: "ACTIVE_BOUND",
          OR: orConditions,
        };
      }
    } else if (isMhs) {
      // Mahasiswa KKN: Ambil dari mahasiswa sekelompok / mahasiswa ini
      const studentProfile = await prisma.studentKkn.findFirst({
        where: { userId: kknUserId },
        include: { kelompok: { include: { students: { select: { userId: true } } } } },
      });

      const groupStudentUserIds = studentProfile?.kelompok?.students.map((s) => s.userId) || [
        kknUserId,
      ];

      whereBin = {
        status: "ACTIVE_BOUND",
        OR: [
          { registeredByStudentId: { in: groupStudentUserIds } },
          { registeredByStudentId: kknUserId },
          { qrBatch: { assignedPicUserId: kknUserId } },
        ],
      };
    }

    const bins = await prisma.bin.findMany({
      where: {
        ...whereBin,
        status: { in: ["ACTIVE_BOUND", "PENDING_APPROVAL"] },
      },
      include: {
        category: true,
        rw: { include: { kelurahan: true } },
        registeredByStudent: { select: { id: true, name: true } },
        user: {
          include: {
            rw: { include: { kelurahan: true } },
            households: true,
            pointHistory: true,
            wargaViolations: true,
            setoranOtomatis: {
              orderBy: { createdAt: "desc" },
              include: {
                bin: {
                  include: { category: true },
                },
              },
            },
            binOwnerships: { include: { bin: { include: { category: true } } } },
          },
        },
      },
    });

    const uniqueUsers = new Map<string, any>();

    bins.forEach((b) => {
      if (!b.user) return;
      if (!uniqueUsers.has(b.user.id)) {
        uniqueUsers.set(b.user.id, {
          u: b.user,
          bins: [b],
        });
      } else {
        uniqueUsers.get(b.user.id).bins.push(b);
      }
    });

    let list = Array.from(uniqueUsers.values()).map(({ u, bins: userBins }) => {
      const household = u.households?.[0];
      const primaryBin = userBins[0];
      const lat = primaryBin.latitude
        ? Number(primaryBin.latitude)
        : household?.latitude
          ? Number(household.latitude)
          : u.rw?.latitude
            ? Number(u.rw.latitude)
            : -6.891234;
      const lng = primaryBin.longitude
        ? Number(primaryBin.longitude)
        : household?.longitude
          ? Number(household.longitude)
          : u.rw?.longitude
            ? Number(u.rw.longitude)
            : 107.610123;

      const setoranLogs = u.setoranOtomatis || [];
      const totalKg = setoranLogs.reduce(
        (acc: number, curr: any) => acc + Number(curr.berat || 0),
        0
      );
      const totalPoin =
        u.pointHistory?.reduce((acc: number, curr: any) => acc + Number(curr.points || 0), 0) ||
        Math.round(totalKg * 10);

      let correctCount = 0;
      let incorrectCount = 0;
      for (const log of setoranLogs) {
        const sortingStatus = evaluateSortingStatus(
          log.confidenceAi,
          log.discrepancy_status || log.discrepancyStatus,
          log.hasilKlasifikasiAi,
          log.bin?.category || primaryBin?.category
        );
        if (sortingStatus.is_correct) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
      const totalActivities = setoranLogs.length;

      const recentLogs = setoranLogs.slice(0, 5).map((log: any) => {
        const sortingStatus = evaluateSortingStatus(
          log.confidenceAi,
          log.discrepancy_status || log.discrepancyStatus,
          log.hasilKlasifikasiAi,
          log.bin?.category || primaryBin?.category
        );
        return {
          id: log.id,
          weightKg: Number(log.berat || 0),
          category:
            log.hasilKlasifikasiAi === "organik"
              ? "Organik"
              : log.bin?.category?.name || primaryBin?.category?.name || "Anorganik",
          ai_confidence: sortingStatus.ai_confidence,
          aiConfidence: sortingStatus.aiConfidence,
          discrepancy_status: sortingStatus.discrepancy_status,
          discrepancyStatus: sortingStatus.discrepancyStatus,
          is_correct: sortingStatus.is_correct,
          isCorrect: sortingStatus.isCorrect,
          createdAt: log.createdAt,
        };
      });

      const binOrganik = userBins.find((b: any) => isOrganikBin(b));
      const binAnorganik = userBins.find((b: any) => isAnorganikBin(b));
      const registeredStudentId =
        primaryBin?.registeredByStudentId ||
        primaryBin?.qrBatch?.assignedPicUserId ||
        binOrganik?.registeredByStudentId ||
        binAnorganik?.registeredByStudentId ||
        "";
      const registeredStudentName =
        primaryBin?.registeredByStudent?.name ||
        binOrganik?.registeredByStudent?.name ||
        binAnorganik?.registeredByStudent?.name ||
        "Mahasiswa KKN";

      return {
        id: u.id,
        wargaId: u.id,
        binId: primaryBin.qrCode,
        binCode: primaryBin.qrCode,
        bin: {
          qrCode: primaryBin.qrCode,
          category: primaryBin.category?.name || "UMUM",
          capacity: `${primaryBin.currentVolumeLiter || 0}L / ${primaryBin.maxCapacityLiter || 25}L`,
        },
        binOrganikId: binOrganik?.qrCode || null,
        binAnorganikId: binAnorganik?.qrCode || null,
        wargaName: u.name,
        name: u.name,
        phone: u.phone,
        address:
          u.address ||
          (u.rw?.name ? `RW ${u.rw.name}, ${u.rw.kelurahan?.name || ""}` : "Alamat tercatat"),
        latitude: lat,
        longitude: lng,
        lat: lat,
        lng: lng,
        category: primaryBin.category?.name || "Organik",
        totalKg: Math.round(totalKg * 10) / 10,
        totalPoin,
        totalPoints: totalPoin,
        totalActivities,
        totalSetoran: totalActivities,
        correctCount,
        benarCount: correctCount,
        incorrectCount,
        salahCount: incorrectCount,
        correctPercentage: totalActivities > 0 ? Math.round((correctCount / totalActivities) * 1000) / 10 : 0,
        errorPercentage: totalActivities > 0 ? Math.round((incorrectCount / totalActivities) * 1000) / 10 : 0,
        isActivated: true,
        needsReeducation: totalActivities > 0 && (correctCount / totalActivities) < 0.8,
        bins: userBins.map((b: any) => ({
          id: b.id,
          qrCode: b.qrCode,
          category: b.category?.name || "UMUM",
          capacity: `${b.currentVolumeLiter || 0}L / ${b.maxCapacityLiter || 25}L`,
        })),
        binOwnerships: u.binOwnerships || [],
        pendampingName: registeredStudentName,
        mahasiswaId: registeredStudentId,
        registeredByStudent: registeredStudentName,
        registeredByStudentName: registeredStudentName,
        registeredByStudentId: registeredStudentId,
        recentLogs,
        rwId: u.rwId,
      };
    });

    let result = list.filter((item): item is NonNullable<typeof item> => item !== null);

    if (filters.rwId) {
      result = result.filter((item) => item.rwId === filters.rwId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (item) => item.wargaName.toLowerCase().includes(s) || item.binCode.toLowerCase().includes(s)
      );
    }

    return result;
  }

  async getWargaDetail(kknUserId: string, wargaId: string) {
    if (
      !wargaId ||
      typeof wargaId !== "string" ||
      !wargaId.trim() ||
      wargaId === "undefined" ||
      wargaId === "null"
    ) {
      throw new Error("WARGA_NOT_FOUND");
    }

    const warga = (await prisma.user.findUnique({
      where: { id: wargaId.trim() },
      include: {
        role: true,
        rw: { include: { kelurahan: true } },
        households: { include: { rw: { include: { kelurahan: true } } } },
        pointHistory: true,
        bins: {
          include: { category: true, registeredByStudent: true, qrBatch: true },
        },
        setoranOtomatis: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            bin: {
              include: { category: true },
            },
          },
        },
        binOwnerships: {
          include: {
            bin: {
              include: { category: true, registeredByStudent: true, qrBatch: true },
            },
          },
        },
      },
    })) as any;

    if (!warga) {
      throw new Error("WARGA_NOT_FOUND");
    }

    const caller = await prisma.user.findUnique({
      where: { id: kknUserId },
      include: { role: true },
    });

    const isSuperOrAdmin =
      caller?.role?.name === "SUPER_USER" ||
      caller?.role?.name === "ADMIN_DLH" ||
      caller?.role?.name === "DPL" ||
      caller?.role?.name === "DOSEN_PEMBIMBING" ||
      caller?.role?.name === "PEMIMPIN" ||
      caller?.role?.name === "PANITIA_TASKFORCE";

    if (!isSuperOrAdmin) {
      const student = await prisma.studentKkn?.findUnique?.({
        where: { userId: kknUserId },
        include: {
          assignedRw: {
            include: { kelurahan: true },
          },
          kelompok: {
            include: { students: { select: { userId: true } } },
          },
          user: true,
        },
      });

      if (student) {
        const groupStudentUserIds =
          student.kelompok?.students?.map((s: any) => s.userId) || [kknUserId];

        // 1. Direct registration / ownership by student or fellow group member
        const isRegisteredByGroup =
          warga.binOwnerships?.some((bo: any) => {
            const regId = bo.bin?.registeredByStudentId;
            const picId = bo.bin?.qrBatch?.assignedPicUserId;
            return (
              regId === kknUserId ||
              groupStudentUserIds.includes(regId) ||
              picId === kknUserId
            );
          }) ||
          warga.bins?.some((b: any) => {
            const regId = b.registeredByStudentId;
            const picId = b.qrBatch?.assignedPicUserId;
            return (
              regId === kknUserId ||
              groupStudentUserIds.includes(regId) ||
              picId === kknUserId
            );
          });

        // 2. Assigned RW match
        const studentRwId = student.assignedRwId || student.user?.rwId;
        const wargaRwIds: number[] = [];
        if (warga.rwId) wargaRwIds.push(warga.rwId);
        if (warga.rw?.id) wargaRwIds.push(warga.rw.id);
        warga.households?.forEach((h: any) => {
          if (h.rwId) wargaRwIds.push(h.rwId);
          if (h.rw?.id) wargaRwIds.push(h.rw.id);
        });
        warga.binOwnerships?.forEach((bo: any) => {
          if (bo.bin?.rwId) wargaRwIds.push(bo.bin.rwId);
        });
        warga.bins?.forEach((b: any) => {
          if (b.rwId) wargaRwIds.push(b.rwId);
        });

        const wargaRwNames = [
          warga.rw?.name,
          ...(warga.households?.map((h: any) => h.rw?.name) || []),
        ].filter(Boolean);

        const isRwNumMatch =
          studentRwId != null &&
          wargaRwNames.some((name: string) => {
            const num = parseInt(name.replace(/\D/g, ""), 10);
            return !isNaN(num) && num === studentRwId;
          });

        const isRwMatch =
          (studentRwId != null && wargaRwIds.includes(studentRwId)) || isRwNumMatch;

        // 3. Kelurahan match
        const studentKelurahanName =
          student.assignedRw?.kelurahan?.name || student.kelompok?.kelurahan;

        let isKelurahanMatch = false;
        const wargaKelurahans: string[] = [];
        if (warga.rw?.kelurahan?.name) wargaKelurahans.push(warga.rw.kelurahan.name);
        warga.households?.forEach((h: any) => {
          if (h.rw?.kelurahan?.name) wargaKelurahans.push(h.rw.kelurahan.name);
        });
        warga.binOwnerships?.forEach((bo: any) => {
          if (bo.bin?.kelurahan?.name) wargaKelurahans.push(bo.bin.kelurahan.name);
        });
        warga.bins?.forEach((b: any) => {
          if (b.kelurahan?.name) wargaKelurahans.push(b.kelurahan.name);
        });

        if (studentKelurahanName) {
          const normStudentKel = studentKelurahanName.toLowerCase().trim();
          isKelurahanMatch = wargaKelurahans.some((k) =>
            k.toLowerCase().trim().includes(normStudentKel) ||
            normStudentKel.includes(k.toLowerCase().trim())
          );
        }

        // 4. Kelompok cakupan RW match
        let isCakupanRwMatch = false;
        if (student.kelompok?.cakupanRw && isKelurahanMatch) {
          try {
            const parsed =
              typeof student.kelompok.cakupanRw === "string"
                ? JSON.parse(student.kelompok.cakupanRw)
                : student.kelompok.cakupanRw;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cakupanNumbers = parsed
                .map((item: any) => parseInt(String(item).replace(/\D/g, ""), 10))
                .filter((n: number) => !isNaN(n));

              const wargaRwNumbers = wargaRwNames
                .map((n: string) => parseInt(n.replace(/\D/g, ""), 10))
                .filter((n: number) => !isNaN(n));

              isCakupanRwMatch = wargaRwNumbers.some((num: number) =>
                cakupanNumbers.includes(num)
              );
            }
          } catch {}
        }

        const wargaHasLocation =
          wargaRwIds.length > 0 || wargaRwNames.length > 0 || wargaKelurahans.length > 0;

        const hasDefinedScope =
          Boolean(studentRwId) || Boolean(studentKelurahanName) || Boolean(student.kelompokId);

        if (hasDefinedScope && wargaHasLocation) {
          const isScoped =
            isRegisteredByGroup ||
            isRwMatch ||
            (isKelurahanMatch && (!student.kelompok?.cakupanRw || isCakupanRwMatch));

          if (!isScoped) {
            throw new Error("FORBIDDEN_SCOPE");
          }
        }
      }
    }

    const household = warga.households?.[0];
    const binOwnershipBins = warga.binOwnerships?.map((bo: any) => bo.bin).filter(Boolean) || [];
    const directBins = warga.bins || [];
    const allBinsMap = new Map<string, any>();
    for (const b of [...binOwnershipBins, ...directBins]) {
      if (b && (b.id || b.qrCode)) {
        const key = b.id || b.qrCode;
        if (!allBinsMap.has(key)) {
          allBinsMap.set(key, b);
        }
      }
    }
    const allBins = Array.from(allBinsMap.values());
    const binOrganik = allBins.find((b: any) => isOrganikBin(b));
    const binAnorganik = allBins.find((b: any) => isAnorganikBin(b));
    const defaultBin = allBins[0] || null;
    const primaryBin = binOrganik || binAnorganik || defaultBin;

    const lat = household?.latitude
      ? Number(household.latitude)
      : primaryBin?.latitude
        ? Number(primaryBin.latitude)
        : warga.rw?.latitude
          ? Number(warga.rw.latitude)
          : -6.891234;
    const lng = household?.longitude
      ? Number(household.longitude)
      : primaryBin?.longitude
        ? Number(primaryBin.longitude)
        : warga.rw?.longitude
          ? Number(warga.rw.longitude)
          : 107.610123;

    // 1. Agregasi totalKg dan totalActivities
    const totalSetoranAgg = await prisma.setoranOtomatis.aggregate({
      where: { wargaId: warga.id },
      _sum: { berat: true, poin: true },
      _count: { id: true },
    });
    const totalKg = Math.round(Number(totalSetoranAgg._sum.berat || 0) * 10) / 10;
    const totalActivities = totalSetoranAgg._count.id || 0;

    const pointsSum = await prisma.pointHistory.aggregate({
      where: { userId: warga.id },
      _sum: { points: true },
    });
    const totalPoin =
      pointsSum._sum.points !== null && pointsSum._sum.points !== undefined
        ? Number(pointsSum._sum.points)
        : Math.round(totalKg * 10);

    // 2. Hitung Rasio Pemilahan Benar & Salah Secara Global
    const allLogsForCount = await prisma.setoranOtomatis.findMany({
      where: { wargaId: warga.id },
      select: {
        hasilKlasifikasiAi: true,
        confidenceAi: true,
        bin: {
          select: { category: true },
        },
      },
    });

    let correctCount = 0;
    let incorrectCount = 0;
    for (const log of allLogsForCount) {
      const sortingStatus = evaluateSortingStatus(
        log.confidenceAi,
        (log as any).discrepancy_status || (log as any).discrepancyStatus,
        log.hasilKlasifikasiAi,
        log.bin?.category || primaryBin?.category
      );
      if (sortingStatus.is_correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }

    // 3. Status Benar/Salah (discrepancyStatus, is_correct) di recentLogs
    const recentLogs =
      warga.setoranOtomatis?.map((log: any) => {
        const sortingStatus = evaluateSortingStatus(
          log.confidenceAi,
          log.discrepancy_status || log.discrepancyStatus,
          log.hasilKlasifikasiAi,
          log.bin?.category || primaryBin?.category
        );
        return {
          id: log.id,
          weightKg: Number(log.berat || 0),
          volumeLiter: 0,
          category:
            (log.hasilKlasifikasiAi || "").toLowerCase() === "organik" ? "Organik" : "Anorganik",
          ai_confidence: sortingStatus.ai_confidence,
          aiConfidence: sortingStatus.aiConfidence,
          discrepancy_status: sortingStatus.discrepancy_status,
          discrepancyStatus: sortingStatus.discrepancyStatus,
          is_correct: sortingStatus.is_correct,
          isCorrect: sortingStatus.isCorrect,
          createdAt: log.createdAt,
        };
      }) || [];

    const registeredStudent =
      primaryBin?.registeredByStudent?.name ||
      binOrganik?.registeredByStudent?.name ||
      binAnorganik?.registeredByStudent?.name ||
      "";

    const registeredStudentId =
      primaryBin?.registeredByStudentId ||
      binOrganik?.registeredByStudentId ||
      binAnorganik?.registeredByStudentId ||
      primaryBin?.qrBatch?.assignedPicUserId ||
      "";

    // 4. Return semua field di response
    return {
      wargaId: warga.id,
      id: warga.id,
      name: warga.name,
      wargaName: warga.name,
      email: warga.email,
      phone: warga.phone,
      address: warga.address?.trim() || household?.address?.trim() || "Alamat belum diisi",
      rw: warga.rw?.name || household?.rw?.name || "Belum diset",
      kelurahan: warga.rw?.kelurahan?.name || household?.rw?.kelurahan?.name || "",
      latitude: lat,
      longitude: lng,
      lat: lat,
      lng: lng,
      totalKg,
      totalPoin,
      totalPoints: totalPoin,
      totalActivities,
      totalSetoran: totalActivities,
      correctCount,
      benarCount: correctCount,
      incorrectCount,
      salahCount: incorrectCount,
      correctPercentage: totalActivities > 0 ? Math.round((correctCount / totalActivities) * 1000) / 10 : 0,
      errorPercentage: totalActivities > 0 ? Math.round((incorrectCount / totalActivities) * 1000) / 10 : 0,
      needsReeducation: totalActivities > 0 && (correctCount / totalActivities) < 0.8,
      binOrganikId: binOrganik?.qrCode || null,
      binAnorganikId: binAnorganik?.qrCode || null,
      binId: primaryBin?.qrCode || "",
      binCode: primaryBin?.qrCode || "",
      bin: primaryBin
        ? {
            qrCode: primaryBin.qrCode,
            category: primaryBin.category?.name || "UMUM",
            capacity: `${primaryBin.currentVolumeLiter || 0}L / ${primaryBin.maxCapacityLiter || 25}L`,
          }
        : null,
      bins: allBins.map((b: any) => ({
        id: b.id,
        qrCode: b.qrCode,
        category: b.category?.name || "UMUM",
        capacity: `${b.currentVolumeLiter || 0}L / ${b.maxCapacityLiter || 25}L`,
      })),
      binOwnerships: warga.binOwnerships || [],
      isActivated:
        allBins.some(
          (b: any) => b.status === "ACTIVE_BOUND" || b.status === "PENDING_APPROVAL"
        ) || allBins.length > 0,
      pendampingName: registeredStudent,
      registeredByStudent: registeredStudent,
      registeredByStudentName: registeredStudent,
      mahasiswaId: registeredStudentId,
      registeredByStudentId: registeredStudentId,
      recentLogs,
    };
  }

  async getWargaList(
    kknUserId: string,
    filters: {
      status?: string;
      kelurahan?: string;
      rwId?: number;
      rw?: string;
      search?: string;
    }
  ) {
    const caller = await prisma.user.findUnique({
      where: { id: kknUserId },
      include: { role: true },
    });

    const isSuperOrAdmin =
      caller?.role?.name === "SUPER_USER" ||
      caller?.role?.name === "ADMIN_DLH" ||
      caller?.role?.name === "DPL" ||
      caller?.role?.name === "DOSEN_PEMBIMBING" ||
      caller?.role?.name === "PEMIMPIN" ||
      caller?.role?.name === "PANITIA_TASKFORCE";

    let targetRwId: number | undefined = filters.rwId;
    let targetKelurahan: string | undefined = undefined;

    if (
      filters.kelurahan &&
      filters.kelurahan !== "ALL" &&
      filters.kelurahan !== "Semua Kelurahan" &&
      filters.kelurahan !== "Semua"
    ) {
      targetKelurahan = filters.kelurahan;
    }

    let studentAssignedRwId: number | undefined = undefined;
    let studentKelompokKelurahan: string | undefined = undefined;
    let studentGroupUserIds: string[] = [];

    if (!isSuperOrAdmin) {
      const student = await prisma.studentKkn?.findUnique?.({
        where: { userId: kknUserId },
        include: {
          assignedRw: {
            include: { kelurahan: true },
          },
          kelompok: {
            include: { students: { select: { userId: true } } },
          },
          user: true,
        },
      });

      if (student) {
        studentAssignedRwId = student.assignedRwId || student.user?.rwId;
        studentKelompokKelurahan =
          student.assignedRw?.kelurahan?.name || student.kelompok?.kelurahan;
        studentGroupUserIds =
          student.kelompok?.students?.map((s: any) => s.userId) || [kknUserId];

        // Default scoping if not explicitly filtered
        if (!targetRwId && studentAssignedRwId) {
          targetRwId = studentAssignedRwId;
        }
        if (!targetKelurahan && studentKelompokKelurahan) {
          targetKelurahan = studentKelompokKelurahan;
        }
      }
    }

    const where: any = { role: { name: "WARGA" } };

    if (targetRwId || targetKelurahan || studentGroupUserIds.length > 0) {
      const orConditions: any[] = [];
      if (targetRwId) {
        orConditions.push({ rwId: targetRwId });
        orConditions.push({ households: { some: { rwId: targetRwId } } });
        orConditions.push({ binOwnerships: { some: { bin: { rwId: targetRwId } } } });
      }
      if (targetKelurahan) {
        orConditions.push({
          households: {
            some: {
              rw: { kelurahan: { name: { contains: targetKelurahan, mode: "insensitive" } } },
            },
          },
        });
        orConditions.push({
          rw: { kelurahan: { name: { contains: targetKelurahan, mode: "insensitive" } } },
        });
        orConditions.push({
          binOwnerships: {
            some: {
              bin: {
                kelurahan: { name: { contains: targetKelurahan, mode: "insensitive" } },
              },
            },
          },
        });
      }
      if (studentGroupUserIds.length > 0) {
        orConditions.push({
          binOwnerships: {
            some: {
              bin: {
                registeredByStudentId: { in: studentGroupUserIds },
              },
            },
          },
        });
      }
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    if (filters.status === "UNACTIVATED") {
      where.binOwnerships = { none: {} };
    } else if (filters.status === "ACTIVATED") {
      where.binOwnerships = { some: { bin: { status: "ACTIVE_BOUND" } } };
    }

    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim();
      const searchCondition = [
        { name: { contains: s, mode: "insensitive" as const } },
        { phone: { contains: s, mode: "insensitive" as const } },
        { address: { contains: s, mode: "insensitive" as const } },
        {
          binOwnerships: {
            some: { bin: { qrCode: { contains: s, mode: "insensitive" as const } } },
          },
        },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const warga = await prisma.user.findMany({
      where,
      include: {
        rw: { include: { kelurahan: true } },
        households: { include: { rw: { include: { kelurahan: true } } } },
        bins: { include: { category: true, registeredByStudent: true, qrBatch: true } },
        binOwnerships: {
          include: {
            bin: {
              include: { category: true, registeredByStudent: true, qrBatch: true },
            },
          },
        },
        setoranOtomatis: {
          orderBy: { createdAt: "desc" },
          include: {
            bin: {
              include: { category: true },
            },
          },
        },
        pointHistory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return warga.map((w: any) => {
      const household = w.households?.[0];
      const kelName =
        w.rw?.kelurahan?.name || household?.rw?.kelurahan?.name || filters.kelurahan || "";
      const rtRwName = w.rw?.name || household?.rw?.name || filters.rw || "";

      const setoranLogs = w.setoranOtomatis || [];
      const totalKg = setoranLogs.reduce(
        (acc: number, curr: any) => acc + Number(curr.berat || 0),
        0
      );
      const totalPoin =
        w.pointHistory?.reduce((acc: number, curr: any) => acc + Number(curr.points || 0), 0) ||
        Math.round(totalKg * 10);

      const binOwnershipBins = w.binOwnerships?.map((bo: any) => bo.bin).filter(Boolean) || [];
      const directBins = w.bins || [];
      const allBinsMap = new Map<string, any>();
      for (const b of [...binOwnershipBins, ...directBins]) {
        if (b && (b.id || b.qrCode)) {
          const key = b.id || b.qrCode;
          if (!allBinsMap.has(key)) {
            allBinsMap.set(key, b);
          }
        }
      }
      const allBins = Array.from(allBinsMap.values());
      const binOrganik = allBins.find((b: any) => isOrganikBin(b));
      const binAnorganik = allBins.find((b: any) => isAnorganikBin(b));
      const defaultBin = allBins[0] || null;
      const primaryBin = binOrganik || binAnorganik || defaultBin;

      let correctCount = 0;
      let incorrectCount = 0;
      for (const log of setoranLogs) {
        const sortingStatus = evaluateSortingStatus(
          log.confidenceAi,
          log.discrepancy_status || log.discrepancyStatus,
          log.hasilKlasifikasiAi,
          log.bin?.category || primaryBin?.category
        );
        if (sortingStatus.is_correct) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
      const totalActivities = setoranLogs.length;

      const recentLogs = setoranLogs.slice(0, 5).map((log: any) => {
        const sortingStatus = evaluateSortingStatus(
          log.confidenceAi,
          log.discrepancy_status || log.discrepancyStatus,
          log.hasilKlasifikasiAi,
          log.bin?.category || primaryBin?.category
        );
        return {
          id: log.id,
          date: new Date(log.createdAt).toISOString().split("T")[0],
          wasteType:
            (log.hasilKlasifikasiAi || "").toLowerCase() === "organik" ? "Organik" : "Anorganik",
          weightKg: Number(log.berat || 0),
          ai_confidence: sortingStatus.ai_confidence,
          aiConfidence: sortingStatus.aiConfidence,
          discrepancy_status: sortingStatus.discrepancy_status,
          discrepancyStatus: sortingStatus.discrepancyStatus,
          is_correct: sortingStatus.is_correct,
          isCorrect: sortingStatus.isCorrect,
          createdAt: log.createdAt,
        };
      });

      const registeredStudentId =
        primaryBin?.registeredByStudentId ||
        primaryBin?.qrBatch?.assignedPicUserId ||
        binOrganik?.registeredByStudentId ||
        binAnorganik?.registeredByStudentId ||
        null;
      const registeredStudentName =
        primaryBin?.registeredByStudent?.name ||
        binOrganik?.registeredByStudent?.name ||
        binAnorganik?.registeredByStudent?.name ||
        "Mahasiswa KKN";

      const isActivated =
        allBins.some(
          (b: any) => b.status === "ACTIVE_BOUND" || b.status === "PENDING_APPROVAL"
        ) || allBins.length > 0;

      const lat = household?.latitude
        ? Number(household.latitude)
        : primaryBin?.latitude
          ? Number(primaryBin.latitude)
          : w.rw?.latitude
            ? Number(w.rw.latitude)
            : -6.891234;
      const lng = household?.longitude
        ? Number(household.longitude)
        : primaryBin?.longitude
          ? Number(primaryBin.longitude)
          : w.rw?.longitude
            ? Number(w.rw.longitude)
            : 107.610123;

      return {
        id: w.id,
        wargaId: w.id,
        name: w.name,
        wargaName: w.name,
        phone: w.phone,
        address:
          w.address?.trim() ||
          household?.address?.trim() ||
          (rtRwName ? `RT ${rtRwName}, Kel. ${kelName}` : "Alamat belum diisi"),
        kelurahan: kelName,
        rw: rtRwName,
        role: "WARGA",
        latitude: lat,
        longitude: lng,
        lat: lat,
        lng: lng,
        totalKg: Math.round(totalKg * 10) / 10,
        totalPoin,
        totalPoints: totalPoin,
        totalActivities,
        totalSetoran: totalActivities,
        correctCount,
        benarCount: correctCount,
        incorrectCount,
        salahCount: incorrectCount,
        correctPercentage:
          totalActivities > 0 ? Math.round((correctCount / totalActivities) * 1000) / 10 : 0,
        errorPercentage:
          totalActivities > 0 ? Math.round((incorrectCount / totalActivities) * 1000) / 10 : 0,
        isActivated,
        needsReeducation: totalActivities > 0 && correctCount / totalActivities < 0.8,
        mahasiswaId: registeredStudentId || "",
        pendampingName: registeredStudentName,
        registeredByStudent: registeredStudentName,
        registeredByStudentName: registeredStudentName,
        binOrganikId: binOrganik?.qrCode || null,
        binAnorganikId: binAnorganik?.qrCode || null,
        binId: primaryBin?.qrCode || binOrganik?.qrCode || binAnorganik?.qrCode || "",
        binCode: primaryBin?.qrCode || binOrganik?.qrCode || binAnorganik?.qrCode || "",
        bin: primaryBin
          ? {
              qrCode: primaryBin.qrCode,
              category: primaryBin.category?.name || "UMUM",
              capacity: `${primaryBin.currentVolumeLiter || 0}L / ${primaryBin.maxCapacityLiter || 25}L`,
            }
          : null,
        bins: allBins.map((b: any) => ({
          id: b.id,
          qrCode: b.qrCode,
          category: b.category?.name || "UMUM",
          capacity: `${b.currentVolumeLiter || 0}L / ${b.maxCapacityLiter || 25}L`,
        })),
        binOwnerships: w.binOwnerships || [],
        recentLogs,
      };
    });
  }

  private async resolveWargaUser(tx: any, inputWargaId: string) {
    if (!inputWargaId) {
      throw new Error("Field wargaId wajib diisi");
    }
    let targetUser = await tx.user.findUnique({ where: { id: inputWargaId } });
    if (targetUser) return targetUser;

    const hh = await tx.household.findUnique({ where: { id: inputWargaId } });
    if (hh?.userId) {
      targetUser = await tx.user.findUnique({ where: { id: hh.userId } });
      if (targetUser) return targetUser;
    }

    targetUser = await tx.user.findFirst({
      where: {
        OR: [{ phone: inputWargaId }, { phone: formatPhoneNumber(inputWargaId) }],
      },
    });
    if (targetUser) return targetUser;

    throw new Error(
      `Pengguna Warga dengan ID/Nomor '${inputWargaId}' tidak ditemukan di sistem. Silakan pastikan Warga sudah terdaftar.`
    );
  }

  async activateByScan(
    wargaIdInput: string,
    qrCode: string,
    latitude?: number,
    longitude?: number,
    kknUserId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const targetWarga = await this.resolveWargaUser(tx, wargaIdInput);
      const wargaId = targetWarga.id;

      let bin = await tx.bin.findUnique({ where: { qrCode } });

      if (!bin) {
        let category = await tx.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
        if (!category) category = await tx.wasteCategory.findFirst();

        bin = await tx.bin.create({
          data: {
            qrCode,
            status: "ACTIVE_BOUND",
            categoryId: category?.id,
            userId: wargaId,
            registeredByStudentId: kknUserId,
          },
        });
      } else {
        // Guard: reject if bin already owned by a different warga
        if (
          bin.userId &&
          bin.userId !== wargaId &&
          ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(bin.status)
        ) {
          throw new Error(
            "Tempat sampah ini sudah dimiliki oleh warga lain dan tidak bisa diklaim ulang."
          );
        }

        await tx.bin.update({
          where: { id: bin.id },
          data: {
            userId: wargaId,
            status: "ACTIVE_BOUND",
            registeredByStudentId: kknUserId,
          },
        });
      }

      const existingOwnership = await tx.binOwnership.findFirst({
        where: { binId: bin.id, userId: wargaId },
      });

      if (!existingOwnership) {
        await tx.binOwnership.create({
          data: { userId: wargaId, binId: bin.id, type: "UTAMA" },
        });
      }

      const existingHh = await tx.household.findFirst({ where: { userId: wargaId } });
      if (!existingHh) {
        let assignedRwId = targetWarga.rwId;
        if (!assignedRwId && kknUserId) {
          const student = await tx.studentKkn.findUnique({
            where: { userId: kknUserId },
            select: { assignedRwId: true, user: { select: { rwId: true } } },
          });
          assignedRwId = student?.assignedRwId || student?.user?.rwId;
        }
        if (!assignedRwId) {
          const firstRw = await tx.rw.findFirst({ select: { id: true } });
          assignedRwId = firstRw?.id || 1;
        }
        await tx.household.create({
          data: {
            userId: wargaId,
            address: targetWarga.address || "Bandung, Jawa Barat",
            rwId: assignedRwId,
            latitude: latitude ?? -6.8903,
            longitude: longitude ?? 107.611,
          },
        });
      } else if (latitude != null && longitude != null) {
        await tx.household.updateMany({
          where: { userId: wargaId },
          data: { latitude, longitude },
        });
      }

      if (kknUserId) {
        await tx.pointHistory.create({
          data: {
            userId: kknUserId,
            points: 10,
            description: `Aktivasi QR ${qrCode} Warga via Scan`,
          },
        });
      }

      return bin;
    });
  }

  async activateWargaBin(
    wargaIdInput: string,
    binOrganikId: string,
    binAnorganikId: string,
    latitude?: number,
    longitude?: number,
    kknUserId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const targetWarga = await this.resolveWargaUser(tx, wargaIdInput);
      const wargaId = targetWarga.id;

      const bins = await tx.bin.findMany({
        where: {
          OR: [
            { qrCode: { in: [binOrganikId, binAnorganikId] } },
            { id: { in: [binOrganikId, binAnorganikId] } },
          ],
        },
      });

      if (bins.length < 2) {
        const found = bins.map((b) => b.qrCode).concat(bins.map((b) => b.id));
        const missing = [binOrganikId, binAnorganikId].filter((x) => !found.includes(x));

        for (const mCode of missing) {
          const lower = mCode.toLowerCase();
          const isAnorg =
            lower.includes("anorganik") ||
            lower.includes("non_organic") ||
            lower.includes("anorg") ||
            lower.includes("ano") ||
            lower.includes("agn") ||
            lower.includes("ang") ||
            lower.includes("non") ||
            lower.includes("2");
          const isOrg =
            !isAnorg &&
            (lower.includes("organik") ||
              lower.includes("org") ||
              lower.includes("ogn") ||
              lower.includes("1"));
          let category = await tx.wasteCategory.findFirst({
            where: { name: isOrg ? "ORGANIC" : "NON_ORGANIC" },
          });
          if (!category) category = await tx.wasteCategory.findFirst();

          const newBin = await tx.bin.create({
            data: {
              qrCode: mCode.startsWith("TS-") || mCode.startsWith("BSK-") ? mCode : `TS-${mCode}`,
              status: "ACTIVE_BOUND",
              categoryId: category?.id,
              userId: wargaId,
              registeredByStudentId: kknUserId,
            },
          });
          bins.push(newBin);
        }
      }

      for (const bin of bins) {
        // Guard: reject if bin already owned by a different warga
        if (
          bin.userId &&
          bin.userId !== wargaId &&
          ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(bin.status)
        ) {
          throw new Error(
            `Tempat sampah ${bin.qrCode} sudah dimiliki oleh warga lain dan tidak bisa diklaim ulang.`
          );
        }

        await tx.bin.update({
          where: { id: bin.id },
          data: { userId: wargaId, status: "ACTIVE_BOUND", registeredByStudentId: kknUserId },
        });

        const existingOwnership = await tx.binOwnership.findFirst({
          where: { binId: bin.id, userId: wargaId },
        });
        if (!existingOwnership) {
          await tx.binOwnership.create({
            data: { userId: wargaId, binId: bin.id, type: "UTAMA" },
          });
        }
      }

      const existingHh = await tx.household.findFirst({ where: { userId: wargaId } });
      if (!existingHh) {
        let assignedRwId = targetWarga.rwId;
        if (!assignedRwId && kknUserId) {
          const student = await tx.studentKkn.findUnique({
            where: { userId: kknUserId },
            select: { assignedRwId: true, user: { select: { rwId: true } } },
          });
          assignedRwId = student?.assignedRwId || student?.user?.rwId;
        }
        if (!assignedRwId) {
          const firstRw = await tx.rw.findFirst({ select: { id: true } });
          assignedRwId = firstRw?.id || 1;
        }
        await tx.household.create({
          data: {
            userId: wargaId,
            address: targetWarga.address || "Bandung, Jawa Barat",
            rwId: assignedRwId,
            latitude: latitude ?? -6.8903,
            longitude: longitude ?? 107.611,
          },
        });
      } else if (latitude != null && longitude != null) {
        await tx.household.updateMany({
          where: { userId: wargaId },
          data: { latitude, longitude },
        });
      }

      if (kknUserId) {
        await tx.pointHistory.create({
          data: {
            userId: kknUserId,
            points: 10,
            description: "Aktivasi Bin Warga (Organik & Anorganik)",
          },
        });
      }
      await tx.pointHistory.create({
        data: { userId: wargaId, points: 10, description: "Mendapatkan 2 Tempat Sampah" },
      });
    });
  }

  async getActivityLog(kknUserId: string) {
    const auditLogs = await prisma.auditTrail.findMany({
      where: {
        userId: kknUserId,
        action: "REQUEST_ACTIVATE_BIN",
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const pointLogs = await prisma.pointHistory.findMany({
      where: {
        userId: kknUserId,
        description: { contains: "Laporan" },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const combined = [
      ...auditLogs.map((log: any) => ({
        id: log.id,
        title: "Aktivasi Tempat Sampah Warga",
        subtitle: (log.newValue as any)?.details || "Mengajukan aktivasi",
        timestamp: log.timestamp,
        type: "aktivasi",
        points: null,
      })),
      ...pointLogs.map((log) => ({
        id: log.id,
        title: log.description,
        subtitle: `Mendapatkan +${log.points} poin`,
        timestamp: log.createdAt,
        type: "laporan",
        points: log.points,
      })),
    ];

    combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return combined.slice(0, 20);
  }

  async handover(fromKknUserId: string, toKknUserId: string, rwId: number, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const batches = await tx.qrBatch.findMany({
        where: { assignedPicUserId: fromKknUserId },
      });

      for (const batch of batches) {
        await tx.qrBatch.update({
          where: { id: batch.id },
          data: { assignedPicUserId: toKknUserId },
        });
      }

      const handover = await tx.kknHandoverHistory.create({
        data: {
          fromUserId: fromKknUserId,
          toUserId: toKknUserId,
          rwId,
          notes,
        },
      });

      return handover;
    });
  }

  async bantuInputFasilitas(
    kknUserId: string,
    data: {
      userId?: string;
      pic?: string;
      kontak?: string;
      rwId?: any;
      nama: string;
      jenis: any;
      longitude: number;
      latitude: number;
      foto?: string;
      kapasitas?: number;
      alamat?: string;
    }
  ) {
    if (!data.nama || !data.jenis) {
      throw new Error("Nama dan jenis fasilitas wajib diisi");
    }

    const student = await prisma.studentKkn.findUnique({
      where: { userId: kknUserId },
      include: { kelompok: true, user: true, assignedRw: true },
    });

    let wargaUser: any = null;
    if (data.userId) {
      wargaUser = await prisma.user.findUnique({
        where: { id: data.userId },
        include: { rw: true },
      });
    }

    // Smart RW Resolver
    let targetRwId: number | null = null;
    if (data.rwId != null) {
      const rawRw = String(data.rwId).trim();
      const numRw = parseInt(rawRw.replace(/\D/g, ""), 10);

      if (!isNaN(numRw) && numRw > 0) {
        const directRw = await prisma.rw.findUnique({ where: { id: numRw } });
        if (directRw) {
          targetRwId = directRw.id;
        } else {
          const padStr = numRw.toString().padStart(2, "0");
          const matchedRw = await prisma.rw.findFirst({
            where: {
              OR: [
                { name: { equals: `RW ${padStr}`, mode: "insensitive" } },
                { name: { equals: `RW ${numRw}`, mode: "insensitive" } },
                { name: { contains: `RW ${padStr}`, mode: "insensitive" } },
              ],
            },
          });
          if (matchedRw) targetRwId = matchedRw.id;
        }
      }
    }

    // Fallback: Warga's RW or Student's RW
    if (!targetRwId && wargaUser?.rwId) {
      targetRwId = wargaUser.rwId;
    }
    if (!targetRwId && student?.assignedRwId) {
      targetRwId = student.assignedRwId;
    }
    if (!targetRwId && student?.user?.rwId) {
      targetRwId = student.user.rwId;
    }
    if (!targetRwId && student?.kelompok?.cakupanRw) {
      try {
        const parsed =
          typeof student.kelompok.cakupanRw === "string"
            ? JSON.parse(student.kelompok.cakupanRw)
            : student.kelompok.cakupanRw;
        if (Array.isArray(parsed) && parsed.length > 0) targetRwId = Number(parsed[0]);
      } catch {}
    }
    if (!targetRwId) {
      const firstRw = await prisma.rw.findFirst();
      targetRwId = firstRw?.id || 1;
    }

    // Prioritaskan nama PIC warga yang diinput langsung atau dari profil warga binaan
    let picName = (data.pic || "").trim();
    if (!picName && wargaUser?.name) {
      picName = wargaUser.name;
    } else if (
      !picName &&
      data.userId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.userId.trim())
    ) {
      picName = data.userId.trim();
    }

    let kontakPhone = (data.kontak || "").trim();
    if (!kontakPhone || kontakPhone === "-") {
      kontakPhone = wargaUser ? wargaUser.phone || "-" : "-";
    }

    const alamatLokasi = data.alamat || (wargaUser ? wargaUser.address || "-" : "-");

    // Jika picName masih berupa string UUID (legacy), lookup ke nama user warga
    if (
      picName &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(picName)
    ) {
      const u = await prisma.user.findUnique({
        where: { id: picName },
        select: { name: true, phone: true },
      });
      if (u?.name) {
        picName = u.name;
        if ((!kontakPhone || kontakPhone === "-") && u.phone) kontakPhone = u.phone;
      } else {
        picName = "Warga Pengelola";
      }
    }

    if (!picName) {
      picName = "Warga Pengelola";
    }

    const facility = await prisma.facility.create({
      data: {
        nama: data.nama,
        jenis: data.jenis,
        pic: picName,
        kontak: kontakPhone,
        alamat: alamatLokasi,
        kapasitas: data.kapasitas != null ? data.kapasitas : null,
        latitude: data.latitude,
        longitude: data.longitude,
        rwId: targetRwId,
        kelompokId: student?.kelompokId || null,
        foto: data.foto || null,
        statusApproval: "APPROVED",
        registeredByUserId: kknUserId,
      },
    });

    await prisma.pointHistory.create({
      data: {
        userId: kknUserId,
        points: 5,
        description: `Bantu warga input fasilitas GIS: ${data.nama}`,
        kategori: "PARTISIPASI_STREAK",
      },
    });

    return facility;
  }

  async claimQr(kknUserId: string, qrCode: string, latitude?: number, longitude?: number) {
    let bin = await prisma.bin.findUnique({ where: { qrCode } });

    if (!bin) {
      let category = await prisma.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
      if (!category) category = await prisma.wasteCategory.findFirst();

      bin = await prisma.bin.create({
        data: {
          qrCode,
          status: "ASSIGNED_TO_PIC",
          categoryId: category?.id,
          registeredByStudentId: kknUserId,
        },
      });
    } else {
      bin = await prisma.bin.update({
        where: { id: bin.id },
        data: {
          status: "ASSIGNED_TO_PIC",
          registeredByStudentId: kknUserId,
        },
      });
    }

    await prisma.auditTrail.create({
      data: {
        userId: kknUserId,
        action: "CLAIM_QR_BIN",
        newValue: { details: `Scan & Klaim QR ${qrCode} at lat:${latitude}, lon:${longitude}` },
      },
    });

    return bin;
  }

  async registerWarga(kknUserId: string, data: any) {
    return prisma.$transaction(async (tx) => {
      let role = await tx.role.findFirst({ where: { name: "WARGA" } });
      let warga = await tx.user.findFirst({
        where: {
          phone: data.phone || "non-existent-phone",
        },
      });

      // Auto-resolve rtRwId from input RW string or KKN student's assigned area
      let resolvedRwId: number | undefined = data.rwId ? Number(data.rwId) : undefined;

      if (!resolvedRwId && (data.rw || data.rwNumber || data.lokasiRw)) {
        const rawRwStr = String(data.rw || data.rwNumber || data.lokasiRw);
        const rwDigits = rawRwStr.match(/\d+/);
        if (rwDigits) {
          const rwPadded = rwDigits[0].padStart(2, "0");
          const matchedArea = await tx.rw.findFirst({
            where: {
              name: { contains: rwPadded },
            },
          });
          if (matchedArea) {
            resolvedRwId = matchedArea.id;
          }
        }
      }

      if (!resolvedRwId && kknUserId) {
        const student = await tx.studentKkn.findUnique({
          where: { userId: kknUserId },
          include: { user: true },
        });
        resolvedRwId = student?.assignedRwId || student?.user?.rwId || undefined;
      }

      if (!warga) {
        warga = await tx.user.create({
          data: {
            name: data.name || data.wargaName || "Warga Binaan KKN",
            phone: data.phone || `08${Math.floor(100000000 + Math.random() * 900000000)}`,
            password: data.password || "password123",
            address: data.address || "-",
            rwId: resolvedRwId,
            roleId: role ? role.id : 1,
            status: "Aktif",
          },
        });
      } else if (resolvedRwId && !warga.rwId) {
        warga = await tx.user.update({
          where: { id: warga.id },
          data: { rwId: resolvedRwId },
        });
      }

      // Extract coordinates from GPS payload
      const latVal =
        data.latitude !== undefined && data.latitude !== null
          ? Number(data.latitude)
          : data.lat !== undefined && data.lat !== null
            ? Number(data.lat)
            : -6.8903;
      const lngVal =
        data.longitude !== undefined && data.longitude !== null
          ? Number(data.longitude)
          : data.lng !== undefined && data.lng !== null
            ? Number(data.lng)
            : data.lon !== undefined && data.lon !== null
              ? Number(data.lon)
              : 107.611;

      let household = await tx.household.findFirst({ where: { userId: warga.id } });
      if (!household) {
        household = await tx.household.create({
          data: {
            userId: warga.id,
            address: data.address || warga.address || "Bandung, Jawa Barat",
            rwId: resolvedRwId || 1,
            latitude: latVal,
            longitude: lngVal,
          },
        });
      } else {
        household = await tx.household.update({
          where: { id: household.id },
          data: {
            latitude: latVal,
            longitude: lngVal,
            address: data.address || household.address,
            rwId: resolvedRwId || household.rwId,
          },
        });
      }

      const qrCodes = [
        data.binQrCode,
        data.binQrCodeOrganic,
        data.binQrCodeInorganic,
        ...(Array.isArray(data.qrCodes) ? data.qrCodes : []),
      ].filter(Boolean);

      for (const qr of qrCodes) {
        let bin = await tx.bin.findUnique({ where: { qrCode: qr } });
        const maxCapacityLiter = data.maxCapacityLiter ? Number(data.maxCapacityLiter) : 50;

        const qrLower = qr.toLowerCase();
        const isAnorg =
          qrLower.includes("anorganik") ||
          qrLower.includes("non_organic") ||
          qrLower.includes("anorg") ||
          qrLower.includes("ano") ||
          qrLower.includes("agn") ||
          qrLower.includes("ang") ||
          qrLower.includes("non") ||
          qrLower.includes("2");
        const categoryTarget = isAnorg ? "NON_ORGANIC" : "ORGANIC";

        if (!bin) {
          let category = await tx.wasteCategory.findFirst({ where: { name: categoryTarget } });
          if (!category) category = await tx.wasteCategory.findFirst();

          bin = await tx.bin.create({
            data: {
              qrCode: qr,
              status: "ACTIVE_BOUND",
              categoryId: category?.id,
              userId: warga.id,
              rwId: resolvedRwId || household.rwId,
              latitude: latVal,
              longitude: lngVal,
              maxCapacityLiter,
              registeredByStudentId: kknUserId,
            },
          });
        } else {
          // Guard: reject if bin already owned by a different warga
          if (
            bin.userId &&
            bin.userId !== warga.id &&
            ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(bin.status)
          ) {
            throw new Error(
              `Tempat sampah ${bin.qrCode} sudah dimiliki oleh warga lain dan tidak bisa diklaim ulang.`
            );
          }

          bin = await tx.bin.update({
            where: { id: bin.id },
            data: {
              userId: warga.id,
              rwId: resolvedRwId || household.rwId,
              latitude: latVal,
              longitude: lngVal,
              status: "ACTIVE_BOUND",
              maxCapacityLiter,
              registeredByStudentId: kknUserId,
            },
          });
        }

        const existingOwnership = await tx.binOwnership.findFirst({
          where: { binId: bin.id, userId: warga.id },
        });
        if (!existingOwnership) {
          await tx.binOwnership.create({
            data: { userId: warga.id, binId: bin.id, type: "UTAMA" },
          });
        }
      }

      await tx.pointHistory.create({
        data: {
          userId: kknUserId,
          points: 10,
          description: `Pendampingan Registrasi Warga (${warga.name})`,
        },
      });

      await tx.pointHistory.create({
        data: {
          userId: warga.id,
          points: 10,
          description: `Bonus Registrasi Tempat Sampah`,
        },
      });

      return { warga, qrCodes };
    });
  }

  private async resolveKelompokRwId(
    kelompok?: { id?: string; name?: string; kelurahan?: string | null; cakupanRw?: any } | null,
    preferredRwId?: number
  ): Promise<number> {
    if (preferredRwId && !isNaN(Number(preferredRwId))) {
      const found = await prisma.rw.findUnique({ where: { id: Number(preferredRwId) } });
      if (found) return found.id;
    }

    const kelName = kelompok?.kelurahan || "Dago";
    let rwNum = "01";

    if (kelompok?.cakupanRw) {
      try {
        const parsed =
          typeof kelompok.cakupanRw === "string"
            ? JSON.parse(kelompok.cakupanRw)
            : kelompok.cakupanRw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          rwNum = String(parsed[0]).padStart(2, "0");
        } else if (typeof parsed === "number" || typeof parsed === "string") {
          rwNum = String(parsed).padStart(2, "0");
        }
      } catch {}
    }

    const matchingRw = await prisma.rw.findFirst({
      where: {
        kelurahan: { name: { equals: kelName, mode: "insensitive" } },
        OR: [
          { name: { contains: `RW ${rwNum}`, mode: "insensitive" } },
          { name: { contains: `RW ${parseInt(rwNum, 10)}`, mode: "insensitive" } },
          { name: { contains: rwNum, mode: "insensitive" } },
        ],
      },
    });

    if (matchingRw) return matchingRw.id;

    const firstKelRw = await prisma.rw.findFirst({
      where: { kelurahan: { name: { equals: kelName, mode: "insensitive" } } },
    });

    if (firstKelRw) return firstKelRw.id;

    const anyRw = await prisma.rw.findFirst();
    return anyRw?.id || 1;
  }

  async registerPoskoKkn(
    userId: string,
    payload: {
      nama?: string;
      alamat?: string;
      rwId?: number;
      latitude: number;
      longitude: number;
      radius?: number;
      foto?: string;
    }
  ) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        user: true,
        assignedRw: true,
        kelompok: {
          include: {
            dpl: true,
            students: { include: { user: true } },
          },
        },
      },
    });

    if (!student || !student.kelompokId || !student.kelompok) {
      throw new Error("Mahasiswa belum terdaftar dalam kelompok KKN.");
    }

    const lat = Number(payload.latitude);
    const lng = Number(payload.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      throw new Error(
        "Koordinat GPS lokasi HP (latitude & longitude) wajib valid dan tidak boleh kosong."
      );
    }

    const poskoName = payload.nama || `Posko KKN ${student.kelompok.name}`;
    const { poskoKknService } = await import("./poskoKknService.js");
    const posko = await poskoKknService.upsertPosko(student.kelompokId, {
      nama: poskoName,
      alamat: payload.alamat || "-",
      latitude: lat,
      longitude: lng,
      radius: payload.radius != null ? Number(payload.radius) : 500,
      fotoUrl: payload.foto,
    });

    await prisma.auditTrail.create({
      data: {
        userId,
        action: "REGISTER_POSKO_KKN",
        newValue: {
          poskoId: posko.id,
          kelompokId: student.kelompokId,
          latitude: lat,
          longitude: lng,
          radius: Number((posko as any).radius) || 500,
          status: "APPROVED",
        },
      },
    });

    return posko;
  }

  async updatePoskoKkn(
    userId: string,
    payload: {
      nama?: string;
      alamat?: string;
      rwId?: number;
      latitude?: number;
      longitude?: number;
      radius?: number;
      foto?: string;
    }
  ) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        user: true,
        assignedRw: true,
        kelompok: {
          include: {
            dpl: true,
            students: { include: { user: true } },
          },
        },
      },
    });

    if (!student || !student.kelompokId || !student.kelompok) {
      const err: any = new Error("Mahasiswa belum terdaftar dalam kelompok KKN.");
      err.statusCode = 404;
      throw err;
    }

    const existingPosko = await prisma.poskoKkn.findUnique({
      where: { kelompokId: student.kelompokId },
    });

    const lat =
      payload.latitude !== undefined &&
      !isNaN(Number(payload.latitude)) &&
      Number(payload.latitude) !== 0
        ? Number(payload.latitude)
        : Number(existingPosko?.latitude || 0);
    const lng =
      payload.longitude !== undefined &&
      !isNaN(Number(payload.longitude)) &&
      Number(payload.longitude) !== 0
        ? Number(payload.longitude)
        : Number(existingPosko?.longitude || 0);

    const poskoName = payload.nama || existingPosko?.nama || `Posko KKN ${student.kelompok.name}`;
    const { poskoKknService } = await import("./poskoKknService.js");
    const parsedRadius =
      payload.radius !== undefined
        ? Number(payload.radius)
        : Number((existingPosko as any)?.radius) || 500;
    const posko = await poskoKknService.upsertPosko(student.kelompokId, {
      nama: poskoName,
      alamat: payload.alamat !== undefined ? payload.alamat : existingPosko?.alamat || "-",
      latitude: lat,
      longitude: lng,
      radius: parsedRadius,
      fotoUrl:
        payload.foto !== undefined && payload.foto !== ""
          ? payload.foto
          : existingPosko?.fotoUrl || undefined,
    });

    await prisma.auditTrail.create({
      data: {
        userId,
        action: "UPDATE_POSKO_KKN",
        oldValue: {
          poskoId: existingPosko?.id,
          latitude: existingPosko?.latitude ? Number(existingPosko.latitude) : null,
          longitude: existingPosko?.longitude ? Number(existingPosko.longitude) : null,
          nama: existingPosko?.nama,
          alamat: existingPosko?.alamat,
          radius: Number((existingPosko as any)?.radius) || 500,
        },
        newValue: {
          poskoId: posko.id,
          kelompokId: student.kelompokId,
          latitude: lat,
          longitude: lng,
          radius: Number((posko as any).radius) || 500,
          nama: posko.nama,
          alamat: posko.alamat,
          status: "APPROVED",
        },
      },
    });

    return posko;
  }

  async getMyPosko(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { kelompok: true, user: true },
    });

    if (!student || !student.kelompokId) {
      return null;
    }

    const posko = await prisma.poskoKkn.findUnique({
      where: { kelompokId: student.kelompokId },
      include: {
        kelompok: {
          include: {
            dpl: true,
            facilities: {
              where: { jenis: "posko_kkn" },
              select: { id: true, foto: true },
            },
          },
        },
      },
    });

    if (posko && !posko.fotoUrl) {
      const facilityPosko =
        (posko.kelompok as any)?.facilities?.find((f: any) => f.foto) ||
        (posko.kelompok as any)?.facilities?.[0];
      if (facilityPosko?.foto) {
        posko.fotoUrl = facilityPosko.foto;
      }
    }

    return {
      posko,
      isUserLeader: Boolean(student.isKetua),
      kelompokId: student.kelompokId,
    };
  }

  async getAllPoskoKkn(filters?: {
    kelurahan?: string;
    search?: string;
    userId?: string;
    role?: string;
  }) {
    let where: any = {};

    if (filters?.userId && filters?.role) {
      const normalizedRole = String(filters.role).toUpperCase();
      const isAdmin = [
        "DEVELOPER",
        "ADMIN_DLH",
        "DLH",
        "DLH_ADMIN",
        "SUPER_USER",
        "ADMIN",
        "PANITIA_TASKFORCE",
        "PEMIMPIN",
      ].some((r) => normalizedRole.includes(r));
      if (!isAdmin) {
        if (normalizedRole.includes("MAHASISWA")) {
          where.kelompok = { students: { some: { userId: filters.userId } } };
        } else if (normalizedRole.includes("DPL") || normalizedRole.includes("DOSEN")) {
          const userDpl = await prisma.user.findUnique({
            where: { id: filters.userId },
            select: { id: true, name: true, nip: true },
          });
          const orConditions: any[] = [
            { kelompok: { dplId: filters.userId } },
            { kelompok: { dpl: { id: filters.userId } } },
          ];
          if (userDpl?.name) {
            orConditions.push({
              kelompok: { dplNamaMentah: { equals: userDpl.name.trim(), mode: "insensitive" } },
            });
            orConditions.push({
              kelompok: { dpl: { name: { equals: userDpl.name.trim(), mode: "insensitive" } } },
            });
          }
          if (userDpl?.nip) {
            orConditions.push({ kelompok: { dpl: { nip: userDpl.nip } } });
          }
          where.OR = orConditions;
        } else if (normalizedRole.includes("RW")) {
          const userRw = await prisma.user.findUnique({
            where: { id: filters.userId },
            select: { rwId: true },
          });
          if (userRw?.rwId) {
            const rwData = await prisma.rw.findUnique({
              where: { id: userRw.rwId },
              include: { kelurahan: true },
            });
            if (rwData?.kelurahan?.name) {
              where.kelompok = {
                kelurahan: { equals: rwData.kelurahan.name, mode: "insensitive" },
              };
            }
          }
        }
      }
    }

    if (filters?.kelurahan && filters.kelurahan !== "ALL") {
      const cleanKel = filters.kelurahan.replace(/^(kelurahan|kel\.)\s*/i, "").trim();
      where.kelompok = {
        ...where.kelompok,
        kelurahan: { contains: cleanKel, mode: "insensitive" },
      };
    }

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      const searchOr = [
        { nama: { contains: s, mode: "insensitive" } },
        { alamat: { contains: s, mode: "insensitive" } },
        { kelompok: { name: { contains: s, mode: "insensitive" } } },
        { kelompok: { kelurahan: { contains: s, mode: "insensitive" } } },
        { kelompok: { dpl: { name: { contains: s, mode: "insensitive" } } } },
        {
          kelompok: {
            students: { some: { user: { name: { contains: s, mode: "insensitive" } } } },
          },
        },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    const poskos = await prisma.poskoKkn.findMany({
      where,
      include: {
        kelompok: {
          include: {
            dpl: { select: { id: true, name: true, phone: true, nip: true } },
            facilities: {
              where: { jenis: "posko_kkn" },
              select: { id: true, foto: true, pic: true, kontak: true, alamat: true },
            },
            students: {
              include: {
                user: { select: { id: true, name: true, phone: true, rwId: true } },
                assignedRw: { include: { kelurahan: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = poskos.map((p) => {
      const pAny = p as any;
      const ketua = p.kelompok?.students.find((s) => s.isKetua) || p.kelompok?.students[0];
      const facilityPosko =
        p.kelompok?.facilities?.find((f: any) => f.foto) || p.kelompok?.facilities?.[0];
      const resolvedFoto = p.fotoUrl || facilityPosko?.foto || null;
      const ketuaName = pAny.pic || ketua?.user?.name || "Ketua Kelompok KKN";
      const kontak =
        pAny.kontak && pAny.kontak !== "-"
          ? pAny.kontak
          : ketua?.user?.phone || (ketua as any)?.noWa || "-";
      const dplName =
        p.kelompok?.dpl?.name || (p.kelompok as any)?.dplNamaMentah || "DPL Belum Diset";
      const kelurahan =
        p.kelompok?.kelurahan ||
        pAny.rw?.kelurahan?.name ||
        ketua?.assignedRw?.kelurahan?.name ||
        "Coblong";
      const rwName =
        pAny.rw?.name ||
        (ketua?.assignedRw?.name
          ? ketua.assignedRw.name.startsWith("RW")
            ? ketua.assignedRw.name
            : `RW ${ketua.assignedRw.name}`
          : "-");
      const rwId = pAny.rwId || ketua?.assignedRwId || ketua?.user?.rwId || null;

      return {
        id: p.id,
        nama: p.nama,
        alamat: p.alamat || "-",
        kelompokId: p.kelompokId,
        kelompokName: p.kelompok?.name || "Kelompok KKN",
        kelurahan,
        rwId,
        rwName,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        foto: resolvedFoto,
        fotoUrl: resolvedFoto,
        pic: ketuaName,
        kontak,
        dplName,
        totalAnggota: p.kelompok?.students.length || 0,
        statusApproval: pAny.statusApproval || "APPROVED",
        isUtama: true,
        radius: pAny.radius || 500,
        createdAt: p.createdAt,
      };
    });

    // Merge any missing official PoskoKkn and PoskoKknMulti directly from PoskoKknService
    try {
      const { poskoKknService } = await import("./poskoKknService.js");
      const allOfficialPoskos = await poskoKknService.getAllPosko(filters?.userId, filters?.role);
      for (const off of allOfficialPoskos) {
        const alreadyExists = mapped.some(
          (m) => m.id === off.id || (m.kelompokId === off.kelompokId && off.isUtama)
        );
        if (!alreadyExists) {
          mapped.push({
            id: off.id,
            nama: off.nama,
            alamat: off.alamat || "-",
            kelompokId: off.kelompokId,
            kelompokName: off.kelompokName || "Kelompok KKN",
            kelurahan: off.kelurahan || "Coblong",
            rwId: null,
            rwName: off.rwName || "-",
            latitude: Number(off.latitude),
            longitude: Number(off.longitude),
            foto: off.foto || off.fotoUrl || null,
            fotoUrl: off.fotoUrl || off.foto || null,
            pic: off.pic || "Ketua Kelompok",
            kontak: off.kontak || "-",
            dplName: off.dplName || "DPL Belum Diset",
            totalAnggota: off.totalAnggota || 0,
            statusApproval: off.statusApproval || "APPROVED",
            isUtama: off.isUtama,
            radius: off.radius || 500,
            createdAt: off.createdAt,
          });
        }
      }
    } catch {
      // silent fallback
    }

    return mapped;
  }

  async createPoskoAdmin(
    userId: string,
    payload: {
      nama: string;
      alamat?: string;
      kelompokId?: string;
      rwId?: number;
      latitude: number;
      longitude: number;
      radius?: number;
      foto?: string;
      pic?: string;
      kontak?: string;
      statusApproval?: string;
    }
  ) {
    if (!payload.nama || !payload.nama.trim()) {
      throw new Error("Nama Posko wajib diisi.");
    }
    const lat = Number(payload.latitude);
    const lng = Number(payload.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      throw new Error("Koordinat GPS (latitude & longitude) wajib valid dan tidak boleh kosong.");
    }

    const targetKelompokId = payload.kelompokId;
    if (!targetKelompokId) {
      throw new Error("kelompokId wajib dipilih untuk pendaftaran Posko KKN.");
    }

    const { poskoKknService } = await import("./poskoKknService.js");
    const posko = await poskoKknService.upsertPosko(targetKelompokId, {
      nama: payload.nama.trim(),
      alamat: payload.alamat?.trim() || "-",
      latitude: lat,
      longitude: lng,
      radius: payload.radius != null ? Number(payload.radius) : 500,
      fotoUrl: payload.foto || undefined,
      keterangan: payload.statusApproval || undefined,
    });

    try {
      await prisma.auditTrail.create({
        data: {
          userId: userId || undefined,
          action: "CREATE_POSKO_KKN",
          newValue: {
            poskoId: posko.id,
            nama: posko.nama,
            kelompokId: posko.kelompokId,
            latitude: lat,
            longitude: lng,
            radius: Number((posko as any).radius) || 500,
            status: "APPROVED",
          },
        },
      });
    } catch {}

    return posko;
  }

  async updatePoskoAdmin(
    id: string,
    userId: string,
    payload: {
      nama?: string;
      alamat?: string;
      kelompokId?: string | null;
      rwId?: number | null;
      latitude?: number;
      longitude?: number;
      radius?: number;
      foto?: string;
      pic?: string;
      kontak?: string;
      statusApproval?: string;
    }
  ) {
    const existing = await prisma.poskoKkn.findFirst({
      where: { OR: [{ id }, { kelompokId: id }] },
      include: { kelompok: true },
    });

    if (!existing) {
      const err: any = new Error("Data Posko KKN tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }

    const targetKelompokId = payload.kelompokId || existing.kelompokId;
    const lat =
      payload.latitude !== undefined &&
      !isNaN(Number(payload.latitude)) &&
      Number(payload.latitude) !== 0
        ? Number(payload.latitude)
        : Number(existing.latitude);
    const lng =
      payload.longitude !== undefined &&
      !isNaN(Number(payload.longitude)) &&
      Number(payload.longitude) !== 0
        ? Number(payload.longitude)
        : Number(existing.longitude);

    const { poskoKknService } = await import("./poskoKknService.js");
    const parsedRadius =
      payload.radius !== undefined
        ? Number(payload.radius)
        : Number((existing as any)?.radius) || 500;
    const posko = await poskoKknService.upsertPosko(targetKelompokId, {
      nama: payload.nama !== undefined ? payload.nama.trim() : existing.nama,
      alamat: payload.alamat !== undefined ? payload.alamat.trim() : existing.alamat,
      latitude: lat,
      longitude: lng,
      radius: parsedRadius,
      fotoUrl:
        payload.foto !== undefined && payload.foto !== ""
          ? payload.foto
          : existing.fotoUrl || undefined,
      keterangan: payload.statusApproval || existing.keterangan || undefined,
      statusApproval: payload.statusApproval,
    });

    try {
      await prisma.auditTrail.create({
        data: {
          userId: userId || undefined,
          action: "UPDATE_POSKO_KKN",
          oldValue: {
            nama: existing.nama,
            alamat: existing.alamat,
            latitude: Number(existing.latitude),
            longitude: Number(existing.longitude),
            radius: Number((existing as any)?.radius) || 500,
          },
          newValue: {
            nama: posko.nama,
            alamat: posko.alamat,
            latitude: Number(posko.latitude),
            longitude: Number(posko.longitude),
            radius: Number((posko as any).radius) || 500,
          },
        },
      });
    } catch {}

    return posko;
  }

  async deletePoskoAdmin(id: string, userId?: string) {
    const existing = await prisma.poskoKkn.findFirst({
      where: { OR: [{ id }, { kelompokId: id }] },
    });

    if (!existing) {
      const err: any = new Error("Data Posko KKN tidak ditemukan.");
      err.statusCode = 404;
      throw err;
    }

    const { poskoKknService } = await import("./poskoKknService.js");
    await poskoKknService.deletePosko(existing.kelompokId);

    // ─── SINKRONISASI HAPUS POSKOKKN ───
    if (existing.kelompokId) {
      try {
        const { poskoKknService } = await import("./poskoKknService.js");
        await poskoKknService.deletePosko(existing.kelompokId);
      } catch (syncErr) {
        console.warn("[KknService.deletePoskoAdmin] Failed to sync delete PoskoKkn:", syncErr);
      }
    }

    try {
      await prisma.auditTrail.create({
        data: {
          userId: userId || undefined,
          action: "DELETE_POSKO_KKN",
          oldValue: {
            poskoId: existing.id,
            nama: existing.nama,
            kelompokId: existing.kelompokId,
          },
        },
      });
    } catch {}

    return { success: true, message: "Posko KKN berhasil dihapus." };
  }

  async getMyGroup(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        assignedRw: true,
        kelompok: {
          include: {
            dpl: true,
            students: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.kelompok) {
      return null;
    }

    const group = student.kelompok;
    const memberUserIds = group.students.map((s) => s.userId);

    const pointsAgg = await prisma.pointHistory.groupBy({
      by: ["userId"],
      where: { userId: { in: memberUserIds } },
      _sum: { points: true },
    });

    const pointsMap = new Map<string, number>();
    pointsAgg.forEach((item) => {
      pointsMap.set(item.userId, item._sum.points || 0);
    });

    const members = group.students.map((s) => {
      const p = pointsMap.get(s.userId) || 0;
      return {
        userId: s.userId,
        nim: s.nim || "1301210000",
        name: s.user?.name || "Mahasiswa KKN",
        jurusan: s.jurusan || "Teknik Informatika",
        fakultas: s.fakultas || "Informatika",
        individualPoints: p,
        isLeader: Boolean(s.isKetua),
      };
    });

    const totalGroupPoints = members.reduce((sum, m) => sum + m.individualPoints, 0);

    const registeredPosko = await prisma.facility.findFirst({
      where: {
        kelompokId: group.id,
        jenis: "posko_kkn",
      },
      include: { rw: true },
      orderBy: { createdAt: "desc" },
    });

    const isUserLeader = Boolean(student.isKetua);
    const poskoLat = registeredPosko?.latitude
      ? Number(registeredPosko.latitude)
      : student.assignedRw?.latitude
        ? Number(student.assignedRw.latitude)
        : -6.8906;
    const poskoLng = registeredPosko?.longitude
      ? Number(registeredPosko.longitude)
      : student.assignedRw?.longitude
        ? Number(student.assignedRw.longitude)
        : 107.6123;
    const poskoLocationName =
      registeredPosko?.nama ||
      (student.assignedRw?.name
        ? `RW ${student.assignedRw.name}`
        : `Kel. ${group.kelurahan || "Coblong"}`);
    const poskoStatus = registeredPosko?.statusApproval || "UNREGISTERED";

    return {
      groupId: group.id,
      groupName: group.name,
      dosenPembimbing: group.dpl?.name || group.dplNamaMentah || "Dosen Pendamping Lapangan",
      dplName: group.dpl?.name || group.dplNamaMentah || "Dosen Pendamping Lapangan",
      dplNip: group.dpl?.nip || "-",
      dplPhone: group.dpl?.phone || null,
      dpl: group.dpl
        ? {
            id: group.dpl.id,
            name: group.dpl.name,
            nip: group.dpl.nip || "-",
            phone: group.dpl.phone || null,
            nomorWa: group.dpl.phone || null,
            fotoProfil: group.dpl.fotoProfil || null,
          }
        : null,
      poskoLocation: poskoLocationName,
      poskoAlamat: registeredPosko?.alamat || student.assignedRw?.name || "-",
      poskoFoto: registeredPosko?.foto || null,
      poskoStatus,
      poskoFacilityId: registeredPosko?.id || null,
      isUserLeader,
      latitude: poskoLat,
      longitude: poskoLng,
      poskoLatitude: poskoLat,
      poskoLongitude: poskoLng,
      radiusMeter: 500,
      totalGroupPoints,
      members,
    };
  }

  async createLeaveRequest(
    studentId: string,
    payload: {
      kategori?: string;
      tanggalKegiatanTerkait?: string;
      deskripsi?: string;
      fotoBuktiUrl?: string;
      scheduleId?: string;
      startDate?: string;
      endDate?: string;
      reason?: string;
      type?: string;
    }
  ) {
    const targetStartRaw = payload.startDate || payload.tanggalKegiatanTerkait;
    let targetStartDate = targetStartRaw ? new Date(targetStartRaw) : new Date();
    if (isNaN(targetStartDate.getTime())) {
      targetStartDate = new Date();
    }

    const targetEndRaw = payload.endDate || payload.tanggalKegiatanTerkait || targetStartRaw;
    let targetEndDate = targetEndRaw ? new Date(targetEndRaw) : targetStartDate;
    if (isNaN(targetEndDate.getTime())) {
      targetEndDate = targetStartDate;
    }

    if (payload.scheduleId) {
      try {
        const schedule = await prisma.schedule.findUnique({
          where: { id: payload.scheduleId },
        });
        if (schedule && schedule.date) {
          targetStartDate = new Date(schedule.date);
          targetEndDate = new Date(schedule.date);
        }
      } catch (schErr) {
        console.warn("[createLeaveRequest] Schedule lookup fallback:", schErr);
      }
    }

    const startDate = new Date(targetStartDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetEndDate);
    endDate.setHours(23, 59, 59, 999);

    // Validasi Tanggal: Tidak boleh mengajukan izin untuk hari yang sudah lewat (WIB Timezone)
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (startWib < nowWib) {
      throw new Error(
        "Anda tidak dapat mengajukan izin untuk tanggal yang sudah lewat."
      );
    }

    // VALIDASI ANTI-TUMPUK (1 Hari/Pertemuan = 1 Status Pengajuan)
    const studentProfile = await prisma.studentKkn.findFirst({
      where: { OR: [{ userId: studentId }, { id: studentId }] },
      include: { kelompok: { include: { dpl: true } }, user: true },
    });
    const actualUserId = studentProfile?.userId || studentId;
    const studentUserIds = Array.from(
      new Set([studentId, studentProfile?.id, studentProfile?.userId].filter(Boolean) as string[])
    );

    const existingLeave = await (prisma as any).studentLeaveRequest.findFirst({
      where: {
        studentId: { in: studentUserIds },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        status: { in: ["PENDING", "APPROVED", "CANCEL_REQUESTED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingLeave) {
      if (existingLeave.status === "PENDING") {
        throw new Error("Pengajuan izin Anda sebelumnya masih dalam proses verifikasi.");
      }
      if (existingLeave.status === "APPROVED") {
        throw new Error(
          "Pengajuan izin untuk tanggal ini sudah disetujui. Silakan ajukan pembatalan jika ingin hadir."
        );
      }
      if (existingLeave.status === "CANCEL_REQUESTED") {
        throw new Error("Permohonan pembatalan izin Anda sedang menunggu konfirmasi DPL.");
      }
    }

    const leaveType = (payload.kategori || (payload as any).type || "IZIN")
      .toUpperCase()
      .includes("SAKIT")
      ? "SAKIT"
      : "IZIN";

    const leave = await (prisma as any).studentLeaveRequest.create({
      data: {
        studentId: actualUserId,
        type: leaveType,
        reason: payload.deskripsi || (payload as any).reason || "Berhalangan hadir kegiatan KKN",
        evidenceUrl: payload.fotoBuktiUrl || null,
        startDate,
        endDate,
        status: "PENDING",
      },
    });

    // Notify DPL asynchronously in background (non-blocking, won't trigger 502/timeout)
    try {
      const dplUser = studentProfile?.kelompok?.dpl;
      if (dplUser) {
        await prisma.notification.create({
          data: {
            userId: dplUser.id,
            title: `Pengajuan Ketidakhadiran (${leaveType}) Baru`,
            message: `Mahasiswa ${studentProfile?.user?.name || "KKN"} mengajukan ${leaveType}: "${leave.reason}"`,
            isRead: false,
          },
        });
      }
    } catch (notifErr) {
      console.warn(
        "[createLeaveRequest] Background DPL notification warning (non-critical):",
        notifErr
      );
    }

    return {
      izinId: leave.id,
      status: leave.status,
      startDate,
      endDate,
    };
  }

  /**
   * Pembatalan Izin Mahasiswa (Batal Izin / Jadi Hadir)
   * - Skenario A (PENDING): Langsung CANCELLED (Self-Service)
   * - Skenario B (APPROVED): Status CANCEL_REQUESTED (Menunggu Konfirmasi / Override DPL)
   */
  async cancelLeaveRequest(studentId: string, leaveRequestId: string, reason?: string) {
    const leave = await (prisma as any).studentLeaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { student: true },
    });

    if (!leave) {
      throw new Error("Pengajuan izin tidak ditemukan.");
    }

    // Pastikan milik mahasiswa bersangkutan
    const studentProfile = await prisma.studentKkn.findFirst({
      where: { OR: [{ userId: studentId }, { id: studentId }] },
      include: { kelompok: { include: { dpl: true } }, user: true },
    });
    const validIds = new Set(
      [studentId, studentProfile?.userId, studentProfile?.id].filter(Boolean)
    );
    if (!validIds.has(leave.studentId)) {
      throw new Error("Anda tidak memiliki izin untuk membatalkan pengajuan ini.");
    }

    if (leave.status === "CANCELLED" || leave.status === "OVERRIDDEN_HADIR") {
      throw new Error("Pengajuan izin ini sudah dibatalkan sebelumnya.");
    }

    if (leave.status === "REJECTED") {
      throw new Error("Pengajuan izin yang ditolak tidak perlu dibatalkan.");
    }

    // Skenario A: Masih PENDING -> Batal langsung (Self-Service)
    if (leave.status === "PENDING") {
      const updated = await (prisma as any).studentLeaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: "CANCELLED",
          rejectionReason: reason || "Dibatalkan oleh mahasiswa sendiri sebelum diverifikasi",
        },
      });
      return {
        success: true,
        status: "CANCELLED",
        message:
          "Pengajuan izin berhasil dibatalkan. Anda dapat melakukan presensi kehadiran normal.",
        data: updated,
      };
    }

    // Skenario B: Sudah APPROVED -> Mengajukan permohonan pembatalan ke DPL
    if (leave.status === "APPROVED") {
      const updated = await (prisma as any).studentLeaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: "CANCEL_REQUESTED",
          rejectionReason:
            reason || "Mahasiswa mengajukan pembatalan izin untuk hadir pada kegiatan",
        },
      });

      // Notifikasi ke DPL
      try {
        const dplUser = studentProfile?.kelompok?.dpl;
        if (dplUser) {
          await prisma.notification.create({
            data: {
              userId: dplUser.id,
              title: "Permohonan Pembatalan Izin Mahasiswa",
              message: `Mahasiswa ${studentProfile?.user?.name || "KKN"} mengajukan pembatalan izin untuk tanggal ${new Date(leave.startDate).toLocaleDateString("id-ID")}.`,
              isRead: false,
            },
          });
        }
      } catch (notifErr) {
        console.warn("[cancelLeaveRequest] Background DPL notification error:", notifErr);
      }

      return {
        success: true,
        status: "CANCEL_REQUESTED",
        message:
          "Permohonan pembatalan izin telah dikirimkan ke DPL. Menunggu konfirmasi DPL untuk pengubahan status kehadiran.",
        data: updated,
      };
    }

    throw new Error(`Status izin (${leave.status}) tidak dapat dibatalkan.`);
  }

  async getLeaveRequests(studentId: string) {
    const studentProfile = await prisma.studentKkn.findFirst({
      where: { OR: [{ userId: studentId }, { id: studentId }] },
    });
    const studentUserIds = Array.from(
      new Set([studentId, studentProfile?.id, studentProfile?.userId].filter(Boolean) as string[])
    );

    const list = await (prisma as any).studentLeaveRequest.findMany({
      where: { studentId: { in: studentUserIds } },
      orderBy: { createdAt: "desc" },
    });
    return list.map((item: any) => ({
      id: item.id,
      kategori: item.type,
      deskripsi: item.reason,
      fotoBuktiUrl: item.evidenceUrl,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
      rejectionReason: item.rejectionReason,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
    }));
  }

  async createPemanfaatanSampah(
    userId: string,
    payload: {
      jenisPemanfaatan?: string;
      kategoriSampah?: string;
      jumlah?: number;
      satuan?: string;
      wilayahDampingan?: string;
      deskripsi?: string;
      timestamp?: string;
      rwTerkait?: string;
      dplId?: string;
      fotoDokumentasiUrl?: string;
    }
  ) {
    const {
      jenisPemanfaatan = "Kompos Organik",
      kategoriSampah = "Organik",
      jumlah = 10,
      satuan = "Kg",
      deskripsi = "",
      rwTerkait,
      dplId,
      fotoDokumentasiUrl,
    } = payload;

    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        user: true,
        kelompok: {
          include: { dpl: true },
        },
      },
    });

    let targetRwId = student?.user?.rwId;
    if (rwTerkait) {
      const rwDigits = String(rwTerkait).match(/\d+/);
      if (rwDigits) {
        const foundRw = await prisma.rw.findFirst({
          where: { name: { contains: rwDigits[0] } },
        });
        if (foundRw) targetRwId = foundRw.id;
      }
    }

    if (!targetRwId) {
      const firstRw = await prisma.rw.findFirst();
      targetRwId = firstRw ? firstRw.id : 1;
    }

    const uniqueNo = `PEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const cleanProgramTitle =
      jenisPemanfaatan || payload.wilayahDampingan || deskripsi || "Program Pengolahan Mandiri";
    const cleanTeknologi = jenisPemanfaatan || "Kompos Organik";
    const cleanBahanBaku = kategoriSampah || "Sampah Organik";

    const report = await prisma.pemanfaatan.create({
      data: {
        rwId: targetRwId,
        nomorCaraPemanfaatan: uniqueNo,
        program: cleanProgramTitle,
        teknologi: cleanTeknologi,
        bahanBaku: cleanBahanBaku,
        volumeBahanBaku: Number(jumlah) || 0,
        unitBahanBaku: satuan || "Kg",
        hasil: 0,
        unitHasil: satuan || "Kg",
        fotoDokumentasiUrl: fotoDokumentasiUrl || "/uploads/default-pemanfaatan.jpg",
        tanggalPencatatan: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    });

    const isIdeProgram =
      satuan === "Rp" || ["FISIK", "NON_FISIK", "LAINNYA"].includes(jenisPemanfaatan);
    const laporanLabel = isIdeProgram ? "Laporan Ide Program" : "Laporan Pemanfaatan Sampah";
    const laporanDesc = isIdeProgram
      ? `${jenisPemanfaatan} dengan RAB ${jumlah} ${satuan}`
      : `${jenisPemanfaatan} (${jumlah} ${satuan})`;

    // Award +25 points to student for waste utilization report
    const earnedPoints = 25;
    await prisma.pointHistory.create({
      data: {
        userId,
        points: earnedPoints,
        description: `${laporanLabel}: ${laporanDesc}`,
        kategori: "SETORAN_BEBAS_PENUH",
        redeemable: false,
      },
    });

    // Tembusan 2 Arah: Send Notifications to RW and DPL
    const studentName = student?.user?.name || "Mahasiswa KKN";
    const rwName = rwTerkait || `RW ${targetRwId}`;

    // 1. Notify RW User
    const rwUsers = await prisma.user.findMany({
      where: {
        rwId: targetRwId,
        role: { name: "RW" },
      },
    });
    for (const rwUser of rwUsers) {
      await prisma.notification.create({
        data: {
          userId: rwUser.id,
          title: `${laporanLabel} (${rwName})`,
          message: `Mahasiswa KKN ${studentName} menginput ${laporanLabel.toLowerCase()} ${laporanDesc}.`,
          isRead: false,
        },
      });
    }

    // 2. Notify DPL User
    let dplUser = student?.kelompok?.dpl;
    if (dplId) {
      const foundDpl = await prisma.user.findFirst({
        where: {
          OR: [{ id: dplId }, { name: { contains: dplId, mode: "insensitive" } }],
          role: { name: { in: ["DPL", "DOSEN_PEMBIMBING"] } },
        },
      });
      if (foundDpl) dplUser = foundDpl as any;
    }

    if (dplUser) {
      await prisma.notification.create({
        data: {
          userId: dplUser.id,
          title: `Tembusan ${laporanLabel}`,
          message: `Mahasiswa dampingan Anda (${studentName}) menginput ${laporanLabel.toLowerCase()} ${laporanDesc} untuk ${rwName}.`,
          isRead: false,
        },
      });
    }

    return {
      reportId: report.id,
      id: report.id,
      earnedPoints,
      rwTerkait: rwName,
      dplId: dplUser?.id || dplId || null,
      fotoDokumentasiUrl: report.fotoDokumentasiUrl,
      program: report.program,
    };
  }

  async notifyWargaStatus(kknUserId: string, wargaId: string, statusBimbingan: string) {
    const warga = await prisma.user.findUnique({ where: { id: wargaId } });
    if (!warga) {
      throw new Error("WARGA_NOT_FOUND");
    }

    const isTerbina = statusBimbingan.toUpperCase() === "TERBINA";
    const title = isTerbina
      ? "Status Pendampingan KKN: Terbina"
      : "Status Pendampingan KKN: Perlu Evaluasi";
    const message = isTerbina
      ? "Selamat! Rumah tangga Anda telah dinilai Terbina dalam pemilahan sampah oleh Mahasiswa KKN."
      : "Rumah tangga Anda saat ini memerlukan peningkatan konsistensi dalam pemilahan sampah.";

    await prisma.notification.create({
      data: {
        userId: wargaId,
        title,
        message,
      },
    });

    if (warga.fcmToken) {
      try {
        await notificationIntegrationService.sendPushNotification(
          warga.fcmToken,
          title,
          message,
          "KKN_STATUS_NOTIFICATION"
        );
      } catch (err) {
        console.error("[KknService] FCM send push error:", err);
      }
    }

    return { wargaId, statusBimbingan, notifiedAt: new Date() };
  }
  async getActiveZone(userId: string, currentLat?: number, currentLng?: number) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: true,
        assignedRw: {
          include: { kelurahan: true },
        },
        user: {
          include: {
            rw: {
              include: { kelurahan: true },
            },
          },
        },
      },
    });

    const activeArea = student?.assignedRw || student?.user?.rw;

    // Fetch target duration dynamically from Rule Engine as the single source of truth!
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const ruleTargetMinutes =
      ruleConfigs.attendanceMinDurationHours * 60 +
      ruleConfigs.attendanceMinDurationMinutes +
      ruleConfigs.attendanceMinDurationSeconds / 60;
    const targetDurationMinutes = ruleTargetMinutes > 0 ? ruleTargetMinutes : 240;

    // Hitung batas hari WIB (UTC+7) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â jadwal disimpan UTC, harus query dengan window WIB
    const nowForBoundary = new Date();
    const nowWibBoundary = new Date(nowForBoundary.getTime() + 7 * 60 * 60 * 1000);
    const todayWibStr = nowWibBoundary.toISOString().slice(0, 10);
    const todayStart = new Date(`${todayWibStr}T00:00:00+07:00`);
    const todayEnd = new Date(`${todayWibStr}T23:59:59.999+07:00`);
    const yesterdayWibStr = new Date(
      todayStart.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);
    const yesterdayStart = new Date(`${yesterdayWibStr}T00:00:00+07:00`);

    // Fetch all valid student ID representations to prevent any user ID mismatch
    const studentUserIds = Array.from(
      new Set([userId, student?.id, student?.userId].filter(Boolean) as string[])
    );

    // Check student's leave request status (izin / sakit) - must belong ONLY to this student, be APPROVED, and active today
    const activeLeave = await (prisma as any).studentLeaveRequest.findFirst({
      where: {
        studentId: { in: studentUserIds },
        status: "APPROVED",
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch student's completed/attended schedule IDs today
    const completedAttendances = await prisma.activityAttendance.findMany({
      where: {
        studentId: { in: studentUserIds },
        attendedAt: { gte: todayStart, lte: todayEnd },
        OR: [{ checkOutAt: { not: null } }, { status: "ALPA" }],
      },
      select: { scheduleId: true },
    });
    const completedScheduleIds = new Set(completedAttendances.map((a) => a.scheduleId));

    // 🎯 Filter jadwal aktif (spesifik kelompok KKN atau jadwal bersama/global tanpa kelompokId)
    let activeSchedules: any[] = [];
    if (student?.kelompokId) {
      activeSchedules = await prisma.schedule.findMany({
        where: {
          OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }],
          date: { gte: yesterdayStart, lte: todayEnd },
          isActive: true,
        },
        orderBy: { date: "asc" },
      });
    }

    // Fallback 1: Jika tidak ada jadwal spesifik kelompok, cari jadwal umum tanpa kelompokId
    if (activeSchedules.length === 0) {
      activeSchedules = await prisma.schedule.findMany({
        where: {
          kelompokId: null,
          date: { gte: yesterdayStart, lte: todayEnd },
          isActive: true,
        },
        orderBy: { date: "asc" },
      });
    }

    // Fallback 2: Jika masih belum ada, cari seluruh jadwal aktif dalam rentang tanggal ini
    if (activeSchedules.length === 0) {
      activeSchedules = await prisma.schedule.findMany({
        where: {
          date: { gte: yesterdayStart, lte: todayEnd },
          isActive: true,
        },
        orderBy: { date: "asc" },
      });
    }

    // Filter out schedules that student has already completed/checked out
    const pendingSchedules = activeSchedules.filter((sch) => !completedScheduleIds.has(sch.id));
    const targetScheduleList = pendingSchedules;

    // Prioritaskan sesi yang sedang berjalan (jika mahasiswa sudah menekan Mulai)
    const runningSession = await prisma.activityAttendance.findFirst({
      where: {
        studentId: { in: studentUserIds },
        status: { in: ["BERLANGSUNG", "DI_ZONA", "DALAM_RADIUS", "TERJEDA"] },
        checkOutAt: null,
      },
    });

    let activeSchedule: any = null;
    if (runningSession) {
      activeSchedule = targetScheduleList.find((sch) => sch.id === runningSession.scheduleId);
    }

    const now = new Date();
    // WIB (UTC+7) konsisten
    const nowWibAz = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentWibMinutes = nowWibAz.getUTCHours() * 60 + nowWibAz.getUTCMinutes();
    const todayStr = nowWibAz.toISOString().substring(0, 10);

    if (!activeSchedule) {
      // 1. Time Window Matching: Pick schedule matching current time e.g. "08:00 - 10:00" vs "13:00 - 15:00"
      for (const sch of targetScheduleList) {
        let startMins = 0;
        let endMins = 24 * 60;
        // Strip suffix WIB/WITA/WIT dan normalize separator ke "-"
        const normalizedTime = (sch.time || "")
          .replace(/\s*(WIB|WITA|WIT)\s*/gi, "")
          .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â~]|s\/d|sd/gi, "-")
          .trim();
        if (normalizedTime.includes("-")) {
          const parts = normalizedTime.split("-");
          const startParts = parts[0].trim().replace(".", ":").split(":");
          const endParts = parts[1].trim().replace(".", ":").split(":");
          if (startParts.length >= 2) {
            const h = parseInt(startParts[0], 10);
            const m = parseInt(startParts[1], 10);
            const cleanH = isNaN(h) ? 8 : h === 24 ? 0 : h;
            const cleanM = isNaN(m) ? 0 : m;
            startMins = cleanH * 60 + cleanM;
          }
          if (endParts.length >= 2) {
            const h = parseInt(endParts[0], 10);
            const m = parseInt(endParts[1], 10);
            const cleanH = isNaN(h) ? 16 : h === 24 ? 24 : h;
            const cleanM = isNaN(m) ? 0 : m;
            endMins = cleanH * 60 + cleanM;
          }
        }

        const schDateStr = sch.date
          ? new Date(new Date(sch.date).getTime() + 7 * 60 * 60 * 1000)
              .toISOString()
              .substring(0, 10)
          : todayStr;
        const isSchedDateToday = schDateStr === todayStr;

        let isTimeMatch = false;
        if (endMins >= startMins) {
          // Normal daytime schedule
          isTimeMatch =
            isSchedDateToday && currentWibMinutes >= startMins && currentWibMinutes <= endMins;
        } else {
          // Overnight schedule (e.g. 11:00 - 08:02)
          if (isSchedDateToday) {
            isTimeMatch = currentWibMinutes >= startMins; // Day 1
          } else {
            isTimeMatch = currentWibMinutes <= endMins; // Day 2
          }
        }

        if (isTimeMatch) {
          activeSchedule = sch;
          break;
        }
      }
    }

    // 2. Smart Multi-Schedule Matching by Geofence if no exact time match
    if (!activeSchedule && targetScheduleList.length > 0) {
      if (
        currentLat !== undefined &&
        currentLng !== undefined &&
        !isNaN(currentLat) &&
        !isNaN(currentLng)
      ) {
        for (const sch of targetScheduleList) {
          let isInside = false;
          if (sch.polygon && Array.isArray(sch.polygon) && sch.polygon.length >= 3) {
            const polyPoints = (sch.polygon as any[]).map((p) => ({
              lat: Number(p[0]),
              lng: Number(p[1]),
            }));
            isInside = isPointInPolygonWithBuffer(
              { lat: currentLat, lng: currentLng },
              polyPoints,
              15
            );
          } else if (sch.latitude && sch.longitude) {
            const dist = calculateDistance(
              currentLat,
              currentLng,
              Number(sch.latitude),
              Number(sch.longitude)
            );
            isInside = dist <= (sch.radius || 100) + 15;
          }

          if (isInside) {
            activeSchedule = sch;
            break;
          }
        }

        if (!activeSchedule) {
          let minDistance = Infinity;
          for (const sch of targetScheduleList) {
            if (sch.latitude && sch.longitude) {
              const dist = calculateDistance(
                currentLat,
                currentLng,
                Number(sch.latitude),
                Number(sch.longitude)
              );
              if (dist < minDistance) {
                minDistance = dist;
                activeSchedule = sch;
              }
            }
          }
        }
      }

      if (!activeSchedule) {
        activeSchedule = targetScheduleList[0];
      }
    }

    // Fetch attendance specific to activeSchedule
    const attendanceForActiveSchedule = activeSchedule
      ? await prisma.activityAttendance.findFirst({
          where: {
            studentId: { in: studentUserIds },
            scheduleId: activeSchedule.id,
          },
        })
      : null;

    let attendanceStatus = "belum_absen";
    let isMemenuhiDurasi = false;
    if (activeLeave) {
      const typeLower = (activeLeave.type || "").toLowerCase();
      attendanceStatus = typeLower.includes("sakit") ? "sakit" : "izin";
    } else if (attendanceForActiveSchedule) {
      const attStatUpper = String(attendanceForActiveSchedule.status || "").toUpperCase();
      const actualMins = attendanceForActiveSchedule.actualInZoneMinutes ?? 0;
      const isDurMet = targetDurationMinutes <= 0 || actualMins >= targetDurationMinutes;
      isMemenuhiDurasi = isDurMet;

      if (attStatUpper.includes("IZIN")) {
        attendanceStatus = "izin";
      } else if (attStatUpper.includes("SAKIT")) {
        attendanceStatus = "sakit";
      } else if (attStatUpper.includes("ALPA")) {
        attendanceStatus = "alpa";
      } else if (attStatUpper.includes("TIDAK_ADA_KEGIATAN") || attStatUpper.includes("SKIP")) {
        attendanceStatus = "tidak_ada_kegiatan";
      } else if (
        attStatUpper === "BERLANGSUNG" ||
        attStatUpper === "DALAM_RADIUS" ||
        attStatUpper === "DI_ZONA"
      ) {
        attendanceStatus = "berlangsung";
      } else if (
        attStatUpper === "HADIR_MEMENUHI" ||
        attStatUpper === "HADIR_TIDAK_MEMENUHI" ||
        attStatUpper === "SELESAI_TELAT" ||
        attStatUpper === "HADIR" ||
        attStatUpper === "SELESAI" ||
        attendanceForActiveSchedule.checkOutAt !== null
      ) {
        if (attStatUpper === "SELESAI_TELAT") {
          attendanceStatus = "hadir_tidak_memenuhi";
          isMemenuhiDurasi = false;
        } else {
          attendanceStatus = isDurMet ? "hadir_memenuhi" : "hadir_tidak_memenuhi";
          isMemenuhiDurasi = isDurMet;
        }
      } else {
        attendanceStatus = attStatUpper.toLowerCase();
      }
    }

    // Syarat Alur Presensi: Jika DPL tidak mengaktifkan kegiatan -> Otomatis Libur / Tidak ada kegiatan aktif
    if (!activeSchedule) {
      return {
        hasActiveZone: false,
        message: "Tidak Ada Kegiatan Aktif (Libur)",
        zoneName: "Tidak ada kegiatan",
        kelurahan: activeArea?.kelurahan?.name || "Coblong",
        latitude: null,
        longitude: null,
        radiusMeter: 100,
        targetDurationMinutes,
        attendanceStatus: activeLeave ? attendanceStatus : "libur",
        status: activeLeave ? attendanceStatus : "libur",
        statusKehadiran: activeLeave ? attendanceStatus.toUpperCase() : "LIBUR",
        polygon: activeSchedule ? activeSchedule.polygon : null,
        kehadiran: activeLeave ? attendanceStatus : "libur",
        polygonPoints: [],
      };
    }

    let isOvernight = false;
    if (activeSchedule?.time && activeSchedule.time.includes("-")) {
      const parts = activeSchedule.time.split("-");
      const startParts = parts[0].trim().replace(".", ":").split(":");
      const endParts = parts[1].trim().replace(".", ":").split(":");
      if (startParts.length >= 2 && endParts.length >= 2) {
        const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        const endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
        if (endMins <= startMins) {
          isOvernight = true;
        }
      }
    }
    const finalTargetDurationMinutes = targetDurationMinutes;

    // Kebijakan Fleksibilitas Lapangan & Batas Maksimal 18:00 WIB:
    // 1. Jadwal standar 08:00 - 16:00 di-hold sampai jam 18:00 WIB (jam 6 sore).
    // 2. Mahasiswa yang aktif berkegiatan (BERLANGSUNG, TERJEDA, dsb.) TIDAK BOLEH dicap ALPA saat lewat jam 16:00.
    // 3. Jika sudah mencapai atau melewati batas jam 18:00 WIB (1080 menit WIB) dan mahasiswa belum checkout,
    //    sistem secara otomatis menyelesaikan presensi sebagai HADIR (HADIR_MEMENUHI).
    const isPast18Wib = currentWibMinutes >= 18 * 60; // Batas maksimal jam 18:00 WIB (1080 menit)
    const hasUnfinishedSession =
      attendanceForActiveSchedule &&
      !attendanceForActiveSchedule.checkOutAt &&
      ["BERLANGSUNG", "DI_ZONA", "DALAM_RADIUS", "TERJEDA"].includes(
        String(attendanceForActiveSchedule.status || "").toUpperCase()
      );

    if (isPast18Wib && hasUnfinishedSession) {
      try {
        const autoCheckoutResult = await kknAttendanceService.checkOutAttendance({
          studentId: attendanceForActiveSchedule.studentId,
          scheduleId: activeSchedule.id,
          deskripsiKegiatan:
            attendanceForActiveSchedule.deskripsiKegiatan ||
            "Diselesaikan otomatis oleh sistem (Batas maksimal 18:00 WIB)",
          isAutoCheckout: true,
        });

        if (autoCheckoutResult) {
          attendanceStatus = "hadir_memenuhi";
          isMemenuhiDurasi = true;
          // Refresh local reference agar response payload konsisten
          attendanceForActiveSchedule.status = "HADIR_MEMENUHI";
          attendanceForActiveSchedule.checkOutAt = new Date();
          attendanceForActiveSchedule.actualInZoneMinutes =
            autoCheckoutResult?.data?.actualInZoneMinutes ?? targetDurationMinutes;
        }
      } catch (checkoutErr) {
        console.error(
          `[KknService.getActiveZone] Error saat auto-checkout jam 18:00 untuk ${userId}:`,
          checkoutErr
        );
      }
    }

    // Calculate precise total seconds & minutes in zone from active attendance (SSOT)
    let actualInZoneSeconds = 0;
    let actualInZoneMinutes = 0;
    if (attendanceForActiveSchedule) {
      actualInZoneSeconds = calculateLiveInZoneSeconds(attendanceForActiveSchedule);
      actualInZoneMinutes = calculateLiveInZoneMinutes(attendanceForActiveSchedule);
    }

    // Jika ada jadwal kegiatan spesifik untuk kelompoknya, gunakan data & koordinat jadwal tersebut!
    if (activeSchedule) {
      const schedLat = activeSchedule.latitude
        ? Number(activeSchedule.latitude)
        : activeArea?.latitude
          ? Number(activeArea.latitude)
          : null;
      const schedLng = activeSchedule.longitude
        ? Number(activeSchedule.longitude)
        : activeArea?.longitude
          ? Number(activeArea.longitude)
          : null;
      const locName =
        activeSchedule.location ||
        (activeArea?.name
          ? `RW ${activeArea.name}, ${activeArea.kelurahan?.name || ""}`
          : "Lokasi Posko KKN");
      const schedTime = activeSchedule.time || "08:00 - 16:00";
      const schedTitle = activeSchedule.title || "Kegiatan KKN";

      return {
        hasActiveZone: true,
        id: activeSchedule.id,
        scheduleId: activeSchedule.id,
        zoneName: schedTitle,
        title: schedTitle,
        namaKegiatan: schedTitle,
        address: locName,
        location: locName,
        targetLokasi: locName,
        time: schedTime,
        jamKegiatan: schedTime,
        kelurahan: activeArea?.kelurahan?.name || "Coblong",
        latitude: schedLat,
        longitude: schedLng,
        radiusMeter: activeSchedule.radius || 100,
        radius: activeSchedule.radius || 100,
        targetDurationMinutes: finalTargetDurationMinutes,
        actualInZoneMinutes,
        actualInZoneSeconds,
        attendanceStatus,
        status: attendanceStatus,
        statusKehadiran: attendanceStatus.toUpperCase(),
        statusDisplay:
          attendanceStatus === "hadir_memenuhi"
            ? "Hadir & Memenuhi"
            : attendanceStatus === "hadir_tidak_memenuhi"
              ? "Hadir & Tidak Memenuhi"
              : attendanceStatus,
        isMemenuhiDurasi,
        kehadiran: attendanceStatus,
        attendedAt: attendanceForActiveSchedule?.attendedAt,
        polygon: activeSchedule && activeSchedule.polygon ? activeSchedule.polygon : null,
        polygonPoints:
          activeSchedule && activeSchedule.polygon && Array.isArray(activeSchedule.polygon)
            ? activeSchedule.polygon
            : [],
      };
    }

    // Fallback posko RW jika belum ada jadwal kegiatan khusus hari ini
    const lat = activeArea?.latitude ? Number(activeArea.latitude) : null;
    const lng = activeArea?.longitude ? Number(activeArea.longitude) : null;
    const locName = activeArea?.name
      ? `RW ${activeArea.name}, ${activeArea.kelurahan?.name || ""}`
      : "Wilayah Dampingan KKN";

    return {
      hasActiveZone: true,
      id: "kkn-main-posko",
      scheduleId: "kkn-main-posko",
      zoneName: locName,
      title: "Kegiatan Mandiri Posko KKN",
      namaKegiatan: "Kegiatan Mandiri Posko KKN",
      address: locName,
      location: locName,
      targetLokasi: locName,
      time: "08:00 - 16:00",
      jamKegiatan: "08:00 - 16:00",
      kelurahan: activeArea?.kelurahan?.name || "Coblong",
      latitude: lat,
      longitude: lng,
      radiusMeter: 100,
      radius: 100,
      targetDurationMinutes,
      actualInZoneMinutes,
      actualInZoneSeconds,
      attendanceStatus,
      status: attendanceStatus,
      statusKehadiran: attendanceStatus.toUpperCase(),
      statusDisplay:
        attendanceStatus === "hadir_memenuhi"
          ? "Hadir & Memenuhi"
          : attendanceStatus === "hadir_tidak_memenuhi"
            ? "Hadir & Tidak Memenuhi"
            : attendanceStatus,
      isMemenuhiDurasi,
      kehadiran: attendanceStatus,
      polygonPoints:
        lat && lng
          ? [
              [lat + 0.002, lng - 0.002],
              [lat + 0.002, lng + 0.002],
              [lat - 0.002, lng + 0.002],
              [lat - 0.002, lng - 0.002],
            ]
          : [],
    };
  }

  async getDampakStatistik(userId: string, targetType: "rw" | "kelurahan" = "kelurahan") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rw: { include: { kelurahan: true } },
        studentProfile: {
          include: {
            assignedRw: { include: { kelurahan: true } },
            kelompok: true,
          },
        },
      },
    });

    const kelurahanName =
      user?.rw?.kelurahan?.name ||
      user?.studentProfile?.assignedRw?.kelurahan?.name ||
      user?.studentProfile?.kelompok?.kelurahan ||
      "Coblong";
    const rwName = user?.rw?.name || user?.studentProfile?.assignedRw?.name || "RW Terkait";

    const totalHouseholdsRegistered = await prisma.household.count();
    const totalActiveBins = await prisma.bin.count({ where: { status: "ACTIVE_BOUND" } });

    const setoranAll = await prisma.setoranOtomatis.findMany();
    let totalWasteVolumeKg = 0;
    let organicVolumeKg = 0;
    let nonOrganicVolumeKg = 0;

    setoranAll.forEach((s) => {
      const b = Number(s.berat || 0);
      totalWasteVolumeKg += b;
      const k = (s.hasilKlasifikasiAi || "").toUpperCase();
      if (k.includes("ORGANIK") && !k.includes("ANORGANIK")) {
        organicVolumeKg += b;
      } else {
        nonOrganicVolumeKg += b;
      }
    });

    const activePercentage =
      totalHouseholdsRegistered > 0
        ? Number(((totalActiveBins / (totalHouseholdsRegistered * 2)) * 100).toFixed(2))
        : 0.0;

    return {
      kelurahanName: targetType === "rw" ? rwName : kelurahanName,
      activeHouseholdsPercentage: activePercentage,
      totalWasteVolumeKg: Number(totalWasteVolumeKg.toFixed(2)),
      organicVolumeKg: Number(organicVolumeKg.toFixed(2)),
      nonOrganicVolumeKg: Number(nonOrganicVolumeKg.toFixed(2)),
      totalHouseholdsRegistered,
      totalActiveBins,
    };
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  // 3 Pilar KKN (Perencanaan, Aksi, Panen)
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  async createProgramKerja(userId: string, payload: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        studentProfile: {
          include: {
            kelompok: {
              include: {
                dpl: true,
                students: { include: { user: true } },
              },
            },
            user: true,
          },
        },
      },
    });
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    const student = user.studentProfile;
    const targetKelompokId = payload.kelompokId || student?.kelompokId;

    if (!targetKelompokId) {
      throw new Error("User belum terdaftar di kelompok KKN atau kelompokId belum ditentukan");
    }

    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: targetKelompokId },
      include: {
        dpl: true,
        students: { include: { user: true } },
      },
    });
    if (!kelompok) {
      throw new Error("Kelompok KKN tidak ditemukan");
    }

    const targetStudentId = student?.id || kelompok.students[0]?.id || null;
    const authorName = student?.user?.name || user.name || "Mahasiswa";

    const {
      judul,
      kategori,
      rencanaAnggaran,
      kebutuhanBiaya,
      targetTanggal,
      deskripsi,
      waktuPelaksanaan,
      urlGoogleDrive,
      linkGoogleDrive,
      attachmentFile,
      attachmentUrls,
    } = payload;

    if (!judul || judul.trim() === "") {
      throw new Error("Judul program kerja wajib diisi");
    }

    const finalKategori = normalizeProkerKategori(kategori);

    // Validasi waktu pelaksanaan tidak boleh masa lampau dan minimal 3 hari dari pengajuan jika diisi
    const executionDateRaw = targetTanggal || waktuPelaksanaan;
    if (executionDateRaw) {
      const execDate = new Date(executionDateRaw);
      if (!isNaN(execDate.getTime())) {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        const minDate = new Date(todayMidnight);
        minDate.setDate(minDate.getDate() + 3);

        const checkDateMidnight = new Date(
          execDate.getFullYear(),
          execDate.getMonth(),
          execDate.getDate()
        );
        if (checkDateMidnight.getTime() < minDate.getTime()) {
          console.warn("[Proker] Waktu pelaksanaan dekat dengan tanggal pengajuan.");
        }
      }
    }

    const finalGoogleDriveUrl = urlGoogleDrive || linkGoogleDrive || attachmentFile || null;
    const finalWaktuPelaksanaan = executionDateRaw ? String(executionDateRaw) : null;

    const finalAttachmentUrls =
      Array.isArray(attachmentUrls) && attachmentUrls.length > 0
        ? attachmentUrls
        : finalGoogleDriveUrl
          ? [finalGoogleDriveUrl]
          : [];

    const hasAttachment = Boolean(
      attachmentFile || finalGoogleDriveUrl || finalAttachmentUrls.length > 0
    );

    let finalJudul = judul.trim();
    if (finalKategori === "LAPORAN_AKHIR") {
      finalJudul = `[${authorName}] ${finalJudul}`;
    }
    const cleanDesc = (deskripsi || "").trim();
    const combinedDeskripsi = cleanDesc.startsWith(`**${finalJudul}**`)
      ? cleanDesc
      : `**${finalJudul}**\n\n${cleanDesc}`;

    // Hitung nomor urut proker dalam kelompok
    const existingCount = await prisma.programKerjaKkn
      .count({
        where: { kelompokId: kelompok.id },
      })
      .catch(() => 0);

    const proker = await prisma.programKerjaKkn.create({
      data: {
        kelompokId: kelompok.id,
        studentId: targetStudentId,
        nomor: existingCount + 1,
        kategori: finalKategori,
        deskripsi: combinedDeskripsi,
        waktuPelaksanaan: finalWaktuPelaksanaan,
        linkGoogleDrive: finalGoogleDriveUrl,
        attachmentFile: attachmentFile || finalGoogleDriveUrl || null,
        attachmentUrls: finalAttachmentUrls,
        hasAttachment,
        kebutuhanBiaya: Number(kebutuhanBiaya || rencanaAnggaran) || 0,
        status: "BELUM_DISETUJUI",
        statusUsulan: "BELUM_DISETUJUI",
        statusPelaksanaan: "BELUM_MULAI",
        sumber: "MAHASISWA",
      },
    });

    // Notify DPL
    if (kelompok.dplId) {
      await prisma.notification
        .create({
          data: {
            userId: kelompok.dplId,
            title: "Pengajuan Program Kerja Baru",
            message: `Mahasiswa ${authorName} mengajukan ide program kerja: "${judul.trim()}". Silakan ditinjau.`,
            isRead: false,
          },
        })
        .catch(() => {});
    }

    return await this.getProgramKerjaById(userId, proker.id);
  }

  async getProgramKerja(userId: string, targetGroupId?: string, filters?: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, studentProfile: { include: { kelompok: true } } },
    });
    if (!user) throw new Error("User tidak ditemukan");

    const roleName = String(user.role?.name || "").toUpperCase();
    const isAdmin = [
      "SUPER_USER",
      "DEVELOPER",
      "ADMIN_DLH",
      "DLH",
      "DLH_ADMIN",
      "ADMIN",
      "PANITIA_TASKFORCE",
      "PEMIMPIN",
    ].includes(roleName);

    let whereClause: any = {};

    if (isAdmin) {
      if (targetGroupId && targetGroupId !== "ALL") {
        whereClause.kelompokId = targetGroupId;
      }
    } else if (roleName.includes("MAHASISWA")) {
      const student =
        user.studentProfile || (await prisma.studentKkn.findUnique({ where: { userId } }));
      if (!student?.kelompokId) {
        return [];
      }
      whereClause.kelompokId = student.kelompokId;
    } else if (roleName.includes("DPL") || roleName.includes("DOSEN_PEMBIMBING")) {
      const kelompokBinaan = await prisma.kelompokKkn.findMany({
        where: {
          OR: [{ dplId: userId }, { dpl: { id: userId } }],
        },
        select: { id: true },
      });
      const dplGroupIds = kelompokBinaan.map((k) => k.id);
      if (dplGroupIds.length === 0) {
        return [];
      }
      if (targetGroupId && targetGroupId !== "ALL") {
        if (!dplGroupIds.includes(targetGroupId)) {
          throw new Error(
            "Akses ditolak: Anda hanya dapat melihat program kerja kelompok dampingan Anda."
          );
        }
        whereClause.kelompokId = targetGroupId;
      } else {
        whereClause.kelompokId = { in: dplGroupIds };
      }
    } else {
      return [];
    }

    if (filters?.kategori && filters.kategori !== "ALL") {
      whereClause.kategori = { equals: filters.kategori, mode: "insensitive" };
    }
    if (filters?.statusUsulan && filters.statusUsulan !== "ALL") {
      whereClause.statusUsulan = { equals: filters.statusUsulan, mode: "insensitive" };
    }
    if (filters?.statusPelaksanaan && filters.statusPelaksanaan !== "ALL") {
      whereClause.statusPelaksanaan = { equals: filters.statusPelaksanaan, mode: "insensitive" };
    }
    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.trim();
      whereClause.OR = [
        { deskripsi: { contains: q, mode: "insensitive" } },
        { kategori: { contains: q, mode: "insensitive" } },
      ];
    }

    // Enforce H+5 Soft-Expiry Rule: If approved > 5 days ago and still BELUM_MULAI, soft-cancel
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await prisma.programKerjaKkn
      .updateMany({
        where: {
          ...whereClause,
          statusUsulan: "DISETUJUI",
          statusPelaksanaan: "BELUM_MULAI",
          updatedAt: { lt: fiveDaysAgo },
        },
        data: {
          statusUsulan: "KADALUARSA_OTOMATIS",
          status: "DITOLAK",
          catatanDpl:
            "Dibatalkan otomatis oleh sistem (H+5): Program kerja tidak dimulai dalam 5 hari setelah disetujui.",
        },
      })
      .catch(() => {});

    const list = await prisma.programKerjaKkn.findMany({
      where: whereClause,
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            cakupanRw: true,
            dpl: { select: { id: true, name: true, phone: true, nip: true } },
            students: {
              select: {
                id: true,
                nim: true,
                jurusan: true,
                isKetua: true,
                noWa: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            nim: true,
            jurusan: true,
            isKetua: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        reviewedBy: { select: { id: true, name: true } },
        _count: { select: { logbooks: true } },
      },
      orderBy: [{ nomor: "asc" }, { createdAt: "desc" }],
    });

    return list.map((item, index) => {
      const parsed = parseProkerDeskripsi(item.deskripsi);
      let judul = parsed.judul;
      let deskripsiDetail = parsed.deskripsi;
      let catatan = item.catatanDpl;
      const st = String(item.status);
      let u = (item as any).statusUsulan;
      if (!u) {
        if (
          st === "DITERIMA" ||
          st === "SEDANG_BERJALAN" ||
          st === "SELESAI" ||
          st === "APPROVED" ||
          st === "DISETUJUI"
        )
          u = "DISETUJUI";
        else if (st === "DITOLAK" || st === "REJECTED" || st === "TIDAK_DISETUJUI") u = "DITOLAK";
        else u = "BELUM_DISETUJUI";
      }
      let pl = (item as any).statusPelaksanaan;
      if (!pl) {
        if (st === "SELESAI") pl = "SELESAI";
        else if (
          st === "SEDANG_BERJALAN" ||
          st === "BERJALAN" ||
          st === "BERLANGSUNG" ||
          st === "SEDANG_BERLANGSUNG"
        )
          pl = "SEDANG_BERJALAN";
        else pl = "BELUM_MULAI";
      }

      const penginput = item.student
        ? {
            id: item.student.id,
            nama: item.student.user?.name || "Mahasiswa",
            nim: item.student.nim || "-",
            prodi: item.student.jurusan || "-",
            isKetua: Boolean(item.student.isKetua),
            phone: item.student.user?.phone || "-",
          }
        : null;

      return {
        id: item.id,
        kelompokId: item.kelompokId,
        kelompokNama: item.kelompok?.name || "Kelompok KKN",
        kelompokName: item.kelompok?.name || "Kelompok KKN",
        kelurahan: item.kelompok?.kelurahan || "-",
        cakupanRw: item.kelompok?.cakupanRw || [],
        dplName: item.kelompok?.dpl?.name || "-",
        dplPhone: item.kelompok?.dpl?.phone || "-",
        submittedAt: item.createdAt.toISOString(),
        nomor: item.nomor || index + 1,
        judul,
        deskripsi: deskripsiDetail,
        kategori: normalizeProkerKategori(item.kategori),
        sumber: item.sumber || "MAHASISWA",
        waktuPelaksanaan: item.waktuPelaksanaan || null,
        urlGoogleDrive: item.linkGoogleDrive || null,
        linkGoogleDrive: item.linkGoogleDrive || null,
        attachmentFile: item.attachmentFile || null,
        attachmentUrls: Array.isArray(item.attachmentUrls)
          ? item.attachmentUrls
          : item.attachmentFile
            ? [item.attachmentFile]
            : [],
        hasAttachment: Boolean(item.hasAttachment || item.attachmentFile || item.linkGoogleDrive),
        rencanaAnggaran: Number(item.kebutuhanBiaya) || 0,
        kebutuhanBiaya: Number(item.kebutuhanBiaya) || 0,
        status:
          st === "DITERIMA" ||
          st === "SEDANG_BERJALAN" ||
          st === "SELESAI" ||
          st === "APPROVED" ||
          st === "DISETUJUI"
            ? "APPROVED"
            : st === "DITOLAK"
              ? "REJECTED"
              : "PENDING",
        statusUsulan: u,
        statusPelaksanaan: pl,
        catatanDpl: catatan,
        reviewedByName: item.reviewedBy?.name || null,
        reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
        skorPenilaian: item.skorPenilaian ? Number(item.skorPenilaian) : null,
        predikat: item.predikat || null,
        statusPenilaian: item.statusPenilaian || "BELUM_DINILAI",
        evaluasiDpl: item.evaluasiDpl || null,
        aspekPenilaian: item.aspekPenilaian || null,
        totalLogbookTerkait: item._count?.logbooks || 0,
        penginput,
        tanggal: item.createdAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });
  }

  async getProgramKerjaById(userId: string, id: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, studentProfile: { include: { kelompok: true } } },
    });
    if (!user) throw new Error("User tidak ditemukan");

    const proker = await prisma.programKerjaKkn.findUnique({
      where: { id },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            cakupanRw: true,
            dpl: { select: { id: true, name: true, phone: true, nip: true } },
            students: {
              select: {
                id: true,
                nim: true,
                jurusan: true,
                isKetua: true,
                noWa: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            nim: true,
            jurusan: true,
            isKetua: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        reviewedBy: { select: { id: true, name: true } },
        logbooks: {
          select: {
            id: true,
            nomor: true,
            tanggalKegiatan: true,
            tempat: true,
            deskripsi: true,
            fotoBuktiUrl: true,
            statusApproval: true,
            penulis: { select: { id: true, name: true } },
          },
          orderBy: { tanggalKegiatan: "desc" },
        },
      },
    });

    if (!proker) throw new Error("Program kerja tidak ditemukan");

    const parsed = parseProkerDeskripsi(proker.deskripsi);
    const st = String(proker.status);
    let u = (proker as any).statusUsulan;
    if (!u) {
      if (
        st === "DITERIMA" ||
        st === "SEDANG_BERJALAN" ||
        st === "SELESAI" ||
        st === "APPROVED" ||
        st === "DISETUJUI"
      )
        u = "DISETUJUI";
      else if (st === "DITOLAK" || st === "REJECTED" || st === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }
    let pl = (proker as any).statusPelaksanaan;
    if (!pl) {
      if (st === "SELESAI") pl = "SELESAI";
      else if (
        st === "SEDANG_BERJALAN" ||
        st === "BERJALAN" ||
        st === "BERLANGSUNG" ||
        st === "SEDANG_BERLANGSUNG"
      )
        pl = "SEDANG_BERJALAN";
      else pl = "BELUM_MULAI";
    }

    const penginput = proker.student
      ? {
          id: proker.student.id,
          nama: proker.student.user?.name || "Mahasiswa",
          nim: proker.student.nim || "-",
          prodi: proker.student.jurusan || "-",
          isKetua: Boolean(proker.student.isKetua),
          phone: proker.student.user?.phone || "-",
        }
      : null;

    // Query seluruh data Logbook Pemanfaatan terkait proker ini
    const pemanfaatanWhere: any = {
      OR: [
        { programKerjaId: id },
        ...(proker.deskripsi ? [{ program: proker.deskripsi }] : []),
      ],
    };

    const pemanfaatanLogs = await prisma.pemanfaatan.findMany({
      where: pemanfaatanWhere,
      include: {
        rw: { select: { id: true, name: true, kelurahan: { select: { id: true, name: true } } } },
      },
      orderBy: { tanggalPencatatan: "desc" },
    });

    let totalBeratInputKg = 0;
    let totalBeratOutputKg = 0;
    let totalNilaiEkonomi = 0;

    const teknologiMap = new Map<
      string,
      {
        teknologi: string;
        totalBeratInputKg: number;
        totalBeratOutputKg: number;
        totalNilaiEkonomi: number;
        count: number;
      }
    >();

    const pemanfaatanEntries = pemanfaatanLogs.map((p) => {
      const beratInput = Number(p.volumeBahanBaku) || 0;
      const beratOutput = Number(p.hasil) || 0;
      const recordedEkonomi = Number(p.luasLahanM2) || 0;
      const nilaiEkonomi =
        recordedEkonomi > 0 && beratOutput > 0
          ? recordedEkonomi
          : calculateNilaiEkonomi(p.program, p.teknologi, beratOutput, p.unitHasil || "Kg");

      totalBeratInputKg += beratInput;
      totalBeratOutputKg += beratOutput;
      totalNilaiEkonomi += nilaiEkonomi;

      const cleanTek = p.teknologi ? p.teknologi.trim() : "Kompos Organik";
      if (!teknologiMap.has(cleanTek)) {
        teknologiMap.set(cleanTek, {
          teknologi: cleanTek,
          totalBeratInputKg: 0,
          totalBeratOutputKg: 0,
          totalNilaiEkonomi: 0,
          count: 0,
        });
      }

      const group = teknologiMap.get(cleanTek)!;
      group.totalBeratInputKg = Math.round((group.totalBeratInputKg + beratInput) * 100) / 100;
      group.totalBeratOutputKg = Math.round((group.totalBeratOutputKg + beratOutput) * 100) / 100;
      group.totalNilaiEkonomi += nilaiEkonomi;
      group.count += 1;

      return {
        id: p.id,
        nomorCaraPemanfaatan: p.nomorCaraPemanfaatan,
        teknologi: cleanTek,
        bahanBaku: p.bahanBaku || "Sampah Organik",
        beratInputKg: beratInput,
        volumeBahanBaku: beratInput,
        unitBahanBaku: p.unitBahanBaku || "Kg",
        beratOutputKg: beratOutput,
        hasil: beratOutput,
        unitHasil: p.unitHasil || "Kg",
        nilaiEkonomiRp: nilaiEkonomi,
        fotoDokumentasiUrl: p.fotoDokumentasiUrl,
        tanggalPencatatan: p.tanggalPencatatan
          ? p.tanggalPencatatan.toISOString()
          : p.createdAt.toISOString(),
        status: beratOutput > 0 ? "PANEN" : "PROSES",
        rwId: p.rwId,
        rwName: p.rw?.name || (p.rwId ? `RW ${p.rwId}` : "-"),
        kelurahanName: p.rw?.kelurahan?.name || "-",
      };
    });

    const perTeknologi = Array.from(teknologiMap.values());

    return {
      id: proker.id,
      kelompokId: proker.kelompokId,
      kelompokNama: proker.kelompok?.name || "Kelompok KKN",
      kelompokName: proker.kelompok?.name || "Kelompok KKN",
      kelurahan: proker.kelompok?.kelurahan || "-",
      cakupanRw: proker.kelompok?.cakupanRw || [],
      dplName: proker.kelompok?.dpl?.name || "-",
      dplPhone: proker.kelompok?.dpl?.phone || "-",
      submittedAt: proker.createdAt.toISOString(),
      nomor: proker.nomor || 1,
      judul: parsed.judul,
      deskripsi: parsed.deskripsi,
      kategori: normalizeProkerKategori(proker.kategori),
      sumber: proker.sumber || "MAHASISWA",
      waktuPelaksanaan: proker.waktuPelaksanaan || null,
      urlGoogleDrive: proker.linkGoogleDrive || null,
      linkGoogleDrive: proker.linkGoogleDrive || null,
      attachmentFile: proker.attachmentFile || null,
      attachmentUrls: Array.isArray(proker.attachmentUrls)
        ? proker.attachmentUrls
        : proker.attachmentFile
          ? [proker.attachmentFile]
          : [],
      hasAttachment: Boolean(
        proker.hasAttachment || proker.attachmentFile || proker.linkGoogleDrive
      ),
      rencanaAnggaran: Number(proker.kebutuhanBiaya) || 0,
      kebutuhanBiaya: Number(proker.kebutuhanBiaya) || 0,
      status:
        st === "DITERIMA" ||
        st === "SEDANG_BERJALAN" ||
        st === "SELESAI" ||
        st === "APPROVED" ||
        st === "DISETUJUI"
          ? "APPROVED"
          : st === "DITOLAK"
            ? "REJECTED"
            : "PENDING",
      statusUsulan: u,
      statusPelaksanaan: pl,
      catatanDpl: proker.catatanDpl || null,
      reviewedByName: proker.reviewedBy?.name || null,
      reviewedAt: proker.reviewedAt ? proker.reviewedAt.toISOString() : null,
      skorPenilaian: proker.skorPenilaian ? Number(proker.skorPenilaian) : null,
      predikat: proker.predikat || null,
      statusPenilaian: proker.statusPenilaian || "BELUM_DINILAI",
      evaluasiDpl: proker.evaluasiDpl || null,
      aspekPenilaian: proker.aspekPenilaian || null,
      totalLogbookTerkait: proker.logbooks?.length || 0,
      logbooks: (proker.logbooks || []).map((l) => ({
        id: l.id,
        nomor: l.nomor,
        tanggalKegiatan: l.tanggalKegiatan ? l.tanggalKegiatan.toISOString().split("T")[0] : "-",
        tempat: l.tempat,
        deskripsi: l.deskripsi,
        fotoBuktiUrl: l.fotoBuktiUrl,
        statusApproval: l.statusApproval,
        penulisNama: l.penulis?.name || "Mahasiswa",
      })),
      pemanfaatan: {
        totalBeratInputKg: Math.round(totalBeratInputKg * 100) / 100,
        totalBeratOutputKg: Math.round(totalBeratOutputKg * 100) / 100,
        totalNilaiEkonomi,
        totalEntri: pemanfaatanLogs.length,
        perTeknologi,
        entries: pemanfaatanEntries,
      },
      penginput,
      mahasiswaList: (proker.kelompok?.students || []).map((s) => ({
        id: s.id,
        nim: s.nim,
        name: s.user?.name,
        jurusan: s.jurusan,
        isKetua: Boolean(s.isKetua),
      })),
      createdAt: proker.createdAt.toISOString(),
      updatedAt: proker.updatedAt.toISOString(),
    };
  }

  async updateProgramKerja(userId: string, id: string, payload: any) {
    const proker = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!proker) throw new Error("Program kerja tidak ditemukan");

    const {
      judul,
      kategori,
      rencanaAnggaran,
      kebutuhanBiaya,
      targetTanggal,
      deskripsi,
      waktuPelaksanaan,
      urlGoogleDrive,
      linkGoogleDrive,
      attachmentFile,
      attachmentUrls,
      statusUsulan,
      statusPelaksanaan,
      status,
      nomor,
      catatanDpl,
    } = payload;

    const updateData: any = {};
    if (nomor !== undefined) updateData.nomor = Number(nomor);

    if (judul !== undefined || deskripsi !== undefined) {
      const existingParsed = parseProkerDeskripsi(proker.deskripsi);
      const newJudul =
        judul !== undefined ? String(judul).trim().replace(/\*\*/g, "") : existingParsed.judul;
      const newDesc =
        deskripsi !== undefined
          ? deskripsi.replace(/^\*\*.*?\*\*(?:\r?\n+)?/, "").trim()
          : existingParsed.deskripsi;
      updateData.deskripsi = newDesc ? `**${newJudul}**\n\n${newDesc}` : `**${newJudul}**`;
    }

    if (kategori !== undefined) updateData.kategori = normalizeProkerKategori(kategori);
    if (kebutuhanBiaya !== undefined) updateData.kebutuhanBiaya = Number(kebutuhanBiaya) || 0;
    else if (rencanaAnggaran !== undefined)
      updateData.kebutuhanBiaya = Number(rencanaAnggaran) || 0;

    if (targetTanggal !== undefined || waktuPelaksanaan !== undefined) {
      const execDate = targetTanggal || waktuPelaksanaan;
      updateData.waktuPelaksanaan = execDate ? String(execDate) : undefined;
    }
    const finalGoogleDriveUrl = urlGoogleDrive || linkGoogleDrive || attachmentFile;
    if (finalGoogleDriveUrl !== undefined) {
      updateData.linkGoogleDrive = finalGoogleDriveUrl;
    }
    if (attachmentFile !== undefined) {
      updateData.attachmentFile = attachmentFile;
      updateData.hasAttachment = true;
    }
    if (attachmentUrls !== undefined) {
      updateData.attachmentUrls = attachmentUrls;
      updateData.hasAttachment = true;
    }
    if (statusUsulan !== undefined) {
      updateData.statusUsulan = statusUsulan;
    }
    if (statusPelaksanaan !== undefined) {
      updateData.statusPelaksanaan = statusPelaksanaan;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (catatanDpl !== undefined) {
      updateData.catatanDpl = catatanDpl;
    }

    await prisma.programKerjaKkn.update({
      where: { id },
      data: updateData,
    });

    return await this.getProgramKerjaById(userId, id);
  }

  async deleteProgramKerja(userId: string, id: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, studentProfile: true },
    });
    if (!user) throw new Error("User tidak ditemukan");

    const proker = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!proker) throw new Error("Program kerja tidak ditemukan");

    const roleName = String(user.role?.name || "").toUpperCase();
    const isSuper = [
      "SUPER_USER",
      "DEVELOPER",
      "ADMIN_DLH",
      "DLH",
      "ADMIN",
      "PANITIA_TASKFORCE",
      "PEMIMPIN",
      "DPL",
      "DOSEN_PEMBIMBING",
    ].includes(roleName);

    const isStudentInKelompok = user.studentProfile?.kelompokId === proker.kelompokId;

    if (!isSuper && !isStudentInKelompok) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk menghapus program kerja ini.");
    }

    await prisma.programKerjaKkn.delete({
      where: { id },
    });

    return { success: true, message: "Program kerja berhasil dihapus", data: { id } };
  }

  async createLogbookPemanfaatan(userId: string, payload: any) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { assignedRw: true, kelompok: true, user: { select: { name: true } } },
    });
    if (!student) throw new Error("Mahasiswa tidak ditemukan");

    let targetRwId = student.assignedRwId;
    if (!targetRwId && student.kelompok?.kelurahan) {
      const rw = await prisma.rw.findFirst({
        where: { kelurahan: { name: { equals: student.kelompok.kelurahan, mode: "insensitive" } } },
        orderBy: { name: "asc" },
      });
      if (rw) targetRwId = rw.id;
    }
    targetRwId = targetRwId || 1;

    const { programKerjaId, fasilitasId, teknologi, bahanBaku, beratInputKg, fotoDokumentasiUrl } =
      payload;

    let programName = "LOGBOOK_HARIAN";

    // Validasi apakah proker ada dan disetujui
    if (programKerjaId) {
      const proker = await prisma.programKerjaKkn.findUnique({ where: { id: programKerjaId } });
      if (proker) {
        if (proker.statusUsulan === "BELUM_DISETUJUI" || proker.statusUsulan === "DITOLAK") {
          throw new Error(
            "Program kerja belum disetujui atau ditolak DPL, tidak bisa menambah logbook pemanfaatan."
          );
        }
        programName = proker.deskripsi || programName;
      }
    }

    let cleanTeknologi = teknologi || "Kompos Organik";
    let facilityName: string | null = null;
    let facilityType: string | null = null;

    if (fasilitasId) {
      const fasilitas = await prisma.facility.findUnique({ where: { id: fasilitasId } });
      if (fasilitas) {
        facilityName = fasilitas.nama;
        facilityType = fasilitas.jenis;
      }
    }

    const uniqueNo = `PEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const report = await prisma.pemanfaatan.create({
      data: {
        rwId: targetRwId,
        programKerjaId: programKerjaId || null,
        nomorCaraPemanfaatan: uniqueNo,
        program: programName,
        teknologi: cleanTeknologi,
        bahanBaku: bahanBaku || "Sampah Organik",
        volumeBahanBaku: Number(beratInputKg) || 0,
        unitBahanBaku: "Kg",
        hasil: 0, // Pilar 2: Hasil panen 0 karena baru pemrosesan awal
        unitHasil: "Kg",
        fotoDokumentasiUrl: fotoDokumentasiUrl || "/uploads/default-pemanfaatan.jpg",
        tanggalPencatatan: new Date(),
        jenisKomoditas: facilityName
          ? `${facilityName}${facilityType ? ` (${facilityType})` : ""}`
          : undefined,
      },
    });

    // Sinkronisasi otomatis ke Logbook KKN (Tabular & Approval 2-Tingkat)
    if (student.kelompokId) {
      try {
        const isKetua = Boolean(student.isKetua);
        const pekanKe = logbookService.calculatePekanKe(new Date(), student.startDate);
        const tempatKegiatan = facilityName
          ? `Fasilitas ${facilityName}${facilityType ? ` (${facilityType})` : ""}`
          : `RW ${targetRwId} (${student.assignedRw?.name || "Wilayah KKN"})`;

        await prisma.logbookKkn.create({
          data: {
            kelompokId: student.kelompokId,
            penulisId: userId,
            tanggalKegiatan: new Date(),
            tempat: tempatKegiatan,
            deskripsi: `Aksi Pemanfaatan Sampah: ${cleanTeknologi} di ${facilityName || "Fasilitas Komunal"} (${bahanBaku || "Sampah Organik"} - ${Number(beratInputKg) || 0} Kg)`,
            fotoBuktiUrl: fotoDokumentasiUrl || "/uploads/default-pemanfaatan.jpg",
            tipeAktivitas: "KELOMPOK",
            programKerjaId: programKerjaId || null,
            fasilitasId: fasilitasId || null,
            pekanKe,
            statusApproval: isKetua ? "MENUNGGU_VERIFIKASI_DPL" : "MENUNGGU_PERSETUJUAN_KETUA",
            disetujuiKetuaOlehId: isKetua ? userId : null,
            disetujuiKetuaPada: isKetua ? new Date() : null,
          },
        });
      } catch (err) {
        console.error("[kknService.createLogbookPemanfaatan] sync logbook_kkn error:", err);
      }
    }

    if (programKerjaId) {
      await prisma.programKerjaKkn
        .update({
          where: { id: programKerjaId },
          data: { statusPelaksanaan: "SEDANG_BERJALAN" },
        })
        .catch(() => {});
    }

    // Poin untuk seluruh anggota kelompok (+10 Poin)
    let memberUserIds: string[] = [userId];
    if (student.kelompokId) {
      const groupStudents = await prisma.studentKkn.findMany({
        where: { kelompokId: student.kelompokId },
        select: { userId: true },
      });
      const ids = groupStudents.map((s) => s.userId).filter(Boolean);
      if (ids.length > 0) {
        memberUserIds = Array.from(new Set(ids));
      }
    }

    const pointRecords = memberUserIds.map((uid) => ({
      userId: uid,
      points: 10,
      description: `Logbook Pemanfaatan: ${cleanTeknologi} [ReportID:${report.id}]`,
      kategori: "REDUKSI_TONASE",
    }));

    await prisma.pointHistory
      .createMany({
        data: pointRecords,
      })
      .catch((e) =>
        console.warn("[kknService.createLogbookPemanfaatan] pointHistory.createMany warning:", e)
      );

    // Notifikasi ke RW
    try {
      const rwUsers = await prisma.user.findMany({
        where: { rwId: targetRwId, role: { name: "RW" } },
      });
      if (rwUsers.length > 0) {
        const rwNotifs = rwUsers.map((rw) => ({
          userId: rw.id,
          title: "Laporan Pemanfaatan Sampah",
          message: `Mahasiswa KKN (${student.user?.name || "Mahasiswa"}) mencatat aksi pemanfaatan sampah: ${cleanTeknologi}.`,
        }));
        await prisma.notification.createMany({ data: rwNotifs });
      }
    } catch (err) {
      console.error("[kknService] Error notif RW:", err);
    }

    return report;
  }

  async deleteLogbookPemanfaatan(userId: string, id: string) {
    let existing = await prisma.pemanfaatan.findUnique({
      where: { id },
      include: { programKerja: true },
    });

    let matchedLogbook: any = null;
    if (!existing) {
      matchedLogbook = await prisma.logbookKkn.findUnique({
        where: { id },
        include: { programKerja: true },
      });
      if (matchedLogbook?.programKerjaId) {
        existing = await prisma.pemanfaatan.findFirst({
          where: { programKerjaId: matchedLogbook.programKerjaId },
          include: { programKerja: true },
        });
      }
    }

    if (!existing && !matchedLogbook) {
      throw new Error("Laporan pemanfaatan sampah tidak ditemukan.");
    }

    const targetId = existing?.id || id;

    // Rule 1: Tarik kembali (hapus) riwayat poin dari SELURUH anggota kelompok terkait ID laporan ini
    await prisma.pointHistory
      .deleteMany({
        where: {
          description: { contains: targetId },
        },
      })
      .catch((e) => console.warn("[deleteLogbookPemanfaatan] delete pointHistory warning:", e));

    if (matchedLogbook && matchedLogbook.id !== targetId) {
      await prisma.pointHistory
        .deleteMany({
          where: {
            description: { contains: matchedLogbook.id },
          },
        })
        .catch(() => {});
    }

    // Hapus logbookKkn jika ada
    if (matchedLogbook) {
      await prisma.logbookKkn.delete({ where: { id: matchedLogbook.id } }).catch(() => {});
    } else if (existing?.programKerjaId) {
      await prisma.logbookKkn
        .deleteMany({ where: { programKerjaId: existing.programKerjaId } })
        .catch(() => {});
    }

    // Hapus pemanfaatan record
    if (existing) {
      await prisma.pemanfaatan.delete({
        where: { id: existing.id },
      });
    }

    return {
      success: true,
      message: "Laporan pemanfaatan sampah berhasil dihapus.",
      data: { id: targetId },
    };
  }

  async updateLogbookPemanfaatan(_userId: string, id: string, payload: any) {
    // Check existing pemanfaatan
    let existing = await prisma.pemanfaatan.findUnique({
      where: { id },
      include: { programKerja: true },
    });

    // Fallback: if mobile passed logbookKkn id instead of pemanfaatan id
    let matchedLogbook: any = null;
    if (!existing) {
      matchedLogbook = await prisma.logbookKkn.findUnique({
        where: { id },
        include: { programKerja: true },
      });
      if (matchedLogbook?.programKerjaId) {
        existing = await prisma.pemanfaatan.findFirst({
          where: { programKerjaId: matchedLogbook.programKerjaId },
          include: { programKerja: true },
        });
      }
    }

    if (!existing && !matchedLogbook) {
      throw new Error("Logbook pemanfaatan sampah tidak ditemukan.");
    }

    const {
      programKerjaId,
      fasilitasId,
      jenisPemanfaatan,
      teknologi,
      kategoriSampah,
      bahanBaku,
      rwId,
      waktuPelaksanaan,
      tanggalPencatatan,
      volumeBahanBaku,
      beratInputKg,
      volumePanen,
      beratOutputKg,
      catatan,
      fotoDokumentasiUrl,
      foto,
      fotoBukti,
      program,
      namaProgram,
    } = payload;

    const updatePemanfaatanData: any = {};

    const cleanProgram = program || namaProgram;
    if (cleanProgram) {
      updatePemanfaatanData.program = cleanProgram;
    }

    const cleanTeknologi = jenisPemanfaatan || teknologi;
    if (cleanTeknologi) {
      updatePemanfaatanData.teknologi = cleanTeknologi;
    }

    const cleanBahanBaku = kategoriSampah || bahanBaku;
    if (cleanBahanBaku) {
      updatePemanfaatanData.bahanBaku = cleanBahanBaku;
    }

    const rawInputKg = beratInputKg !== undefined ? beratInputKg : volumeBahanBaku;
    if (rawInputKg !== undefined) {
      const numInput =
        typeof rawInputKg === "string"
          ? parseFloat(rawInputKg.replace(/[^\d.-]/g, ""))
          : Number(rawInputKg);
      if (!isNaN(numInput)) {
        updatePemanfaatanData.volumeBahanBaku = numInput;
      }
    }

    const rawOutputKg = beratOutputKg !== undefined ? beratOutputKg : volumePanen;
    if (rawOutputKg !== undefined && rawOutputKg !== null && rawOutputKg !== "") {
      const numOutput =
        typeof rawOutputKg === "string"
          ? parseFloat(rawOutputKg.replace(/[^\d.-]/g, ""))
          : Number(rawOutputKg);
      if (!isNaN(numOutput)) {
        updatePemanfaatanData.hasil = numOutput;
      }
    }

    const rawDate = waktuPelaksanaan || tanggalPencatatan;
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        updatePemanfaatanData.tanggalPencatatan = parsedDate;
      }
    }

    if (programKerjaId) {
      updatePemanfaatanData.programKerjaId = programKerjaId;
    }

    const finalFoto = fotoDokumentasiUrl || foto || fotoBukti;
    if (
      finalFoto &&
      typeof finalFoto === "string" &&
      finalFoto.trim() !== "" &&
      finalFoto !== "null"
    ) {
      updatePemanfaatanData.fotoDokumentasiUrl = finalFoto.trim();
    }

    if (rwId != null) {
      updatePemanfaatanData.rwId = Number(rwId);
    }

    let updatedPemanfaatan = null;
    if (existing) {
      updatedPemanfaatan = await prisma.pemanfaatan.update({
        where: { id: existing.id },
        data: updatePemanfaatanData,
      });
    }

    // Sync to logbookKkn if available
    const logbookTarget =
      matchedLogbook ||
      (existing?.programKerjaId
        ? await prisma.logbookKkn.findFirst({
            where: { programKerjaId: existing.programKerjaId },
            orderBy: { createdAt: "desc" },
          })
        : null);

    if (logbookTarget) {
      const logbookUpdate: any = {};
      if (updatePemanfaatanData.tanggalPencatatan) {
        logbookUpdate.tanggalKegiatan = updatePemanfaatanData.tanggalPencatatan;
      }
      if (updatePemanfaatanData.fotoDokumentasiUrl) {
        logbookUpdate.fotoBuktiUrl = updatePemanfaatanData.fotoDokumentasiUrl;
        logbookUpdate.attachmentUrls = [updatePemanfaatanData.fotoDokumentasiUrl];
      }
      if (catatan) {
        logbookUpdate.deskripsi = catatan;
      } else if (cleanTeknologi || rawInputKg !== undefined) {
        const inputVol =
          updatePemanfaatanData.volumeBahanBaku ??
          (existing ? Number(existing.volumeBahanBaku) : 0);
        logbookUpdate.deskripsi = `Aksi Pemanfaatan Sampah: ${cleanTeknologi || existing?.teknologi || "Kompos"} (${cleanBahanBaku || existing?.bahanBaku || "Sampah Organik"} - ${inputVol} Kg)`;
      }
      if (programKerjaId) {
        logbookUpdate.programKerjaId = programKerjaId;
      }
      if (fasilitasId) {
        logbookUpdate.fasilitasId = fasilitasId;
      }

      await prisma.logbookKkn
        .update({
          where: { id: logbookTarget.id },
          data: logbookUpdate,
        })
        .catch((e) => console.warn("[updateLogbookPemanfaatan] sync logbook warning:", e));
    }

    return {
      id: updatedPemanfaatan?.id || logbookTarget?.id,
      program: updatedPemanfaatan?.program || cleanProgram || existing?.program,
      teknologi: updatedPemanfaatan?.teknologi || cleanTeknologi,
      bahanBaku: updatedPemanfaatan?.bahanBaku || cleanBahanBaku,
      volumeBahanBaku: updatedPemanfaatan
        ? Number(updatedPemanfaatan.volumeBahanBaku)
        : Number(rawInputKg) || 0,
      hasil: updatedPemanfaatan ? Number(updatedPemanfaatan.hasil) : Number(rawOutputKg) || 0,
      fotoDokumentasiUrl: updatedPemanfaatan?.fotoDokumentasiUrl || finalFoto,
      tanggalPencatatan: updatedPemanfaatan?.tanggalPencatatan || new Date(),
    };
  }

  async getUnharvestedLogbooks(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { assignedRw: true, kelompok: true },
    });
    if (!student) throw new Error("Mahasiswa tidak ditemukan");

    let targetRwId = student.assignedRwId;
    if (!targetRwId && student.kelompok?.kelurahan) {
      const rw = await prisma.rw.findFirst({
        where: { kelurahan: { name: { equals: student.kelompok.kelurahan, mode: "insensitive" } } },
        orderBy: { name: "asc" },
      });
      if (rw) targetRwId = rw.id;
    }
    targetRwId = targetRwId || 1;

    // Ambil semua Pemanfaatan di RW mahasiswa yang belum dipanen (hasil == 0)
    // dan bukan berteknologi "PANEN"
    const logbooks = await prisma.pemanfaatan.findMany({
      where: {
        rwId: targetRwId,
        hasil: 0,
        NOT: { teknologi: "PANEN" },
      },
      orderBy: { tanggalPencatatan: "desc" },
    });

    return logbooks.map((l) => ({
      id: l.id,
      judul: `${l.program} (${l.tanggalPencatatan.toISOString().split("T")[0]})`,
      teknologi: l.teknologi,
    }));
  }

  async createPanenHasil(userId: string, payload: any) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { assignedRw: true, kelompok: true, user: { select: { name: true } } },
    });
    if (!student) throw new Error("Mahasiswa tidak ditemukan");

    let targetRwId = student.assignedRwId;
    if (!targetRwId && student.kelompok?.kelurahan) {
      const rw = await prisma.rw.findFirst({
        where: { kelurahan: { name: { equals: student.kelompok.kelurahan, mode: "insensitive" } } },
        orderBy: { name: "asc" },
      });
      if (rw) targetRwId = rw.id;
    }
    targetRwId = targetRwId || 1;

    // Mobile akan mengirim pemanfaatanId menggunakan key programKerjaId untuk kompatibilitas form lama
    // Kita baca dari pemanfaatanId atau programKerjaId
    const targetId = payload.pemanfaatanId || payload.programKerjaId || payload.id;
    const { beratOutputKg, nilaiEkonomiRp, fotoDokumentasiUrl } = payload;

    if (!targetId) {
      throw new Error("ID Logbook Pemanfaatan wajib diisi untuk mencatat panen.");
    }

    const existing = await prisma.pemanfaatan.findUnique({ where: { id: targetId } });
    if (!existing) {
      throw new Error("Laporan pemanfaatan tidak ditemukan atau tidak valid.");
    }

    const report = await prisma.pemanfaatan.update({
      where: { id: targetId },
      data: {
        hasil: Number(beratOutputKg) || 0,
        luasLahanM2: Number(nilaiEkonomiRp) || 0,
        // Update foto jika ada yang baru, jika tidak biarkan
        fotoDokumentasiUrl: fotoDokumentasiUrl || existing.fotoDokumentasiUrl,
      },
    });

    if (student.kelompokId && existing.program) {
      await prisma.programKerjaKkn
        .updateMany({
          where: {
            kelompokId: student.kelompokId,
            deskripsi: existing.program,
          },
          data: {
            statusPelaksanaan: "SELESAI",
          },
        })
        .catch((e) => console.error("Update proker SELESAI gagal:", e));
    }

    // Poin untuk seluruh anggota kelompok (+25 Poin)
    let memberUserIds: string[] = [userId];
    if (student.kelompokId) {
      const groupStudents = await prisma.studentKkn.findMany({
        where: { kelompokId: student.kelompokId },
        select: { userId: true },
      });
      const ids = groupStudents.map((s) => s.userId).filter(Boolean);
      if (ids.length > 0) {
        memberUserIds = Array.from(new Set(ids));
      }
    }

    const pointRecords = memberUserIds.map((uid) => ({
      userId: uid,
      points: 25,
      description: `Panen Hasil KKN [ReportID:${targetId}]`,
      kategori: "REDUKSI_TONASE",
    }));

    await prisma.pointHistory
      .createMany({
        data: pointRecords,
      })
      .catch((e) => console.warn("[createPanenHasil] pointHistory.createMany warning:", e));

    // Notifikasi ke RW
    try {
      const rwUsers = await prisma.user.findMany({
        where: { rwId: targetRwId, role: { name: "RW" } },
      });
      if (rwUsers.length > 0) {
        const rwNotifs = rwUsers.map((rw) => ({
          userId: rw.id,
          title: "Catat Hasil Panen",
          message: `Mahasiswa KKN (${student.user?.name || "Mahasiswa"}) mencatat hasil panen dari aksi pemanfaatan sampah.`,
        }));
        await prisma.notification.createMany({ data: rwNotifs });
      }
    } catch (err) {
      console.error("[kknService] Error notif RW:", err);
    }

    return report;
  }

  async updatePanenHasil(userId: string, id: string, payload: any) {
    const targetId = id || payload.pemanfaatanId || payload.id;
    let existing = await prisma.pemanfaatan.findUnique({ where: { id: targetId } });
    if (!existing) {
      const matchedLogbook = await prisma.logbookKkn.findUnique({
        where: { id: targetId },
      });
      if (matchedLogbook?.programKerjaId) {
        existing = await prisma.pemanfaatan.findFirst({
          where: { programKerjaId: matchedLogbook.programKerjaId },
        });
      }
    }

    if (!existing) {
      throw new Error("Laporan panen hasil tidak ditemukan.");
    }

    const {
      beratOutputKg,
      hasil,
      nilaiEkonomiRp,
      luasLahanM2,
      fotoDokumentasiUrl,
      foto,
      jenisKomoditas,
    } = payload;
    const updateData: any = {};

    const rawOutput = beratOutputKg !== undefined ? beratOutputKg : hasil;
    if (rawOutput !== undefined && rawOutput !== null && rawOutput !== "") {
      const numOutput =
        typeof rawOutput === "string"
          ? parseFloat(rawOutput.replace(/[^\d.-]/g, ""))
          : Number(rawOutput);
      if (!isNaN(numOutput)) {
        updateData.hasil = numOutput;
      }
    }

    const rawNilai = luasLahanM2 !== undefined ? luasLahanM2 : nilaiEkonomiRp;
    if (rawNilai !== undefined && rawNilai !== null && rawNilai !== "") {
      const numNilai =
        typeof rawNilai === "string"
          ? parseFloat(rawNilai.replace(/[^\d.-]/g, ""))
          : Number(rawNilai);
      if (!isNaN(numNilai)) {
        updateData.luasLahanM2 = numNilai;
      }
    }

    const finalFoto = fotoDokumentasiUrl || foto;
    if (
      finalFoto &&
      typeof finalFoto === "string" &&
      finalFoto.trim() !== "" &&
      finalFoto !== "null"
    ) {
      updateData.fotoDokumentasiUrl = finalFoto.trim();
    }

    if (jenisKomoditas !== undefined) {
      updateData.jenisKomoditas = jenisKomoditas;
    }

    // Rule 2: PUT/UPDATE murni hanya mengubah data teks, angka beban, dan foto. DILARANG mengubah PointHistory.
    const report = await prisma.pemanfaatan.update({
      where: { id: existing.id },
      data: updateData,
    });

    return report;
  }

  async deletePanenHasil(userId: string, id: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { kelompok: true },
    });

    const existing = await prisma.pemanfaatan.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Laporan panen hasil tidak ditemukan.");
    }

    // Reset hasil panen ke 0 dan nilai ekonomi ke 0 pada pemanfaatan record
    const report = await prisma.pemanfaatan.update({
      where: { id },
      data: {
        hasil: 0,
        luasLahanM2: 0,
      },
    });

    // Revert status proker dari SELESAI menjadi SEDANG_BERJALAN jika ada
    const targetKelompokId = student?.kelompokId;
    if (targetKelompokId && existing.program) {
      await prisma.programKerjaKkn
        .updateMany({
          where: {
            kelompokId: targetKelompokId,
            deskripsi: existing.program,
            statusPelaksanaan: "SELESAI",
          },
          data: {
            statusPelaksanaan: "SEDANG_BERJALAN",
          },
        })
        .catch(() => {});
    }

    // Rule 1: Tarik kembali (hapus) riwayat poin panen dari SELURUH anggota kelompok terkait ID laporan ini
    await prisma.pointHistory
      .deleteMany({
        where: {
          AND: [
            { description: { contains: id } },
            {
              OR: [{ description: { contains: "Panen" } }, { points: 25 }],
            },
          ],
        },
      })
      .catch((e) => console.warn("[deletePanenHasil] delete pointHistory warning:", e));

    return {
      success: true,
      message: "Hasil panen berhasil dihapus dan poin ditarik kembali.",
      data: report,
    };
  }

  async claimWargaMandiri(kknUserId: string, wargaId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validasi warga
      const warga = await tx.user.findUnique({
        where: { id: wargaId },
        select: { id: true, name: true, phone: true, address: true },
      });
      if (!warga) {
        throw new Error("WARGA_NOT_FOUND");
      }

      // 2. Cari tempat sampah aktif milik warga
      const bins = await tx.bin.findMany({
        where: {
          userId: wargaId,
          status: "ACTIVE_BOUND",
        },
        select: {
          id: true,
          qrCode: true,
          binType: true,
          status: true,
          registeredByStudentId: true,
        },
      });

      if (bins.length === 0) {
        throw new Error("NO_ACTIVE_BINS");
      }

      // 3. Filter bin yang belum terikat mahasiswa (mandiri)
      const unassignedBins = bins.filter((b) => b.registeredByStudentId === null);
      if (unassignedBins.length === 0) {
        throw new Error("ALREADY_CLAIMED");
      }

      const unassignedBinIds = unassignedBins.map((b) => b.id);

      // 4. Update Bin untuk menetapkan pendamping
      await tx.bin.updateMany({
        where: { id: { in: unassignedBinIds } },
        data: { registeredByStudentId: kknUserId },
      });

      // 5. Beri Poin Gamifikasi
      const points = 5;
      const pointDesc = `Mengklaim pendampingan warga mandiri: ${warga.name}`;
      await tx.pointHistory.create({
        data: {
          userId: kknUserId,
          points,
          description: pointDesc,
          kategori: "PARTISIPASI_STREAK",
        },
      });

      return {
        warga,
        claimedBinsCount: unassignedBins.length,
        claimedBins: unassignedBins.map(
          ({ registeredByStudentId: _registeredByStudentId, ...rest }) => rest
        ),
        gamification: {
          pointsEarned: points,
          category: "PARTISIPASI_STREAK",
          description: pointDesc,
        },
        claimedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Mengambil data batas geografis (Polygon/Radius) serta titik pusat posko
   * dari kelompok KKN mahasiswa yang sedang login.
   */
  async getWilayahKelompok(userId: string) {
    let student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: {
          include: {
            poskoKkn: true,
            facilities: {
              where: { jenis: "posko_kkn" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            schedules: {
              where: { isActive: true },
              orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            },
          },
        },
        assignedRw: {
          include: {
            kelurahan: true,
          },
        },
      },
    });

    let kelompok = student?.kelompok;

    if (!student || !kelompok) {
      // Check if admin / developer testing without direct student profile
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      const roleName = dbUser?.role?.name?.toUpperCase() || "";
      if (["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "ADMIN"].includes(roleName)) {
        kelompok = await prisma.kelompokKkn.findFirst({
          include: {
            poskoKkn: true,
            facilities: {
              where: { jenis: "posko_kkn" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            schedules: {
              where: { isActive: true },
              orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            },
          },
        });
      }
    }

    if (!kelompok) {
      throw new Error("KELOMPOK_NOT_FOUND");
    }

    // 1. Resolve Titik Pusat Posko
    let poskoLat: number = -6.8915; // default Coblong
    let poskoLng: number = 107.6107;

    if (kelompok.poskoKkn?.latitude != null && kelompok.poskoKkn?.longitude != null) {
      poskoLat = Number(kelompok.poskoKkn.latitude);
      poskoLng = Number(kelompok.poskoKkn.longitude);
    } else if (
      kelompok.facilities &&
      kelompok.facilities.length > 0 &&
      kelompok.facilities[0].latitude != null &&
      kelompok.facilities[0].longitude != null
    ) {
      poskoLat = Number(kelompok.facilities[0].latitude);
      poskoLng = Number(kelompok.facilities[0].longitude);
    } else if (
      kelompok.schedules &&
      kelompok.schedules.length > 0 &&
      kelompok.schedules[0].latitude != null &&
      kelompok.schedules[0].longitude != null
    ) {
      poskoLat = Number(kelompok.schedules[0].latitude);
      poskoLng = Number(kelompok.schedules[0].longitude);
    } else if (student?.assignedRw?.latitude != null && student?.assignedRw?.longitude != null) {
      poskoLat = Number(student.assignedRw.latitude);
      poskoLng = Number(student.assignedRw.longitude);
    } else {
      // Fallback berdasarkan kelurahan / nama kelompok
      const kel = (kelompok.kelurahan || kelompok.name || "").toLowerCase();
      if (kel.includes("dago")) {
        poskoLat = -6.8833;
        poskoLng = 107.6167;
      } else if (kel.includes("cipaganti")) {
        poskoLat = -6.8912;
        poskoLng = 107.6035;
      } else if (kel.includes("lebak gede") || kel.includes("lebakgede")) {
        poskoLat = -6.8875;
        poskoLng = 107.6133;
      } else if (kel.includes("lebak siliwangi")) {
        poskoLat = -6.8892;
        poskoLng = 107.6083;
      } else if (kel.includes("sadang serang")) {
        poskoLat = -6.8917;
        poskoLng = 107.625;
      } else if (kel.includes("sekeloa")) {
        poskoLat = -6.89;
        poskoLng = 107.62;
      } else if (kel.includes("cibiru")) {
        poskoLat = -6.914744;
        poskoLng = 107.60981;
      }
    }

    // 2. Resolve Batas Geografis (Polygon vs Radius)
    let polygonKoordinat: Array<{ lat: number; lng: number }> | null = null;
    let radiusMeters: number | null = null;
    let tipeArea: "POLYGON" | "RADIUS" = "RADIUS";

    const scheduleWithPolygon = kelompok.schedules?.find(
      (s) => s.polygon && parsePolygonCoordinates(s.polygon) !== null
    );

    if (scheduleWithPolygon?.polygon) {
      polygonKoordinat = parsePolygonCoordinates(scheduleWithPolygon.polygon);
    }

    if (polygonKoordinat && polygonKoordinat.length >= 3) {
      tipeArea = "POLYGON";
      radiusMeters = null;
    } else {
      tipeArea = "RADIUS";
      polygonKoordinat = null;
      const customPoskoRadius = kelompok.poskoKkn?.radius ? Number(kelompok.poskoKkn.radius) : null;
      const customScheduleRadius = kelompok.schedules?.[0]?.radius
        ? Number(kelompok.schedules[0].radius)
        : null;
      radiusMeters = customPoskoRadius || customScheduleRadius || 500;
    }

    return {
      kelompokId: kelompok.id,
      namaKelompok: kelompok.name,
      posko: {
        latitude: poskoLat,
        longitude: poskoLng,
      },
      tipeArea,
      polygonKoordinat,
      radiusMeters,
    };
  }
}

export function parsePolygonCoordinates(
  rawPolygon: any
): Array<{ lat: number; lng: number }> | null {
  if (!rawPolygon) return null;
  let parsed = rawPolygon;
  if (typeof rawPolygon === "string") {
    try {
      parsed = JSON.parse(rawPolygon);
    } catch {
      return null;
    }
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    parsed.type === "Polygon" &&
    Array.isArray(parsed.coordinates)
  ) {
    parsed = parsed.coordinates[0];
  }

  if (!Array.isArray(parsed) || parsed.length < 3) {
    return null;
  }

  const result: Array<{ lat: number; lng: number }> = [];
  for (const item of parsed) {
    if (item && typeof item === "object") {
      if (Array.isArray(item) && item.length >= 2) {
        const val0 = Number(item[0]);
        const val1 = Number(item[1]);
        if (!isNaN(val0) && !isNaN(val1)) {
          const lat = Math.abs(val0) > 45 ? val1 : val0;
          const lng = Math.abs(val0) > 45 ? val0 : val1;
          result.push({ lat, lng });
        }
      } else {
        const lat = Number(item.lat ?? item.latitude);
        const lng = Number(item.lng ?? item.longitude ?? item.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          result.push({ lat, lng });
        }
      }
    }
  }

  if (result.length >= 3) {
    return result;
  }
  return null;
}

export const kknService = new KknService();
