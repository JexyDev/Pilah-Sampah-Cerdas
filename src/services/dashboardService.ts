import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dashboardService = {
  getKpi: async () => {
    // 1. Total Warga Aktif
    const totalWarga = await prisma.user.count({
      where: {
        role: {
          name: "WARGA",
        },
      },
    });

    // 2. Sampah Terkumpul (Kg)
    const wasteLogs = await prisma.wasteLog.aggregate({
      _sum: {
        weightKg: true,
      },
    });
    const totalSampahKg = wasteLogs._sum.weightKg ? Number(wasteLogs._sum.weightKg) : 0;

    // 3. Rata-rata Akurasi AI (Simulated using % of SUCCESS)
    const totalAiLogs = await prisma.aiRequestLog.count();
    const successAiLogs = await prisma.aiRequestLog.count({
      where: { resultStatus: "SUCCESS" }
    });
    const averageAiAccuracy = totalAiLogs > 0 ? (successAiLogs / totalAiLogs) * 100 : 0;

    // 4. Peringatan Tong Penuh (volume > 90% of maxCapacity)
    // Prisma cannot directly compare two columns easily in a single count where without raw query if it's dynamic
    // But we can fetch all bins and filter or just use a raw query
    const bins = await prisma.bin.findMany({
      select: {
        currentVolumeLiter: true,
        maxCapacityLiter: true,
      }
    });

    const fullBinsCount = bins.filter(
      bin => (Number(bin.currentVolumeLiter) / Number(bin.maxCapacityLiter)) > 0.9
    ).length;

    return {
      totalWarga,
      totalSampahKg,
      averageAiAccuracy,
      alertTongPenuh: fullBinsCount,
    };
  },

  getRecentTransactions: async () => {
    const transactions = await prisma.wasteLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        household: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        category: {
          select: {
            name: true,
            pointsPerKg: true
          }
        }
      }
    });

    return transactions.map(trx => ({
      id: trx.id,
      nama: trx.household.user.name,
      waktu: trx.createdAt,
      tipe: trx.category.name,
      volume: `${Number(trx.volumeLiter).toFixed(1)}L`,
      poin: `+${Math.floor(Number(trx.weightKg) * trx.category.pointsPerKg)}`
    }));
  }
};
