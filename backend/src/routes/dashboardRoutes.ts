import { Router } from "express";

const router = Router();

router.get("/stats", (req, res) => {
  // Dummy data matching the dashboard UI
  const stats = {
    totalPengguna: {
      value: "1.248",
      trend: "12.4%",
      trendLabel: "dari bulan lalu",
      trendUp: true
    },
    tempatSampahAktif: {
      value: "324",
      trend: "8.7%",
      trendLabel: "dari bulan lalu",
      trendUp: true
    },
    lokasiTerdaftar: {
      value: "56",
      trend: "5.3%",
      trendLabel: "dari bulan lalu",
      trendUp: true
    },
    setoranHariIni: {
      value: "1.236 kg",
      trend: "15.6%",
      trendLabel: "dari kemarin",
      trendUp: true
    },
    totalPoin: {
      value: "124.560",
      trend: "10.2%",
      trendLabel: "dari bulan lalu",
      trendUp: true
    },
    jadwalMingguIni: {
      value: "8",
      trend: "Kegiatan terjadwal",
      trendLabel: "",
      trendUp: false
    },
    komposisiSampah: {
      organik: {
        berat: "2.894 kg",
        persentase: "62%"
      },
      anorganik: {
        berat: "1.764 kg",
        persentase: "38%"
      }
    }
  };

  res.status(200).json({
    status: "success",
    data: stats
  });
});

export default router;
