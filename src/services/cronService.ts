/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";

const prisma = new PrismaClient();

export const cronService = {
  start: () => {
    // Run checking loop every minute
    setInterval(async () => {
      try {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const timeStr = `${hours}:${minutes}`;

        // Get window configs
        const morningEndVal = await configService.getConfig("reporting_window_morning_end");
        const eveningEndVal = await configService.getConfig("reporting_window_evening_end");
        const morningEnd = morningEndVal || "08:00";
        const eveningEnd = eveningEndVal || "18:00";

        if (timeStr === morningEnd) {
          await cronService.evaluateShiftPenalty("morning");
        } else if (timeStr === eveningEnd) {
          await cronService.evaluateShiftPenalty("evening");
        }
      } catch (error) {
        // Silent catch to prevent crash
      }
    }, 60 * 1000);

    console.log("Cron Scheduler Service started.");
  },

  evaluateShiftPenalty: async (shift: "morning" | "evening") => {
    console.log(`Evaluating KPI penalty for shift: ${shift}...`);

    // 1. Get shift time boundary
    const now = new Date();
    const startLimit = new Date(now);
    const endLimit = new Date(now);

    if (shift === "morning") {
      const morningStartVal = await configService.getConfig("reporting_window_morning_start");
      const morningEndVal = await configService.getConfig("reporting_window_morning_end");
      const startStr = morningStartVal || "06:00";
      const endStr = morningEndVal || "08:00";

      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      startLimit.setHours(sh, sm, 0, 0);
      endLimit.setHours(eh, em, 0, 0);
    } else {
      const eveningStartVal = await configService.getConfig("reporting_window_evening_start");
      const eveningEndVal = await configService.getConfig("reporting_window_evening_end");
      const startStr = eveningStartVal || "16:00";
      const endStr = eveningEndVal || "18:00";

      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      startLimit.setHours(sh, sm, 0, 0);
      endLimit.setHours(eh, em, 0, 0);
    }

    // 2. Get penalty value
    const penaltyVal = await configService.getConfig("late_report_kpi_penalty_percent");
    const penaltyAmount = penaltyVal ? Number(penaltyVal) : 15.0;

    // 3. Get all Petugas Residu
    const allPetugas = await prisma.petugasResidu.findMany();

    for (const petugas of allPetugas) {
      // Find verified logs by this petugas within the shift window
      const reportsCount = await prisma.wasteLog.count({
        where: {
          verifiedByPetugasId: petugas.userId,
          verifiedAt: {
            gte: startLimit,
            lte: endLimit,
          },
        },
      });

      if (reportsCount === 0) {
        const oldScore = Number(petugas.kpiScore);
        const newScore = Math.max(0, oldScore - penaltyAmount);

        await prisma.petugasResidu.update({
          where: { id: petugas.id },
          data: { kpiScore: newScore },
        });

        // Write to Audit Trail
        await prisma.auditTrail.create({
          data: {
            action: `SYSTEM_KPI_PENALTY`,
            userId: petugas.userId,
            oldValue: { kpiScore: oldScore },
            newValue: { kpiScore: newScore, reason: `Tidak melapor selama shift ${shift}` },
          },
        });

        console.log(`Petugas ${petugas.nama} penalized -${penaltyAmount} KPI score (No reports in shift ${shift}).`);
      }
    }
  },
};
