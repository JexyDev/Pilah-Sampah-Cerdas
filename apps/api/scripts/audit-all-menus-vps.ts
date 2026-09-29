import { Client } from "ssh2";
import dotenv from "dotenv";
dotenv.config();

const conn = new Client();

function execCommand(conn: Client, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      stream
        .on("close", () => resolve(output))
        .on("data", (data: Buffer) => {
          output += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          output += data.toString();
        });
    });
  });
}

async function main() {
  conn.on("ready", async () => {
    console.log("Connected to VPS. Running comprehensive multi-menu audit...");

    const vpsAuditScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=================================================");
  console.log("       AUDIT KOMPREHENSIF SELURUH MENU VPS       ");
  console.log("=================================================");

  // 1. KKN DOMAIN
  console.log("\\n--- [1] EKOSISTEM KKN ---");
  const allKelompok = await prisma.kelompokKkn.findMany({
    select: { id: true, name: true, kelurahan: true, dplNamaMentah: true }
  });
  const testKelompok = allKelompok.filter(k => k.name.toLowerCase().includes('test'));
  const realKelompok = allKelompok.filter(k => !k.name.toLowerCase().includes('test'));
  console.log("Total Kelompok in DB:", allKelompok.length, "| Kelompok Test:", testKelompok.map(k => k.name), "| Kelompok Real:", realKelompok.length);

  const totalMhs = await prisma.studentKkn.count();
  const realMhs = await prisma.studentKkn.count({
    where: {
      user: { isTestAccount: false, NOT: { name: { contains: "test", mode: "insensitive" } } },
      kelompok: { NOT: { name: { contains: "test", mode: "insensitive" } } }
    }
  });
  console.log("Total Mahasiswa in DB:", totalMhs, "| Mahasiswa Real:", realMhs);

  const allProker = await prisma.programKerjaKkn.findMany({
    select: { id: true, deskripsi: true, statusPelaksanaan: true, statusUsulan: true, status: true, kelompok: { select: { name: true } } }
  });
  const realProker = allProker.filter(p => !p.kelompok || !p.kelompok.name.toLowerCase().includes('test'));
  const realDisetujui = realProker.filter(p => p.statusUsulan === 'DISETUJUI' || p.status === 'DISETUJUI');
  console.log("Proker in DB:", allProker.length, "| Real Proker:", realProker.length, "| Disetujui:", realDisetujui.length, {
    selesai: realDisetujui.filter(p => p.statusPelaksanaan === 'SELESAI').length,
    proses: realDisetujui.filter(p => p.statusPelaksanaan === 'SEDANG_BERJALAN' || p.statusPelaksanaan === 'PROSES').length,
    belum: realDisetujui.filter(p => p.statusPelaksanaan === 'BELUM_MULAI' || p.statusPelaksanaan === 'BELUM').length
  });

  const totalLogbook = await prisma.logbookKkn.count();
  const realLogbook = await prisma.logbookKkn.count({
    where: {
      penulis: {
        isTestAccount: false,
        studentProfile: { kelompok: { NOT: { name: { contains: "test", mode: "insensitive" } } } }
      }
    }
  });
  const approvedLogbook = await prisma.logbookKkn.count({
    where: {
      statusApproval: "DISETUJUI_DPL",
      penulis: {
        isTestAccount: false,
        studentProfile: { kelompok: { NOT: { name: { contains: "test", mode: "insensitive" } } } }
      }
    }
  });
  console.log("Logbook in DB:", totalLogbook, "| Real Logbook:", realLogbook, "| Approved Logbook (Dosen):", approvedLogbook);

  const totalPresensi = await prisma.activityAttendance.count();
  const realPresensi = await prisma.activityAttendance.count({
    where: {
      status: { not: "DITOLAK" },
      student: {
        isTestAccount: false,
        studentProfile: { kelompok: { NOT: { name: { contains: "test", mode: "insensitive" } } } }
      }
    }
  });
  const realIzin = await prisma.studentLeaveRequest.count({
    where: {
      type: "IZIN",
      status: "APPROVED",
      student: {
        isTestAccount: false,
        studentProfile: { kelompok: { NOT: { name: { contains: "test", mode: "insensitive" } } } }
      }
    }
  });
  const realSakit = await prisma.studentLeaveRequest.count({
    where: {
      type: "SAKIT",
      status: "APPROVED",
      student: {
        isTestAccount: false,
        studentProfile: { kelompok: { NOT: { name: { contains: "test", mode: "insensitive" } } } }
      }
    }
  });
  console.log("Presensi Hadir:", realPresensi, "| Izin Disetujui:", realIzin, "| Sakit Disetujui:", realSakit);

  // 2. WASTE DOMAIN
  console.log("\\n--- [2] TATA KELOLA SAMPAH ---");
  const totalUsers = await prisma.user.count();
  const testUsers = await prisma.user.count({ where: { OR: [{ isTestAccount: true }, { name: { contains: "test", mode: "insensitive" } }] } });
  const rw99Users = await prisma.user.count({ where: { rw: { name: { contains: "99" } } } });
  const wargaAll = await prisma.user.count({ where: { role: { name: "WARGA" } } });
  const wargaClean = await prisma.user.count({
    where: {
      role: { name: "WARGA" },
      isTestAccount: false,
      NOT: [{ name: { contains: "test", mode: "insensitive" } }, { rw: { name: { contains: "99" } } }]
    }
  });
  console.log("Total Users:", totalUsers, "| Test Users:", testUsers, "| RW 99 Users:", rw99Users, "| Clean Warga:", wargaClean);

  const totalBins = await prisma.bin.count();
  const activeBoundCleanBins = await prisma.bin.count({
    where: {
      status: "ACTIVE_BOUND",
      rw: { name: { not: { contains: "99" } } }
    }
  });
  console.log("Total Bins:", totalBins, "| Active Bound Clean Bins:", activeBoundCleanBins);

  const totalFacilities = await prisma.facility.count();
  const cleanFacilities = await prisma.facility.count({
    where: {
      jenis: { not: "posko_kkn" },
      rw: { name: { not: { contains: "99" } } }
    }
  });
  console.log("Total Facilities:", totalFacilities, "| Clean Facilities (non-posko, non-rw99):", cleanFacilities);

  const sumAuto = await prisma.setoranOtomatis.aggregate({ _sum: { berat: true } });
  const sumManual = await prisma.setoranManual.aggregate({ _sum: { berat: true } });
  console.log("Total Berat Setoran Otomatis:", Number(sumAuto._sum.berat || 0).toFixed(2), "kg");
  console.log("Total Berat Setoran Manual (Residu/Petugas):", Number(sumManual._sum.berat || 0).toFixed(2), "kg");

  // 3. SERVICE CROSS-CHECK
  console.log("\\n--- [3] SERVICE CROSS-CHECK (API ENDPOINTS) ---");
  try {
    const { dashboardService } = await import('./dist/services/dashboardService.js');
    const { systemAnalysisService } = await import('./dist/services/systemAnalysisService.js');
    const { kknExecutiveService } = await import('./dist/services/kknExecutiveService.js');

    const kpiDashboard = await dashboardService.getKpi();
    const wasteAnalysis = await systemAnalysisService.getWasteGovernanceAnalysis();
    const kknAnalysis = await systemAnalysisService.getKknAnalysis();
    const kknDashboard = await kknExecutiveService.getExecutiveDashboard();

    console.log(">>> KOMPARASI TATA KELOLA SAMPAH:");
    console.log("  [Total Warga] Dashboard:", kpiDashboard.totalWarga, "vs Analisis Sistem:", wasteAnalysis.pilar1.totalWarga);
    console.log("  [Tempat Sampah Aktif] Dashboard:", kpiDashboard.tempatSampahAktif, "vs Analisis Sistem:", wasteAnalysis.pilar2.kritisitasTempatSampah.total);
    console.log("  [Total Sampah Masuk Kg] Dashboard:", kpiDashboard.totalSampahKg, "vs Analisis Sistem:", wasteAnalysis.pilar3.totalSampahMasukKg);
    console.log("  [Organik Kg] Dashboard:", kpiDashboard.komposisiSampah?.organikKg, "vs Analisis Sistem:", wasteAnalysis.pilar3.organikKg);
    console.log("  [Anorganik Kg] Dashboard:", kpiDashboard.komposisiSampah?.anorganikKg, "vs Analisis Sistem:", wasteAnalysis.pilar3.anorganikKg);
    console.log("  [Residu Kg] Dashboard:", kpiDashboard.komposisiSampah?.residuKg);

    console.log("\\n>>> KOMPARASI KKN:");
    console.log("  [Total Mahasiswa] Dashboard KKN:", kknDashboard.totalMahasiswa, "vs Analisis Sistem:", kknAnalysis.pilar4.totalStudents);
    console.log("  [Total Posko/Kelompok] Dashboard KKN:", kknDashboard.totalKelompok, "vs Analisis Sistem:", kknAnalysis.pilar5.sebaranPosko.length);
    console.log("  [Proker Disetujui] Dashboard KKN:", kknDashboard.prokerStatistik?.disetujui, "vs Analisis Sistem:", kknAnalysis.pilar3.totalProker);
    console.log("  [Proker Selesai] Dashboard KKN:", kknDashboard.prokerStatistik?.selesai, "vs Analisis Sistem:", kknAnalysis.pilar3.breakdown.selesai);
    console.log("  [Proker Berjalan] Dashboard KKN:", kknDashboard.prokerStatistik?.berjalan, "vs Analisis Sistem:", kknAnalysis.pilar3.breakdown.proses);
    console.log("  [Proker Belum] Dashboard KKN:", kknDashboard.prokerStatistik?.belum, "vs Analisis Sistem:", kknAnalysis.pilar3.breakdown.belum);
    console.log("  [Presensi Hadir] Dashboard KKN:", kknDashboard.presensiStatistik?.hadir, "vs Analisis Sistem:", kknAnalysis.pilar2.hadirCount);
    console.log("  [Presensi Izin] Dashboard KKN:", kknDashboard.presensiStatistik?.izin, "vs Analisis Sistem:", kknAnalysis.pilar2.izinCount);
    console.log("  [Presensi Sakit] Dashboard KKN:", kknDashboard.presensiStatistik?.sakit, "vs Analisis Sistem:", kknAnalysis.pilar2.sakitCount);
    console.log("  [Logbook Total] Dashboard KKN:", kknDashboard.logbookStatistik?.total, "vs Analisis Sistem:", kknAnalysis.pilar1.totalLogbook);
    console.log("  [Logbook Disetujui] Dashboard KKN:", kknDashboard.logbookStatistik?.approved, "vs Analisis Sistem:", kknAnalysis.pilar1.approvedLogbook);

    console.log("\\n>>> TOP 5 LEADERBOARD POSKO KKN:");
    console.log("  Dashboard KKN Top 5:", kknDashboard.leaderboardPosko?.slice(0, 5).map(p => ({ nama: p.kelompokName, skor: p.skorKinerja })));
    console.log("  Analisis Sistem Top 5:", kknAnalysis.pilar5.top5Kelompok?.slice(0, 5).map(p => ({ nama: p.nama, skor: p.skorKinerja })));

  } catch (err) {
    console.error("Error executing service cross-check:", err);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

    const b64 = Buffer.from(vpsAuditScript).toString("base64");
    await execCommand(conn, `echo "${b64}" | base64 -d > /home/maker/Pilah-Sampah-Cerdas-new/apps/api/audit_runner.cjs`);

    const result = await execCommand(conn, `cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api && node audit_runner.cjs`);
    console.log(result);

    await execCommand(conn, `rm -f /home/maker/Pilah-Sampah-Cerdas-new/apps/api/audit_runner.cjs`);

    conn.end();
  }).connect({
    host: "157.10.252.252",
    port: 22,
    username: "maker",
    password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "Makerdotindo2026",
    readyTimeout: 30000,
  });
}

main().catch(console.error);
