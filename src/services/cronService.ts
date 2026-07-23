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

    console.log("[CronService] Escalation cron jobs started.");
  }

  private async triggerScheduleNotifications(window: "MORNING" | "EVENING") {
    try {
      console.log(`[CronService] Triggering schedule notifications for ${window}...`);
      // Get all bins > 70%
      const fullBins = await prisma.bin.findMany({
        where: {
          status: "ACTIVE_BOUND",
        }
      });
      const targetBins = fullBins.filter(b => {
        const vol = Number(b.currentVolumeLiter);
        const max = Number(b.maxCapacityLiter);
        return max > 0 && (vol / max) >= 0.7;
      });
      
      const petugas = await prisma.user.findMany({
        where: {
          role: {
            name: "PETUGAS_RESIDU"
          }
        }
      });

      // Simple notification
      for (const p of petugas) {
        await prisma.notification.create({
          data: {
            userId: p.id,
            title: `Jadwal Jemput ${window === "MORNING" ? "Pagi" : "Sore"}`,
            message: `Terdapat ${targetBins.length} tempat sampah yang perlu diangkut.`,
          }
        });
      }
    } catch (e) {
      console.error("[CronService] triggerScheduleNotifications error:", e);
    }
  }

  public async evaluateShiftPenalty(_shift: string) {
    // Stub for testing
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
          role: { name: "WARGA" }
        }
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
              }
            }
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
            _sum: { points: true }
          });
          const currentPoints = pointSumObj._sum.points || 0;

          if (currentPoints > 0) {
            const deduction = Math.min(penaltyAmount, currentPoints);
            await prisma.pointHistory.create({
              data: {
                userId: warga.id,
                points: -deduction,
                description: `Penalti absen buang sampah harian (hari ke-${absenceStreak})`,
                kategori: "REDUKSI_TONASE"
              }
            });
            console.log(`[CronService] Deducted ${deduction} points from citizen ${warga.name} due to ${absenceStreak} days of absence.`);
          }

          // Always send notification
          await prisma.notification.create({
            data: {
              userId: warga.id,
              title: "Penalti Absen Buang Sampah",
              message: `Anda belum menyetor sampah selama ${absenceStreak} hari berturut-turut. Poin Anda berkurang -${penaltyAmount} hari ini. Ayo segera setor dan pilah sampah Anda!`,
            }
          });
        }
      }
    } catch (error) {
      console.error("[CronService] evaluateDailyWargaPenalty error:", error);
    }
  }
}

export const cronService = new CronService();
