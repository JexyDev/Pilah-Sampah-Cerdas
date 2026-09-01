import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { redisService } from "./redisService.js";

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
      "attendance_out_of_zone_penalty_points",
      "attendance_out_of_zone_penalty_active",
      "kkn_start_date",
      "kkn_end_date",
      "kkn_auto_holiday_weekends",
      "kkn_holidays",
      "alpha_penalty_points",
      "alpha_penalty_score_percent",
      "attendance_geofence_buffer_meters",
      "attendance_geofence_invalidation_hours",
      "attendance_auto_hadir_outside_zone",
      "logbook_target_kegiatan",
      "logbook_backdate_tolerance_days",
      "logbook_bobot_persen",
    ];

    const records = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    records.forEach((r) => {
      map[r.key] = r.value;
    });

    let holidaysParsed: Array<{ date: string; description: string }> = [];
    try {
      if (map["kkn_holidays"]) {
        holidaysParsed = JSON.parse(map["kkn_holidays"]);
      }
    } catch {
      holidaysParsed = [];
    }

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
      attendanceMinDurationHours: parseInt(map["attendance_min_duration_hours"] || "4", 10),
      attendanceMinDurationMinutes: parseInt(map["attendance_min_duration_minutes"] || "0", 10),
      attendanceMinDurationSeconds: parseInt(map["attendance_min_duration_seconds"] || "0", 10),
      attendanceOutOfZoneToleranceMinutes: parseInt(
        map["attendance_out_of_zone_tolerance_minutes"] || "5",
        10
      ),
      attendanceOutOfZonePenaltyPoints: parseInt(
        map["attendance_out_of_zone_penalty_points"] || "10",
        10
      ),
      attendanceOutOfZonePenaltyActive: map["attendance_out_of_zone_penalty_active"] !== "false",

      // Rule 4: Kalender KKN & Hari Libur Absensi
      kknStartDate: map["kkn_start_date"] || "2026-08-20",
      kknEndDate: map["kkn_end_date"] || "2026-10-20",
      kknAutoHolidayWeekends: map["kkn_auto_holiday_weekends"] !== "false",
      kknHolidays: holidaysParsed,

      // Rule 5: Penalti Alpha (Tanpa Keterangan)
      alphaPenaltyPoints: parseInt(map["alpha_penalty_points"] || "10", 10),
      alphaPenaltyScorePercent: parseFloat(map["alpha_penalty_score_percent"] || "5.0"),

      // Rule 6: Geofence Buffer & Auto-Attendance
      attendanceGeofenceBufferMeters: parseInt(
        map["attendance_geofence_buffer_meters"] || "15",
        10
      ),
      attendanceGeofenceInvalidationHours: parseInt(
        map["attendance_geofence_invalidation_hours"] || "2",
        10
      ),
      attendanceAutoHadirOutsideZone: map["attendance_auto_hadir_outside_zone"] !== "false",

      // Rule 7: Standar Logbook KKN & Prasyarat Nilai DPL
      logbookTargetKegiatan: parseInt(map["logbook_target_kegiatan"] || "24", 10),
      logbookBackdateToleranceDays: parseInt(map["logbook_backdate_tolerance_days"] || "1", 10),
      logbookBobotPersen: parseInt(map["logbook_bobot_persen"] || "20", 10),
    };
  }

  /**
   * Helper to check if a specific Date is a KKN holiday or non-effective attendance day
   */
  async isDateKknHoliday(targetDate: Date): Promise<{ isHoliday: boolean; reason?: string }> {
    const configs = await this.getRuleEngineConfigs();
    const targetDateStr = targetDate.toISOString().slice(0, 10);

    // 1. Check if prior to KKN start date
    if (configs.kknStartDate && targetDateStr < configs.kknStartDate) {
      return { isHoliday: true, reason: "Sebelum Periode Resmi KKN Dimulai" };
    }

    // 2. Check if past KKN end date
    if (configs.kknEndDate && targetDateStr > configs.kknEndDate) {
      return { isHoliday: true, reason: "Setelah Periode KKN Berakhir" };
    }

    // 3. Check weekend (0: Sunday, 6: Saturday)
    if (configs.kknAutoHolidayWeekends) {
      const day = targetDate.getDay();
      if (day === 0) return { isHoliday: true, reason: "Hari Minggu (Libur Akhir Pekan)" };
      if (day === 6) return { isHoliday: true, reason: "Hari Sabtu (Libur Akhir Pekan)" };
    }

    // 4. Check custom holidays list
    const foundHoliday = configs.kknHolidays.find((h) => h.date === targetDateStr);
    if (foundHoliday) {
      return {
        isHoliday: true,
        reason: foundHoliday.description || "Hari Libur Khusus / Nasional",
      };
    }

    return { isHoliday: false };
  }

  /**
   * Update Rule Engine configurations in batch
   */
  async updateRuleEngineConfigs(data: any) {
    const pairs: Array<{ key: string; value: string }> = [
      {
        key: "reporting_window_morning_start",
        value: String(data.reportingWindowMorningStart ?? "06:00"),
      },
      {
        key: "reporting_window_morning_end",
        value: String(data.reportingWindowMorningEnd ?? "08:00"),
      },
      {
        key: "reporting_window_evening_start",
        value: String(data.reportingWindowEveningStart ?? "16:00"),
      },
      {
        key: "reporting_window_evening_end",
        value: String(data.reportingWindowEveningEnd ?? "18:00"),
      },
      {
        key: "warga_reminder_notification_enabled",
        value: String(data.wargaReminderNotificationEnabled ?? true),
      },
      { key: "late_submission_discount", value: String(data.lateSubmissionDiscount ?? 0.5) },
      {
        key: "late_submission_penalty_active",
        value: String(data.lateSubmissionPenaltyActive ?? true),
      },
      { key: "attendance_min_duration_hours", value: String(data.attendanceMinDurationHours ?? 4) },
      {
        key: "attendance_min_duration_minutes",
        value: String(data.attendanceMinDurationMinutes ?? 0),
      },
      {
        key: "attendance_min_duration_seconds",
        value: String(data.attendanceMinDurationSeconds ?? 0),
      },
      {
        key: "attendance_out_of_zone_tolerance_minutes",
        value: String(data.attendanceOutOfZoneToleranceMinutes ?? 5),
      },
      {
        key: "attendance_out_of_zone_penalty_points",
        value: String(data.attendanceOutOfZonePenaltyPoints ?? 10),
      },
      {
        key: "attendance_out_of_zone_penalty_active",
        value: String(data.attendanceOutOfZonePenaltyActive ?? true),
      },
      { key: "kkn_start_date", value: String(data.kknStartDate ?? "2026-08-20") },
      { key: "kkn_end_date", value: String(data.kknEndDate ?? "2026-10-20") },
      { key: "kkn_auto_holiday_weekends", value: String(data.kknAutoHolidayWeekends ?? true) },
      { key: "alpha_penalty_points", value: String(data.alphaPenaltyPoints ?? 10) },
      { key: "alpha_penalty_score_percent", value: String(data.alphaPenaltyScorePercent ?? 5.0) },
      {
        key: "kkn_holidays",
        value:
          typeof data.kknHolidays === "string"
            ? data.kknHolidays
            : JSON.stringify(data.kknHolidays ?? []),
      },
      {
        key: "attendance_geofence_buffer_meters",
        value: String(data.attendanceGeofenceBufferMeters ?? 15),
      },
      {
        key: "attendance_geofence_invalidation_hours",
        value: String(data.attendanceGeofenceInvalidationHours ?? 2),
      },
      {
        key: "attendance_auto_hadir_outside_zone",
        value: String(data.attendanceAutoHadirOutsideZone ?? true),
      },
      { key: "logbook_target_kegiatan", value: String(data.logbookTargetKegiatan ?? 24) },
      {
        key: "logbook_backdate_tolerance_days",
        value: String(data.logbookBackdateToleranceDays ?? 1),
      },
      { key: "logbook_bobot_persen", value: String(data.logbookBobotPersen ?? 20) },
    ];

    for (const item of pairs) {
      await this.updateConfig(item.key, item.value);
    }

    return this.getRuleEngineConfigs();
  }

  /**
   * Get dynamic App Version configuration for Mobile Force Update
   */
  async getAppVersionConfig(): Promise<{
    min_required_version: string;
    latest_version: string;
    update_url: string;
  }> {
    const minRequired =
      (await this.getConfig("app_min_required_version")) ||
      (await this.getConfig("min_required_version")) ||
      process.env.APP_MIN_REQUIRED_VERSION ||
      "1.0.0";

    const latest =
      (await this.getConfig("app_latest_version")) ||
      (await this.getConfig("latest_version")) ||
      process.env.APP_LATEST_VERSION ||
      "1.0.0";

    const updateUrl =
      (await this.getConfig("app_update_url")) ||
      (await this.getConfig("update_url")) ||
      process.env.APP_UPDATE_URL ||
      "https://play.google.com/store/apps/details?id=com.berseka.app";

    return {
      min_required_version: minRequired.trim(),
      latest_version: latest.trim(),
      update_url: updateUrl.trim(),
    };
  }

  /**
   * Update dynamic App Version configuration
   */
  async updateAppVersionConfig(payload: {
    min_required_version?: string;
    latest_version?: string;
    update_url?: string;
  }) {
    if (payload.min_required_version) {
      await this.updateConfig("min_required_version", payload.min_required_version.trim());
      await this.updateConfig("app_min_required_version", payload.min_required_version.trim());
    }
    if (payload.latest_version) {
      await this.updateConfig("latest_version", payload.latest_version.trim());
      await this.updateConfig("app_latest_version", payload.latest_version.trim());
    }
    if (payload.update_url) {
      await this.updateConfig("update_url", payload.update_url.trim());
      await this.updateConfig("app_update_url", payload.update_url.trim());
    }

    return this.getAppVersionConfig();
  }
}

export const configService = new ConfigService();
