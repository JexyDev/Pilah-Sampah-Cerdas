import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
import { websocketService } from "./websocketService.js";

export class ResiduService {
  /**
   * Record a violation when citizen improperly sorts waste
   */
  async recordViolation(
    petugasUserId: string,
    data: {
      binQrCode: string;
      type: string;
      severity: string;
      evidencePhotoUrl: string;
      notes?: string;
    }
  ) {
    if (!data.evidencePhotoUrl && !data.binQrCode) {
      throw new Error("FOTO_BUKTI_DAN_QR_WAJIB");
    }

    const bin = await prisma.bin.findUnique({
      where: { qrCode: data.binQrCode },
      include: {
        binOwnerships: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    const ownerOwnership = bin.binOwnerships.find((o) => o.type === "UTAMA");
    const citizen = ownerOwnership?.user || bin.user;
    if (!citizen) {
      throw new Error("CITIZEN_NOT_FOUND_FOR_BIN");
    }

    // Retrieve penalty multiplier
    const basePenaltyStr = await configService.getConfig("residu_penalty_multiplier");
    const basePenalty = basePenaltyStr ? Math.abs(parseInt(basePenaltyStr, 10)) : 50;

    let multiplier = 1;
    if (data.severity === "MEDIUM" || data.severity === "SEDANG") multiplier = 2;
    if (data.severity === "SEVERE" || data.severity === "TINGGI") multiplier = 3;
    const pointsToDeduct = basePenalty * multiplier;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Violation record
      const violation = await tx.violation.create({
        data: {
          userId: citizen.id,
          binId: bin.id,
          petugasUserId,
          type: data.type,
          severity: data.severity,
          evidencePhotoUrl: data.evidencePhotoUrl || "/uploads/default-violation.jpg",
          notes: data.notes || null,
          pointsDeducted: pointsToDeduct,
        },
      });

      // 2. Deduct Citizen Points (Insert negative PointHistory)
      await tx.pointHistory.create({
        data: {
          userId: citizen.id,
          points: -pointsToDeduct,
          description: `Penalti pelanggaran residu tercampur (${data.severity}): ${data.type}`,
          kategori: "REDUKSI_TONASE",
        },
      });

      // 3. Create In-App Notification for Citizen
      await tx.notification.create({
        data: {
          userId: citizen.id,
          title: "Peringatan Pemilahan Sampah",
          message: `Ditemukan ketidakpatuhan pemilahan sampah (${data.type}) dengan tingkat keparahan ${data.severity}. Poin Anda dipotong ${pointsToDeduct}. Harap pilah sampah dengan benar demi kelestarian lingkungan.`,
        },
      });

      return violation;
    });

    // 4. Send WhatsApp warning (Mock)
    if (citizen.phone) {
      await notificationIntegrationService.sendWhatsApp(
        citizen.phone,
        `Halo ${citizen.name}, petugas residu mendeteksi residu tercampur di tempat sampah Anda (${data.type}). Mohon pastikan memilah sampah organik dan anorganik dengan benar. Poin Anda berkurang -${pointsToDeduct}.`
      );
    }

    return {
      id: result.id,
      violationId: result.id,
      status: "DIPROSES",
      severity: result.severity,
      type: result.type,
      pointsDeducted: result.pointsDeducted,
      createdAt: result.createdAt,
    };
  }

  /**
   * Get queue of pending logs (bins/deposits that need pickup/weighing by Petugas)
   */
  async getPendingLogs(petugasUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: {
        rw: { include: { kelurahan: true } },
        petugasProfile: true,
      },
    });

    let rwId = user?.rwId;
    if (!rwId) {
      const assignedRw = await prisma.rw.findFirst({
        where: { petugasResiduId: petugasUserId },
      });
      if (assignedRw) rwId = assignedRw.id;
    }

