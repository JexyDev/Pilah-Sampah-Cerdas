import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { v4 as uuidv4 } from "uuid";
import { binRepository } from "../repositories/binRepository.js";
import { getDistanceMeters } from "../utils/haversineUtils.js";
import { configService } from "./configService.js";
import { websocketService } from "./websocketService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
import { generateNextQrCode } from "../utils/qrGenerator.js";


// Density configurations (Kg per Liter)
const DENSITY = {
  ORGANIC: 0.4, // Organic waste is denser
  NON_ORGANIC: 0.2, // Non-organic is lighter
};

// Helper to find local RW/RT and Petugas staff for a given bin area
async function getStaffForBin(binRwId: number | null) {
  if (!binRwId) return [];

  const area = await prisma.rw.findUnique({
    where: { id: binRwId },
  });
  if (!area) return [];

  const rwPart =
    area.name
      .split("/")
      .map((s) => s.trim())
      .find((s) => s.startsWith("RW")) || area.name;

  const matchingAreas = await prisma.rw.findMany({
    where: {
      kelurahanId: area.kelurahanId,
      name: { contains: rwPart },
    },
    select: { id: true },
  });

  let areaIds = matchingAreas.map((a) => a.id);
  if (areaIds.length === 0) areaIds = [binRwId];

  return prisma.user.findMany({
    where: {
      rwId: { in: areaIds },
      role: {
        name: { in: ["RW", "PETUGAS_RESIDU", "RT", "MAHASISWA_KKN"] },
      },
    },
  });
}

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
        const validEnumValues = [
          "PRINTED",
          "ACTIVE",
          "ACTIVE_BOUND",
          "INACTIVE",
          "BROKEN",
          "PENDING_APPROVAL",
        ];
        if (filters.status === "PRINTED") {
          // [MODIFIKASI]: Bypass scoping wilayah khusus untuk status PRINTED
          // karena QR baru belum memiliki rwId/kelurahanId.
          whereClause = { status: "PRINTED" };
        } else if (validEnumValues.includes(filters.status)) {
          whereClause.status = filters.status;
        } else if (filters.status === "Rusak") {
          whereClause.status = "BROKEN";
        }
        // Note: Human-friendly status filters like "Penuh", "Sedang", "Normal" are filtered post-fetch in binController
      }
      if (filters.areaId) {
        const parsedAreaId = parseInt(filters.areaId, 10);
        if (!isNaN(parsedAreaId)) {
          whereClause.rwId = parsedAreaId;
        }
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
    if (!householdId) {
      const existingHh = await prisma.household.findFirst({ where: { userId } });
      if (existingHh) {
        householdId = existingHh.id;
      } else {
        const u = await prisma.user.findUnique({ where: { id: userId } });
        const newHh = await prisma.household.create({
          data: {
            userId,
            address: u?.address || "Bandung, Jawa Barat",
            rwId: u?.rwId || 1,
            latitude: userLat ?? -6.8903,
            longitude: userLng ?? 107.611,
          },
        });
        householdId = newHh.id;
      }
    }

    // 1. Find the Bin
    const bin = await binRepository.findByQrCode(qrCode);
    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
    }
    if (bin.status !== "ACTIVE_BOUND") {
      throw new Error("BIN_NOT_ACTIVE");
    }

    // Check if the bin has been inactive for > 30 days
    const lastLog = await prisma.setoranOtomatis.findFirst({
      where: { qrTempatSampahId: bin.id },
      orderBy: { createdAt: "desc" },
    });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const refDate = lastLog?.createdAt || bin.updatedAt;
    if (refDate < thirtyDaysAgo) {
      throw new Error("BIN_INACTIVE");
    }

    // 2. Validate ownership (if bin is private to a user)
    if (bin.binOwnerships && bin.binOwnerships.length > 0) {
      const isOwner = bin.binOwnerships.some((o: any) => o.userId === userId);
      if (!isOwner) {
        throw new Error("BIN_NOT_OWNED");
      }
    }

    // ✅ TAMBAHAN: Jika QR khusus RW dan tidak punya owner terdaftar,
    // pastikan scanner adalah warga dari RW yang sama
    if (bin.rwId !== null && (!bin.binOwnerships || bin.binOwnerships.length === 0)) {
      const scanUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { rwId: true },
      });
      if (scanUser?.rwId && scanUser.rwId !== bin.rwId) {
        throw new Error("BIN_RW_MISMATCH");
      }
    }

    // 2. Validate Geofencing (< 50m) if coordinates are provided
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

      const maxRadius =
        process.env.NODE_ENV === "development" && process.env.ALLOW_GEOFENCE_BYPASS === "true"
          ? 1000000
          : 50;

      if (distance > maxRadius) {
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

        if (current >= max || current >= 25 || current + vol > max) {
          await binRepository.createOverflowNotification(userId, targetBin.qrCode).catch(() => {});
          throw new Error("BIN_FULL");
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
            let assignedUserId = null;
            let status = "PENDING";
            if (targetBin.latitude && targetBin.longitude) {
              const petugas = await prisma.user.findMany({
                where: { role: { name: "PETUGAS_RESIDU" }, status: "ACTIVE" },
                select: { id: true, petugasProfile: true },
              });
              let minDist = Infinity;

              const { getDistanceInMeters } = await import("../utils/geoUtils.js");
              for (const p of petugas) {
                const lat = p.petugasProfile?.latitude;
                const lng = p.petugasProfile?.longitude;
                if (lat && lng) {
                  const dist = getDistanceInMeters(
                    { lat: Number(targetBin.latitude), lng: Number(targetBin.longitude) },
                    { lat: Number(lat), lng: Number(lng) }
                  );
                  if (dist < minDist) {
                    minDist = dist;
                    assignedUserId = p.id;
                  }
                }
              }
            }

            if (assignedUserId) {
              status = "CLAIMED";
            }

            await prisma.dispatchTask.create({
              data: {
                binId: targetBin.id,
                status: status as any,
                claimedByUserId: assignedUserId,
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

        const rawConf = (det.confidence ?? aiConfidence)!;
        const confScale = rawConf > 1 ? rawConf / 100 : rawConf;
        const rate = 100 * multiplier;
        const calculatedPoints = Math.max(1, Math.round(vol * rate * confScale));

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
          confScale,
          evidencePhotoUrl
        );

        totalWeightKg += weightKg;
        totalVolumeLiter += vol;
        totalPointsAwarded += calculatedPoints;

        results.push({
          wasteLogId: result.setoranOtomatis.id,
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

    if (current >= max || current >= 25 || current + estimatedVolume > max) {
      // Create user notification for overflow async
      await binRepository.createOverflowNotification(userId, bin.qrCode).catch(() => {});
      throw new Error("BIN_FULL");
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

    const rawConf = aiConfidence!;
    const confScale = rawConf > 1 ? rawConf / 100 : rawConf;
    const rate = 100 * multiplier;
    const calculatedPoints = Math.max(1, Math.round(estimatedVolume * rate * confScale));

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
      wasteLogId: result.setoranOtomatis.id,
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
      const lastLog = await prisma.setoranOtomatis.findFirst({
        where: { qrTempatSampahId: bin.id },
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
    let household = user.households && user.households.length > 0 ? user.households[0] : null;
    if (!household) {
      const rwId = user.rwId || 1;
      const lat = data.latitude ?? -6.8903;
      const lng = data.longitude ?? 107.611;
      const addr = user.address || "Bandung, Jawa Barat";

      household = await prisma.household.create({
        data: {
          userId: user.id,
          address: addr,
          rwId: rwId,
          latitude: lat,
          longitude: lng,
        },
      });
    }

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
        if (bin.status !== "PRINTED") {
          throw new Error(`BIN_ALREADY_USED: ${qrCode}`);
        }

        // ✅ TAMBAHAN: Validasi RW jika QR bukan massal
        if (bin.rwId !== null && bin.rwId !== undefined) {
          // QR ini khusus untuk satu RW — hanya Warga di RW tersebut yang boleh aktivasi
          const userRwId = user.rwId;
          if (!userRwId) {
            throw new Error("USER_RW_NOT_SET");
          }
          if (bin.rwId !== userRwId) {
            throw new Error("BIN_RW_MISMATCH");
          }
        }
        // Jika bin.rwId === null → QR massal → siapa pun boleh aktivasi ✅

        if (bin.categoryId) {
          // 1. Get user's current bins to check onboarding status
          const currentBins = await tx.bin.findMany({
            where: {
              OR: [{ userId: user.id }, { binOwnerships: { some: { userId: user.id } } }],
              status: "ACTIVE_BOUND",
            },
            include: { category: true },
          });

          const hasOrganik = currentBins.some((b) => b.category?.name === "ORGANIC");
          const hasNonOrganik = currentBins.some((b) => b.category?.name === "NON_ORGANIC");
          const onboardingComplete = hasOrganik && hasNonOrganik;

          // Check duplicate category in the request payload itself
          if (requestedCategoryIds.has(bin.categoryId)) {
            throw new Error("BIN_CATEGORY_DUPLICATE_IN_REQUEST");
          }
          requestedCategoryIds.add(bin.categoryId);

          // 2. Enforce onboarding rules
          if (!onboardingComplete) {
            const catName = bin.category?.name || "";
            if (catName === "ORGANIC" && hasOrganik) {
              throw new Error("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:ORGANIC");
            }
            if (catName === "NON_ORGANIC" && hasNonOrganik) {
              throw new Error("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:NON_ORGANIC");
            }
          }
          // If onboardingComplete is true, we allow any bin category without limits
        }

        const updatedBin = await tx.bin.update({
          where: { id: bin.id },
          data: {
            status: "ACTIVE_BOUND",
            userId: user.id,
            rwId: user.rwId ?? household.rwId,
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

    let catId = data.categoryId;
    const cat = await prisma.wasteCategory.findFirst({
      where: {
        OR: [{ id: catId }, { name: { contains: catId, mode: "insensitive" } }],
      },
    });
    if (cat) {
      catId = cat.id;
    }

    const count = parseInt(data.count || data.generateCount || "1", 10);
    if (count > 1) {
      const createdBins = [];
      for (let i = 0; i < count; i++) {
        const qrCode = await generateNextQrCode(catId);
        let kelurahanId = null;
        let parsedRwId: number | null = null;
        if (data.rwId) {
          const parsed = parseInt(data.rwId, 10);
          if (!isNaN(parsed)) {
            parsedRwId = parsed;
            const area = await binRepository.findRtRwById(parsed);
            if (area) {
              kelurahanId = area.kelurahanId;
            }
          }
        }
        const bin = await binRepository.createBin({
          qrCode,
          categoryId: catId,
          rwId: parsedRwId,
          kelurahanId,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
          maxCapacityLiter: data.maxCapacityLiter ? parseFloat(data.maxCapacityLiter) : 25.0,
          userId: data.userId || null,
          status: data.status || "PRINTED",
        });
        createdBins.push(bin);
      }
      return createdBins;
    }

    const qrCode = await generateNextQrCode(catId);
    let kelurahanId = null;
    let parsedRwId: number | null = null;
    if (data.rwId) {
      const parsed = parseInt(data.rwId, 10);
      if (!isNaN(parsed)) {
        parsedRwId = parsed;
        const area = await binRepository.findRtRwById(parsed);
        if (area) {
          kelurahanId = area.kelurahanId;
        }
      }
    }

    return binRepository.createBin({
      qrCode,
      categoryId: catId,
      rwId: parsedRwId,
      kelurahanId,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      maxCapacityLiter: data.maxCapacityLiter ? parseFloat(data.maxCapacityLiter) : 25.0,
      userId: data.userId || null,
      status: data.status || "PRINTED",
    });
  }

  /**
   * Update a bin
   */
  async updateBin(id: string, data: any) {
    const updateData: any = {};

    if (data.categoryId) {
      const cat = await prisma.wasteCategory.findFirst({
        where: {
          OR: [
            { id: data.categoryId },
            { name: { contains: data.categoryId, mode: "insensitive" } },
          ],
        },
      });
      if (cat) {
        updateData.categoryId = cat.id;
      }
    }

    const rwVal = data.rwId || data.rtRwId;
    if (rwVal) {
      const parsed = parseInt(rwVal, 10);
      if (!isNaN(parsed)) {
        const area = await binRepository.findRtRwById(parsed);
        if (area) {
          updateData.rwId = parsed;
          updateData.kelurahanId = area.kelurahanId;
        }
      }
    }

    if (data.maxCapacityLiter !== undefined && data.maxCapacityLiter !== null) {
      const cap = parseFloat(data.maxCapacityLiter);
      if (!isNaN(cap)) {
        updateData.maxCapacityLiter = cap;
      }
    }

    if (data.status) {
      const statusUpper = String(data.status).toUpperCase();
      if (statusUpper === "RUSAK" || statusUpper === "BROKEN") {
        updateData.status = "BROKEN";
      } else if (
        ["ACTIVE_BOUND", "ACTIVE", "PRINTED", "INACTIVE", "PENDING_APPROVAL"].includes(statusUpper)
      ) {
        updateData.status = statusUpper;
      } else if (data.status === "Normal" || data.status === "Penuh" || data.status === "Sedang") {
        updateData.status = "ACTIVE_BOUND";
      }
    }

    if (data.latitude !== undefined) {
      updateData.latitude =
        data.latitude !== null && data.latitude !== "" ? parseFloat(data.latitude) : null;
    }
    if (data.longitude !== undefined) {
      updateData.longitude =
        data.longitude !== null && data.longitude !== "" ? parseFloat(data.longitude) : null;
    }
    if (data.userId !== undefined && data.userId !== "") {
      updateData.userId = data.userId || null;
    }

    return binRepository.updateBin(id, updateData);
  }

  /**
   * Delete a bin
   */
  async deleteBin(id: string) {
    return binRepository.deleteBin(id);
  }

  async getAreas(user?: any) {
    if (user) {
      const roleName = String(user.role || "").toUpperCase();

      if (roleName === "DPL" || roleName === "DOSEN_PEMBIMBING") {
        const userId = user.userId || user.id;
        const kelompoks = await prisma.kelompokKkn.findMany({
          where: { dplId: userId },
        });

        if (kelompoks.length > 0) {
          const kelurahanNames = kelompoks
            .map((k) => k.kelurahan)
            .filter((k): k is string => Boolean(k));

          const allCakupanRw: string[] = [];
          kelompoks.forEach((k) => {
            if (Array.isArray(k.cakupanRw)) {
              (k.cakupanRw as any[]).forEach((r) => {
                const s = String(r).trim();
                if (/^\d+$/.test(s)) {
                  allCakupanRw.push(`RW ${s.length === 1 ? `0${s}` : s}`);
                } else {
                  allCakupanRw.push(s);
                }
              });
            }
          });

          if (kelurahanNames.length > 0) {
            return prisma.rw.findMany({
              where: {
                kelurahan: {
                  name: { in: kelurahanNames, mode: "insensitive" },
                },
                ...(allCakupanRw.length > 0 ? { name: { in: allCakupanRw } } : {}),
              },
              include: { kelurahan: true },
              orderBy: { name: "asc" },
            });
          }
        }
      } else if (roleName === "RW") {
        const rwId = user.rwId || user.rtRwId;
        if (rwId) {
          return prisma.rw.findMany({
            where: { id: Number(rwId) },
            include: { kelurahan: true },
            orderBy: { name: "asc" },
          });
        }
      } else if (roleName === "LURAH" && user.kelurahan) {
        return prisma.rw.findMany({
          where: {
            kelurahan: {
              name: { equals: user.kelurahan, mode: "insensitive" },
            },
          },
          include: { kelurahan: true },
          orderBy: { name: "asc" },
        });
      }
    }

    return binRepository.findAreas();
  }

  async getKelurahans() {
    return binRepository.findKelurahans();
  }

  async createKelurahan(name: string) {
    if (!name || name.trim().length === 0) {
      throw new Error("NAMA_KELURAHAN_INVALID");
    }
    return binRepository.createKelurahan(name.trim());
  }

  async deleteKelurahan(id: string) {
    return binRepository.deleteKelurahan(id);
  }

  async createArea(name: string, kelurahanId: string, latitude?: number, longitude?: number) {
    return binRepository.createArea(name, kelurahanId, latitude, longitude);
  }

  async updateArea(
    id: number,
    name: string,
    kelurahanId: string,
    latitude?: number,
    longitude?: number
  ) {
    return binRepository.updateArea(id, name, kelurahanId, latitude, longitude);
  }

  async deleteArea(id: number) {
    const relationCount = await binRepository.countAreaRelations(id);
    if (relationCount > 0) {
      throw new Error(
        `Lokasi tidak dapat dihapus karena memiliki ${relationCount} entitas terkait (Warga/Tempat Sampah).`
      );
    }
    return binRepository.deleteArea(id);
  }

  async getMyBins(userId: string) {
    const bins = await binRepository.findBinsByUserId(userId);

    // Fetch last waste log for these bins to determine 30-day inactivity
    const binIds = bins.map((b: any) => b.id);
    const lastLogs = await prisma.setoranOtomatis.groupBy({
      by: ["qrTempatSampahId"],
      _max: {
        createdAt: true,
      },
      where: {
        qrTempatSampahId: { in: binIds },
      },
    });

    const pendingRequests = await prisma.binResetRequest.findMany({
      where: {
        binId: { in: binIds },
        status: "PENDING",
      },
      select: {
        binId: true,
        status: true,
      },
    });
    const pendingMap = new Map();
    pendingRequests.forEach((req) => {
      pendingMap.set(req.binId, req.status);
    });

    const lastLogMap = new Map();
    lastLogs.forEach((log: any) => {
      lastLogMap.set(log.qrTempatSampahId, log._max.createdAt);
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

      const resetRequestStatus = pendingMap.get(bin.id) || null;

      return {
        id: bin.id,
        qrCode: bin.qrCode,
        category: bin.category?.name || "ORGANIK",
        currentVolumeLiter: currentVol,
        maxCapacityLiter: maxVol,
        kapasitas,
        isCritical: kapasitas >= 80,
        rw: bin.rw?.name || `RT/RW ${bin.rwId}`,
        status:
          realStatus === "TIDAK_AKTIF"
            ? "TIDAK AKTIF"
            : resetRequestStatus === "PENDING"
              ? "Pending Pengosongan"
              : kapasitas >= 80
                ? "Penuh"
                : kapasitas > 50
                  ? "Sedang"
                  : "Normal",
        householdName,
        realStatus,
        resetRequestStatus,
        isPendingReset: resetRequestStatus === "PENDING",
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
  /**
   * Cek status petugas tetap (default) warga yang sedang login.
   * @param userId - ID user warga
   * @returns { hasDefaultPetugas: boolean, petugas: {...} | null }
   */
  async getPetugasStatusForWarga(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        defaultPetugasId: true,
        rwId: true,
      },
    });
    if (!user) throw new Error("RESOURCE_NOT_FOUND");

    if (!user.defaultPetugasId) {
      return { hasDefaultPetugas: false, petugas: null };
    }

    const petugas = await prisma.user.findUnique({
      where: { id: user.defaultPetugasId },
      select: { id: true, name: true, fotoProfil: true, rwId: true },
    });

    // Reset jika petugas sudah tidak di wilayah yang sama (warga pindah)
    if (!petugas || petugas.rwId !== user.rwId) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultPetugasId: null },
      });
      return { hasDefaultPetugas: false, petugas: null };
    }

    return {
      hasDefaultPetugas: true,
      petugas: {
        id: petugas.id,
        nama: petugas.name,
        foto: petugas.fotoProfil,
      },
    };
  }

  /**
   * Ambil daftar petugas residu yang bertugas di RW yang sama dengan warga.
   * Sumber kebenaran wilayah dari profil server, bukan input frontend.
   * @param userId - ID user warga (untuk resolve rwId)
   * @returns Array petugas aktif di wilayah warga
   */
  async getPetugasByRw(userId: string) {
    const warga = await prisma.user.findUnique({
      where: { id: userId },
      select: { rwId: true },
    });
    console.log(`[getPetugasByRw] warga ${userId} → rwId: ${warga?.rwId}`);
    if (!warga?.rwId) return [];

    return prisma.user.findMany({
      where: {
        rwId: warga.rwId,
        role: { name: "PETUGAS_RESIDU" },
        status: "Aktif",
      },
      select: { id: true, name: true, fotoProfil: true },
    });
  }

  async debugPetugasData(userId?: string) {
    let warga = null;
    if (userId) {
      warga = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, rwId: true, role: { select: { name: true } } },
      });
    }
    
    const petugasList = await prisma.user.findMany({
      where: { role: { name: "PETUGAS_RESIDU" } },
      select: { id: true, name: true, rwId: true, status: true },
    });

    const wargaList = await prisma.user.findMany({
      where: { role: { name: "WARGA" } },
      select: { id: true, name: true, rwId: true },
      take: 20
    });

    return {
      warga,
      wargaList,
      petugas: petugasList,
    };
  }

  /**
   * Simpan petugas tetap (default) untuk warga.
   * Validasi: petugas wajib bertugas di RW yang sama dengan warga.
   * @param userId - ID user warga
   * @param petugasId - ID user petugas yang dipilih
   */
  async setDefaultPetugas(userId: string, petugasId: string) {
    const [warga, petugas] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { rwId: true } }),
      prisma.user.findUnique({
        where: { id: petugasId },
        select: { rwId: true, role: { select: { name: true } } },
      }),
    ]);

    if (!warga) throw new Error("RESOURCE_NOT_FOUND");
    if (!petugas) throw new Error("PETUGAS_NOT_FOUND");
    if (petugas.role.name !== "PETUGAS_RESIDU") throw new Error("NOT_PETUGAS");
    if (petugas.rwId !== warga.rwId) throw new Error("WILAYAH_MISMATCH");

    await prisma.user.update({
      where: { id: userId },
      data: { defaultPetugasId: petugasId },
    });

    return { success: true, petugasId };
  }

  async createResetRequest(
    binId: string,
    userId: string,
    evidencePhotoUrl: string,
    petugasId?: string | null,
    jenisSampah?: string | null
  ) {
    // 1. check if bin exists in DB
    const bin = await prisma.bin.findUnique({
      where: { id: binId },
      include: { binOwnerships: true },
    });
    if (!bin) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    // 2. check if owned by user
    const isOwner =
      bin.userId === userId || bin.binOwnerships.some((o: any) => o.userId === userId);
    if (!isOwner) {
      throw new Error("BIN_NOT_OWNED");
    }

    // 3. check if duplicate pending request
    const existing = await prisma.binResetRequest.findFirst({
      where: {
        binId,
        status: "PENDING",
      },
    });
    if (existing) {
      throw new Error("DUPLICATE_REQUEST");
    }

    // 4. Resolve petugasId dari defaultPetugasId warga jika tidak dikirim
    let resolvedPetugasId = petugasId ?? null;
    if (!resolvedPetugasId) {
      const warga = await prisma.user.findUnique({
        where: { id: userId },
        select: { defaultPetugasId: true },
      });
      resolvedPetugasId = warga?.defaultPetugasId ?? null;
    }

    const request = await binRepository.createResetRequest(
      binId,
      userId,
      evidencePhotoUrl,
      resolvedPetugasId,
      jenisSampah
    );

    const citizenName = request.user?.name || "Warga";
    const binQr = request.bin?.qrCode || "Tempat Sampah";
    const areaName = request.bin?.rw?.name || "Wilayah";

    // Notifikasi spesifik ke petugas tujuan (jika ada)
    if (resolvedPetugasId) {
      await prisma.notification
        .create({
          data: {
            userId: resolvedPetugasId,
            title: "Pengajuan Pengosongan Baru",
            message: `${citizenName} mengajukan pengosongan tempat sampah (${binQr}) di ${areaName}. Ketuk untuk melihat detail.`,
          },
        })
        .catch(() => {});
    } else {
      // Fallback: notif ke semua staff RW jika belum ada petugas tetap
      const staffList = await getStaffForBin(request.bin?.rwId || null);
      for (const staff of staffList) {
        await prisma.notification
          .create({
            data: {
              userId: staff.id,
              title: "Pengajuan Pengosongan Baru",
              message: `${citizenName} mengajukan pengosongan tempat sampah (${binQr}) di ${areaName}.`,
            },
          })
          .catch(() => {});
      }
    }

    // Notifikasi konfirmasi ke warga
    await prisma.notification
      .create({
        data: {
          userId,
          title: "Pengajuan Pengosongan Dikirim",
          message: `Pengajuan pengosongan tempat sampah ${binQr} berhasil dikirim. Status: PENDING.`,
        },
      })
      .catch(() => {});

    return request;
  }

  /**
   * Get reset request by ID
   */
  async getResetRequest(id: string) {
    return binRepository.findResetRequestById(id);
  }

  /**
   * List reset requests with area-scoping
   */
  async listResetRequests(
    currentUser?: { userId: string; role: string },
    filters?: { status?: string }
  ) {
    let whereClause: any = {};
    if (currentUser) {
      const { getScopingFilters } = await import("../utils/rbacScoping.js");
      const scoping = await getScopingFilters(currentUser);
      if (scoping.binFilter) {
        whereClause.bin = scoping.binFilter;
      }
    }

    if (filters && filters.status) {
      whereClause.status = filters.status;
    }

    return prisma.binResetRequest.findMany({
      where: whereClause,
      include: {
        bin: {
          include: {
            rw: {
              include: {
                kelurahan: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Review (approve/reject/in-progress) reset request
   */
  async reviewResetRequest(
    id: string,
    status: "APPROVED" | "REJECTED" | "COMPLETED" | "ON_PROGRESS",
    reviewedById: string
  ) {
    const request = await binRepository.findResetRequestById(id);
    if (!request) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    const updated = await binRepository.updateResetRequestStatus(id, status as any, reviewedById);

    if (status === "APPROVED" || status === "COMPLETED") {
      // Reset Bin volume
      await binRepository.updateVolume(request.binId, 0.0);

      if (reviewedById) {
        const existingReward = await prisma.pointHistory.findFirst({
          where: {
            userId: reviewedById,
            description: { contains: request.bin?.qrCode || id },
            kategori: "VALIDASI_PENGOSONGAN",
          },
        });
        if (!existingReward) {
          await prisma.pointHistory.create({
            data: {
              userId: reviewedById,
              points: 15,
              description: `Reward validasi pengosongan tempat sampah (${request.bin?.qrCode || id})`,
              kategori: "VALIDASI_PENGOSONGAN",
              redeemable: false,
            },
          }).catch(() => {});
        }
      }

      // Notify Warga
      await binRepository
        .createNotification(
          request.userId,
          "Pengajuan Disetujui",
          `Petugas telah memverifikasi foto bukti Anda dan mereset kapasitas tempat sampah ${request.bin.qrCode} menjadi 0%.`
        )
        .catch(() => {});
    } else if (status === "REJECTED") {
      // Notify Warga
      await binRepository
        .createNotification(
          request.userId,
          "Pengajuan Ditolak",
          `Foto bukti pengosongan tempat sampah ${request.bin.qrCode} Anda ditolak oleh petugas. Silakan ajukan kembali.`
        )
        .catch(() => {});
    } else if (status === "ON_PROGRESS") {
      // Notify Warga
      await binRepository
        .createNotification(
          request.userId,
          "Pengangkutan Sedang Berlangsung",
          `Petugas sedang menuju lokasi Anda untuk mengosongkan tempat sampah ${request.bin.qrCode}.`
        )
        .catch(() => {});
    }

    // Log to Audit Trail
    await prisma.auditTrail
      .create({
        data: {
          action: "REVIEW_RESET_REQUEST",
          userId: reviewedById,
          oldValue: { status: request.status, request: id },
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
            rw: true,
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
        rw: t.bin.rw?.name || `RT/RW ${t.bin.rwId}`,
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
      const newStatus = bin.qrBatchId ? "ACTIVE_BOUND" : "PRINTED";
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
    _notes: string,
    evidencePhotoUrl?: string
  ) {
    const bin = await prisma.bin.findUnique({
      where: { id: binId },
      include: { rw: true },
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

    const staffList = await getStaffForBin(bin.rwId);

    if (issueType === "EMPTY_REQUEST") {
      // 1. Update bin volume to maxCapacityLiter (forces capacity to 100% full, showing red on map)
      await prisma.bin.update({
        where: { id: bin.id },
        data: {
          currentVolumeLiter: bin.maxCapacityLiter,
        },
      });

      // 2. Find or create pending dispatch task for this bin
      let task = await prisma.dispatchTask.findFirst({
        where: {
          binId: bin.id,
          status: "PENDING",
        },
      });

      if (!task) {
        task = await prisma.dispatchTask.create({
          data: {
            binId: bin.id,
            status: "PENDING",
          },
        });
      }

      // Broadcast alert via WebSocket if bin has coordinates
      if (bin.latitude !== null && bin.longitude !== null) {
        await websocketService
          .broadcastDispatch(bin.id, bin.qrCode, Number(bin.latitude), Number(bin.longitude))
          .catch(() => {});
      }

      const title = "Permintaan Pengosongan Sampah";
      const message = `[PANGGILAN] Warga (${user.name}) di (${user.address || bin.rw?.name || "Wilayah Umum"}) meminta petugas segera mengosongkan tempat sampah ${bin.qrCode}.`;

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
      const message = `Warga (${user.name}) melaporkan bahwa tempat sampah ${bin.qrCode} di (${user.address || bin.rw?.name || "Wilayah Umum"}) rusak atau QR code-nya sobek/rusak.`;

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
