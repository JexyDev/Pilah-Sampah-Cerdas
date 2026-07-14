import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dashboardService = {
  getKpi: async () => {
    // 1. Total Pengguna
    const totalPengguna = await prisma.user.count();

    // 2. Tempat Sampah Aktif
    const tempatSampahAktif = await prisma.bin.count();

    // 3. Lokasi Terdaftar (Kelurahan)
    const lokasiTerdaftar = await prisma.kelurahan.count();

    // 4. Setoran Hari Ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const setoranHariIni = await prisma.wasteLog.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 5. Total Poin
    const pointHistories = await prisma.pointHistory.aggregate({
      _sum: {
        points: true,
      },
    });
    const totalPoin = pointHistories._sum.points || 0;

    // 6. Komposisi Sampah (Organik vs Anorganik)
    const wasteLogs = await prisma.wasteLog.findMany({
      include: { category: true }
    });
    
    let orgBerat = 0;
    let anorgBerat = 0;
    
    wasteLogs.forEach(w => {
      if (w.category.name === "ORGANIC") orgBerat += Number(w.weightKg);
      else anorgBerat += Number(w.weightKg);
    });
    
    const totalBerat = orgBerat + anorgBerat;
    const orgPct = totalBerat > 0 ? Math.round((orgBerat / totalBerat) * 100) : 0;
    const anorgPct = totalBerat > 0 ? Math.round((anorgBerat / totalBerat) * 100) : 0;

    return {
      totalPengguna: { value: totalPengguna, trend: "+2", trendLabel: "Bulan ini", trendUp: true },
      tempatSampahAktif: { value: tempatSampahAktif, trend: "Semua Online", trendLabel: "", trendUp: true },
      lokasiTerdaftar: { value: lokasiTerdaftar, trend: "+1", trendLabel: "Wilayah Baru", trendUp: true },
      setoranHariIni: { value: setoranHariIni, trend: "Stabil", trendLabel: "", trendUp: true },
      totalPoin: { value: totalPoin, trend: "+49", trendLabel: "Dari Minggu Lalu", trendUp: true },
      jadwalMingguIni: { value: 3, trend: "2 Selesai", trendLabel: "", trendUp: true },
      komposisiSampah: {
        organik: { berat: `${orgBerat.toFixed(1)} Kg`, persentase: `${orgPct}%` },
        anorganik: { berat: `${anorgBerat.toFixed(1)} Kg`, persentase: `${anorgPct}%` }
      }
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
