/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { v4 as uuidv4 } from "uuid";
import { binRepository } from "../repositories/binRepository.js";
import { getDistanceMeters } from "../utils/haversineUtils.js";
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { websocketService } from "./websocketService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
import { generateNextQrCode } from "../utils/qrGenerator.js";

const prisma = new PrismaClient();

// Density configurations (Kg per Liter)
const DENSITY = {
  ORGANIC: 0.4, // Organic waste is denser
  NON_ORGANIC: 0.2, // Non-organic is lighter
};

export class BinService {
  /**
   * Get all bins
   */
  async getAllBins(
    currentUser?: { userId: string; role: string },
    filters?: {
      search?: string;
      status?: string;
      areaId?: string;
      categoryId?: string;
    }
  ) {
    let whereClause: any = {};
    if (currentUser) {
      const { getScopingFilters } = await import("../utils/rbacScoping.js");
      const scoping = await getScopingFilters(currentUser);
      whereClause = { ...scoping.binFilter };
    }

    if (filters) {
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.areaId) {
        whereClause.rtRwId = parseInt(filters.areaId, 10);
      }
      if (filters.categoryId) {
        whereClause.categoryId = filters.categoryId;
      }
      if (filters.search) {
        whereClause.OR = [
          { qrCode: { contains: filters.search, mode: "insensitive" } },
          { id: { contains: filters.search, mode: "insensitive" } },
        ];
      }
    }

