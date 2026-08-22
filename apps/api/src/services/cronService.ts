import { prisma } from "../lib/prisma.js";
import cron from "node-cron";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
export class CronService {
  public start() {
    // Notifications for schedule start
    cron.schedule("0 6 * * *", () => {
      this.triggerScheduleNotifications("MORNING");
    });
    cron.schedule("0 16 * * *", () => {
      this.triggerScheduleNotifications("EVENING");
    });
    // Escalations at the end of the window
    cron.schedule("1 8 * * *", () => {
      this.checkEscalations("MORNING");
    });
    cron.schedule("1 18 * * *", () => {
      this.checkEscalations("EVENING");
    });
    // Daily citizens absence penalty
    cron.schedule("0 0 * * *", () => {
      this.evaluateDailyWargaPenalty();
    });
    // Window absence penalty (At the end of each window)
    cron.schedule("5 8 * * *", () => {
      this.checkWindowAbsence("MORNING");
    });
    cron.schedule("5 18 * * *", () => {
      this.checkWindowAbsence("EVENING");
    });
    // Inactive bins synchronization daily at 01:00 AM
    cron.schedule("0 1 * * *", () => {
      this.syncInactiveBins();
    });
    // Check Mahasiswa Geofence every 2 hours
    cron.schedule("0 */2 * * *", () => {
      this.checkMahasiswaGeofence();
    });
    // Cleanup expired tokens, OTPs, and stale logs daily at 02:00 AM
    cron.schedule("0 2 * * *", () => {
      this.cleanupStaleData();
    });
    console.log("[CronService] Escalation and optimization cron jobs started.");
  }
  public async cleanupStaleData() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const deletedOtp = await prisma.otpCode.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { used: true, createdAt: { lt: oneHourAgo } },
          ],
        },
      });
      const deletedTokens = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });
      console.log(`[CronService] Cleanup completed: ${deletedOtp.count} OTPs, ${deletedTokens.count} tokens purged.`);
    } catch (e) {
      console.error("[CronService] cleanupStaleData error:", e);
    }
  }
  private async triggerScheduleNotifications(window: "MORNING" | "EVENING") {
    try {
      console.log(`[CronService] Triggering schedule notifications for ${window}...`);
      // 1. Check if Warga reminder notification is enabled in Rule Engine
      const reminderConfig = await prisma.systemConfig.findUnique({
        where: { key: "warga_reminder_notification_enabled" },
      });
      const isReminderEnabled = reminderConfig ? reminderConfig.value !== "false" : true;
      // 2. Fetch window times from Rule Engine config
      const morningStartConfig = await prisma.systemConfig.findUnique({ where: { key: "reporting_window_morning_start" } });
      const morningEndConfig = await prisma.systemConfig.findUnique({ where: { key: "reporting_window_morning_end" } });
      const eveningStartConfig = await prisma.systemConfig.findUnique({ where: { key: "reporting_window_evening_start" } });
      const eveningEndConfig = await prisma.systemConfig.findUnique({ where: { key: "reporting_window_evening_end" } });
      const morningStart = morningStartConfig?.value || "06:00";
      const morningEnd = morningEndConfig?.value || "08:00";
      const eveningStart = eveningStartConfig?.value || "16:00";
      const eveningEnd = eveningEndConfig?.value || "18:00";
      // 3. Send notifications to Warga if enabled
      if (isReminderEnabled) {
        const wargaList = await prisma.user.findMany({
          where: { role: { name: "WARGA" }, status: "Aktif" },
        });
        const windowTimeLabel = window === "MORNING" ? `${morningStart} - ${morningEnd} WIB` : `${eveningStart} - ${eveningEnd} WIB`;
        const title = `⏰ Saatnya Pemilahan Sampah (${window === "MORNING" ? "Pagi" : "Sore"})`;
        const message = `Pengingat BERSEKA: Jendela pemilahan sampah sesi ${window === "MORNING" ? "Pagi" : "Sore"} (${windowTimeLabel}) telah dibuka. Mari pilah dan setor sampah Organik & Anorganik Anda!`;
        const notifications = wargaList.map((w) => ({
          userId: w.id,
          title,
          message,
        }));
        if (notifications.length > 0) {
          await prisma.notification.createMany({ data: notifications });
        }
        // Send FCM push notifications for users with tokens
        for (const w of wargaList) {
          if (w.fcmToken) {
            await notificationIntegrationService.sendPushNotification(w.fcmToken, title, message);
          }
        }
      }
      // 4. Send notification to Petugas Residu for collection
      const fullBins = await prisma.bin.findMany({
        where: { status: "ACTIVE_BOUND" },
      });
      const targetBins = fullBins.filter((b) => {
        const vol = Number(b.currentVolumeLiter);
        const max = Number(b.maxCapacityLiter);
        return max > 0 && vol / max >= 0.7;
      });
      const petugas = await prisma.user.findMany({
        where: { role: { name: "PETUGAS_RESIDU" } },
      });
      for (const p of petugas) {
        await prisma.notification.create({
          data: {
            userId: p.id,
            title: `Jadwal Pengangkutan Sampah (${window === "MORNING" ? "Pagi" : "Sore"})`,
            message: `Jendela ${window === "MORNING" ? "Pagi" : "Sore"} dibuka. Terdapat ${targetBins.length} tempat sampah yang perlu diangkut.`,
          },
        });
      }
    } catch (e) {
      console.error("[CronService] triggerScheduleNotifications error:", e);
    }
  }
  public async evaluateShiftPenalty(_shift: string) {
    try {
      const petugasList = await prisma.petugasResidu.findMany({
        where: { whitelistStatus: "APPROVED" },
      });
      for (const petugas of petugasList) {
        const count = await prisma.setoranManual.count({
          where: {
            petugasResiduId: petugas.userId,
          },
        });
        if (count === 0) {
          const penaltyPercent = 15;
          const newScore = Math.max(0, Number(petugas.kpiScore) - penaltyPercent);
          await prisma.petugasResidu.update({
            where: { id: petugas.id },
            data: { kpiScore: newScore },
          });
          await prisma.auditTrail.create({
            data: {
              action: "SYSTEM_KPI_PENALTY",
              userId: petugas.userId,
              newValue: { petugasId: petugas.id, kpiScore: newScore },
            },
          });
        }
      }
    } catch (e) {
      console.error("[CronService] evaluateShiftPenalty error:", e);
    }
  }
  private async checkEscalations(window: "MORNING" | "EVENING") {
    try {
      console.log(`[CronService] Checking escalations for ${window} window...`);
      const pendingTasks = await prisma.dispatchTask.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lte: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
        },
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
        },
      });
      for (const task of pendingTasks) {
        await this.notifyHierarchy("RW", task.bin.rwId, task.bin.qrCode);
        if (task.bin.rw?.kelurahanId) {
          await this.notifyHierarchy("LURAH", task.bin.rw.kelurahanId, task.bin.qrCode);
        }
        await this.notifyHierarchy("ADMIN_DLH", "GLOBAL", task.bin.qrCode);
        await prisma.dispatchTask.update({
          where: { id: task.id },
          data: { status: "ESCALATED" as any },
        });
      }
      console.log(`[CronService] Escalated ${pendingTasks.length} missed dispatch tasks.`);
    } catch (error) {
      console.error("[CronService] checkEscalations error:", error);
    }
  }
  private async notifyHierarchy(role: string, _areaId: any, qrCode: string) {
    const users = await prisma.user.findMany({
      where: {
        role: { name: role },
      },
    });
    const notifications = users.map((u) => ({
      userId: u.id,
      title: "ESKALASI: Keterlambatan Pengangkutan",
      message: `Tempat sampah dengan QR ${qrCode} belum diangkut pada jadwalnya. Mohon segera tindak lanjuti.`,
    }));
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  }
  public async evaluateDailyWargaPenalty() {
    try {
      console.log("[CronService] Evaluating daily citizens waste submission penalty...");
      const wargaList = await prisma.user.findMany({
        where: {
          role: { name: "WARGA" },
        },
      });
      for (const warga of wargaList) {
        let absenceStreak = 0;
        let dayOffset = 1;
        while (true) {
          const startOfCheckDay = new Date();
          startOfCheckDay.setDate(startOfCheckDay.getDate() - dayOffset);
          startOfCheckDay.setHours(0, 0, 0, 0);
          const endOfCheckDay = new Date();
          endOfCheckDay.setDate(endOfCheckDay.getDate() - dayOffset);
          endOfCheckDay.setHours(23, 59, 59, 999);
          const hasSubmittedOnDay = await prisma.setoranOtomatis.findFirst({
            where: {
              wargaId: warga.id,
              createdAt: {
                gte: startOfCheckDay,
                lte: endOfCheckDay,
              },
            },
          });
          if (!hasSubmittedOnDay) {
            absenceStreak++;
            dayOffset++;
            if (dayOffset > 30) break;
          } else {
            break;
          }
        }
        if (absenceStreak > 0) {
          const penaltyAmount = absenceStreak;
          const pointSumObj = await prisma.pointHistory.aggregate({
            where: { userId: warga.id },
            _sum: { points: true },
          });
          const currentPoints = pointSumObj._sum.points || 0;
          if (currentPoints > 0) {
            const deduction = Math.min(penaltyAmount, currentPoints);
            await prisma.pointHistory.create({
              data: {
                userId: warga.id,
                points: -deduction,
                description: `Penalti absen buang sampah harian (hari ke-${absenceStreak})`,
                kategori: "REDUKSI_TONASE",
              },
            });
            console.log(
              `[CronService] Deducted ${deduction} points from citizen ${warga.name} due to ${absenceStreak} days of absence.`
            );
          }
          const title = "Penalti Absen Buang Sampah";
          const msg = `Anda belum menyetor sampah selama ${absenceStreak} hari berturut-turut. Poin Anda berkurang -${penaltyAmount} hari ini. Ayo segera setor dan pilah sampah Anda!`;
          await prisma.notification.create({
            data: {
              userId: warga.id,
              title: title,
              message: msg,
            },
          });
          if (warga.fcmToken && absenceStreak >= 3) {
            await notificationIntegrationService.sendPushNotification(warga.fcmToken, title, msg);
          }
        }
      }
    } catch (error) {
      console.error("[CronService] evaluateDailyWargaPenalty error:", error);
    }
  }
  public async checkWindowAbsence(window: "MORNING" | "EVENING") {
    try {
      console.log(`[CronService] Evaluating window absence penalty for ${window}...`);
      const wargaList = await prisma.user.findMany({
        where: {
          role: { name: "WARGA" },
        },
      });
      const now = new Date();
      const startHour = window === "MORNING" ? 6 : 16;
      const endHour = window === "MORNING" ? 8 : 18;
      const windowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        startHour,
        0,
        0,
        0
      );
      const windowEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        endHour,
        0,
        0,
        0
      );
      const penaltyConfig = await prisma.systemConfig.findUnique({
        where: { key: "window_absence_penalty" },
      });
      const penaltyAmount = penaltyConfig ? Math.abs(Number(penaltyConfig.value)) : 5;
      for (const warga of wargaList) {
        const activeBinsCount = await prisma.bin.count({
          where: {
            OR: [{ userId: warga.id }, { binOwnerships: { some: { userId: warga.id } } }],
            status: "ACTIVE_BOUND",
          },
        });
        if (activeBinsCount === 0) {
          continue;
        }
        const hasSubmitted = await prisma.setoranOtomatis.findFirst({
          where: {
            wargaId: warga.id,
            createdAt: {
              gte: windowStart,
              lte: windowEnd,
            },
          },
        });
        if (!hasSubmitted) {
          const pointSumObj = await prisma.pointHistory.aggregate({
            where: { userId: warga.id },
            _sum: { points: true },
          });
          const currentPoints = pointSumObj._sum.points || 0;
          if (currentPoints > 0) {
            const deduction = Math.min(penaltyAmount, currentPoints);
            await prisma.pointHistory.create({
              data: {
                userId: warga.id,
                points: -deduction,
                description: `Penalti melewatkan jadwal buang sampah ${window === "MORNING" ? "Pagi" : "Sore"}`,
                kategori: "REDUKSI_TONASE",
              },
            });
            console.log(
              `[CronService] Deducted ${deduction} points from citizen ${warga.name} for missing ${window} window.`
            );
          }
          await prisma.notification.create({
            data: {
              userId: warga.id,
              title: `Jadwal Buang Sampah Terlewat (${window === "MORNING" ? "Pagi" : "Sore"})`,
              message: `Anda tidak memindai sampah pada jadwal ${window === "MORNING" ? "pagi (06:00-08:00)" : "sore (16:00-18:00)"}. Poin Anda dikurangi -${penaltyAmount}.`,
            },
          });
        }
      }
    } catch (error) {
      console.error("[CronService] checkWindowAbsence error:", error);
    }
  }
  public async syncInactiveBins() {
    try {
      console.log("[CronService] Running inactive bins sync...");
      const bins = await prisma.bin.findMany({
        where: {
          status: "ACTIVE_BOUND",
        },
      });
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const twentyNineDaysAgo = new Date();
      twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);
      for (const bin of bins) {
        const lastLog = await prisma.setoranOtomatis.findFirst({
          where: { qrTempatSampahId: bin.id },
          orderBy: { createdAt: "desc" },
        });
        const refDate = lastLog?.createdAt || bin.updatedAt;
        if (refDate < thirtyDaysAgo) {
          await prisma.bin.update({
            where: { id: bin.id },
            data: { status: "INACTIVE" },
          });
          console.log(
            `[CronService] Bin ${bin.qrCode} set to INACTIVE due to 30 days of inactivity.`
          );
        } else if (refDate >= thirtyDaysAgo && refDate < twentyNineDaysAgo) {
          if (bin.userId) {
            await prisma.notification.create({
              data: {
                userId: bin.userId,
                title: "Peringatan Masa Aktif Tempat Sampah",
                message: `Tempat sampah Anda (QR: ${bin.qrCode}) akan kadaluarsa dalam 24 jam karena tidak ada aktivitas. Segera setor sampah untuk memperpanjang masa aktif.`,
              },
            });
            console.log(`[CronService] Sent 24h expiration warning for Bin ${bin.qrCode}.`);
          }
        }
      }
    } catch (e) {
      console.error("[CronService] syncInactiveBins error:", e);
    }
  }
    private isActivityFinished(schedule: any): boolean {
    if (!schedule || !schedule.time || !schedule.date) return false;
    if (schedule.time.includes("-")) {
      const parts = schedule.time.split("-");
      const endParts = parts[1].trim().replace(".", ":").split(":");
      if (endParts.length >= 2) {
        const scheduleDate = new Date(schedule.date);
        const endHour = parseInt(endParts[0], 10);
        const endMin = parseInt(endParts[1], 10);
        scheduleDate.setHours(endHour, endMin, 0, 0);
        // Return true if current time is past the end time of the schedule
        return new Date() > scheduleDate;
      }
    }
    return false;
  }
  public async checkMahasiswaGeofence() {
    try {
      console.log("[CronService] Running KKN geofence check...");
      // Load invalidation hours from Rule Engine config (replaces hardcoded 2 hours)
      const { configService } = await import("./configService.js");
      const ruleConfigs = await configService.getRuleEngineConfigs();
      const invalidationHours = (ruleConfigs as any).attendanceGeofenceInvalidationHours ?? 2;
      const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15;
      const cutoffTime = new Date(Date.now() - invalidationHours * 60 * 60 * 1000);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const activeAttendances = await prisma.activityAttendance.findMany({
        where: {
          status: "DALAM_RADIUS",
          attendedAt: { gte: todayStart },
          student: { role: { name: "MAHASISWA_KKN" } },
        },
        include: {
          schedule: true,
        },
      });
      const { calculateDistance } = await import("./kknAttendanceService.js");
            for (const att of activeAttendances) {
        if (!att.schedule) continue;
        // Skip geofence penalty if the activity has already ended
        if (this.isActivityFinished(att.schedule)) {
          console.log(`[CronService] Attendance ${att.id} skipped for geofence check because activity has already ended.`);
          continue;
        }
        const radius = att.schedule.radius ? Number(att.schedule.radius) : 100;
        const centerLat = att.schedule.latitude ? Number(att.schedule.latitude) : -6.8915;
        const centerLng = att.schedule.longitude ? Number(att.schedule.longitude) : 107.6107;
        const logs = await prisma.studentLocation.findMany({
          where: {
            studentId: att.studentId,
            recordedAt: { gte: cutoffTime },
          },
        });
        if (logs.length === 0) continue;
        let anyInside = false;
        for (const log of logs) {
          const dist = calculateDistance(
            Number(log.latitude),
            Number(log.longitude),
            centerLat,
            centerLng
          );
          if (dist <= (radius + bufferMeters)) {
            anyInside = true;
            break;
          }
        }
        if (!anyInside) {
          // Send warning notification to student before invalidating
          try {
            await prisma.notification.create({
              data: {
                userId: att.studentId,
                title: "⚠️ Peringatan Kehadiran KKN",
                message: `Anda tidak terdeteksi di area kegiatan '${att.schedule?.title || "KKN"}' selama ${invalidationHours} jam terakhir. Kehadiran Anda telah digagalkan. Silakan hubungi DPL jika ini adalah kesalahan.`,
                isRead: false,
              },
            });
          } catch (_notifErr) {
            console.error(`[CronService] Failed to send geofence warning notification for ${att.studentId}`);
          }
          await prisma.activityAttendance.update({
            where: { id: att.id },
            data: { status: "LEPAS_RADIUS" },
          });
          console.log(`[CronService] Attendance ${att.id} invalidated due to geofence rule (${invalidationHours}h without GPS in zone).`);
        }
      }
    } catch (error) {
      console.error("[CronService] checkMahasiswaGeofence error:", error);
    }
  }
}
export const cronService = new CronService();
