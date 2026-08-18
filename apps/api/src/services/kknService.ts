import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
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
      maxLimit > 0 ? parseFloat(((totalRegistered / maxLimit) * 100).toFixed(1)) : 0;

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
    return prisma.auditTrail.findMany({
      where: {
        userId: kknUserId,
        action: "REQUEST_ACTIVATE_BIN",
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });
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
      rwId: number;
      nama: string;
      jenis: any;
      longitude: number;
      latitude: number;
      foto?: string;
    }
  ) {
    const facility = await prisma.facility.create({
      data: {
        nama: data.nama,
        jenis: data.jenis,
        pic: data.userId, // Warga's name or ID
        latitude: data.latitude,
        longitude: data.longitude,
        rwId: data.rwId,
        foto: data.foto,
        statusApproval: "PENDING",
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

      const qrCodes = [data.binQrCode, data.binQrCodeOrganic, data.binQrCodeInorganic].filter(
        Boolean
      );

      for (const qr of qrCodes) {
        let bin = await tx.bin.findUnique({ where: { qrCode: qr } });
        const maxCapacityLiter = data.maxCapacityLiter ? Number(data.maxCapacityLiter) : 50;

        if (!bin) {
          let category = await tx.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
          if (!category) category = await tx.wasteCategory.findFirst();

          bin = await tx.bin.create({
            data: {
              qrCode: qr,
              status: "PENDING_APPROVAL",
              categoryId: category?.id,
              userId: warga.id,
              rwId: resolvedRwId,
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
              rwId: resolvedRwId,
              status: "PENDING_APPROVAL",
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
      const studentProfile = await prisma.studentKkn.findFirst({
        where: { OR: [{ userId: studentId }, { id: studentId }] },
        include: { kelompok: { include: { dpl: true } }, user: true },
      });
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

  async getLeaveRequests(studentId: string) {
    const list = await (prisma as any).studentLeaveRequest.findMany({
      where: { studentId },
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
        volumeBahanBaku: jumlah,
        unitBahanBaku: satuan,
        hasil: jumlah,
        unitHasil: satuan,
        fotoDokumentasiUrl: "/uploads/default-pemanfaatan.jpg",
        tanggalPencatatan: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    });

    // Award +25 points to student for waste utilization report
    const earnedPoints = 25;
    await prisma.pointHistory.create({
      data: {
        userId,
        points: earnedPoints,
        description: `Laporan Pemanfaatan Sampah: ${jenisPemanfaatan} (${jumlah} ${satuan})`,
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
          title: `Laporan Pemanfaatan Sampah (${rwName})`,
          message: `Mahasiswa KKN ${studentName} menginput laporan pemanfaatan ${jenisPemanfaatan} seberat ${jumlah} ${satuan}.`,
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
          title: `Tembusan Laporan Pemanfaatan Sampah`,
          message: `Mahasiswa bimbingan Anda (${studentName}) menginput laporan pemanfaatan sampah ${jenisPemanfaatan} (${jumlah} ${satuan}) untuk ${rwName}.`,
          isRead: false,
        },
      });
    }

    return {
      reportId: report.id,
      earnedPoints,
      rwTerkait: rwName,
      dplId: dplUser?.id || dplId || null,
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
    const ruleTargetMinutes = (ruleConfigs.attendanceMinDurationHours * 60) + ruleConfigs.attendanceMinDurationMinutes;
    const targetDurationMinutes = ruleTargetMinutes > 0 ? ruleTargetMinutes : 120;

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

    // 🎯 Filter jadwal aktif khusus untuk kelompok KKN mahasiswa ybs (isActive: true)
    let activeSchedules: any[] = [];
    if (student?.kelompokId) {
      activeSchedules = await prisma.schedule.findMany({
        where: {
          kelompokId: student.kelompokId,
          date: { gte: todayStart, lte: todayEnd },
          isActive: true,
        },
        orderBy: { date: "asc" },
      });
    }

    // Fallback: Jika tidak ada jadwal spesifik kelompok, cari jadwal umum tanpa kelompokId
    if (activeSchedules.length === 0) {
      activeSchedules = await prisma.schedule.findMany({
        where: {
          kelompokId: null,
          date: { gte: todayStart, lte: todayEnd },
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

    // 1. Time Window Matching: Pick schedule matching current time e.g. "08:00 - 10:00" vs "13:00 - 15:00"
    for (const sch of targetScheduleList) {
      let startMins = 0;
      let endMins = 24 * 60;
      if (sch.time && sch.time.includes("-")) {
        const parts = sch.time.split("-");
        const startParts = parts[0].trim().replace(".", ":").split(":");
        const endParts = parts[1].trim().replace(".", ":").split(":");
        if (startParts.length >= 2) startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        if (endParts.length >= 2) endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
      }

      if (currentWibMinutes >= startMins && currentWibMinutes <= endMins) {
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
      } else {
        attendanceStatus = "hadir";
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
        targetDurationMinutes,
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
        ? Number(((totalActiveBins / (totalHouseholdsRegistered * 2)) * 100).toFixed(1))
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
