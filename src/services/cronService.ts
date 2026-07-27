import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    console.log("[CronService] Escalation cron jobs started.");
  }

  private async triggerScheduleNotifications(window: "MORNING" | "EVENING") {
    try {
      console.log(`[CronService] Triggering schedule notifications for ${window}...`);
      // Get all bins > 70%
      const fullBins = await prisma.bin.findMany({
        where: {
          status: "ACTIVE_BOUND",
        },
      });
      const targetBins = fullBins.filter((b) => {
        const vol = Number(b.currentVolumeLiter);
        const max = Number(b.maxCapacityLiter);
        return max > 0 && vol / max >= 0.7;
      });

      const petugas = await prisma.user.findMany({
        where: {
          role: {
            name: "PETUGAS_RESIDU",
          },
        },
      });

      // Simple notification
      for (const p of petugas) {
        await prisma.notification.create({
          data: {
            userId: p.id,
            title: `Jadwal Jemput ${window === "MORNING" ? "Pagi" : "Sore"}`,
            message: `Terdapat ${targetBins.length} tempat sampah yang perlu diangkut.`,
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
        const count = await prisma.residuLog.count({
          where: {
            petugasId: petugas.userId,
          },
        });

        if (count === 0) {
          const penaltyPercent = 15; // standard penalty
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
      // Find bins that requested pickup (e.g., via DispatchTask) and are still PENDING
      const pendingTasks = await prisma.dispatchTask.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lte: new Date(Date.now() - 1000 * 60 * 60 * 2), // Older than 2 hours to be considered missed for the window
          },
        },
        include: {
          bin: {
            include: {
              rtRw: {
                include: {
                  kelurahan: true,
                },
              },
            },
          },
        },
      });

      for (const task of pendingTasks) {
        // Escalate hierarchy: RW -> Lurah -> Camat -> Admin DLH
        // 1. RW Notification
        await this.notifyHierarchy("RW", task.bin.rtRwId, task.bin.qrCode);

        // 2. Lurah Notification
        if (task.bin.rtRw?.kelurahanId) {
          await this.notifyHierarchy("LURAH", task.bin.rtRw.kelurahanId, task.bin.qrCode);
        }

        // 3. Camat Notification (removed since no kecamatan)

        // 4. Admin DLH Notification (global)
        await this.notifyHierarchy("ADMIN_DLH", "GLOBAL", task.bin.qrCode);

        // Mark task as escalated
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

  private async notifyHierarchy(role: string, areaId: any, qrCode: string) {
    // Find users with specific roles and area
    const users = await prisma.user.findMany({
      where: {
        role: role as any,
        // Depending on schema, area associations could be mapped here.
        // For simplicity, we just broadcast to users with this role in the area.
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

          const hasSubmittedOnDay = await prisma.wasteLog.findFirst({
            where: {
              household: { userId: warga.id },
              createdAt: {
                gte: startOfCheckDay,
                lte: endOfCheckDay,
              },
            },
          });

          if (!hasSubmittedOnDay) {
            absenceStreak++;
            dayOffset++;
            if (dayOffset > 30) break; // Limit check to 30 days
          } else {
            break;
          }
        }

        if (absenceStreak > 0) {
          const penaltyAmount = absenceStreak; // day 1 is -1, day 2 is -2, etc.

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

          // Always send notification
          await prisma.notification.create({
            data: {
              userId: warga.id,
              title: "Penalti Absen Buang Sampah",
              message: `Anda belum menyetor sampah selama ${absenceStreak} hari berturut-turut. Poin Anda berkurang -${penaltyAmount} hari ini. Ayo segera setor dan pilah sampah Anda!`,
            },
          });
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

      // Define window start/end hours
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
        // Check if citizens have active bins first (if no active bins, do not penalize them yet!)
        const activeBinsCount = await prisma.bin.count({
          where: {
            OR: [{ userId: warga.id }, { binOwnerships: { some: { userId: warga.id } } }],
            status: "ACTIVE_BOUND",
          },
        });

        if (activeBinsCount === 0) {
          continue; // Warga does not have active bins yet
        }

        // Check if warga submitted any waste log within this window today
        const hasSubmitted = await prisma.wasteLog.findFirst({
          where: {
            household: { userId: warga.id },
            createdAt: {
              gte: windowStart,
              lte: windowEnd,
            },
          },
        });

        if (!hasSubmitted) {
          // Check current points total to not drop below zero
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
                kategori: "REDUKSI_TONASE", // standard category
              },
            });
            console.log(
              `[CronService] Deducted ${deduction} points from citizen ${warga.name} for missing ${window} window.`
            );
          }

          // Create notification
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
}

export const cronService = new CronService();
