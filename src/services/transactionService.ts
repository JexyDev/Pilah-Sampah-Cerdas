import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const transactionService = {
  async getLeaderboard() {
    // Top 10 users by points
    // We group by userId and sum points
    const pointHistories = await prisma.pointHistory.groupBy({
      by: ['userId'],
      _sum: {
        points: true
      },
      orderBy: {
        _sum: {
          points: 'desc'
        }
      },
      take: 10
    });

    const leaderboard = [];
    let rank = 1;
    for (const ph of pointHistories) {
      if (!ph.userId) continue;
      
      const user = await prisma.user.findUnique({
        where: { id: ph.userId },
        include: {
          households: {
            include: {
              rtRw: true
            }
          }
        }
      });

      if (user) {
        let rtRwLabel = "RT/RW";
        if (user.households.length > 0) {
          rtRwLabel = user.households[0].rtRw.name;
        }

        leaderboard.push({
          rank: rank++,
          nama: user.name,
          rtRw: rtRwLabel,
          poin: ph._sum.points || 0,
          bg: rank <= 3 ? "bg-primary" : "bg-surface-container",
          color: rank <= 3 ? "text-white" : "text-on-surface"
        });
      }
    }

    return leaderboard;
  },

  async getDeposits() {
    const logs = await prisma.wasteLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        category: true,
        household: {
          include: {
            user: true
          }
        }
      }
    });

    return logs.map(log => ({
      id: log.id.substring(0, 8),
      tanggal: log.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
      warga: log.household.user.name,
      kategori: log.category.name,
      berat: Number(log.weightKg).toFixed(1),
      poin: Math.floor(Number(log.weightKg) * log.category.pointsPerKg)
    }));
  }
};
