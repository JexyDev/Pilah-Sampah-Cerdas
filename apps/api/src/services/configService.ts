/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { redisService } from "./redisService.js";

const prisma = new PrismaClient();

export class ConfigService {
  /**
   * Get configuration parameter by key with Redis caching
   */
  async getConfig(key: string): Promise<string> {
    const cached = await redisService.getConfigCache(key);
    if (cached !== null) {
      return cached;
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    const val = config ? config.value : "";
    await redisService.setConfigCache(key, val);
    return val;
  }

  /**
   * Update configuration parameter & invalidate Redis cache
   */
  async updateConfig(key: string, value: string): Promise<any> {
    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value, tipe: "string", deskripsi: "" },
    });

    await redisService.invalidateConfigCache(key);
    return updated;
  }

  /**
   * Get all configuration parameters
   */
  async getAllConfigs() {
    return prisma.systemConfig.findMany({
      orderBy: { key: "asc" },
    });
  }

  /**
   * Get Rule Engine structured configurations
   */
  async getRuleEngineConfigs() {
    const keys = [
      "reporting_window_morning_start",
      "reporting_window_morning_end",
      "reporting_window_evening_start",
      "reporting_window_evening_end",
      "warga_reminder_notification_enabled",
      "late_submission_discount",
      "late_submission_penalty_active",
      "attendance_min_duration_hours",
      "attendance_min_duration_minutes",
      "attendance_min_duration_seconds",
      "attendance_out_of_zone_tolerance_minutes",
    ];

    const records = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    records.forEach((r) => {
      map[r.key] = r.value;
    });

    return {
      // Rule 1: Jadwal Pemilahan Sampah Warga
      reportingWindowMorningStart: map["reporting_window_morning_start"] || "06:00",
      reportingWindowMorningEnd: map["reporting_window_morning_end"] || "08:00",
      reportingWindowEveningStart: map["reporting_window_evening_start"] || "16:00",
      reportingWindowEveningEnd: map["reporting_window_evening_end"] || "18:00",
      wargaReminderNotificationEnabled: map["warga_reminder_notification_enabled"] !== "false",

      // Rule 2: Pengurangan Poin Perilaku Ketidakdisiplinan
      lateSubmissionDiscount: parseFloat(map["late_submission_discount"] || "0.5"),
      lateSubmissionPenaltyActive: map["late_submission_penalty_active"] !== "false",

      // Rule 3: Waktu Minimal di Lokasi Absen (Presensi Mahasiswa KKN)
      attendanceMinDurationHours: parseInt(map["attendance_min_duration_hours"] || "2", 10),
      attendanceMinDurationMinutes: parseInt(map["attendance_min_duration_minutes"] || "0", 10),
      attendanceMinDurationSeconds: parseInt(map["attendance_min_duration_seconds"] || "0", 10),
      attendanceOutOfZoneToleranceMinutes: parseInt(map["attendance_out_of_zone_tolerance_minutes"] || "15", 10),
    };
  }

  /**
   * Update Rule Engine configurations in batch
   */
  async updateRuleEngineConfigs(data: any) {
    const pairs: Array<{ key: string; value: string }> = [
      { key: "reporting_window_morning_start", value: String(data.reportingWindowMorningStart ?? "06:00") },
      { key: "reporting_window_morning_end", value: String(data.reportingWindowMorningEnd ?? "08:00") },
      { key: "reporting_window_evening_start", value: String(data.reportingWindowEveningStart ?? "16:00") },
      { key: "reporting_window_evening_end", value: String(data.reportingWindowEveningEnd ?? "18:00") },
      { key: "warga_reminder_notification_enabled", value: String(data.wargaReminderNotificationEnabled ?? true) },
      { key: "late_submission_discount", value: String(data.lateSubmissionDiscount ?? 0.5) },
      { key: "late_submission_penalty_active", value: String(data.lateSubmissionPenaltyActive ?? true) },
      { key: "attendance_min_duration_hours", value: String(data.attendanceMinDurationHours ?? 2) },
      { key: "attendance_min_duration_minutes", value: String(data.attendanceMinDurationMinutes ?? 0) },
      { key: "attendance_min_duration_seconds", value: String(data.attendanceMinDurationSeconds ?? 0) },
      { key: "attendance_out_of_zone_tolerance_minutes", value: String(data.attendanceOutOfZoneToleranceMinutes ?? 15) },
    ];

    for (const item of pairs) {
      await this.updateConfig(item.key, item.value);
    }

    return this.getRuleEngineConfigs();
  }
}

export const configService = new ConfigService();
