import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== MEMPERBARUI DATA SURVEI BASELINE KELURAHAN CIPAGANTI (ID: 6) ===");

  // 1. Update SurveiKelurahan
  const kel = await prisma.surveiKelurahan.update({
    where: { kelurahanId: 6 },
    data: {
      jumlahKk: 2450,
      jumlahRumahTotal: 2450,
      tanggalSurvei: new Date("2026-07-16"),
      enumerator: "Ilyas Faturahman",
      titikKumpulMahasiswa: "Kantor Kelurahan Cipaganti / Posko KKN Kelompok 1",
      catatanData:
        "Data survei baseline pemilahan 13,67% terverifikasi bersama perwakilan RW 02 dan sentra maggot RT 07.",
    },
  });
  console.log("✓ SurveiKelurahan updated:", kel.namaKelurahan);

  // 2. Update SurveiPemilahanSampah
  const pem = await prisma.surveiPemilahanSampah.upsert({
    where: { kelurahanId: 6 },
    create: {
      kelurahanId: 6,
      persentasePemilahan: 0.1367,
      tingkatPemilahan: "Sebagian kecil",
      jumlahRumahMemilah: 335,
      totalJumlahRumahDiRw: 2450,
      catatan: "Estimasi survei awal 13,67% (rentang 10–20%) berbasis percontohan RW 02 dan RW 05",
    },
    update: {
      persentasePemilahan: 0.1367,
      tingkatPemilahan: "Sebagian kecil",
      jumlahRumahMemilah: 335,
      totalJumlahRumahDiRw: 2450,
      catatan: "Estimasi survei awal 13,67% (rentang 10–20%) berbasis percontohan RW 02 dan RW 05",
    },
  });
  console.log("✓ SurveiPemilahanSampah updated:", pem.persentasePemilahan, pem.tingkatPemilahan);

  // 3. Update SurveiVolumeSampah
  const vol = await prisma.surveiVolumeSampah.upsert({
    where: { kelurahanId: 6 },
    create: {
      kelurahanId: 6,
      organikKgPerHari: 200.0,
      anorganikKgPerHari: 80.0,
      residuKgPerHari: 40.0,
      totalVolumeKgPerHari: 1850.0,
      catatan:
        "Organik 200 kg/hari (terserap budidaya maggot RT 07), Anorganik 80 kg/hari (Bank Sampah RW 02 & Kelurahan). Total timbulan percontohan 1.850 kg/hari.",
    },
    update: {
      organikKgPerHari: 200.0,
      anorganikKgPerHari: 80.0,
      residuKgPerHari: 40.0,
      totalVolumeKgPerHari: 1850.0,
      catatan:
        "Organik 200 kg/hari (terserap budidaya maggot RT 07), Anorganik 80 kg/hari (Bank Sampah RW 02 & Kelurahan). Total timbulan percontohan 1.850 kg/hari.",
    },
  });
  console.log("✓ SurveiVolumeSampah updated:", {
    total: vol.totalVolumeKgPerHari,
    organik: vol.organikKgPerHari,
    anorganik: vol.anorganikKgPerHari,
    residu: vol.residuKgPerHari,
  });

  // 4. Update SurveiBankSampahPengolahan
  const bsp = await prisma.surveiBankSampahPengolahan.update({
    where: { kelurahanId: 6 },
    data: {
      bankSampahAktif: 2,
      jumlahUnitKomposter: "8",
      bioporiLoseda: true,
      buruanSae: true,
      aktivitasLainnyaKeterangan: "2 bank sampah aktif: Kelurahan dan RW 2; integrasi unit maggot RT 07",
    },
  });
  console.log("✓ SurveiBankSampahPengolahan updated:", bsp.bankSampahAktif, bsp.jumlahUnitKomposter);

  console.log("\nSemua data survei baseline Cipaganti berhasil diperbarui secara konsisten & realistis!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