    return binRepository.findAll(whereClause);
  }

  /**
   * Get locations summary grouped by RW
   */
  async getLocations() {
    return binRepository.getLocations();
  }

  /**
   * Process a QR scan transaction
   */
  async processScan(
    qrCode: string,
    userId: string,
    householdId: string,
    detectedType: string,
    estimatedVolume: number,
    userLat?: number,
    userLng?: number,
    aiConfidence?: number,
    evidencePhotoUrl?: string,
    detections?: Array<{ detectedType: string; volumeEstimate: number; confidence?: number }>
  ) {
    if (userLat === undefined || userLng === undefined) {
      throw new Error("GPS_COORDINATES_REQUIRED");
    }

    // 1. Find the Bin
    const bin = await binRepository.findByQrCode(qrCode);
    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }
    if (bin.status !== "ACTIVE_BOUND") {
      throw new Error("BIN_NOT_ACTIVE");
    }

    // 2. Validate ownership (if bin is private to a user)
    if (bin.binOwnerships && bin.binOwnerships.length > 0) {
      const isOwner = bin.binOwnerships.some((o: any) => o.userId === userId);
      if (!isOwner) {
        throw new Error("BIN_NOT_OWNED");
      }
    }

    // 2. Validate Geofencing (< 10m) if coordinates are provided
    if (
      userLat !== undefined &&
      userLng !== undefined &&
      bin.latitude !== null &&
      bin.longitude !== null
    ) {
      const distance = getDistanceMeters(
        userLat,
        userLng,
        Number(bin.latitude),
        Number(bin.longitude)
      );

      if (distance > 10) {
        const error = new Error("LOCATION_OUT_OF_RANGE");
        (error as any).distanceMeters = parseFloat(distance.toFixed(2));
        throw error;
      }
    }

    // Find all bins owned by the user (or under the same household)
    const userBins = await prisma.bin.findMany({
      where: {
        OR: [{ userId }, { binOwnerships: { some: { userId } } }],
        status: "ACTIVE_BOUND",
      },
      include: {
        category: true,
      },
    });

    if (userBins.length === 0) {
      throw new Error("NO_ACTIVE_BINS");
    }

    if (detections && detections.length > 0) {
      let totalWeightKg = 0;
      let totalVolumeLiter = 0;
      let totalPointsAwarded = 0;
      const results = [];

      for (const det of detections) {
        // Find matching bin for this detection category
        let targetBin = userBins.find((b) => b.category?.name === det.detectedType);

        // If not found in user's bins, try to see if the scanned bin matches
        if (!targetBin && bin.category?.name === det.detectedType) {
          targetBin = bin;
        }

        if (!targetBin) {
          continue;
        }

        const current = Number(targetBin.currentVolumeLiter);
        const max = Number(targetBin.maxCapacityLiter);
        const vol = det.volumeEstimate;

        if (current + vol > max) {
          await binRepository.createOverflowNotification(userId, targetBin.qrCode).catch(() => {});
          throw new Error("BIN_OVERFLOW");
        }

        const newVolume = current + vol;
        await binRepository.updateVolume(targetBin.id, newVolume);

        // Trigger dispatch if fullness >= trigger
        const triggerVal = await configService.getConfig("bin_fullness_trigger_wa");
        const triggerPct = triggerVal ? Number(triggerVal) : 80;
        const fullness = max > 0 ? (newVolume / max) * 100 : 0;
        if (fullness >= triggerPct) {
          const existingTask = await prisma.dispatchTask.findFirst({
            where: {
              binId: targetBin.id,
              status: { in: ["PENDING", "CLAIMED"] },
            },
          });

          if (!existingTask) {
            await prisma.dispatchTask.create({
              data: {
                binId: targetBin.id,
                status: "PENDING",
              },
            });

            if (targetBin.latitude !== null && targetBin.longitude !== null) {
              await websocketService
                .broadcastDispatch(
                  targetBin.id,
                  targetBin.qrCode,
                  Number(targetBin.latitude),
                  Number(targetBin.longitude)
                )
                .catch(() => {});
            }
          }
        }

        // Weight
        const isOrganic = targetBin.category?.name === "ORGANIC";
        const factor = isOrganic ? DENSITY.ORGANIC : DENSITY.NON_ORGANIC;
        const weightKg = parseFloat((vol * factor).toFixed(2));

        // Time-based points calculation with multiplier
        const now = new Date();
        const currentTimeVal = now.getHours() * 60 + now.getMinutes();
        const morningStartStr =
          (
            await prisma.systemConfig.findUnique({
              where: { key: "reporting_window_morning_start" },
            })
          )?.value || "06:00";
        const morningEndStr =
          (await prisma.systemConfig.findUnique({ where: { key: "reporting_window_morning_end" } }))
            ?.value || "08:00";
        const eveningStartStr =
          (
            await prisma.systemConfig.findUnique({
              where: { key: "reporting_window_evening_start" },
            })
          )?.value || "16:00";
        const eveningEndStr =
          (await prisma.systemConfig.findUnique({ where: { key: "reporting_window_evening_end" } }))
            ?.value || "18:00";

        const parseTimeToMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(":").map(Number);
          return h * 60 + m;
        };

        const isWithinMissionWindow =
          (currentTimeVal >= parseTimeToMinutes(morningStartStr) &&
            currentTimeVal <= parseTimeToMinutes(morningEndStr)) ||
          (currentTimeVal >= parseTimeToMinutes(eveningStartStr) &&
            currentTimeVal <= parseTimeToMinutes(eveningEndStr));

        let multiplier = 1.0;
        if (!isWithinMissionWindow) {
          const discountVal = (
            await prisma.systemConfig.findUnique({ where: { key: "late_submission_discount" } })
          )?.value;
          multiplier = discountVal ? Number(discountVal) : 0.3;
        } else {
          const multKey = isOrganic ? "organic_point_multiplier" : "nonorganic_point_multiplier";
          const multVal = (await prisma.systemConfig.findUnique({ where: { key: multKey } }))
            ?.value;
          multiplier = multVal ? Number(multVal) : 1.0;
        }

        const pointsPerKg = targetBin.category?.pointsPerKg || 10;
        const conf = det.confidence || 1.0;
        const calculatedPoints = Math.round(conf * pointsPerKg * multiplier);

        const requestId = uuidv4();
        const result = await binRepository.recordScanTransaction(
          householdId,
          targetBin.id,
          targetBin.categoryId || "",
          weightKg,
          vol,
          requestId,
          userId,
          calculatedPoints,
          targetBin.category?.name || "Umum",
          conf,
          evidencePhotoUrl
        );

        totalWeightKg += weightKg;
        totalVolumeLiter += vol;
        totalPointsAwarded += calculatedPoints;

        results.push({
          wasteLogId: result.wasteLog.id,
          category: targetBin.category?.name || "Umum",
          weightKg,
          volumeLiter: vol,
          pointsAwarded: calculatedPoints,
        });
      }

      // Send push notification if user has FCM token
      const userObj = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
      if (userObj?.fcmToken && totalPointsAwarded > 0) {
        await notificationIntegrationService
          .sendPushNotification(
            userObj.fcmToken,
            "Poin Bertambah!",
            `Selamat! Anda mendapatkan +${totalPointsAwarded} poin dari setoran sampah Anda.`
          )
          .catch((e) => console.error("FCM Error:", e));
      }

      return {
        isMixture: true,
        weightKg: parseFloat(totalWeightKg.toFixed(2)),
        volumeLiter: parseFloat(totalVolumeLiter.toFixed(2)),
        pointsAwarded: totalPointsAwarded,
        detections: results,
      };
    }

    // 3. Validate trash type matching (Fallback for single detection)
    if (bin.category.name !== detectedType) {
      const error = new Error("BIN_TYPE_MISMATCH");
      (error as any).binType = bin.category.name;
      throw error;
    }

    // 4. Check remaining capacity
    const current = Number(bin.currentVolumeLiter);
    const max = Number(bin.maxCapacityLiter);

    if (current + estimatedVolume > max) {
      // Create user notification for overflow async
      await binRepository.createOverflowNotification(userId, bin.qrCode).catch(() => {});
      throw new Error("BIN_OVERFLOW");
    }

    // 5. Update Bin current volume
    const newVolume = current + estimatedVolume;
    await binRepository.updateVolume(bin.id, newVolume);

    // Trigger on-demand dispatch if fullness exceeds trigger (default 80%)
    const triggerVal = await configService.getConfig("bin_fullness_trigger_wa");
    const triggerPct = triggerVal ? Number(triggerVal) : 80;
    const fullness = max > 0 ? (newVolume / max) * 100 : 0;
    if (fullness >= triggerPct) {
      // Check if a dispatch task is already active
      const existingTask = await prisma.dispatchTask.findFirst({
        where: {
          binId: bin.id,
          status: { in: ["PENDING", "CLAIMED"] },
        },
      });

      if (!existingTask) {
        await prisma.dispatchTask.create({
          data: {
            binId: bin.id,
            status: "PENDING",
          },
        });

        // Broadcast alert via WebSocket if bin has coordinates
        if (bin.latitude !== null && bin.longitude !== null) {
          await websocketService
            .broadcastDispatch(bin.id, bin.qrCode, Number(bin.latitude), Number(bin.longitude))
            .catch(() => {});
        }
      }
    }

    // 6. Convert liters to weight based on density
    // Use fixed multiplier for Organic vs Non-Organic for now (simplified)
    const isOrganic = bin.category.name === "ORGANIC";
    const factor = isOrganic ? DENSITY.ORGANIC : DENSITY.NON_ORGANIC;
    const weightKg = parseFloat((estimatedVolume * factor).toFixed(2));

    // Time-based points calculation with multiplier
    const now = new Date();
    const currentTimeVal = now.getHours() * 60 + now.getMinutes();
    const morningStartStr =
      (await prisma.systemConfig.findUnique({ where: { key: "reporting_window_morning_start" } }))
        ?.value || "06:00";
    const morningEndStr =
      (await prisma.systemConfig.findUnique({ where: { key: "reporting_window_morning_end" } }))
        ?.value || "08:00";
    const eveningStartStr =
      (await prisma.systemConfig.findUnique({ where: { key: "reporting_window_evening_start" } }))
        ?.value || "16:00";
    const eveningEndStr =
      (await prisma.systemConfig.findUnique({ where: { key: "reporting_window_evening_end" } }))
        ?.value || "18:00";

    const parseTimeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const isWithinMissionWindow =
      (currentTimeVal >= parseTimeToMinutes(morningStartStr) &&
        currentTimeVal <= parseTimeToMinutes(morningEndStr)) ||
      (currentTimeVal >= parseTimeToMinutes(eveningStartStr) &&
        currentTimeVal <= parseTimeToMinutes(eveningEndStr));

    let multiplier = 1.0;
    if (!isWithinMissionWindow) {
      const discountVal = (
        await prisma.systemConfig.findUnique({ where: { key: "late_submission_discount" } })
      )?.value;
      multiplier = discountVal ? Number(discountVal) : 0.3;
    } else {
      const multKey = isOrganic ? "organic_point_multiplier" : "nonorganic_point_multiplier";
      const multVal = (await prisma.systemConfig.findUnique({ where: { key: multKey } }))?.value;
      multiplier = multVal ? Number(multVal) : 1.0;
    }

    const pointsPerKg = bin.category.pointsPerKg || 10;
    const conf = aiConfidence || 1.0;
    const calculatedPoints = Math.round(conf * pointsPerKg * multiplier);

    // 8. Record transaction (WasteLog, PointHistory, Notification)
    const requestId = uuidv4();
    const result = await binRepository.recordScanTransaction(
      householdId,
      bin.id,
      bin.categoryId,
      weightKg,
      estimatedVolume,
      requestId,
      userId,
      calculatedPoints,
      bin.category.name,
      aiConfidence,
      evidencePhotoUrl
    );

    // Send push notification if user has FCM token
    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (userObj?.fcmToken && calculatedPoints > 0) {
      await notificationIntegrationService
        .sendPushNotification(
          userObj.fcmToken,
          "Poin Bertambah!",
          `Selamat! Anda mendapatkan +${calculatedPoints} poin dari setoran sampah Anda.`
        )
        .catch((e) => console.error("FCM Error:", e));
    }

    return {
      wasteLogId: result.wasteLog.id,
      weightKg,
      volumeLiter: estimatedVolume,
      pointsAwarded: calculatedPoints,
      newBinVolume: newVolume,
    };
  }

  /**
   * Get bin status by ID
   */
  async getBinStatus(binId: string) {
    // Requires findById in repository
    const bin = await binRepository.findById(binId);
    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    let realStatus = bin.status;
    if (realStatus === "ACTIVE_BOUND" || realStatus === "PENDING_APPROVAL") {
      const lastLog = await prisma.wasteLog.findFirst({
        where: { binId: bin.id },
        orderBy: { createdAt: "desc" },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const refDate = lastLog?.createdAt || bin.updatedAt;
      if (refDate < thirtyDaysAgo) {
        realStatus = "INACTIVE";
      }
    }

    return { ...bin, status: realStatus };
  }

  async registerWargaBin(
    userId: string,
    data: {
      qrCode?: string;
      qrCodes?: string[];
      latitude?: number;
      longitude?: number;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { households: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");
    if (!user.households || user.households.length === 0) {
      throw new Error("HOUSEHOLDS_NOT_FOUND");
    }
    const household = user.households[0];

    const codes = data.qrCodes || (data.qrCode ? [data.qrCode] : []);
    if (codes.length === 0) throw new Error("QR_CODES_REQUIRED");

    const result = await prisma.$transaction(async (tx) => {
      const updatedBins = [];
      const requestedCategoryIds = new Set<string>();

      for (const qrCode of codes) {
        const bin = await tx.bin.findUnique({
          where: { qrCode },
          include: { category: true, qrBatch: true },
        });
        if (!bin) {
          throw new Error(`BIN_NOT_FOUND: ${qrCode}`);
        }
        if (bin.status !== "PRINTED" && bin.status !== "ASSIGNED_TO_PIC") {
          throw new Error(`BIN_ALREADY_USED: ${qrCode}`);
        }

        if (bin.categoryId) {
          // Check for duplicate in the same request payload
          if (requestedCategoryIds.has(bin.categoryId)) {
            throw new Error("BIN_CATEGORY_DUPLICATE_IN_REQUEST");
          }
          requestedCategoryIds.add(bin.categoryId);

          // Check for existing bin of the same category owned by user
          const existingOwnership = await tx.binOwnership.findFirst({
            where: {
              userId: user.id,
              bin: {
                categoryId: bin.categoryId,
                status: {
                  notIn: ["BROKEN", "INACTIVE"],
                },
              },
            },
            include: { bin: { include: { category: true } } },
          });

          if (existingOwnership) {
            const catName = existingOwnership.bin.category?.name || "kategori ini";
            throw new Error(`BIN_CATEGORY_DUPLICATE:${catName}`);
          }
        }

        const updatedBin = await tx.bin.update({
          where: { id: bin.id },
          data: {
            status: "ACTIVE_BOUND",
            userId: user.id,
            rtRwId: user.rtRwId ?? household.rtRwId,
            latitude: data.latitude ?? household.latitude,
            longitude: data.longitude ?? household.longitude,
          },
        });

        await tx.binOwnership.create({
          data: {
            binId: bin.id,
            userId: user.id,
            type: "UTAMA",
          },
        });

        // Points bonus
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            points: 10,
            description: `Aktivasi Bin ${bin.qrCode}`,
            kategori: "PARTISIPASI_STREAK",
          },
        });

        if (bin.qrBatch?.assignedPicUserId) {
          await tx.pointHistory.create({
            data: {
              userId: bin.qrBatch.assignedPicUserId,
              points: 10,
              description: `Warga aktivasi bin ${bin.qrCode}`,
              kategori: "PARTISIPASI_STREAK",
            },
          });
        }

        await tx.auditTrail.create({
          data: {
            action: "WARGA_REGISTER_BIN",
            userId: user.id,
            oldValue: { qrCode: bin.qrCode, status: bin.status } as any,
            newValue: { qrCode: bin.qrCode, status: "ACTIVE_BOUND" } as any,
          },
        });
        updatedBins.push(updatedBin);
      }
      return updatedBins;
    });

    return result;
  }

  async measureBin(data: {
    qrCode: string;
    binType: string;
    maxCapacityLiter: number;
    height?: number;
    width?: number;
    length?: number;
    diameter?: number;
    shape?: string;
  }) {
    const bin = await prisma.bin.findUnique({
      where: { qrCode: data.qrCode },
    });
    if (!bin) throw new Error("BIN_NOT_FOUND");

    return prisma.bin.update({
      where: { id: bin.id },
      data: {
        binType: data.binType,
        maxCapacityLiter: data.maxCapacityLiter,
        height: data.height,
        width: data.width,
        length: data.length,
        diameter: data.diameter,
        shape: data.shape,
      },
    });
  }

  /**
   * Empty bin
   */
  async emptyBin(binId: string) {
    const bin = await binRepository.findById(binId);
    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }
    await binRepository.updateVolume(bin.id, 0);
  }

  /**
   * Create a new bin
   */
  async createBin(data: any) {
    if (!data.categoryId) {
      throw new Error("CATEGORY_ID_REQUIRED");
    }
    const qrCode = await generateNextQrCode(data.categoryId);
    let kelurahanId = null;
    if (data.rtRwId) {
      const area = await binRepository.findRtRwById(parseInt(data.rtRwId));
      if (area) {
        kelurahanId = area.kelurahanId;
      }
    }

    return binRepository.createBin({
      qrCode,
      categoryId: data.categoryId,
      rtRwId: parseInt(data.rtRwId),
      kelurahanId,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      maxCapacityLiter: data.maxCapacityLiter ? parseFloat(data.maxCapacityLiter) : 25.0,
      userId: data.userId || null,
    });
  }

  /**
   * Update a bin
   */
  async updateBin(id: string, data: any) {
    const updateData: any = {};
    if (data.qrCode) updateData.qrCode = data.qrCode;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.rtRwId) {
      updateData.rtRwId = parseInt(data.rtRwId);
      const area = await binRepository.findRtRwById(parseInt(data.rtRwId));
      if (area) {
        updateData.kelurahanId = area.kelurahanId;
      }
    }
    if (data.maxCapacityLiter) updateData.maxCapacityLiter = parseFloat(data.maxCapacityLiter);
    if (data.latitude !== undefined)
      updateData.latitude = data.latitude ? parseFloat(data.latitude) : null;
    if (data.longitude !== undefined)
      updateData.longitude = data.longitude ? parseFloat(data.longitude) : null;
    if (data.userId !== undefined) updateData.userId = data.userId || null;

    return binRepository.updateBin(id, updateData);
  }

  /**
   * Delete a bin
   */
  async deleteBin(id: string) {
    return binRepository.deleteBin(id);
  }

  async getAreas() {
    return binRepository.findAreas();
  }

  async getKelurahans() {
    return binRepository.findKelurahans();
  }

  async createArea(name: string, kelurahanId: string) {
    return binRepository.createArea(name, kelurahanId);
  }

  async getMyBins(userId: string) {
    const bins = await binRepository.findBinsByUserId(userId);

    // Fetch last waste log for these bins to determine 30-day inactivity
    const binIds = bins.map((b: any) => b.id);
    const lastLogs = await prisma.wasteLog.groupBy({
      by: ["binId"],
      _max: {
        createdAt: true,
      },
      where: {
        binId: { in: binIds },
      },
    });

    const lastLogMap = new Map();
    lastLogs.forEach((log) => {
      lastLogMap.set(log.binId, log._max.createdAt);
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return bins.map((bin: any) => {
      const currentVol = Number(bin.currentVolumeLiter);
      const maxVol = Number(bin.maxCapacityLiter);
      const kapasitas = maxVol > 0 ? Math.round((currentVol / maxVol) * 100) : 0;
      const utamaOwner = bin.binOwnerships?.find((o: any) => o.type === "UTAMA")?.user;
      const householdName = utamaOwner ? utamaOwner.name : "Tempat Sampah Umum";

      // 30 days inactivity check
      let realStatus = bin.status;
      if (realStatus === "ACTIVE_BOUND" || realStatus === "PENDING_APPROVAL") {
        const lastActivity = lastLogMap.get(bin.id);
        const refDate = lastActivity || bin.updatedAt;
        if (refDate < thirtyDaysAgo) {
          realStatus = "TIDAK_AKTIF";
        }
      }

      return {
        id: bin.id,
        qrCode: bin.qrCode,
        category: bin.category?.name || "ORGANIK",
        currentVolumeLiter: currentVol,
        maxCapacityLiter: maxVol,
        kapasitas,
        rtRw: bin.rtRw?.name || `RT/RW ${bin.rtRwId}`,
        status:
          realStatus === "TIDAK_AKTIF"
            ? "TIDAK AKTIF"
            : kapasitas > 80
              ? "Penuh"
              : kapasitas > 50
                ? "Sedang"
                : "Normal",
        householdName,
        realStatus,
        isActive: realStatus === "ACTIVE_BOUND",
        latitude: bin.latitude ? Number(bin.latitude) : null,
        longitude: bin.longitude ? Number(bin.longitude) : null,
        kelurahan: (bin as any).kelurahan?.name || "",
      };
    });
  }

  /**
   * Create bin reset request and notify area petugas
   */
  async createResetRequest(binId: string, userId: string, evidencePhotoUrl: string) {
    const request = await binRepository.createResetRequest(binId, userId, evidencePhotoUrl);

    // Notify all Petugas/Admin
    const petugasList = request.bin.rtRwId
      ? await binRepository.findPetugasForArea(request.bin.rtRwId)
      : [];
    for (const petugas of petugasList) {
      await binRepository
        .createNotification(
          petugas.id,
          "Pengajuan Pengosongan Baru",
          `[REQ-${request.id}] Warga (${request.user.name}) mengajukan pengosongan tong ${request.bin.qrCode} di ${request.bin.rtRw?.name || "Wilayah Umum"}.`
        )
        .catch(() => {});
    }

    return request;
  }

  /**
   * Get reset request by ID
   */
  async getResetRequest(id: string) {
    return binRepository.findResetRequestById(id);
  }

  /**
   * Review (approve/reject) reset request
   */
  async reviewResetRequest(id: string, status: "APPROVED" | "REJECTED", reviewedById: string) {
    const request = await binRepository.findResetRequestById(id);
    if (!request) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    const updated = await binRepository.updateResetRequestStatus(id, status, reviewedById);

    if (status === "APPROVED") {
      // Reset Bin volume
      await binRepository.updateVolume(request.binId, 0.0);

      // Notify Warga
      await binRepository
        .createNotification(
          request.userId,
          "Pengajuan Disetujui",
          `Petugas telah memverifikasi foto bukti Anda dan mereset kapasitas tong ${request.bin.qrCode} menjadi 0%.`
        )
        .catch(() => {});
    } else {
      // Notify Warga
      await binRepository
        .createNotification(
          request.userId,
          "Pengajuan Ditolak",
          `Pengajuan pengosongan tong ${request.bin.qrCode} ditolak oleh petugas.`
        )
        .catch(() => {});
    }

    // Log to Audit Trail
    await prisma.auditTrail
      .create({
        data: {
          action: "REVIEW_RESET_REQUEST",
          userId: reviewedById,
          oldValue: { status: "PENDING", request: id },
          newValue: { status, binId: request.binId },
        },
      })
      .catch(() => {});

    return updated;
  }

  /**
   * Create QR Batch
   */
  async createQrBatch(quantity: number) {
    const batchNumber = `BATCH-${Date.now()}`;
    return binRepository.createQrBatch(batchNumber, quantity);
  }

  /**
   * Get all QR Batches
   */
  async getAllQrBatches() {
    return binRepository.findAllQrBatches();
  }

  /**
   * Assign QR Batch to PIC
   */
  async assignQrBatch(batchId: string, picUserId: string, adminUserId: string) {
    return binRepository.assignQrBatch(batchId, picUserId, adminUserId);
  }

  /**
   * Mark Bin as Broken
   */
  async markBinAsBroken(qrCode: string, adminUserId: string) {
    return binRepository.markBinAsBroken(qrCode, adminUserId);
  }

  /**
   * Claim a dispatch task concurrency-safely using FOR UPDATE row lock
   */
  async claimDispatchTask(taskId: string, petugasUserId: string) {
    return prisma.$transaction(async (tx) => {
      // Row level lock to prevent double claim
      const tasks = await tx.$queryRaw<any[]>`
        SELECT * FROM dispatch_tasks WHERE id = ${taskId} FOR UPDATE
      `;
      if (!tasks || tasks.length === 0) throw new Error("DISPATCH_TASK_NOT_FOUND");
      const task = tasks[0];

      if (task.status !== "PENDING") {
        throw new Error("DISPATCH_TASK_ALREADY_CLAIMED");
      }

      const updated = await tx.dispatchTask.update({
        where: { id: taskId },
        data: {
          status: "CLAIMED",
          claimedByUserId: petugasUserId,
        },
      });

      return updated;
    });
  }

  /**
   * Route optimization: sort claimed tasks for petugas by Haversine distance
   */
  async getOptimizedRoute(petugasUserId: string, lat: number, lng: number) {
    const tasks = await prisma.dispatchTask.findMany({
      where: {
        claimedByUserId: petugasUserId,
        status: "CLAIMED",
      },
      include: {
        bin: {
          include: {
            rtRw: true,
          },
        },
      },
    });

    // Calculate distance and sort
    const route = tasks.map((t: any) => {
      let distanceMeters = 9999999; // Default if coords are missing
      if (t.bin.latitude !== null && t.bin.longitude !== null) {
        distanceMeters = getDistanceMeters(
          lat,
          lng,
          Number(t.bin.latitude),
          Number(t.bin.longitude)
        );
      }
      return {
        taskId: t.id,
        binId: t.bin.id,
        qrCode: t.bin.qrCode,
        latitude: t.bin.latitude,
        longitude: t.bin.longitude,
        distanceMeters,
        rtRw: t.bin.rtRw?.name || `RT/RW ${t.bin.rtRwId}`,
      };
    });

    return route.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async approveActivation(binIdOrQrCode: string, adminUserId: string) {
    const bin = await prisma.bin.findFirst({
      where: {
        OR: [{ id: binIdOrQrCode }, { qrCode: binIdOrQrCode }],
      },
      include: {
        qrBatch: true,
        user: true,
      },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    if (bin.status !== "PENDING_APPROVAL") {
      throw new Error("BIN_NOT_PENDING_APPROVAL");
    }

    const citizenUserId = bin.userId;
    if (!citizenUserId) {
      throw new Error("BIN_HAS_NO_USER");
    }

    return prisma.$transaction(async (tx) => {
      const updatedBin = await tx.bin.update({
        where: { id: bin.id },
        data: {
          status: "ACTIVE_BOUND",
        },
      });

      const assignedPicUserId = bin.qrBatch?.assignedPicUserId;
      if (assignedPicUserId) {
        await tx.pointHistory.create({
          data: {
            userId: citizenUserId,
            points: 50,
            description: "Poin awal aktivasi tempat sampah cerdas (KKN)",
            kategori: "REDUKSI_TONASE",
          },
        });

        await tx.pointHistory.create({
          data: {
            userId: assignedPicUserId,
            points: 10,
            description: `Registrasi pendampingan warga: ${bin.user?.name || "Warga"}`,
            kategori: "IDE_DAUR_ULANG",
          },
        });
      } else {
        await tx.pointHistory.create({
          data: {
            userId: citizenUserId,
            points: 10,
            description: `Bonus aktivasi tempat sampah ${bin.qrCode}`,
            kategori: "REDUKSI_TONASE",
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: citizenUserId,
          title: "Aktivasi Tempat Sampah Disetujui",
          message: `Selamat! Pengajuan aktivasi tempat sampah ${bin.qrCode} Anda telah disetujui. Poin bonus telah ditambahkan ke akun Anda.`,
        },
      });

      await tx.auditTrail.create({
        data: {
          action: "ACTIVATE_BIN_APPROVED",
          userId: adminUserId,
          oldValue: { id: bin.id, qrCode: bin.qrCode, status: bin.status } as any,
          newValue: { id: bin.id, qrCode: bin.qrCode, status: "ACTIVE_BOUND" } as any,
        },
      });

      return updatedBin;
    });
  }

  async reactivateBin(binId: string) {
    const bin = await binRepository.findById(binId);
    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    // Force an update to bump updatedAt and set status ACTIVE_BOUND
    return prisma.bin.update({
      where: { id: bin.id },
      data: {
        status: "ACTIVE_BOUND",
      },
    });
  }

  async rejectActivation(binIdOrQrCode: string, adminUserId: string) {
    const bin = await prisma.bin.findFirst({
      where: {
        OR: [{ id: binIdOrQrCode }, { qrCode: binIdOrQrCode }],
      },
      include: {
        qrBatch: true,
        user: true,
      },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    if (bin.status !== "PENDING_APPROVAL") {
      throw new Error("BIN_NOT_PENDING_APPROVAL");
    }

    const citizenUserId = bin.userId;

    return prisma.$transaction(async (tx) => {
      const newStatus = bin.qrBatchId ? "ASSIGNED_TO_PIC" : "PRINTED";
      const updatedBin = await tx.bin.update({
        where: { id: bin.id },
        data: {
          status: newStatus as any,
          userId: null,
        },
      });

      await tx.binOwnership.deleteMany({
        where: {
          binId: bin.id,
        },
      });

      if (citizenUserId) {
        await tx.household.deleteMany({
          where: { userId: citizenUserId },
        });

        await tx.user.delete({
          where: { id: citizenUserId },
        });
      }

      await tx.auditTrail.create({
        data: {
          action: "ACTIVATE_BIN_REJECTED",
          userId: adminUserId,
          oldValue: { id: bin.id, qrCode: bin.qrCode, status: bin.status } as any,
          newValue: { id: bin.id, qrCode: bin.qrCode, status: newStatus } as any,
        },
      });

      return updatedBin;
    });
  }

  async reportIssue(
    binId: string,
    userId: string,
    issueType: "EMPTY_REQUEST" | "BROKEN_REPORT",
    _notes: string
  ) {
    const bin = await prisma.bin.findUnique({
      where: { id: binId },
      include: { rtRw: true },
    });

    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const staffList = await prisma.user.findMany({
      where: {
        rtRwId: bin.rtRwId,
        role: {
          name: { in: ["RW", "PETUGAS_RESIDU"] },
        },
      },
    });

    if (issueType === "EMPTY_REQUEST") {
      const title = "Permintaan Pengosongan Sampah";
      const message = `[PANGGILAN] Warga (${user.name}) di (${user.address || bin.rtRw?.name || "Wilayah Umum"}) meminta petugas segera mengosongkan tong sampah ${bin.qrCode}.`;

      for (const staff of staffList) {
        await prisma.notification
          .create({
            data: {
              userId: staff.id,
              title,
              message,
            },
          })
          .catch(() => {});
      }

      return {
        success: true,
        message: "Permintaan pengosongan sampah berhasil dikirim ke petugas",
      };
    } else {
      await prisma.bin.update({
        where: { id: bin.id },
        data: { status: "BROKEN" },
      });

      const title = "Laporan Tempat Sampah Rusak";
      const message = `Warga (${user.name}) melaporkan bahwa tempat sampah ${bin.qrCode} di (${user.address || bin.rtRw?.name || "Wilayah Umum"}) rusak atau QR code-nya sobek/rusak.`;

      for (const staff of staffList) {
        await prisma.notification
          .create({
            data: {
              userId: staff.id,
              title,
              message,
            },
          })
          .catch(() => {});
      }

      await prisma.auditTrail
        .create({
          data: {
            action: "REPORT_BIN_BROKEN",
            userId: userId,
            oldValue: { id: bin.id, qrCode: bin.qrCode, status: bin.status } as any,
            newValue: { id: bin.id, qrCode: bin.qrCode, status: "BROKEN" } as any,
          },
        })
        .catch(() => {});

      return { success: true, message: "Laporan tempat sampah rusak berhasil dikirim" };
    }
  }

  async updateCapacity(binId: string, maxCapacityLiter: number, evidencePhotoUrl: string | null) {
    const bin = await prisma.bin.findUnique({ where: { id: binId } });
    if (!bin) throw new Error("BIN_NOT_FOUND");

    const updatedBin = await prisma.bin.update({
      where: { id: binId },
      data: {
        maxCapacityLiter,
      },
    });

    if (evidencePhotoUrl) {
      await prisma.auditTrail.create({
        data: {
          action: "UPDATE_BIN_CAPACITY",
          userId: bin.userId || "system",
          oldValue: { maxCapacityLiter: Number(bin.maxCapacityLiter) } as any,
          newValue: { maxCapacityLiter, evidencePhotoUrl } as any,
        },
      });
    }

    return updatedBin;
  }
}

export const binService = new BinService();
