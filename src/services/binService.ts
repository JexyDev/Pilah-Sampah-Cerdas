/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { v4 as uuidv4 } from "uuid";
import { binRepository } from "../repositories/binRepository.js";
import { getDistanceMeters } from "../utils/haversineUtils.js";
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { websocketService } from "./websocketService.js";

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
  async getAllBins(currentUser?: { userId: string; role: string }) {
    if (currentUser) {
      const { getScopingFilters } = await import("../utils/rbacScoping.js");
      const scoping = await getScopingFilters(currentUser);
      return binRepository.findAll(scoping.binFilter);
    }
    return binRepository.findAll();
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
    userLng?: number
  ) {
    // 1. Find the Bin
    const bin = await binRepository.findByQrCode(qrCode);
    if (!bin) {
      throw new Error("BIN_NOT_FOUND");
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

    // 3. Validate trash type matching
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
          await websocketService.broadcastDispatch(
            bin.id,
            bin.qrCode,
            Number(bin.latitude),
            Number(bin.longitude)
          ).catch(() => {});
        }
      }
    }

    // 6. Convert liters to weight based on density
    // Use fixed multiplier for Organic vs Non-Organic for now (simplified)
    const isOrganic = bin.category.name === "ORGANIC";
    const factor = isOrganic ? DENSITY.ORGANIC : DENSITY.NON_ORGANIC;
    const weightKg = parseFloat((estimatedVolume * factor).toFixed(2));

    // 7. Calculate points
    // Fallback if pointsPerKg is 0 in DB
    const pointsPerKg = bin.category.pointsPerKg || (isOrganic ? 100 : 50);
    const calculatedPoints = Math.round(weightKg * pointsPerKg);

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
      bin.category.name
    );

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
    return bin;
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
    const qrCode = data.qrCode || `TS-${Date.now()}`;
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

    return bins.map((bin: any) => {
      const currentVol = Number(bin.currentVolumeLiter);
      const maxVol = Number(bin.maxCapacityLiter);
      const kapasitas = maxVol > 0 ? Math.round((currentVol / maxVol) * 100) : 0;
      const utamaOwner = bin.binOwnerships?.find((o: any) => o.type === "UTAMA")?.user;
      const householdName = utamaOwner ? utamaOwner.name : "Tempat Sampah Umum";

      return {
        id: bin.id,
        qrCode: bin.qrCode,
        category: bin.category.name,
        currentVolumeLiter: currentVol,
        maxCapacityLiter: maxVol,
        kapasitas,
        rtRw: bin.rtRw?.name || `RT/RW ${bin.rtRwId}`,
        status: kapasitas > 80 ? "Penuh" : kapasitas > 50 ? "Sedang" : "Normal",
        householdName,
      };
    });
  }

  /**
   * Create bin reset request and notify area petugas
   */
  async createResetRequest(binId: string, userId: string, evidencePhotoUrl: string) {
    const request = await binRepository.createResetRequest(binId, userId, evidencePhotoUrl);

    // Notify all Petugas/Admin
    const petugasList = await binRepository.findPetugasForArea(request.bin.rtRwId);
    for (const petugas of petugasList) {
      await binRepository
        .createNotification(
          petugas.id,
          "Pengajuan Pengosongan Baru",
          `[REQ-${request.id}] Warga (${request.user.name}) mengajukan pengosongan tong ${request.bin.qrCode} di ${request.bin.rtRw.name}.`
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
}

export const binService = new BinService();
