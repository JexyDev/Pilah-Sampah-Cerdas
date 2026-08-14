/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

const prisma = new PrismaClient();

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
            nim: "10123000",
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
      },
      orderBy: { createdAt: "desc" },
    });

    return warga.map((w: any) => {
      const household = w.households?.[0];
      const kelName =
        w.rw?.kelurahan?.name || household?.rw?.kelurahan?.name || filters.kelurahan || "";
      const rtRwName = w.rw?.name || household?.rw?.name || filters.rw || "";

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

  async activateByScan(
    wargaId: string,
    qrCode: string,
    latitude?: number,
    longitude?: number,
    kknUserId?: string
  ) {
    return prisma.$transaction(async (tx) => {
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
        const wObj = await tx.user.findUnique({ where: { id: wargaId } });
        await tx.household.create({
          data: {
            userId: wargaId,
            address: wObj?.address || "Bandung, Jawa Barat",
            rwId: wObj?.rwId || 1,
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
    wargaId: string,
    binOrganikId: string,
    binAnorganikId: string,
    latitude?: number,
    longitude?: number,
    kknUserId?: string
  ) {
    return prisma.$transaction(async (tx) => {
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
        const wObj = await tx.user.findUnique({ where: { id: wargaId } });
        await tx.household.create({
          data: {
            userId: wargaId,
            address: wObj?.address || "Bandung, Jawa Barat",
            rwId: wObj?.rwId || 1,
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
        data: { userId: wargaId, points: 10, description: "Mendapatkan 2 Tong Sampah" },
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

    const poskoLat = student.assignedRw?.latitude ? Number(student.assignedRw.latitude) : -6.975412;
    const poskoLng = student.assignedRw?.longitude
      ? Number(student.assignedRw.longitude)
      : 107.632145;

    return {
      groupId: group.id,
      groupName: group.name,
      dosenPembimbing: group.dpl?.name || "Dr. Ir. Ahmad Sudrajat, M.T.",
      poskoLocation: student.assignedRw?.name || "Kel. Bojongsoang RT 03 / RW 08",
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
    const startDate = payload.tanggalKegiatanTerkait
      ? new Date(payload.tanggalKegiatanTerkait)
      : new Date();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const leave = await (prisma as any).studentLeaveRequest.create({
      data: {
        studentId,
        type: payload.kategori || "Izin",
        reason: payload.deskripsi || "Berhalangan hadir kegiatan KKN",
        evidenceUrl: payload.fotoBuktiUrl || null,
        startDate,
        endDate,
        status: "PENDING",
      },
    });

    return {
      izinId: leave.id,
      status: leave.status,
    };
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
    }
  ) {
    const {
      jenisPemanfaatan = "Kompos Organik",
      kategoriSampah = "Organik",
      jumlah = 10,
      satuan = "Kg",
      deskripsi = "",
    } = payload;

    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: { user: true },
    });

    const userRtRw = student?.user?.rwId;
    let targetRwId = userRtRw;
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

    return {
      reportId: report.id,
      earnedPoints,
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
  async getActiveZone(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
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

    if (!activeArea) {
      return {
        hasActiveZone: false,
        message: "Wilayah penugasan KKN belum ditentukan oleh Admin.",
        zoneName: null,
        kelurahan: null,
        latitude: null,
        longitude: null,
        radiusMeter: 100,
        polygonPoints: [],
      };
    }

    const lat = activeArea.latitude ? Number(activeArea.latitude) : null;
    const lng = activeArea.longitude ? Number(activeArea.longitude) : null;

    return {
      hasActiveZone: true,
      zoneName: activeArea.name || "Wilayah Dampingan KKN",
      kelurahan: activeArea.kelurahan?.name || "Coblong",
      latitude: lat,
      longitude: lng,
      radiusMeter: 100,
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
}

export const kknService = new KknService();