    // 1. Fetch pending automatic waste deposits
    const pendingSetorans = await prisma.setoranOtomatis.findMany({
      where: {
        status: { in: ["MENUNGGU_VERIFIKASI", "PENDING"] },
        ...(rwId ? { bin: { rwId } } : {}),
      },
      include: {
        bin: {
          include: {
            category: true,
            rw: { include: { kelurahan: true } },
            user: true,
          },
        },
        warga: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 2. Fetch pending bin reset / collection requests
    const pendingResets = await prisma.binResetRequest.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        ...(rwId ? { bin: { rwId } } : {}),
      },
      include: {
        bin: {
          include: {
            category: true,
            rw: { include: { kelurahan: true } },
          },
        },
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 3. Combine and format
    const results = [
      ...pendingSetorans.map((s) => ({
        id: s.id,
        logId: s.id,
        binId: s.qrTempatSampahId,
        bin: {
          id: s.bin.id,
          qrCode: s.bin.qrCode,
          status: s.bin.status,
          currentVolumeLiter: Number(s.bin.currentVolumeLiter),
          maxCapacityLiter: Number(s.bin.maxCapacityLiter),
          user: s.warga
            ? { id: s.warga.id, name: s.warga.name, address: s.warga.address }
            : s.bin.user
              ? { id: s.bin.user.id, name: s.bin.user.name, address: s.bin.user.address }
              : null,
          rw: s.bin.rw,
          category: s.bin.category,
        },
        wargaName: s.warga?.name || s.bin.user?.name || "Warga",
        address: s.warga?.address || s.bin.user?.address || "",
        volumeLiter: Number(s.bin.currentVolumeLiter),
        weightKg: Number(s.berat),
        aiClassification: s.hasilKlasifikasiAi || "Residu",
        aiConfidence: s.confidenceAi ? Number(s.confidenceAi) : null,
        geolocation: s.lokasiGps,
        evidencePhotoUrl: s.fotoSampahUrl,
        type: "SETORAN_OTOMATIS",
        status: s.status,
        createdAt: s.createdAt,
      })),
      ...pendingResets.map((r) => ({
        id: r.id,
        logId: r.id,
        binId: r.binId,
        bin: {
          id: r.bin.id,
          qrCode: r.bin.qrCode,
          status: r.bin.status,
          currentVolumeLiter: Number(r.bin.currentVolumeLiter),
          maxCapacityLiter: Number(r.bin.maxCapacityLiter),
          user: r.user ? { id: r.user.id, name: r.user.name, address: r.user.address } : null,
          rw: r.bin.rw,
          category: r.bin.category,
        },
        wargaName: r.user?.name || "Warga",
        address: r.user?.address || "",
        volumeLiter: Number(r.bin.currentVolumeLiter),
        weightKg: 0,
        aiClassification: r.bin.category?.name || "Residu",
        aiConfidence: null,
        geolocation: null,
        evidencePhotoUrl: r.evidencePhotoUrl,
        type: "PENGAJUAN_RESET",
        status: r.status,
        createdAt: r.createdAt,
      })),
    ];

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results;
  }

  async getDashboardSummary(petugasUserId: string, _period: string = "hari") {
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: {
        rw: {
          include: {
            kelurahan: true,
          },
        },
        petugasProfile: true,
      },
    });

    if (!user) {
      throw new Error("PETUGAS_NOT_FOUND");
    }

    let petugas = user.petugasProfile;
    if (!petugas) {
      petugas = await prisma.petugasResidu.create({
        data: {
          userId: petugasUserId,
          nama: user.name,
          noWa: user.phone || "-",
          whitelistStatus: "APPROVED",
          assignedZone: "Semua Zona",
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's setoran manual
    const todayLogs = await prisma.setoranManual.findMany({
      where: {
        petugasResiduId: petugasUserId,
        createdAt: { gte: today },
      },
    });

    // Monthly setoran manual
    const monthlyLogs = await prisma.setoranManual.findMany({
      where: {
        petugasResiduId: petugasUserId,
        createdAt: { gte: startOfMonth },
      },
    });

    const todayWeightKg = todayLogs.reduce((sum, item) => sum + Number(item.berat), 0);
    const monthlyWeightKg = monthlyLogs.reduce((sum, item) => sum + Number(item.berat), 0);
    const todayEntries = todayLogs.length;

    // Aggregate petugas points
    const pointsSum = await prisma.pointHistory.aggregate({
      where: { userId: petugasUserId },
      _sum: { points: true },
    });

    const pointRateConfig = await configService.getConfig("point_rate_per_kg");
    const pointRatePerKg = pointRateConfig ? parseInt(pointRateConfig, 10) : 2;

    const rtRwStr = user.rw?.name || petugas.assignedZone || "01/02";
    const kelurahanStr = user.rw?.kelurahan?.name || "Bojongsoang";
    const petugasIdStr = `PTR-${petugas.id.slice(0, 6).toUpperCase()}`;

    const totalViolationsToday = await prisma.violation.count({
      where: {
        petugasUserId,
        createdAt: { gte: today },
      },
    });

    const recentViolations = await prisma.violation.findMany({
      where: { petugasUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: true,
        bin: true,
      },
    });

    const totalJadwalCount = await prisma.bin.count();
    const totalJadwal = totalJadwalCount > 0 ? totalJadwalCount : 12;

    const zoneLabel =
      petugas.assignedZone || (rtRwStr ? `${rtRwStr}, Kel. ${kelurahanStr}` : "Kecamatan Coblong");

    return {
      // Mobile Flutter model exact keys
      petugasId: petugasIdStr,
      name: user.name,
      assignedZone: zoneLabel,
      totalJadwal,
      sudahDiambil: todayEntries,
      pelanggaranCount: totalViolationsToday,
      totalWeightKg: Number(todayWeightKg.toFixed(2)),
      ketepatanWaktuScore: Number(petugas.kpiScore) || 95,
      akurasiScore: 90,

      // Additional & legacy metadata for compatibility
      rw: rtRwStr,
      kelurahan: kelurahanStr,
      todayWeightKg: Number(todayWeightKg.toFixed(2)),
      monthlyWeightKg: Number(monthlyWeightKg.toFixed(2)),
      todayEntries,
      totalPoints: pointsSum._sum.points || 0,
      pointRatePerKg,
      kpiScore: Number(petugas.kpiScore),
      totalViolationsToday,
      tugasSelesaiHariIni: todayEntries,
      recentViolations: recentViolations.map((v) => ({
        id: v.id,
        wargaName: v.user.name,
        binCode: v.bin?.qrCode || "N/A",
        type: v.type,
        severity: v.severity,
        pointsDeducted: v.pointsDeducted,
        createdAt: v.createdAt,
      })),
    };
  }

  /**
   * Get all activities / history for Petugas Residu
   */
  async getRiwayat(petugasUserId: string, range?: string, type?: string) {
    const logs: any[] = [];

    // Date range filtering
    let dateFilter: any = undefined;
    if (range) {
      const now = new Date();
      if (range === "HARI_INI" || range === "hari") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { gte: start };
      } else if (range === "MINGGU_INI" || range === "minggu") {
        const start = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { gte: start };
      } else if (range === "BULAN_INI" || range === "bulan") {
        const start = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { gte: start };
      }
    }

    const typeUpper = (type || "SEMUA").toUpperCase();

    // 1. Fetch Violations (Pelanggaran)
    if (typeUpper === "SEMUA" || typeUpper === "PELANGGARAN") {
      const violations = await prisma.violation.findMany({
        where: {
          petugasUserId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: {
          user: true,
          bin: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      logs.push(
        ...violations.map((v) => ({
          id: v.id,
          logId: v.id,
          title: "Pelanggaran Timbangan",
          classification: v.type,
          kategori: v.type,
          binId: v.binId || "N/A",
          binCode: v.bin?.qrCode || "N/A",
          wargaName: v.user?.name || "Warga",
          weightKg: 0,
          actualWeightKg: 0,
          points: 0,
          latitude: null,
          longitude: null,
          status: "TERKIRIM",
          type: "PELANGGARAN",
          timestamp: v.createdAt.toISOString(),
          createdAt: v.createdAt.toISOString(),
        }))
      );
    }

    // 2. Fetch Setoran Manual (Input Petugas Residu Hilir)
    if (typeUpper === "SEMUA" || typeUpper === "SETORAN" || typeUpper === "TIMBANGAN") {
      const setoranManual = await prisma.setoranManual.findMany({
        where: {
          petugasResiduId: petugasUserId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { rw: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      logs.push(
        ...setoranManual.map((s) => {
          let lat: number | null = null,
            long: number | null = null;
          if (s.lokasiGps) {
            const parts = s.lokasiGps.split(",");
            if (parts.length === 2) {
              const pLat = parseFloat(parts[0].trim());
              const pLong = parseFloat(parts[1].trim());
              if (!isNaN(pLat)) lat = pLat;
              if (!isNaN(pLong)) long = pLong;
            }
          }
          return {
            id: s.id,
            logId: s.id,
            title: "Setoran Manual Residu",
            classification: s.kategori || "Residu",
            kategori: s.kategori || "Residu",
            binId: "GLOBAL_BIN",
            binCode: "Bin Global RT/RW",
            wargaName: "Global",
            weightKg: Number(s.berat),
            actualWeightKg: Number(s.berat),
            points: Number(s.berat) * 2 + (s.fotoResiduUrl ? 10 : 0),
            fotoResiduUrl: s.fotoResiduUrl,
            imagePhotoUrl: s.fotoResiduUrl,
            latitude: lat,
            longitude: long,
            status: "TERKIRIM",
            type: "SETORAN_MANUAL",
            timestamp: s.createdAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
          };
        })
      );
    }

    // 3. Fetch Handled Reset Requests
    if (typeUpper === "SEMUA" || typeUpper === "PENGAJUAN") {
      const handledResets = await prisma.binResetRequest.findMany({
        where: {
          reviewedById: petugasUserId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: {
          bin: { include: { category: true, rw: true } },
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      logs.push(
        ...handledResets.map((r) => ({
          id: r.id,
          logId: r.id,
          title: "Pengajuan Pengosongan Selesai",
          classification: r.bin?.category?.name || "Residu",
          kategori: r.bin?.category?.name || "Residu",
          binId: r.binId,
          binCode: r.bin?.qrCode || "N/A",
          wargaName: r.user?.name || "Warga",
          weightKg: Number(r.bin?.currentVolumeLiter || 0),
          actualWeightKg: Number(r.bin?.currentVolumeLiter || 0),
          points: 15,
          fotoResiduUrl: r.evidencePhotoUrl,
          imagePhotoUrl: r.evidencePhotoUrl,
          latitude: null,
          longitude: null,
          status: r.status,
          type: "PENGAJUAN_RESET",
          timestamp: r.createdAt.toISOString(),
          createdAt: r.createdAt.toISOString(),
        }))
      );
    }

    // 4. Fetch Point History
    if (typeUpper === "POIN" || typeUpper === "POINT") {
      const pointHistories = await prisma.pointHistory.findMany({
        where: {
          userId: petugasUserId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      logs.push(
        ...pointHistories.map((p) => ({
          id: p.id,
          logId: p.id,
          title: p.description || "Perolehan Poin Petugas",
          classification: p.kategori || "POIN",
          kategori: p.kategori || "POIN",
          binId: "N/A",
          binCode: "N/A",
          wargaName: "-",
          weightKg: 0,
          actualWeightKg: 0,
          points: p.points,
          latitude: null,
          longitude: null,
          status: "TERKIRIM",
          type: "POIN",
          timestamp: p.createdAt.toISOString(),
          createdAt: p.createdAt.toISOString(),
        }))
      );
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  }

  /**
   * Get point summary and ledger for Petugas Residu
   */
  async getPetugasPoints(petugasUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: { petugasProfile: true },
    });

    if (!user) throw new Error("PETUGAS_NOT_FOUND");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalPointsAgg = await prisma.pointHistory.aggregate({
      where: { userId: petugasUserId },
      _sum: { points: true },
    });

    const monthPointsAgg = await prisma.pointHistory.aggregate({
      where: {
        userId: petugasUserId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { points: true },
    });

    const todayPointsAgg = await prisma.pointHistory.aggregate({
      where: {
        userId: petugasUserId,
        createdAt: { gte: today },
      },
      _sum: { points: true },
    });

    const pointRateConfig = await configService.getConfig("point_rate_per_kg");
    const pointRatePerKg = pointRateConfig ? parseInt(pointRateConfig, 10) : 2;

    const history = await prisma.pointHistory.findMany({
      where: { userId: petugasUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      totalPoints: totalPointsAgg._sum.points || 0,
      pointsThisMonth: monthPointsAgg._sum.points || 0,
      pointsToday: todayPointsAgg._sum.points || 0,
      pointRatePerKg,
      kpiScore: user.petugasProfile?.kpiScore ? Number(user.petugasProfile.kpiScore) : 100,
      history,
    };
  }

  /**
   * Get analytics scoped to the logged in officer
   */
  async getAnalytics(petugasUserId?: string) {
    const today = new Date();
    const trend = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const sum = await prisma.setoranManual.aggregate({
        where: {
          ...(petugasUserId ? { petugasResiduId: petugasUserId } : {}),
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { berat: true },
      });

      trend.push({
        date: dayNames[startOfDay.getDay()],
        weightKg: Number(sum._sum.berat || 0),
      });
    }

    const allRw = await prisma.rw.findMany({
      include: { kelurahan: true },
      take: 8,
    });

    const zones = await Promise.all(
      allRw.map(async (rw) => {
        const violationsCount = await prisma.violation.count({
          where: { bin: { rwId: rw.id } },
        });

        const complianceScore = Math.max(0, 100 - violationsCount * 5);

        return {
          id: rw.id,
          region: `${rw.name} ${rw.kelurahan?.name ? rw.kelurahan.name : ""}`,
          complianceScore,
          violationsCount,
        };
      })
    );

    return {
      trend,
      zones,
    };
  }

  /**
   * Submit manual scale weigh log
   */
  async submitLog(
    petugasUserId: string,
    data: {
      actualWeightKg: number | string;
      classification?: string;
      imagePhotoUrl?: string;
      rw?: string;
      kelurahan?: string;
      notes?: string;
      logId?: string;
      binId?: string;
      latitude?: number | string;
      longitude?: number | string;
    }
  ) {
    const weightKg = Number(data.actualWeightKg) || 0;
    if (weightKg <= 0 || weightKg > 500) {
      throw new Error("Timbangan tidak valid. Harap masukkan angka antara 0.1 kg hingga 500 kg.");
    }
    const user = await prisma.user.findUnique({
      where: { id: petugasUserId },
      include: { rw: true, petugasProfile: true },
    });

    if (!user) throw new Error("PETUGAS_NOT_FOUND");

    let targetRwId = user.rwId;

    if (!targetRwId) {
      const assignedRw = await prisma.rw.findFirst({
        where: { petugasResiduId: petugasUserId },
      });
      if (assignedRw) {
        targetRwId = assignedRw.id;
      }
    }

    if (!targetRwId && data.rw) {
      const foundRw = await prisma.rw.findFirst({
        where: { name: { contains: data.rw } },
      });
      if (foundRw) targetRwId = foundRw.id;
    }

    if (!targetRwId) {
      const firstRw = await prisma.rw.findFirst();
      if (firstRw) {
        targetRwId = firstRw.id;
      } else {
        throw new Error("NO_RW_AREA_ASSIGNED");
      }
    }

    const lokasiGps =
      data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : null;

    const pointRateConfig = await configService.getConfig("point_rate_per_kg");
    const pointRatePerKg = pointRateConfig ? parseInt(pointRateConfig, 10) : 2;
    const pointsEarned = Math.round(weightKg * pointRatePerKg) + (data.imagePhotoUrl ? 10 : 0);

    const setoran = await prisma.setoranManual.create({
      data: {
        petugasResiduId: petugasUserId,
        diinputOleh: user.name,
        rwId: targetRwId,
        fotoResiduUrl: data.imagePhotoUrl || "/uploads/default-residu.jpg",
        berat: weightKg,
        unit: "Kg",
        kategori: data.classification || "Residu",
        lokasiGps: lokasiGps,
      },
    });

    if (pointsEarned > 0) {
      await prisma.pointHistory.create({
        data: {
          userId: petugasUserId,
          points: pointsEarned,
          description: `Setoran timbangan residu global: ${weightKg} kg`,
          kategori: "SUBMIT_RESIDU",
        },
      });
    }

    // In-App Server Notification for Petugas Residu
    await prisma.notification.create({
      data: {
        userId: petugasUserId,
        title: "Log Timbangan Berhasil Disimpan",
        message: `Log timbangan seberat ${weightKg} kg (${data.classification || "Residu"}) berhasil dicatat. Poin diperoleh: +${pointsEarned}.`,
      },
    });

    // Realtime websocket broadcast
    websocketService.broadcastPetugasNotification(petugasUserId, {
      title: "Log Timbangan Berhasil Disimpan",
      message: `Log timbangan seberat ${weightKg} kg (${data.classification || "Residu"}) berhasil dicatat.`,
      logId: setoran.id,
      weightKg,
      points: pointsEarned,
    });

    const globalSum = await prisma.setoranManual.aggregate({
      _sum: { berat: true },
    });
    const globalBinTotalKg = Number(globalSum._sum.berat || 0);

    const latNum = data.latitude ? parseFloat(String(data.latitude)) : null;
    const longNum = data.longitude ? parseFloat(String(data.longitude)) : null;

    return {
      logId: setoran.id,
      id: setoran.id,
      userId: petugasUserId,
      petugasUserId: petugasUserId,
      berat: weightKg,
      weightKg: Number(weightKg.toFixed(2)),
      classification: data.classification || "Residu",
      kategori: data.classification || "Residu",
      lokasiGps: lokasiGps,
      latitude: latNum,
      longitude: longNum,
      pointsEarned,
      points: pointsEarned,
      globalBinTotalKg: Number(globalBinTotalKg.toFixed(2)),
      kpiScore: (user.petugasProfile?.kpiScore
        ? Number(user.petugasProfile.kpiScore)
        : 100
      ).toFixed(2),
      isPunctual: true,
      discrepancyStatus: "NONE",
      status: "TERKIRIM",
      timestamp: setoran.createdAt.toISOString(),
    };
  }

  async getPengajuanResetBin() {
    return prisma.binResetRequest.findMany({
      where: { status: "PENDING" },
      include: {
        bin: { include: { category: true, rw: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptPengajuanResetBin(id: string, petugasUserId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.binResetRequest.findUnique({
        where: { id },
        include: { bin: true },
      });

      if (!request) {
        throw new Error("PENGAJUAN_NOT_FOUND");
      }

      if (request.status !== "PENDING") {
        throw new Error("PERMINTAAN_SUDAH_DIAMBIL");
      }

      const updated = await tx.binResetRequest.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          reviewedById: petugasUserId,
        },
      });

      // Reward poin untuk Petugas saat memvalidasi / menyetujui pengajuan pengosongan
      await tx.pointHistory.create({
        data: {
          userId: petugasUserId,
          points: 15,
          description: `Reward validasi pengosongan tempat sampah (${request.bin?.qrCode || id})`,
          kategori: "VALIDASI_PENGOSONGAN",
          redeemable: false,
        },
      });

      return updated;
    });
  }
}

export const residuService = new ResiduService();
