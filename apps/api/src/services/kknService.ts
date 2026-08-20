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
import { calculateDistance } from "./kknAttendanceService.js";


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
        maxLimit,
      },
      // Backward compatibility aliases
      nim: student?.nim || (isSuperOrAdmin ? "ADMIN" : "10123000"),
      jurusan: student?.jurusan || (isSuperOrAdmin ? "Monitoring Wilayah" : "Teknik Lingkungan"),
      totalRegisteredBins: totalRegistered,
      remainingQuota,
      progressPct,
      contributionPoints,
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

      const groupStudentUserIds = studentProfile?.kelompok?.students.map((s) => s.userId) || [kknUserId];

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
      where: whereBin,
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
            setoranOtomatis: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    let list = bins.map((b) => {
      const u = b.user;
      if (!u) return null;

      const household = u.households?.[0];
      const lat = b.latitude
        ? Number(b.latitude)
        : household?.latitude
          ? Number(household.latitude)
          : u.rw?.latitude
            ? Number(u.rw.latitude)
            : -6.891234;
      const lng = b.longitude
        ? Number(b.longitude)
        : household?.longitude
          ? Number(household.longitude)
          : u.rw?.longitude
            ? Number(u.rw.longitude)
            : 107.610123;

      const setoranLogs = u.setoranOtomatis || [];
      const totalKg = setoranLogs.reduce((acc, curr) => acc + Number(curr.berat || 0), 0);
      const totalPoin = u.pointHistory?.reduce((acc, curr) => acc + Number(curr.points || 0), 0) || Math.round(totalKg * 10);

      const recentLogs = setoranLogs.slice(0, 5).map((log: any) => ({
        weightKg: Number(log.berat || 0),
        category: log.hasilKlasifikasiAi === "organik" ? "Organik" : b.category?.name || "Anorganik",
        isCorrect: true,
      }));

      return {
        id: u.id,
        wargaId: u.id,
        binId: b.qrCode,
        binCode: b.qrCode,
        wargaName: u.name,
        name: u.name,
        phone: u.phone,
        address: u.address || (u.rw?.name ? `RW ${u.rw.name}, ${u.rw.kelurahan?.name || ""}` : "Alamat tercatat"),
        latitude: lat,
        longitude: lng,
        lat: lat,
        lng: lng,
        category: b.category?.name || "Organik",
        totalKg: Math.round(totalKg * 10) / 10,
        totalPoin,
        totalPoints: totalPoin,
        isActivated: true,
        recentLogs,
        rwId: u.rwId,
        registeredByStudent: b.registeredByStudent?.name || "Mahasiswa KKN",
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
    const warga = (await prisma.user.findUnique({
      where: { id: wargaId },
      include: {
        rw: true,
        setoranOtomatis: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { bin: true },
        },
        binOwnerships: {
          include: {
            bin: {
              include: { category: true },
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

    // Non-blocking scoping check: Allow viewing Warga details for KKN monitoring
    if (!isSuperOrAdmin) {
      // Optional logger for PIC trace
    }

    const household = warga.households?.[0];
    const defaultBin = warga.binOwnerships[0]?.bin;
    const lat = household?.latitude
      ? Number(household.latitude)
      : defaultBin?.latitude
        ? Number(defaultBin.latitude)
        : warga.rw?.latitude
          ? Number(warga.rw.latitude)
          : -6.891234;
    const lng = household?.longitude
      ? Number(household.longitude)
      : defaultBin?.longitude
        ? Number(defaultBin.longitude)
        : warga.rw?.longitude
          ? Number(warga.rw.longitude)
          : 107.610123;

    const recentLogs =
      warga.setoranOtomatis.map((log: any) => ({
        id: log.id,
        weightKg: Number(log.berat),
        volumeLiter: 0,
        category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
        createdAt: log.createdAt,
      })) || [];

    return {
      wargaId: warga.id,
      id: warga.id,
      name: warga.name,
      wargaName: warga.name,
      email: warga.email,
      phone: warga.phone,
      address: household?.address || warga.address || "Alamat belum diisi",
      rw: warga.rw?.name || "Belum diset",
      latitude: lat,
      longitude: lng,
      lat: lat,
      lng: lng,
      bin: defaultBin
        ? {
            qrCode: defaultBin.qrCode,
            category: defaultBin.category?.name || "UMUM",
            capacity: `${defaultBin.currentVolumeLiter}L / ${defaultBin.maxCapacityLiter}L`,
          }
        : null,
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

    if (!isSuperOrAdmin && !targetRwId && !targetKelurahan) {
      const student = await prisma.studentKkn.findUnique({
        where: { userId: kknUserId },
        include: {
          assignedRw: {
            include: { kelurahan: true },
          },
          user: true,
        },
      });

      if (student?.assignedRw) {
        targetRwId = student.assignedRw.id;
        targetKelurahan = student.assignedRw.kelurahan?.name;
      } else if (student?.user?.rwId) {
        targetRwId = student.user.rwId;
      }
    }

    const where: any = { role: { name: "WARGA" } };

    if (targetRwId || targetKelurahan) {
      const orConditions: any[] = [];
      if (targetRwId) {
        orConditions.push({ rwId: targetRwId });
        orConditions.push({ households: { some: { rwId: targetRwId } } });
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
      }
      where.OR = orConditions;
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
        binOwnerships: { include: { bin: { include: { category: true, qrBatch: true } } } },
        setoranOtomatis: { take: 5, orderBy: { createdAt: "desc" } },
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
      const totalKg = setoranLogs.reduce((acc: number, curr: any) => acc + Number(curr.berat || 0), 0);
      const totalPoin = w.pointHistory?.reduce((acc: number, curr: any) => acc + Number(curr.points || 0), 0) || Math.round(totalKg * 10);

      const binOrganik = w.binOwnerships?.find(
        (bo: any) =>
          bo.bin?.category?.name === "ORGANIC" ||
          bo.bin?.qrCode?.toLowerCase().includes("org") ||
          bo.bin?.qrCode?.toLowerCase().includes("1")
      )?.bin;

      const binAnorganik = w.binOwnerships?.find(
        (bo: any) =>
          bo.bin?.category?.name === "NON_ORGANIC" ||
          bo.bin?.qrCode?.toLowerCase().includes("anorg") ||
          bo.bin?.qrCode?.toLowerCase().includes("2")
      )?.bin;

      const primaryBin = w.binOwnerships?.[0]?.bin;

      const isActivated =
        w.binOwnerships?.some(
          (bo: any) => bo.bin?.status === "ACTIVE_BOUND" || bo.bin?.status === "PENDING_APPROVAL"
        ) || false;

      const registeredStudentId =
        primaryBin?.registeredByStudentId ||
        primaryBin?.qrBatch?.assignedPicUserId ||
        binOrganik?.registeredByStudentId ||
        binAnorganik?.registeredByStudentId ||
        null;

      const recentLogs = w.setoranOtomatis.map((log: any) => ({
        date: new Date(log.createdAt).toISOString().split("T")[0],
        wasteType: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
        weightKg: Number(log.berat),
      }));

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
          household?.address ||
          w.address ||
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
        isActivated,
        mahasiswaId: registeredStudentId,
        binOrganikId:
          binOrganik?.qrCode ||
          (primaryBin?.category?.name === "ORGANIC" ? primaryBin.qrCode : null),
        binAnorganikId:
          binAnorganik?.qrCode ||
          (primaryBin?.category?.name === "NON_ORGANIC" ? primaryBin.qrCode : null),
        needsReeducation: false,
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
        OR: [
          { phone: inputWargaId },
          { phone: formatPhoneNumber(inputWargaId) },
        ],
      },
    });
    if (targetUser) return targetUser;

    throw new Error(`Pengguna Warga dengan ID/Nomor '${inputWargaId}' tidak ditemukan di sistem. Silakan pastikan Warga sudah terdaftar.`);
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
        if (bin.userId && bin.userId !== wargaId && ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(bin.status)) {
          throw new Error("Tempat sampah ini sudah dimiliki oleh warga lain dan tidak bisa diklaim ulang.");
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
        await tx.household.create({
          data: {
            userId: wargaId,
            address: targetWarga.address || "Bandung, Jawa Barat",
            rwId: targetWarga.rwId || 1,
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
          const isAnorg = lower.includes("anorganik") || lower.includes("anorg");
          const isOrg = !isAnorg && (lower.includes("organik") || lower.includes("org"));
          let category = await tx.wasteCategory.findFirst({
            where: { name: isOrg ? "ORGANIC" : "NON_ORGANIC" },
          });
          if (!category) category = await tx.wasteCategory.findFirst();

          const newBin = await tx.bin.create({
            data: {
              qrCode: mCode.startsWith("TS-") ? mCode : `TS-${mCode}`,
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
        if (bin.userId && bin.userId !== wargaId && ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(bin.status)) {
          throw new Error(`Tempat sampah ${bin.qrCode} sudah dimiliki oleh warga lain dan tidak bisa diklaim ulang.`);
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
        await tx.household.create({
          data: {
            userId: wargaId,
            address: targetWarga.address || "Bandung, Jawa Barat",
            rwId: targetWarga.rwId || 1,
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
      userId: string;
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

      if (!isNaN(numRw)) {
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
      } catch (_) {}
    }
    if (!targetRwId) {
      const firstRw = await prisma.rw.findFirst();
      targetRwId = firstRw?.id || 1;
    }

    const picName = wargaUser ? wargaUser.name : (data.userId || "Warga Binaan");
    const kontakPhone = wargaUser ? wargaUser.phone || "-" : "-";
    const alamatLokasi = data.alamat || (wargaUser ? wargaUser.address || "-" : "-");

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
        statusApproval: "PENDING",
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
      const latVal = data.latitude !== undefined && data.latitude !== null
        ? Number(data.latitude)
        : data.lat !== undefined && data.lat !== null
        ? Number(data.lat)
        : -6.8903;
      const lngVal = data.longitude !== undefined && data.longitude !== null
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
        const isAnorg = qrLower.includes("anorganik") || qrLower.includes("non_organic") || qrLower.includes("anorg");
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
          if (bin.userId && bin.userId !== warga.id && ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(bin.status)) {
            throw new Error(`Tempat sampah ${bin.qrCode} sudah dimiliki oleh warga lain dan tidak bisa diklaim ulang.`);
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

  async registerPoskoKkn(
    userId: string,
    payload: {
      nama?: string;
      alamat?: string;
      rwId?: number;
      latitude: number;
      longitude: number;
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

    if (!student.isKetua) {
      const err: any = new Error("Akses ditolak: Hanya Ketua Kelompok KKN yang berhak mendaftarkan atau memperbarui lokasi posko.");
      err.statusCode = 403;
      throw err;
    }

    const lat = Number(payload.latitude);
    const lng = Number(payload.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      throw new Error("Koordinat GPS lokasi HP (latitude & longitude) wajib valid dan tidak boleh kosong.");
    }

    // Overlap Proximity Check: Tidak boleh berdekatan < 30 meter dari posko kelompok lain
    const otherPoskos = await prisma.facility.findMany({
      where: {
        jenis: "posko_kkn",
        kelompokId: { not: student.kelompokId },
        statusApproval: { in: ["APPROVED", "PENDING"] },
      },
    });

    const R = 6371e3;
    for (const op of otherPoskos) {
      const phi1 = (lat * Math.PI) / 180;
      const phi2 = (Number(op.latitude) * Math.PI) / 180;
      const deltaPhi = ((Number(op.latitude) - lat) * Math.PI) / 180;
      const deltaLambda = ((Number(op.longitude) - lng) * Math.PI) / 180;
      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (dist < 30) {
        throw new Error(
          `Titik lokasi Posko bertabrakan dengan ${op.nama} (jarak hanya ${Math.round(dist)} meter). Mohon geser titik koordinat agar tidak menumpuk antar kelompok.`
        );
      }
    }

    let targetRwId = payload.rwId || student.assignedRwId || student.user.rwId;
    if (!targetRwId && student.kelompok.cakupanRw) {
      try {
        const parsed = typeof student.kelompok.cakupanRw === "string" ? JSON.parse(student.kelompok.cakupanRw) : student.kelompok.cakupanRw;
        if (Array.isArray(parsed) && parsed.length > 0) targetRwId = Number(parsed[0]);
      } catch (_) {}
    }
    if (!targetRwId) {
      const firstRw = await prisma.rw.findFirst();
      targetRwId = firstRw?.id || 1;
    }

    const existingPosko = await prisma.facility.findFirst({
      where: {
        kelompokId: student.kelompokId,
        jenis: "posko_kkn",
      },
    });

    const poskoName = payload.nama || `Posko KKN ${student.kelompok.name}`;
    const picName = `${student.user.name} (${student.nim || "Ketua Kelompok"})`;
    const kontak = student.noWa || student.user.phone || "-";

    let posko;
    if (existingPosko) {
      posko = await prisma.facility.update({
        where: { id: existingPosko.id },
        data: {
          nama: poskoName,
          alamat: payload.alamat || existingPosko.alamat,
          rwId: targetRwId,
          latitude: lat,
          longitude: lng,
          foto: payload.foto || existingPosko.foto,
          pic: picName,
          kontak,
          statusApproval: "PENDING",
        },
      });
    } else {
      posko = await prisma.facility.create({
        data: {
          nama: poskoName,
          jenis: "posko_kkn",
          alamat: payload.alamat,
          rwId: targetRwId,
          kelompokId: student.kelompokId,
          latitude: lat,
          longitude: lng,
          foto: payload.foto,
          pic: picName,
          kontak,
          statusApproval: "PENDING",
        },
      });
    }

    // Kirim notifikasi ke Ketua RW terkait
    if (targetRwId) {
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
            title: "Pengajuan Posko KKN Baru",
            message: `Kelompok ${student.kelompok.name} mengajukan titik Posko KKN di wilayah RW Anda dan menunggu verifikasi.`,
          },
        });
      }
    }

    await prisma.auditTrail.create({
      data: {
        userId,
        action: "REGISTER_POSKO_KKN",
        newValue: {
          poskoId: posko.id,
          kelompokId: student.kelompokId,
          latitude: lat,
          longitude: lng,
          status: "PENDING",
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

    const posko = await prisma.facility.findFirst({
      where: {
        kelompokId: student.kelompokId,
        jenis: "posko_kkn",
      },
      include: { rw: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      posko,
      isUserLeader: Boolean(student.isKetua),
      kelompokId: student.kelompokId,
    };
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
      (student.assignedRw?.name ? `RW ${student.assignedRw.name}` : `Kel. ${group.kelurahan || "Coblong"}`);
    const poskoStatus = registeredPosko?.statusApproval || "UNREGISTERED";

    return {
      groupId: group.id,
      groupName: group.name,
      dosenPembimbing: group.dpl?.name || "Dr. Ir. Ahmad Sudrajat, M.T.",
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
      radiusMeter: 100,
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
    }
  ) {
    let targetDate = payload.tanggalKegiatanTerkait
      ? new Date(payload.tanggalKegiatanTerkait)
      : new Date();

    if (isNaN(targetDate.getTime())) {
      targetDate = new Date();
    }

    if (payload.scheduleId) {
      try {
        const schedule = await prisma.schedule.findUnique({
          where: { id: payload.scheduleId },
        });
        if (schedule && schedule.date) {
          targetDate = new Date(schedule.date);
        }
      } catch (schErr) {
        console.warn("[createLeaveRequest] Schedule lookup fallback:", schErr);
      }
    }

    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // 🎯 VALIDASI ANTI-TUMPUK (1 Hari/Pertemuan = 1 Status Pengajuan)
    const studentProfile = await prisma.studentKkn.findFirst({
      where: { OR: [{ userId: studentId }, { id: studentId }] },
      include: { kelompok: { include: { dpl: true } }, user: true },
    });
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
        throw new Error("Pengajuan izin untuk tanggal ini sudah disetujui. Silakan ajukan pembatalan jika ingin hadir.");
      }
      if (existingLeave.status === "CANCEL_REQUESTED") {
        throw new Error("Permohonan pembatalan izin Anda sedang menunggu konfirmasi DPL.");
      }
    }

    const leaveType = (payload.kategori || "IZIN").toUpperCase().includes("SAKIT")
      ? "SAKIT"
      : "IZIN";

    const leave = await (prisma as any).studentLeaveRequest.create({
      data: {
        studentId,
        type: leaveType,
        reason: payload.deskripsi || "Berhalangan hadir kegiatan KKN",
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
      console.warn("[createLeaveRequest] Background DPL notification warning (non-critical):", notifErr);
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
    const validIds = new Set([studentId, studentProfile?.userId, studentProfile?.id].filter(Boolean));
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
        message: "Pengajuan izin berhasil dibatalkan. Anda dapat melakukan presensi kehadiran normal.",
        data: updated,
      };
    }

    // Skenario B: Sudah APPROVED -> Mengajukan permohonan pembatalan ke DPL
    if (leave.status === "APPROVED") {
      const updated = await (prisma as any).studentLeaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: "CANCEL_REQUESTED",
          rejectionReason: reason || "Mahasiswa mengajukan pembatalan izin untuk hadir pada kegiatan",
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
        message: "Permohonan pembatalan izin telah dikirimkan ke DPL. Menunggu konfirmasi DPL untuk pengubahan status kehadiran.",
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

    const report = await prisma.pemanfaatan.create({
      data: {
        rwId: targetRwId,
        nomorCaraPemanfaatan: uniqueNo,
        program: jenisPemanfaatan,
        teknologi: kategoriSampah,
        bahanBaku: deskripsi || jenisPemanfaatan,
        volumeBahanBaku: Number(jumlah) || 10,
        unitBahanBaku: satuan,
        hasil: Number(jumlah) || 10,
        unitHasil: satuan,
        fotoDokumentasiUrl: fotoDokumentasiUrl || "/uploads/default-pemanfaatan.jpg",
        tanggalPencatatan: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    });

    const isIdeProgram = satuan === 'Rp' || ['FISIK', 'NON_FISIK', 'LAINNYA'].includes(jenisPemanfaatan);
    const laporanLabel = isIdeProgram ? 'Laporan Ide Program' : 'Laporan Pemanfaatan Sampah';
    const laporanDesc = isIdeProgram ? `${jenisPemanfaatan} dengan RAB ${jumlah} ${satuan}` : `${jenisPemanfaatan} (${jumlah} ${satuan})`;

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
          message: `Mahasiswa bimbingan Anda (${studentName}) menginput ${laporanLabel.toLowerCase()} ${laporanDesc} untuk ${rwName}.`,
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
    const ruleTargetMinutes = (ruleConfigs.attendanceMinDurationHours * 60) + ruleConfigs.attendanceMinDurationMinutes + (ruleConfigs.attendanceMinDurationSeconds / 60);
    const targetDurationMinutes = ruleTargetMinutes > 0 ? ruleTargetMinutes : 2;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all valid student ID representations to prevent any user ID mismatch
    const studentUserIds = Array.from(new Set([userId, student?.id, student?.userId].filter(Boolean) as string[]));

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
        OR: [
          { checkOutAt: { not: null } },
          { status: "ALPA" },
        ],
      },
      select: { scheduleId: true },
    });
    const completedScheduleIds = new Set(completedAttendances.map((a) => a.scheduleId));

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    // 🎯 Filter jadwal aktif khusus untuk kelompok KKN mahasiswa ybs (isActive: true)
    let activeSchedules: any[] = [];
    if (student?.kelompokId) {
      activeSchedules = await prisma.schedule.findMany({
        where: {
          kelompokId: student.kelompokId,
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
    const targetScheduleList = pendingSchedules.length > 0 ? pendingSchedules : activeSchedules;

    let activeSchedule: any = null;
    const now = new Date();
    const currentWibMinutes = ((now.getUTCHours() + 7) % 24) * 60 + now.getUTCMinutes();
    const todayStr = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().substring(0, 10);

    // 1. Time Window Matching: Pick schedule matching current time e.g. "08:00 - 10:00" vs "13:00 - 15:00"
    for (const sch of targetScheduleList) {
      let startMins = 0;
      let endMins = 24 * 60;
      const normalizedTime = (sch.time || "").replace(/[–—~]|s\/d|sd/gi, "-").trim();
      if (normalizedTime.includes("-")) {
        const parts = normalizedTime.split("-");
        const startParts = parts[0].trim().replace(".", ":").split(":");
        const endParts = parts[1].trim().replace(".", ":").split(":");
        if (startParts.length >= 2) startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        if (endParts.length >= 2) endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
      }

      const schDateStr = sch.date ? new Date(new Date(sch.date).getTime() + 7 * 60 * 60 * 1000).toISOString().substring(0, 10) : todayStr;
      const isSchedDateToday = schDateStr === todayStr;

      let isTimeMatch = false;
      if (endMins >= startMins) {
        // Normal daytime schedule
        isTimeMatch = isSchedDateToday && (currentWibMinutes >= startMins && currentWibMinutes <= endMins);
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

    // 2. Smart Multi-Schedule Matching by Geofence if no exact time match
    if (!activeSchedule && targetScheduleList.length > 0) {
      if (currentLat !== undefined && currentLng !== undefined && !isNaN(currentLat) && !isNaN(currentLng)) {
        for (const sch of targetScheduleList) {
          let isInside = false;
          if (sch.polygon && Array.isArray(sch.polygon) && sch.polygon.length >= 3) {
            const polyPoints = (sch.polygon as any[]).map((p) => ({
              lat: Number(p[0]),
              lng: Number(p[1]),
            }));
            isInside = isPointInPolygonWithBuffer({ lat: currentLat, lng: currentLng }, polyPoints, 15);
          } else if (sch.latitude && sch.longitude) {
            const dist = calculateDistance(currentLat, currentLng, Number(sch.latitude), Number(sch.longitude));
            isInside = dist <= ((sch.radius || 100) + 15);
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
              const dist = calculateDistance(currentLat, currentLng, Number(sch.latitude), Number(sch.longitude));
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
    if (activeLeave) {
      const typeLower = (activeLeave.type || "").toLowerCase();
      attendanceStatus = typeLower.includes("sakit") ? "sakit" : "izin";
    } else if (attendanceForActiveSchedule) {
      const attStatUpper = String(attendanceForActiveSchedule.status || "").toUpperCase();
      if (attStatUpper.includes("IZIN")) {
        attendanceStatus = "izin";
      } else if (attStatUpper.includes("SAKIT")) {
        attendanceStatus = "sakit";
      } else if (attStatUpper.includes("ALPA")) {
        attendanceStatus = "alpa";
      } else if (attStatUpper === "BERLANGSUNG" || attStatUpper === "DALAM_RADIUS" || attStatUpper === "DI_ZONA") {
        attendanceStatus = "berlangsung";
      } else if (attStatUpper === "HADIR" || attStatUpper === "SELESAI" || attendanceForActiveSchedule.checkOutAt !== null) {
        attendanceStatus = "hadir";
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
        kehadiran: activeLeave ? attendanceStatus : "libur",
        polygonPoints: [],
      };
    }

    let scheduleDurationMinutes = 0;
    let isOvernight = false;
    if (activeSchedule?.time && activeSchedule.time.includes("-")) {
      const parts = activeSchedule.time.split("-");
      const startParts = parts[0].trim().replace(".", ":").split(":");
      const endParts = parts[1].trim().replace(".", ":").split(":");
      if (startParts.length >= 2 && endParts.length >= 2) {
        const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        const endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
        if (endMins > startMins) {
          scheduleDurationMinutes = endMins - startMins;
        } else {
          scheduleDurationMinutes = (24 * 60 - startMins) + endMins;
          isOvernight = true;
        }
      }
    }
    const finalTargetDurationMinutes = targetDurationMinutes;

    // Check if schedule time has expired to auto-ALPA
    let isExpired = false;
    if (activeSchedule?.time && activeSchedule.time.includes("-")) {
      const parts = activeSchedule.time.split("-");
      const endParts = parts[1].trim().replace(".", ":").split(":");
      if (endParts.length >= 2) {
        const endHour = parseInt(endParts[0], 10);
        const endMin = parseInt(endParts[1], 10);
        const schedDate = activeSchedule.date ? new Date(activeSchedule.date) : new Date();
        const year = schedDate.getFullYear();
        const month = schedDate.getMonth();
        const day = schedDate.getDate();
        const endDateObj = new Date(year, month, day, endHour, endMin, 59, 999);
        if (isOvernight) {
          endDateObj.setDate(endDateObj.getDate() + 1);
        }
        if (new Date() > endDateObj) {
          isExpired = true;
        }
      }
    }

    if (isExpired && (attendanceStatus === "belum_absen" || attendanceStatus === "berlangsung")) {
      attendanceStatus = "alpa";
      if (attendanceForActiveSchedule && attendanceForActiveSchedule.status === "BERLANGSUNG") {
        await prisma.activityAttendance.update({
          where: { id: attendanceForActiveSchedule.id },
          data: { status: "ALPA" },
        }).catch(() => {});
      }
    }

    // Calculate precise total seconds in zone from studentLocation logs for this schedule window
    let actualInZoneSeconds = 0;
    if (activeSchedule) {
      if (attendanceForActiveSchedule) {
        try {
          const queryStartLogs = new Date(attendanceForActiveSchedule.attendedAt);

          const logs = await prisma.studentLocation.findMany({
            where: {
              studentId: { in: studentUserIds },
              recordedAt: { gte: queryStartLogs },
            },
            orderBy: { recordedAt: "asc" },
          });
        if (logs.length >= 2) {
          const bufferMeters = (ruleConfigs as any).geofenceBufferMeters || 15.0;
          const geofence = {
            latitude: activeSchedule.latitude ? Number(activeSchedule.latitude) : -6.8915,
            longitude: activeSchedule.longitude ? Number(activeSchedule.longitude) : 107.6107,
            radius: activeSchedule.radius ? Number(activeSchedule.radius) : 150,
            polygon: activeSchedule.polygon,
          };
          const inZonePoints = logs.filter((l) => {
            const lat = Number(l.latitude);
            const lng = Number(l.longitude);
            if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
              const polyPoints = (geofence.polygon as any[]).map((p) => ({
                lat: Number(p[0]),
                lng: Number(p[1]),
              }));
              return isPointInPolygonWithBuffer({ lat, lng }, polyPoints, bufferMeters);
            } else {
              const dist = calculateDistance(lat, lng, geofence.latitude, geofence.longitude);
              return dist <= (geofence.radius + bufferMeters);
            }
          });
          let totalMs = 0;
          for (let i = 0; i < inZonePoints.length - 1; i++) {
            const t1 = new Date(inZonePoints[i].recordedAt).getTime();
            const t2 = new Date(inZonePoints[i + 1].recordedAt).getTime();
            const diff = t2 - t1;
            if (diff > 0 && diff <= 5 * 60 * 1000) {
              totalMs += diff;
            }
          }
          actualInZoneSeconds = Math.floor(totalMs / 1000);
        }
      } catch (_) {
        // Fallback jika query bermasalah
      }
    } else {
      actualInZoneSeconds = 0;
    }
  }
    if (actualInZoneSeconds === 0 && attendanceForActiveSchedule?.actualInZoneMinutes) {
      actualInZoneSeconds = attendanceForActiveSchedule.actualInZoneMinutes * 60;
    }

    // Jika ada jadwal kegiatan spesifik untuk kelompoknya, gunakan data & koordinat jadwal tersebut!
    if (activeSchedule) {
      const schedLat = activeSchedule.latitude ? Number(activeSchedule.latitude) : (activeArea?.latitude ? Number(activeArea.latitude) : null);
      const schedLng = activeSchedule.longitude ? Number(activeSchedule.longitude) : (activeArea?.longitude ? Number(activeArea.longitude) : null);
      const locName = activeSchedule.location || (activeArea?.name ? `RW ${activeArea.name}, ${activeArea.kelurahan?.name || ""}` : "Lokasi Posko KKN");
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
        actualInZoneMinutes: attendanceForActiveSchedule?.actualInZoneMinutes ?? Math.floor(actualInZoneSeconds / 60),
        actualInZoneSeconds,
        attendanceStatus,
        status: attendanceStatus,
        kehadiran: attendanceStatus,
        polygonPoints: activeSchedule.polygon && Array.isArray(activeSchedule.polygon) ? activeSchedule.polygon : [],
      };
    }

    // Fallback posko RW jika belum ada jadwal kegiatan khusus hari ini
    const lat = activeArea?.latitude ? Number(activeArea.latitude) : null;
    const lng = activeArea?.longitude ? Number(activeArea.longitude) : null;
    const locName = activeArea?.name ? `RW ${activeArea.name}, ${activeArea.kelurahan?.name || ""}` : "Wilayah Dampingan KKN";

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
      actualInZoneMinutes: attendanceForActiveSchedule?.actualInZoneMinutes ?? Math.floor(actualInZoneSeconds / 60),
      actualInZoneSeconds,
      attendanceStatus,
      status: attendanceStatus,
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
}

export const kknService = new KknService();
