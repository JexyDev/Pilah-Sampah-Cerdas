export interface KelurahanDistribution {
  id: string;
  name: string;
  mhsCount: number;
  klpCount: number;
  dplCount: number;
  avgMhsPerDpl: number;
}

export interface KelurahanIssueSolution {
  id: string;
  kelurahan: string;
  masalahUtama: string;
  arahPenyelesaian: string;
}

export const KKN_DISTRIBUTION_DATA: KelurahanDistribution[] = [
  {
    id: "lebak-siliwangi",
    name: "Lebak Siliwangi",
    mhsCount: 38,
    klpCount: 3,
    dplCount: 3,
    avgMhsPerDpl: 12.67,
  },
  {
    id: "lebak-gede",
    name: "Lebak Gede",
    mhsCount: 62,
    klpCount: 4,
    dplCount: 4,
    avgMhsPerDpl: 15.50,
  },
  {
    id: "cipaganti",
    name: "Cipaganti",
    mhsCount: 66,
    klpCount: 4,
    dplCount: 4,
    avgMhsPerDpl: 16.50,
  },
  {
    id: "sekeloa",
    name: "Sekeloa",
    mhsCount: 88,
    klpCount: 6,
    dplCount: 6,
    avgMhsPerDpl: 14.67,
  },
  {
    id: "sadang-serang",
    name: "Sadang Serang",
    mhsCount: 143,
    klpCount: 11,
    dplCount: 11,
    avgMhsPerDpl: 13.00,
  },
  {
    id: "dago",
    name: "Dago",
    mhsCount: 163,
    klpCount: 10,
    dplCount: 10,
    avgMhsPerDpl: 16.30,
  },
];

export const KKN_DISTRIBUTION_TOTALS = {
  totalMhs: 560,
  totalKlp: 38,
  totalDpl: 38,
};

export const KELURAHAN_ISSUES_SOLUTIONS: KelurahanIssueSolution[] = [
  {
    id: "lebak-siliwangi",
    kelurahan: "Lebak Siliwangi",
    masalahUtama: "Sampah taman/RTH belum terkelola optimal",
    arahPenyelesaian: "Penguatan bank sampah komunitas kampus",
  },
  {
    id: "lebak-gede",
    kelurahan: "Lebak Gede",
    masalahUtama: "Volume tinggi dari permukiman & UMKM, titik liar",
    arahPenyelesaian: "Bank sampah RW & penjadwalan pengangkutan",
  },
  {
    id: "cipaganti",
    kelurahan: "Cipaganti",
    masalahUtama: "Sampah wisata mengganggu estetika heritage",
    arahPenyelesaian: "Kawasan heritage bebas sampah & penyediaan fasilitas tempat sampah estetik",
  },
  {
    id: "sadang-serang",
    kelurahan: "Sadang Serang",
    masalahUtama: "Sampah organik kuliner & minyak jelantah tinggi",
    arahPenyelesaian: "Bank sampah & pengumpulan minyak jelantah terjadwal",
  },
  {
    id: "sekeloa",
    kelurahan: "Sekeloa",
    masalahUtama: "Sampah plastik tinggi, kesadaran penghuni kos rendah",
    arahPenyelesaian: "Edukasi digital & kerja sama bank sampah digital",
  },
  {
    id: "dago",
    kelurahan: "Dago",
    masalahUtama: "Volume wisatawan tinggi, terutama akhir pekan",
    arahPenyelesaian: "Inisiasi TPS 3R kawasan wisata & gerakan kurang sampah",
  },
];
